// Comprehensive D3 Mock for Jest
// This mock provides recursive chainable selection and simulation methods
// to support complex D3 interactions in tests without crashing.

// 1. Create the chainable object factory
// This implementation handles circular references (methods returning 'this')
// and specific return values for simulation getters/setters.
const createMockChainable = () => {
  const chainable = {
    // Selection methods
    select: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    data: jest.fn().mockReturnThis(),
    enter: jest.fn().mockReturnThis(),
    exit: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    merge: jest.fn().mockReturnThis(),
    each: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
    nodes: jest.fn().mockReturnThis(),
    node: jest.fn(),
    size: jest.fn(() => [0, 0]),

    // Attribute/Style methods
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    html: jest.fn().mockReturnThis(),
    classed: jest.fn().mockReturnThis(),

    // Event methods
    on: jest.fn().mockReturnThis(),

    // Transition methods
    transition: jest.fn().mockReturnThis(),
    duration: jest.fn().mockReturnThis(),
    delay: jest.fn().mockReturnThis(),
    ease: jest.fn().mockReturnThis(),

    // Simulation/Force methods
    force: jest.fn().mockReturnThis(),
    alpha: jest.fn().mockReturnThis(),
    alphaTarget: jest.fn().mockReturnThis(),
    restart: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(), // For some force implementations
    stop: jest.fn().mockReturnThis(),

    // Force specific configuration methods (return chaining)
    id: jest.fn().mockReturnThis(),
    distance: jest.fn().mockReturnThis(),
    distanceMax: jest.fn().mockReturnThis(),
    strength: jest.fn().mockReturnThis(),
    radius: jest.fn().mockReturnThis(),
    x: jest.fn().mockReturnThis(),
    y: jest.fn().mockReturnThis(), // For forceX/Y

    // Zoom/Drag methods
    scaleExtent: jest.fn().mockReturnThis(),
    translateExtent: jest.fn().mockReturnThis(),
    transform: jest.fn().mockReturnThis(),

    // Interaction helpers
    pointer: jest.fn(() => [0, 0]),
  };

  // Ensure all undefined propertes default to chainable if accessed dynamically, 
  // though Proxy is safer, explicit definition covers 99% of d3 usage.
  // We explicitly map 'mockReturnThis' to ensure they return the exact object instance.
  Object.keys(chainable).forEach(key => {
    // Only apply if it wasn't already defined as something else (e.g. pointer returns array)
    if (!chainable[key].getMockName || chainable[key].getMockName() === 'jest.fn()') {
      chainable[key].mockReturnValue(chainable);
    }
  });

  return chainable;
};

// Singleton instance for the chain
// We expose this so setupTests can restore it
export const mockChainable = createMockChainable();

// 2. Mock Zoom Identity with Transform Logic
export const zoomIdentity = {
  k: 1,
  x: 0,
  y: 0,
  scale: jest.fn().mockReturnThis(),
  translate: jest.fn().mockReturnThis(),
  toString: () => 'translate(0,0) scale(1)',
  apply: jest.fn(point => point),
  invert: jest.fn(point => point),
  // HIDDEN PROPERTY for restoration in setupTests.js
  // This allows us to recover the chainable mock instance even after resetModules
  _activeChainable: mockChainable
};
zoomIdentity.scale.mockReturnValue(zoomIdentity);
zoomIdentity.translate.mockReturnValue(zoomIdentity);

// 3. Export specific D3 top-level functions

// Selections
export const select = jest.fn(() => mockChainable);
export const selectAll = jest.fn(() => mockChainable);

// Scales
const createMockScale = () => {
  const scale = jest.fn(val => val);
  scale.domain = jest.fn().mockReturnThis();
  scale.range = jest.fn().mockReturnThis();
  scale.interpolator = jest.fn().mockReturnThis();
  scale.clamp = jest.fn().mockReturnThis();
  scale.nice = jest.fn().mockReturnThis();
  scale.ticks = jest.fn(() => []);
  scale.tickFormat = jest.fn(() => d => d);
  scale.copy = jest.fn(() => createMockScale());
  return scale;
};

export const scaleLinear = jest.fn(() => createMockScale());
export const scaleOrdinal = jest.fn(() => createMockScale());
export const scaleTime = jest.fn(() => createMockScale());
export const scaleSqrt = jest.fn(() => createMockScale());
export const scaleSequential = jest.fn(() => createMockScale());
export const interpolateReds = jest.fn();
export const schemeCategory10 = ['#1f77b4', '#ff7f0e'];

// Forces
export const forceSimulation = jest.fn(() => mockChainable);
export const forceLink = jest.fn(() => mockChainable);
export const forceManyBody = jest.fn(() => mockChainable);
export const forceCenter = jest.fn(() => mockChainable);
export const forceCollide = jest.fn(() => mockChainable);
export const forceX = jest.fn(() => mockChainable);
export const forceY = jest.fn(() => mockChainable);
export const forceRadial = jest.fn(() => mockChainable);

// Behaviors
export const zoom = jest.fn(() => mockChainable);
export const drag = jest.fn(() => mockChainable);

// Array Helpers
export const min = jest.fn((arr, fn) => {
  if (!arr || arr.length === 0) return undefined;
  const values = fn ? arr.map(fn) : arr;
  return Math.min(...values);
});

export const max = jest.fn((arr, fn) => {
  if (!arr || arr.length === 0) return undefined;
  const values = fn ? arr.map(fn) : arr;
  return Math.max(...values);
});

export const extent = jest.fn((arr, fn) => {
  if (!arr || arr.length === 0) return [undefined, undefined];
  const values = fn ? arr.map(fn) : arr;
  return [Math.min(...values), Math.max(...values)];
});

export const sum = jest.fn((arr, fn) => {
  if (!arr) return 0;
  const values = fn ? arr.map(fn) : arr;
  return values.reduce((a, b) => a + b, 0);
});

// Other
export const event = { transform: zoomIdentity }; // Legacy d3.event support if needed