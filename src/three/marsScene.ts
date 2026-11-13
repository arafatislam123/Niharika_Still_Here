/**
 * Shared Mars building blocks for the rover game and the cinema mode: rolling terrain, a simple
 * stand-in rover, and a loader for NASA's real (Draco-compressed) 3D models.
 */
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Gentle procedural hills. Same everywhere, so objects can sit on the ground. */
export const marsHeight = (x: number, z: number) =>
  Math.sin(x * 0.12) * 1.1 +
  Math.cos(z * 0.09) * 1.3 +
  Math.sin((x + z) * 0.05) * 1.8 +
  Math.sin(x * 0.4) * Math.cos(z * 0.35) * 0.25;

export function buildMarsTerrain(
  size = 115,
  segments = 140,
  height: (x: number, z: number) => number = marsHeight,
  flat = true,
  /** Base colour of the ground (Mars red by default; grey for the Moon). */
  tint: [number, number, number] = [0.72, 0.33, 0.19],
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = height(x, z);
    pos.setY(i, y);
    const shade = 0.75 + (y + 4) * 0.05 + Math.sin(x * 1.7 + z * 1.3) * 0.03;
    c.setRGB(tint[0] * shade, tint[1] * shade, tint[2] * shade);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: flat }),
  );
}

/** Simple box rover, used by the game and as a fallback if the NASA model cannot load. */
export function buildSimpleRover(): THREE.Group {
  const rover = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 0.8 });
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x1d3c8f,
    metalness: 0.5,
    roughness: 0.35,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.2), white);
  body.position.y = 0.9;
  rover.add(body);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 2.6), panelMat);
  panel.position.y = 1.25;
  panel.userData.solarPanel = true;
  rover.add(panel);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.3), white);
  mast.position.set(0, 1.9, 0.8);
  rover.add(mast);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.3), white);
  head.position.set(0, 2.6, 0.8);
  rover.add(head);
  const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.05), dark);
  eyes.position.set(0, 2.6, 0.97);
  rover.add(eyes);
  for (const x of [-0.95, 0.95]) {
    for (const z of [-0.85, 0, 0.85]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.28, 16), dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.32, z);
      wheel.userData.wheel = true;
      rover.add(wheel);
    }
  }
  return rover;
}

let gltfLoader: GLTFLoader | null = null;
const modelCache = new Map<string, Promise<THREE.Object3D>>();

/**
 * Loads a NASA GLB model, centres it, puts it on the ground (y = 0) and scales its largest
 * horizontal size to `size`. Returns a template: call `.clone()` for each use.
 */
export function loadNasaModel(src: string, size: number): Promise<THREE.Object3D> {
  const key = `${src}|${size}`;
  const hit = modelCache.get(key);
  if (hit) return hit;

  if (!gltfLoader) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(draco);
  }
  const promise = gltfLoader.loadAsync(`${import.meta.env.BASE_URL}${src}`).then((gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const dims = box.getSize(new THREE.Vector3());
    const scale = size / Math.max(dims.x, dims.z, 1e-6);
    model.scale.setScalar(scale);
    const scaled = new THREE.Box3().setFromObject(model);
    const center = scaled.getCenter(new THREE.Vector3());
    const wrapper = new THREE.Group();
    model.position.sub(new THREE.Vector3(center.x, scaled.min.y, center.z));
    wrapper.add(model);
    return wrapper;
  });
  promise.catch(() => modelCache.delete(key));
  modelCache.set(key, promise);
  return promise;
}

/**
 * Turns a rover model so its front faces +z. NASA's models don't state a "forward" axis, so we
 * find it from the shape: on the Mars Exploration Rovers the tall camera mast stands at the
 * front of the deck, so the direction from the deck centre to the highest parts is "forward".
 */
export function faceRoverForward(root: THREE.Object3D): THREE.Object3D {
  root.updateMatrixWorld(true);
  const all = new THREE.Box3().setFromObject(root);
  const center = all.getCenter(new THREE.Vector3());
  const cutoff = all.min.y + (all.max.y - all.min.y) * 0.75;
  const offset = new THREE.Vector3();
  let count = 0;
  const box = new THREE.Box3();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    box.setFromObject(mesh);
    if (box.max.y < cutoff) return;
    const c = box.getCenter(new THREE.Vector3());
    offset.x += c.x - center.x;
    offset.z += c.z - center.z;
    count++;
  });
  const holder = new THREE.Group();
  if (count > 0 && Math.hypot(offset.x, offset.z) > 1e-3) {
    root.rotation.y -= Math.atan2(offset.x, offset.z);
  }
  holder.add(root);
  return holder;
}
