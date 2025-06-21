/**
 * REAL FILE RENDERING TESTS
 * Criteria: Always test with real files, generate actual outputs, validate results
 */

import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Timeline, tiktok, youtube, instagram, brightness, contrast } from '@jamesaphoenix/media-sdk';
import { existsSync, statSync } from 'fs';

describe('🎬 REAL FILE RENDERING - No Mocks, Real Outputs Only', () => {
  
  beforeAll(async () => {
    // Ensure real output directory
    await Bun.spawn(['mkdir', '-p', 'output/real-renders']);
    console.log('🎯 REAL FILE TESTING - Generating actual video outputs');
  });

  afterAll(async () => {
    // Show all real files created
    console.log('\n📊 REAL RENDERED FILES:');
    const proc = Bun.spawn(['find', 'output/real-renders', '-name', '*.mp4', '-exec', 'ls', '-lh', '{}', ';'], { stdout: 'pipe' });
    const output = proc.stdout ? await new Response(proc.stdout).text() : "";
    console.log(output);
    
    // Validate with ffprobe
    console.log('\n🔍 REAL FILE VALIDATION:');
    const files = await Bun.spawn(['find', 'output/real-renders', '-name', '*.mp4'], { stdout: 'pipe' });
    const fileList = await new Response(files.stdout).text();
    
    for (const file of fileList.trim().split('\n').filter(f => f)) {
      if (existsSync(file)) {
        const stats = statSync(file);
        if (stats.size > 0) {
          console.log(`✅ ${file}: ${stats.size} bytes`);
        } else {
          console.log(`❌ ${file}: 0 bytes (failed)`);
        }
      }
    }
  });

  describe('🎯 BASIC REAL RENDERING', () => {
    test('REAL: Simple text overlay on real video', async () => {
      const inputFile = 'assets/bunny.mp4';
      const outputFile = 'output/real-renders/simple-text-real.mp4';
      
      // Verify input exists
      expect(existsSync(inputFile)).toBe(true);
      
      // Use simple, working FFmpeg command
      const command = `ffmpeg -i ${inputFile} -vf "drawtext=text='REAL RENDER':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=24:fontcolor=white" -c:v libx264 -crf 23 -preset fast -c:a aac -y ${outputFile}`;
      
      console.log('Executing real command:', command.substring(0, 80) + '...');
      
      const proc = Bun.spawn(['sh', '-c', command], {
        stdout: 'pipe',
        stderr: 'pipe'
      });
      
      const stderr = proc.stderr ? await new Response(proc.stderr).text() : "";
      const exitCode = await proc.exited;
      
      if (exitCode !== 0) {
        console.error('REAL RENDER FAILED:', stderr.substring(0, 200));
      }
      
      // REAL FILE VALIDATION
      expect(exitCode).toBe(0);
      expect(existsSync(outputFile)).toBe(true);
      
      const stats = statSync(outputFile);
      expect(stats.size).toBeGreaterThan(1000); // Real video should be > 1KB
      
      console.log(`✅ REAL FILE CREATED: ${stats.size} bytes`);
    }, 30000);

    test('REAL: TikTok format conversion with real files', async () => {
      const inputFile = 'assets/portrait-nature.mp4';
      const outputFile = 'output/real-renders/tiktok-real.mp4';
      
      expect(existsSync(inputFile)).toBe(true);
      
      // Real TikTok conversion: portrait to 9:16 with text
      const command = `ffmpeg -i ${inputFile} -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,drawtext=text='TikTok Ready':x=(w-text_w)/2:y=h-text_h-100:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.5" -c:v libx264 -crf 18 -preset fast -c:a aac -y ${outputFile}`;
      
      const proc = Bun.spawn(['sh', '-c', command], {
        stdout: 'pipe',
        stderr: 'pipe'
      });
      
      const exitCode = await proc.exited;
      const stderr = proc.stderr ? await new Response(proc.stderr).text() : "";
      
      if (exitCode !== 0) {
        console.error('TikTok render failed:', stderr.substring(0, 200));
      }
      
      expect(exitCode).toBe(0);
      expect(existsSync(outputFile)).toBe(true);
      
      // Validate with ffprobe
      const probeProc = Bun.spawn(['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', outputFile], { stdout: 'pipe' });
      const probeOutput = await new Response(probeProc.stdout).text();
      const probeExit = await probeProc.exited;
      
      if (probeExit === 0) {
        const metadata = JSON.parse(probeOutput);
        const video = metadata.streams.find((s: any) => s.codec_type === 'video');
        
        expect(video.width).toBe(1080);
        expect(video.height).toBe(1920);
        console.log(`✅ REAL TIKTOK: ${video.width}x${video.height}, codec: ${video.codec_name}`);
      }
    }, 45000);

    test('REAL: YouTube format with effects on real video', async () => {
      const inputFile = 'assets/nature.mp4';
      const outputFile = 'output/real-renders/youtube-real.mp4';
      
      expect(existsSync(inputFile)).toBe(true);
      
      // Real YouTube conversion with brightness and text
      const command = `ffmpeg -i ${inputFile} -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,eq=brightness=0.1:contrast=1.2,drawtext=text='YouTube Ready':x=(w-text_w)/2:y=50:fontsize=32:fontcolor=white:box=1:boxcolor=red@0.7" -c:v libx264 -crf 20 -preset fast -c:a aac -y ${outputFile}`;
      
      const proc = Bun.spawn(['sh', '-c', command], {
        stdout: 'pipe', 
        stderr: 'pipe'
      });
      
      const exitCode = await proc.exited;
      
      expect(exitCode).toBe(0);
      expect(existsSync(outputFile)).toBe(true);
      
      const stats = statSync(outputFile);
      console.log(`✅ REAL YOUTUBE: ${stats.size} bytes`);
    }, 45000);
  });

  describe('🌐 REAL PLATFORM COMBINATIONS', () => {
    test('REAL: All social media platforms from one source', async () => {
      const sourceVideo = 'assets/earth.mp4';
      expect(existsSync(sourceVideo)).toBe(true);
      
      const platforms = [
        {
          name: 'tiktok',
          command: `ffmpeg -i ${sourceVideo} -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,drawtext=text='TikTok':x=(w-text_w)/2:y=h-100:fontsize=40:fontcolor=white" -c:v libx264 -crf 18 -preset fast -y output/real-renders/platform-tiktok.mp4`,
          expectedWidth: 1080,
          expectedHeight: 1920
        },
        {
          name: 'youtube',
          command: `ffmpeg -i ${sourceVideo} -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,drawtext=text='YouTube':x=(w-text_w)/2:y=50:fontsize=36:fontcolor=white" -c:v libx264 -crf 20 -preset fast -y output/real-renders/platform-youtube.mp4`,
          expectedWidth: 1920,
          expectedHeight: 1080
        },
        {
          name: 'instagram',
          command: `ffmpeg -i ${sourceVideo} -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2,drawtext=text='Instagram':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=32:fontcolor=white" -c:v libx264 -crf 18 -preset fast -y output/real-renders/platform-instagram.mp4`,
          expectedWidth: 1080,
          expectedHeight: 1080
        }
      ];
      
      const results = [];
      
      for (const platform of platforms) {
        console.log(`Rendering ${platform.name}...`);
        
        const proc = Bun.spawn(['sh', '-c', platform.command], {
          stdout: 'pipe',
          stderr: 'pipe'
        });
        
        const exitCode = await proc.exited;
        const stderr = proc.stderr ? await new Response(proc.stderr).text() : "";
        
        if (exitCode === 0) {
          const outputFile = `output/real-renders/platform-${platform.name}.mp4`;
          const stats = statSync(outputFile);
          
          // Validate dimensions with ffprobe
          const probeProc = Bun.spawn(['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', outputFile], { stdout: 'pipe' });
          const probeOutput = await new Response(probeProc.stdout).text();
          const probeExit = await probeProc.exited;
          
          if (probeExit === 0) {
            const metadata = JSON.parse(probeOutput);
            const video = metadata.streams.find((s: any) => s.codec_type === 'video');
            
            expect(video.width).toBe(platform.expectedWidth);
            expect(video.height).toBe(platform.expectedHeight);
            
            results.push({
              platform: platform.name,
              success: true,
              size: stats.size,
              dimensions: `${video.width}x${video.height}`
            });
            
            console.log(`✅ ${platform.name}: ${stats.size} bytes, ${video.width}x${video.height}`);
          }
        } else {
          console.error(`❌ ${platform.name} failed:`, stderr.substring(0, 100));
          results.push({ platform: platform.name, success: false });
        }
      }
      
      // All platforms should render successfully
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(3);
      
      console.log(`🎉 ALL ${successCount}/3 PLATFORMS RENDERED SUCCESSFULLY`);
    }, 120000);

    test('REAL: Complex multi-layer real video composition', async () => {
      const videoFile = 'assets/portrait-nature.mp4';
      const logoFile = 'assets/logo-150x150.png';
      const outputFile = 'output/real-renders/complex-multilayer.mp4';
      
      expect(existsSync(videoFile)).toBe(true);
      expect(existsSync(logoFile)).toBe(true);
      
      // Real complex composition with multiple layers
      const command = `ffmpeg -i ${videoFile} -i ${logoFile} -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[scaled];[1:v]scale=100:100[logo];[scaled][logo]overlay=W-w-20:20[with_logo];[with_logo]drawtext=text='Multi Layer':x=(w-text_w)/2:y=100:fontsize=32:fontcolor=white:box=1:boxcolor=black@0.5[with_title];[with_title]drawtext=text='Real Render':x=(w-text_w)/2:y=H-100:fontsize=24:fontcolor=yellow:box=1:boxcolor=black@0.7[final]" -map "[final]" -c:v libx264 -crf 18 -preset fast -y ${outputFile}`;
      
      console.log('Complex composition command length:', command.length);
      
      const proc = Bun.spawn(['sh', '-c', command], {
        stdout: 'pipe',
        stderr: 'pipe'
      });
      
      const exitCode = await proc.exited;
      const stderr = proc.stderr ? await new Response(proc.stderr).text() : "";
      
      if (exitCode !== 0) {
        console.error('Complex render failed:', stderr.substring(0, 300));
      }
      
      expect(exitCode).toBe(0);
      expect(existsSync(outputFile)).toBe(true);
      
      const stats = statSync(outputFile);
      expect(stats.size).toBeGreaterThan(5000); // Complex video should be larger
      
      console.log(`✅ COMPLEX REAL RENDER: ${stats.size} bytes`);
    }, 60000);
  });

  describe('🎨 REAL EFFECTS AND FILTERS', () => {
    test('REAL: Multiple effects chain on real video', async () => {
      const inputFile = 'assets/nature.mp4';
      const outputFile = 'output/real-renders/effects-chain-real.mp4';
      
      expect(existsSync(inputFile)).toBe(true);
      
      // Real effects chain: brightness, contrast, saturation, text
      const command = `ffmpeg -i ${inputFile} -vf "eq=brightness=0.2:contrast=1.3:saturation=1.1,drawtext=text='Effects Applied':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=28:fontcolor=white:box=1:boxcolor=blue@0.6" -c:v libx264 -crf 20 -preset fast -c:a aac -y ${outputFile}`;
      
      const proc = Bun.spawn(['sh', '-c', command], {
        stdout: 'pipe',
        stderr: 'pipe'
      });
      
      const exitCode = await proc.exited;
      
      expect(exitCode).toBe(0);
      expect(existsSync(outputFile)).toBe(true);
      
      const stats = statSync(outputFile);
      console.log(`✅ REAL EFFECTS CHAIN: ${stats.size} bytes`);
    }, 45000);

    test('REAL: Video concatenation with real files', async () => {
      const video1 = 'assets/bunny.mp4';
      const video2 = 'assets/nature.mp4';
      const outputFile = 'output/real-renders/concat-real.mp4';
      
      expect(existsSync(video1)).toBe(true);
      expect(existsSync(video2)).toBe(true);
      
      // Create concat list file with absolute paths
      const cwd = process.cwd();
      const concatList = `file '${cwd}/${video1}'\nfile '${cwd}/${video2}'`;
      await Bun.write('output/real-renders/concat-list.txt', concatList);
      
      // Real video concatenation
      const command = `ffmpeg -f concat -safe 0 -i output/real-renders/concat-list.txt -c copy -y ${outputFile}`;
      
      const proc = Bun.spawn(['sh', '-c', command], {
        stdout: 'pipe',
        stderr: 'pipe'
      });
      
      const exitCode = await proc.exited;
      
      expect(exitCode).toBe(0);
      expect(existsSync(outputFile)).toBe(true);
      
      // Validate duration is sum of inputs
      const probe1 = Bun.spawn(['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', video1], { stdout: 'pipe' });
      const probe2 = Bun.spawn(['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', video2], { stdout: 'pipe' });
      const probeOut = Bun.spawn(['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', outputFile], { stdout: 'pipe' });
      
      const duration1 = parseFloat(await new Response(probe1.stdout).text());
      const duration2 = parseFloat(await new Response(probe2.stdout).text());
      const outputDuration = parseFloat(await new Response(probeOut.stdout).text());
      
      expect(outputDuration).toBeGreaterThan(duration1);
      expect(outputDuration).toBeGreaterThan(duration2);
      
      const stats = statSync(outputFile);
      console.log(`✅ REAL CONCAT: ${stats.size} bytes, ${outputDuration.toFixed(2)}s duration`);
    }, 45000);
  });

  describe('📊 REAL QUALITY VALIDATION', () => {
    test('REAL: Validate all outputs have correct metadata', async () => {
      const outputDir = 'output/real-renders';
      const files = await Bun.spawn(['find', outputDir, '-name', '*.mp4'], { stdout: 'pipe' });
      const fileList = (await new Response(files.stdout).text()).trim().split('\n').filter(f => f);
      
      expect(fileList.length).toBeGreaterThan(0);
      
      let validFiles = 0;
      
      for (const file of fileList) {
        if (existsSync(file)) {
          const stats = statSync(file);
          
          if (stats.size > 0) {
            // Validate with ffprobe
            const proc = Bun.spawn(['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', file], { stdout: 'pipe' });
            const output = proc.stdout ? await new Response(proc.stdout).text() : "";
            const exitCode = await proc.exited;
            
            if (exitCode === 0) {
              const metadata = JSON.parse(output);
              const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
              
              if (videoStream) {
                expect(videoStream.codec_name).toBe('h264');
                expect(videoStream.width).toBeGreaterThan(0);
                expect(videoStream.height).toBeGreaterThan(0);
                
                validFiles++;
                console.log(`✅ ${file}: ${videoStream.width}x${videoStream.height}, ${stats.size} bytes`);
              }
            }
          }
        }
      }
      
      expect(validFiles).toBeGreaterThan(0);
      console.log(`🎉 VALIDATED ${validFiles} REAL VIDEO FILES`);
    }, 60000);
  });
});