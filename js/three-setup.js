// Three.js Setup and Controls
// Initialize scene, camera, renderer and handle user interactions

// Zoom limits, shared by the initial framing and the mouse wheel
const ZOOM_MIN = 1.5;
const ZOOM_MAX = 10;

// Camera distance at which the unit sphere fills SPHERE_FILL of the tighter
// viewport dimension. Computed rather than fixed: the control panel has a set
// width, so on a narrow window the canvas ends up taller than wide and the
// horizontal field of view — not the vertical one — becomes the limit. A fixed
// distance tuned on a desktop clips the sphere on a phone.
const SPHERE_FILL = 0.78;

function framingDistance(fill = SPHERE_FILL) {
    const vFovHalf = (camera.fov * Math.PI) / 180 / 2;
    const tightHalf = camera.aspect >= 1
        ? vFovHalf
        : Math.atan(Math.tan(vFovHalf) * camera.aspect);
    const distance = 1 / (fill * Math.tan(tightHalf));
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, distance));
}

function init() {
    const container = document.getElementById('canvas-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = framingDistance();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Cap the pixel ratio: phones report 3 and up, which would render the
    // several hundred extruded struts at nine times the pixel count for no
    // visible gain
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Controls (OrbitControls simulation with simple implementation)
    setupControls();
    
    // Initial sphere
    updateSphere();
    
    // Update UI display for scaled connector offset
    updateConnectorOffsetDisplay();
    updateStrutWidthDisplay();

    // Adopt the checkbox default declared in index.html, so the markup stays
    // the single source of truth for it
    autoRotate = document.getElementById('autoRotate').checked;

    // Event Listeners
    document.getElementById('showFaces').addEventListener('change', updateVisibility);
    document.getElementById('showEdgesWireframe').addEventListener('change', updateVisibility);
    document.getElementById('autoRotate').addEventListener('change', (e) => {
        autoRotate = e.target.checked;
    });
    document.getElementById('showCenterTestStrut').addEventListener('change', updateTestStrutVisibility);
    document.getElementById('showEdgeStrutsFaces').addEventListener('change', updateTestStrutVisibility);
    document.getElementById('showEdgeStrutsWireframe').addEventListener('change', updateTestStrutVisibility);
    document.getElementById('showConnectorsWireframe').addEventListener('change', updateConnectorVisibility);
    document.getElementById('showConnectorStrutsFaces').addEventListener('change', updateConnectorStrutsVisibility);
    document.getElementById('showConnectorStrutsWireframe').addEventListener('change', updateConnectorStrutsVisibility);
    document.getElementById('geometryMode').addEventListener('change', (e) => {
        currentMode = e.target.value;
        updateSphere();
    });
    document.getElementById('exportAllDxfBtn').addEventListener('click', exportAllDXF);
    document.getElementById('exportSTLBtn').addEventListener('click', exportSTL);
    document.getElementById('exportBatchSTLBtn').addEventListener('click', exportBatchSTL);
    document.getElementById('frequency').addEventListener('input', () => {
        updateConnectorOffsetDisplay();
        updateStrutWidthDisplay();
        updateSphere();
    });
    document.getElementById('diameter').addEventListener('input', () => {
        updateBuildInstructions();
        updateSphere();
    });
    document.getElementById('diameter').addEventListener('change', () => {
        updateBuildInstructions();
        updateSphere();
    });
    document.getElementById('connectorOffset').addEventListener('input', () => {
        updateBaseConnectorOffsetFromUI();
        updateBuildInstructions();
        updateSphere(); // Update 3D visualization with shortened struts
    });
    document.getElementById('connectorOffset').addEventListener('change', () => {
        updateBaseConnectorOffsetFromUI();
        updateBuildInstructions();
        updateSphere(); // Update 3D visualization with shortened struts
    });
    document.getElementById('strutWidth').addEventListener('input', () => {
        updateBaseStrutWidthFromUI();
        updateSphere();
    });
    document.getElementById('strutWidth').addEventListener('change', () => {
        updateBaseStrutWidthFromUI();
        updateSphere();
    });
    
    window.addEventListener('resize', onWindowResize);
    
    // Show test strut
    showTestStrut();
    
    // Animation
    animate();
}

const ROTATION_SPEED = 0.005;
const PAN_SPEED = 0.002;
const PINCH_SPEED = 0.015;

// The visualization groups are siblings rather than children of a shared
// pivot, so each carries its own rotation and they have to be brought back
// into step by hand after faceMesh moves.
function syncRotation() {
    const groups = [
        wireframeMesh, testStrutFacesMesh, testStrutWireframeMesh,
        testStrutLabelMesh, edgeStrutFacesGroup, edgeStrutWireframeGroup,
        connectorWireframeGroup, connectorStrutFacesGroup,
        connectorStrutWireframeGroup
    ];
    for (const group of groups) {
        if (!group) continue;
        group.rotation.y = faceMesh.rotation.y;
        group.rotation.x = faceMesh.rotation.x;
    }
}

// Rotate the whole assembly by a pointer movement given in pixels
function rotateBy(deltaX, deltaY) {
    faceMesh.rotation.y += deltaX * ROTATION_SPEED;
    faceMesh.rotation.x += deltaY * ROTATION_SPEED;
    syncRotation();
}

function panBy(deltaX, deltaY) {
    camera.position.x -= deltaX * PAN_SPEED;
    camera.position.y += deltaY * PAN_SPEED;
}

function zoomBy(delta) {
    camera.position.z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camera.position.z + delta));
}

