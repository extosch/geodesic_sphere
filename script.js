// Geodesic Sphere Visualization
// Based on Icosahedron Subdivision

class GeodesicSphere {
    constructor() {
        this.vertices = [];
        this.faces = [];
        this.edges = new Set();
    }

    // Create a regular icosahedron (F=1)
    createIcosahedron() {
        const t = (1.0 + Math.sqrt(5.0)) / 2.0; // Golden ratio
        
        // 12 vertices of an icosahedron
        this.vertices = [
            [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
            [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
            [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1]
        ];
        
        // Normalize vertices to unit sphere
        this.vertices = this.vertices.map(v => this.normalize(v));
        
        // 20 faces (equilateral triangles)
        this.faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ];
    }

    // Normalize vector to unit length
    normalize(v) {
        const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / length, v[1] / length, v[2] / length];
    }

    // Midpoint between two vertices
    getMidpoint(v1, v2) {
        return [
            (v1[0] + v2[0]) / 2,
            (v1[1] + v2[1]) / 2,
            (v1[2] + v2[2]) / 2
        ];
    }

    // Find or create vertex
    getOrCreateVertex(v) {
        // Search for existing vertex (with tolerance)
        const tolerance = 0.0001;
        for (let i = 0; i < this.vertices.length; i++) {
            const existing = this.vertices[i];
            const dx = existing[0] - v[0];
            const dy = existing[1] - v[1];
            const dz = existing[2] - v[2];
            if (dx * dx + dy * dy + dz * dz < tolerance * tolerance) {
                return i;
            }
        }
        // New vertex
        this.vertices.push(v);
        return this.vertices.length - 1;
    }

    // Subdivide a triangle into frequency² smaller triangles
    subdivideFace(face, frequency) {
        const [v0, v1, v2] = face.map(i => this.vertices[i]);
        const newFaces = [];
        
        // Create grid of points on the triangle
        const points = [];
        for (let i = 0; i <= frequency; i++) {
            points[i] = [];
            for (let j = 0; j <= frequency - i; j++) {
                // Barycentric coordinates
                const a = i / frequency;
                const b = j / frequency;
                const c = 1 - a - b;
                
                // Interpolate position
                const p = [
                    v0[0] * c + v1[0] * a + v2[0] * b,
                    v0[1] * c + v1[1] * a + v2[1] * b,
                    v0[2] * c + v1[2] * a + v2[2] * b
                ];
                
                // Project onto sphere
                const normalized = this.normalize(p);
                points[i][j] = this.getOrCreateVertex(normalized);
            }
        }
        
        // Create triangles from the grid
        for (let i = 0; i < frequency; i++) {
            for (let j = 0; j < frequency - i; j++) {
                // First triangle (upward pointing)
                newFaces.push([
                    points[i][j],
                    points[i + 1][j],
                    points[i][j + 1]
                ]);
                
                // Second triangle (downward pointing) - if exists
                if (j < frequency - i - 1) {
                    newFaces.push([
                        points[i][j + 1],
                        points[i + 1][j],
                        points[i + 1][j + 1]
                    ]);
                }
            }
        }
        
        return newFaces;
    }

    // Generate geodesic sphere with given frequency
    generate(frequency) {
        // Start with icosahedron
        this.createIcosahedron();
        
        if (frequency === 1) {
            return;
        }
        
        // Subdivide each face
        const originalFaces = [...this.faces];
        this.faces = [];
        
        for (const face of originalFaces) {
            const newFaces = this.subdivideFace(face, frequency);
            this.faces.push(...newFaces);
        }
    }

    // Calculate edges from faces
    calculateEdges() {
        this.edges = new Set();
        for (const face of this.faces) {
            const [a, b, c] = face;
            // Sort indices for consistent edge IDs
            this.edges.add(JSON.stringify([Math.min(a, b), Math.max(a, b)]));
            this.edges.add(JSON.stringify([Math.min(b, c), Math.max(b, c)]));
            this.edges.add(JSON.stringify([Math.min(c, a), Math.max(c, a)]));
        }
    }

    // Calculate unique edge lengths
    getUniqueEdgeLengths() {
        const lengths = new Map();
        const tolerance = 0.0001;
        
        for (const edgeStr of this.edges) {
            const [i, j] = JSON.parse(edgeStr);
            const v1 = this.vertices[i];
            const v2 = this.vertices[j];
            
            const dx = v2[0] - v1[0];
            const dy = v2[1] - v1[1];
            const dz = v2[2] - v1[2];
            const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Find or create length category
            let found = false;
            for (const [key, count] of lengths) {
                if (Math.abs(key - length) < tolerance) {
                    lengths.set(key, count + 1);
                    found = true;
                    break;
                }
            }
            if (!found) {
                lengths.set(length, 1);
            }
        }
        
        return lengths.size;
    }

