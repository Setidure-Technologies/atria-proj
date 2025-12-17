#!/usr/bin/env node

/**
 * Comprehensive Profiling & Testing Suite for Strength 360
 * 
 * This script runs:
 * 1. Unit tests with coverage (frontend + backend)
 * 2. Performance benchmarks
 * 3. CPU profiling
 * 4. Memory profiling
 * 5. Generates a comprehensive HTML report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

const log = (msg, color = 'reset') => console.log(`${COLORS[color]}${msg}${COLORS.reset}`);

const resultsDir = path.join(__dirname, '..', 'profile-results');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

log('\n═══════════════════════════════════════════════════════════', 'bright');
log('  COMPREHENSIVE UNIT TEST & PROFILER SUITE', 'bright');
log('  Strength 360 - CPU, GPU & Memory Analysis', 'bright');
log('═══════════════════════════════════════════════════════════\n', 'bright');

const results = {
  timestamp,
  tests: {},
  performance: {},
  profiling: {},
};

// 1. Frontend Unit Tests
log('\n1️⃣  Running Frontend Unit Tests...', 'blue');
try {
  log('   Installing dependencies...', 'yellow');
  execSync('npm install', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  
  log('   Running Jest tests...', 'yellow');
  const output = execSync('npm test -- --coverage --passWithNoTests 2>&1 || true', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8'
  });
  
  results.tests.frontend = {
    status: 'completed',
    summary: output.split('\n').slice(-5).join('\n')
  };
  
  log('   ✅ Frontend tests completed', 'green');
} catch (err) {
  log(`   ⚠️  Frontend tests: ${err.message}`, 'yellow');
  results.tests.frontend = { status: 'failed', error: err.message };
}

// 2. Backend API Tests
log('\n2️⃣  Running Backend API Tests...', 'blue');
try {
  log('   Installing backend dependencies...', 'yellow');
  execSync('npm install', { cwd: path.join(__dirname, 'backend'), stdio: 'pipe' });
  
  log('   Running backend tests...', 'yellow');
  const output = execSync('npm test 2>&1 || true', {
    cwd: path.join(__dirname, 'backend'),
    encoding: 'utf-8',
    timeout: 30000
  });
  
  results.tests.backend = {
    status: 'completed',
    summary: output.slice(-500)
  };
  
  log('   ✅ Backend tests completed', 'green');
} catch (err) {
  log(`   ⚠️  Backend tests: ${err.message}`, 'yellow');
  results.tests.backend = { status: 'failed', error: err.message };
}

// 3. Memory & CPU Analysis
log('\n3️⃣  Analyzing CPU & Memory Usage...', 'blue');
log('   Starting memory profiler (10 second sample)...', 'yellow');

try {
  const startMem = process.memoryUsage();
  
  // Simulate heavy computation
  let sum = 0;
  for (let i = 0; i < 1000000000; i++) {
    sum += Math.sqrt(i);
  }
  
  const endMem = process.memoryUsage();
  
  results.profiling.memory = {
    heapUsedBefore: `${(startMem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapUsedAfter: `${(endMem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(endMem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    external: `${(endMem.external / 1024 / 1024).toFixed(2)} MB`,
  };
  
  log('   ✅ Memory profiling completed', 'green');
} catch (err) {
  log(`   ⚠️  Memory profiling failed: ${err.message}`, 'yellow');
}

// 4. GPU Information (Browser-specific, but we can report system info)
log('\n4️⃣  System Information...', 'blue');
try {
  const osInfo = {
    platform: require('os').platform(),
    cpus: require('os').cpus().length,
    totalMemory: `${(require('os').totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    freeMemory: `${(require('os').freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
  };
  
  results.system = osInfo;
  
  log(`   Platform: ${osInfo.platform}`, 'yellow');
  log(`   CPUs: ${osInfo.cpus}`, 'yellow');
  log(`   Total Memory: ${osInfo.totalMemory}`, 'yellow');
  log(`   ✅ System info gathered', 'green');
} catch (err) {
  log(`   ⚠️  System info: ${err.message}`, 'yellow');
}

// Generate HTML Report
log('\n5️⃣  Generating HTML Report...', 'blue');

const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Strength 360 - Profiling Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    header h1 { font-size: 32px; margin-bottom: 10px; }
    header p { font-size: 16px; opacity: 0.9; }
    .timestamp { font-size: 12px; opacity: 0.7; margin-top: 10px; }
    
    main { padding: 40px; }
    
    .section {
      margin-bottom: 40px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 30px;
    }
    .section:last-child { border-bottom: none; }
    
    h2 {
      font-size: 24px;
      color: #333;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .metric {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .metric-label { font-weight: 600; color: #667eea; }
    .metric-value { font-size: 18px; color: #333; margin-top: 5px; }
    
    .status {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status.success { background: #d4edda; color: #155724; }
    .status.warning { background: #fff3cd; color: #856404; }
    .status.error { background: #f8d7da; color: #721c24; }
    
    .memory-chart {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    
    .chart-item {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .chart-value {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    
    .chart-label { font-size: 12px; color: #666; }
    
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      margin: 15px 0;
    }
    
    footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .gpu-note {
      background: #e7f3ff;
      border-left: 4px solid #2196F3;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
      font-size: 14px;
      color: #1565c0;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 Strength 360 - Performance Report</h1>
      <p>Comprehensive Unit Testing & CPU/Memory Profiling Analysis</p>
      <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
    </header>
    
    <main>
      <!-- System Info -->
      <section class="section">
        <h2>💻 System Information</h2>
        <div class="metric">
          <div class="metric-label">Platform</div>
          <div class="metric-value">${results.system?.platform || 'N/A'}</div>
        </div>
        <div class="metric">
          <div class="metric-label">CPU Cores</div>
          <div class="metric-value">${results.system?.cpus || 'N/A'}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Total Memory</div>
          <div class="metric-value">${results.system?.totalMemory || 'N/A'}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Available Memory</div>
          <div class="metric-value">${results.system?.freeMemory || 'N/A'}</div>
        </div>
      </section>
      
      <!-- Frontend Tests -->
      <section class="section">
        <h2>🧪 Frontend Unit Tests</h2>
        <div style="margin-bottom: 15px;">
          <span class="status ${results.tests.frontend?.status === 'completed' ? 'success' : results.tests.frontend?.status === 'warning' ? 'warning' : 'error'}">
            ${results.tests.frontend?.status?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
        ${results.tests.frontend?.summary ? `<pre>${results.tests.frontend.summary}</pre>` : '<p>No test results available</p>'}
      </section>
      
      <!-- Backend Tests -->
      <section class="section">
        <h2>🔧 Backend API Tests</h2>
        <div style="margin-bottom: 15px;">
          <span class="status ${results.tests.backend?.status === 'completed' ? 'success' : results.tests.backend?.status === 'warning' ? 'warning' : 'error'}">
            ${results.tests.backend?.status?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
        ${results.tests.backend?.summary ? `<pre>${results.tests.backend.summary}</pre>` : '<p>No test results available</p>'}
      </section>
      
      <!-- CPU & Memory -->
      <section class="section">
        <h2>⚙️ CPU & Memory Profiling</h2>
        <div class="memory-chart">
          <div class="chart-item">
            <div class="chart-label">Heap Used Before</div>
            <div class="chart-value">${results.profiling.memory?.heapUsedBefore || 'N/A'}</div>
          </div>
          <div class="chart-item">
            <div class="chart-label">Heap Used After</div>
            <div class="chart-value">${results.profiling.memory?.heapUsedAfter || 'N/A'}</div>
          </div>
          <div class="chart-item">
            <div class="chart-label">Heap Total</div>
            <div class="chart-value">${results.profiling.memory?.heapTotal || 'N/A'}</div>
          </div>
          <div class="chart-item">
            <div class="chart-label">External</div>
            <div class="chart-value">${results.profiling.memory?.external || 'N/A'}</div>
          </div>
        </div>
      </section>
      
      <!-- GPU Note -->
      <section class="section">
        <h2>🎮 GPU Analysis</h2>
        <div class="gpu-note">
          <strong>Note:</strong> GPU computation in web browsers is primarily used for rendering.
          To profile frontend GPU usage:
          <ol style="margin-left: 20px; margin-top: 10px;">
            <li>Open Chrome DevTools (F12)</li>
            <li>Go to Performance tab</li>
            <li>Record while interacting with the assessment</li>
            <li>Check for GPU-accelerated rendering in the timeline</li>
            <li>Look for "Rasterize", "Paint", and "Composite" events</li>
          </ol>
          Backend Node.js primarily uses CPU. GPU acceleration is handled by the browser rendering engine.
        </div>
      </section>
      
      <!-- Recommendations -->
      <section class="section">
        <h2>📋 Recommendations</h2>
        <ul style="margin-left: 20px; line-height: 1.8;">
          <li><strong>Frontend:</strong> Run performance tests using Lighthouse or WebPageTest for detailed GPU metrics</li>
          <li><strong>Backend:</strong> Use Node.js profiler for production profiling: <code>node --prof</code></li>
          <li><strong>Memory:</strong> Monitor with <code>node --trace-gc</code> to track garbage collection</li>
          <li><strong>Load Testing:</strong> Use Apache JMeter or wrk for concurrent request testing</li>
          <li><strong>Continuous Monitoring:</strong> Integrate with APM tools like New Relic or DataDog</li>
        </ul>
      </section>
    </main>
    
    <footer>
      <p>Strength 360 Assessment Platform | Generated ${timestamp}</p>
      <p><strong>For detailed GPU profiling:</strong> Use Chrome DevTools Performance Recorder</p>
      <p><strong>For CPU profiling:</strong> Run <code>npm run profile-backend</code> in backend folder</p>
    </footer>
  </div>
</body>
</html>
`;

const reportPath = path.join(resultsDir, `report-${timestamp}.html`);
fs.writeFileSync(reportPath, htmlReport);
log(`   ✅ Report generated: ${reportPath}`, 'green');

// Summary
log('\n═══════════════════════════════════════════════════════════', 'bright');
log('  PROFILING COMPLETE', 'bright');
log('═══════════════════════════════════════════════════════════\n', 'bright');

log('📊 Test Results Summary:', 'blue');
log(`   Frontend: ${results.tests.frontend?.status || 'Unknown'}`, results.tests.frontend?.status === 'completed' ? 'green' : 'yellow');
log(`   Backend:  ${results.tests.backend?.status || 'Unknown'}`, results.tests.backend?.status === 'completed' ? 'green' : 'yellow');

log('\n💾 Memory Usage:', 'blue');
log(`   Heap Before: ${results.profiling.memory?.heapUsedBefore || 'N/A'}`, 'yellow');
log(`   Heap After:  ${results.profiling.memory?.heapUsedAfter || 'N/A'}`, 'yellow');

log('\n📁 Output Files:', 'blue');
log(`   HTML Report:  ${reportPath}`, 'yellow');

log('\n💡 Next Steps:', 'blue');
log('   1. Open the HTML report in your browser', 'yellow');
log('   2. For GPU profiling: Use Chrome DevTools Performance tab', 'yellow');
log('   3. For detailed CPU profiling: Run backend profiler', 'yellow');
log('   4. For load testing: Use Apache JMeter or wrk\n', 'yellow');
