import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { DependencyTracker } from '../src/dependency-tracker.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('🌳 Babel AST Dependency Tracking', () => {
  const testDir = 'test-deps';
  const tracker = new DependencyTracker();
  
  // Create test files
  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
    
    // Main file with various import types
    writeFileSync(join(testDir, 'main.ts'), `
import { Timeline } from './timeline';
import * as utils from './utils';
import type { Config } from './types';
const dynamic = await import('./dynamic');
const common = require('./common');

export function processVideo() {
  return new Timeline();
}
    `);
    
    // Timeline file
    writeFileSync(join(testDir, 'timeline.ts'), `
import { BaseClass } from './base';
export class Timeline extends BaseClass {}
    `);
    
    // Utils file
    writeFileSync(join(testDir, 'utils.ts'), `
export const helper = () => 'help';
    `);
    
    // Types file
    writeFileSync(join(testDir, 'types.ts'), `
export interface Config {
  setting: string;
}
    `);
    
    // Dynamic file
    writeFileSync(join(testDir, 'dynamic.ts'), `
export default { loaded: true };
    `);
    
    // Common file
    writeFileSync(join(testDir, 'common.js'), `
module.exports = { isCommon: true };
    `);
    
    // Base file
    writeFileSync(join(testDir, 'base.ts'), `
export class BaseClass {}
    `);
  });
  
  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });
  
  test('should parse file and extract imports using Babel', () => {
    const info = tracker.parseFile(join(testDir, 'main.ts'));
    
    expect(info.imports).toContain('./timeline');
    expect(info.imports).toContain('./utils');
    expect(info.imports).toContain('./types');
    expect(info.imports).toContain('./dynamic');
    expect(info.imports).toContain('./common');
    expect(info.imports.length).toBe(5);
  });
  
  test('should build complete dependency graph', () => {
    const graph = tracker.buildDependencyGraph(join(testDir, 'main.ts'));
    
    // Should include main file and its dependencies
    const files = Object.keys(graph);
    expect(files.some(f => f.includes('main.ts'))).toBe(true);
    expect(files.some(f => f.includes('timeline.ts'))).toBe(true);
    expect(files.some(f => f.includes('utils.ts'))).toBe(true);
    expect(files.some(f => f.includes('types.ts'))).toBe(true);
    expect(files.some(f => f.includes('dynamic.ts'))).toBe(true);
    expect(files.some(f => f.includes('common.js'))).toBe(true);
    expect(files.some(f => f.includes('base.ts'))).toBe(true); // Transitive dependency
  });
  
  test('should detect changes in files', async () => {
    const graph1 = tracker.buildDependencyGraph(join(testDir, 'main.ts'));
    
    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Modify a file
    writeFileSync(join(testDir, 'utils.ts'), `
export const helper = () => 'modified';
export const newFunction = () => 'new';
    `);
    
    const graph2 = tracker.buildDependencyGraph(join(testDir, 'main.ts'));
    
    expect(tracker.hasChanges(graph1, graph2)).toBe(true);
  });
  
  test('should handle TypeScript/JSX syntax', () => {
    writeFileSync(join(testDir, 'component.tsx'), `
import React from 'react';
import { useState } from 'react';
import styles from './styles.module.css';

const Component: React.FC = () => {
  const [state, setState] = useState(0);
  return <div className={styles.container}>Hello</div>;
};

export default Component;
    `);
    
    const info = tracker.parseFile(join(testDir, 'component.tsx'));
    
    expect(info.imports).toContain('react');
    expect(info.imports).toContain('./styles.module.css');
    expect(info.imports.length).toBe(2); // Should dedupe react imports
  });
  
  test('should handle parsing errors gracefully', () => {
    writeFileSync(join(testDir, 'invalid.js'), `
import { broken syntax here
    `);
    
    const info = tracker.parseFile(join(testDir, 'invalid.js'));
    
    expect(info.imports).toEqual([]); // Should return empty imports on parse error
    expect(info.path).toContain('invalid.js');
  });
});