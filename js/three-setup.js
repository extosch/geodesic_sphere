// Three.js Setup and Controls
// Initialize scene, camera, renderer and handle user interactions

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
    camera.position.z = 3;
    
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
    document.getElementById('exportDxfBtn').addEventListener('click', exportTestStrutToDXF);
    document.getElementById('testDxfBtn').addEventListener('click', exportSimpleCircleDXF);
    document.getElementById('frequency').addEventListener('input', () => {
        updateConnectorOffsetDisplay();
        updateSphere();
    });
    document.getElementById('diameter').addEventListener('input', updateBuildInstructions);
    document.getElementById('diameter').addEventListener('change', updateBuildInstructions);
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
        camera.position.z = Math.max(1.5, Math.min(10, camera.position.z));
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
}

// Initialize application when DOM is loaded
window.addEventListener('load', init);
