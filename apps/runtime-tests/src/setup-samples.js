import { SampleDownloader } from './sample-downloader.js';

/**
 * Setup script for sample files
 */
async function setup() {
  const downloader = new SampleDownloader();
  await downloader.setup();
  downloader.listSamples();
}

setup().catch(console.error);