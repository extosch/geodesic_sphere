# Geodätische Kugel Visualisierung

Eine interaktive Webseite zur Visualisierung geodätischer Kugeln mit variabler Frequenz, basierend auf der sukzessiven Unterteilung eines Ikosaeders.

## Funktionen

- **Variable Frequenz (F)**: Generierung geodätischer Kugeln von F=1 (Ikosaeder) bis F=10
  - Auto-Update bei Frequenzänderung (kein separater Update-Button erforderlich)
  - Frequency-based Scaling: Alle Parameter skalieren automatisch mit 1/frequency
  
- **Visualisierungsoptionen**: 
  - Flächendarstellung (grau)
  - Gittermodell (weiß, farbcodiert nach Kantenlänge)
  - Edge Struts (2D-Streben auf allen Kanten)
    - Farbige Faces nach Kantentyp
    - Weiße Wireframe-Umrisse
    - Tangentiale Orientierung zur Kugeloberfläche
  - Center Test Strut (Entwicklungs-/Testzwecke)
  - Alle Modi unabhängig ein-/ausschaltbar
  
- **Physikalische Konstruktionsparameter**:
  - Durchmesser (cm): Skalierung der gesamten Kugel
  - Connector Offset (cm): Abstand vom Hub-Zentrum zum Streben-Ende
    - Automatische Anzeige des skalierten Werts basierend auf Frequenz
    - Verkürzte Kanten in der Visualisierung
  - Streben-Breite (B) und Bohrungsradius (R) skalieren automatisch mit Frequenz
  
- **Build Instructions**:
  - Tabelle mit Kantenlängen nach Typ
  - Farbcodierung (Rot/Grün/Blau/Gelb)
  - Anzahl benötigter Streben pro Typ
  - Connector-Analyse (5-arm vs. 6-arm Hubs)
  - Anzahl der Dreiecks-Patches
  
- **DXF Export**:
  - Export von Test Struts als DXF-Datei für CNC/Laserschnitt
  - Kapsel-Form mit Bohrungen an beiden Enden
  - Maßhaltige Konstruktion in mm
  - Layer-Organisation (OUTLINE, HOLES, LABELS)
  
- **Geometrie-Informationen**: 
  - Anzahl der Ecken
  - Anzahl der Kanten
  - Anzahl unterschiedlicher Kantenlängen
  - Anzahl der Dreiecke
  
- **Interaktive Steuerung**:
  - Auto-Rotation um die eigene Achse
  - Linke Maustaste: Manuelle Rotation
  - Rechte Maustaste: Pan (Verschieben)
  - Mausrad: Zoom

## Technologie

- **HTML5**: Struktur der Webseite
- **CSS3**: Styling mit dunklem Theme
- **JavaScript**: Logik und Algorithmus (modulare Architektur)
  - `main.js`: Globale Variablen und Scaling-Funktionen
  - `geodesic-sphere.js`: Geodätischer Algorithmus (GeodesicSphere Klasse)
  - `dxf-export.js`: DXF-Export für CNC/Laserschnitt
  - `strut-visualization.js`: 2D-Streben auf Kanten
  - `sphere-visualization.js`: 3D-Kugel-Rendering
  - `three-setup.js`: Three.js Initialisierung und Steuerung
- **Three.js (WebGL)**: 3D-Rendering und Visualisierung

## Algorithmus

Der Algorithmus basiert auf der sukzessiven Unterteilung eines regulären Ikosaeders:

1. **Ikosaeder-Basis (F=1)**: 
   - 12 Ecken
   - 20 gleichseitige Dreiecke
   - Vertices werden auf eine Einheitskugel normalisiert

2. **Unterteilung (F>1)**:
   - Jedes Dreieck wird in frequency² kleinere Dreiecke unterteilt
   - Kanten werden in F gleiche Abschnitte geteilt
   - Neue Punkte werden auf die Kugeloberfläche projiziert
   - Baryzentrische Koordinaten für präzise Interpolation

3. **Normalisierung**:
   - Alle Vertices werden auf Einheitsabstand vom Zentrum projiziert
   - Ergebnis ist eine annähernd perfekte Kugel mit gleichmäßig verteilten Dreiecken

4. **Edge Struts (Kantenverstrebungen)**:
   - 2D-Streben werden auf jeder Kante der geodätischen Kugel platziert
   - Koordinatensystem:
     - X-Achse: entlang der Kante
     - Y-Achse: tangential zur Kugeloberfläche
     - Z-Achse: radial nach außen
   - Rotation mit THREE.Matrix4.makeBasis() für präzise Orientierung
   - Kanten werden um Connector Offset verkürzt (von beiden Enden)
   - Kapsel-Form: Hauptrechteck + Halbkreisenden + Bohrungen

