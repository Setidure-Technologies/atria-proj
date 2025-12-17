#!/usr/bin/env node

/**
 * CPU and Memory Profiler for Strength 360 Backend
 * 
 * This script profiles the backend server and generates detailed CPU/Memory usage reports.
 * Usage: npm run profile-backend
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Start the server with CPU profiler
const { spawn } = require('child_process');

console.log('🚀 Starting CPU profiling session...\n');
console.log('This will profile the backend for 30 seconds.');
console.log('Results will be saved to: profile-results/\n');

// Create results directory
const resultsDir = path.join(__dirname, 'profile-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const profileFile = path.join(resultsDir, `profile-${timestamp}.log`);
const resultsFile = path.join(resultsDir, `profile-results-${timestamp}.txt`);

console.log(`📊 Profile output: ${profileFile}`);
console.log(`📈 Analysis output: ${resultsFile}\n`);

// Start server with profiler
const serverProcess = spawn('node', ['--prof', 'server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, PROFILING: 'true' }
});

// Send test requests after delay
setTimeout(() => {
  console.log('\n📡 Sending test requests...\n');
  
  const requests = [
    { method: 'GET', path: '/api/health', count: 50 },
    { method: 'GET', path: '/api/stats', count: 20 },
    { method: 'POST', path: '/api/responses', count: 10 },
  ];

  let completed = 0;

  requests.forEach(({ method, path: urlPath, count }) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const options = {
          hostname: 'localhost',
          port: 5100,
          path: urlPath,
          method: method,
          headers: {
            'Content-Type': 'application/json',
          }
        };

        if (method === 'POST') {
          const postData = JSON.stringify({
            student_name: `Test User ${i}`,
            student_email: `test${i}@example.com`,
            responses: { '1': { selectedStatement: 'A' } },
            executing_score: Math.random() * 50,
            influencing_score: Math.random() * 50,
            relationship_building_score: Math.random() * 50,
            strategic_thinking_score: Math.random() * 50,
            primary_talent_domain: 'Executing'
          });

          const req = http.request(options, (res) => {
            completed++;
          });

          req.write(postData);
          req.end();
        } else {
          http.request(options, (res) => {
            completed++;
          }).end();
        }
      }, i * 10);
    }
  });

  // Stop profiling after requests are done
  setTimeout(() => {
    console.log(`\n✅ ${completed} requests completed`);
    console.log('🛑 Stopping server and processing profile...\n');
    
    serverProcess.kill();
  }, 5000);
}, 2000);

// Handle process termination
serverProcess.on('exit', () => {
  console.log('Processing CPU profile...\n');
  
  // Find the isolate log file
  const files = fs.readdirSync(__dirname).filter(f => f.startsWith('isolate-'));
  
  if (files.length === 0) {
    console.log('⚠️  No profile data found. Server may not have run long enough.');
    process.exit(1);
  }

  const isolateFile = path.join(__dirname, files[0]);
  const processCmd = `node --prof-process ${isolateFile} > ${resultsFile}`;

  console.log(`📊 Generating report: ${processCmd}\n`);
  
  require('child_process').execSync(processCmd, { stdio: 'inherit' });

  // Print summary
  console.log('\n✅ Profiling complete!\n');
  console.log('📄 Full results saved to:', resultsFile);
  console.log('\n📊 Profile Summary:');
  console.log('   - CPU usage by function');
  console.log('   - Memory allocation');
  console.log('   - GC activity');
  console.log('   - Total execution time\n');

  // Clean up isolate file
  fs.unlinkSync(isolateFile);
  console.log('🧹 Cleaned up temporary files\n');
});
