import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const source = resolve('node_modules/@mediapipe/tasks-vision/wasm');
const target = resolve('public/mediapipe/wasm');
if (!existsSync(source)) {
  console.error('Không tìm thấy MediaPipe WASM. Hãy chạy npm.cmd install trước.');
  process.exit(1);
}
mkdirSync(target, { recursive: true });
const files = readdirSync(source).filter(f => f.endsWith('.wasm') || f.endsWith('.js'));
if (!files.length) {
  console.error('MediaPipe đã cài nhưng không có tệp WASM, hãy kiểm tra gói npm.');
  process.exit(1);
}
for (const file of files) copyFileSync(join(source, file), join(target, file));
console.log(`Đã đồng bộ ${files.length} tệp MediaPipe WASM vào public/mediapipe/wasm`);
