# SPARKS ⚛️

3D atomic viewer — explore atoms, electron orbitals, and molecules in your browser.

**Live:** [sebland.com/sparks](https://sebland.com/sparks)

## What is this?

An interactive 3D visualization of quantum mechanical electron orbitals. Select an atom and watch its electron probability clouds rendered as point clouds with accurate orbital shapes — s (spheres), p (dumbbells), d (cloverleafs) — based on real hydrogen-like wavefunctions and spherical harmonics.

## Features

- 12 atoms from Hydrogen to Iron
- Quantum mechanical orbital shapes (s, p, d) via rejection sampling from |Y(l,m)|^2
- Phase coloring — positive/negative lobes in warm/cool colors
- GPU-accelerated particle animation (vertex shader)
- Bloom glow post-processing
- Molecule mode — place multiple atoms in 3D space
- WASD + Q/E camera movement
- Mouse orbit, zoom, pan
- FPS meter

## Controls

| Input | Action |
|-------|--------|
| Mouse drag | Rotate |
| Scroll | Zoom |
| Right-drag | Pan |
| W/S | Move forward/backward |
| A/D | Strafe left/right |
| Q/E | Move up/down |

## Tech Stack

- React + TypeScript + Vite
- React Three Fiber + Three.js
- Custom GLSL vertex/fragment shaders
- @react-three/postprocessing (Bloom, Vignette)

## Development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
# Copy dist/ to /root/box/app/static/sparks/
cd /root/box && bash deploy-static.sh
docker compose build web && docker compose up -d web
```
