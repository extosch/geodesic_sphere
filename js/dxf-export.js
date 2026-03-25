// DXF Export Functions
// Generate AutoCAD R12 DXF files for laser cutting

// ─── DXF Building Helpers ───

function dxfHeader(layers) {
    let dxf = '';
    dxf += '0\nSECTION\n2\nHEADER\n';
    dxf += '9\n$ACADVER\n1\nAC1009\n';
    dxf += '9\n$INSUNITS\n70\n4\n'; // mm
    dxf += '0\nENDSEC\n';
    // Tables
    dxf += '0\nSECTION\n2\nTABLES\n';
    dxf += '0\nTABLE\n2\nLTYPE\n70\n1\n';
    dxf += '0\nLTYPE\n2\nCONTINUOUS\n70\n0\n3\nSolid line\n72\n65\n73\n0\n40\n0.0\n';
    dxf += '0\nENDTAB\n';
    dxf += `0\nTABLE\n2\nLAYER\n70\n${layers.length}\n`;
    for (const lay of layers) {
        dxf += `0\nLAYER\n2\n${lay.name}\n70\n0\n62\n${lay.color}\n6\nCONTINUOUS\n`;
    }
    dxf += '0\nENDTAB\n';
    dxf += '0\nTABLE\n2\nSTYLE\n70\n0\n0\nENDTAB\n';
    dxf += '0\nENDSEC\n';
    dxf += '0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n';
    dxf += '0\nSECTION\n2\nENTITIES\n';
    return dxf;
}

function dxfFooter() {
    return '0\nENDSEC\n0\nEOF\n';
}

function dxfPolyline(layer, points) {
    let dxf = `0\nPOLYLINE\n8\n${layer}\n66\n1\n70\n1\n`;
    for (const p of points) {
        dxf += `0\nVERTEX\n8\n${layer}\n10\n${p[0].toFixed(4)}\n20\n${p[1].toFixed(4)}\n30\n0.0\n`;
    }
    dxf += '0\nSEQEND\n';
    return dxf;
}

function dxfCircle(layer, cx, cy, r) {
    return `0\nCIRCLE\n8\n${layer}\n10\n${cx.toFixed(4)}\n20\n${cy.toFixed(4)}\n30\n0.0\n40\n${r.toFixed(4)}\n`;
}

function dxfText(layer, cx, cy, height, text) {
    let dxf = `0\nTEXT\n8\n${layer}\n`;
    dxf += `10\n0.0\n20\n0.0\n30\n0.0\n`;
    dxf += `40\n${height.toFixed(2)}\n`;
    dxf += `1\n${text}\n50\n0.0\n72\n1\n73\n2\n`;
    dxf += `11\n${cx.toFixed(4)}\n21\n${cy.toFixed(4)}\n31\n0.0\n`;
    return dxf;
}

