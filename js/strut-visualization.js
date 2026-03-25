// 2D Strut Visualization
// Creates and manages test strut display with capsule shape and holes
// Note: baseStrutParams is defined globally in main.js, scaled by frequency

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
    
    // Get scaled parameters based on current frequency
    const strutParams = getScaledStrutParams();
    
    // In uniform mode, use L_min if sphere is available
    let strutL = strutParams.L;
    let labelText = 'Type A';
    if (currentMode === 'einheitsstrut' && geodesicSphere) {
        const connectorOffset = getScaledConnectorOffset();
        const diameter = parseFloat(document.getElementById('diameter').value) || 100;
        const offsetRatio = connectorOffset / (diameter / 2);
        const { L_min } = computeEdgeOffsets(geodesicSphere, offsetRatio);
        strutL = L_min;
        labelText = 'Einheitsstrut';
    }
    
    // Create strut shape
    const shape = createStrutShape(strutL, strutParams.B, strutParams.R);
    
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
    context.fillText(labelText, canvas.width / 2, canvas.height / 2);
    
    // Calculate text size to match DXF export
    // DXF text height is min(B * 0.85, 10mm) in real units
    // We need to scale from unit sphere to match
    const B = strutParams.B;
    const textHeightUnits = Math.min(B * 0.85, 0.1); // 85% of width, max 0.1 units
    const textWidthUnits = textHeightUnits * (labelText.length > 6 ? 5 : 4); // Wider for 'Einheitsstrut'
    
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
    const showCenter = document.getElementById('showCenterTestStrut').checked;
    const showEdgeFaces = document.getElementById('showEdgeStrutsFaces').checked;
    const showEdgeWireframe = document.getElementById('showEdgeStrutsWireframe').checked;
    
    // Control center test strut (faces, wireframe, and label)
    if (testStrutFacesMesh) {
        testStrutFacesMesh.visible = showCenter;
    }
    if (testStrutWireframeMesh) {
        testStrutWireframeMesh.visible = showCenter;
    }
    if (testStrutLabelMesh) {
        testStrutLabelMesh.visible = showCenter;
    }
    
    // Control edge struts separately
    if (edgeStrutFacesGroup) {
        edgeStrutFacesGroup.visible = showEdgeFaces;
    }
    if (edgeStrutWireframeGroup) {
        edgeStrutWireframeGroup.visible = showEdgeWireframe;
    }
}

// Compute per-edge offsets for uniform strut mode.
// Returns { L_min, edgeMap: Map<edgeStr, {shortenedLength, uniformOffset}> }
function computeEdgeOffsets(geodesicSphere, classicOffsetRatio) {
    const edgeMap = new Map();
    let L_min = Infinity;

    // Pass 1: compute all shortened edge lengths
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];
        const dx = v2[0] - v1[0], dy = v2[1] - v1[1], dz = v2[2] - v1[2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const dirX = dx / len, dirY = dy / len, dirZ = dz / len;
        const sx = v1[0] + dirX * classicOffsetRatio;
        const sy = v1[1] + dirY * classicOffsetRatio;
        const sz = v1[2] + dirZ * classicOffsetRatio;
        const ex = v2[0] - dirX * classicOffsetRatio;
        const ey = v2[1] - dirY * classicOffsetRatio;
        const ez = v2[2] - dirZ * classicOffsetRatio;
        const sdx = ex - sx, sdy = ey - sy, sdz = ez - sz;
        const shortenedLength = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);
        edgeMap.set(edgeStr, { shortenedLength, uniformOffset: 0 });
        if (shortenedLength < L_min) L_min = shortenedLength;
    }

    // Pass 2: compute per-edge uniform offset (classic offset + half excess)
    for (const [edgeStr, data] of edgeMap) {
        const excess = data.shortenedLength - L_min;
        data.uniformOffset = classicOffsetRatio + excess / 2;
    }

    return { L_min, edgeMap };
}

