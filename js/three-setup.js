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
    renderer.setPixelRatio(window.devicePixelRatio);
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

function setupControls() {
    const canvas = renderer.domElement;
    let isDragging = false;
    let isPanning = false;
    let previousMousePosition = { x: 0, y: 0 };
    const rotationSpeed = 0.005;
    const panSpeed = 0.002;
    
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
            isDragging = true;
        } else if (e.button === 2) { // Right mouse button
            isPanning = true;
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging && faceMesh) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            faceMesh.rotation.y += deltaX * rotationSpeed;
            faceMesh.rotation.x += deltaY * rotationSpeed;
            
            if (wireframeMesh) {
                wireframeMesh.rotation.y = faceMesh.rotation.y;
                wireframeMesh.rotation.x = faceMesh.rotation.x;
            }
            if (testStrutFacesMesh) {
                testStrutFacesMesh.rotation.y = faceMesh.rotation.y;
                testStrutFacesMesh.rotation.x = faceMesh.rotation.x;
            }
            if (testStrutWireframeMesh) {
                testStrutWireframeMesh.rotation.y = faceMesh.rotation.y;
                testStrutWireframeMesh.rotation.x = faceMesh.rotation.x;
            }
            if (testStrutLabelMesh) {
                testStrutLabelMesh.rotation.y = faceMesh.rotation.y;
                testStrutLabelMesh.rotation.x = faceMesh.rotation.x;
            }
            if (edgeStrutFacesGroup) {
                edgeStrutFacesGroup.rotation.y = faceMesh.rotation.y;
                edgeStrutFacesGroup.rotation.x = faceMesh.rotation.x;
            }
            if (edgeStrutWireframeGroup) {
                edgeStrutWireframeGroup.rotation.y = faceMesh.rotation.y;
                edgeStrutWireframeGroup.rotation.x = faceMesh.rotation.x;
            }
            if (connectorWireframeGroup) {
                connectorWireframeGroup.rotation.y = faceMesh.rotation.y;
                connectorWireframeGroup.rotation.x = faceMesh.rotation.x;
            }
            if (connectorStrutFacesGroup) {
                connectorStrutFacesGroup.rotation.y = faceMesh.rotation.y;
                connectorStrutFacesGroup.rotation.x = faceMesh.rotation.x;
            }
            if (connectorStrutWireframeGroup) {
                connectorStrutWireframeGroup.rotation.y = faceMesh.rotation.y;
                connectorStrutWireframeGroup.rotation.x = faceMesh.rotation.x;
            }
        } else if (isPanning) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            camera.position.x -= deltaX * panSpeed;
            camera.position.y += deltaY * panSpeed;
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
        const delta = e.deltaY * 0.001;
        camera.position.z += delta;
        camera.position.z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camera.position.z));
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function animate() {
    animationId = requestAnimationFrame(animate);
    
    // Auto-Rotation
    if (faceMesh && autoRotate) {
        faceMesh.rotation.y += 0.005;
        if (wireframeMesh) {
            wireframeMesh.rotation.y = faceMesh.rotation.y;
            wireframeMesh.rotation.x = faceMesh.rotation.x;
        }
        if (testStrutFacesMesh) {
            testStrutFacesMesh.rotation.y = faceMesh.rotation.y;
            testStrutFacesMesh.rotation.x = faceMesh.rotation.x;
        }
        if (testStrutWireframeMesh) {
            testStrutWireframeMesh.rotation.y = faceMesh.rotation.y;
            testStrutWireframeMesh.rotation.x = faceMesh.rotation.x;
        }
        if (testStrutLabelMesh) {
            testStrutLabelMesh.rotation.y = faceMesh.rotation.y;
            testStrutLabelMesh.rotation.x = faceMesh.rotation.x;
        }
        if (edgeStrutFacesGroup) {
            edgeStrutFacesGroup.rotation.y = faceMesh.rotation.y;
            edgeStrutFacesGroup.rotation.x = faceMesh.rotation.x;
        }
        if (edgeStrutWireframeGroup) {
            edgeStrutWireframeGroup.rotation.y = faceMesh.rotation.y;
            edgeStrutWireframeGroup.rotation.x = faceMesh.rotation.x;
        }
        if (connectorWireframeGroup) {
            connectorWireframeGroup.rotation.y = faceMesh.rotation.y;
            connectorWireframeGroup.rotation.x = faceMesh.rotation.x;
        }
        if (connectorStrutFacesGroup) {
            connectorStrutFacesGroup.rotation.y = faceMesh.rotation.y;
            connectorStrutFacesGroup.rotation.x = faceMesh.rotation.x;
        }
        if (connectorStrutWireframeGroup) {
            connectorStrutWireframeGroup.rotation.y = faceMesh.rotation.y;
            connectorStrutWireframeGroup.rotation.x = faceMesh.rotation.x;
        }
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