function setupControls() {
    const canvas = renderer.domElement;
    let isDragging = false;
    let isPanning = false;
    let previousMousePosition = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
            isDragging = true;
        } else if (e.button === 2) { // Right mouse button
            isPanning = true;
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    canvas.addEventListener('mousemove', (e) => {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        if (isDragging && faceMesh) {
            rotateBy(deltaX, deltaY);
        } else if (isPanning) {
            panBy(deltaX, deltaY);
        }

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        isPanning = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        isPanning = false;
    });
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        zoomBy(e.deltaY * 0.001);
    });

    // Touch: one finger rotates, two fingers pinch to zoom and drag to pan.
    // preventDefault stops the browser from scrolling the page or triggering
    // its own pinch-zoom while a gesture is on the canvas; the controls sit
    // below the canvas on narrow layouts, so the page stays scrollable there.
    let touchPrevious = null;
    let pinchPrevious = 0;

    const centroid = (touches) => {
        const second = touches[1] || touches[0];
        return {
            x: (touches[0].clientX + second.clientX) / 2,
            y: (touches[0].clientY + second.clientY) / 2
        };
    };
    const spread = (touches) => Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
    );

    const beginTouch = (e) => {
        touchPrevious = e.touches.length ? centroid(e.touches) : null;
        pinchPrevious = e.touches.length >= 2 ? spread(e.touches) : 0;
    };

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        beginTouch(e);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!touchPrevious || !e.touches.length) return;

        const current = centroid(e.touches);
        const deltaX = current.x - touchPrevious.x;
        const deltaY = current.y - touchPrevious.y;

        if (e.touches.length === 1) {
            if (faceMesh) rotateBy(deltaX, deltaY);
        } else {
            const currentSpread = spread(e.touches);
            if (pinchPrevious > 0) {
                zoomBy((pinchPrevious - currentSpread) * PINCH_SPEED);
            }
            pinchPrevious = currentSpread;
            panBy(deltaX, deltaY);
        }

        touchPrevious = current;
    }, { passive: false });

    // Recompute from the remaining touches: lifting one finger of a pinch must
    // not make the other finger jump the model by the centroid difference.
    canvas.addEventListener('touchend', beginTouch);
    canvas.addEventListener('touchcancel', beginTouch);
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function animate() {
    animationId = requestAnimationFrame(animate);
    
    // Auto-Rotation
    if (faceMesh && autoRotate) {
        faceMesh.rotation.y += 0.005;
        syncRotation();
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Pull back if the new aspect would clip the sphere — a phone turned from
    // landscape to portrait, say. Only ever moves away, so a deliberate
    // zoom-in by the user survives a resize.
    camera.position.z = Math.max(camera.position.z, framingDistance(1.0));
}

// Initialize application when DOM is loaded
window.addEventListener('load', init);
