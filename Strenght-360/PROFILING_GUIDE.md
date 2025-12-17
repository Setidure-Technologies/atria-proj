# Strength 360 - Profiling & Testing Guide

## Overview
This comprehensive test and profiling suite analyzes **CPU, Memory, and GPU** performance of the Strength 360 assessment platform.

## Components

### 1. **Unit Tests**

#### Frontend Tests (Jest)
- `src/__tests__/scoring.test.ts` - Scoring utility tests
- Tests calculation accuracy and performance
- 1000+ assessment calculations benchmark

**Run:**
```bash
npm test
npm test:watch  # Watch mode
```

#### Backend Tests (Supertest)
- `backend/__tests__/api.test.js` - API endpoint tests
- Health checks, response saving, statistics
- 100+ concurrent request performance test

**Run:**
```bash
cd backend
npm test
```

### 2. **CPU Profiling**

#### Backend CPU Profiler
- Profiles Node.js server for 30 seconds
- Generates V8 profile with function-level breakdown
- Identifies hot functions and bottlenecks

**Run:**
```bash
cd backend
npm run profile
npm run profile-process  # Process results
```

**Output:**
- `backend/profile-results/profile-*.log`
- `backend/profile-results/profile-results-*.txt` (analysis)

#### Frontend CPU Profiling (via Chrome DevTools)
1. Open Chrome DevTools (F12)
2. Performance tab
3. Click Record
4. Interact with assessment
5. Click Stop to see timeline and function breakdown

### 3. **Memory Profiling**

#### Node.js Memory Tracking
```bash
cd backend
node --trace-gc server.js  # Show garbage collection
node --max-old-space-size=4096 server.js  # Set heap size
```

#### Chrome DevTools Memory Tab
1. DevTools → Memory
2. Take heap snapshot
3. Compare snapshots before/after operations
4. Identify memory leaks

### 4. **GPU Analysis**

#### Frontend GPU (Browser Rendering)
Chrome DevTools → Performance tab shows:
- **Rasterize** - GPU rendering of pixels
- **Paint** - Element drawing
- **Composite** - Layer composition
- **GPU memory** usage

#### Backend GPU (Not typically used)
Node.js is CPU-bound. GPU acceleration would require:
- CUDA/OpenCL libraries (not applicable for web backend)
- Computational tasks are CPU-based

### 5. **Comprehensive Profiler Suite**

Run all tests and generate HTML report:

```bash
node profiler.js
```

**Output:** Interactive HTML report with:
- System information
- Test results
- Memory metrics
- CPU performance
- GPU notes
- Recommendations

---

## Performance Metrics Explained

### CPU
- **Function execution time** - How long each function takes
- **Call count** - How many times it runs
- **Self time** - Time spent in function vs. called functions
- **Total time** - Time including nested calls

### Memory
- **Heap Used** - Active memory consumption
- **Heap Total** - Total allocated heap
- **External** - Off-heap memory (buffers, etc.)
- **GC Time** - Garbage collection pauses

### GPU
- **Rasterize Time** - GPU pixel rendering
- **Paint Operations** - Element drawing cost
- **Composite Time** - Layer merging
- **FPS** - Frames per second (should be 60+)

---

## Benchmarks

### Scoring Algorithm
- **1000 assessments:** ~500ms (0.5ms per assessment)
- **Concurrent (100 parallel):** <1000ms
- **Target:** <1ms per assessment ✅

### API Performance
- **100 health checks:** <500ms average
- **Concurrent responses:** Handles 50+ simultaneous requests
- **PDF generation:** 2-3 seconds per report

---

## Optimization Tips

### Frontend
1. Use React.memo for expensive components
2. Implement virtualization for large lists
3. Lazy load images and code splitting
4. Monitor bundle size

### Backend
1. Connection pooling for database
2. Cache frequently accessed data
3. Use async/await for I/O
4. Monitor memory leaks with heap snapshots

### General
1. Minimize payload sizes
2. Implement gzip compression
3. Use CDN for static assets
4. Monitor with APM tools

---

## Tools Used

| Tool | Purpose | Command |
|------|---------|---------|
| **Jest** | Frontend unit testing | `npm test` |
| **Supertest** | API testing | `npm test` (backend) |
| **Node.js Profiler** | CPU analysis | `node --prof` |
| **Chrome DevTools** | Frontend CPU/GPU/Memory | F12 → Tabs |
| **Lighthouse** | Full page performance | DevTools → Lighthouse |

---

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm test

- name: Profile Backend
  run: cd backend && npm run profile

- name: Upload Results
  uses: actions/upload-artifact@v2
  with:
    name: profile-results
    path: backend/profile-results/
```

---

## Common Issues

### Tests Fail
- Install dependencies: `npm install` (frontend), `cd backend && npm install`
- Check Node.js version: `node --version` (v14+)
- Clear cache: `npm cache clean --force`

### Profile File Too Large
- Reduce profiling duration (modify profiler.js)
- Process smaller chunks
- Use sampling profiler instead

### Memory Keeps Growing
- Check for event listener leaks
- Verify timers are cleared
- Monitor with `--trace-gc`

---

## Further Reading

- [Node.js Profiling Guide](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Jest Documentation](https://jestjs.io/)
- [V8 Profiler](https://v8.dev/docs/profile)
