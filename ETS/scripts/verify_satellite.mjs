import fs from 'fs';
class FileReaderShim {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    if (this.onloadend) this.onloadend();
  }
}
globalThis.FileReader = FileReaderShim;

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const buf = fs.readFileSync('assets/models/satellite.glb');
const loader = new GLTFLoader();
const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

loader.parse(
  arrayBuf,
  '',
  (gltf) => {
    console.log('=== VERIFIKASI ASET 3D GLB ===');
    console.log('File: assets/models/satellite.glb');
    console.log('File Size:', (buf.length / 1024).toFixed(2), 'KB');
    console.log('Total Animations:', gltf.animations.length);
    gltf.animations.forEach((anim, i) => {
      console.log(`[Animation #${i + 1}] "${anim.name}"`);
      console.log(`  - Durasi: ${anim.duration} detik`);
      console.log(`  - Jumlah Track: ${anim.tracks.length}`);
      anim.tracks.forEach((track) => {
        console.log(`    * Track: ${track.name} (${track.ValueTypeName})`);
      });
    });
    console.log('\nHierarki Mesh & Komponen 3D:');
    gltf.scene.traverse((node) => {
      if (node.name) {
        console.log(`  - [${node.type}] ${node.name}`);
      }
    });
    console.log('==============================');
  },
  (err) => {
    console.error('Error saat verifikasi:', err);
  }
);