function showStrutsOnEdges() {
    // Remove existing edge struts if any
    if (edgeStrutFacesGroup) {
        scene.remove(edgeStrutFacesGroup);
    }
    if (edgeStrutWireframeGroup) {
        scene.remove(edgeStrutWireframeGroup);
    }
    
    if (!geodesicSphere) return;
    
    // Get scaled parameters based on current frequency
    const strutParams = getScaledStrutParams();
    
    // Create groups for all edge struts
    edgeStrutFacesGroup = new THREE.Group();
    edgeStrutWireframeGroup = new THREE.Group();
    
    // Get edge colors to match strut types
    const edgeColors = geodesicSphere.getEdgeColors();
    
    // Get connector offset for edge shortening
    const connectorOffset = getScaledConnectorOffset();
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const offsetRatio = connectorOffset / radius; // Convert to unit sphere ratio
    
    // Create a strut for each edge
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];
        
        // Calculate original edge vector
        const dx = v2[0] - v1[0];
        const dy = v2[1] - v1[1];
        const dz = v2[2] - v1[2];
        const originalLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Normalize direction
        const dirX = dx / originalLength;
        const dirY = dy / originalLength;
        const dirZ = dz / originalLength;
        
        // Calculate shortened edge endpoints (shorten from both ends)
        const start = [
            v1[0] + dirX * offsetRatio,
            v1[1] + dirY * offsetRatio,
            v1[2] + dirZ * offsetRatio
        ];
        
        const end = [
            v2[0] - dirX * offsetRatio,
            v2[1] - dirY * offsetRatio,
            v2[2] - dirZ * offsetRatio
        ];
        
        // Calculate shortened edge properties
        const shortenedDx = end[0] - start[0];
        const shortenedDy = end[1] - start[1];
        const shortenedDz = end[2] - start[2];
        const shortenedLength = Math.sqrt(shortenedDx * shortenedDx + shortenedDy * shortenedDy + shortenedDz * shortenedDz);
        
        // Calculate midpoint of shortened edge
        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;
        const midZ = (start[2] + end[2]) / 2;
        
        // Create strut shape with shortened edge length
        const shape = createStrutShape(shortenedLength, strutParams.B, strutParams.R);
        const geometry = new THREE.ShapeGeometry(shape);
        
        // Get color for this edge
        const edgeColor = edgeColors.get(edgeStr) || strutParams.color;
        
        // Create faces mesh
        const facesMaterial = new THREE.MeshBasicMaterial({ 
            color: edgeColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const facesMesh = new THREE.Mesh(geometry, facesMaterial);
        
        // Create wireframe mesh
        const wireframeGeometry = new THREE.EdgesGeometry(geometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            linewidth: 1
        });
        const wireframeMesh = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        
        // Position at midpoint
        facesMesh.position.set(midX, midY, midZ);
        wireframeMesh.position.set(midX, midY, midZ);
        
        // Build coordinate system for strut orientation:
        // X-axis: along edge (length direction)
        // Y-axis: tangential to sphere (width direction)
        // Z-axis: radial outward from sphere center (normal to surface)
        
        // X-axis = shortened edge direction (normalized)
        const xAxis = new THREE.Vector3(shortenedDx, shortenedDy, shortenedDz).normalize();
        
        // Z-axis = radial direction at midpoint (normalized)
        const zAxis = new THREE.Vector3(midX, midY, midZ).normalize();
        
        // Y-axis = Z cross X (tangential, perpendicular to both edge and radius)
        const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
        
        // Re-orthogonalize Z-axis to ensure perfect right-handed system
        // (in case edge and radius aren't perfectly perpendicular)
        zAxis.crossVectors(xAxis, yAxis).normalize();
        
        // Create rotation matrix from the three axes
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeBasis(xAxis, yAxis, zAxis);
        
        // Extract quaternion from matrix
        const quaternion = new THREE.Quaternion();
        quaternion.setFromRotationMatrix(rotationMatrix);
        
        facesMesh.quaternion.copy(quaternion);
        wireframeMesh.quaternion.copy(quaternion);
        
        // Add to groups
        edgeStrutFacesGroup.add(facesMesh);
        edgeStrutWireframeGroup.add(wireframeMesh);
    }
    
    // Add groups to scene
    scene.add(edgeStrutFacesGroup);
    scene.add(edgeStrutWireframeGroup);
    
    // Set visibility based on checkboxes
    updateTestStrutVisibility();
}

// Uniform strut mode: all struts have the same length (L_min)
function showStrutsOnEdgesUniform() {
    // Remove existing edge struts if any
    if (edgeStrutFacesGroup) scene.remove(edgeStrutFacesGroup);
    if (edgeStrutWireframeGroup) scene.remove(edgeStrutWireframeGroup);
    if (!geodesicSphere) return;

    const strutParams = getScaledStrutParams();
    const connectorOffset = getScaledConnectorOffset();
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const classicOffsetRatio = connectorOffset / radius;

    const { L_min, edgeMap } = computeEdgeOffsets(geodesicSphere, classicOffsetRatio);

    edgeStrutFacesGroup = new THREE.Group();
    edgeStrutWireframeGroup = new THREE.Group();

    // Single strut shape for all edges
    const shape = createStrutShape(L_min, strutParams.B, strutParams.R);

    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];

        const dx = v2[0] - v1[0], dy = v2[1] - v1[1], dz = v2[2] - v1[2];
        const originalLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const dirX = dx / originalLength, dirY = dy / originalLength, dirZ = dz / originalLength;

        // Per-edge uniform offset (classic offset + half excess)
        const uniformOffset = edgeMap.get(edgeStr).uniformOffset;

        const start = [
            v1[0] + dirX * uniformOffset,
            v1[1] + dirY * uniformOffset,
            v1[2] + dirZ * uniformOffset
        ];
        const end = [
            v2[0] - dirX * uniformOffset,
            v2[1] - dirY * uniformOffset,
            v2[2] - dirZ * uniformOffset
        ];

        const shortenedDx = end[0] - start[0];
        const shortenedDy = end[1] - start[1];
        const shortenedDz = end[2] - start[2];

        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;
        const midZ = (start[2] + end[2]) / 2;

        const geometry = new THREE.ShapeGeometry(shape);

        // Uniform color for all struts (teal/cyan)
        const facesMaterial = new THREE.MeshBasicMaterial({
            color: 0x00cccc, side: THREE.DoubleSide, transparent: true, opacity: 0.8
        });
        const facesMesh = new THREE.Mesh(geometry, facesMaterial);

        const wireframeGeometry = new THREE.EdgesGeometry(geometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
        const wireframeMesh = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

        facesMesh.position.set(midX, midY, midZ);
        wireframeMesh.position.set(midX, midY, midZ);

        // Orientation: same logic as classic mode
        const xAxis = new THREE.Vector3(shortenedDx, shortenedDy, shortenedDz).normalize();
        const zAxis = new THREE.Vector3(midX, midY, midZ).normalize();
        const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
        zAxis.crossVectors(xAxis, yAxis).normalize();

        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeBasis(xAxis, yAxis, zAxis);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromRotationMatrix(rotationMatrix);

        facesMesh.quaternion.copy(quaternion);
        wireframeMesh.quaternion.copy(quaternion);

        edgeStrutFacesGroup.add(facesMesh);
        edgeStrutWireframeGroup.add(wireframeMesh);
    }

    scene.add(edgeStrutFacesGroup);
    scene.add(edgeStrutWireframeGroup);
    updateTestStrutVisibility();
}
