// Connector visualization - shows the connector offset regions
// Displays white wireframe lines from vertices to shortened edge endpoints

// Sort 3D points CCW around a vertex (viewed from outside the sphere).
// Uses the vertex position as the approximate outward normal.
function sortPointsCCWAroundVertex(vertex, points) {
    if (points.length < 3) return points.slice();

    const vLen = Math.sqrt(vertex[0]*vertex[0] + vertex[1]*vertex[1] + vertex[2]*vertex[2]);
    const nrm = [vertex[0]/vLen, vertex[1]/vLen, vertex[2]/vLen];

    let cx = 0, cy = 0, cz = 0;
    for (const p of points) { cx += p[0]; cy += p[1]; cz += p[2]; }
    cx /= points.length; cy /= points.length; cz /= points.length;

    const d0 = [points[0][0]-cx, points[0][1]-cy, points[0][2]-cz];
    const dot0 = d0[0]*nrm[0] + d0[1]*nrm[1] + d0[2]*nrm[2];
    const refX = [d0[0]-dot0*nrm[0], d0[1]-dot0*nrm[1], d0[2]-dot0*nrm[2]];
    const rxLen = Math.sqrt(refX[0]*refX[0] + refX[1]*refX[1] + refX[2]*refX[2]);
    if (rxLen < 1e-10) return points.slice();
    refX[0] /= rxLen; refX[1] /= rxLen; refX[2] /= rxLen;

    const refY = [
        nrm[1]*refX[2] - nrm[2]*refX[1],
        nrm[2]*refX[0] - nrm[0]*refX[2],
        nrm[0]*refX[1] - nrm[1]*refX[0]
    ];

    return points.slice().sort((a, b) => {
        const da = [a[0]-cx, a[1]-cy, a[2]-cz];
        const db = [b[0]-cx, b[1]-cy, b[2]-cz];
        const angA = Math.atan2(
            da[0]*refY[0]+da[1]*refY[1]+da[2]*refY[2],
            da[0]*refX[0]+da[1]*refX[1]+da[2]*refX[2]
        );
        const angB = Math.atan2(
            db[0]*refY[0]+db[1]*refY[1]+db[2]*refY[2],
            db[0]*refX[0]+db[1]*refX[1]+db[2]*refX[2]
        );
        return angA - angB;
    });
}

// Sort adjacency neighbor indices CCW around a vertex.
function sortNeighborsCCW(vertex, neighborIndices, vertices) {
    if (neighborIndices.length < 3) return neighborIndices.slice();

    const vLen = Math.sqrt(vertex[0]*vertex[0] + vertex[1]*vertex[1] + vertex[2]*vertex[2]);
    const nrm = [vertex[0]/vLen, vertex[1]/vLen, vertex[2]/vLen];

    let cx = 0, cy = 0, cz = 0;
    for (const nIdx of neighborIndices) {
        cx += vertices[nIdx][0]; cy += vertices[nIdx][1]; cz += vertices[nIdx][2];
    }
    cx /= neighborIndices.length; cy /= neighborIndices.length; cz /= neighborIndices.length;

    const d0 = [vertices[neighborIndices[0]][0]-cx, vertices[neighborIndices[0]][1]-cy, vertices[neighborIndices[0]][2]-cz];
    const dot0 = d0[0]*nrm[0] + d0[1]*nrm[1] + d0[2]*nrm[2];
    const refX = [d0[0]-dot0*nrm[0], d0[1]-dot0*nrm[1], d0[2]-dot0*nrm[2]];
    const rxLen = Math.sqrt(refX[0]*refX[0] + refX[1]*refX[1] + refX[2]*refX[2]);
    if (rxLen < 1e-10) return neighborIndices.slice();
    refX[0] /= rxLen; refX[1] /= rxLen; refX[2] /= rxLen;

    const refY = [
        nrm[1]*refX[2] - nrm[2]*refX[1],
        nrm[2]*refX[0] - nrm[0]*refX[2],
        nrm[0]*refX[1] - nrm[1]*refX[0]
    ];

    return neighborIndices.slice().sort((a, b) => {
        const va = vertices[a], vb = vertices[b];
        const da = [va[0]-cx, va[1]-cy, va[2]-cz];
        const db = [vb[0]-cx, vb[1]-cy, vb[2]-cz];
        const angA = Math.atan2(
            da[0]*refY[0]+da[1]*refY[1]+da[2]*refY[2],
            da[0]*refX[0]+da[1]*refX[1]+da[2]*refX[2]
        );
        const angB = Math.atan2(
            db[0]*refY[0]+db[1]*refY[1]+db[2]*refY[2],
            db[0]*refX[0]+db[1]*refX[1]+db[2]*refX[2]
        );
        return angA - angB;
    });
}

