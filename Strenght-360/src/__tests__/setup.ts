// Jest setup file for DOM and global mocks
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch if needed
if (!global.fetch) {
  global.fetch = jest.fn();
}
