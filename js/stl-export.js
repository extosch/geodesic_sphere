// STL Export — assembled geodesic sphere as a single STL mesh
// Reuses existing shape/data functions (read-only), builds temporary
// ExtrudeGeometry meshes, merges them, and downloads as STL.
// No modifications to scene or existing visualization groups.

const STL_THICKNESS_MM = 3.0; // Default material thickness

function exportSTL() {
    if (!geodesicSphere) {
        alert('Bitte zuerst eine Kugel erzeugen.');
        return;
    }

    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const connectorOffset = getScaledConnectorOffset();
    const strutParams = getScaledStrutParams();
    const offsetRatio = connectorOffset / radius;

    // Thickness in unit-sphere scale (mm → cm → unit-sphere)
    const thickness = STL_THICKNESS_MM / 10 / radius;

    const extrudeSettings = { depth: thickness, bevelEnabled: false };

    // Temporary export group — never added to the scene
    const exportGroup = new THREE.Group();

    if (currentMode === 'classic') {
        buildStrutMeshesClassic(exportGroup, strutParams, offsetRatio, extrudeSettings);
        buildConnectorMeshesClassic(exportGroup, strutParams, offsetRatio, extrudeSettings);
    } else {
        buildStrutMeshesUniform(exportGroup, strutParams, offsetRatio, extrudeSettings);
        buildConnectorMeshesUniform(exportGroup, strutParams, offsetRatio, extrudeSettings);
    }

    // Scale from unit-sphere to real cm dimensions
    exportGroup.scale.set(radius, radius, radius);

    // Update world matrices so STLExporter sees correct transforms
    exportGroup.updateMatrixWorld(true);

    // Parse to STL string
    const exporter = new THREE.STLExporter();
    const stlString = exporter.parse(exportGroup);

    // Dispose all temporary geometries
    exportGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });

    // Download
    const prefix = getDxfPrefix(); // reuse naming helper from dxf-export.js
    downloadSTLFile(stlString, `${prefix}_assembled.stl`);
}

// ─── Strut meshes (classic mode) ───

function buildStrutMeshesClassic(group, strutParams, offsetRatio, extrudeSettings) {
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];

        const dx = v2[0] - v1[0], dy = v2[1] - v1[1], dz = v2[2] - v1[2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const dirX = dx / len, dirY = dy / len, dirZ = dz / len;

        const start = [v1[0] + dirX * offsetRatio, v1[1] + dirY * offsetRatio, v1[2] + dirZ * offsetRatio];
        const end = [v2[0] - dirX * offsetRatio, v2[1] - dirY * offsetRatio, v2[2] - dirZ * offsetRatio];

        const sdx = end[0] - start[0], sdy = end[1] - start[1], sdz = end[2] - start[2];
        const shortenedLength = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);

        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;
        const midZ = (start[2] + end[2]) / 2;

        const shape = createStrutShape(shortenedLength, strutParams.B, strutParams.R);
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Center extrusion so the shape sits symmetrically around the surface
        geometry.translate(0, 0, -extrudeSettings.depth / 2);

        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        mesh.position.set(midX, midY, midZ);
        applyStrutOrientation(mesh, sdx, sdy, sdz, midX, midY, midZ);
        group.add(mesh);
    }
}

// ─── Strut meshes (uniform mode) ───

function buildStrutMeshesUniform(group, strutParams, offsetRatio, extrudeSettings) {
    const { L_min, edgeMap } = computeEdgeOffsets(geodesicSphere, offsetRatio);

    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];

        const dx = v2[0] - v1[0], dy = v2[1] - v1[1], dz = v2[2] - v1[2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const dirX = dx / len, dirY = dy / len, dirZ = dz / len;

        const uniformOffset = edgeMap.get(edgeStr).uniformOffset;
        const start = [v1[0] + dirX * uniformOffset, v1[1] + dirY * uniformOffset, v1[2] + dirZ * uniformOffset];
        const end = [v2[0] - dirX * uniformOffset, v2[1] - dirY * uniformOffset, v2[2] - dirZ * uniformOffset];

        const sdx = end[0] - start[0], sdy = end[1] - start[1], sdz = end[2] - start[2];

        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;
        const midZ = (start[2] + end[2]) / 2;

        const shape = createStrutShape(L_min, strutParams.B, strutParams.R);
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.translate(0, 0, -extrudeSettings.depth / 2);

        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        mesh.position.set(midX, midY, midZ);
        applyStrutOrientation(mesh, sdx, sdy, sdz, midX, midY, midZ);
        group.add(mesh);
    }
}

// ─── Connector meshes (classic mode) ───

