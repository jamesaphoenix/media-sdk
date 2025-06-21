/**
 * AST-based dependency tracker using Babel parser
 * Tracks file dependencies to intelligently invalidate cassettes
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { readFileSync, statSync, existsSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { createHash } from 'crypto';

export interface DependencyInfo {
  path: string;
  imports: string[];
  lastModified: number;
  hash: string;
}

export interface DependencyGraph {
  [filePath: string]: DependencyInfo;
}

export class DependencyTracker {
  public cache: Map<string, DependencyInfo> = new Map();
  
  /**
   * Track a single file and return its dependency info
   */
  trackFile(filePath: string): DependencyInfo {
    return this.parseFile(filePath);
  }

  /**
   * Parse a file and extract its dependencies using Babel
   */
  parseFile(filePath: string): DependencyInfo {
    // Check cache first
    const cached = this.cache.get(filePath);
    const stats = statSync(filePath);
    
    if (cached && cached.lastModified === stats.mtimeMs) {
      return cached;
    }
    
    const content = readFileSync(filePath, 'utf-8');
    const hash = createHash('sha256').update(content).digest('hex');
    const imports: Set<string> = new Set();
    
    try {
      // Parse with Babel
      const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          ['decorators', { decoratorsBeforeExport: true }],
          'dynamicImport',
          'importMeta'
        ]
      });
      
      // Traverse AST to find imports
      traverse(ast, {
        // ES6 imports: import x from 'y'
        ImportDeclaration(path) {
          imports.add(path.node.source.value);
        },
        
        // CommonJS requires: require('x')
        CallExpression(path) {
          if (
            t.isIdentifier(path.node.callee, { name: 'require' }) &&
            path.node.arguments.length > 0 &&
            t.isStringLiteral(path.node.arguments[0])
          ) {
            imports.add(path.node.arguments[0].value);
          }
        },
        
        // Dynamic imports: import('x')
        Import(path) {
          const parent = path.parent;
          if (t.isCallExpression(parent) && t.isStringLiteral(parent.arguments[0])) {
            imports.add(parent.arguments[0].value);
          }
        }
      });
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error);
    }
    
    const info: DependencyInfo = {
      path: filePath,
      imports: Array.from(imports),
      lastModified: stats.mtimeMs,
      hash
    };
    
    this.cache.set(filePath, info);
    return info;
  }
  
  /**
   * Resolve import path to actual file path
   */
  private resolveImport(importPath: string, fromFile: string): string | null {
    try {
      const basePath = dirname(fromFile);
      
      // Try direct resolution
      let resolved = resolve(basePath, importPath);
      
      // Check with common extensions
      const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'];
      for (const ext of extensions) {
        const fullPath = resolved + ext;
        if (existsSync(fullPath)) {
          return fullPath;
        }
      }
      
      // Check for index files
      const indexPaths = [
        resolve(resolved, 'index.ts'),
        resolve(resolved, 'index.tsx'),
        resolve(resolved, 'index.js'),
        resolve(resolved, 'index.jsx')
      ];
      
      for (const indexPath of indexPaths) {
        if (existsSync(indexPath)) {
          return indexPath;
        }
      }
      
      // Node modules - just track the package name
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        return `node_modules/${importPath}`;
      }
      
      return null;
    } catch {
      return null;
    }
  }
  
  /**
   * Build complete dependency graph for a file
   */
  buildDependencyGraph(entryFile: string, visited = new Set<string>()): DependencyGraph {
    const graph: DependencyGraph = {};
    
    const queue = [resolve(entryFile)];
    
    while (queue.length > 0) {
      const currentFile = queue.shift()!;
      
      if (visited.has(currentFile) || !existsSync(currentFile)) {
        continue;
      }
      
      visited.add(currentFile);
      
      const info = this.parseFile(currentFile);
      graph[currentFile] = info;
      
      // Resolve and queue dependencies
      for (const importPath of info.imports) {
        const resolved = this.resolveImport(importPath, currentFile);
        if (resolved && !resolved.includes('node_modules') && !visited.has(resolved)) {
          queue.push(resolved);
        }
      }
    }
    
    return graph;
  }
  
  /**
   * Check if any dependencies have changed
   */
  hasChanges(graph1: DependencyGraph, graph2: DependencyGraph): boolean {
    const files1 = Object.keys(graph1);
    const files2 = Object.keys(graph2);
    
    // Different number of files
    if (files1.length !== files2.length) {
      return true;
    }
    
    // Check each file
    for (const file of files1) {
      if (!graph2[file]) {
        return true; // File removed
      }
      
      const info1 = graph1[file];
      const info2 = graph2[file];
      
      // Check modification time or hash
      if (info1.lastModified !== info2.lastModified || info1.hash !== info2.hash) {
        return true;
      }
      
      // Check if imports changed
      if (JSON.stringify(info1.imports.sort()) !== JSON.stringify(info2.imports.sort())) {
        return true;
      }
    }
    
    return false;
  }
}

/**
 * Cassette-specific dependency tracker
 */
export class CassetteDependencyTracker {
  private tracker = new DependencyTracker();
  private cassetteGraphs = new Map<string, DependencyGraph>();
  
  /**
   * Track dependencies for a cassette
   */
  trackCassette(cassetteName: string, files: string[]): void {
    const graph: DependencyGraph = {};
    
    for (const file of files) {
      const fileGraph = this.tracker.buildDependencyGraph(file);
      Object.assign(graph, fileGraph);
    }
    
    this.cassetteGraphs.set(cassetteName, graph);
  }
  
  /**
   * Check if cassette should be invalidated due to dependency changes
   */
  shouldInvalidate(cassetteName: string, files: string[]): boolean {
    const oldGraph = this.cassetteGraphs.get(cassetteName);
    if (!oldGraph) {
      return false; // No previous graph, cassette is new
    }
    
    const newGraph: DependencyGraph = {};
    for (const file of files) {
      const fileGraph = this.tracker.buildDependencyGraph(file);
      Object.assign(newGraph, fileGraph);
    }
    
    return this.tracker.hasChanges(oldGraph, newGraph);
  }
  
  /**
   * Get dependency info for debugging
   */
  getCassetteDependencies(cassetteName: string): DependencyGraph | undefined {
    return this.cassetteGraphs.get(cassetteName);
  }
  
  /**
   * Clear cached data
   */
  clear(): void {
    this.cassetteGraphs.clear();
  }

  /**
   * Register a cassette with its tracked files
   */
  registerCassette(cassetteName: string, files: string[]): void {
    this.trackCassette(cassetteName, files);
  }

  /**
   * Check if cassette should be invalidated (alias for shouldInvalidate)
   */
  shouldInvalidateCassette(cassetteName: string): boolean {
    const graph = this.cassetteGraphs.get(cassetteName);
    if (!graph) return false;
    
    // Re-check all files in the cassette for changes
    const files = Object.keys(graph);
    return this.shouldInvalidate(cassetteName, files);
  }

  /**
   * Get statistics about dependencies
   */
  getStats(): { cassettes: number; totalFiles: number; cacheSize: number } {
    let totalFiles = 0;
    for (const graph of this.cassetteGraphs.values()) {
      totalFiles += Object.keys(graph).length;
    }
    
    return {
      cassettes: this.cassetteGraphs.size,
      totalFiles,
      cacheSize: this.tracker.cache.size
    };
  }
}