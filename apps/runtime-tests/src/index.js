import { SampleDownloader } from './sample-downloader.js';
import { TestScenarios } from './test-scenarios.js';
import chalk from 'chalk';

/**
 * Main runtime test entry point
 */
async function main() {
  console.log(chalk.blue.bold('🎥 Media SDK Runtime Tests\n'));

  try {
    // Setup sample files
    const downloader = new SampleDownloader();
    await downloader.setup();
    
    // Run test scenarios
    const scenarios = new TestScenarios();
    await scenarios.runAll();
    
    console.log(chalk.green.bold('\n✨ All tests completed!'));
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Test run failed:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⏹️  Tests interrupted by user'));
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red.bold('\n💥 Uncaught exception:'));
  console.error(chalk.red(error.message));
  process.exit(1);
});

// Run tests
main().catch(console.error);