function buildConnectorMeshesClassic(group, strutParams, offsetRatio, extrudeSettings) {
    const connectors = computeConnectorData(geodesicSphere, offsetRatio);
    for (const conn of connectors) {
        const { center3D, zAxis, xAxis, yAxis, arms2D } = conn;
        const shape = createConnectorShape(arms2D, strutParams.B, strutParams.R);
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.translate(0, 0, -extrudeSettings.depth / 2);

        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        mesh.position.set(center3D[0], center3D[1], center3D[2]);

        const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
        mesh.quaternion.setFromRotationMatrix(rotMatrix);
        group.add(mesh);
    }
}

// ─── Connector meshes (uniform mode) ───

function buildConnectorMeshesUniform(group, strutParams, offsetRatio, extrudeSettings) {
    const { edgeMap } = computeEdgeOffsets(geodesicSphere, offsetRatio);
    const connectors = computeConnectorDataUniform(geodesicSphere, offsetRatio, edgeMap);
    for (const conn of connectors) {
        const { center3D, zAxis, xAxis, yAxis, arms2D } = conn;
        const shape = createConnectorShape(arms2D, strutParams.B, strutParams.R);
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.translate(0, 0, -extrudeSettings.depth / 2);

        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        mesh.position.set(center3D[0], center3D[1], center3D[2]);

        const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
        mesh.quaternion.setFromRotationMatrix(rotMatrix);
        group.add(mesh);
    }
}

// ─── Shared helpers ───

function applyStrutOrientation(mesh, sdx, sdy, sdz, midX, midY, midZ) {
    const xAxis = new THREE.Vector3(sdx, sdy, sdz).normalize();
    const zAxis = new THREE.Vector3(midX, midY, midZ).normalize();
    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
    zAxis.crossVectors(xAxis, yAxis).normalize();

    const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
    mesh.quaternion.setFromRotationMatrix(rotMatrix);
}

// ─── Batch STL Export — one STL per part type, ALL instances in 3D ───
// Sum of all exported STL files = complete assembled 3D sphere.

