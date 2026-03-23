// DXF Export Functions
// Generate AutoCAD R12 DXF files for manufacturing

function exportSimpleCircleDXF() {
    // Create complete DXF file with proper structure
    let dxf = '';
    
    // Header section
    dxf += '0\n';
    dxf += 'SECTION\n';
    dxf += '2\n';
    dxf += 'HEADER\n';
    dxf += '9\n';
    dxf += '$ACADVER\n';
    dxf += '1\n';
    dxf += 'AC1009\n';
    dxf += '9\n';
    dxf += '$INSUNITS\n';
    dxf += '70\n';
    dxf += '4\n';
    dxf += '0\n';
    dxf += 'ENDSEC\n';
    
    // Tables section
    dxf += '0\n';
    dxf += 'SECTION\n';
    dxf += '2\n';
    dxf += 'TABLES\n';
    
    // LTYPE table
    dxf += '0\n';
    dxf += 'TABLE\n';
    dxf += '2\n';
    dxf += 'LTYPE\n';
    dxf += '70\n';
    dxf += '1\n';
    dxf += '0\n';
    dxf += 'LTYPE\n';
    dxf += '2\n';
    dxf += 'CONTINUOUS\n';
    dxf += '70\n';
    dxf += '0\n';
    dxf += '3\n';
    dxf += 'Solid line\n';
    dxf += '72\n';
    dxf += '65\n';
    dxf += '73\n';
    dxf += '0\n';
    dxf += '40\n';
    dxf += '0.0\n';
    dxf += '0\n';
    dxf += 'ENDTAB\n';
    
    // LAYER table
    dxf += '0\n';
    dxf += 'TABLE\n';
    dxf += '2\n';
    dxf += 'LAYER\n';
    dxf += '70\n';
    dxf += '1\n';
    dxf += '0\n';
    dxf += 'LAYER\n';
    dxf += '2\n';
    dxf += '0\n';
    dxf += '70\n';
    dxf += '0\n';
    dxf += '62\n';
    dxf += '7\n';
    dxf += '6\n';
    dxf += 'CONTINUOUS\n';
    dxf += '0\n';
    dxf += 'ENDTAB\n';
    
    // STYLE table
    dxf += '0\n';
    dxf += 'TABLE\n';
    dxf += '2\n';
    dxf += 'STYLE\n';
    dxf += '70\n';
    dxf += '0\n';
    dxf += '0\n';
    dxf += 'ENDTAB\n';
    
    dxf += '0\n';
    dxf += 'ENDSEC\n';
    
    // Blocks section
    dxf += '0\n';
    dxf += 'SECTION\n';
    dxf += '2\n';
    dxf += 'BLOCKS\n';
    dxf += '0\n';
    dxf += 'ENDSEC\n';
    
    // Entities section
    dxf += '0\n';
    dxf += 'SECTION\n';
    dxf += '2\n';
    dxf += 'ENTITIES\n';
    
    // Circle: center at (0,0), radius 50mm
    dxf += '0\n';
    dxf += 'CIRCLE\n';
    dxf += '8\n';
    dxf += '0\n';
    dxf += '10\n';
    dxf += '0.0\n';
    dxf += '20\n';
    dxf += '0.0\n';
    dxf += '30\n';
    dxf += '0.0\n';
    dxf += '40\n';
    dxf += '50.0\n';
    
    dxf += '0\n';
    dxf += 'ENDSEC\n';
    
    // EOF
    dxf += '0\n';
    dxf += 'EOF\n';
    
    // Download
    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test_circle_50mm.dxf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also save as text for inspection
    const txtBlob = new Blob([dxf], { type: 'text/plain' });
    const txtUrl = URL.createObjectURL(txtBlob);
    const txtLink = document.createElement('a');
    txtLink.href = txtUrl;
    txtLink.download = 'test_circle_50mm.txt';
    document.body.appendChild(txtLink);
    txtLink.click();
    document.body.removeChild(txtLink);
    URL.revokeObjectURL(txtUrl);
    
    console.log('DXF Content:');
    console.log(dxf);
    
    alert('Test DXF exported!\n\nCircle: radius 50mm at center (0,0)\nFormat: AutoCAD R12 DXF\n\nFiles:\n- test_circle_50mm.dxf (for CAD)\n- test_circle_50mm.txt (to inspect)\n\nCheck browser console (F12) for full content.');
}

