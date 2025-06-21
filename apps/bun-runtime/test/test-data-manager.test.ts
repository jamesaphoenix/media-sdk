/**
 * @fileoverview Test Data Manager Tests
 * 
 * Validates automated test data management including sample file generation,
 * validation, and cleanup functionality.
 * 
 * @author Media SDK Team
 * @version 1.0.0
 * @since 2024-12-20
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { TestDataManager } from '../src/test-data-manager.js';
import { existsSync, rmSync, statSync } from 'fs';

describe('🗃️ Test Data Manager', () => {
  let dataManager: TestDataManager;
  const testDataDir = 'test-sample-files';

  beforeAll(async () => {
    // Clean up any existing test data
    if (existsSync(testDataDir)) {
      rmSync(testDataDir, { recursive: true, force: true });
    }

    dataManager = new TestDataManager(testDataDir);
    console.log('🚀 Test Data Manager initialized');
  });

  afterAll(async () => {
    // Clean up test data
    if (existsSync(testDataDir)) {
      rmSync(testDataDir, { recursive: true, force: true });
    }
    console.log('✅ Test Data Manager cleanup completed');
  });

  test('should initialize test data directory and generate all sample files', async () => {
    console.log('🔧 Testing test data initialization...');
    
    // Initialize test data
    await dataManager.initializeTestData();
    
    // Verify directory exists
    expect(existsSync(testDataDir)).toBe(true);
    
    // Get all sample specifications
    const allSpecs = dataManager.getAllSpecs();
    expect(allSpecs.length).toBeGreaterThan(0);
    
    // Verify each sample file exists
    for (const spec of allSpecs) {
      const filePath = dataManager.getFilePath(spec.id);
      expect(filePath).toBeTruthy();
      expect(existsSync(filePath!)).toBe(true);
      
      // Verify file size is reasonable
      const stats = statSync(filePath!);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.size).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    }
    
    console.log(`✅ Generated ${allSpecs.length} sample files successfully`);
  }, 60000); // 1 minute timeout for file generation

  test('should validate all generated files correctly', async () => {
    console.log('🔍 Testing file validation...');
    
    // Run validation
    const validation = await dataManager.validateData();
    
    // All files should be valid
    expect(validation.valid).toBe(true);
    expect(validation.missing.length).toBe(0);
    expect(validation.corrupted.length).toBe(0);
    expect(validation.sizeMismatches.length).toBe(0);
    expect(validation.validFiles).toBe(validation.totalFiles);
    expect(validation.totalFiles).toBeGreaterThan(0);
    
    console.log(`✅ Validated ${validation.validFiles}/${validation.totalFiles} files`);
  });

  test('should provide accurate file specifications', async () => {
    console.log('📋 Testing file specifications...');
    
    // Test getting specific sample specs
    const redSample = dataManager.getSampleSpec('red-sample');
    expect(redSample).toBeDefined();
    expect(redSample?.type).toBe('video');
    expect(redSample?.format).toBe('mp4');
    expect(redSample?.params.color).toBe('red');
    
    const logoSample = dataManager.getSampleSpec('logo-150x150');
    expect(logoSample).toBeDefined();
    expect(logoSample?.type).toBe('image');
    expect(logoSample?.format).toBe('png');
    expect(logoSample?.params.resolution?.width).toBe(150);
    expect(logoSample?.params.resolution?.height).toBe(150);
    
    const audioSample = dataManager.getSampleSpec('background-music');
    expect(audioSample).toBeDefined();
    expect(audioSample?.type).toBe('audio');
    expect(audioSample?.format).toBe('mp3');
    expect(audioSample?.params.duration).toBe(10.03);
    
    // Test file path resolution
    const redPath = dataManager.getFilePath('red-sample');
    expect(redPath).toBeTruthy();
    expect(existsSync(redPath!)).toBe(true);
    
    const invalidPath = dataManager.getFilePath('non-existent');
    expect(invalidPath).toBe(null);
    
    console.log('✅ File specifications validated');
  });

  test('should provide comprehensive statistics', async () => {
    console.log('📊 Testing statistics generation...');
    
    const stats = await dataManager.getStatistics();
    
    // Validate basic statistics
    expect(stats.totalFiles).toBeGreaterThan(0);
    expect(stats.totalSize).toBeGreaterThan(0);
    
    // Validate file type breakdown
    expect(stats.filesByType.video).toBeGreaterThan(0);
    expect(stats.filesByType.image).toBeGreaterThan(0);
    expect(stats.filesByType.audio).toBeGreaterThan(0);
    
    // Validate size breakdown
    expect(stats.sizeByType.video).toBeGreaterThan(0);
    expect(stats.sizeByType.image).toBeGreaterThan(0);
    expect(stats.sizeByType.audio).toBeGreaterThan(0);
    
    // Validate file age tracking
    expect(stats.oldestFile).toBeDefined();
    expect(stats.newestFile).toBeDefined();
    expect(stats.oldestFile?.age).toBeGreaterThanOrEqual(0);
    expect(stats.newestFile?.age).toBeGreaterThanOrEqual(0);
    
    console.log('📊 Statistics:', {
      totalFiles: stats.totalFiles,
      totalSizeMB: Math.round(stats.totalSize / 1024 / 1024 * 100) / 100,
      filesByType: stats.filesByType,
      oldestFile: stats.oldestFile?.name,
      newestFile: stats.newestFile?.name
    });
    
    console.log('✅ Statistics validation completed');
  });

  test('should handle cleanup operations correctly', async () => {
    console.log('🧹 Testing cleanup operations...');
    
    // Test dry run cleanup
    await dataManager.cleanup({ 
      olderThan: 1, // 1ms ago (should match all files)
      dryRun: true 
    });
    
    // Verify files still exist after dry run
    const validation = await dataManager.validateData();
    expect(validation.valid).toBe(true);
    
    // Test actual cleanup with very old threshold (shouldn't remove anything)
    await dataManager.cleanup({ 
      olderThan: 365 * 24 * 60 * 60 * 1000 // 1 year
    });
    
    // Verify files still exist
    const validationAfterCleanup = await dataManager.validateData();
    expect(validationAfterCleanup.valid).toBe(true);
    
    console.log('✅ Cleanup operations validated');
  });

  test('should detect and regenerate corrupted files', async () => {
    console.log('🔧 Testing corruption detection and repair...');
    
    // Get a sample file path
    const samplePath = dataManager.getFilePath('logo-150x150');
    expect(samplePath).toBeTruthy();
    
    // Create a corrupted version by writing invalid data
    require('fs').writeFileSync(samplePath!, 'corrupted data');
    
    // Validate should detect corruption
    let validation = await dataManager.validateData();
    expect(validation.valid).toBe(false);
    expect(validation.corrupted.length).toBeGreaterThan(0);
    expect(validation.corrupted).toContain('logo-150x150');
    
    // Re-initialize should fix the corruption
    await dataManager.initializeTestData();
    
    // Validate should now pass
    validation = await dataManager.validateData();
    expect(validation.valid).toBe(true);
    expect(validation.corrupted.length).toBe(0);
    
    console.log('✅ Corruption detection and repair validated');
  }, 30000);

  test('should handle missing files and regenerate them', async () => {
    console.log('🔍 Testing missing file detection and regeneration...');
    
    // Remove a sample file
    const samplePath = dataManager.getFilePath('red-sample');
    expect(samplePath).toBeTruthy();
    
    if (existsSync(samplePath!)) {
      rmSync(samplePath!);
    }
    
    // Validate should detect missing file
    let validation = await dataManager.validateData();
    expect(validation.valid).toBe(false);
    expect(validation.missing.length).toBeGreaterThan(0);
    expect(validation.missing).toContain('red-sample');
    
    // Re-initialize should regenerate the missing file
    await dataManager.initializeTestData();
    
    // Validate should now pass
    validation = await dataManager.validateData();
    expect(validation.valid).toBe(true);
    expect(validation.missing.length).toBe(0);
    
    // Verify the file was actually regenerated
    expect(existsSync(samplePath!)).toBe(true);
    
    console.log('✅ Missing file detection and regeneration validated');
  }, 30000);

  test('should validate different file formats correctly', async () => {
    console.log('🎬 Testing file format validation...');
    
    const allSpecs = dataManager.getAllSpecs();
    
    // Group specs by type
    const videoSpecs = allSpecs.filter(s => s.type === 'video');
    const imageSpecs = allSpecs.filter(s => s.type === 'image');
    const audioSpecs = allSpecs.filter(s => s.type === 'audio');
    
    expect(videoSpecs.length).toBeGreaterThan(0);
    expect(imageSpecs.length).toBeGreaterThan(0);
    expect(audioSpecs.length).toBeGreaterThan(0);
    
    // Verify video files have correct properties
    for (const spec of videoSpecs) {
      expect(spec.format).toBe('mp4');
      expect(spec.params.duration).toBeGreaterThan(0);
      expect(spec.params.resolution?.width).toBeGreaterThan(0);
      expect(spec.params.resolution?.height).toBeGreaterThan(0);
    }
    
    // Verify image files have correct properties
    for (const spec of imageSpecs) {
      expect(spec.format).toBe('png');
      expect(spec.params.resolution?.width).toBeGreaterThan(0);
      expect(spec.params.resolution?.height).toBeGreaterThan(0);
    }
    
    // Verify audio files have correct properties
    for (const spec of audioSpecs) {
      expect(['mp3', 'wav']).toContain(spec.format);
      expect(spec.params.duration).toBeGreaterThan(0);
      expect(spec.params.sampleRate).toBeGreaterThan(0);
    }
    
    console.log('📊 Format validation:', {
      videoFiles: videoSpecs.length,
      imageFiles: imageSpecs.length,
      audioFiles: audioSpecs.length,
      totalFormats: new Set([...videoSpecs, ...imageSpecs, ...audioSpecs].map(s => s.format)).size
    });
    
    console.log('✅ File format validation completed');
  });

  test('should handle edge cases gracefully', async () => {
    console.log('🛡️ Testing edge case handling...');
    
    // Test with non-existent file ID
    const invalidSpec = dataManager.getSampleSpec('non-existent-file');
    expect(invalidSpec).toBeUndefined();
    
    const invalidPath = dataManager.getFilePath('non-existent-file');
    expect(invalidPath).toBe(null);
    
    // Test with empty directory
    const emptyManager = new TestDataManager('non-existent-directory');
    
    // Should handle missing directory gracefully
    const emptyValidation = await emptyManager.validateData();
    expect(emptyValidation.valid).toBe(false);
    expect(emptyValidation.missing.length).toBeGreaterThan(0);
    
    // Should create directory and files when initializing
    await emptyManager.initializeTestData();
    const afterInitValidation = await emptyManager.validateData();
    expect(afterInitValidation.valid).toBe(true);
    
    // Clean up
    if (existsSync('non-existent-directory')) {
      rmSync('non-existent-directory', { recursive: true, force: true });
    }
    
    console.log('✅ Edge case handling validated');
  }, 60000);
});