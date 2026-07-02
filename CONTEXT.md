# react-video-wall

A composable React component library for **video wall** (大屏) layout, windowing, and interactive editing. It maps a physical video wall to the DOM at any scale and converts coordinates between the two spaces losslessly.

## Architecture (layered, composable)

- **Core layer** (always): the coordinate model + the `<VideoWall>` renderer (tiles, contain-fit into the container, padding). Zero third-party dependencies.
- **Window layer** (optional): renders `<Window>` rectangles on the wall.
- **Interaction layer** (optional): box-select-to-open, drag / resize / drag-out-to-remove. Built on `selecto` + `moveable`, declared as **peerDependencies** so the core stays dependency-free.

## Language

**Tile / 小屏**:
A single screen unit composing the wall. Tiles abut to form one rectangular wall; their sizes may differ but their union is exactly the wall rectangle.
_Avoid_: cell, panel, monitor

**Window / 窗口**:
A rectangular region opened ON the wall (e.g. displaying a video source), positioned in wall coordinates with origin (0,0) at the wall's top-left.
_Avoid_: region, zone, layer

**Wall Layout**:
The arrangement of tiles — either an explicit list of tile rects `[{x,y,width,height}, …]` or an even `N×N` split derived from the wall size.
_Avoid_: grid, matrix

**Video Wall / 大屏**:
The logical rectangle, in physical-integer coordinates, that the library models. It is partitioned into Tiles and is the coordinate origin (`0,0` = top-left, `width,height` = bottom-right) for every Window. The DOM `<VideoWall>` component is its scaled, contain-fit rendering — a view, not the source of truth.
_Avoid_: screen, display (ambiguous with the physical device or the DOM element)

**Coordinate Space**:
The two spaces every wall rect lives in. **Physical** — integer pixels on the real wall, the authoritative model. **DOM** — float pixels in the browser, a derived view. Conversions cross the boundary once per interaction, integer-driven, rounding to the physical grid (ADR-0008).
_Avoid_: resolution, scale (scale is the ratio between the two, not a space)