5. **Frequency-based Scaling**:
   - Basis-Werte definiert für Frequenz 1:
     - Streben-Breite (B): 0.1
     - Bohrungsradius (R): 0.02  
     - Connector Offset: 7.0 cm
   - Skalierung mit Faktor 1/frequency
   - Beispiel Freq 2: B=0.05, R=0.01, Offset=3.5cm
   - Gewährleistet proportionale Geometrie bei allen Frequenzen

## Installation & Verwendung

1. Laden Sie alle Dateien in ein Verzeichnis:
   - `index.html`
   - `style.css`
   - `README.md`
   - `js/main.js`
   - `js/geodesic-sphere.js`
   - `js/dxf-export.js`
   - `js/strut-visualization.js`
   - `js/sphere-visualization.js`
   - `js/three-setup.js`

2. Öffnen Sie `index.html` in einem modernen Webbrowser

3. **Keine Installation erforderlich** - die Three.js Bibliothek wird über CDN geladen

## Bedienung

1. **Frequenz einstellen**: Geben Sie eine Zahl zwischen 1 und 10 ein
   - Die Geometrie wird automatisch aktualisiert
   - Connector Offset Feld zeigt automatisch den skalierten Wert
2. **Durchmesser anpassen**: Ändern Sie die Größe der Kugel (10-1000 cm)
3. **Connector Offset einstellen**: Abstand vom Hub-Zentrum (0-10 cm)
   - Wird automatisch mit Frequenz skaliert
   - Manuelle Änderung passt den Basiswert an
4. **Visualisierung anpassen**: 
   - Aktivieren/Deaktivieren Sie "Show Faces" (Kugeloberfläche)
   - Aktivieren/Deaktivieren Sie "Show Wireframe" (Kanten-Gitter)
   - Aktivieren/Deaktivieren Sie "Show Edge Struts Faces" (farbige Streben)
   - Aktivieren/Deaktivieren Sie "Show Edge Struts Wireframe" (Streben-Umrisse)
   - Aktivieren/Deaktivieren Sie "Show Center Test Strut" (Test-Strebe)
   - Aktivieren/Deaktivieren Sie "Auto-Rotation"
5. **DXF Export**: 
   - "Export Test Strut as DXF": Exportiert eine Strebe für CNC/Laserschnitt
   - "TEST: Export Simple Circle DXF": Test-Export eines einfachen Kreises
6. **Navigation**:
   - Linke Maustaste gedrückt halten und ziehen: Rotation
   - Rechte Maustaste gedrückt halten und ziehen: Pan
   - Mausrad: Zoom in/out

## Geometrische Eigenschaften

### Formeln für Frequenz F:
- **Anzahl Ecken**: Für F=1: 12, für F>1: 10×F² + 2
- **Anzahl Dreiecke**: 20×F²
- **Anzahl Kanten**: 30×F²

### Beispiele:
| F | Ecken | Kanten | Dreiecke |
|---|-------|--------|----------|
| 1 | 12    | 30     | 20       |
| 2 | 42    | 120    | 80       |
| 3 | 92    | 270    | 180      |
| 4 | 162   | 480    | 320      |
| 5 | 252   | 750    | 500      |

## Design

