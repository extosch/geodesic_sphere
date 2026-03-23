// Main initialization file
// Global variables and application entry point

// Three.js global objects
let scene, camera, renderer, controls;
let faceMesh, wireframeMesh;
let geodesicSphere;
let animationId;
let autoRotate = false;

// Test strut meshes (single strut at center)
let testStrutFacesMesh = null;
let testStrutWireframeMesh = null;
let testStrutLabelMesh = null;

// Edge struts (struts on all edges of sphere)
let edgeStrutFacesGroup = null;
let edgeStrutWireframeGroup = null;

// Base strut parameters (for Frequency 1)
// These scale with 1/frequency for higher frequencies
const baseStrutParams = {
    L: 1.0,  // Main length (will be set to edge length)
    B: 0.1,  // Width at Frequency 1 (semicircle radius = B/2)
    R: 0.02, // Hole radius at Frequency 1
    color: 0x808080 // Gray (same as sphere faces)
};

// Base connector offset (for Frequency 1, in cm)
let baseConnectorOffset = 7.0;

// Get scaled strut parameters based on current frequency
function getScaledStrutParams() {
    const frequency = parseInt(document.getElementById('frequency').value) || 1;
    const scale = 1.0 / frequency;
    return {
        L: baseStrutParams.L,
        B: baseStrutParams.B * scale,
        R: baseStrutParams.R * scale,
        color: baseStrutParams.color
    };
}

// Get scaled connector offset based on current frequency
function getScaledConnectorOffset() {
    const frequency = parseInt(document.getElementById('frequency').value) || 1;
    return baseConnectorOffset / frequency;
}

// Update the connector offset UI field to show scaled value
function updateConnectorOffsetDisplay() {
    const scaledOffset = getScaledConnectorOffset();
    document.getElementById('connectorOffset').value = scaledOffset.toFixed(2);
}

// Update base connector offset from UI field value (recalculate base from scaled value)
function updateBaseConnectorOffsetFromUI() {
    const frequency = parseInt(document.getElementById('frequency').value) || 1;
    const scaledValue = parseFloat(document.getElementById('connectorOffset').value) || 0;
    baseConnectorOffset = scaledValue * frequency;
}
