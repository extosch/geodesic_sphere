# Geodätische Kugel Visualisierung

Eine interaktive Webseite zur Visualisierung geodätischer Kugeln mit variabler Frequenz, basierend auf der sukzessiven Unterteilung eines Ikosaeders.

## Funktionen

- **Variable Frequenz (F)**: Generierung geodätischer Kugeln von F=1 (Ikosaeder) bis F=10
- **Visualisierungsoptionen**: 
  - Flächendarstellung (grau)
  - Gittermodell (weiß)
  - Beide Modi gleichzeitig möglich
- **Geometrie-Informationen**: 
  - Anzahl der Ecken
  - Anzahl der Kanten
  - Anzahl unterschiedlicher Kantenlängen
- **Interaktive Steuerung**:
  - Auto-Rotation um die eigene Achse
  - Linke Maustaste: Manuelle Rotation
  - Rechte Maustaste: Pan (Verschieben)
  - Mausrad: Zoom

## Technologie

- **HTML5**: Struktur der Webseite
- **CSS3**: Styling mit dunklem Theme
- **JavaScript**: Logik und Algorithmus
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

## Installation & Verwendung

1. Laden Sie alle Dateien in ein Verzeichnis:
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`

2. Öffnen Sie `index.html` in einem modernen Webbrowser

3. **Keine Installation erforderlich** - die Three.js Bibliothek wird über CDN geladen

## Bedienung

1. **Frequenz einstellen**: Geben Sie eine Zahl zwischen 1 und 10 ein
2. **Aktualisieren**: Klicken Sie auf "Aktualisieren" oder drücken Sie Enter
3. **Visualisierung anpassen**: 
   - Aktivieren/Deaktivieren Sie "Flächen anzeigen"
   - Aktivieren/Deaktivieren Sie "Gitter anzeigen"
4. **Navigation**:
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
- **Gitter**: Weiß (#FFFFFF) mit Transparenz
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
- **Visualization Options**: 
  - Surface rendering (gray)
  - Wireframe model (white)
  - Both modes simultaneously possible
- **Geometry Information**: 
  - Number of vertices
  - Number of edges
  - Number of different edge lengths
- **Interactive Controls**:
  - Auto-rotation around its own axis
  - Left mouse button: Manual rotation
  - Right mouse button: Pan (move)
  - Mouse wheel: Zoom

## Technology

- **HTML5**: Website structure
- **CSS3**: Styling with dark theme
- **JavaScript**: Logic and algorithm
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

## Installation & Usage

1. Load all files into a directory:
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`

2. Open `index.html` in a modern web browser

3. **No installation required** - the Three.js library is loaded via CDN

## Operation

1. **Set frequency**: Enter a number between 1 and 10
2. **Update**: Click "Aktualisieren" or press Enter
3. **Adjust visualization**: 
   - Enable/disable "Flächen anzeigen" (show faces)
   - Enable/disable "Gitter anzeigen" (show wireframe)
4. **Navigation**:
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
- **Wireframe**: White (#FFFFFF) with transparency
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
