// 2D Strut Visualization
// Creates and manages test strut display with capsule shape and holes
// Note: strutParams is defined globally in main.js

function createStrutShape(L, B, R) {
    const shape = new THREE.Shape();
    
    // Start at bottom-left of rectangle
    shape.moveTo(-L/2, -B/2);
    
    // Bottom edge to right
    shape.lineTo(L/2, -B/2);
    
    // Right semicircle (from bottom to top)
    shape.absarc(L/2, 0, B/2, -Math.PI/2, Math.PI/2, false);
    
    // Top edge to left
    shape.lineTo(-L/2, B/2);
    
    // Left semicircle (from top to bottom)
    shape.absarc(-L/2, 0, B/2, Math.PI/2, 3*Math.PI/2, false);
    
    // Add holes
    const hole1 = new THREE.Path();
    hole1.absarc(-L/2, 0, R, 0, Math.PI * 2, false);
    shape.holes.push(hole1);
    
    const hole2 = new THREE.Path();
    hole2.absarc(L/2, 0, R, 0, Math.PI * 2, false);
    shape.holes.push(hole2);
    
    return shape;
}

function showTestStrut() {
    // Remove existing test strut meshes if any
    if (testStrutFacesMesh) {
        scene.remove(testStrutFacesMesh);
    }
    if (testStrutWireframeMesh) {
        scene.remove(testStrutWireframeMesh);
    }
    
    // Create strut shape
    const shape = createStrutShape(strutParams.L, strutParams.B, strutParams.R);
    
    // Create geometry from shape (2D, no extrusion)
    const geometry = new THREE.ShapeGeometry(shape);
    
    // Create faces mesh
    const facesMaterial = new THREE.MeshBasicMaterial({ 
        color: strutParams.color,
        side: THREE.DoubleSide
    });
    testStrutFacesMesh = new THREE.Mesh(geometry, facesMaterial);
    testStrutFacesMesh.position.set(0, 0, 0);
    
    // Create wireframe mesh
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffffff,
        linewidth: 2
    });
    testStrutWireframeMesh = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    testStrutWireframeMesh.position.set(0, 0, 0);
    
    // Add to scene
    scene.add(testStrutFacesMesh);
    scene.add(testStrutWireframeMesh);
    
    // Remove existing label if any
    if (testStrutLabelMesh) {
        scene.remove(testStrutLabelMesh);
    }
    
    // Create text label as plane mesh (not sprite, so it doesn't billboard)
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'Bold 64px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('Type A', canvas.width / 2, canvas.height / 2);
    
    // Calculate text size to match DXF export
    // DXF text height is min(B * 0.85, 10mm) in real units
    // We need to scale from unit sphere to match
    const B = strutParams.B;
    const textHeightUnits = Math.min(B * 0.85, 0.1); // 85% of width, max 0.1 units
    const textWidthUnits = textHeightUnits * 4; // Aspect ratio 4:1 for "Type A"
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    
    const planeGeometry = new THREE.PlaneGeometry(textWidthUnits, textHeightUnits);
    testStrutLabelMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    testStrutLabelMesh.position.set(0, 0, 0.001); // Slightly above strut surface
    
    scene.add(testStrutLabelMesh);
    
    // Set visibility
    updateTestStrutVisibility();
}

function updateTestStrutVisibility() {
    const showFaces = document.getElementById('showTestStrutFaces').checked;
    const showWireframe = document.getElementById('showTestStrutWireframe').checked;
    
    if (testStrutFacesMesh) {
        testStrutFacesMesh.visible = showFaces;
    }
    if (testStrutWireframeMesh) {
        testStrutWireframeMesh.visible = showWireframe;
    }
}
