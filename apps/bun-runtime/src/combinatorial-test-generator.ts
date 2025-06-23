/**
 * Combinatorial Test Generator
 * Uses AST parsing and combinatorics to find untested API combinations
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

interface APIMethod {
  className: string;
  methodName: string;
  parameters: string[];
  isStatic: boolean;
  isChainable: boolean;
  category: 'video' | 'audio' | 'text' | 'image' | 'effect' | 'transform' | 'utility';
}

interface APICombination {
  apis: APIMethod[];
  complexity: number;
  category: string;
  testName: string;
  priority: 'low' | 'medium' | 'high';
}

interface TestCoverage {
  testedCombinations: Set<string>;
  testedAPIs: Set<string>;
  testPatterns: Map<string, number>;
}

export class CombinatorialTestGenerator {
  private apis: Map<string, APIMethod> = new Map();
  private testCoverage: TestCoverage = {
    testedCombinations: new Set(),
    testedAPIs: new Set(),
    testPatterns: new Map()
  };

  /**
   * Analyze SDK and generate test combinations
   */
  async generateTestCombinations(): Promise<APICombination[]> {
    console.log('🔍 Parsing SDK source files...');
    await this.parseSDKFiles();
    
    console.log('📊 Analyzing existing test coverage...');
    await this.analyzeTestCoverage();
    
    console.log('🧮 Generating combinations...');
    const combinations = this.generateCombinations();
    
    console.log('🎯 Filtering untested combinations...');
    const untestedCombinations = this.filterUntestedCombinations(combinations);
    
    console.log('📈 Prioritizing combinations...');
    return this.prioritizeCombinations(untestedCombinations);
  }

  /**
   * Parse SDK files using AST
   */
  private async parseSDKFiles(): Promise<void> {
    const files = await glob('packages/media-sdk/src/**/*.ts', {
      ignore: ['**/*.test.ts', '**/*.d.ts']
    });

    for (const file of files) {
      await this.parseFile(file);
    }

    console.log(`✅ Found ${this.apis.size} API methods`);
  }

  /**
   * Parse a single file and extract API methods
   */
  private async parseFile(filePath: string): Promise<void> {
    const content = readFileSync(filePath, 'utf-8');
    
    try {
      const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'decorators-legacy']
      });

      traverse(ast, {
        ClassDeclaration: (path) => {
          const className = path.node.id?.name;
          if (!className) return;

          // Check if class is exported
          const isExported = path.parent.type === 'ExportNamedDeclaration' ||
                           path.parent.type === 'ExportDefaultDeclaration';
          
          if (!isExported) return;

          // Extract methods
          path.node.body.body.forEach(member => {
            if (t.isClassMethod(member) && member.accessibility === 'public') {
              const methodName = t.isIdentifier(member.key) ? member.key.name : '';
              if (!methodName || methodName.startsWith('_')) return;

              const isStatic = member.static || false;
              const parameters = member.params.map((param, idx) => {
                if (t.isIdentifier(param)) {
                  return param.name;
                }
                return `param${idx}`;
              });

              // Determine if method is chainable (returns this or Timeline)
              const isChainable = this.isMethodChainable(member, className);
              
              // Categorize method
              const category = this.categorizeMethod(methodName, className);

              const api: APIMethod = {
                className,
                methodName,
                parameters,
                isStatic,
                isChainable,
                category
              };

              this.apis.set(`${className}.${methodName}`, api);
            }
          });
        },

        // Also capture standalone exported functions
        ExportNamedDeclaration: (path) => {
          if (t.isFunctionDeclaration(path.node.declaration)) {
            const funcName = path.node.declaration.id?.name;
            if (funcName) {
              const parameters = path.node.declaration.params.map((param, idx) => {
                if (t.isIdentifier(param)) {
                  return param.name;
                }
                return `param${idx}`;
              });

              const api: APIMethod = {
                className: 'global',
                methodName: funcName,
                parameters,
                isStatic: true,
                isChainable: false,
                category: this.categorizeMethod(funcName, 'global')
              };

              this.apis.set(`global.${funcName}`, api);
            }
          }
        }
      });
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
    }
  }

  /**
   * Check if method returns this or Timeline type
   */
  private isMethodChainable(method: t.ClassMethod, className: string): boolean {
    // Simple heuristic: methods that likely return 'this' or Timeline
    const chainablePatterns = [
      'add', 'set', 'with', 'apply', 'pipe', 'transform',
      'fade', 'scale', 'crop', 'trim', 'filter'
    ];
    
    const methodName = t.isIdentifier(method.key) ? method.key.name : '';
    return chainablePatterns.some(pattern => methodName.toLowerCase().includes(pattern));
  }

  /**
   * Categorize method based on name and class
   */
  private categorizeMethod(methodName: string, className: string): APIMethod['category'] {
    const method = methodName.toLowerCase();
    const cls = className.toLowerCase();

    if (cls.includes('video') || method.includes('video')) return 'video';
    if (cls.includes('audio') || method.includes('audio')) return 'audio';
    if (cls.includes('text') || method.includes('text') || method.includes('caption')) return 'text';
    if (cls.includes('image') || method.includes('image')) return 'image';
    if (method.includes('effect') || method.includes('filter') || method.includes('fade')) return 'effect';
    if (method.includes('transform') || method.includes('scale') || method.includes('crop')) return 'transform';
    
    return 'utility';
  }

  /**
   * Analyze existing test coverage
   */
  private async analyzeTestCoverage(): Promise<void> {
    const testFiles = await glob('apps/bun-runtime/test/**/*.test.ts');

    for (const file of testFiles) {
      await this.parseTestFile(file);
    }

    console.log(`✅ Found ${this.testCoverage.testedAPIs.size} tested APIs`);
    console.log(`✅ Found ${this.testCoverage.testedCombinations.size} tested combinations`);
  }

  /**
   * Parse test file to extract tested APIs
   */
  private async parseTestFile(filePath: string): Promise<void> {
    const content = readFileSync(filePath, 'utf-8');
    
    try {
      const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const currentTest: string[] = [];

      traverse(ast, {
        CallExpression: (path) => {
          // Track test boundaries
          if (t.isIdentifier(path.node.callee) && 
              ['test', 'it', 'describe'].includes(path.node.callee.name)) {
            // New test, reset tracking
            if (currentTest.length > 1) {
              this.testCoverage.testedCombinations.add(currentTest.join(' -> '));
            }
            currentTest.length = 0;
          }

          // Track API calls
          if (t.isMemberExpression(path.node.callee)) {
            const object = path.node.callee.object;
            const property = path.node.callee.property;
            
            if (t.isIdentifier(object) && t.isIdentifier(property)) {
              const apiCall = `${object.name}.${property.name}`;
              
              // Check if this matches our known APIs
              for (const [apiKey, api] of this.apis) {
                if (apiKey.includes(property.name)) {
                  this.testCoverage.testedAPIs.add(apiKey);
                  currentTest.push(apiKey);
                  
                  // Track patterns
                  const pattern = `${api.category}:${api.methodName}`;
                  this.testCoverage.testPatterns.set(
                    pattern,
                    (this.testCoverage.testPatterns.get(pattern) || 0) + 1
                  );
                }
              }
            }
          }
        }
      });

      // Don't forget the last test
      if (currentTest.length > 1) {
        this.testCoverage.testedCombinations.add(currentTest.join(' -> '));
      }
    } catch (error) {
      console.error(`Error parsing test ${filePath}:`, error);
    }
  }

  /**
   * Generate API combinations using combinatorics
   */
  private generateCombinations(): APICombination[] {
    const combinations: APICombination[] = [];
    const apiList = Array.from(this.apis.values());
    
    // Strategy 1: Chain compatible APIs (chainable methods)
    const chainableAPIs = apiList.filter(api => api.isChainable);
    this.generateChainCombinations(chainableAPIs, combinations);
    
    // Strategy 2: Category-based combinations (video + audio + text)
    this.generateCategoryCombinations(apiList, combinations);
    
    // Strategy 3: Effect stacking (multiple effects/transforms)
    this.generateEffectCombinations(apiList, combinations);
    
    // Strategy 4: Platform-specific combinations
    this.generatePlatformCombinations(apiList, combinations);
    
    // Strategy 5: Edge case combinations
    this.generateEdgeCaseCombinations(apiList, combinations);

    console.log(`✅ Generated ${combinations.length} total combinations`);
    return combinations;
  }

  /**
   * Generate chainable API combinations
   */
  private generateChainCombinations(
    chainableAPIs: APIMethod[],
    combinations: APICombination[]
  ): void {
    // Generate chains of 2-5 methods
    for (let length = 2; length <= 5; length++) {
      this.generateCombinationsOfLength(chainableAPIs, length).forEach(combo => {
        combinations.push({
          apis: combo,
          complexity: length,
          category: 'chain',
          testName: `Chain of ${length} operations: ${combo.map(a => a.methodName).join(' -> ')}`,
          priority: length >= 4 ? 'high' : 'medium'
        });
      });
    }
  }

  /**
   * Generate combinations based on categories
   */
  private generateCategoryCombinations(
    apiList: APIMethod[],
    combinations: APICombination[]
  ): void {
    const categories = ['video', 'audio', 'text', 'image', 'effect'];
    
    // Generate combinations with one API from each category
    for (let i = 0; i < categories.length - 1; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const cat1APIs = apiList.filter(api => api.category === categories[i]);
        const cat2APIs = apiList.filter(api => api.category === categories[j]);
        
        // Take top 3 from each category
        cat1APIs.slice(0, 3).forEach(api1 => {
          cat2APIs.slice(0, 3).forEach(api2 => {
            combinations.push({
              apis: [api1, api2],
              complexity: 2,
              category: 'multi-media',
              testName: `${categories[i]} + ${categories[j]}: ${api1.methodName} with ${api2.methodName}`,
              priority: 'medium'
            });
          });
        });
      }
    }
  }

  /**
   * Generate effect stacking combinations
   */
  private generateEffectCombinations(
    apiList: APIMethod[],
    combinations: APICombination[]
  ): void {
    const effects = apiList.filter(api => 
      api.category === 'effect' || api.category === 'transform'
    );
    
    // Stack 2-4 effects
    for (let length = 2; length <= 4; length++) {
      this.generateCombinationsOfLength(effects, length).forEach(combo => {
        combinations.push({
          apis: combo,
          complexity: length * 1.5, // Effects are more complex
          category: 'effect-stack',
          testName: `Effect stack: ${combo.map(a => a.methodName).join(' + ')}`,
          priority: 'high'
        });
      });
    }
  }

  /**
   * Generate platform-specific combinations
   */
  private generatePlatformCombinations(
    apiList: APIMethod[],
    combinations: APICombination[]
  ): void {
    const platforms = ['tiktok', 'youtube', 'instagram'];
    const platformRelated = apiList.filter(api => 
      platforms.some(p => api.methodName.toLowerCase().includes(p)) ||
      api.methodName.includes('AspectRatio') ||
      api.methodName.includes('Duration')
    );
    
    const mediaAPIs = apiList.filter(api => 
      ['video', 'audio', 'text'].includes(api.category)
    );
    
    platformRelated.forEach(platformAPI => {
      mediaAPIs.slice(0, 5).forEach(mediaAPI => {
        combinations.push({
          apis: [platformAPI, mediaAPI],
          complexity: 3,
          category: 'platform-specific',
          testName: `Platform optimization: ${platformAPI.methodName} with ${mediaAPI.methodName}`,
          priority: 'high'
        });
      });
    });
  }

  /**
   * Generate edge case combinations
   */
  private generateEdgeCaseCombinations(
    apiList: APIMethod[],
    combinations: APICombination[]
  ): void {
    // Find APIs that might conflict or create edge cases
    const timingAPIs = apiList.filter(api => 
      api.methodName.includes('Duration') ||
      api.methodName.includes('Time') ||
      api.methodName.includes('Delay')
    );
    
    const positionAPIs = apiList.filter(api =>
      api.methodName.includes('Position') ||
      api.methodName.includes('Scale') ||
      api.methodName.includes('Crop')
    );
    
    // Timing conflicts
    timingAPIs.forEach(api1 => {
      timingAPIs.forEach(api2 => {
        if (api1 !== api2) {
          combinations.push({
            apis: [api1, api2],
            complexity: 4,
            category: 'edge-case',
            testName: `Timing edge case: ${api1.methodName} with ${api2.methodName}`,
            priority: 'high'
          });
        }
      });
    });
    
    // Positioning conflicts
    positionAPIs.forEach(api1 => {
      positionAPIs.forEach(api2 => {
        if (api1 !== api2) {
          combinations.push({
            apis: [api1, api2],
            complexity: 3,
            category: 'edge-case',
            testName: `Position conflict: ${api1.methodName} with ${api2.methodName}`,
            priority: 'medium'
          });
        }
      });
    });
  }

  /**
   * Generate combinations of specific length
   */
  private generateCombinationsOfLength(
    items: APIMethod[],
    length: number
  ): APIMethod[][] {
    if (length === 1) return items.map(item => [item]);
    
    const results: APIMethod[][] = [];
    
    for (let i = 0; i < items.length - length + 1; i++) {
      const head = items[i];
      const tailCombos = this.generateCombinationsOfLength(
        items.slice(i + 1),
        length - 1
      );
      
      tailCombos.forEach(combo => {
        results.push([head, ...combo]);
      });
    }
    
    return results;
  }

  /**
   * Filter out already tested combinations
   */
  private filterUntestedCombinations(
    combinations: APICombination[]
  ): APICombination[] {
    return combinations.filter(combo => {
      const comboKey = combo.apis.map(api => 
        `${api.className}.${api.methodName}`
      ).join(' -> ');
      
      // Check if exact combination is tested
      if (this.testCoverage.testedCombinations.has(comboKey)) {
        return false;
      }
      
      // Check if all individual APIs are heavily tested
      const allAPIsWellTested = combo.apis.every(api => {
        const apiKey = `${api.className}.${api.methodName}`;
        const pattern = `${api.category}:${api.methodName}`;
        const testCount = this.testCoverage.testPatterns.get(pattern) || 0;
        return testCount > 5; // Skip if API is tested more than 5 times
      });
      
      if (allAPIsWellTested && combo.complexity < 3) {
        return false; // Skip simple combinations of well-tested APIs
      }
      
      return true;
    });
  }

  /**
   * Prioritize combinations based on various factors
   */
  private prioritizeCombinations(
    combinations: APICombination[]
  ): APICombination[] {
    // Score each combination
    const scored = combinations.map(combo => {
      let score = 0;
      
      // Complexity score
      score += combo.complexity * 10;
      
      // Category diversity score
      const categories = new Set(combo.apis.map(api => api.category));
      score += categories.size * 20;
      
      // Untested API bonus
      combo.apis.forEach(api => {
        const apiKey = `${api.className}.${api.methodName}`;
        if (!this.testCoverage.testedAPIs.has(apiKey)) {
          score += 50;
        }
      });
      
      // Platform-specific bonus
      if (combo.category === 'platform-specific') {
        score += 30;
      }
      
      // Edge case bonus
      if (combo.category === 'edge-case') {
        score += 40;
      }
      
      return { combo, score };
    });
    
    // Sort by score and take top combinations
    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, 50).map(s => s.combo);
  }

  /**
   * Generate test code for a combination
   */
  generateTestCode(combination: APICombination): string {
    const imports = this.generateImports(combination.apis);
    const setup = this.generateSetup();
    const apiCalls = this.generateAPICalls(combination.apis);
    const assertions = this.generateAssertions(combination);
    
    return `${imports}

${setup}

test('${combination.testName}', async () => {
  ${apiCalls}
  
  ${assertions}
});`;
  }

  /**
   * Generate imports based on used APIs
   */
  private generateImports(apis: APIMethod[]): string {
    const classes = new Set(apis.map(api => api.className).filter(c => c !== 'global'));
    
    return `import { ${Array.from(classes).join(', ')} } from '@jamesaphoenix/media-sdk';
import { EnhancedBunCassetteManager } from '../src/enhanced-cassette-manager';`;
  }

  /**
   * Generate test setup
   */
  private generateSetup(): string {
    return `const cassetteManager = new EnhancedBunCassetteManager('combinatorial-tests');`;
  }

  /**
   * Generate API calls for the test
   */
  private generateAPICalls(apis: APIMethod[]): string {
    let code = 'const timeline = new Timeline()';
    
    apis.forEach(api => {
      if (api.isChainable) {
        code += `\n    .${api.methodName}(${this.generateMockParams(api)})`;
      }
    });
    
    code += ';\n\n  const command = timeline.getCommand("output.mp4");';
    
    return code;
  }

  /**
   * Generate mock parameters for API
   */
  private generateMockParams(api: APIMethod): string {
    const paramMocks: { [key: string]: string } = {
      'source': '"test.mp4"',
      'text': '"Test Text"',
      'duration': '5',
      'position': '{ x: "center", y: "center" }',
      'options': '{}',
      'filter': '"scale=1920:1080"',
      'volume': '0.5',
      'startTime': '0',
      'endTime': '10'
    };
    
    return api.parameters.map(param => 
      paramMocks[param] || '/* TODO */'
    ).join(', ');
  }

  /**
   * Generate assertions for the test
   */
  private generateAssertions(combination: APICombination): string {
    return `expect(command).toContain('ffmpeg');
  
  // Verify all filters are applied
  const result = await cassetteManager.executeCommand(command);
  expect(result.success).toBe(true);
  
  // TODO: Add specific assertions for ${combination.testName}`;
  }

  /**
   * Save generated tests to file
   */
  async saveTests(
    combinations: APICombination[],
    outputPath: string
  ): Promise<void> {
    const testContent = `/**
 * Combinatorial tests generated by AST analysis
 * Generated on: ${new Date().toISOString()}
 * Total combinations: ${combinations.length}
 */

import { describe, test, expect } from 'bun:test';
${this.generateImports(combinations.flatMap(c => c.apis))}

describe('Combinatorial API Tests', () => {
${combinations.map(combo => {
  const testCode = this.generateTestCode(combo);
  return `
  // Priority: ${combo.priority}, Complexity: ${combo.complexity}
  ${testCode}`;
}).join('\n\n')}
});

// Test Coverage Summary
/*
Total API methods discovered: ${this.apis.size}
Already tested APIs: ${this.testCoverage.testedAPIs.size}
New combinations generated: ${combinations.length}

Top untested patterns:
${[...this.testCoverage.testPatterns.entries()]
  .sort((a, b) => a[1] - b[1])
  .slice(0, 10)
  .map(([pattern, count]) => `- ${pattern}: ${count} tests`)
  .join('\n')}
*/`;

    writeFileSync(outputPath, testContent);
    console.log(`✅ Generated ${combinations.length} tests in ${outputPath}`);
  }
}

// CLI usage
if (import.meta.main) {
  const generator = new CombinatorialTestGenerator();
  
  console.log('🚀 Starting combinatorial test generation...\n');
  
  generator.generateTestCombinations().then(async (combinations) => {
    console.log(`\n📊 Results:`);
    console.log(`- Found ${combinations.length} high-priority untested combinations`);
    
    // Group by category
    const byCategory = combinations.reduce((acc, combo) => {
      acc[combo.category] = (acc[combo.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nBy category:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count}`);
    });
    
    // Save tests
    const outputPath = join(process.cwd(), 'test', 'combinatorial-tests.test.ts');
    await generator.saveTests(combinations, outputPath);
    
    // Save detailed report
    const reportPath = join(process.cwd(), 'combinatorial-test-report.json');
    writeFileSync(reportPath, JSON.stringify({
      generated: new Date().toISOString(),
      totalAPIs: generator['apis'].size,
      testedAPIs: generator['testCoverage'].testedAPIs.size,
      combinations: combinations
    }, null, 2));
    
    console.log(`\n📝 Detailed report saved to: ${reportPath}`);
  }).catch(error => {
    console.error('❌ Generation failed:', error);
  });
}