// Strategy C: For a vertex V and its arm endpoints P[], project V onto the
// best-fit plane of P[] to get the planar connector center V'.
function projectVertexOntoArmPlane(vertex, armEndpoints) {
    const n = armEndpoints.length;
    if (n < 3) return vertex; // Can't define a plane
    
    // Sort arm endpoints CCW around vertex for correct Newell normal
    const sorted = sortPointsCCWAroundVertex(vertex, armEndpoints);
    
    // Centroid of arm endpoints
    let cx = 0, cy = 0, cz = 0;
    for (const p of sorted) { cx += p[0]; cy += p[1]; cz += p[2]; }
    cx /= n; cy /= n; cz /= n;
    
    // Best-fit plane normal via sum of cross products (Newell's method)
    let nx = 0, ny = 0, nz = 0;
    for (let k = 0; k < n; k++) {
        const a = sorted[k];
        const b = sorted[(k + 1) % n];
        // Cross product of (a - centroid) x (b - centroid)
        const ax = a[0] - cx, ay = a[1] - cy, az = a[2] - cz;
        const bx = b[0] - cx, by = b[1] - cy, bz = b[2] - cz;
        nx += ay * bz - az * by;
        ny += az * bx - ax * bz;
        nz += ax * by - ay * bx;
    }
    // Normalize the normal
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (nLen < 1e-10) return vertex;
    nx /= nLen; ny /= nLen; nz /= nLen;
    
    // Ensure normal points outward (same direction as vertex from origin)
    const dot = vertex[0] * nx + vertex[1] * ny + vertex[2] * nz;
    if (dot < 0) { nx = -nx; ny = -ny; nz = -nz; }
    
    // Project V onto the plane: V' = V - ((V - centroid) · N) * N
    const vx = vertex[0] - cx, vy = vertex[1] - cy, vz = vertex[2] - cz;
    const dist = vx * nx + vy * ny + vz * nz;
    return [
        vertex[0] - dist * nx,
        vertex[1] - dist * ny,
        vertex[2] - dist * nz
    ];
}

// Show connector pieces (the offset regions at each vertex)
// Strategy C: connector center is V' (V projected onto best-fit plane of arm endpoints)
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
    
    // Build adjacency map: vertex index -> list of neighbor vertex indices
    const adjacency = new Array(geodesicSphere.vertices.length).fill(null).map(() => []);
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        adjacency[i].push(j);
        adjacency[j].push(i);
    }
    
    // Precompute arm endpoints for each vertex (the shortened-edge endpoints)
    // armEndpoints[i] = array of P_k for all neighbors of vertex i
    const armEndpoints = geodesicSphere.vertices.map((vertex, i) => {
        return adjacency[i].map(neighborIdx => {
            const neighbor = geodesicSphere.vertices[neighborIdx];
            const dx = neighbor[0] - vertex[0];
            const dy = neighbor[1] - vertex[1];
            const dz = neighbor[2] - vertex[2];
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            return [
                vertex[0] + (dx / len) * offsetRatio,
                vertex[1] + (dy / len) * offsetRatio,
                vertex[2] + (dz / len) * offsetRatio
            ];
        });
    });
    
    // Precompute projected centers V' for each vertex (Strategy C)
    const projectedCenters = geodesicSphere.vertices.map((vertex, i) =>
        projectVertexOntoArmPlane(vertex, armEndpoints[i])
    );
    
    // Create geometry: for each edge, draw two connector lines using projected centers
    const positions = [];
    
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];
        
        // Direction v1 -> v2
        const dx = v2[0] - v1[0];
        const dy = v2[1] - v1[1];
        const dz = v2[2] - v1[2];
        const edgeLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const dirX = dx / edgeLength;
        const dirY = dy / edgeLength;
        const dirZ = dz / edgeLength;
        
        // Arm endpoints (shortened edge endpoints)
        const p1 = [v1[0] + dirX * offsetRatio, v1[1] + dirY * offsetRatio, v1[2] + dirZ * offsetRatio];
        const p2 = [v2[0] - dirX * offsetRatio, v2[1] - dirY * offsetRatio, v2[2] - dirZ * offsetRatio];
        
        // Projected connector centers (Strategy C)
        const c1 = projectedCenters[i];
        const c2 = projectedCenters[j];
        
        // Connector line 1: from projected center c1 to arm endpoint p1
        positions.push(c1[0], c1[1], c1[2], p1[0], p1[1], p1[2]);
        
        // Connector line 2: from projected center c2 to arm endpoint p2
        positions.push(c2[0], c2[1], c2[2], p2[0], p2[1], p2[2]);
    }
    
    // Create LineSegments geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    
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

