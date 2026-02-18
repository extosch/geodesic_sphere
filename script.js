// Geodätische Kugel Visualisierung
// Basierend auf Ikosaeder-Unterteilung

class GeodesicSphere {
    constructor() {
        this.vertices = [];
        this.faces = [];
        this.edges = new Set();
    }

    // Erstelle ein reguläres Ikosaeder (F=1)
    createIcosahedron() {
        const t = (1.0 + Math.sqrt(5.0)) / 2.0; // Goldener Schnitt
        
        // 12 Vertices eines Ikosaeders
        this.vertices = [
            [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
            [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
            [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1]
        ];
        
        // Normalisiere Vertices auf Einheitskugel
        this.vertices = this.vertices.map(v => this.normalize(v));
        
        // 20 Faces (gleichseitige Dreiecke)
        this.faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ];
    }

    // Normalisiere Vektor auf Einheitslänge
    normalize(v) {
        const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / length, v[1] / length, v[2] / length];
    }

    // Mittelpunkt zwischen zwei Vertices
    getMidpoint(v1, v2) {
        return [
            (v1[0] + v2[0]) / 2,
            (v1[1] + v2[1]) / 2,
            (v1[2] + v2[2]) / 2
        ];
    }

    // Finde oder erstelle Vertex
    getOrCreateVertex(v) {
        // Suche nach existierendem Vertex (mit Toleranz)
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
        // Neuer Vertex
        this.vertices.push(v);
        return this.vertices.length - 1;
    }

    // Unterteile ein Dreieck in frequency² kleinere Dreiecke
    subdivideFace(face, frequency) {
        const [v0, v1, v2] = face.map(i => this.vertices[i]);
        const newFaces = [];
        
        // Erstelle Gitter von Punkten auf dem Dreieck
        const points = [];
        for (let i = 0; i <= frequency; i++) {
            points[i] = [];
            for (let j = 0; j <= frequency - i; j++) {
                // Baryzentrische Koordinaten
                const a = i / frequency;
                const b = j / frequency;
                const c = 1 - a - b;
                
                // Interpoliere Position
                const p = [
                    v0[0] * c + v1[0] * a + v2[0] * b,
                    v0[1] * c + v1[1] * a + v2[1] * b,
                    v0[2] * c + v1[2] * a + v2[2] * b
                ];
                
                // Projiziere auf Kugel
                const normalized = this.normalize(p);
                points[i][j] = this.getOrCreateVertex(normalized);
            }
        }
        
        // Erstelle Dreiecke aus dem Gitter
        for (let i = 0; i < frequency; i++) {
            for (let j = 0; j < frequency - i; j++) {
                // Erstes Dreieck (aufwärts zeigend)
                newFaces.push([
                    points[i][j],
                    points[i + 1][j],
                    points[i][j + 1]
                ]);
                
                // Zweites Dreieck (abwärts zeigend) - falls vorhanden
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

    // Generiere geodätische Kugel mit gegebener Frequenz
    generate(frequency) {
        // Starte mit Ikosaeder
        this.createIcosahedron();
        
        if (frequency === 1) {
            return;
        }
        
        // Unterteile jedes Face
        const originalFaces = [...this.faces];
        this.faces = [];
        
        for (const face of originalFaces) {
            const newFaces = this.subdivideFace(face, frequency);
            this.faces.push(...newFaces);
        }
    }

    // Berechne Kanten aus Faces
    calculateEdges() {
        this.edges = new Set();
        for (const face of this.faces) {
            const [a, b, c] = face;
            // Sortiere Indices für konsistente Kanten-IDs
            this.edges.add(JSON.stringify([Math.min(a, b), Math.max(a, b)]));
            this.edges.add(JSON.stringify([Math.min(b, c), Math.max(b, c)]));
            this.edges.add(JSON.stringify([Math.min(c, a), Math.max(c, a)]));
        }
    }

    // Berechne unterschiedliche Kantenlängen
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
            
            // Finde oder erstelle Längen-Kategorie
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

    // Erstelle Three.js Geometrie
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
    directionalLight.position.set(5, 5, 5); // Schräg rechts oben
    scene.add(directionalLight);
    
    // Controls (OrbitControls simulation mit einfacher Implementierung)
    setupControls();
    
    // Initiale Kugel
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
        if (e.button === 0) { // Linke Maustaste
            isDragging = true;
        } else if (e.button === 2) { // Rechte Maustaste
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
        alert('Frequenz muss zwischen 1 und 10 liegen!');
        return;
    }
    
    // Entferne alte Meshes
    if (faceMesh) scene.remove(faceMesh);
    if (wireframeMesh) scene.remove(wireframeMesh);
    
    // Generiere neue Kugel
    geodesicSphere = new GeodesicSphere();
    geodesicSphere.generate(frequency);
    geodesicSphere.calculateEdges();
    
    const geometry = geodesicSphere.createGeometry();
    
    // Face Mesh (Grau)
    const faceMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080,
        side: THREE.DoubleSide,
        flatShading: false
    });
    faceMesh = new THREE.Mesh(geometry, faceMaterial);
    scene.add(faceMesh);
    
    // Wireframe Mesh (Weiß)
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    scene.add(wireframeMesh);
    
    // Update Info
    updateInfo();
    updateVisibility();
}

function updateInfo() {
    const vertexCount = geodesicSphere.vertices.length;
    const edgeCount = geodesicSphere.edges.size;
    const uniqueEdgeLengths = geodesicSphere.getUniqueEdgeLengths();
    
    document.getElementById('vertexCount').textContent = vertexCount;
    document.getElementById('edgeCount').textContent = edgeCount;
    document.getElementById('edgeLengthCount').textContent = uniqueEdgeLengths;
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