- **Hintergrund**: Schwarz (#000000)
- **Flächen**: Grau (#808080) mit Phong-Shading
- **Gitter**: Farbcodiert nach Kantenlänge (Rot/Grün/Blau/Gelb/etc.)
- **Edge Struts**: 
  - Faces: Farbcodiert nach Kantentyp (Type A-D+)
  - Wireframe: Weiß (#FFFFFF)
- **Beleuchtung**: Directional Light von schräg rechts oben (5, 5, 5)
- **UI**: Dunkles Panel (#1A1A1A) mit blauen Akzenten

## Technische Details

### Vertex-Normalisierung
Alle Vertices werden auf die Einheitskugel projiziert:
```
v_normalized = v / |v|
```

### Baryzentrische Interpolation
Neue Punkte auf einem Dreieck werden berechnet als:
```
P = c×V₀ + a×V₁ + b×V₂
wobei a + b + c = 1
```

### Edge-Detection
Kanten werden als Paare von Vertex-Indices gespeichert, wobei der kleinere Index zuerst kommt, um Duplikate zu vermeiden.

### Edge Strut Rotation
Streben werden mit einer orthonormalen Basis orientiert:
```javascript
xAxis = normalized(edge_direction)
zAxis = normalized(radial_direction)  
yAxis = cross(zAxis, xAxis).normalize()
zAxis = cross(xAxis, yAxis).normalize()  // Re-orthogonalisierung
rotationMatrix = Matrix4.makeBasis(xAxis, yAxis, zAxis)
```

### Frequency-based Scaling
Parameter skalieren mit dem Kehrwert der Frequenz:
```
scaled_value = base_value / frequency
```
Beispiel bei Frequenz 4:
- Streben-Breite: 0.1 / 4 = 0.025
- Bohrungsradius: 0.02 / 4 = 0.005
- Connector Offset: 7.0 / 4 = 1.75 cm

### Edge Shortening
Kanten werden an beiden Enden verkürzt:
```
offsetRatio = connectorOffset / sphereRadius
shortened_start = original_start × (1 + offsetRatio)
shortened_end = original_end × (1 - offsetRatio)
```

## Browser-Kompatibilität

Getestet und funktionsfähig in:
- Chrome/Edge (empfohlen)
- Firefox
- Safari
- Opera

Erfordert WebGL-Unterstützung.

## Autor

Erstellt mit Three.js und vanilla JavaScript.
Entwickelt mit Unterstützung von **Claude Sonnet 4.5** (Anthropic AI).

## Lizenz

Open Source - frei verwendbar für Bildungs- und private Zwecke.

---

# Geodesic Sphere Visualization

An interactive website for visualizing geodesic spheres with variable frequency, based on the successive subdivision of an icosahedron.

## Features

- **Variable Frequency (F)**: Generation of geodesic spheres from F=1 (icosahedron) to F=10
  - Auto-update on frequency change (no separate update button required)
  - Frequency-based scaling: All parameters scale automatically with 1/frequency
  
- **Visualization Options**: 
  - Surface rendering (gray)
  - Wireframe model (color-coded by edge length)
  - Edge Struts (2D struts on all edges)
    - Colored faces by edge type
    - White wireframe outlines
    - Tangential orientation to sphere surface
  - Center Test Strut (development/testing purposes)
  - All modes independently toggleable
  
- **Physical Construction Parameters**:
  - Diameter (cm): Scaling of entire sphere
  - Connector Offset (cm): Distance from hub center to strut end
    - Automatic display of scaled value based on frequency
    - Shortened edges in visualization
  - Strut width (B) and hole radius (R) scale automatically with frequency
  
- **Build Instructions**:
  - Table with edge lengths by type
  - Color coding (Red/Green/Blue/Yellow)
  - Number of required struts per type
  - Connector analysis (5-arm vs. 6-arm hubs)
  - Number of triangle patches
  
- **DXF Export**:
  - Export test struts as DXF file for CNC/laser cutting
  - Capsule shape with holes at both ends
  - Dimensionally accurate construction in mm
  - Layer organization (OUTLINE, HOLES, LABELS)
  
- **Geometry Information**: 
  - Number of vertices
  - Number of edges
  - Number of different edge lengths
  - Number of triangles
  
- **Interactive Controls**:
  - Auto-rotation around its own axis
  - Left mouse button: Manual rotation
  - Right mouse button: Pan (move)
  - Mouse wheel: Zoom

## Technology

- **HTML5**: Website structure
- **CSS3**: Styling with dark theme
- **JavaScript**: Logic and algorithm (modular architecture)
  - `main.js`: Global variables and scaling functions
  - `geodesic-sphere.js`: Geodesic algorithm (GeodesicSphere class)
  - `dxf-export.js`: DXF export for CNC/laser cutting
  - `strut-visualization.js`: 2D struts on edges
  - `sphere-visualization.js`: 3D sphere rendering
  - `three-setup.js`: Three.js initialization and controls
- **Three.js (WebGL)**: 3D rendering and visualization

## Algorithm

The algorithm is based on the successive subdivision of a regular icosahedron:

1. **Icosahedron Base (F=1)**: 
   - 12 vertices
   - 20 equilateral triangles
   - Vertices are normalized to a unit sphere

2. **Subdivision (F>1)**:
   - Each triangle is subdivided into frequency² smaller triangles
   - Edges are divided into F equal sections
   - New points are projected onto the sphere surface
   - Barycentric coordinates for precise interpolation

3. **Normalization**:
   - All vertices are projected to unit distance from the center
   - Result is an approximately perfect sphere with evenly distributed triangles

4. **Edge Struts**:
   - 2D struts are placed on each edge of the geodesic sphere
   - Coordinate system:
     - X-axis: along the edge
     - Y-axis: tangent to sphere surface
     - Z-axis: radially outward
   - Rotation using THREE.Matrix4.makeBasis() for precise orientation
   - Edges shortened by connector offset (from both ends)
   - Capsule shape: Main rectangle + semicircular ends + holes

5. **Frequency-based Scaling**:
   - Base values defined for Frequency 1:
     - Strut width (B): 0.1
     - Hole radius (R): 0.02
     - Connector offset: 7.0 cm
   - Scaling with factor 1/frequency
   - Example Freq 2: B=0.05, R=0.01, Offset=3.5cm
   - Ensures proportional geometry at all frequencies

## Installation & Usage

1. Load all files into a directory:
   - `index.html`
   - `style.css`
   - `README.md`
   - `js/main.js`
   - `js/geodesic-sphere.js`
   - `js/dxf-export.js`
   - `js/strut-visualization.js`
   - `js/sphere-visualization.js`
   - `js/three-setup.js`

2. Open `index.html` in a modern web browser

3. **No installation required** - the Three.js library is loaded via CDN

## Operation

1. **Set frequency**: Enter a number between 1 and 10
   - Geometry updates automatically
   - Connector offset field shows scaled value automatically
2. **Adjust diameter**: Change sphere size (10-1000 cm)
3. **Set connector offset**: Distance from hub center (0-10 cm)
   - Automatically scales with frequency
   - Manual changes adjust the base value
4. **Adjust visualization**: 
   - Enable/disable "Show Faces" (sphere surface)
   - Enable/disable "Show Wireframe" (edge grid)
   - Enable/disable "Show Edge Struts Faces" (colored struts)
   - Enable/disable "Show Edge Struts Wireframe" (strut outlines)
   - Enable/disable "Show Center Test Strut" (test strut)
   - Enable/disable "Auto-Rotation"
5. **DXF Export**:
   - "Export Test Strut as DXF": Exports one strut for CNC/laser cutting
   - "TEST: Export Simple Circle DXF": Test export of a simple circle
6. **Navigation**:
   - Hold left mouse button and drag: Rotation
   - Hold right mouse button and drag: Pan
   - Mouse wheel: Zoom in/out

## Geometric Properties

### Formulas for Frequency F:
- **Number of Vertices**: For F=1: 12, for F>1: 10×F² + 2
- **Number of Triangles**: 20×F²
- **Number of Edges**: 30×F²

### Examples:
| F | Vertices | Edges | Triangles |
|---|----------|-------|-----------|
| 1 | 12       | 30    | 20        |
| 2 | 42       | 120   | 80        |
| 3 | 92       | 270   | 180       |
| 4 | 162      | 480   | 320       |
| 5 | 252      | 750   | 500       |

## Design

- **Background**: Black (#000000)
- **Faces**: Gray (#808080) with Phong shading
- **Wireframe**: Color-coded by edge length (Red/Green/Blue/Yellow/etc.)
- **Edge Struts**:
  - Faces: Color-coded by edge type (Type A-D+)
  - Wireframe: White (#FFFFFF)
- **Lighting**: Directional light from upper right (5, 5, 5)
- **UI**: Dark panel (#1A1A1A) with blue accents

## Technical Details

### Vertex Normalization
All vertices are projected onto the unit sphere:
```
v_normalized = v / |v|
```

### Barycentric Interpolation
New points on a triangle are calculated as:
```
P = c×V₀ + a×V₁ + b×V₂
where a + b + c = 1
```

### Edge Detection
Edges are stored as pairs of vertex indices, with the smaller index first to avoid duplicates.

### Edge Strut Rotation
Struts are oriented using an orthonormal basis:
```javascript
xAxis = normalized(edge_direction)
zAxis = normalized(radial_direction)
yAxis = cross(zAxis, xAxis).normalize()
zAxis = cross(xAxis, yAxis).normalize()  // Re-orthogonalization
rotationMatrix = Matrix4.makeBasis(xAxis, yAxis, zAxis)
```

### Frequency-based Scaling
Parameters scale with the reciprocal of frequency:
```
scaled_value = base_value / frequency
```
Example at Frequency 4:
- Strut width: 0.1 / 4 = 0.025
- Hole radius: 0.02 / 4 = 0.005
- Connector offset: 7.0 / 4 = 1.75 cm

### Edge Shortening
Edges are shortened at both ends:
```
offsetRatio = connectorOffset / sphereRadius
shortened_start = original_start × (1 + offsetRatio)
shortened_end = original_end × (1 - offsetRatio)
```

## Browser Compatibility

Tested and functional in:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Requires WebGL support.

## Author

Created with Three.js and vanilla JavaScript.
Developed with support from **Claude Sonnet 4.5** (Anthropic AI).

## License

Open Source - free to use for educational and private purposes.
