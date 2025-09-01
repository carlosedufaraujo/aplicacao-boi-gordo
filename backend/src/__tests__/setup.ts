import { jest } from '@jest/globals';

// Setup test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Redis
jest.mock('../config/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  },
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    clearPattern: jest.fn(),
  }
}));

// Global test timeout
jest.setTimeout(10000);