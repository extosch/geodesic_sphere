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
