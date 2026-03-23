// Sphere Visualization Functions
// Generate and update the 3D geodesic sphere display

function updateSphere() {
    const frequency = parseInt(document.getElementById('frequency').value);
    
    if (frequency < 1 || frequency > 10) {
        alert('Frequency must be between 1 and 10!');
        return;
    }
    
    // Remove old meshes
    if (faceMesh) scene.remove(faceMesh);
    if (wireframeMesh) scene.remove(wireframeMesh);
    
    // Generate new sphere
    geodesicSphere = new GeodesicSphere();
    geodesicSphere.generate(frequency);
    geodesicSphere.calculateEdges();
    
    const geometry = geodesicSphere.createGeometry();
    
    // Face mesh (gray)
    const faceMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080,
        side: THREE.DoubleSide,
        flatShading: false
    });
    faceMesh = new THREE.Mesh(geometry, faceMaterial);
    scene.add(faceMesh);
    
    // Create colored wireframe based on edge lengths (shortened for connectors)
    wireframeMesh = new THREE.Group();
    const edgeColors = geodesicSphere.getEdgeColors();
    const connectorOffset = getScaledConnectorOffset();
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const offsetRatio = connectorOffset / radius; // Convert to unit sphere ratio
    
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];
        
        // Calculate direction vector
        const dx = v2[0] - v1[0];
        const dy = v2[1] - v1[1];
        const dz = v2[2] - v1[2];
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Normalize direction
        const dirX = dx / length;
        const dirY = dy / length;
        const dirZ = dz / length;
        
        // Shorten from both ends
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
        
        const lineGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            start[0], start[1], start[2],
            end[0], end[1], end[2]
        ]);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const color = edgeColors.get(edgeStr);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        wireframeMesh.add(line);
    }
    
    scene.add(wireframeMesh);
    
    // Update Info
    updateInfo();
    updateVisibility();
    
    // Update struts with new frequency-scaled parameters
    showTestStrut();
    showStrutsOnEdges();
}

function updateInfo() {
    const vertexCount = geodesicSphere.vertices.length;
    const edgeCount = geodesicSphere.edges.size;
    const faceCount = geodesicSphere.faces.length;
    const uniqueEdgeLengths = geodesicSphere.getUniqueEdgeLengths();
    
    document.getElementById('vertexCount').textContent = vertexCount;
    document.getElementById('edgeCount').textContent = edgeCount;
    document.getElementById('edgeLengthCount').textContent = uniqueEdgeLengths;
    document.getElementById('faceCount').textContent = faceCount;
    
    // Update build instructions
    updateBuildInstructions();
}

function updateBuildInstructions() {
    if (!geodesicSphere) return;
    
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const connectorOffset = getScaledConnectorOffset();
    
    // Color palette matching the 3D visualization
    const colors = [
        '#ff0000', // Red - Type A
        '#00ff00', // Green - Type B
        '#0000ff', // Blue - Type C
        '#ffff00', // Yellow - Type D
        '#ff00ff', // Magenta - Type E
        '#00ffff', // Cyan - Type F
    ];
    
    // Update strut table
    const strutTable = document.getElementById('strutTable').getElementsByTagName('tbody')[0];
    strutTable.innerHTML = '';
    
    const edgeDetails = geodesicSphere.getEdgeLengthDetails(diameter, connectorOffset);
    for (let i = 0; i < edgeDetails.length; i++) {
        const edge = edgeDetails[i];
        const row = strutTable.insertRow();
        
        // Type column
        row.insertCell(0).textContent = edge.type;
        
        // Color column with color box
        const colorCell = row.insertCell(1);
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = colors[i % colors.length];
        colorCell.appendChild(colorBox);
        
        // Quantity column
        row.insertCell(2).textContent = edge.count;
        
        // Length column
        row.insertCell(3).textContent = edge.length.toFixed(2);
    }
    
    // Update connector counts
    const valences = geodesicSphere.getVertexValences();
    document.getElementById('connector5Count').textContent = valences.count5;
    document.getElementById('connector6Count').textContent = valences.count6;
    
    // Update patch count
    document.getElementById('patchCount').textContent = geodesicSphere.faces.length;
}

function updateVisibility() {
    const showFaces = document.getElementById('showFaces').checked;
    const showWireframe = document.getElementById('showWireframe').checked;
    
    if (faceMesh) faceMesh.visible = showFaces;
    if (wireframeMesh) wireframeMesh.visible = showWireframe;
}
