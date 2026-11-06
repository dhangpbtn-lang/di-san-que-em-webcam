/** Optional webcam head + hand controller for the MapLibre heritage sandtable.
 * Local-only video processing; camera frames are not uploaded or recorded.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type * as maplibregl from 'maplibre-gl';
import type { HeritageSite } from '../../types/heritage';
import { Camera, CameraOff, RotateCcw } from 'lucide-react';

type XY = { x: number; y: number; z?: number };
type VisionResult = { faceLandmarks?: XY[][]; landmarks?: XY[][] };
type Detector = { detectForVideo: (video: HTMLVideoElement, stamp: number) => VisionResult; close: () => void };
// WASM files are copied from the installed MediaPipe package during npm install.
// Using same-origin assets keeps the runtime and WASM versions in sync.
const WASM = `${import.meta.env.BASE_URL}mediapipe/wasm`;
const MODELS = {
  face: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  hand: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
};

interface Props {
  mapRef: React.RefObject<maplibregl.Map | null>;
  sites: HeritageSite[];
  onPickSite: (site: HeritageSite) => void;
  onGestureStart?: () => void;
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const distance = (a: XY, b: XY) => Math.hypot(a.x - b.x, a.y - b.y);

export const WebcamGestureControl: React.FC<Props> = ({ mapRef, sites, onPickSite, onGestureStart }) => {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Webcam đang tắt');
  const [sensitivity, setSensitivity] = useState(5);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceRef = useRef<Detector | null>(null);
  const handRef = useRef<Detector | null>(null);
  const rafRef = useRef<number | null>(null);
  const runRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastPickRef = useRef(0);
  const pinchStartRef = useRef(0);
  const pinchedRef = useRef(false);
  const baselineEyeRef = useRef<number | null>(null);
  const smoothYawRef = useRef(0);
  const smoothZoomRef = useRef(0);
  const twoHandRef = useRef<number | null>(null);
  const latestPropsRef = useRef({ sites, onPickSite, onGestureStart, sensitivity });
  latestPropsRef.current = { sites, onPickSite, onGestureStart, sensitivity };

  const stop = useCallback(() => {
    runRef.current++;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
    faceRef.current?.close(); faceRef.current = null;
    handRef.current?.close(); handRef.current = null;
    baselineEyeRef.current = null;
    twoHandRef.current = null;
    pinchStartRef.current = 0;
    pinchedRef.current = false;
    smoothYawRef.current = 0;
    smoothZoomRef.current = 0;
    setEnabled(false);
    setBusy(false);
    setMessage('Webcam đang tắt');
  }, []);

  useEffect(() => () => { runRef.current++; if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); faceRef.current?.close(); handRef.current?.close(); }, []);

  const start = async () => {
    if (busy || enabled) return;
    const token = ++runRef.current;
    setBusy(true);
    setMessage('Đang mở webcam...');
    let stream: MediaStream | null = null;
    let face: Detector | null = null;
    let hands: Detector | null = null;
    try {
      if (!window.isSecureContext) throw new Error('Hãy mở trang bằng HTTPS hoặc localhost để sử dụng webcam.');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Trình duyệt không hỗ trợ webcam.');
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } } });
      if (token !== runRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Không thể khởi tạo khung webcam.');
      video.srcObject = stream;
      await video.play();
      setMessage('Camera đã mở. Đang tải mô hình nhận diện đầu và bàn tay...');
      // Lazy-load: ordinary visitors never load MediaPipe or turn on the webcam.
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM);
      face = await vision.FaceLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODELS.face, delegate: 'CPU' }, runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: false });
      hands = await vision.HandLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODELS.hand, delegate: 'CPU' }, runningMode: 'VIDEO', numHands: 2 });
      if (token !== runRef.current) { face.close(); hands.close(); stream.getTracks().forEach(t => t.stop()); return; }
      faceRef.current = face;
      handRef.current = hands;
      latestPropsRef.current.onGestureStart?.();
      setEnabled(true);
      setBusy(false);
      setMessage('Đã kết nối • đưa mặt và tay vào khung hình');
      lastFrameRef.current = 0;

      const tick = (time: number) => {
        if (runRef.current !== token) return;
        rafRef.current = requestAnimationFrame(tick);
        if (time - lastFrameRef.current < 100 || video.readyState < 2) return; // ~10 FPS, reduce CPU and map jitter
        lastFrameRef.current = time;
        const map = mapRef.current;
        if (!map || !faceRef.current || !handRef.current) return;
        try {
          const faces = faceRef.current.detectForVideo(video, time).faceLandmarks || [];
          const handsNow = handRef.current.detectForVideo(video, time).landmarks || [];
          const gain = 0.55 + latestPropsRef.current.sensitivity * 0.09;
          if (faces.length) {
            const f = faces[0];
            // Nose relative to eye midpoint: signed, scale-independent proxy for head turn.
            if (f.length > 263) {
              const leftEye = f[33], rightEye = f[263], nose = f[1];
              const eyeWidth = Math.max(distance(leftEye, rightEye), 0.01);
              const yaw = ((nose.x - (leftEye.x + rightEye.x) / 2) / eyeWidth);
              const targetYaw = Math.abs(yaw) < 0.08 ? 0 : clamp(yaw, -0.65, 0.65);
              smoothYawRef.current = smoothYawRef.current * 0.78 + targetYaw * 0.22;
              if (Math.abs(smoothYawRef.current) > 0.035) map.setBearing(map.getBearing() + smoothYawRef.current * 2.8 * gain);
              if (baselineEyeRef.current === null) baselineEyeRef.current = eyeWidth;
              const ratio = eyeWidth / baselineEyeRef.current;
              const targetZoom = Math.abs(ratio - 1) < 0.1 ? 0 : clamp((ratio - 1) * 0.7, -0.11, 0.11);
              smoothZoomRef.current = smoothZoomRef.current * 0.82 + targetZoom * 0.18;
              if (Math.abs(smoothZoomRef.current) > 0.012) map.setZoom(clamp(map.getZoom() + smoothZoomRef.current * gain, 4, 19));
              // Recalibrate slowly while near neutral to prevent drift.
              if (Math.abs(ratio - 1) < 0.075) baselineEyeRef.current = baselineEyeRef.current * 0.995 + eyeWidth * 0.005;
            }
          }
          if (handsNow.length === 2) {
            const span = distance(handsNow[0][0], handsNow[1][0]);
            if (twoHandRef.current !== null) {
              const diff = span - twoHandRef.current;
              if (Math.abs(diff) > 0.007) map.setZoom(clamp(map.getZoom() + clamp(diff * 9 * gain, -0.2, 0.2), 4, 19));
            }
            twoHandRef.current = span;
          } else twoHandRef.current = null;

          if (handsNow.length > 0) {
            const hand = handsNow[0];
            const pinch = distance(hand[4], hand[8]) < Math.max(0.038, distance(hand[5], hand[17]) * 0.45);
            // Pinch is a deliberate "click". Require a hold; prevent repeated selection.
            if (pinch && !pinchedRef.current) {
              if (!pinchStartRef.current) pinchStartRef.current = time;
              if (time - pinchStartRef.current > 550 && time - lastPickRef.current > 1500) {
                const canvas = map.getCanvas();
                // Video is mirrored in CSS, so invert the image X position for an intuitive pointer.
                const pixel = { x: (1 - hand[8].x) * canvas.clientWidth, y: hand[8].y * canvas.clientHeight };
                const candidate = latestPropsRef.current.sites
                  .filter(s => s.coordinates?.isVerified && s.coordinates.lat && s.coordinates.lng)
                  .map(s => ({ site: s, p: map.project([s.coordinates!.lng, s.coordinates!.lat]) }))
                  .map(v => ({ site: v.site, distance: Math.hypot(v.p.x - pixel.x, v.p.y - pixel.y) }))
                  .sort((a, b) => a.distance - b.distance)[0];
                if (candidate && candidate.distance < 115) {
                  latestPropsRef.current.onPickSite(candidate.site);
                  lastPickRef.current = time;
                  setMessage(`Đã chọn: ${candidate.site.name}`);
                } else setMessage('Đưa ngón trỏ gần ghim di tích rồi chụm để chọn');
                pinchedRef.current = true;
              }
            } else if (!pinch) { pinchStartRef.current = 0; pinchedRef.current = false; }
          } else { pinchStartRef.current = 0; pinchedRef.current = false; }
        } catch (err) {
          console.warn('Webcam gesture frame:', err);
          setMessage('Không đọc được khung hình. Hãy thử tắt và bật lại webcam.');
          stop();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      if (token !== runRef.current) return;
      console.error('Webcam controller unavailable:', err);
      stream?.getTracks().forEach(t => t.stop());
      face?.close(); hands?.close();
      faceRef.current = null; handRef.current = null; streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setBusy(false);
      setEnabled(false);
      const name = (err as { name?: string }).name;
      setMessage(name === 'NotAllowedError' ? 'Camera bị từ chối quyền. Mở quyền Camera trong cài đặt trang web.' : name === 'NotFoundError' ? 'Không tìm thấy thiết bị webcam trên máy.' : name === 'NotReadableError' ? 'Webcam đang bị ứng dụng khác sử dụng. Hãy đóng ứng dụng Camera/Zoom.' : err instanceof Error ? `Không tải được AI: ${err.message}` : 'Không khởi động được webcam.');
    }
  };

  return (
    <div className="absolute top-16 right-3 z-30 w-[min(230px,64vw)] rounded-xl border border-amber-500/70 bg-stone-950/95 p-2.5 text-amber-100 shadow-2xl" aria-label="Điều khiển sa bàn bằng webcam">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-amber-300">ĐẦU + BÀN TAY</span>
        <button type="button" onClick={enabled || busy ? stop : start} className="flex items-center gap-1 rounded-lg bg-amber-600 px-2 py-1 text-[11px] font-bold text-stone-950" aria-label={enabled ? 'Tắt webcam' : 'Bật webcam'}>
          {enabled ? <CameraOff size={14} /> : <Camera size={14} />}{busy ? 'Hủy' : enabled ? 'Tắt' : 'Bật webcam'}
        </button>
      </div>
      <video ref={videoRef} playsInline muted autoPlay aria-label="Xem trước webcam trực tiếp" className={`mt-2 aspect-video w-full rounded-md border border-amber-900 object-cover -scale-x-100 ${enabled || busy ? '' : 'hidden'}`} />
      <p className="mt-1 text-[10px] leading-relaxed text-amber-200" role="status">{message}</p>
      <label className="mt-2 flex items-center gap-2 text-[10px]">Độ nhạy {sensitivity}/10
        <input aria-label="Độ nhạy điều khiển webcam" type="range" min="1" max="10" value={sensitivity} onChange={e => setSensitivity(Number(e.target.value))} className="w-full accent-amber-500" />
      </label>
      <p className="mt-1 text-[10px] leading-relaxed text-stone-300">Quay đầu: xoay • Tiến/lùi đầu hoặc tách/khép hai tay: thu phóng • Chụm ngón trỏ và cái 0,5 giây gần ghim để chọn.</p>
      {enabled && <button type="button" className="mt-2 flex items-center gap-1 text-[10px] text-amber-300 underline" onClick={() => { baselineEyeRef.current = null; smoothYawRef.current = 0; smoothZoomRef.current = 0; setMessage('Đã cân chỉnh lại vị trí đầu'); }}><RotateCcw size={12}/> Cân chỉnh lại góc đầu</button>}
      <p className="mt-1 text-[9px] text-stone-400">Hình ảnh xử lý trên thiết bị, không lưu hoặc gửi video. Cần HTTPS và internet để tải mô hình AI.</p>
    </div>
  );
};
