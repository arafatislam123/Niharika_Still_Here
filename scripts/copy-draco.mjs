// Copies Three.js's Draco decoder into public/draco/ so the NASA 3D models (Draco-compressed)
// can be decoded from our own site instead of a third-party CDN. Runs before dev and build.
import fs from 'node:fs';
import path from 'node:path';

const from = path.resolve('node_modules/three/examples/jsm/libs/draco/gltf');
const to = path.resolve('public/draco');
fs.mkdirSync(to, { recursive: true });
for (const file of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
  fs.copyFileSync(path.join(from, file), path.join(to, file));
}
console.log('Draco decoder copied to public/draco/');