function exportBatchSTL() {
    if (!geodesicSphere) { alert('Bitte zuerst eine Kugel erzeugen.'); return; }

    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const connectorOffset = getScaledConnectorOffset();
    const strutParams = getScaledStrutParams();
    const offsetRatio = connectorOffset / radius;
    const thickness = STL_THICKNESS_MM / 10 / radius;
    const extrudeSettings = { depth: thickness, bevelEnabled: false };

    const edgeTypeMap = geodesicSphere.getEdgeTypeMap();
    const typeLabels = 'ABCDEFGH';
    const prefix = getDxfPrefix();
    const exporter = new THREE.STLExporter();
    const files = [];

    // ─── Struts: group edges by type, build all instances in 3D ───
    // In uniform mode all struts have the same length → one single group
    const strutTypeGroups = new Map();
    for (const edgeStr of geodesicSphere.edges) {
        let typeLetter;
        if (currentMode === 'einheitsstrut') {
            typeLetter = 'Uni';
        } else {
            const typeIdx = edgeTypeMap.get(edgeStr);
            typeLetter = typeLabels[typeIdx] || String(typeIdx);
        }
        if (!strutTypeGroups.has(typeLetter)) strutTypeGroups.set(typeLetter, []);
        strutTypeGroups.get(typeLetter).push(edgeStr);
    }

    // Uniform mode: precompute edge offsets once
    let edgeMapUniform = null, L_minUniform = 0;
    if (currentMode === 'einheitsstrut') {
        const result = computeEdgeOffsets(geodesicSphere, offsetRatio);
        edgeMapUniform = result.edgeMap;
        L_minUniform = result.L_min;
    }

    for (const [typeLetter, edges] of strutTypeGroups) {
        const typeGroup = new THREE.Group();

        for (const edgeStr of edges) {
            const [i, j] = JSON.parse(edgeStr);
            const v1 = geodesicSphere.vertices[i];
            const v2 = geodesicSphere.vertices[j];

            const dx = v2[0] - v1[0], dy = v2[1] - v1[1], dz = v2[2] - v1[2];
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const dirX = dx / len, dirY = dy / len, dirZ = dz / len;

            let start, end, strutLength;
            if (currentMode === 'classic') {
                start = [v1[0] + dirX * offsetRatio, v1[1] + dirY * offsetRatio, v1[2] + dirZ * offsetRatio];
                end   = [v2[0] - dirX * offsetRatio, v2[1] - dirY * offsetRatio, v2[2] - dirZ * offsetRatio];
                const sdx = end[0] - start[0], sdy = end[1] - start[1], sdz = end[2] - start[2];
                strutLength = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);
            } else {
                const uniformOffset = edgeMapUniform.get(edgeStr).uniformOffset;
                start = [v1[0] + dirX * uniformOffset, v1[1] + dirY * uniformOffset, v1[2] + dirZ * uniformOffset];
                end   = [v2[0] - dirX * uniformOffset, v2[1] - dirY * uniformOffset, v2[2] - dirZ * uniformOffset];
                strutLength = L_minUniform;
            }

            const sdx = end[0] - start[0], sdy = end[1] - start[1], sdz = end[2] - start[2];
            const midX = (start[0] + end[0]) / 2;
            const midY = (start[1] + end[1]) / 2;
            const midZ = (start[2] + end[2]) / 2;

            const shape = createStrutShape(strutLength, strutParams.B, strutParams.R);
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.translate(0, 0, -extrudeSettings.depth / 2);

            const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
            mesh.position.set(midX, midY, midZ);
            applyStrutOrientation(mesh, sdx, sdy, sdz, midX, midY, midZ);
            typeGroup.add(mesh);
        }

        typeGroup.scale.set(radius, radius, radius); // unit-sphere → cm
        typeGroup.updateMatrixWorld(true);
        const stlString = exporter.parse(typeGroup);
        typeGroup.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        files.push({ stlString, fname: `${prefix}_${typeLetter}_Strut_x${edges.length}.stl` });
    }

    // ─── Connectors: classify vertices by type, build all instances in 3D ───
    let allConnectorData;
    if (currentMode === 'classic') {
        allConnectorData = computeConnectorData(geodesicSphere, offsetRatio);
    } else {
        allConnectorData = computeConnectorDataUniform(geodesicSphere, offsetRatio, edgeMapUniform);
    }

    // Build adjacency & classify vertices by canonical edge-type pattern
    const vertices = geodesicSphere.vertices;
    const adjacency = new Array(vertices.length).fill(null).map(() => []);
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        adjacency[i].push(j);
        adjacency[j].push(i);
    }

    const vertexPatterns = vertices.map((vertex, i) => {
        const sorted = sortNeighborsCCW(vertex, adjacency[i], vertices);
        const pattern = sorted.map(nIdx => {
            const eStr = JSON.stringify([Math.min(i, nIdx), Math.max(i, nIdx)]);
            return edgeTypeMap.get(eStr);
        });
        return canonicalizePattern(pattern);
    });

    const connectorGroups = new Map();
    vertexPatterns.forEach((canon, vIdx) => {
        if (!connectorGroups.has(canon)) connectorGroups.set(canon, []);
        connectorGroups.get(canon).push(vIdx);
    });

    const sortedConnGroups = [...connectorGroups.entries()].sort((a, b) => {
        const armsA = a[0].split(',').length, armsB = b[0].split(',').length;
        if (armsA !== armsB) return armsA - armsB;
        return a[0] < b[0] ? -1 : 1;
    });

    sortedConnGroups.forEach(([canon, vertexIndices], idx) => {
        const typeGroup = new THREE.Group();
        const arms = canon.split(',').length;
        const patternStr = canon.split(',').map(t => typeLabels[parseInt(t)] || t).join('');

        for (const vIdx of vertexIndices) {
            const conn = allConnectorData[vIdx];
            const { center3D, zAxis, xAxis, yAxis, arms2D } = conn;

            const shape = createConnectorShape(arms2D, strutParams.B, strutParams.R);
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.translate(0, 0, -extrudeSettings.depth / 2);

            const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
            mesh.position.set(center3D[0], center3D[1], center3D[2]);
            const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
            mesh.quaternion.setFromRotationMatrix(rotMatrix);
            typeGroup.add(mesh);
        }

        typeGroup.scale.set(radius, radius, radius); // unit-sphere → cm
        typeGroup.updateMatrixWorld(true);
        const stlString = exporter.parse(typeGroup);
        typeGroup.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        files.push({
            stlString,
            fname: `${prefix}_K${idx + 1}_${arms}arm_${patternStr}_x${vertexIndices.length}.stl`
        });
    });

    // Download with small delays to avoid browser blocking
    let delay = 0;
    for (const f of files) {
        setTimeout(() => downloadSTLFile(f.stlString, f.fname), delay);
        delay += 300;
    }

    console.log(`Exported ${files.length} STL files (all instances in 3D):\n${files.map(f => f.fname).join('\n')}`);
}

// ─── OBJ Export — Fusion 360 compatible, each mesh as a named object ───

