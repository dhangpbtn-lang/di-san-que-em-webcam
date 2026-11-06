/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SA BÀN SỐ 3D TƯƠNG TÁC DI SẢN • HUYỆN PHÚ BÌNH (THÁI NGUYÊN)
 * Lấy cảm hứng từ hệ thống Sa bàn số 3D Chiến dịch Điện Biên Phủ,
 * thiết kế tối ưu cho không gian di sản địa phương.
 * 
 * Bố cục chuẩn mực:
 * - Tiêu đề sa bàn số phía trên
 * - Vùng sa bàn 3D lớn bên trái (MapLibre GL JS + DEM độ cao số Terrarium)
 * - Bảng thông tin 3 Tab bên phải (DI TÍCH, NHIỆM VỤ, NGUỒN TƯ LIỆU)
 * - Thanh góc nhìn bên dưới (TOÀN CẢNH, TỪ TRÊN CAO, và từng di tích)
 * - Chế độ GIÁO VIÊN và HỌC SINH
 * - Công tắc lưới số Hologram và hiệu ứng ánh sáng
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

// Cấu hình URL web worker chuẩn xác cho MapLibre GL JS trong Vite
// Giúp giải quyết dứt điểm lỗi 'MapLibre Worker failed to load' mà không dùng thủ thuật ẩn lỗi
if (typeof window !== 'undefined' && (maplibregl as any).setWorkerUrl) {
  (maplibregl as any).setWorkerUrl(maplibreWorkerUrl);
}

import { HeritageSite } from '../../types/heritage';
import { heritageAudio } from '../../utils/audioSystem';
import { WebcamGestureControl } from './WebcamGestureControl';
import {
  Compass,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Eye,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  GraduationCap,
  Award,
  BookOpen,
  Target,
  FileText,
  Play,
  Pause,
  Grid,
  Radio,
  Check,
  Zap,
  Globe
} from 'lucide-react';

interface Sandtable3DProps {
  sites: HeritageSite[];
  onSelectSite: (siteId: string) => void;
  onOpenVirtualTour?: (siteId: string) => void;
  onAddPoints?: (amount: number, reason: string) => void;
}

// Tọa độ trung tâm và các góc nhìn mặc định của huyện Phú Bình, Thái Nguyên
const PHU_BINH_CENTER: [number, number] = [105.945, 21.485]; // [Lng, Lat]
const DEFAULT_ZOOM = 12.2;
const DEFAULT_PITCH = 55; // Góc nghiêng địa hình 3D sa bàn
const DEFAULT_BEARING = -20; // Hướng quan sát tối ưu thung lũng sông Cầu và các gò đồi di tích

// Tính toán Bounding Box bao trọn cả 5 tọa độ di tích đã xác minh
export const compute5SitesBoundingBox = (siteList: HeritageSite[]): maplibregl.LngLatBounds | null => {
  const validCoordinates = siteList
    .filter((s) => s.coordinates?.isVerified && s.coordinates?.lat && s.coordinates?.lng)
    .map((s) => [s.coordinates!.lng, s.coordinates!.lat] as [number, number]);

  if (validCoordinates.length === 0) return null;

  const bounds = new maplibregl.LngLatBounds(validCoordinates[0], validCoordinates[0]);
  validCoordinates.forEach((coord) => bounds.extend(coord));
  return bounds;
};

// Danh sách góc nhìn camera cài sẵn chuẩn xác theo tọa độ đã kiểm chứng
interface CameraViewpoint {
  id: string;
  label: string;
  subtitle: string;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  siteId?: string;
}

const PRESET_VIEWPOINTS: CameraViewpoint[] = [
  {
    id: 'overview',
    label: 'Toàn Cảnh 5 Di Tích',
    subtitle: 'Khung nhìn tự động bao quát cả 5 di tích Phú Bình (Nghiêng 3D 55°)',
    center: PHU_BINH_CENTER,
    zoom: 12.2,
    pitch: 55,
    bearing: -20,
  },
  {
    id: 'ortho',
    label: 'Từ Trên Cao',
    subtitle: 'Góc nhìn thẳng đứng 0° dạng bình đồ bản đồ bao quát 5 di tích',
    center: PHU_BINH_CENTER,
    zoom: 12.0,
    pitch: 0,
    bearing: 0,
  },
  {
    id: 'chua-ha',
    label: 'Chùa Ha',
    subtitle: 'Xã Nhã Lộng • Ngôi chùa cổ ven sông Đào',
    center: [105.9385, 21.4642],
    zoom: 15.8,
    pitch: 65,
    bearing: -20,
    siteId: 'chua-ha',
  },
  {
    id: 'chua-ho-lenh',
    label: 'Đình Hộ Lệnh',
    subtitle: 'Xã Điềm Thụy • Kiến trúc đình làng cổ',
    center: [105.9083, 21.4952],
    zoom: 15.8,
    pitch: 65,
    bearing: -35,
    siteId: 'chua-ho-lenh',
  },
  {
    id: 'dinh-phuong-do',
    label: 'Đình Phương Độ',
    subtitle: 'Xã Xuân Phương • Di tích Quốc gia thời Hậu Lê',
    center: [105.9491, 21.5034],
    zoom: 15.8,
    pitch: 65,
    bearing: -15,
    siteId: 'dinh-phuong-do',
  },
  {
    id: 'dinh-xuan-la',
    label: 'Đình Xuân La',
    subtitle: 'Xã Thanh Ninh • Đầu bẩy chạm rồng ngậm ngọc',
    center: [105.9782, 21.4725],
    zoom: 15.8,
    pitch: 65,
    bearing: -40,
    siteId: 'dinh-xuan-la',
  },
  {
    id: 'chua-uc-ky',
    label: 'Chùa Úc Kỳ',
    subtitle: 'Xã Úc Kỳ • Gắn liền làng nghề tương nếp',
    center: [105.9324, 21.4583],
    zoom: 15.8,
    pitch: 65,
    bearing: -10,
    siteId: 'chua-uc-ky',
  },
];

