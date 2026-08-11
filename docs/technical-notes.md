# Technical notes

Geometry and implementation details behind the [README](../README.md).

## Coordinate spaces

Two spaces are in play, and mixing them up is the most common source of bugs in this codebase:

- **Unit-sphere space** — all vertices lie at distance 1 from the origin. The geometry
  pipeline works entirely here.
- **Real space (cm)** — what the user enters and what gets exported.

The conversion is `radius = diameter / 2`. UI values in cm are divided by `radius` on the way
in (see `getScaledStrutParams()` in `js/main.js`, which converts Width from cm to unit-sphere),
and export groups are scaled back up with `group.scale.set(radius, radius, radius)` on the way out.

## Vertex normalization

Every vertex is projected onto the unit sphere:

```
v_normalized = v / |v|
```

## Barycentric interpolation

New points inside a triangle during subdivision:

```
P = c·V₀ + a·V₁ + b·V₂     with a + b + c = 1
```

The point is then normalized (see above). This projection step is what turns a subdivided
polyhedron into a sphere — and it is also why the resulting edges fall into several distinct
length classes instead of all being equal.

## Edge detection

Edges are stored as vertex index pairs with the smaller index first, serialized as JSON.
That canonical ordering is what prevents an edge from being counted twice when it is reached
from either of its two adjacent triangles.

## Edge shortening

Each edge is shortened at both ends by the connector offset, to leave room for the connector arm:

```
offsetRatio     = connectorOffset / sphereRadius
dir             = normalize(end - start)
shortened_start = start + dir × offsetRatio
shortened_end   = end   - dir × offsetRatio
```

Note this moves the endpoints **along the edge**. Scaling the position vectors instead
(`start × (1 + offsetRatio)`) would displace the points radially, off the sphere surface —
a different operation entirely, and not what is wanted here.

## Strut orientation

Struts are oriented with an explicitly re-orthogonalized basis:

```javascript
xAxis = normalize(edge_direction)      // along the strut
zAxis = normalize(radial_direction)    // outward from sphere centre
yAxis = cross(zAxis, xAxis).normalize()
zAxis = cross(xAxis, yAxis).normalize()  // re-orthogonalize
rotationMatrix = Matrix4.makeBasis(xAxis, yAxis, zAxis)
```

The second `zAxis` assignment is not redundant. The edge direction and the radial direction
are not exactly perpendicular — a chord of a sphere is not tangent to it — so the first
`zAxis` has to be replaced by one that is genuinely orthogonal to both other axes. Without
that step the basis is skewed and struts sit slightly askew on the surface.

## Frequency-based scaling

Base values are defined for F=1 and scale with `1 / F`:

| Parameter | Base value (F=1) |
|---|---|
| Strut width | 5.0 cm |
| Hole radius (R) | 0.02 (unit-sphere) |
| Connector offset | 7.0 cm |

```
scaled_value = base_value / frequency
```

Example at F=4: width 1.25 cm, hole radius 0.005, connector offset 1.75 cm.

The UI fields work in both directions: they display the scaled value for the current
frequency, and editing one recomputes the base value (`scaled × frequency`) so the proportion
survives a frequency change.

## Connector construction

Each connector is a **single flat star-shaped part per vertex**, not a set of separate arms:

1. Compute a best-fit plane through the arm endpoints (Newell's method).
2. Project the vertex V onto that plane → the connector centre V'.
3. Project all arm endpoints into a local 2D coordinate system on the plane.
4. Build a closed outline from the parallel boundary lines of each arm.
5. Compute the transition points T_k where neighbouring arms' boundary lines intersect.
6. Cap each arm with a semicircular tip of radius B/2 and place the bolt hole (radius R) at
   the arm end.

Sorting the neighbours counter-clockwise around the vertex before step 4 is what makes the
outline close correctly; an arbitrary neighbour order produces a self-intersecting contour.

Connectors are classified into types by the canonical pattern of their surrounding edge types,
so that geometrically identical hubs are grouped and cut as one part type.

## Strut modes

**Classic** keeps the true shortened length of every edge. Since subdivision produces several
edge length classes, this yields several strut types (A, B, C…) — accurate, but more part
types to cut, sort and keep apart during assembly.

**Uniform** shortens every strut to `L_min` — the shortest strut the sphere contains — and
absorbs the excess in the connector offset, split evenly between the two ends of each edge
(`uniformOffset = classicOffset + excess / 2`). One strut type for the whole sphere, at the
cost of connector arms that vary in length. See `computeEdgeOffsets()` in
`js/strut-visualization.js`.

## Export notes

- **DXF** is 2D: flat outlines with holes, dimensioned in mm, on separate layers
  (OUTLINE / HOLES / LABELS).
- **STL** is 3D: parts are extruded to `STL_THICKNESS_MM` (3 mm by default, defined at the top
  of `js/stl-export.js`) and positioned in their real place on the sphere. The per-type export
  writes one file per part type containing all instances, so the files together reassemble the
  complete sphere.
- Export geometries are built in a temporary group that is never added to the scene, and are
  disposed immediately after parsing.
