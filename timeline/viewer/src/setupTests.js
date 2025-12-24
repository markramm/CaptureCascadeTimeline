// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver for scroll-based features
global.IntersectionObserver = class IntersectionObserver {
  disconnect() { }
  observe() { }
  unobserve() { }
  takeRecords() {
    return [];
  }
};

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock Canvas for TimelineMinimap
// Mock Canvas for TimelineMinimap - Ensure it persists across tests
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => {
    return {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      setLineDash: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
    };
  });
});

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn().mockReturnValue({
    result: {
      objectStoreNames: { contains: jest.fn() },
      createObjectStore: jest.fn(),
      transaction: jest.fn(),
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onsuccess: null,
    onerror: null,
  }),
};
global.indexedDB = mockIndexedDB;

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      total_events: 100,
      total_sources: 50,
      date_range: { start: '1990', end: '2024' },
      total_tags: 10,
      total_actors: 20
    })
  })
);
// This ensures that even if tests call jest.resetMocks(), our sophisticated 
// D3 mock (defined in __mocks__/d3.js) is restored to a working state.
beforeEach(() => {
  // We only attempt restoration if d3 is being used/mocked in the current test context
  try {
    const d3 = require('d3');

    // 1. Recover the chainable instance via the hidden property
    // (See src/__mocks__/d3.js for the definition)
    const mockTransform = d3.zoomIdentity;
    const mockChainable = mockTransform ? mockTransform._activeChainable : null;

    if (mockChainable) {
      // Restore recursive chainability
      Object.keys(mockChainable).forEach(key => {
        if (typeof mockChainable[key] === 'function' && mockChainable[key].mockReturnValue) {
          mockChainable[key].mockReturnValue(mockChainable);
        }
      });

      // Restore specific non-chainable return values if necessary
      if (mockChainable.size) mockChainable.size.mockReturnValue([0, 0]);
      if (mockChainable.pointer) mockChainable.pointer.mockReturnValue([0, 0]);
    }

    if (mockTransform) {
      // Restore ZoomIdentity methods
      if (mockTransform.scale && mockTransform.scale.mockReturnValue) mockTransform.scale.mockReturnValue(mockTransform);
      if (mockTransform.translate && mockTransform.translate.mockReturnValue) mockTransform.translate.mockReturnValue(mockTransform);
    }

    // 2. Restore Global Selection/Simulation Factories
    // These must return the chainable instance or dedicated sub-mocks

    // Selections
    if (d3.select && d3.select.mockReturnValue) d3.select.mockReturnValue(mockChainable);
    if (d3.selectAll && d3.selectAll.mockReturnValue) d3.selectAll.mockReturnValue(mockChainable);

    // Forces
    const forceMethods = [
      'forceSimulation', 'forceLink', 'forceManyBody', 'forceCenter',
      'forceCollide', 'forceX', 'forceY', 'forceRadial'
    ];
    forceMethods.forEach(method => {
      if (d3[method] && d3[method].mockReturnValue) d3[method].mockReturnValue(mockChainable);
    });

    // Behaviors
    if (d3.drag && d3.drag.mockReturnValue) d3.drag.mockReturnValue(mockChainable);
    if (d3.zoom && d3.zoom.mockReturnValue) d3.zoom.mockReturnValue(mockChainable);

    // Scales (Use a fresh simple scale factory)
    const restoreScale = (scaleFn) => {
      if (scaleFn && scaleFn.mockImplementation) {
        scaleFn.mockImplementation(() => {
          const s = jest.fn(val => val);
          s.domain = jest.fn().mockReturnThis();
          s.range = jest.fn().mockReturnThis();
          s.interpolator = jest.fn().mockReturnThis();
          s.clamp = jest.fn().mockReturnThis();
          s.nice = jest.fn().mockReturnThis();
          s.ticks = jest.fn(() => []);
          s.tickFormat = jest.fn(() => d => d);
          s.copy = jest.fn(() => s);
          return s;
        });
      }
    };

    restoreScale(d3.scaleLinear);
    restoreScale(d3.scaleOrdinal);
    restoreScale(d3.scaleTime);
    restoreScale(d3.scaleSqrt);
    restoreScale(d3.scaleSequential);

    // Array Helpers
    if (d3.min && d3.min.mockImplementation) {
      d3.min.mockImplementation((arr, fn) => {
        if (!arr || arr.length === 0) return undefined;
        const values = fn ? arr.map(fn) : arr;
        return Math.min(...values);
      });
    }
    if (d3.max && d3.max.mockImplementation) {
      d3.max.mockImplementation((arr, fn) => {
        if (!arr || arr.length === 0) return undefined;
        const values = fn ? arr.map(fn) : arr;
        return Math.max(...values);
      });
    }

  } catch (e) {
    // d3 might not be mocked in this test suite, ignore
  }
});