function exportTestStrutToDXF() {
    const L = strutParams.L;
    const B = strutParams.B;
    const R = strutParams.R;
    
    // Scale factor: convert from unit sphere to cm based on first strut length
    const edges = geodesicSphere.getEdgeLengthDetails(
        parseFloat(document.getElementById('diameter').value) || 100,
        parseFloat(document.getElementById('connectorOffset').value) || 0
    );
    const scaleFactor = edges.length > 0 ? edges[0].length / L : 100;
    
    // Scale dimensions to real world (mm for DXF)
    const L_cm = L * scaleFactor;
    const B_cm = B * scaleFactor;
    const R_cm = R * scaleFactor;
    const L_mm = L_cm * 10;
    const B_mm = B_cm * 10;
    const R_mm = R_cm * 10;
    
    // Create DXF content
    let dxf = '';
    
    // Header section
    dxf += '0\nSECTION\n2\nHEADER\n';
    dxf += '9\n$ACADVER\n1\nAC1009\n';
    dxf += '9\n$INSUNITS\n70\n4\n';
    dxf += '0\nENDSEC\n';
    
    // Tables section
    dxf += '0\nSECTION\n2\nTABLES\n';
    
    // LTYPE table
    dxf += '0\nTABLE\n2\nLTYPE\n70\n1\n';
    dxf += '0\nLTYPE\n2\nCONTINUOUS\n70\n0\n3\nSolid line\n72\n65\n73\n0\n40\n0.0\n';
    dxf += '0\nENDTAB\n';
    
    // LAYER table
    dxf += '0\nTABLE\n2\nLAYER\n70\n3\n';
    dxf += '0\nLAYER\n2\nstrut_outline\n70\n0\n62\n1\n6\nCONTINUOUS\n';
    dxf += '0\nLAYER\n2\nholes\n70\n0\n62\n5\n6\nCONTINUOUS\n';
    dxf += '0\nLAYER\n2\ntext\n70\n0\n62\n7\n6\nCONTINUOUS\n';
    dxf += '0\nENDTAB\n';
    
    // STYLE table
    dxf += '0\nTABLE\n2\nSTYLE\n70\n0\n0\nENDTAB\n';
    dxf += '0\nENDSEC\n';
    
    // Blocks section
    dxf += '0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n';
    
    // Entities section
    dxf += '0\nSECTION\n2\nENTITIES\n';
    
    // Create capsule outline as polyline
    const numSegments = 64;
    const points = [];
    
    // Bottom edge
    points.push([-L_mm/2, -B_mm/2]);
    points.push([L_mm/2, -B_mm/2]);
    
    // Right semicircle
    for (let i = 1; i <= numSegments; i++) {
        const angle = -Math.PI/2 + (Math.PI * i / numSegments);
        const x = L_mm/2 + (B_mm/2) * Math.cos(angle);
        const y = (B_mm/2) * Math.sin(angle);
        points.push([x, y]);
    }
    
    // Top edge
    points.push([-L_mm/2, B_mm/2]);
    
    // Left semicircle
    for (let i = 1; i < numSegments; i++) {
        const angle = Math.PI/2 + (Math.PI * i / numSegments);
        const x = -L_mm/2 + (B_mm/2) * Math.cos(angle);
        const y = (B_mm/2) * Math.sin(angle);
        points.push([x, y]);
    }
    
    // Draw polyline for outer contour
    dxf += '0\nPOLYLINE\n8\nstrut_outline\n66\n1\n70\n1\n';
    for (let i = 0; i < points.length; i++) {
        dxf += '0\nVERTEX\n8\nstrut_outline\n';
        dxf += `10\n${points[i][0].toFixed(4)}\n`;
        dxf += `20\n${points[i][1].toFixed(4)}\n`;
        dxf += '30\n0.0\n';
    }
    dxf += '0\nSEQEND\n';
    
    // Left hole
    dxf += '0\nCIRCLE\n8\nholes\n';
    dxf += `10\n${(-L_mm/2).toFixed(4)}\n`;
    dxf += '20\n0.0\n30\n0.0\n';
    dxf += `40\n${R_mm.toFixed(4)}\n`;
    
    // Right hole
    dxf += '0\nCIRCLE\n8\nholes\n';
    dxf += `10\n${(L_mm/2).toFixed(4)}\n`;
    dxf += '20\n0.0\n30\n0.0\n';
    dxf += `40\n${R_mm.toFixed(4)}\n`;
    
    // Text label in center
    const textHeight = Math.min(B_mm * 0.85, 10); // Text height: 85% of width, max 10mm
    dxf += '0\nTEXT\n8\ntext\n';
    dxf += '10\n0.0\n'; // X position (center)
    dxf += '20\n0.0\n'; // Y position (center)
    dxf += '30\n0.0\n'; // Z position
    dxf += `40\n${textHeight.toFixed(2)}\n`; // Text height
    dxf += '1\nType A\n'; // Text string
    dxf += '50\n0.0\n'; // Rotation angle
    dxf += '72\n1\n'; // Horizontal justification (1=center)
    dxf += '73\n2\n'; // Vertical justification (2=middle)
    dxf += '11\n0.0\n'; // Alignment point X
    dxf += '21\n0.0\n'; // Alignment point Y
    dxf += '31\n0.0\n'; // Alignment point Z
    
    dxf += '0\nENDSEC\n';
    dxf += '0\nEOF\n';
    
    // Download
    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strut_type_A_${L_cm.toFixed(1)}cm_x_${B_cm.toFixed(1)}cm.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Strut DXF exported:');
    console.log(`Length: ${L_cm.toFixed(2)} cm (${L_mm.toFixed(1)} mm)`);
    console.log(`Width: ${B_cm.toFixed(2)} cm (${B_mm.toFixed(1)} mm)`);
    console.log(`Hole diameter: ${(R_cm*2).toFixed(2)} cm (${(R_mm*2).toFixed(1)} mm)`);
    
    alert(`Strut DXF exported successfully!\n\nDimensions:\nTotal length: ${L_cm.toFixed(2)} cm (${L_mm.toFixed(1)} mm)\nWidth: ${B_cm.toFixed(2)} cm (${B_mm.toFixed(1)} mm)\nHole diameter: ${(R_cm*2).toFixed(2)} cm (${(R_mm*2).toFixed(1)} mm)\n\nLayers:\n- strut_outline (red): capsule shape\n- holes (blue): mounting holes\n- text (white): "Type A" label\n\nOpen in QCAD to verify!`);
}