function exportOBJ() {
    if (!geodesicSphere) {
        alert('Bitte zuerst eine Kugel erzeugen.');
        return;
    }

    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const connectorOffset = getScaledConnectorOffset();
    const strutParams = getScaledStrutParams();
    const offsetRatio = connectorOffset / radius;
    const thickness = STL_THICKNESS_MM / 10 / radius;
    const extrudeSettings = { depth: thickness, bevelEnabled: false };

    const root = new THREE.Group();
    root.name = getDxfPrefix();

    const strutsGroup = new THREE.Group();
    strutsGroup.name = 'Struts';
    const connectorsGroup = new THREE.Group();
    connectorsGroup.name = 'Connectors';
    root.add(strutsGroup);
    root.add(connectorsGroup);

    const edgeTypeMap = geodesicSphere.getEdgeTypeMap();
    const typeLabels = 'ABCDEFGH';
    const strutCounters = {};
    const connectorCounter = { n: 0 };

    if (currentMode === 'classic') {
        buildNamedStrutMeshesClassic(strutsGroup, strutParams, offsetRatio, extrudeSettings, edgeTypeMap, typeLabels, strutCounters);
        buildNamedConnectorMeshesClassic(connectorsGroup, strutParams, offsetRatio, extrudeSettings, connectorCounter);
    } else {
        buildNamedStrutMeshesUniform(strutsGroup, strutParams, offsetRatio, extrudeSettings, strutCounters);
        buildNamedConnectorMeshesUniform(connectorsGroup, strutParams, offsetRatio, extrudeSettings, connectorCounter);
    }

    root.updateMatrixWorld(true);

    const exporter = new THREE.OBJExporter();
    const objString = exporter.parse(root);

    // Dispose temporary geometries
    root.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });

    const blob = new Blob([objString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getDxfPrefix()}_assembled.obj`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─── GLB Export — structured scene graph with named, individually selectable bodies ───

function exportGLB() {
    if (!geodesicSphere) {
        alert('Bitte zuerst eine Kugel erzeugen.');
        return;
    }

    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const radius = diameter / 2;
    const connectorOffset = getScaledConnectorOffset();
    const strutParams = getScaledStrutParams();
    const offsetRatio = connectorOffset / radius;
    const thickness = STL_THICKNESS_MM / 10 / radius;
    const extrudeSettings = { depth: thickness, bevelEnabled: false };

    // Root group with descriptive name
    const root = new THREE.Group();
    root.name = getDxfPrefix();

    // Sub-groups for organization
    const strutsGroup = new THREE.Group();
    strutsGroup.name = 'Struts';
    const connectorsGroup = new THREE.Group();
    connectorsGroup.name = 'Connectors';
    root.add(strutsGroup);
    root.add(connectorsGroup);

    // Edge type map for naming struts
    const edgeTypeMap = geodesicSphere.getEdgeTypeMap();
    const typeLabels = 'ABCDEFGH';
    const strutCounters = {};
    const connectorCounter = { n: 0 };

    if (currentMode === 'classic') {
        buildNamedStrutMeshesClassic(strutsGroup, strutParams, offsetRatio, extrudeSettings, edgeTypeMap, typeLabels, strutCounters);
        buildNamedConnectorMeshesClassic(connectorsGroup, strutParams, offsetRatio, extrudeSettings, connectorCounter);
    } else {
        buildNamedStrutMeshesUniform(strutsGroup, strutParams, offsetRatio, extrudeSettings, strutCounters);
        buildNamedConnectorMeshesUniform(connectorsGroup, strutParams, offsetRatio, extrudeSettings, connectorCounter);
    }

    root.updateMatrixWorld(true);

    const exporter = new THREE.GLTFExporter();
    exporter.parse(root, function(result) {
        // Dispose temporary geometries
        root.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });

        const blob = new Blob([result], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${getDxfPrefix()}_assembled.glb`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, { binary: true });
}

// ─── Named strut meshes for GLB (classic) ───