// Creates a 2D star-shaped connector outline in local 2D space.
// arms2D: array of {dir:[dx,dy], len} sorted CCW by angle
// B: arm width (strut width), R: hole radius at arm tip
function createConnectorShape(arms2D, B, R) {
    const N = arms2D.length;
    const halfB = B / 2;
    const right = arms2D.map(a => [ a.dir[1], -a.dir[0]]);
    const left  = arms2D.map(a => [-a.dir[1],  a.dir[0]]);

    function lineIntersect2D(p1, d1, p2, d2) {
        const dx = p2[0]-p1[0], dy = p2[1]-p1[1];
        const denom = d1[0]*d2[1] - d1[1]*d2[0];
        if (Math.abs(denom) < 1e-10) return [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2];
        const t = (dx*d2[1] - dy*d2[0]) / denom;
        return [p1[0]+t*d1[0], p1[1]+t*d1[1]];
    }

    // T[k] = transition point between arm k (left side) and arm k+1 (right side)
    const T = arms2D.map((_, k) => {
        const kn = (k+1) % N;
        const p1 = [left[k][0]*halfB, left[k][1]*halfB];
        const p2 = [right[kn][0]*halfB, right[kn][1]*halfB];
        return lineIntersect2D(p1, arms2D[k].dir, p2, arms2D[kn].dir);
    });

    const shape = new THREE.Shape();
    shape.moveTo(T[N-1][0], T[N-1][1]);
    for (let k = 0; k < N; k++) {
        const arm = arms2D[k];
        const tipCx = arm.dir[0] * arm.len;
        const tipCy = arm.dir[1] * arm.len;
        const rightTip = [tipCx + right[k][0]*halfB, tipCy + right[k][1]*halfB];
        shape.lineTo(rightTip[0], rightTip[1]);
        const angleRight = Math.atan2(right[k][1], right[k][0]);
        const angleLeft  = Math.atan2(left[k][1],  left[k][0]);
        shape.absarc(tipCx, tipCy, halfB, angleRight, angleLeft, false); // CCW semicircle outward at tip
        shape.lineTo(T[k][0], T[k][1]);
    }
    shape.closePath();

    // Add bolt holes at arm tips
    for (let k = 0; k < N; k++) {
        const arm = arms2D[k];
        const hole = new THREE.Path();
        hole.absarc(arm.dir[0]*arm.len, arm.dir[1]*arm.len, R, 0, Math.PI*2, false);
        shape.holes.push(hole);
    }
    return shape;
}

