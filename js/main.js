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

// Connector wireframe (shows connector offset regions)
let connectorWireframeGroup = null;

// Connector struts (2D capsule components on connector edges)
let connectorStrutFacesGroup = null;
let connectorStrutWireframeGroup = null;

// Geometry mode: 'classic' (multiple strut types) or 'uniform' (single strut type)
let currentMode = 'classic';

// Base strut parameters (for Frequency 1)
// These scale with 1/frequency for higher frequencies
const baseStrutParams = {
    L: 1.0,  // Main length (will be set to edge length)
    B: 0.1,  // Width at Frequency 1 (semicircle radius = B/2)
    R: 0.02, // Hole radius at Frequency 1
    color: 0x808080 // Gray (same as sphere faces)
};

// Base strut width (for Frequency 1, in cm)
let baseStrutWidth = baseStrutParams.B * 50; // 0.1 * 50 = 5.0 cm

// Base connector offset (for Frequency 1, in cm)
let baseConnectorOffset = 7.0;

// Get scaled strut parameters based on current frequency
function getScaledStrutParams() {
    const frequency = parseInt(document.getElementById('frequency').value) || 1;
    const scale = 1.0 / frequency;
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    return {
        L: baseStrutParams.L,
        B: getScaledStrutWidth() / radius, // cm → unit-sphere
        R: baseStrutParams.R * scale,
        color: baseStrutParams.color
    };
}

// Get scaled strut width based on current frequency (returns cm)
function getScaledStrutWidth() {
    const frequency = parseInt(document.getElementById('frequency').value) || 1;
    return baseStrutWidth / frequency;
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

// Update the strut width UI field to show scaled value (in cm)
function updateStrutWidthDisplay() {
    const scaledWidth = getScaledStrutWidth();
    document.getElementById('strutWidth').value = scaledWidth.toFixed(1);
}

// Update base connector offset from UI field value (recalculate base from scaled value)
function updateBaseConnectorOffsetFromUI() {
    const frequency = parseInt(document.getElementById('frequency').value) || 1;
    const scaledValue = parseFloat(document.getElementById('connectorOffset').value) || 0;
    baseConnectorOffset = scaledValue * frequency;
}

// Update base strut width from UI field value (in cm, recalculate base from scaled value)
function updateBaseStrutWidthFromUI() {
    const frequency = parseInt(document.getElementById('frequency').value) || 1;
    const scaledValue = parseFloat(document.getElementById('strutWidth').value);
    baseStrutWidth = Math.max(0.1, isNaN(scaledValue) ? 0.1 : scaledValue) * frequency;
}
