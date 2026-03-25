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
    const connectorOffset = getScaledConnectorOffset();
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const offsetRatio = connectorOffset / radius; // Convert to unit sphere ratio

    if (currentMode === 'classic') {
        // Classic mode: fixed offset, colored by edge type
        const edgeColors = geodesicSphere.getEdgeColors();

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
    } else {
        // Uniform strut mode: per-edge offset, uniform color
        const { edgeMap } = computeEdgeOffsets(geodesicSphere, offsetRatio);

        for (const edgeStr of geodesicSphere.edges) {
            const [i, j] = JSON.parse(edgeStr);
            const v1 = geodesicSphere.vertices[i];
            const v2 = geodesicSphere.vertices[j];

            const dx = v2[0] - v1[0], dy = v2[1] - v1[1], dz = v2[2] - v1[2];
            const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const dirX = dx / length, dirY = dy / length, dirZ = dz / length;

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

            const lineGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array([
                start[0], start[1], start[2],
                end[0], end[1], end[2]
            ]);
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.8
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            wireframeMesh.add(line);
        }
    }
    
    scene.add(wireframeMesh);
    
    // Update Info
    updateInfo();
    updateVisibility();
    
    // Update struts with new frequency-scaled parameters
    showTestStrut();

    if (currentMode === 'classic') {
        showStrutsOnEdges();
        showConnectorPieces();
        showConnectorStruts();
    } else {
        showStrutsOnEdgesUniform();
        showConnectorPiecesUniform();
        showConnectorStrutsUniform();
    }
}

function updateInfo() {
    const vertexCount = geodesicSphere.vertices.length;
    const edgeCount = geodesicSphere.edges.size;
    const faceCount = geodesicSphere.faces.length;
    const uniqueEdgeLengths = currentMode === 'einheitsstrut' ? 1 : geodesicSphere.getUniqueEdgeLengths();
    
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
    
    if (currentMode === 'classic') {
        // Classic mode: multiple strut types
        const edgeDetails = geodesicSphere.getEdgeLengthDetails(diameter, connectorOffset);
        for (let i = 0; i < edgeDetails.length; i++) {
            const edge = edgeDetails[i];
            const row = strutTable.insertRow();
            row.insertCell(0).textContent = edge.type;
            const colorCell = row.insertCell(1);
            const colorBox = document.createElement('div');
            colorBox.className = 'color-box';
            colorBox.style.backgroundColor = colors[i % colors.length];
            colorCell.appendChild(colorBox);
            row.insertCell(2).textContent = edge.count;
            row.insertCell(3).textContent = edge.length.toFixed(2);
        }
    } else {
        // Uniform strut mode: single strut type
        const radius = diameter / 2;
        const offsetRatio = connectorOffset / radius;
        const { L_min } = computeEdgeOffsets(geodesicSphere, offsetRatio);
        const L_min_cm = L_min * radius; // Convert from unit sphere to cm

        const row = strutTable.insertRow();
        row.insertCell(0).textContent = 'Einheit';
        const colorCell = row.insertCell(1);
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = '#00cccc';
        colorCell.appendChild(colorBox);
        row.insertCell(2).textContent = geodesicSphere.edges.size;
        row.insertCell(3).textContent = L_min_cm.toFixed(2);
    }
    
    // Update connector counts
    const valences = geodesicSphere.getVertexValences();
    document.getElementById('connector5Count').textContent = valences.count5;
    document.getElementById('connector6Count').textContent = valences.count6;
    
    // Classify connector types
    classifyConnectorTypes();
    
    // Update patch count
    document.getElementById('patchCount').textContent = geodesicSphere.faces.length;
}

// Normalize a cyclic pattern (rotation + mirror) to its lexicographic minimum
function canonicalizePattern(pattern) {
    const n = pattern.length;
    let best = pattern.join(',');
    for (let variant = 0; variant < 2; variant++) {
        const arr = variant === 0 ? pattern.slice() : pattern.slice().reverse();
        for (let rot = 0; rot < n; rot++) {
            const rotated = arr.slice(rot).concat(arr.slice(0, rot));
            const key = rotated.join(',');
            if (key < best) best = key;
        }
    }
    return best;
}

// Classify all vertices into distinct connector types based on edge-type pattern around each vertex
function classifyConnectorTypes() {
    if (!geodesicSphere) return;

    const edgeTypeMap = geodesicSphere.getEdgeTypeMap();
    const vertices = geodesicSphere.vertices;
    const typeLabels = 'ABCDEFGH';

    // Build adjacency
    const adjacency = new Array(vertices.length).fill(null).map(() => []);
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        adjacency[i].push(j);
        adjacency[j].push(i);
    }

    // For each vertex, get CCW-sorted neighbor indices and build edge-type pattern
    const vertexPatterns = vertices.map((vertex, i) => {
        const sorted = sortNeighborsCCW(vertex, adjacency[i], vertices);
        const pattern = sorted.map(nIdx => {
            const edgeStr = JSON.stringify([Math.min(i, nIdx), Math.max(i, nIdx)]);
            return edgeTypeMap.get(edgeStr);
        });
        return canonicalizePattern(pattern);
    });

    // Group vertices by canonical pattern
    const groups = new Map();
    vertexPatterns.forEach((canon, vIdx) => {
        if (!groups.has(canon)) groups.set(canon, []);
        groups.get(canon).push(vIdx);
    });

    // Sort groups by arm count ascending, then pattern
    const sorted = [...groups.entries()].sort((a, b) => {
        const armsA = a[0].split(',').length, armsB = b[0].split(',').length;
        if (armsA !== armsB) return armsA - armsB;
        return a[0] < b[0] ? -1 : 1;
    });

    // Populate table
    const table = document.getElementById('connectorTypeTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    document.getElementById('connectorTypeCount').textContent = sorted.length;

    sorted.forEach(([canon, verts], idx) => {
        const arms = canon.split(',').length;
        const patternStr = canon.split(',').map(t => typeLabels[parseInt(t)] || t).join('-');
        const row = tbody.insertRow();
        row.insertCell(0).textContent = `K${idx + 1}`;
        row.insertCell(1).textContent = arms;
        row.insertCell(2).textContent = patternStr;
        row.insertCell(3).textContent = verts.length;
    });
}

function updateVisibility() {
    const showFaces = document.getElementById('showFaces').checked;
    const showWireframe = document.getElementById('showEdgesWireframe').checked;
    
    if (faceMesh) faceMesh.visible = showFaces;
    if (wireframeMesh) wireframeMesh.visible = showWireframe;
}