function downloadDxf(content, filename) {
    const blob = new Blob([content], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─── Capsule Strut Outline (2D points in mm) ───

function strutCapsulePoints(L_mm, B_mm) {
    const numSeg = 64;
    const pts = [];
    pts.push([-L_mm / 2, -B_mm / 2]);
    pts.push([L_mm / 2, -B_mm / 2]);
    for (let i = 1; i <= numSeg; i++) {
        const a = -Math.PI / 2 + (Math.PI * i / numSeg);
        pts.push([L_mm / 2 + (B_mm / 2) * Math.cos(a), (B_mm / 2) * Math.sin(a)]);
    }
    pts.push([-L_mm / 2, B_mm / 2]);
    for (let i = 1; i < numSeg; i++) {
        const a = Math.PI / 2 + (Math.PI * i / numSeg);
        pts.push([-L_mm / 2 + (B_mm / 2) * Math.cos(a), (B_mm / 2) * Math.sin(a)]);
    }
    return pts;
}

// ─── Connector Star Outline (2D points in mm) ───

function connectorStarPoints(arms2D, B_mm, R_mm) {
    const N = arms2D.length;
    const halfB = B_mm / 2;
    const right = arms2D.map(a => [a.dir[1], -a.dir[0]]);
    const left = arms2D.map(a => [-a.dir[1], a.dir[0]]);

    function lineIntersect2D(p1, d1, p2, d2) {
        const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
        const denom = d1[0] * d2[1] - d1[1] * d2[0];
        if (Math.abs(denom) < 1e-10) return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
        const t = (dx * d2[1] - dy * d2[0]) / denom;
        return [p1[0] + t * d1[0], p1[1] + t * d1[1]];
    }

    const T = arms2D.map((_, k) => {
        const kn = (k + 1) % N;
        const p1 = [left[k][0] * halfB, left[k][1] * halfB];
        const p2 = [right[kn][0] * halfB, right[kn][1] * halfB];
        return lineIntersect2D(p1, arms2D[k].dir, p2, arms2D[kn].dir);
    });

    const numArc = 32;
    const pts = [];
    for (let k = 0; k < N; k++) {
        const arm = arms2D[k];
        const tipCx = arm.dir[0] * arm.len;
        const tipCy = arm.dir[1] * arm.len;
        // Right side of arm → tip
        pts.push([tipCx + right[k][0] * halfB, tipCy + right[k][1] * halfB]);
        // Semicircular tip cap
        const angleRight = Math.atan2(right[k][1], right[k][0]);
        const angleLeft = Math.atan2(left[k][1], left[k][0]);
        let sweep = angleLeft - angleRight;
        if (sweep < 0) sweep += 2 * Math.PI;
        for (let s = 1; s <= numArc; s++) {
            const a = angleRight + sweep * s / numArc;
            pts.push([tipCx + halfB * Math.cos(a), tipCy + halfB * Math.sin(a)]);
        }
        // Left side of arm → transition
        pts.push(T[k]);
    }

    // Hole centers
    const holes = arms2D.map(arm => ({
        cx: arm.dir[0] * arm.len,
        cy: arm.dir[1] * arm.len,
        r: R_mm
    }));

    return { outline: pts, holes };
}

// ─── Build DXF for one Strut Type ───

function buildStrutDxf(typeLetter, L_mm, B_mm, R_mm, qty) {
    const layers = [
        { name: 'outline', color: 1 },
        { name: 'holes', color: 5 },
        { name: 'text', color: 7 }
    ];
    let dxf = dxfHeader(layers);
    dxf += dxfPolyline('outline', strutCapsulePoints(L_mm, B_mm));
    dxf += dxfCircle('holes', -L_mm / 2, 0, R_mm);
    dxf += dxfCircle('holes', L_mm / 2, 0, R_mm);
    const textH = Math.min(B_mm * 0.85, 10);
    dxf += dxfText('text', 0, 0, textH, `${typeLetter} x${qty}`);
    dxf += dxfFooter();
    return dxf;
}

// ─── Build DXF for one Connector Type ───

function buildConnectorDxf(typeName, arms2D, B_mm, R_mm, qty) {
    const layers = [
        { name: 'outline', color: 1 },
        { name: 'holes', color: 5 },
        { name: 'text', color: 7 }
    ];
    let dxf = dxfHeader(layers);

    // Scale arms2D from unit-sphere coords to mm
    const { outline, holes } = connectorStarPoints(arms2D, B_mm, R_mm);
    dxf += dxfPolyline('outline', outline);
    for (const h of holes) {
        dxf += dxfCircle('holes', h.cx, h.cy, h.r);
    }
    const textH = Math.min(B_mm * 0.6, 8);
    dxf += dxfText('text', 0, 0, textH, `${typeName} x${qty}`);
    dxf += dxfFooter();
    return dxf;
}

// ─── Filename Helpers ───

function getDxfPrefix() {
    const freq = parseInt(document.getElementById('frequency').value) || 1;
    const diam = Math.round(parseFloat(document.getElementById('diameter').value) || 100);
    return `Geo_F${freq}_D${diam}cm`;
}

// ─── Gather All Export Data ───

function gatherExportParts() {
    if (!geodesicSphere) return null;

    const diameter = parseFloat(document.getElementById('diameter').value) || 100;
    const connectorOffset = getScaledConnectorOffset();
    const strutParams = getScaledStrutParams();
    const radius = diameter / 2;

    // --- Strut types ---
    const edgeDetails = geodesicSphere.getEdgeLengthDetails(diameter, connectorOffset);
    const strutB_mm = strutParams.B * (edgeDetails[0].length / strutParams.L) * 10;
    const strutR_mm = strutParams.R * (edgeDetails[0].length / strutParams.L) * 10;

    const struts = edgeDetails.map(e => ({
        type: e.type,
        qty: e.count,
        L_mm: e.length * 10,
        B_mm: strutB_mm,
        R_mm: strutR_mm
    }));

    // --- Connector types ---
    const edgeTypeMap = geodesicSphere.getEdgeTypeMap();
    const vertices = geodesicSphere.vertices;
    const typeLabels = 'ABCDEFGH';
    const offsetRatio = connectorOffset / radius;

    // Build adjacency
    const adjacency = new Array(vertices.length).fill(null).map(() => []);
    for (const edgeStr of geodesicSphere.edges) {
        const [i, j] = JSON.parse(edgeStr);
        adjacency[i].push(j);
        adjacency[j].push(i);
    }

    // Classify vertices by canonical pattern
    const vertexPatterns = vertices.map((vertex, i) => {
        const sorted = sortNeighborsCCW(vertex, adjacency[i], vertices);
        const pattern = sorted.map(nIdx => {
            const edgeStr = JSON.stringify([Math.min(i, nIdx), Math.max(i, nIdx)]);
            return edgeTypeMap.get(edgeStr);
        });
        return canonicalizePattern(pattern);
    });

    const groups = new Map();
    vertexPatterns.forEach((canon, vIdx) => {
        if (!groups.has(canon)) groups.set(canon, []);
        groups.get(canon).push(vIdx);
    });

    const sortedGroups = [...groups.entries()].sort((a, b) => {
        const armsA = a[0].split(',').length, armsB = b[0].split(',').length;
        if (armsA !== armsB) return armsA - armsB;
        return a[0] < b[0] ? -1 : 1;
    });

    // For each connector type, compute arms2D from one representative vertex
    // Scale arm lengths to mm
    const connectors = sortedGroups.map(([canon, verts], idx) => {
        const reprIdx = verts[0];
        const vertex = vertices[reprIdx];
        const sortedNeighbors = sortNeighborsCCW(vertex, adjacency[reprIdx], vertices);

        // Build arm endpoints in unit-sphere coords
        const armPts3D = sortedNeighbors.map(nIdx => {
            const nb = vertices[nIdx];
            const dx = nb[0] - vertex[0], dy = nb[1] - vertex[1], dz = nb[2] - vertex[2];
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            return [
                vertex[0] + dx / len * offsetRatio,
                vertex[1] + dy / len * offsetRatio,
                vertex[2] + dz / len * offsetRatio
            ];
        });

        const center3D = projectVertexOntoArmPlane(vertex, armPts3D);
        const cx = center3D[0], cy = center3D[1], cz = center3D[2];

        // Newell normal
        const N = armPts3D.length;
        let nx = 0, ny = 0, nz = 0;
        for (let k = 0; k < N; k++) {
            const a = armPts3D[k], b = armPts3D[(k + 1) % N];
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
        const toFirst = new THREE.Vector3(armPts3D[0][0] - cx, armPts3D[0][1] - cy, armPts3D[0][2] - cz);
        const xAxis = toFirst.clone().addScaledVector(zAxis, -toFirst.dot(zAxis)).normalize();
        const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();

        // Project to 2D (unit-sphere scale)
        const arms2D = armPts3D.map(p => {
            const dx = p[0] - cx, dy = p[1] - cy, dz = p[2] - cz;
            const px = dx * xAxis.x + dy * xAxis.y + dz * xAxis.z;
            const py = dx * yAxis.x + dy * yAxis.y + dz * yAxis.z;
            const len = Math.sqrt(px * px + py * py);
            return { dir: [px / len, py / len], len };
        });
        arms2D.sort((a, b) => Math.atan2(a.dir[1], a.dir[0]) - Math.atan2(b.dir[1], b.dir[0]));

        // Scale arms2D lengths from unit sphere to mm
        const scaleFactor = radius * 10; // unit sphere → mm
        const arms2D_mm = arms2D.map(a => ({
            dir: a.dir,
            len: a.len * scaleFactor
        }));

        const arms = canon.split(',').length;
        const patternStr = canon.split(',').map(t => typeLabels[parseInt(t)] || t).join('');

        return {
            name: `K${idx + 1}`,
            arms,
            pattern: patternStr,
            qty: verts.length,
            arms2D_mm
        };
    });

    const B_mm = strutB_mm;
    const R_mm = strutR_mm;

    return { struts, connectors, B_mm, R_mm };
}

// ─── Export All Parts ───

function exportAllDXF() {
    const parts = gatherExportParts();
    if (!parts) { alert('No sphere generated yet.'); return; }

    const prefix = getDxfPrefix();
    const files = [];

    // Strut DXFs
    for (const s of parts.struts) {
        const content = buildStrutDxf(s.type, s.L_mm, s.B_mm, s.R_mm, s.qty);
        const fname = `${prefix}_${s.type}_Strut_x${s.qty}.dxf`;
        files.push({ content, fname });
    }

    // Connector DXFs
    for (const c of parts.connectors) {
        const content = buildConnectorDxf(
            `${c.name} ${c.pattern}`, c.arms2D_mm, parts.B_mm, parts.R_mm, c.qty
        );
        const fname = `${prefix}_${c.name}_${c.arms}arm_${c.pattern}_x${c.qty}.dxf`;
        files.push({ content, fname });
    }

    // Download sequentially with small delays to avoid browser blocking
    let delay = 0;
    for (const f of files) {
        setTimeout(() => downloadDxf(f.content, f.fname), delay);
        delay += 300;
    }

    const summary = files.map(f => f.fname).join('\n');
    console.log(`Exported ${files.length} DXF files:\n${summary}`);
}

// ─── Legacy single-strut export (kept for backward compat) ───

function exportTestStrutToDXF() {
    const parts = gatherExportParts();
    if (!parts || parts.struts.length === 0) { alert('No sphere generated yet.'); return; }
    const s = parts.struts[0];
    const content = buildStrutDxf(s.type, s.L_mm, s.B_mm, s.R_mm, s.qty);
    const prefix = getDxfPrefix();
    downloadDxf(content, `${prefix}_${s.type}_Strut_x${s.qty}.dxf`);
}
