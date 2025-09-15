import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { useSupabaseDataMock } from './mocks/useSupabaseData.mock';

// Mock do módulo useSupabaseData
vi.mock('@/hooks/useSupabaseData', () => useSupabaseDataMock);

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// Mock para window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock para ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock para IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: () => [],
}));

// Mock para scrollTo
window.scrollTo = vi.fn();

// Mock para Notification API
global.Notification = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
})) as any;

// @ts-ignore
global.Notification.permission = 'granted';
// @ts-ignore
global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