function buildNamedStrutMeshesClassic(group, strutParams, offsetRatio, extrudeSettings, edgeTypeMap, typeLabels, counters) {
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];

        const dx = v2[0] - v1[0], dy = v2[1] - v1[1], dz = v2[2] - v1[2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const dirX = dx / len, dirY = dy / len, dirZ = dz / len;

        const start = [v1[0] + dirX * offsetRatio, v1[1] + dirY * offsetRatio, v1[2] + dirZ * offsetRatio];
        const end = [v2[0] - dirX * offsetRatio, v2[1] - dirY * offsetRatio, v2[2] - dirZ * offsetRatio];
        const sdx = end[0] - start[0], sdy = end[1] - start[1], sdz = end[2] - start[2];
        const shortenedLength = Math.sqrt(sdx * sdx + sdy * sdy + sdz * sdz);
        const midX = (start[0] + end[0]) / 2, midY = (start[1] + end[1]) / 2, midZ = (start[2] + end[2]) / 2;

        const shape = createStrutShape(shortenedLength, strutParams.B, strutParams.R);
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.translate(0, 0, -extrudeSettings.depth / 2);

        // Name by edge type
        const typeIdx = edgeTypeMap.get(edgeStr);
        const typeLetter = typeLabels[typeIdx] || typeIdx;
        counters[typeLetter] = (counters[typeLetter] || 0) + 1;

        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
        mesh.name = `Strut_${typeLetter}_${String(counters[typeLetter]).padStart(3, '0')}`;
        mesh.position.set(midX, midY, midZ);
        applyStrutOrientation(mesh, sdx, sdy, sdz, midX, midY, midZ);
        group.add(mesh);
    }
}

// ─── Named strut meshes for GLB (uniform) ───

function buildNamedStrutMeshesUniform(group, strutParams, offsetRatio, extrudeSettings, counters) {
    const { L_min, edgeMap } = computeEdgeOffsets(geodesicSphere, offsetRatio);
    let idx = 0;

    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        const v1 = geodesicSphere.vertices[i];
        const v2 = geodesicSphere.vertices[j];

        const dx = v2[0] - v1[0], dy = v2[1] - v1[1], dz = v2[2] - v1[2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const dirX = dx / len, dirY = dy / len, dirZ = dz / len;

        const uniformOffset = edgeMap.get(edgeStr).uniformOffset;
        const start = [v1[0] + dirX * uniformOffset, v1[1] + dirY * uniformOffset, v1[2] + dirZ * uniformOffset];
        const end = [v2[0] - dirX * uniformOffset, v2[1] - dirY * uniformOffset, v2[2] - dirZ * uniformOffset];
        const sdx = end[0] - start[0], sdy = end[1] - start[1], sdz = end[2] - start[2];
        const midX = (start[0] + end[0]) / 2, midY = (start[1] + end[1]) / 2, midZ = (start[2] + end[2]) / 2;

        const shape = createStrutShape(L_min, strutParams.B, strutParams.R);
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.translate(0, 0, -extrudeSettings.depth / 2);

        idx++;
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
        mesh.name = `Strut_Uni_${String(idx).padStart(3, '0')}`;
        mesh.position.set(midX, midY, midZ);
        applyStrutOrientation(mesh, sdx, sdy, sdz, midX, midY, midZ);
        group.add(mesh);
    }
}

// ─── Named connector meshes for GLB (classic) ───

function buildNamedConnectorMeshesClassic(group, strutParams, offsetRatio, extrudeSettings, counter) {
    const connectors = computeConnectorData(geodesicSphere, offsetRatio);
    for (const conn of connectors) {
        const { center3D, zAxis, xAxis, yAxis, arms2D } = conn;
        const shape = createConnectorShape(arms2D, strutParams.B, strutParams.R);
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.translate(0, 0, -extrudeSettings.depth / 2);

        counter.n++;
        const arms = arms2D.length;
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xe0e0e0 }));
        mesh.name = `Conn_${arms}arm_${String(counter.n).padStart(3, '0')}`;
        mesh.position.set(center3D[0], center3D[1], center3D[2]);

        const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
        mesh.quaternion.setFromRotationMatrix(rotMatrix);
        group.add(mesh);
    }
}

// ─── Named connector meshes for GLB (uniform) ───

function buildNamedConnectorMeshesUniform(group, strutParams, offsetRatio, extrudeSettings, counter) {
    const { edgeMap } = computeEdgeOffsets(geodesicSphere, offsetRatio);
    const connectors = computeConnectorDataUniform(geodesicSphere, offsetRatio, edgeMap);
    for (const conn of connectors) {
        const { center3D, zAxis, xAxis, yAxis, arms2D } = conn;
        const shape = createConnectorShape(arms2D, strutParams.B, strutParams.R);
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.translate(0, 0, -extrudeSettings.depth / 2);

        counter.n++;
        const arms = arms2D.length;
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xe0e0e0 }));
        mesh.name = `Conn_${arms}arm_${String(counter.n).padStart(3, '0')}`;
        mesh.position.set(center3D[0], center3D[1], center3D[2]);

        const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
        mesh.quaternion.setFromRotationMatrix(rotMatrix);
        group.add(mesh);
    }
}

// ─── Download helpers ───

function downloadSTLFile(stlString, filename) {
    const blob = new Blob([stlString], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
