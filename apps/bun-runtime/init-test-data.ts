#!/usr/bin/env bun

import { TestDataManager } from './src/test-data-manager.js';

async function main() {
  console.log('📦 Initializing test data for Media SDK...\n');
  
  const dataManager = new TestDataManager();
  
  try {
    // Initialize all test data
    await dataManager.initializeTestData();
    
    // Validate the data
    const validation = await dataManager.validateData();
    
    console.log('\n📊 Validation Results:');
    console.log(`✅ Valid files: ${validation.validFiles}/${validation.totalFiles}`);
    
    if (validation.missing.length > 0) {
      console.log(`❌ Missing files: ${validation.missing.join(', ')}`);
    }
    
    if (validation.corrupted.length > 0) {
      console.log(`⚠️ Corrupted files: ${validation.corrupted.join(', ')}`);
    }
    
    if (validation.sizeMismatches.length > 0) {
      console.log(`📏 Size mismatches: ${validation.sizeMismatches.join(', ')}`);
    }
    
    if (validation.valid) {
      console.log('\n✅ All test data initialized successfully!');
    } else {
      console.log('\n⚠️ Some test data files could not be initialized.');
      console.log('Validation details:', validation);
    }
  } catch (error) {
    console.error('❌ Error initializing test data:', error);
    process.exit(1);
  }
}

main();