/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Hotspot, Scene360 } from '../../types/heritage';
import { heritageAudio } from '../../utils/audioSystem';
import { createArchitecturalSvg } from '../../data/defaultHeritageData';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Upload,
  Info,
  MapPin,
  Sparkles,
  Layers,
  Navigation,
  Plus,
  X,
  Check,
  Image as ImageIcon,
  Volume2
} from 'lucide-react';

interface PanoramaViewerProps {
  scene: Scene360;
  allScenes?: Scene360[];
  onSelectScene?: (sceneId: string) => void;
  onSelectHotspot: (hotspot: Hotspot) => void;
  onAddHotspot?: (newHotspot: Hotspot) => void;
  onDeleteHotspot?: (hotspotId: string) => void;
  onAddSceneTransition?: (transition: { targetSceneId: string; title: string; yaw: number; pitch: number }) => void;
  onDeleteSceneTransition?: (index: number) => void;
  onAddNewScene360?: (name: string, imageUrl: string) => void;
}

export const PanoramaViewer: React.FC<PanoramaViewerProps> = ({
  scene,
  allScenes = [],
  onSelectScene,
  onSelectHotspot,
  onAddHotspot,
  onDeleteHotspot,
  onAddSceneTransition,
  onDeleteSceneTransition,
  onAddNewScene360,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Three.js instances in refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const frameIdRef = useRef<number>(0);

  // Camera angles
  const [yaw, setYaw] = useState<number>(scene.initialYaw || 0);
  const [pitch, setPitch] = useState<number>(scene.initialPitch || 0);
  const [fov, setFov] = useState<number>(75);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Screen-projected 3D coordinates for Hotspots & Transitions
  const [projectedHotspots, setProjectedHotspots] = useState<
    Array<{ hotspot: Hotspot; x: number; y: number; visible: boolean }>
  >([]);

  const [projectedTransitions, setProjectedTransitions] = useState<
    Array<{
      transition: { targetSceneId: string; title: string; yaw: number; pitch: number };
      index: number;
      x: number;
      y: number;
      visible: boolean;
    }>
  >([]);

  // Drag interaction refs
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  const isSoftwareGl = useRef<boolean>(false);

  // ================= TEACHER EDITING MODES =================
  const [editMode, setEditMode] = useState<'none' | 'add-hotspot' | 'add-transition'>('none');
  const [clickedCoord, setClickedCoord] = useState<{ yaw: number; pitch: number } | null>(null);

  // Modal 1: Add Hotspot State
  const [showHotspotModal, setShowHotspotModal] = useState<boolean>(false);
  const [hsTitle, setHsTitle] = useState<string>('');
  const [hsCategory, setHsCategory] = useState<string>('Mái đình / Chùa');
  const [hsExplanation, setHsExplanation] = useState<string>('');
  const [hsArtValue, setHsArtValue] = useState<string>('');
  const [hsImage, setHsImage] = useState<string>('');
  const [hsAudioText, setHsAudioText] = useState<string>('');

  // Modal 2: Add Scene Transition Arrow State
  const [showTransitionModal, setShowTransitionModal] = useState<boolean>(false);
  const [transTargetSceneId, setTransTargetSceneId] = useState<string>('');
  const [transTitle, setTransTitle] = useState<string>('');

  // Modal 3: Upload New 360 Photo State
  const [showUploadSceneModal, setShowUploadSceneModal] = useState<boolean>(false);
  const [newSceneName, setNewSceneName] = useState<string>('');
  const [newSceneDataUrl, setNewSceneDataUrl] = useState<string>('');
  const sceneFileInputRef = useRef<HTMLInputElement>(null);

  // Convert (yaw, pitch) to 3D point inside sphere
  const getPositionFromYawPitch = useCallback((hYaw: number, hPitch: number, radius = 480) => {
    const phi = THREE.MathUtils.degToRad(90 - hPitch);
    const theta = THREE.MathUtils.degToRad(hYaw + 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  }, []);

  // Recalculate 2D screen positions of 3D items
  const updateProjectedElements = useCallback(() => {
    if (!cameraRef.current || !mountRef.current) return;
    const camera = cameraRef.current;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Project Hotspots
    const pHotspots = (scene.hotspots || []).map((hs) => {
      const pos = getPositionFromYawPitch(hs.yaw, hs.pitch);
      const clone = pos.clone();
      clone.project(camera);
      const visible = clone.z < 1.0;
      const x = ((clone.x + 1) * width) / 2;
      const y = ((-clone.y + 1) * height) / 2;
      return { hotspot: hs, x, y, visible };
    });
    setProjectedHotspots(pHotspots);

    // 2. Project Scene Transition Arrows
    const pTransitions = (scene.sceneTransitions || []).map((st, idx) => {
      const pos = getPositionFromYawPitch(st.yaw, st.pitch);
      const clone = pos.clone();
      clone.project(camera);
      const visible = clone.z < 1.0;
      const x = ((clone.x + 1) * width) / 2;
      const y = ((-clone.y + 1) * height) / 2;
      return { transition: st, index: idx, x, y, visible };
    });
    setProjectedTransitions(pTransitions);
  }, [scene.hotspots, scene.sceneTransitions, getPositionFromYawPitch]);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        isSoftwareGl.current = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      }
    } catch {
      isSoftwareGl.current = true;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const threeScene = new THREE.Scene();
    sceneRef.current = threeScene;

    const camera = new THREE.PerspectiveCamera(fov, width / height, 1, 1100);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl.current,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(isSoftwareGl.current ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Sphere geometry (scale x = -1 so normals point inside)
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
    });
    const sphere = new THREE.Mesh(geometry, material);
    threeScene.add(sphere);
    sphereMeshRef.current = sphere;

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !camera || !renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
        updateProjectedElements();
      }
    });
    resizeObserver.observe(container);

    // Render loop
    let currentYaw = yaw;
    let currentPitch = pitch;

    const tick = () => {
      if (isAutoRotating) {
        currentYaw = (currentYaw + 0.12) % 360;
      }

      const phi = THREE.MathUtils.degToRad(90 - currentPitch);
      const theta = THREE.MathUtils.degToRad(currentYaw);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(threeScene, camera);
      updateProjectedElements();

      frameIdRef.current = requestAnimationFrame(tick);
    };

    frameIdRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      resizeObserver.disconnect();
      if (textureRef.current) textureRef.current.dispose();
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, []);

  // Load equirectangular texture with 8192×4096 high-res protection
  useEffect(() => {
    if (!sphereMeshRef.current || !rendererRef.current) return;
    setLoading(true);
    setLoadError(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = scene.imageUrl;

    img.onload = () => {
      try {
        const gl = rendererRef.current?.getContext();
        const maxTextureSize = gl?.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;

        let canvasSource: HTMLCanvasElement | HTMLImageElement = img;

        // If image exceeds GPU maximum texture size (e.g., 8192 on a device that supports max 4096)
        if (img.width > maxTextureSize || img.height > maxTextureSize) {
          const scale = Math.min(maxTextureSize / img.width, maxTextureSize / img.height);
          const c = document.createElement('canvas');
          c.width = Math.floor(img.width * scale);
          c.height = Math.floor(img.height * scale);
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, c.width, c.height);
            canvasSource = c;
          }
        }

        const texture = new THREE.Texture(canvasSource);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;

        if (sphereMeshRef.current) {
          const mat = sphereMeshRef.current.material as THREE.MeshBasicMaterial;
          if (textureRef.current) {
            textureRef.current.dispose();
          }
          textureRef.current = texture;
          mat.map = texture;
          mat.needsUpdate = true;
        }

        setLoading(false);
      } catch (err) {
        setLoadError('Không thể nạp kết cấu đồ họa 360°. Vui lòng thử lại với ảnh JPG equirectangular khác.');
        setLoading(false);
      }
    };

    img.onerror = () => {
      setLoadError('Không thể tải file ảnh toàn cảnh. Vui lòng kiểm tra định dạng ảnh.');
      setLoading(false);
    };
  }, [scene.imageUrl]);

  // Sync camera when yaw, pitch, or fov state updates
  useEffect(() => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    camera.fov = fov;
    camera.updateProjectionMatrix();

    const phi = THREE.MathUtils.degToRad(90 - pitch);
    const theta = THREE.MathUtils.degToRad(yaw);

    const targetX = 500 * Math.sin(phi) * Math.cos(theta);
    const targetY = 500 * Math.cos(phi);
    const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(targetX, targetY, targetZ);
    updateProjectedElements();
  }, [yaw, pitch, fov, updateProjectedElements]);

  // Reset yaw and pitch when switching scenes
  useEffect(() => {
    setYaw(scene.initialYaw || 0);
    setPitch(scene.initialPitch || 0);
  }, [scene.id]);

  // Drag controls
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.25 * (fov / 75);
    setYaw((prev) => (prev - deltaX * sensitivity) % 360);
    setPitch((prev) => Math.max(-85, Math.min(85, prev + deltaY * sensitivity)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.05;
    setFov((prev) => Math.max(35, Math.min(95, prev + zoomDelta)));
  };

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchDistanceRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = touchDistanceRef.current - newDist;
      setFov((prev) => Math.max(35, Math.min(95, prev + diff * 0.2)));
      touchDistanceRef.current = newDist;
    }
  };

  // Handle clicking on canvas when in Edit Mode (Add Hotspot or Transition)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editMode === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const offsetX = clickX - rect.width / 2;
    const offsetY = clickY - rect.height / 2;
    const degX = (offsetX / (rect.width / 2)) * (fov / 2);
    const degY = (offsetY / (rect.height / 2)) * ((fov / 2) * (rect.height / rect.width));

    const targetYaw = Math.round(yaw + degX);
    const targetPitch = Math.round(pitch - degY);

    setClickedCoord({ yaw: targetYaw, pitch: targetPitch });
    heritageAudio.playClick();

    if (editMode === 'add-hotspot') {
      setShowHotspotModal(true);
    } else if (editMode === 'add-transition') {
      const otherScenes = allScenes.filter((s) => s.id !== scene.id);
      if (otherScenes.length > 0) {
        setTransTargetSceneId(otherScenes[0].id);
        setTransTitle(`Bước sang ${otherScenes[0].name}`);
      }
      setShowTransitionModal(true);
    }
  };

  // Handle Hotspot Submission
  const handleSaveHotspot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hsTitle.trim() || !clickedCoord) return;

    const newHs: Hotspot = {
      id: `hs-${Date.now()}`,
      title: hsTitle.trim(),
      architecturalPart: hsCategory,
      explanation: hsExplanation.trim() || 'Chi tiết kiến trúc đặc sắc của di tích.',
      artisticValue: hsArtValue.trim() || 'Giá trị nghệ thuật cổ truyền độc đáo.',
      detailedImage: hsImage || createArchitecturalSvg(hsTitle, hsCategory, '#451a03', '#f59e0b'),
      yaw: clickedCoord.yaw,
      pitch: clickedCoord.pitch,
      audioSnippet: hsAudioText.trim()
        ? {
            title: `Thuyết minh ${hsTitle}`,
            text: hsAudioText.trim(),
          }
        : undefined,
    };

    onAddHotspot?.(newHs);
    heritageAudio.playCorrect();

    // Reset form
    setHsTitle('');
    setHsExplanation('');
    setHsArtValue('');
    setHsImage('');
    setHsAudioText('');
    setShowHotspotModal(false);
    setEditMode('none');
  };

  // Handle Scene Transition Submission
  const handleSaveTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transTargetSceneId || !clickedCoord) return;

    onAddSceneTransition?.({
      targetSceneId: transTargetSceneId,
      title: transTitle || 'Chuyển không gian tham quan',
      yaw: clickedCoord.yaw,
      pitch: clickedCoord.pitch,
    });
    heritageAudio.playCorrect();

    setShowTransitionModal(false);
    setEditMode('none');
  };

  // Handle Upload 360 File
  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setNewSceneDataUrl(result);
        setNewSceneName(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNewScene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSceneDataUrl || !newSceneName.trim()) return;

    onAddNewScene360?.(newSceneName.trim(), newSceneDataUrl);
    heritageAudio.playCorrect();

    setNewSceneDataUrl('');
    setNewSceneName('');
    setShowUploadSceneModal(false);
  };

  const toggleFullscreen = () => {
    if (!mountRef.current?.parentElement) return;
    if (!document.fullscreenElement) {
      mountRef.current.parentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[520px] md:min-h-[620px] bg-stone-950 select-none overflow-hidden rounded-3xl border-2 border-amber-800/60 shadow-2xl">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className={`w-full h-full touch-none ${
          editMode !== 'none' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => (touchDistanceRef.current = null)}
        onClick={handleCanvasClick}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-stone-950/85 text-amber-300 backdrop-blur-xs">
          <div className="w-12 h-12 border-4 border-amber-700 border-t-amber-400 rounded-full animate-spin mb-4" />
          <p className="font-serif text-lg font-semibold tracking-wide">Đang tải không gian 360°...</p>
          <p className="text-xs text-amber-200/70 mt-1">Hỗ trợ ảnh equirectangular 2:1 lên tới 8192 × 4096 px</p>
        </div>
      )}

      {/* Error Overlay */}
      {loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-stone-950/90 text-red-300 p-6 text-center">
          <p className="font-serif text-lg font-bold text-red-200 mb-2">Thông báo nạp ảnh 360°</p>
          <p className="text-sm max-w-md text-amber-100/90 mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => setLoading(false)}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl"
          >
            Đóng thông báo
          </button>
        </div>
      )}

      {/* Edit Mode Instruction Banner */}
      {editMode !== 'none' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 bg-red-950/95 border-2 border-amber-400 rounded-full text-amber-100 text-xs md:text-sm font-semibold shadow-2xl flex items-center gap-2.5 animate-bounce">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>
            {editMode === 'add-hotspot'
              ? 'Nhấp chuột vào điểm bất kỳ trên ảnh 360° (mái, cột, vì kèo, hoa văn...) để thêm giải mã kiến trúc'
              : 'Nhấp chuột vào vị trí cửa/lối đi trên ảnh 360° để đặt mũi tên chuyển cảnh'}
          </span>
          <button
            type="button"
            onClick={() => setEditMode('none')}
            className="p-1 hover:bg-red-900 rounded-full text-amber-200"
            title="Hủy chế độ chỉnh sửa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= 3D PROJECTED HOTSPOTS (Chức năng 3) ================= */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {projectedHotspots.map(({ hotspot, x, y, visible }) => {
          if (!visible) return null;
          return (
            <div
              key={hotspot.id}
              style={{
                transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`,
              }}
              className="absolute pointer-events-auto group cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                heritageAudio.playClick();
                onSelectHotspot(hotspot);
              }}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-11 h-11 rounded-full bg-amber-500/30 ring-2 ring-amber-400 animate-ping opacity-70" />
                <button
                  type="button"
                  className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-red-800 to-amber-600 text-amber-100 shadow-2xl border-2 border-amber-300 hover:scale-115 transition-transform"
                  title={hotspot.title}
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                </button>
              </div>

              {/* Tooltip Tag */}
              <div className="absolute left-1/2 -translate-x-1/2 top-11 w-max max-w-[210px] px-3 py-1.5 bg-stone-900/95 border border-amber-500/80 rounded-xl text-center shadow-2xl opacity-90 group-hover:opacity-100 transition-opacity">
                <p className="text-xs font-serif font-bold text-amber-200 leading-tight">
                  {hotspot.title}
                </p>
                <p className="text-[10px] text-amber-400/80">{hotspot.architecturalPart}</p>
                <p className="text-[9px] text-emerald-400 font-medium">Nhấn để giải mã kiến trúc</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= 3D PROJECTED SCENE TRANSITIONS (Chức năng 7: Mũi tên chuyển ảnh) ================= */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {projectedTransitions.map(({ transition, index, x, y, visible }) => {
          if (!visible) return null;
          return (
            <div
              key={`${transition.targetSceneId}-${index}`}
              style={{
                transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`,
              }}
              className="absolute pointer-events-auto group cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                heritageAudio.playTempleBell();
                onSelectScene?.(transition.targetSceneId);
              }}
            >
              {/* Directional Navigation Marker */}
              <div className="flex flex-col items-center">
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-800 to-teal-600 border-2 border-emerald-300 text-white flex items-center justify-center shadow-2xl group-hover:scale-115 group-hover:bg-emerald-600 transition-all">
                  <Navigation className="w-6 h-6 transform rotate-45 text-amber-200" />
                </div>

                {/* Transition Label */}
                <div className="mt-1.5 px-3 py-1 bg-stone-950/90 border border-emerald-400/80 rounded-lg text-center shadow-xl text-xs font-serif font-bold text-emerald-200 group-hover:text-emerald-100 whitespace-nowrap">
                  {transition.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Left: Scenes Switcher Bar */}
      {allScenes.length > 0 && (
        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 max-w-[70%]">
          {allScenes.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => {
                heritageAudio.playClick();
                onSelectScene?.(sc.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 border ${
                sc.id === scene.id
                  ? 'bg-gradient-to-r from-red-800 to-amber-700 text-white border-amber-300 shadow-amber-900/50'
                  : 'bg-stone-900/85 text-amber-200 border-amber-800/70 hover:bg-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{sc.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Top Right: Teacher Action Bar (Upload 360, Add Hotspot, Add Transition) */}
      <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center gap-2">
        {/* Button 1: Thêm điểm kiến trúc */}
        <button
          type="button"
          onClick={() => {
            heritageAudio.playClick();
            setEditMode(editMode === 'add-hotspot' ? 'none' : 'add-hotspot');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-md flex items-center gap-1.5 transition-colors ${
            editMode === 'add-hotspot'
              ? 'bg-amber-600 text-stone-950 border-amber-300 font-bold'
              : 'bg-stone-900/85 text-amber-200 border-amber-700/60 hover:bg-stone-800'
          }`}
          title="Đặt điểm giải mã kiến trúc lên ảnh 360°"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Thêm điểm kiến trúc</span>
        </button>

        {/* Button 2: Thêm mũi tên chuyển cảnh */}
        <button
          type="button"
          onClick={() => {
            heritageAudio.playClick();
            setEditMode(editMode === 'add-transition' ? 'none' : 'add-transition');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-md flex items-center gap-1.5 transition-colors ${
            editMode === 'add-transition'
              ? 'bg-emerald-600 text-stone-950 border-emerald-300 font-bold'
              : 'bg-stone-900/85 text-amber-200 border-amber-700/60 hover:bg-stone-800'
          }`}
          title="Tạo mũi tên chuyển giữa các ảnh 360°"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Mũi tên chuyển cảnh</span>
        </button>

        {/* Button 3: Tải ảnh 360° từ máy tính (Dành cho giáo viên) */}
        <button
          type="button"
          onClick={() => {
            heritageAudio.playClick();
            setShowUploadSceneModal(true);
          }}
          className="px-3 py-1.5 bg-stone-900/85 hover:bg-stone-800 text-amber-200 text-xs font-semibold rounded-xl border border-amber-700/60 shadow-md flex items-center gap-1.5 transition-colors"
          title="Tải ảnh toàn cảnh equirectangular 2:1 (hỗ trợ tới 8192×4096 px)"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Tải ảnh 360°</span>
        </button>
      </div>

      {/* Unified Bottom Ergonomic Control Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-xl px-4 py-2 bg-stone-900/90 border border-amber-700/60 rounded-2xl shadow-2xl flex items-center justify-between text-amber-200 backdrop-blur-xs">
        {/* Auto Rotate */}
        <button
          type="button"
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            isAutoRotating
              ? 'bg-amber-700 border-amber-300 text-white font-bold'
              : 'bg-stone-800 border-stone-700 text-amber-200 hover:bg-stone-700'
          }`}
          title={isAutoRotating ? 'Dừng tự động xoay' : 'Bật tự động xoay 360°'}
        >
          {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Tự xoay</span>
        </button>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFov((prev) => Math.max(35, prev - 8))}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl border border-stone-700 transition-colors"
            title="Phóng to (Zoom in)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setFov((prev) => Math.min(95, prev + 8))}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl border border-stone-700 transition-colors"
            title="Thu nhỏ (Zoom out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setYaw(scene.initialYaw || 0);
              setPitch(scene.initialPitch || 0);
              setFov(75);
              heritageAudio.playClick();
            }}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl border border-stone-700 transition-colors"
            title="Đặt lại góc nhìn ban đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Status & Fullscreen */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-amber-300/80 font-mono hidden md:inline">
            Góc: {Math.round(yaw)}°
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl border border-stone-700 transition-colors"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ================= MODAL 1: ADD ARCHITECTURAL HOTSPOT ================= */}
      {showHotspotModal && clickedCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-[#200e08] border-2 border-amber-600 rounded-3xl p-6 text-amber-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-amber-800/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-lg text-amber-200">
                  Thêm Điểm Giải Mã Kiến Trúc
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHotspotModal(false)}
                className="p-1 hover:bg-stone-800 rounded-full text-amber-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-amber-300/80">
              Tọa độ không gian 360° đã chọn: Yaw {clickedCoord.yaw}°, Pitch {clickedCoord.pitch}°
            </p>

            <form onSubmit={handleSaveHotspot} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Tên chi tiết kiến trúc nghệ thuật:
                </label>
                <input
                  type="text"
                  placeholder="VD: Mái ngói mũi hài, Kèo chồng rường, Cột gỗ lim, Đầu đao..."
                  value={hsTitle}
                  onChange={(e) => setHsTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100 focus:border-amber-400 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Phân loại bộ phận:
                </label>
                <select
                  value={hsCategory}
                  onChange={(e) => setHsCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100 focus:outline-hidden"
                >
                  <option value="Mái đình / Chùa">Mái đình / Chùa (Ngói mũi hài, đầu đao)</option>
                  <option value="Cột & Chân tảng">Cột & Chân tảng (Cột gỗ lim, tảng đá xanh)</option>
                  <option value="Vì kèo & Xà">Vì kèo & Xà (Kèo chồng rường, giá chiêng, xà nách)</option>
                  <option value="Cốn mê & Bức cốn">Cốn mê & Bức cốn (Chạm rồng thời Lê, tứ linh)</option>
                  <option value="Đầu bẩy & Kẻ hiên">Đầu bẩy & Kẻ hiên (Rồng ngậm ngọc, lá cúc)</option>
                  <option value="Hoa văn điêu khắc">Hoa văn điêu khắc (Mây lửa, hoa sen, cúc vạn thọ)</option>
                  <option value="Cửa & Vách gỗ">Cửa & Vách gỗ (Cửa bức bàn, y môn)</option>
                  <option value="Hiện vật & Đồ thờ">Hiện vật & Đồ thờ (Lư hương đá, hoành phi, bia đá)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Lời giải thích dễ hiểu cho học sinh THCS:
                </label>
                <textarea
                  rows={2}
                  placeholder="Giải thích nguyên lý dựng, chức năng và công năng của bộ phận này..."
                  value={hsExplanation}
                  onChange={(e) => setHsExplanation(e.target.value)}
                  className="w-full p-3 bg-stone-900 border border-amber-800 rounded-xl text-xs md:text-sm text-amber-100 focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Giá trị nghệ thuật đặc sắc:
                </label>
                <textarea
                  rows={2}
                  placeholder="Nét tinh hoa chạm khắc, biểu tượng văn hóa truyền thống..."
                  value={hsArtValue}
                  onChange={(e) => setHsArtValue(e.target.value)}
                  className="w-full p-3 bg-stone-900 border border-amber-800 rounded-xl text-xs md:text-sm text-amber-100 focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Kịch bản âm thanh thuyết minh (Hệ thống sẽ đọc mẫu):
                </label>
                <input
                  type="text"
                  placeholder="Nhập nội dung ngắn để học sinh nhấn nút nghe đọc thuyết minh..."
                  value={hsAudioText}
                  onChange={(e) => setHsAudioText(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHotspotModal(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg"
                >
                  Lưu điểm tương tác
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD SCENE TRANSITION ARROW ================= */}
      {showTransitionModal && clickedCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#200e08] border-2 border-emerald-600 rounded-3xl p-6 text-amber-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-800/50">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <h3 className="font-serif font-bold text-lg text-emerald-200">
                  Tạo Mũi Tên Chuyển Cảnh
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTransitionModal(false)}
                className="p-1 hover:bg-stone-800 rounded-full text-amber-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-amber-300/80">
              Đặt mũi tên tại hướng nhìn: Yaw {clickedCoord.yaw}°, Pitch {clickedCoord.pitch}°
            </p>

            <form onSubmit={handleSaveTransition} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Chọn không gian chuyển đến:
                </label>
                <select
                  value={transTargetSceneId}
                  onChange={(e) => {
                    setTransTargetSceneId(e.target.value);
                    const targetSc = allScenes.find((s) => s.id === e.target.value);
                    if (targetSc) setTransTitle(`Bước sang ${targetSc.name}`);
                  }}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100 focus:outline-hidden"
                  required
                >
                  {allScenes
                    .filter((s) => s.id !== scene.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Tiêu đề hiển thị trên mũi tên:
                </label>
                <input
                  type="text"
                  placeholder="VD: Bước vào Tòa Tam Bảo, Trở ra Sân Chùa..."
                  value={transTitle}
                  onChange={(e) => setTransTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100 focus:border-amber-400 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransitionModal(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg"
                >
                  Tạo mũi tên chuyển cảnh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: UPLOAD NEW 360 PANORAMA ================= */}
      {showUploadSceneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-[#200e08] border-2 border-amber-600 rounded-3xl p-6 text-amber-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-800/50">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-lg text-amber-200">
                  Tải Ảnh Thực Tế 360° Từ Máy Tính
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadSceneModal(false)}
                className="p-1 hover:bg-stone-800 rounded-full text-amber-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-amber-300/80">
              Hỗ trợ ảnh toàn cảnh JPG equirectangular tỷ lệ 2:1 (bao gồm ảnh chất lượng cao 8192 × 4096 px).
            </p>

            <form onSubmit={handleSaveNewScene} className="space-y-4">
              <input
                ref={sceneFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChosen}
              />

              <div
                onClick={() => sceneFileInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-amber-700/80 hover:border-amber-400 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-stone-950/50 transition-colors p-4 text-center"
              >
                {newSceneDataUrl ? (
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-emerald-400" />
                    <span className="text-xs text-emerald-300 font-semibold">
                      Đã chọn ảnh thành công! (Nhấn để chọn file khác)
                    </span>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-amber-400/80" />
                    <span className="text-xs text-amber-200 font-semibold">
                      Nhấn vào đây để chọn file ảnh 360° từ máy tính của thầy cô
                    </span>
                    <span className="text-[11px] text-amber-400/60">Định dạng JPG 2:1</span>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Tên vị trí tham quan (Không gian 360° mới):
                </label>
                <input
                  type="text"
                  placeholder="VD: Cổng Tam Quan, Gian Hậu Cung, Sân Đình Sau..."
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100 focus:border-amber-400 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadSceneModal(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newSceneDataUrl || !newSceneName.trim()}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs rounded-xl shadow-lg"
                >
                  Thêm không gian 360° vào di tích
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