// Computes per-vertex connector geometry data using Strategy C (plane projection).
function computeConnectorData(geodesicSphere, offsetRatio) {
    const vertices = geodesicSphere.vertices;
    const adjacency = new Array(vertices.length).fill(null).map(() => []);
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        adjacency[i].push(j);
        adjacency[j].push(i);
    }

    return vertices.map((vertex, i) => {
        const armPts3D = adjacency[i].map(nIdx => {
            const nb = vertices[nIdx];
            const dx = nb[0]-vertex[0], dy = nb[1]-vertex[1], dz = nb[2]-vertex[2];
            const len = Math.sqrt(dx*dx+dy*dy+dz*dz);
            return [vertex[0]+dx/len*offsetRatio, vertex[1]+dy/len*offsetRatio, vertex[2]+dz/len*offsetRatio];
        });

        // Sort arm endpoints CCW for correct Newell normal
        const sortedArms = sortPointsCCWAroundVertex(vertex, armPts3D);

        const center3D = projectVertexOntoArmPlane(vertex, sortedArms);
        const cx = center3D[0], cy = center3D[1], cz = center3D[2];

        // Compute best-fit plane normal via Newell's method (outward-facing)
        const N = sortedArms.length;
        let nx=0, ny=0, nz=0;
        for (let k = 0; k < N; k++) {
            const a = sortedArms[k], b = sortedArms[(k+1)%N];
            const ax=a[0]-cx, ay=a[1]-cy, az=a[2]-cz;
            const bx=b[0]-cx, by=b[1]-cy, bz=b[2]-cz;
            nx += ay*bz - az*by;
            ny += az*bx - ax*bz;
            nz += ax*by - ay*bx;
        }
        let nLen = Math.sqrt(nx*nx+ny*ny+nz*nz);
        if (nLen < 1e-10) { nx=0; ny=0; nz=1; }
        else { nx/=nLen; ny/=nLen; nz/=nLen; }
        if (vertex[0]*nx + vertex[1]*ny + vertex[2]*nz < 0) { nx=-nx; ny=-ny; nz=-nz; }

        const zAxis = new THREE.Vector3(nx, ny, nz);
        const toFirst = new THREE.Vector3(sortedArms[0][0]-cx, sortedArms[0][1]-cy, sortedArms[0][2]-cz);
        const xAxis = toFirst.clone().addScaledVector(zAxis, -toFirst.dot(zAxis)).normalize();
        const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();

        // Project arm endpoints into local 2D plane
        const arms2D = sortedArms.map(p => {
            const dx=p[0]-cx, dy=p[1]-cy, dz=p[2]-cz;
            const px = dx*xAxis.x + dy*xAxis.y + dz*xAxis.z;
            const py = dx*yAxis.x + dy*yAxis.y + dz*yAxis.z;
            const len = Math.sqrt(px*px + py*py);
            return { dir: [px/len, py/len], len };
        });
        arms2D.sort((a, b) => Math.atan2(a.dir[1], a.dir[0]) - Math.atan2(b.dir[1], b.dir[0]));

        return { center3D, zAxis, xAxis, yAxis, arms2D };
    });
}

// Show connector struts as flat star-shaped single-piece components
function showConnectorStruts() {
    if (connectorStrutFacesGroup) scene.remove(connectorStrutFacesGroup);
    if (connectorStrutWireframeGroup) scene.remove(connectorStrutWireframeGroup);
    if (!geodesicSphere) return;

    const strutParams = getScaledStrutParams();
    const connectorOffset = getScaledConnectorOffset();
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const offsetRatio = connectorOffset / (diameter / 2);

    connectorStrutFacesGroup = new THREE.Group();
    connectorStrutWireframeGroup = new THREE.Group();

    const connectors = computeConnectorData(geodesicSphere, offsetRatio);
    for (const conn of connectors) {
        const { center3D, zAxis, xAxis, yAxis, arms2D } = conn;
        const shape = createConnectorShape(arms2D, strutParams.B, strutParams.R);
        const geometry = new THREE.ShapeGeometry(shape);

        const facesMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            color: 0xcccccc, side: THREE.DoubleSide, transparent: true, opacity: 0.85
        }));
        const wireframeMesh = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 })
        );

        facesMesh.position.set(center3D[0], center3D[1], center3D[2]);
        wireframeMesh.position.set(center3D[0], center3D[1], center3D[2]);

        const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
        const quat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
        facesMesh.quaternion.copy(quat);
        wireframeMesh.quaternion.copy(quat);

        connectorStrutFacesGroup.add(facesMesh);
        connectorStrutWireframeGroup.add(wireframeMesh);
    }

    scene.add(connectorStrutFacesGroup);
    scene.add(connectorStrutWireframeGroup);
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