    // Get detailed edge length information for building
    getEdgeLengthDetails(diameter, connectorOffset = 0) {
        const radius = diameter / 2;
        const lengthMap = new Map();
        const tolerance = 0.0001;
        
        for (const edgeStr of this.edges) {
            const [i, j] = JSON.parse(edgeStr);
            const v1 = this.vertices[i];
            const v2 = this.vertices[j];
            
            const dx = v2[0] - v1[0];
            const dy = v2[1] - v1[1];
            const dz = v2[2] - v1[2];
            const unitLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const realLength = unitLength * radius - (2 * connectorOffset);
            
            // Find or create length category
            let found = false;
            for (const [key, data] of lengthMap) {
                if (Math.abs(key - unitLength) < tolerance) {
                    data.count++;
                    found = true;
                    break;
                }
            }
            if (!found) {
                lengthMap.set(unitLength, { count: 1, realLength: realLength });
            }
        }
        
        // Sort by length and assign letters
        const sorted = Array.from(lengthMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map((entry, index) => ({
                type: String.fromCharCode(65 + index), // A, B, C, D...
                count: entry[1].count,
                length: entry[1].realLength
            }));
        
        return sorted;
    }

    // Get edge color based on length category
    getEdgeColors() {
        const lengthMap = new Map();
        const tolerance = 0.0001;
        const edgeColors = new Map();
        
        // First pass: categorize edges by length
        for (const edgeStr of this.edges) {
            const [i, j] = JSON.parse(edgeStr);
            const v1 = this.vertices[i];
            const v2 = this.vertices[j];
            
            const dx = v2[0] - v1[0];
            const dy = v2[1] - v1[1];
            const dz = v2[2] - v1[2];
            const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Find or create length category
            let categoryLength = null;
            for (const key of lengthMap.keys()) {
                if (Math.abs(key - length) < tolerance) {
                    categoryLength = key;
                    break;
                }
            }
            
            if (categoryLength === null) {
                categoryLength = length;
                lengthMap.set(categoryLength, lengthMap.size);
            }
            
            edgeColors.set(edgeStr, lengthMap.get(categoryLength));
        }
        
        // Color palette (bright distinct colors)
        const colors = [
            0xff0000, // Red - Type A
            0x00ff00, // Green - Type B
            0x0000ff, // Blue - Type C
            0xffff00, // Yellow - Type D
            0xff00ff, // Magenta - Type E
            0x00ffff, // Cyan - Type F
        ];
        
        // Map category indices to colors
        const result = new Map();
        for (const [edgeStr, categoryIndex] of edgeColors) {
            result.set(edgeStr, colors[categoryIndex % colors.length]);
        }
        
        return result;
    }

    // Calculate vertex valences (5-way or 6-way connectors)
    getVertexValences() {
        const valences = new Array(this.vertices.length).fill(0);
        
        for (const edgeStr of this.edges) {
            const [i, j] = JSON.parse(edgeStr);
            valences[i]++;
            valences[j]++;
        }
        
        const count5 = valences.filter(v => v === 5).length;
        const count6 = valences.filter(v => v === 6).length;
        
        return { count5, count6 };
    }

    // Create Three.js geometry
    createGeometry() {
        const geometry = new THREE.BufferGeometry();
        
        // Vertices
        const positions = [];
        const indices = [];
        
        for (const vertex of this.vertices) {
            positions.push(...vertex);
        }
        
        for (const face of this.faces) {
            indices.push(...face);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        return geometry;
    }
}

// Three.js Setup
let scene, camera, renderer, controls;
let faceMesh, wireframeMesh;
let geodesicSphere;
let animationId;
let autoRotate = true;

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
    
    // Event Listeners
    document.getElementById('updateBtn').addEventListener('click', updateSphere);
    document.getElementById('showFaces').addEventListener('change', updateVisibility);
    document.getElementById('showWireframe').addEventListener('change', updateVisibility);
    document.getElementById('autoRotate').addEventListener('change', (e) => {
        autoRotate = e.target.checked;
    });
    document.getElementById('frequency').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') updateSphere();
    });
    document.getElementById('diameter').addEventListener('input', updateBuildInstructions);
    document.getElementById('diameter').addEventListener('change', updateBuildInstructions);
    document.getElementById('connectorOffset').addEventListener('input', () => {
        updateBuildInstructions();
        updateSphere(); // Update 3D visualization with shortened struts
    });
    document.getElementById('connectorOffset').addEventListener('change', () => {
        updateBuildInstructions();
        updateSphere(); // Update 3D visualization with shortened struts
    });
    
    window.addEventListener('resize', onWindowResize);
    
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
    const connectorOffset = parseFloat(document.getElementById('connectorOffset').value) || 0;
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
    const connectorOffset = parseFloat(document.getElementById('connectorOffset').value) || 0;
    
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

function animate() {
    animationId = requestAnimationFrame(animate);
    
    // Auto-Rotation
    if (faceMesh && autoRotate) {
        faceMesh.rotation.y += 0.005;
        if (wireframeMesh) {
            wireframeMesh.rotation.y = faceMesh.rotation.y;
            wireframeMesh.rotation.x = faceMesh.rotation.x;
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

// Initialisierung beim Laden
window.addEventListener('load', init);
