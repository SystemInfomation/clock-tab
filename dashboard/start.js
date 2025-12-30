// Simple start script for Cloud Run
// Handles PORT environment variable correctly
const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || '8080';

console.log(`Starting Next.js on port ${port}...`);

// Use local Next.js installation from node_modules
const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
const nextProcess = spawn(nextBin, ['start', '-p', port], {
  stdio: 'inherit',
  shell: false,
  env: process.env
});

nextProcess.on('error', (error) => {
  console.error('Failed to start Next.js:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
});