// --- Uniform (Einheitsstrut) mode variants ---

// Computes per-vertex connector data with variable arm lengths (uniform strut mode).
// Each arm extends by half the excess of its edge so struts of length L_min fit.
function computeConnectorDataUniform(geodesicSphere, classicOffsetRatio, edgeMap) {
    const vertices = geodesicSphere.vertices;
    const adjacency = new Array(vertices.length).fill(null).map(() => []);
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        adjacency[i].push(j);
        adjacency[j].push(i);
    }

    return vertices.map((vertex, i) => {
        // Arm endpoints with per-edge uniform offset
        const armPts3D = adjacency[i].map(nIdx => {
            const nb = vertices[nIdx];
            const dx = nb[0] - vertex[0], dy = nb[1] - vertex[1], dz = nb[2] - vertex[2];
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            // Look up the uniform offset for this specific edge
            const edgeStr = JSON.stringify([Math.min(i, nIdx), Math.max(i, nIdx)]);
            const uniformOffset = edgeMap.get(edgeStr).uniformOffset;
            return [
                vertex[0] + dx / len * uniformOffset,
                vertex[1] + dy / len * uniformOffset,
                vertex[2] + dz / len * uniformOffset
            ];
        });

        // Sort arm endpoints CCW for correct Newell normal
        const sortedArms = sortPointsCCWAroundVertex(vertex, armPts3D);

        const center3D = projectVertexOntoArmPlane(vertex, sortedArms);
        const cx = center3D[0], cy = center3D[1], cz = center3D[2];

        // Compute best-fit plane normal via Newell's method (outward-facing)
        const N = sortedArms.length;
        let nx = 0, ny = 0, nz = 0;
        for (let k = 0; k < N; k++) {
            const a = sortedArms[k], b = sortedArms[(k + 1) % N];
            const ax = a[0] - cx, ay = a[1] - cy, az = a[2] - cz;
            const bx = b[0] - cx, by = b[1] - cy, bz = b[2] - cz;
            nx += ay * bz - az * by;
            ny += az * bx - ax * bz;
            nz += ax * by - ay * bx;
        }
        let nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (nLen < 1e-10) { nx = 0; ny = 0; nz = 1; }
        else { nx /= nLen; ny /= nLen; nz /= nLen; }
        if (vertex[0] * nx + vertex[1] * ny + vertex[2] * nz < 0) { nx = -nx; ny = -ny; nz = -nz; }

        const zAxis = new THREE.Vector3(nx, ny, nz);
        const toFirst = new THREE.Vector3(sortedArms[0][0] - cx, sortedArms[0][1] - cy, sortedArms[0][2] - cz);
        const xAxis = toFirst.clone().addScaledVector(zAxis, -toFirst.dot(zAxis)).normalize();
        const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();

        const arms2D = sortedArms.map(p => {
            const dx = p[0] - cx, dy = p[1] - cy, dz = p[2] - cz;
            const px = dx * xAxis.x + dy * xAxis.y + dz * xAxis.z;
            const py = dx * yAxis.x + dy * yAxis.y + dz * yAxis.z;
            const len = Math.sqrt(px * px + py * py);
            return { dir: [px / len, py / len], len };
        });
        arms2D.sort((a, b) => Math.atan2(a.dir[1], a.dir[0]) - Math.atan2(b.dir[1], b.dir[0]));

        return { center3D, zAxis, xAxis, yAxis, arms2D };
    });
}

