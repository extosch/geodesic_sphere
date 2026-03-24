// Connector visualization - shows the connector offset regions
// Displays white wireframe lines from vertices to shortened edge endpoints

// Show connector pieces (the offset regions at each vertex)
function showConnectorPieces() {
    // Remove existing connector wireframe if present
    if (connectorWireframeGroup) {
        scene.remove(connectorWireframeGroup);
        connectorWireframeGroup = null;
    }
    
    if (!geodesicSphere) return;
    
    // Get connector offset for edge shortening
    const connectorOffset = getScaledConnectorOffset();
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const offsetRatio = connectorOffset / radius; // Convert to unit sphere ratio
    
    // Create geometry for all connector lines
    const positions = [];
    
    // For EACH EDGE, draw TWO connector lines (one from each endpoint)
    // This approach mirrors the Edge Struts implementation
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];
        
        // Calculate edge direction v1 -> v2
        const dx = v2[0] - v1[0];
        const dy = v2[1] - v1[1];
        const dz = v2[2] - v1[2];
        const edgeLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Normalize direction
        const dirX = dx / edgeLength;
        const dirY = dy / edgeLength;
        const dirZ = dz / edgeLength;
        
        // Calculate shortened edge endpoints (same calculation as in Edge Struts)
        // These are the endpoints of the shortened edges where connector lines END
        const startShortened = [
            v1[0] + dirX * offsetRatio,
            v1[1] + dirY * offsetRatio,
            v1[2] + dirZ * offsetRatio
        ];
        
        const endShortened = [
            v2[0] - dirX * offsetRatio,
            v2[1] - dirY * offsetRatio,
            v2[2] - dirZ * offsetRatio
        ];
        
        // Connector line 1: from v1 (original vertex) to startShortened
        // Unit sphere space (no radius scaling - matches sphere geometry)
        positions.push(
            v1[0], v1[1], v1[2],
            startShortened[0], startShortened[1], startShortened[2]
        );
        
        // Connector line 2: from v2 (original vertex) to endShortened
        positions.push(
            v2[0], v2[1], v2[2],
            endShortened[0], endShortened[1], endShortened[2]
        );
    }
    
    // Create LineSegments geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    // White material for connectors
    const material = new THREE.LineBasicMaterial({ 
        color: 0xffffff,
        linewidth: 1,
        transparent: false
    });
    
    connectorWireframeGroup = new THREE.LineSegments(geometry, material);
    scene.add(connectorWireframeGroup);
}

// Update connector visibility based on checkbox
function updateConnectorVisibility() {
    if (!connectorWireframeGroup) return;
    
    const showConnectors = document.getElementById('showConnectorsWireframe').checked;
    connectorWireframeGroup.visible = showConnectors;
    
    // Also update connector struts visibility
    updateConnectorStrutsVisibility();
}

// Show connector struts (2D capsule components on connector edges)
function showConnectorStruts() {
    // Remove existing connector struts if any
    if (connectorStrutFacesGroup) {
        scene.remove(connectorStrutFacesGroup);
    }
    if (connectorStrutWireframeGroup) {
        scene.remove(connectorStrutWireframeGroup);
    }
    
    if (!geodesicSphere) return;
    
    // Get scaled parameters based on current frequency
    const strutParams = getScaledStrutParams();
    
    // Create groups for all connector struts
    connectorStrutFacesGroup = new THREE.Group();
    connectorStrutWireframeGroup = new THREE.Group();
    
    // Get connector offset for connector edge length
    const connectorOffset = getScaledConnectorOffset();
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const offsetRatio = connectorOffset / radius; // Convert to unit sphere ratio
    
    // Build adjacency map: vertex -> list of neighbor vertices
    const adjacency = new Array(geodesicSphere.vertices.length).fill(null).map(() => []);
    
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        adjacency[i].push(j);
        adjacency[j].push(i);
    }
    
    // For each vertex, create connector struts to all neighbors
    for (let i = 0; i < geodesicSphere.vertices.length; i++) {
        const vertex = geodesicSphere.vertices[i];
        const neighbors = adjacency[i];
        
        // For each neighbor, create a connector strut
        for (const neighborIdx of neighbors) {
            const neighbor = geodesicSphere.vertices[neighborIdx];
            
            // Calculate direction from vertex to neighbor
            const dx = neighbor[0] - vertex[0];
            const dy = neighbor[1] - vertex[1];
            const dz = neighbor[2] - vertex[2];
            const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Normalize direction
            const dirX = dx / length;
            const dirY = dy / length;
            const dirZ = dz / length;
            
            // Calculate midpoint of connector edge (vertex + direction × connectorOffset/2)
            const halfOffset = offsetRatio / 2;
            const midX = vertex[0] + dirX * halfOffset;
            const midY = vertex[1] + dirY * halfOffset;
            const midZ = vertex[2] + dirZ * halfOffset;
            
            // Create strut shape with connector offset length
            const shape = createStrutShape(offsetRatio, strutParams.B, strutParams.R);
            const geometry = new THREE.ShapeGeometry(shape);
            
            // Create faces mesh - use light gray/white color for connectors
            const facesMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xcccccc,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            });
            const facesMesh = new THREE.Mesh(geometry, facesMaterial);
            
            // Create wireframe mesh
            const wireframeGeometry = new THREE.EdgesGeometry(geometry);
            const wireframeMaterial = new THREE.LineBasicMaterial({ 
                color: 0xffffff,
                linewidth: 1
            });
            const wireframeMesh = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
            
            // Position at midpoint (scale to actual sphere size)
            facesMesh.position.set(midX, midY, midZ);
            wireframeMesh.position.set(midX, midY, midZ);
            
            // Build coordinate system for strut orientation:
            // X-axis: along connector edge (from vertex toward neighbor)
            // Y-axis: tangential to sphere (width direction)
            // Z-axis: radial outward from sphere center (normal to surface)
            
            // X-axis = connector edge direction (normalized)
            const xAxis = new THREE.Vector3(dirX, dirY, dirZ);
            
            // Z-axis = radial direction at midpoint (normalized)
            const zAxis = new THREE.Vector3(midX, midY, midZ).normalize();
            
            // Y-axis = Z cross X (tangential, perpendicular to both edge and radius)
            const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
            
            // Re-orthogonalize Z-axis to ensure perfect right-handed system
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
            connectorStrutFacesGroup.add(facesMesh);
            connectorStrutWireframeGroup.add(wireframeMesh);
        }
    }
    
    // Add groups to scene
    scene.add(connectorStrutFacesGroup);
    scene.add(connectorStrutWireframeGroup);
    
    // Set visibility based on checkboxes
    updateConnectorStrutsVisibility();
}

// Update connector struts visibility based on checkboxes
function updateConnectorStrutsVisibility() {
    if (connectorStrutFacesGroup) {
        const showFaces = document.getElementById('showConnectorStrutsFaces').checked;
        connectorStrutFacesGroup.visible = showFaces;
    }
    
    if (connectorStrutWireframeGroup) {
        const showWireframe = document.getElementById('showConnectorStrutsWireframe').checked;
        connectorStrutWireframeGroup.visible = showWireframe;
    }
}
