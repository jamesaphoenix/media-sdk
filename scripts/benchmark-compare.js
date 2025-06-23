#!/usr/bin/env node

/**
 * Compare benchmark results between two runs
 * Used in CI to detect performance regressions
 */

const fs = require('fs');
const path = require('path');

class BenchmarkComparator {
  constructor(baseline, current) {
    this.baseline = baseline;
    this.current = current;
  }

  /**
   * Parse benchmark results from markdown report
   */
  static parseReport(reportPath) {
    const content = fs.readFileSync(reportPath, 'utf8');
    const results = {};
    
    // Parse table rows
    const lines = content.split('\n');
    let inTable = false;
    
    for (const line of lines) {
      if (line.includes('| Test | Duration')) {
        inTable = true;
        continue;
      }
      
      if (!inTable || !line.startsWith('|')) continue;
      if (line.includes('|------|')) continue;
      
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 4) {
        const [name, duration, memory, ops] = parts;
        results[name] = {
          duration: parseFloat(duration),
          memory: parseFloat(memory),
          opsPerSecond: ops === 'N/A' ? null : parseFloat(ops)
        };
      }
    }
    
    return results;
  }

  /**
   * Compare two benchmark results
   */
  compare() {
    const comparison = {
      improved: [],
      regressed: [],
      unchanged: [],
      added: [],
      removed: []
    };
    
    // Check for regressions and improvements
    for (const [name, baseline] of Object.entries(this.baseline)) {
      const current = this.current[name];
      
      if (!current) {
        comparison.removed.push(name);
        continue;
      }
      
      const durationChange = ((current.duration - baseline.duration) / baseline.duration) * 100;
      const memoryChange = ((current.memory - baseline.memory) / baseline.memory) * 100;
      
      const result = {
        name,
        baseline,
        current,
        durationChange: durationChange.toFixed(2),
        memoryChange: memoryChange.toFixed(2)
      };
      
      // Consider >10% slower as regression, >10% faster as improvement
      if (durationChange > 10) {
        comparison.regressed.push(result);
      } else if (durationChange < -10) {
        comparison.improved.push(result);
      } else {
        comparison.unchanged.push(result);
      }
    }
    
    // Check for new benchmarks
    for (const name of Object.keys(this.current)) {
      if (!this.baseline[name]) {
        comparison.added.push(name);
      }
    }
    
    return comparison;
  }

  /**
   * Generate GitHub-flavored markdown report
   */
  generateReport(comparison) {
    const lines = ['## 📊 Performance Comparison Report', ''];
    
    // Summary
    lines.push('### Summary');
    lines.push(`- ✅ **Improved**: ${comparison.improved.length} benchmarks`);
    lines.push(`- ⚠️ **Regressed**: ${comparison.regressed.length} benchmarks`);
    lines.push(`- ➖ **Unchanged**: ${comparison.unchanged.length} benchmarks`);
    lines.push(`- ➕ **Added**: ${comparison.added.length} benchmarks`);
    lines.push(`- ➖ **Removed**: ${comparison.removed.length} benchmarks`);
    lines.push('');
    
    // Regressions (most important)
    if (comparison.regressed.length > 0) {
      lines.push('### ⚠️ Performance Regressions');
      lines.push('');
      lines.push('| Benchmark | Duration Change | Memory Change | Details |');
      lines.push('|-----------|----------------|---------------|---------|');
      
      for (const reg of comparison.regressed) {
        lines.push(
          `| ${reg.name} | 🔴 +${reg.durationChange}% | ${
            parseFloat(reg.memoryChange) > 0 ? '🔴' : '🟢'
          } ${reg.memoryChange}% | ${reg.baseline.duration.toFixed(2)}ms → ${reg.current.duration.toFixed(2)}ms |`
        );
      }
      lines.push('');
    }
    
    // Improvements
    if (comparison.improved.length > 0) {
      lines.push('### ✅ Performance Improvements');
      lines.push('');
      lines.push('| Benchmark | Duration Change | Memory Change | Details |');
      lines.push('|-----------|----------------|---------------|---------|');
      
      for (const imp of comparison.improved) {
        lines.push(
          `| ${imp.name} | 🟢 ${imp.durationChange}% | ${
            parseFloat(imp.memoryChange) > 0 ? '🔴' : '🟢'
          } ${imp.memoryChange}% | ${imp.baseline.duration.toFixed(2)}ms → ${imp.current.duration.toFixed(2)}ms |`
        );
      }
      lines.push('');
    }
    
    // Detailed results
    lines.push('<details>');
    lines.push('<summary>📈 All Results</summary>');
    lines.push('');
    lines.push('| Benchmark | Baseline | Current | Duration Δ | Memory Δ |');
    lines.push('|-----------|----------|---------|-----------|----------|');
    
    const allResults = [
      ...comparison.improved,
      ...comparison.regressed,
      ...comparison.unchanged
    ];
    
    for (const result of allResults) {
      lines.push(
        `| ${result.name} | ${result.baseline.duration.toFixed(2)}ms | ${
          result.current.duration.toFixed(2)
        }ms | ${result.durationChange}% | ${result.memoryChange}% |`
      );
    }
    
    lines.push('</details>');
    
    // Threshold recommendations
    if (comparison.regressed.length > 0) {
      lines.push('');
      lines.push('### 🚨 Action Required');
      lines.push('');
      lines.push('Performance regressions detected! Please review the changes and:');
      lines.push('1. Optimize the affected code paths');
      lines.push('2. Update performance thresholds if the regression is acceptable');
      lines.push('3. Add comments explaining why the performance change is necessary');
    }
    
    return lines.join('\n');
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: benchmark-compare.js <baseline-report> <current-report> [output-file]');
    process.exit(1);
  }
  
  const [baselinePath, currentPath, outputPath] = args;
  
  try {
    const baseline = BenchmarkComparator.parseReport(baselinePath);
    const current = BenchmarkComparator.parseReport(currentPath);
    
    const comparator = new BenchmarkComparator(baseline, current);
    const comparison = comparator.compare();
    const report = comparator.generateReport(comparison);
    
    if (outputPath) {
      fs.writeFileSync(outputPath, report);
      console.log(`Comparison report written to ${outputPath}`);
    } else {
      console.log(report);
    }
    
    // Exit with error code if regressions found
    if (comparison.regressed.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error comparing benchmarks:', error);
    process.exit(1);
  }
}

module.exports = { BenchmarkComparator };