export const Sandtable3D: React.FC<Sandtable3DProps> = ({
  sites,
  onSelectSite,
  onOpenVirtualTour,
  onAddPoints,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const orbitAnimRef = useRef<number | null>(null);

  // 1. Trạng thái bản đồ & Điều khiển
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeMapMode, setActiveMapMode] = useState<'satellite' | 'topo'>('satellite');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [showHologramGrid, setShowHologramGrid] = useState<boolean>(true);
  const [activeViewpointId, setActiveViewpointId] = useState<string>('overview');

  // 2. Chế độ người dùng: GIÁO VIÊN vs HỌC SINH
  const [userRole, setUserRole] = useState<'teacher' | 'student'>('teacher');

  // 3. Bảng thông tin: 3 Tabs (DI TÍCH, NHIỆM VỤ, NGUỒN TƯ LIỆU)
  const [activeConsoleTab, setActiveConsoleTab] = useState<'site' | 'mission' | 'sources'>('site');
  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(sites[0] || null);

  // 4. Thuyết minh giọng đọc (Audio Speech Synthesis & Sound Effects)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechSynthesisAvailable, setSpeechSynthesisAvailable] = useState<boolean>(true);

  // 5. Nhiệm vụ học sinh (Interactive Missions & Point Rewards)
  const [mission1Target, setMission1Target] = useState<string>('dinh-phuong-do'); // Mục tiêu tìm trên bản đồ
  const [mission1Completed, setMission1Completed] = useState<boolean>(false);

  // Nhiệm vụ 2: Ghép tên & Đặc điểm kiến trúc
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
  const [mission2Completed, setMission2Completed] = useState<boolean>(false);
  const [mission2ResultMsg, setMission2ResultMsg] = useState<string>('');

  // Nhiệm vụ 3: Câu hỏi giải mã địa hình sông Cầu
  const [mission3Answer, setMission3Answer] = useState<number | null>(null);
  const [mission3Completed, setMission3Completed] = useState<boolean>(false);

  // Danh sách di tích đã xác minh tọa độ (đảm bảo không bịa tọa độ)
  const verifiedSites = sites.filter(
    (s) => s.coordinates && s.coordinates.lat && s.coordinates.lng && s.coordinates.isVerified
  );
  const unverifiedSites = sites.filter(
    (s) => !s.coordinates || !s.coordinates.lat || !s.coordinates.lng || !s.coordinates.isVerified
  );

  // ==============================================================
  // KHỞI TẠO BẢN ĐỒ MAPLIBRE GL JS & LƯỚI ĐỘ CAO 3D DEM
  // ==============================================================
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    try {
      const mapStyle: maplibregl.StyleSpecification = {
        version: 8,
        sources: {
          'satellite-tiles': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: 'Esri World Imagery & GIS Community',
            maxzoom: 19,
          },
          'topo-tiles': {
            type: 'raster',
            tiles: [
              'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
            maxzoom: 19,
          },
          'terrain-dem': {
            type: 'raster-dem',
            tiles: [
              'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            encoding: 'terrarium',
            maxzoom: 14,
          },
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite-tiles',
            minzoom: 0,
            maxzoom: 19,
            layout: { visibility: 'visible' },
          },
          {
            id: 'topo-layer',
            type: 'raster',
            source: 'topo-tiles',
            minzoom: 0,
            maxzoom: 19,
            layout: { visibility: 'none' },
          },
          {
            id: 'hillshade-layer',
            type: 'hillshade',
            source: 'terrain-dem',
            layout: { visibility: 'visible' },
            paint: {
              'hillshade-exaggeration': 0.75,
              'hillshade-shadow-color': '#1a0b04',
              'hillshade-highlight-color': '#fde68a',
              'hillshade-accent-color': '#b45309',
            },
          },
        ],
        terrain: {
          source: 'terrain-dem',
          exaggeration: 1.65,
        },
        sky: {
          'sky-color': '#160803',
          'sky-horizon-blend': 0.5,
          'horizon-color': '#78350f',
          'fog-color': '#1d0c05',
        },
      };

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: PHU_BINH_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
        maxPitch: 84,
        minZoom: 8,
        maxZoom: 18,
        attributionControl: false,
      });

      // Navigation Control
      map.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          showCompass: true,
          showZoom: true,
        }),
        'bottom-left'
      );

      mapInstanceRef.current = map;

      map.on('load', () => {
        if (!isMounted) return;
        setIsLoading(false);

        // YÊU CẦU BẮT BUỘC: Khi mở sa bàn, camera mặc định ở góc TOÀN CẢNH 5 DI TÍCH,
        // tự động tính khung nhìn bao phủ cả 5 tọa độ với khoảng đệm phù hợp, không cắt mất điểm
        const initialBounds = compute5SitesBoundingBox(sites);
        if (initialBounds) {
          map.fitBounds(initialBounds, {
            padding: { top: 90, bottom: 90, left: 100, right: 100 },
            pitch: 55,
            bearing: -20,
            maxZoom: 13.5,
            duration: 0,
          });
        }
      });

      map.on('error', (e: unknown) => {
        console.warn('MapLibre GL Notice:', e);
      });
    } catch (err) {
      console.error('Lỗi khởi tạo MapLibre GL:', err);
      if (isMounted) {
        setIsLoading(false);
        setLoadError(
          'Không thể khởi tạo bộ hiển thị 3D WebGL hoặc nguồn dữ liệu bản đồ. Thầy cô và học sinh có thể sử dụng thông tin chi tiết trên bảng điều khiển bên phải.'
        );
      }
    }

    return () => {
      isMounted = false;
      if (orbitAnimRef.current) cancelAnimationFrame(orbitAnimRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ==============================================================
  // CẬP NHẬT GHIM 3D (ĐÈN CHIẾU & PULSE PHONG CÁCH SA BÀN SỐ)
  // ==============================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    verifiedSites.forEach((site) => {
      if (!site.coordinates?.lng || !site.coordinates?.lat) return;

      const isCurrentSelected = selectedSite?.id === site.id;

      const el = document.createElement('div');
      el.className = 'sandtable-digital-marker cursor-pointer group relative';
      el.style.width = '48px';
      el.style.height = '48px';

      el.innerHTML = `
        <div class="relative flex items-center justify-center w-full h-full">
          <!-- Hiệu ứng sóng radar sa bàn số -->
          <div class="absolute inset-0 rounded-2xl bg-amber-400/25 animate-ping opacity-80"></div>
          
          <!-- Cột đèn chiếu sáng thẳng đứng kiểu sa bàn Điện Biên Phủ -->
          <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-gradient-to-t from-amber-400 to-transparent opacity-80"></div>

          <!-- Khối ghim 3D với viền sáng kim loại -->
          <div class="relative w-11 h-11 rounded-2xl p-0.5 shadow-2xl transition-all duration-300 transform group-hover:scale-125 ${
            isCurrentSelected
              ? 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 ring-4 ring-amber-400/60 scale-110'
              : 'bg-gradient-to-br from-amber-500 via-amber-700 to-stone-900 border-2 border-amber-400/70'
          }">
            <div class="w-full h-full bg-[#1b0a04] rounded-xl flex items-center justify-center text-amber-300 font-serif font-black text-base drop-shadow-md">
              ${site.type === 'Chùa' ? '⛩️' : '🏛️'}
            </div>
          </div>

          <!-- Mũi nhọn tiếp đất địa hình -->
          <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-amber-400 rotate-45 border-r border-b border-amber-700 shadow-md"></div>

          <!-- Nhãn số điện tử hiển thị tên di tích & cao độ -->
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#140602]/95 text-amber-200 text-[10px] font-bold rounded-full border border-amber-400/80 whitespace-nowrap shadow-xl pointer-events-none group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors flex items-center gap-1">
            <span>${site.name}</span>
            <span class="text-[9px] text-amber-400/80 font-mono">(${site.coordinates?.altitudeMeters || 28}m)</span>
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        heritageAudio.playTempleBell();
        handleSelectSiteOnMap(site);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.coordinates.lng, site.coordinates.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [sites, selectedSite, isLoading]);

  // Xử lý khi nhấn vào điểm di tích trên sa bàn
  const handleSelectSiteOnMap = (site: HeritageSite) => {
    setSelectedSite(site);
    setActiveConsoleTab('site');
    setActiveViewpointId(site.id);

    // Kiểm tra nhiệm vụ tìm di tích cho học sinh
    if (userRole === 'student' && !mission1Completed && site.id === mission1Target) {
      setMission1Completed(true);
      heritageAudio.playFanfare();
      if (onAddPoints) {
        onAddPoints(20, `Hoàn thành nhiệm vụ Sa bàn 3D: Định vị chính xác ${site.name}`);
      }
    }

    const map = mapInstanceRef.current;
    if (!map || !site.coordinates?.lat || !site.coordinates?.lng) return;

    map.flyTo({
      center: [site.coordinates.lng, site.coordinates.lat],
      zoom: 15.8,
      pitch: 65,
      bearing: DEFAULT_BEARING,
      duration: 1800,
      essential: true,
    });
  };

  // ==============================================================
  // CÁC NÚT ĐIỀU KHIỂN HOẠT ĐỘNG THẬT (CONTROL HANDLERS)
  // ==============================================================
  // 1. NÚT TOÀN CẢNH 5 DI TÍCH: Tự động tính Bounding Box bao trùm 5 điểm có khoảng đệm
  const handleFitAll5Sites = (immediate = false) => {
    heritageAudio.playClick();
    const map = mapInstanceRef.current;
    if (!map) return;

    if (orbitAnimRef.current) {
      cancelAnimationFrame(orbitAnimRef.current);
      orbitAnimRef.current = null;
    }
    setIsOrbiting(false);
    setActiveViewpointId('overview');
    setIs3DMode(true);

    const bounds = compute5SitesBoundingBox(sites);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 90, left: 100, right: 100 },
        pitch: 55,
        bearing: -20,
        maxZoom: 13.5,
        duration: immediate ? 0 : 2000,
        essential: true,
      });
    } else {
      map.flyTo({
        center: PHU_BINH_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
        duration: immediate ? 0 : 1800,
        essential: true,
      });
    }
  };

  // 2. NÚT TỪ TRÊN CAO: Góc nhìn thẳng đứng 0° dạng bình đồ bao quát 5 di tích
  const handleOrthoView = () => {
    heritageAudio.playClick();
    const map = mapInstanceRef.current;
    if (!map) return;

    if (orbitAnimRef.current) {
      cancelAnimationFrame(orbitAnimRef.current);
      orbitAnimRef.current = null;
    }
    setIsOrbiting(false);
    setActiveViewpointId('ortho');
    setIs3DMode(false);

    const bounds = compute5SitesBoundingBox(sites);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        pitch: 0,
        bearing: 0,
        maxZoom: 13.5,
        duration: 1800,
        essential: true,
      });
    } else {
      map.flyTo({
        center: PHU_BINH_CENTER,
        zoom: 12.0,
        pitch: 0,
        bearing: 0,
        duration: 1800,
        essential: true,
      });
    }
  };

  // 3. Chuyển đổi lớp nền: Vệ tinh vs Bản đồ địa hình
  const handleToggleMapMode = (mode: 'satellite' | 'topo') => {
    setActiveMapMode(mode);
    heritageAudio.playClick();
    const map = mapInstanceRef.current;
    if (!map) return;

    if (map.getLayer('satellite-layer') && map.getLayer('topo-layer')) {
      map.setLayoutProperty('satellite-layer', 'visibility', mode === 'satellite' ? 'visible' : 'none');
      map.setLayoutProperty('topo-layer', 'visibility', mode === 'topo' ? 'visible' : 'none');
    }
  };

  // 4. Chuyển đổi góc nghiêng (NGHIÊNG): 3D (60°) vs 2D (0°)
  const handleTogglePitch = () => {
    heritageAudio.playClick();
    const map = mapInstanceRef.current;
    if (!map) return;

    const new3D = !is3DMode;
    setIs3DMode(new3D);
    map.easeTo({
      pitch: new3D ? DEFAULT_PITCH : 0,
      duration: 1000,
    });
  };

  // 5. Phóng to / Thu nhỏ (PHÓNG TO, THU NHỎ)
  const handleZoom = (delta: number) => {
    heritageAudio.playClick();
    const map = mapInstanceRef.current;
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() + delta, duration: 400 });
  };

  // 6. Xoay góc nhìn sa bàn (XOAY)
  const handleRotateBearing = (deltaAngle: number) => {
    heritageAudio.playClick();
    const map = mapInstanceRef.current;
    if (!map) return;
    map.easeTo({ bearing: map.getBearing() + deltaAngle, duration: 600 });
  };

  // 7. Chế độ xoay tự động (Orbit 360°)
  const toggleAutoOrbit = () => {
    heritageAudio.playClick();
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isOrbiting) {
      if (orbitAnimRef.current) cancelAnimationFrame(orbitAnimRef.current);
      setIsOrbiting(false);
    } else {
      setIsOrbiting(true);
      const orbitLoop = () => {
        if (mapInstanceRef.current) {
          const currentBearing = mapInstanceRef.current.getBearing();
          mapInstanceRef.current.setBearing((currentBearing + 0.15) % 360);
          orbitAnimRef.current = requestAnimationFrame(orbitLoop);
        }
      };
      orbitAnimRef.current = requestAnimationFrame(orbitLoop);
    }
  };

  // 8. NÚT ĐẶT LẠI GÓC NHÌN: Khôi phục toàn cảnh 5 di tích
  const handleResetCamera = () => {
    handleFitAll5Sites(false);
  };

  // 9. Toàn màn hình sa bàn
  const handleToggleFullscreen = () => {
    heritageAudio.playClick();
    const container = mapContainerRef.current?.closest('.sandtable-outer-wrapper');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 10. Chuyển góc nhìn camera theo thanh điều khiển bên dưới
  const handleApplyViewpoint = (vp: CameraViewpoint) => {
    heritageAudio.playClick();
    setActiveViewpointId(vp.id);

    if (orbitAnimRef.current) {
      cancelAnimationFrame(orbitAnimRef.current);
      orbitAnimRef.current = null;
    }
    setIsOrbiting(false);

    if (vp.id === 'overview') {
      handleFitAll5Sites(false);
      return;
    }

    if (vp.id === 'ortho') {
      handleOrthoView();
      return;
    }

    if (vp.siteId) {
      const targetSite = sites.find((s) => s.id === vp.siteId);
      if (targetSite) setSelectedSite(targetSite);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo({
      center: vp.center,
      zoom: vp.zoom,
      pitch: vp.pitch,
      bearing: vp.bearing,
      duration: 2000,
      essential: true,
    });
  };

  // 9. Thuyết minh giọng đọc tự động (Speech Synthesis)
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      setSpeechSynthesisAvailable(false);
      heritageAudio.playTempleBell();
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!selectedSite) return;
      window.speechSynthesis.cancel();

      const textToRead = `${selectedSite.name}. Địa chỉ: ${selectedSite.locality}. ${selectedSite.shortSummary}. ${selectedSite.architectureOverview}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      heritageAudio.playTempleBell();
    }
  };

  // 10. Chấm điểm nhiệm vụ 2: Ghép tên & Đặc điểm kiến trúc
  const handleCheckMission2 = () => {
    heritageAudio.playClick();
    // Bảng đáp án chuẩn
    const correctPairs: Record<string, string> = {
      'Cốn mê chạm rồng kênh bong': 'dinh-phuong-do',
      'Cửa bức bàn tháo lắp linh hoạt': 'chua-ho-lenh',
      'Mái ngói mũi hài uốn cong': 'chua-ha',
      'Làng nghề tương nếp truyền thống': 'chua-uc-ky',
      'Đầu bẩy chạm rồng ngậm ngọc': 'dinh-xuan-la',
    };

    let correctCount = 0;
    Object.keys(correctPairs).forEach((feature) => {
      if (matchingAnswers[feature] === correctPairs[feature]) {
        correctCount++;
      }
    });

    if (correctCount === Object.keys(correctPairs).length) {
      setMission2Completed(true);
      setMission2ResultMsg('Xuất sắc! Em đã ghép đúng toàn bộ 5/5 đặc điểm kiến trúc di tích.');
      heritageAudio.playFanfare();
      if (onAddPoints) {
        onAddPoints(25, 'Hoàn thành nhiệm vụ: Ghép tên & Đặc điểm kiến trúc 5 di tích Phú Bình');
      }
    } else {
      setMission2ResultMsg(`Em đã ghép đúng ${correctCount}/5 câu. Hãy đối chiếu lại để hoàn thành nhé!`);
    }
  };

  // 11. Chấm điểm nhiệm vụ 3: Giải mã địa hình sông Cầu
  const handleSelectMission3Answer = (optIdx: number) => {
    setMission3Answer(optIdx);
    if (optIdx === 1) { // Đáp án đúng
      setMission3Completed(true);
      heritageAudio.playFanfare();
      if (onAddPoints) {
        onAddPoints(15, 'Hoàn thành nhiệm vụ: Giải mã địa hình phù sa sông Cầu');
      }
    } else {
      heritageAudio.playClick();
    }
  };

  return (
    <div className="sandtable-outer-wrapper w-full rounded-3xl overflow-hidden border-2 border-amber-600/80 bg-[#120703] shadow-2xl relative text-amber-100 flex flex-col">
      {/* ==============================================================
          1. THANH TIÊU ĐỀ SA BÀN SỐ 3D DI SẢN (HEADER DIGITAL CONSOLE)
          ============================================================== */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#1f0d06] via-[#2c1308] to-[#1a0904] border-b-2 border-amber-600/70 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/50 flex items-center justify-center shadow-inner">
            <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '24s' }} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/80 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                SA BÀN SỐ 3D DI SẢN
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {verifiedSites.length}/5 di tích xác minh thực địa
              </span>
            </div>
            <h3 className="font-serif font-black text-base sm:text-xl text-amber-100 drop-shadow-sm">
              Sa Bàn Số Tương Tác Di Tích Kiến Trúc • Huyện Phú Bình
            </h3>
          </div>
        </div>

        {/* Thanh chọn chế độ GIÁO VIÊN / HỌC SINH & Các nút điều khiển nhanh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bộ chuyển đổi Role: GIÁO VIÊN vs HỌC SINH */}
          <div className="flex items-center p-1 bg-stone-950 rounded-2xl border-2 border-amber-600/60 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setUserRole('teacher');
                setActiveConsoleTab('site');
                heritageAudio.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                userRole === 'teacher'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 font-black shadow-md'
                  : 'text-amber-300/70 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>NHÓM HỌC SINH QUẢN LÝ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUserRole('student');
                setActiveConsoleTab('mission');
                heritageAudio.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                userRole === 'student'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 font-black shadow-md ring-1 ring-amber-400'
                  : 'text-amber-300/70 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>HỌC SINH (NHIỆM VỤ)</span>
            </button>
          </div>

          {/* Công tắc Bật/Tắt Lưới Số Hologram (Spatial Grid) */}
          <button
            type="button"
            onClick={() => {
              setShowHologramGrid(!showHologramGrid);
              heritageAudio.playClick();
            }}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showHologramGrid
                ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-md'
                : 'bg-stone-900 text-stone-400 border-stone-800'
            }`}
            title="Bật/Tắt lưới số không gian Hologram"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden md:inline">Lưới Số 3D</span>
          </button>

          {/* Nút Thuyết Minh Âm Thanh */}
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-emerald-900 text-emerald-200 border-emerald-500 shadow-md animate-pulse'
                : 'bg-stone-900 text-amber-300 border-amber-800/80 hover:bg-stone-800'
            }`}
            title="Bật/Tắt giọng đọc thuyết minh tự động"
          >
            {isSpeaking ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{isSpeaking ? 'Đang đọc...' : 'Thuyết minh'}</span>
          </button>

          {/* Nút Xoay Sa Bàn Tự Động (Orbit) */}
          <button
            type="button"
            onClick={toggleAutoOrbit}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              isOrbiting
                ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-md font-bold'
                : 'bg-stone-900 text-amber-300 border-amber-800/80 hover:bg-stone-800'
            }`}
            title="Bật/Tắt xoay vòng sa bàn tự động"
          >
            <RotateCcw className={`w-4 h-4 ${isOrbiting ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="hidden lg:inline">{isOrbiting ? 'Đang xoay' : 'Xoay tự động'}</span>
          </button>

          {/* Nút Toàn màn hình */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-800/80 transition-colors cursor-pointer"
            title="Toàn màn hình sa bàn"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ==============================================================
          2. VÙNG TRUNG TÂM: SA BÀN 3D LỚN BÊN TRÁI & BẢNG THÔNG TIN BÊN PHẢI
          ============================================================== */}
      <div className="flex flex-col lg:flex-row w-full bg-stone-950 border-b-2 border-amber-700/60 relative">
        {/* VÙNG SA BÀN 3D LỚN BÊN TRÁI (~68% WIDTH TRÊN DESKTOP) */}
        <div className="relative flex-1 h-[520px] sm:h-[580px] lg:h-[660px] bg-stone-950 overflow-hidden">
          <WebcamGestureControl mapRef={mapInstanceRef} sites={sites} onPickSite={handleSelectSiteOnMap}
            onGestureStart={() => { if (orbitAnimRef.current !== null) { cancelAnimationFrame(orbitAnimRef.current); orbitAnimRef.current = null; } setIsOrbiting(false); }} />
          {/* Canvas WebGL MapLibre */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Lớp phủ Lưới Không Gian Số Hologram (Có công tắc bật/tắt, không che khuất địa hình) */}
          {showHologramGrid && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden border border-amber-500/30">
              {/* Lưới tọa độ vàng mờ nhạt */}
              <div
                className="w-full h-full opacity-15"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(245, 158, 11, 0.4) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(245, 158, 11, 0.4) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px',
                }}
              />

              {/* 4 Khung góc số hóa phong cách Sa bàn Điện Biên Phủ */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-400" />

              {/* Vòng phương vị la bàn số & Thông số tọa độ */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-stone-950/80 backdrop-blur-md border border-amber-500/50 rounded-full text-[10px] font-mono text-amber-300 flex items-center gap-3">
                <span>VÙNG KHÔNG GIAN 3D: HUYỆN PHÚ BÌNH • THÁI NGUYÊN</span>
                <span className="text-emerald-400">DEM 3D: HOẠT ĐỘNG</span>
                <span className="text-amber-400">WGS84</span>
              </div>
            </div>
          )}

          {/* Cảnh báo di tích cần bổ sung tọa độ trong CMS (Nếu có di tích chưa xác minh, tuyệt đối không tạo tọa độ giả) */}
          {unverifiedSites.length > 0 && (
            <div className="absolute top-4 left-4 z-20 max-w-xs sm:max-w-sm p-3 bg-amber-950/95 backdrop-blur-md border border-amber-500 rounded-2xl text-amber-200 text-xs shadow-2xl space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Di tích cần bổ sung tọa độ trong CMS:</span>
              </div>
              <p className="text-[11px] text-amber-200/90 font-medium">
                {unverifiedSites.map((s) => s.name).join(', ')}
              </p>
              <p className="text-[10px] text-amber-400/80 italic">
                * Dự án tuân thủ nghiêm ngặt nguyên tắc bảo tồn di sản, không tạo tọa độ giả lập.
              </p>
            </div>
          )}

          {/* ==============================================================
              BỘ ĐIỀU KHIỂN NỔI ĐẦY ĐỦ TRÊN BẢN ĐỒ (FLOATING CONTROL CONSOLE)
              Bao gồm: TOÀN CẢNH 5 DI TÍCH, TỪ TRÊN CAO, XOAY, NGHIÊNG,
              PHÓNG TO, THU NHỎ, ĐẶT LẠI GÓC NHÌN (Tất cả hoạt động thật)
              ============================================================== */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 max-w-[210px]">
            {/* 1. NÚT TOÀN CẢNH 5 DI TÍCH (Bounding Box tự động ôm trọn cả 5 điểm) */}
            <button
              type="button"
              onClick={() => handleFitAll5Sites(false)}
              className="w-full px-3 py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-2xl border-2 border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              title="Khung nhìn bao trọn toàn bộ 5 di tích Phú Bình trên cùng 1 sa bàn"
            >
              <Globe className="w-4 h-4 text-stone-950 shrink-0" />
              <span>TOÀN CẢNH 5 DI TÍCH</span>
            </button>

            {/* 2. NÚT TỪ TRÊN CAO (Góc nhìn bình đồ thẳng đứng 0°) */}
            <button
              type="button"
              onClick={handleOrthoView}
              className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 shadow-xl transition-all cursor-pointer ${
                activeViewpointId === 'ortho'
                  ? 'bg-amber-950 text-amber-200 border-amber-400 ring-2 ring-amber-400/60'
                  : 'bg-stone-950/90 hover:bg-stone-850 text-amber-200 border-amber-700/80'
              }`}
              title="Góc nhìn thẳng đứng 0° dạng bình đồ bản đồ bao trọn 5 điểm"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>TỪ TRÊN CAO</span>
            </button>

            {/* 3. NÚT NGHIÊNG (Chuyển đổi góc nghiêng 3D 60° và 2D 0°) */}
            <button
              type="button"
              onClick={handleTogglePitch}
              className={`w-full px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xl transition-all cursor-pointer ${
                is3DMode
                  ? 'bg-amber-950/90 text-amber-200 border-amber-500'
                  : 'bg-stone-950/90 text-stone-300 border-stone-750'
              }`}
              title="Chuyển đổi góc nghiêng 3D (60°) và 2D (0°)"
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>NGHIÊNG:</span>
              </span>
              <span className="font-mono font-bold text-amber-300 text-[11px]">
                {is3DMode ? '3D 60°' : '2D 0°'}
              </span>
            </button>

            {/* 4. CỤM NÚT XOAY (Xoay trái, Xoay phải & Xoay 360° tự động) */}
            <div className="bg-stone-950/90 backdrop-blur-md rounded-xl border border-amber-700/80 shadow-2xl p-1 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => handleRotateBearing(-45)}
                className="flex-1 py-1 px-1.5 text-amber-300 hover:bg-stone-850 hover:text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors text-center"
                title="Xoay trái 45°"
              >
                ↺ Trái
              </button>
              <button
                type="button"
                onClick={() => handleRotateBearing(45)}
                className="flex-1 py-1 px-1.5 text-amber-300 hover:bg-stone-850 hover:text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors text-center border-x border-amber-900/50"
                title="Xoay phải 45°"
              >
                ↻ Phải
              </button>
              <button
                type="button"
                onClick={toggleAutoOrbit}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors text-center ${
                  isOrbiting
                    ? 'bg-amber-600 text-stone-950 shadow-md animate-pulse'
                    : 'text-amber-400 hover:bg-stone-850'
                }`}
                title="Bật/Tắt xoay vòng 360° tự động"
              >
                {isOrbiting ? 'Dừng' : '360°'}
              </button>
            </div>

            {/* 5. CỤM NÚT PHÓNG TO & THU NHỎ */}
            <div className="flex bg-stone-950/90 backdrop-blur-md rounded-xl border border-amber-700/80 shadow-2xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => handleZoom(1)}
                className="flex-1 py-1.5 px-2 text-amber-200 hover:bg-stone-850 hover:text-white font-bold cursor-pointer border-r border-amber-900/50 flex items-center justify-center gap-1 transition-colors"
                title="Phóng to sa bàn 3D"
              >
                <span>+</span>
                <span>PHÓNG TO</span>
              </button>
              <button
                type="button"
                onClick={() => handleZoom(-1)}
                className="flex-1 py-1.5 px-2 text-amber-200 hover:bg-stone-850 hover:text-white font-bold cursor-pointer flex items-center justify-center gap-1 transition-colors"
                title="Thu nhỏ sa bàn 3D"
              >
                <span>−</span>
                <span>THU NHỎ</span>
              </button>
            </div>

            {/* 6. NÚT ĐẶT LẠI GÓC NHÌN */}
            <button
              type="button"
              onClick={handleResetCamera}
              className="w-full px-3 py-1.5 bg-stone-950/90 hover:bg-stone-850 text-amber-300 hover:text-white border border-amber-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xl transition-colors cursor-pointer"
              title="Đặt lại góc nhìn bao quát toàn bộ 5 di tích"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>ĐẶT LẠI GÓC NHÌN</span>
            </button>

            {/* 7. LỚP NỀN: VỆ TINH VS BẢN ĐỒ GIAO THÔNG */}
            <div className="flex p-0.5 bg-stone-950/90 backdrop-blur-md rounded-xl border border-amber-700/80 text-[11px] font-semibold mt-0.5">
              <button
                type="button"
                onClick={() => handleToggleMapMode('satellite')}
                className={`flex-1 py-1 px-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeMapMode === 'satellite'
                    ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                    : 'text-amber-300 hover:text-white'
                }`}
              >
                <Globe className="w-3 h-3 shrink-0" />
                <span>Vệ Tinh</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleMapMode('topo')}
                className={`flex-1 py-1 px-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeMapMode === 'topo'
                    ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                    : 'text-amber-300 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 shrink-0" />
                <span>Giao Thông</span>
              </button>
            </div>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-30 bg-[#120703]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center animate-spin">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-lg text-amber-200">
                Đang nạp Sa Bàn Số 3D Địa Hình Phú Bình...
              </h4>
              <p className="text-xs text-amber-300/80 max-w-md">
                Tải lưới độ cao số thực tế DEM Terrarium và ảnh vệ tinh khu vực huyện Phú Bình, tỉnh Thái Nguyên.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {loadError && (
            <div className="absolute top-4 left-4 right-4 z-40 p-4 bg-red-950/95 border-2 border-red-600 rounded-2xl text-red-200 text-xs shadow-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-red-100">Thông báo cấu hình bản đồ 3D:</p>
                <p>{loadError}</p>
              </div>
            </div>
          )}

          {/* Banner hướng dẫn thao tác góc dưới */}
          <div className="absolute bottom-4 left-16 z-20 pointer-events-none hidden md:block">
            <div className="p-2.5 bg-stone-950/85 backdrop-blur-md border border-amber-800/70 rounded-2xl text-[11px] text-amber-200/90 space-y-0.5 shadow-xl">
              <p className="font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Thao tác sa bàn: Chuột trái: Kéo rê • Chuột phải / Ctrl: Nghiêng & Xoay 3D • Cuộn: Zoom</span>
              </p>
            </div>
          </div>
        </div>

        {/* ==============================================================
            BẢNG THÔNG TIN SA BÀN BÊN PHẢI (~32% WIDTH TRÊN DESKTOP)
            BAO GỒM 3 TAB: DI TÍCH, NHIỆM VỤ, NGUỒN TƯ LIỆU
            ============================================================== */}
        <div className="w-full lg:w-[380px] xl:w-[420px] bg-[#1a0c06] border-t lg:border-t-0 lg:border-l-2 border-amber-700/60 flex flex-col justify-between">
          {/* Header 3 Tabs của Console */}
          <div className="flex border-b border-amber-800/60 bg-[#230f07]">
            <button
              type="button"
              onClick={() => {
                setActiveConsoleTab('site');
                heritageAudio.playClick();
              }}
              className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeConsoleTab === 'site'
                  ? 'border-amber-400 text-amber-200 bg-amber-950/50 shadow-inner'
                  : 'border-transparent text-amber-400/60 hover:text-amber-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>DI TÍCH</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveConsoleTab('mission');
                heritageAudio.playClick();
              }}
              className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeConsoleTab === 'mission'
                  ? 'border-amber-400 text-amber-200 bg-amber-950/50 shadow-inner'
                  : 'border-transparent text-amber-400/60 hover:text-amber-200'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>NHIỆM VỤ</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveConsoleTab('sources');
                heritageAudio.playClick();
              }}
              className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeConsoleTab === 'sources'
                  ? 'border-amber-400 text-amber-200 bg-amber-950/50 shadow-inner'
                  : 'border-transparent text-amber-400/60 hover:text-amber-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>NGUỒN TƯ LIỆU</span>
            </button>
          </div>

          {/* NỘI DUNG CHÍNH CỦA BẢNG CONSOLE BÊN PHẢI */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[580px] space-y-4 text-xs">
            {/* TAB 1: THÔNG TIN DI TÍCH ĐƯỢC CHỌN */}
            {activeConsoleTab === 'site' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {selectedSite ? (
                  <>
                    {/* Ảnh di tích với khung trang trí */}
                    <div className="relative h-44 rounded-2xl overflow-hidden border-2 border-amber-700/60 bg-black shadow-lg">
                      <img
                        src={selectedSite.coverImage}
                        alt={selectedSite.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#140602] via-transparent to-black/30" />

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 bg-amber-950/90 text-amber-200 text-[10px] font-bold rounded-full border border-amber-600">
                          {selectedSite.type}
                        </span>
                        {selectedSite.coordinates?.isVerified && (
                          <span className="px-2 py-0.5 bg-emerald-950/90 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            GPS Đã Xác Minh
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2 left-3 right-3">
                        <h4 className="font-serif font-black text-lg text-amber-100 drop-shadow-md">
                          {selectedSite.name}
                        </h4>
                        <p className="text-[11px] text-amber-300/90 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{selectedSite.locality}</span>
                        </p>
                      </div>
                    </div>

                    {/* Tọa độ thực địa & Cao độ */}
                    {selectedSite.coordinates && (
                      <div className="p-3 bg-stone-900/90 rounded-xl border border-amber-900/70 text-[11px] font-mono space-y-1">
                        <div className="flex justify-between text-amber-200">
                          <span>Vị trí GPS thực tế:</span>
                          <span className="text-emerald-400 font-bold">
                            {selectedSite.coordinates.lat?.toFixed(5)}°N, {selectedSite.coordinates.lng?.toFixed(5)}°E
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-400">
                          <span>Cao độ địa hình:</span>
                          <span className="text-amber-300">{selectedSite.coordinates.altitudeMeters || 28} mét</span>
                        </div>
                        {selectedSite.coordinates.notes && (
                          <p className="text-[10px] text-stone-400 font-sans italic pt-0.5 border-t border-stone-800">
                            Mốc địa bạ: {selectedSite.coordinates.notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tóm tắt lịch sử & kiến trúc */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                        Đặc điểm kiến trúc & Lịch sử:
                      </span>
                      <p className="text-amber-100/90 leading-relaxed text-xs">
                        {selectedSite.shortSummary}
                      </p>
                      {selectedSite.architectureOverview && (
                        <div className="p-2.5 bg-amber-950/30 rounded-xl border border-amber-900/40 text-stone-300 text-[11px] leading-relaxed">
                          <strong>Cấu kiện nổi bật:</strong> {selectedSite.architectureOverview}
                        </div>
                      )}
                    </div>

                    {/* Thuyết minh âm thanh có nút đọc */}
                    <div className="p-3 bg-stone-900/90 rounded-xl border border-amber-800/60 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-amber-200 block">Thuyết minh di tích</span>
                        <span className="text-[10px] text-amber-300/70">
                          {isSpeaking ? 'Đang phát lời giảng...' : 'Nhấn để nghe bài giới thiệu'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleSpeech}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer ${
                          isSpeaking
                            ? 'bg-red-700 text-white animate-pulse'
                            : 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                        }`}
                      >
                        {isSpeaking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isSpeaking ? 'Dừng đọc' : 'Nghe đọc'}</span>
                      </button>
                    </div>

                    {/* Hai nút hành động: KHÁM PHÁ DI TÍCH và THAM QUAN VR360 */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          heritageAudio.playTempleBell();
                          onSelectSite(selectedSite.id);
                        }}
                        className="flex-1 py-2.5 px-3 bg-gradient-to-r from-red-800 via-amber-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-serif font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 border border-amber-500/40 cursor-pointer"
                      >
                        <span>KHÁM PHÁ DI TÍCH</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                      </button>

                      {(selectedSite.externalTourUrl || selectedSite.scenes360.length > 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            heritageAudio.playClick();
                            if (onOpenVirtualTour) {
                              onOpenVirtualTour(selectedSite.id);
                            } else {
                              onSelectSite(selectedSite.id);
                            }
                          }}
                          className="py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl border border-amber-600/80 flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                          title="Mở tour thực tế ảo 360°"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>VR360</span>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-amber-300/80 italic text-center py-8">
                    Chọn một điểm di tích trên sa bàn hoặc danh sách bên dưới để xem thông tin.
                  </p>
                )}
              </div>
            )}

            {/* TAB 2: NHIỆM VỤ HỌC TẬP TƯƠNG TÁC (CHẾ ĐỘ HỌC SINH) */}
            {activeConsoleTab === 'mission' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Banner điểm thưởng học tập */}
                <div className="p-3 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border border-amber-500/60 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400">NHIỆM VỤ SA BÀN SỐ</span>
                    <h5 className="font-serif font-bold text-sm text-amber-100">Thử Thách Tìm Vị Trí & Kiến Trúc</h5>
                  </div>
                  <div className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-mono font-bold text-xs rounded-xl border border-amber-400">
                    +60 Điểm
                  </div>
                </div>

                {/* NHIỆM VỤ 1: ĐỊNH VỊ DI TÍCH TRÊN SA BÀN 3D */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  mission1Completed
                    ? 'bg-emerald-950/60 border-emerald-500/80'
                    : 'bg-stone-900/80 border-amber-700/60'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-amber-200">
                      Nhiệm vụ 1: Định vị di tích trên bản đồ 3D
                    </span>
                    {mission1Completed ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900 text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Hoàn thành (+20đ)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300">
                        Chưa làm (+20đ)
                      </span>
                    )}
                  </div>

                  <p className="text-stone-300 mt-1.5 leading-relaxed text-[11px]">
                    👉 Yêu cầu: Hãy quan sát bản đồ sa bàn 3D và <strong>nhấp vào vị trí Đình Phương Độ</strong> (ngôi đình nổi tiếng với kho tàng điêu khắc rồng thời Hậu Lê tại xã Xuân Phương).
                  </p>

                  {!mission1Completed && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = sites.find((s) => s.id === 'dinh-phuong-do');
                        if (target) handleSelectSiteOnMap(target);
                      }}
                      className="mt-2.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Nhấp để tìm điểm Đình Phương Độ</span>
                    </button>
                  )}
                </div>

                {/* NHIỆM VỤ 2: GHÉP TÊN & ĐẶC ĐIỂM KIẾN TRÚC */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  mission2Completed
                    ? 'bg-emerald-950/60 border-emerald-500/80'
                    : 'bg-stone-900/80 border-amber-700/60'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-amber-200">
                      Nhiệm vụ 2: Ghép tên & Đặc điểm kiến trúc
                    </span>
                    {mission2Completed ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900 text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Hoàn thành (+25đ)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300">
                        Chưa làm (+25đ)
                      </span>
                    )}
                  </div>

                  <p className="text-stone-300 mt-1.5 text-[11px]">
                    Chọn đúng di tích tương ứng với từng chi tiết kiến trúc độc đáo:
                  </p>

                  <div className="space-y-2 mt-2">
                    {[
                      { feature: 'Cốn mê chạm rồng kênh bong', target: 'dinh-phuong-do' },
                      { feature: 'Cửa bức bàn tháo lắp linh hoạt', target: 'chua-ho-lenh' },
                      { feature: 'Mái ngói mũi hài uốn cong', target: 'chua-ha' },
                      { feature: 'Làng nghề tương nếp truyền thống', target: 'chua-uc-ky' },
                      { feature: 'Đầu bẩy chạm rồng ngậm ngọc', target: 'dinh-xuan-la' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-2 bg-stone-950 rounded-xl border border-stone-800 space-y-1">
                        <span className="font-semibold text-amber-300 block text-[11px]">
                          • {item.feature}:
                        </span>
                        <select
                          value={matchingAnswers[item.feature] || ''}
                          disabled={mission2Completed}
                          onChange={(e) =>
                            setMatchingAnswers({ ...matchingAnswers, [item.feature]: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-stone-900 border border-amber-800 rounded-lg text-xs text-amber-100"
                        >
                          <option value="">-- Chọn di tích tương ứng --</option>
                          <option value="chua-ha">Chùa Ha (Xã Nhã Lộng)</option>
                          <option value="chua-ho-lenh">Đình Hộ Lệnh (Xã Điềm Thụy)</option>
                          <option value="dinh-phuong-do">Đình Phương Độ (Xã Xuân Phương)</option>
                          <option value="dinh-xuan-la">Đình Xuân La (Xã Thanh Ninh)</option>
                          <option value="chua-uc-ky">Chùa Úc Kỳ (Xã Úc Kỳ)</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  {!mission2Completed && (
                    <button
                      type="button"
                      onClick={handleCheckMission2}
                      className="mt-3 w-full py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
                    >
                      Kiểm tra kết quả ghép nối
                    </button>
                  )}

                  {mission2ResultMsg && (
                    <p className={`mt-2 text-xs font-semibold ${mission2Completed ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {mission2ResultMsg}
                    </p>
                  )}
                </div>

                {/* NHIỆM VỤ 3: GIẢI MÃ ĐỊA HÌNH SÔNG CẦU */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  mission3Completed
                    ? 'bg-emerald-950/60 border-emerald-500/80'
                    : 'bg-stone-900/80 border-amber-700/60'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-amber-200">
                      Nhiệm vụ 3: Địa thế vùng đất Phú Bình
                    </span>
                    {mission3Completed ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900 text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Hoàn thành (+15đ)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300">
                        Chưa làm (+15đ)
                      </span>
                    )}
                  </div>

                  <p className="text-stone-300 mt-1.5 text-[11px] leading-relaxed">
                    Dòng sông nào chảy qua huyện Phú Bình bồi đắp phù sa màu mỡ và là tuyến giao thương đường thủy của các di tích cổ xưa?
                  </p>

                  <div className="space-y-1.5 mt-2">
                    {['Sông Đà', 'Sông Cầu', 'Sông Mã', 'Sông Hương'].map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                          mission3Answer === optIdx
                            ? optIdx === 1
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                              : 'bg-red-950 border-red-500 text-red-300'
                            : 'bg-stone-950/80 border-stone-800 text-amber-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="mission3"
                          disabled={mission3Completed}
                          checked={mission3Answer === optIdx}
                          onChange={() => handleSelectMission3Answer(optIdx)}
                          className="accent-amber-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NGUỒN TƯ LIỆU & HỒ SƠ KHOA HỌC */}
            {activeConsoleTab === 'sources' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-3 bg-amber-950/40 border border-amber-600/60 rounded-2xl space-y-1">
                  <h5 className="font-serif font-bold text-sm text-amber-200 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Nguồn Tư Liệu Khảo Cứu & Trích Dẫn</span>
                  </h5>
                  <p className="text-[11px] text-amber-300/80">
                    Toàn bộ tư liệu được đối soát từ hồ sơ di tích chính thống của ngành Văn hóa tỉnh Thái Nguyên.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-stone-900/80 rounded-xl border border-amber-900/60 space-y-1">
                    <span className="font-bold text-amber-300 block text-xs">• Hồ sơ khoa học xếp hạng di tích:</span>
                    <p className="text-stone-300 text-[11px] leading-relaxed">
                      - Hồ sơ Di tích Kiến trúc Nghệ thuật cấp Quốc gia Đình Phương Độ (Bộ Văn hóa - Thông tin công nhận).<br />
                      - Hồ sơ tư liệu di tích lịch sử Đình Hộ Lệnh, Chùa Ha, Đình Xuân La, Chùa Úc Kỳ thuộc Phòng Văn hóa - Thông tin huyện Phú Bình và Sở VHTTDL tỉnh Thái Nguyên.
                    </p>
                  </div>

                  <div className="p-3 bg-stone-900/80 rounded-xl border border-amber-900/60 space-y-1">
                    <span className="font-bold text-amber-300 block text-xs">• Văn bia Hán Nôm & Thư tịch cổ:</span>
                    <p className="text-stone-300 text-[11px] leading-relaxed">
                      - Hệ thống văn bia niên hiệu Cảnh Hưng thời Hậu Lê tại Đình Phương Độ.<br />
                      - Các hoành phi, câu đối sơn then thếp vàng và văn khắc trên cột gỗ lim lưu giữ tại 5 di tích.
                    </p>
                  </div>

                  <div className="p-3 bg-stone-900/80 rounded-xl border border-amber-900/60 space-y-1">
                    <span className="font-bold text-amber-300 block text-xs">• Công nghệ bản đồ 3D & Nguồn DEM:</span>
                    <p className="text-stone-300 text-[11px] leading-relaxed">
                      - <strong>Lưới độ cao số 3D (DEM):</strong> AWS Mapzen Terrarium Elevation Tiles (Hợp chuẩn nguồn mở ODbL).<br />
                      - <strong>Ảnh vệ tinh thực tế:</strong> Esri World Imagery (Độ phân giải thực tế mặt đất).<br />
                      - <strong>Hệ quy chiếu tọa độ:</strong> WGS84 chuẩn GPS toàn cầu.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-600/70 text-[11px] text-emerald-300 space-y-1">
                    <strong className="flex items-center gap-1 text-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Cam kết bảo tồn & Không bịa tọa độ:
                    </strong>
                    <p className="leading-relaxed">
                      Dự án DI SẢN QUÊ EM cam kết đặt điểm di tích theo đúng tọa độ hành chính xác minh của địa phương. Tuyệt đối không sử dụng tọa độ giả lập hay bản đồ ngẫu nhiên.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer nhỏ của bảng Console */}
          <div className="p-3 bg-[#170803] border-t border-amber-900/60 text-[10px] text-amber-300/70 flex items-center justify-between">
            <span>DI SẢN QUÊ EM • SA BÀN SỐ</span>
            <span>Huyện Phú Bình, Thái Nguyên</span>
          </div>
        </div>
      </div>

      {/* ==============================================================
          3. THANH ĐIỀU KHIỂN GÓC NHÌN BÊN DƯỚI (CAMERA VIEWPOINTS TOOLBAR)
          Có Toàn cảnh, Từ trên cao và góc nhìn đến từng di tích
          ============================================================== */}
      <div className="p-3 sm:p-4 bg-[#1e0d06] border-t-2 border-amber-600/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Thanh điều khiển góc nhìn sa bàn số (Camera Viewpoints):</span>
          </span>
          <span className="text-[10px] text-amber-400/80">
            Nhấn để camera tự động bay mượt đến góc nhìn tương ứng
          </span>
        </div>

        {/* Danh sách các nút góc nhìn: Toàn cảnh, Từ trên cao, Chùa Ha, Đình Hộ Lệnh, Đình Phương Độ, Đình Xuân La, Chùa Úc Kỳ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {PRESET_VIEWPOINTS.map((vp) => {
            const isActive = activeViewpointId === vp.id;
            return (
              <button
                key={vp.id}
                type="button"
                onClick={() => handleApplyViewpoint(vp)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-md ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 ring-2 ring-amber-300 shadow-amber-500/20 scale-105'
                    : 'bg-stone-900/90 hover:bg-stone-800 text-amber-200 border border-amber-800/70 hover:border-amber-500'
                }`}
                title={vp.subtitle}
              >
                <span>
                  {vp.id === 'overview'
                    ? '🌐'
                    : vp.id === 'ortho'
                    ? '🧭'
                    : sites.find((s) => s.id === vp.siteId)?.type === 'Chùa'
                    ? '⛩️'
                    : '🏛️'}
                </span>
                <span>{vp.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
