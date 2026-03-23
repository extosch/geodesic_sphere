// Main initialization file
// Global variables and application entry point

// Three.js global objects
let scene, camera, renderer, controls;
let faceMesh, wireframeMesh;
let geodesicSphere;
let animationId;
let autoRotate = true;

// Test strut meshes
let testStrutFacesMesh = null;
let testStrutWireframeMesh = null;
let testStrutLabelMesh = null;

// Strut parameters (used by strut visualization and DXF export)
const strutParams = {
    L: 1.0,  // Main length
    B: 0.1,  // Width (semicircle radius = B/2)
    R: 0.02, // Hole radius
    color: 0x808080 // Gray (same as sphere faces)
};