// Show connector wireframe lines (uniform mode — variable arm lengths)
function showConnectorPiecesUniform() {
    if (connectorWireframeGroup) {
        scene.remove(connectorWireframeGroup);
        connectorWireframeGroup = null;
    }
    if (!geodesicSphere) return;

    const connectorOffset = getScaledConnectorOffset();
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const classicOffsetRatio = connectorOffset / radius;
    const { edgeMap } = computeEdgeOffsets(geodesicSphere, classicOffsetRatio);

    // Build adjacency
    const adjacency = new Array(geodesicSphere.vertices.length).fill(null).map(() => []);
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        adjacency[i].push(j);
        adjacency[j].push(i);
    }

    // Precompute arm endpoints with per-edge uniform offset
    const armEndpoints = geodesicSphere.vertices.map((vertex, i) => {
        return adjacency[i].map(nIdx => {
            const nb = geodesicSphere.vertices[nIdx];
            const dx = nb[0] - vertex[0], dy = nb[1] - vertex[1], dz = nb[2] - vertex[2];
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const edgeStr = JSON.stringify([Math.min(i, nIdx), Math.max(i, nIdx)]);
            const uniformOffset = edgeMap.get(edgeStr).uniformOffset;
            return [
                vertex[0] + dx / len * uniformOffset,
                vertex[1] + dy / len * uniformOffset,
                vertex[2] + dz / len * uniformOffset
            ];
        });
    });

    const projectedCenters = geodesicSphere.vertices.map((vertex, i) =>
        projectVertexOntoArmPlane(vertex, armEndpoints[i])
    );

    const positions = [];
    const colors = [];
    const edgeColors = geodesicSphere.getEdgeColors();

    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];
        const dx = v2[0] - v1[0], dy = v2[1] - v1[1], dz = v2[2] - v1[2];
        const edgeLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const dirX = dx / edgeLength, dirY = dy / edgeLength, dirZ = dz / edgeLength;

        const uniformOffset = edgeMap.get(edgeStr).uniformOffset;
        const p1 = [v1[0] + dirX * uniformOffset, v1[1] + dirY * uniformOffset, v1[2] + dirZ * uniformOffset];
        const p2 = [v2[0] - dirX * uniformOffset, v2[1] - dirY * uniformOffset, v2[2] - dirZ * uniformOffset];

        const c1 = projectedCenters[i];
        const c2 = projectedCenters[j];

        const hex = edgeColors.get(edgeStr);
        const r = ((hex >> 16) & 0xFF) / 255;
        const g = ((hex >> 8) & 0xFF) / 255;
        const b = (hex & 0xFF) / 255;

        positions.push(c1[0], c1[1], c1[2], p1[0], p1[1], p1[2]);
        colors.push(r, g, b, r, g, b);
        positions.push(c2[0], c2[1], c2[2], p2[0], p2[1], p2[2]);
        colors.push(r, g, b, r, g, b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 1 });
    connectorWireframeGroup = new THREE.LineSegments(geometry, material);
    scene.add(connectorWireframeGroup);
}

// Show connector struts as star-shaped pieces (uniform mode — variable arm lengths)
function showConnectorStrutsUniform() {
    if (connectorStrutFacesGroup) scene.remove(connectorStrutFacesGroup);
    if (connectorStrutWireframeGroup) scene.remove(connectorStrutWireframeGroup);
    if (!geodesicSphere) return;

    const strutParams = getScaledStrutParams();
    const connectorOffset = getScaledConnectorOffset();
    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const classicOffsetRatio = connectorOffset / (diameter / 2);
    const { edgeMap } = computeEdgeOffsets(geodesicSphere, classicOffsetRatio);

    connectorStrutFacesGroup = new THREE.Group();
    connectorStrutWireframeGroup = new THREE.Group();

    const connectors = computeConnectorDataUniform(geodesicSphere, classicOffsetRatio, edgeMap);
    for (const conn of connectors) {
        const { center3D, zAxis, xAxis, yAxis, arms2D } = conn;
        const shape = createConnectorShape(arms2D, strutParams.B, strutParams.R);
        const geometry = new THREE.ShapeGeometry(shape);

        const facesMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            color: 0xcccccc, side: THREE.DoubleSide, transparent: true, opacity: 0.85
        }));
        const wireframeMesh = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 })
        );

        facesMesh.position.set(center3D[0], center3D[1], center3D[2]);
        wireframeMesh.position.set(center3D[0], center3D[1], center3D[2]);

        const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
        const quat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
        facesMesh.quaternion.copy(quat);
        wireframeMesh.quaternion.copy(quat);

        connectorStrutFacesGroup.add(facesMesh);
        connectorStrutWireframeGroup.add(wireframeMesh);
    }

    scene.add(connectorStrutFacesGroup);
    scene.add(connectorStrutWireframeGroup);
    updateConnectorStrutsVisibility();
}
