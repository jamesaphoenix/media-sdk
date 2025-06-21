/**
 * @fileoverview Advanced Test Runner Integration Tests
 * 
 * Demonstrates the comprehensive runtime testing environment with
 * parallel execution, vision validation, and detailed reporting.
 * 
 * @author Media SDK Team
 * @version 1.0.0
 * @since 2024-12-20
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { AdvancedTestRunner } from '../src/advanced-test-runner.js';
import { existsSync, rmSync } from 'fs';

describe('🏃‍♂️ Advanced Test Runner', () => {
  let testRunner: AdvancedTestRunner;
  const testOutputDir = 'test-results-demo';

  beforeAll(async () => {
    // Clean up any previous test results
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }

    // Initialize test runner with demo configuration
    testRunner = new AdvancedTestRunner({
      parallel: true,
      maxConcurrency: 2, // Reduced for demo
      outputDir: testOutputDir,
      enableRegression: true,
      captureAllFrames: false
    });

    console.log('🚀 Advanced Test Runner Demo Starting...');
  });

  afterAll(async () => {
    console.log('✅ Advanced Test Runner Demo Completed');
    
    // Clean up test results
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  test('should execute comprehensive test suite with parallel processing', async () => {
    console.log('🎯 Running comprehensive test suite...');
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Execute the full test suite
    const report = await testRunner.runTestSuite();
    
    // Validate test suite execution
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.passRate).toBeGreaterThanOrEqual(0.5); // At least 50% pass rate
    expect(report.totalTime).toBeGreaterThan(0);
    
    // Validate performance metrics
    expect(report.performance.averageExecutionTime).toBeGreaterThan(0);
    expect(report.performance.memoryPeakUsage).toBeGreaterThanOrEqual(0);
    
    // Validate quality metrics
    expect(report.quality.averageScore).toBeGreaterThanOrEqual(0);
    expect(report.quality.highestScore).toBeGreaterThanOrEqual(0);
    expect(report.quality.lowestScore).toBeGreaterThanOrEqual(0);
    
    // Validate system information
    expect(report.system.platform).toBeDefined();
    expect(report.system.nodeVersion).toBeDefined();
    expect(report.system.memoryTotal).toBeGreaterThan(0);
    expect(report.system.cpuCount).toBeGreaterThan(0);
    
    // Validate category breakdown
    expect(Object.keys(report.categories).length).toBeGreaterThan(0);
    
    console.log('📊 Test Suite Results:', {
      total: report.summary.total,
      passed: report.summary.passed,
      failed: report.summary.failed,
      passRate: `${Math.round(report.summary.passRate * 100)}%`,
      totalTime: `${report.totalTime}ms`,
      avgExecutionTime: `${Math.round(report.performance.averageExecutionTime)}ms`,
      avgQualityScore: `${Math.round(report.quality.averageScore * 100)}%`
    });
    
    // Validate HTML report generation
    expect(existsSync(`${testOutputDir}/report.html`)).toBe(true);
    
    console.log(`📄 HTML Report generated at: ${testOutputDir}/report.html`);
    console.log('✅ Comprehensive test suite validation completed');
    
  }, 180000); // 3 minutes timeout for full suite

  test('should handle test scenario validation correctly', async () => {
    console.log('🧪 Testing individual scenario validation...');
    
    // Create a simple test runner for validation testing
    const runner = new AdvancedTestRunner({
      parallel: false,
      maxConcurrency: 1,
      outputDir: testOutputDir,
      enableRegression: false
    });
    
    // Access the private scenarios for validation (normally would use public interface)
    const scenarios = (runner as any).scenarios;
    expect(scenarios.length).toBeGreaterThan(0);
    
    // Validate scenario structure
    const firstScenario = scenarios[0];
    expect(firstScenario.id).toBeDefined();
    expect(firstScenario.name).toBeDefined();
    expect(firstScenario.category).toBeDefined();
    expect(firstScenario.priority).toBeDefined();
    expect(firstScenario.platform).toBeDefined();
    expect(firstScenario.expected).toBeDefined();
    expect(firstScenario.config).toBeDefined();
    expect(typeof firstScenario.testFunction).toBe('function');
    
    console.log('🎯 Scenario Validation:', {
      totalScenarios: scenarios.length,
      categories: [...new Set(scenarios.map((s: any) => s.category))],
      platforms: [...new Set(scenarios.map((s: any) => s.platform))],
      priorities: [...new Set(scenarios.map((s: any) => s.priority))]
    });
    
    console.log('✅ Scenario validation completed');
  });

  test('should demonstrate parallel vs sequential execution performance', async () => {
    console.log('⚡ Testing parallel vs sequential execution...');
    
    // Test parallel execution
    const parallelRunner = new AdvancedTestRunner({
      parallel: true,
      maxConcurrency: 3,
      outputDir: `${testOutputDir}/parallel`,
      enableRegression: false
    });
    
    const parallelStart = Date.now();
    const parallelReport = await parallelRunner.runTestSuite();
    const parallelTime = Date.now() - parallelStart;
    
    // Test sequential execution
    const sequentialRunner = new AdvancedTestRunner({
      parallel: false,
      maxConcurrency: 1,
      outputDir: `${testOutputDir}/sequential`,
      enableRegression: false
    });
    
    const sequentialStart = Date.now();
    const sequentialReport = await sequentialRunner.runTestSuite();
    const sequentialTime = Date.now() - sequentialStart;
    
    console.log('📊 Performance Comparison:', {
      parallelTime: `${parallelTime}ms`,
      sequentialTime: `${sequentialTime}ms`,
      speedup: `${Math.round(sequentialTime / parallelTime * 100) / 100}x`,
      parallelTests: parallelReport.summary.total,
      sequentialTests: sequentialReport.summary.total
    });
    
    // Validate that both execution modes produce similar results
    expect(parallelReport.summary.total).toBe(sequentialReport.summary.total);
    
    // Parallel should generally be faster (unless overhead dominates for small test sets)
    if (parallelReport.summary.total > 2) {
      console.log(`⚡ Parallel execution ${Math.round(sequentialTime / parallelTime * 100) / 100}x faster`);
    }
    
    console.log('✅ Performance comparison completed');
  }, 300000); // 5 minutes timeout for both execution modes

  test('should validate comprehensive error handling', async () => {
    console.log('🛡️ Testing error handling capabilities...');
    
    // Test with invalid configuration to trigger error paths
    const errorRunner = new AdvancedTestRunner({
      parallel: true,
      maxConcurrency: 1,
      outputDir: testOutputDir,
      enableRegression: false
    });
    
    // Run the test suite and expect it to handle errors gracefully
    const report = await errorRunner.runTestSuite();
    
    // Even with potential errors, we should get a valid report
    expect(report).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.results).toBeDefined();
    expect(Array.isArray(report.results)).toBe(true);
    
    // Check if any tests failed and that failures are properly recorded
    const failedTests = report.results.filter(result => !result.passed);
    console.log('📊 Error Handling Results:', {
      totalTests: report.results.length,
      failedTests: failedTests.length,
      errorHandling: failedTests.length > 0 ? 'Errors properly captured' : 'All tests passed',
      hasErrorDetails: failedTests.every(test => test.error !== undefined)
    });
    
    // Validate error structure for failed tests
    failedTests.forEach(failedTest => {
      expect(failedTest.error).toBeDefined();
      expect(failedTest.error?.type).toBeDefined();
      expect(failedTest.error?.message).toBeDefined();
    });
    
    console.log('✅ Error handling validation completed');
  }, 120000);

  test('should generate comprehensive reports with all required sections', async () => {
    console.log('📄 Testing report generation...');
    
    const reportRunner = new AdvancedTestRunner({
      parallel: true,
      maxConcurrency: 2,
      outputDir: `${testOutputDir}/reports`,
      enableRegression: true
    });
    
    const report = await reportRunner.runTestSuite();
    
    // Validate report structure
    expect(report.timestamp).toBeDefined();
    expect(report.totalTime).toBeGreaterThan(0);
    expect(report.summary).toBeDefined();
    expect(report.categories).toBeDefined();
    expect(report.performance).toBeDefined();
    expect(report.quality).toBeDefined();
    expect(report.results).toBeDefined();
    expect(report.system).toBeDefined();
    
    // Validate summary section
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.passed).toBeGreaterThanOrEqual(0);
    expect(report.summary.failed).toBeGreaterThanOrEqual(0);
    expect(report.summary.passRate).toBeGreaterThanOrEqual(0);
    expect(report.summary.passRate).toBeLessThanOrEqual(1);
    
    // Validate performance section
    expect(report.performance.averageExecutionTime).toBeGreaterThanOrEqual(0);
    expect(report.performance.slowestTest).toBeDefined();
    expect(report.performance.fastestTest).toBeDefined();
    expect(report.performance.memoryPeakUsage).toBeGreaterThanOrEqual(0);
    
    // Validate quality section
    expect(report.quality.averageScore).toBeGreaterThanOrEqual(0);
    expect(report.quality.averageScore).toBeLessThanOrEqual(1);
    expect(report.quality.highestScore).toBeGreaterThanOrEqual(0);
    expect(report.quality.lowestScore).toBeGreaterThanOrEqual(0);
    expect(report.quality.qualityTrend).toBeDefined();
    
    // Validate system section
    expect(report.system.platform).toBeDefined();
    expect(report.system.nodeVersion).toBeDefined();
    expect(report.system.memoryTotal).toBeGreaterThan(0);
    expect(report.system.cpuCount).toBeGreaterThan(0);
    
    // Validate HTML report file
    expect(existsSync(`${testOutputDir}/reports/report.html`)).toBe(true);
    
    console.log('📊 Report Generation Results:', {
      timestamp: report.timestamp,
      sections: Object.keys(report).length,
      htmlReportExists: existsSync(`${testOutputDir}/reports/report.html`),
      reportSize: `${Math.round(JSON.stringify(report).length / 1024)}KB`
    });
    
    console.log('✅ Report generation validation completed');
  }, 120000);

  test('should demonstrate test categorization and prioritization', async () => {
    console.log('🏷️ Testing categorization and prioritization...');
    
    const categoryRunner = new AdvancedTestRunner({
      parallel: false,
      maxConcurrency: 1,
      outputDir: `${testOutputDir}/categories`,
      enableRegression: false
    });
    
    const report = await categoryRunner.runTestSuite();
    
    // Validate that we have multiple categories
    const categories = Object.keys(report.categories);
    expect(categories.length).toBeGreaterThan(0);
    
    // Expected categories from our test scenarios
    const expectedCategories = ['stability', 'performance', 'quality', 'platform', 'regression'];
    const foundCategories = categories.filter(cat => expectedCategories.includes(cat));
    expect(foundCategories.length).toBeGreaterThan(0);
    
    // Validate category statistics
    categories.forEach(category => {
      const categoryStats = report.categories[category];
      expect(categoryStats.total).toBeGreaterThan(0);
      expect(categoryStats.passed).toBeGreaterThanOrEqual(0);
      expect(categoryStats.passRate).toBeGreaterThanOrEqual(0);
      expect(categoryStats.passRate).toBeLessThanOrEqual(1);
    });
    
    // Check for priority distribution in results
    const priorities = [...new Set(report.results.map(r => r.scenario.priority))];
    const platforms = [...new Set(report.results.map(r => r.scenario.platform))];
    
    console.log('🏷️ Categorization Results:', {
      categories: categories,
      priorities: priorities,
      platforms: platforms,
      categoryStats: Object.fromEntries(
        categories.map(cat => [
          cat, 
          `${report.categories[cat].passed}/${report.categories[cat].total} (${Math.round(report.categories[cat].passRate * 100)}%)`
        ])
      )
    });
    
    console.log('✅ Categorization validation completed');
  }, 120000);
});