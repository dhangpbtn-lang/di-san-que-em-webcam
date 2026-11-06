/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HeritageSite, Hotspot } from '../../types/heritage';
import { PanoramaViewer } from './PanoramaViewer';
import { NetlifyTourViewer } from './NetlifyTourViewer';
import { ArtDecoderModal } from '../decoder/ArtDecoderModal';
import { AudioPlayerBar } from '../audio/AudioPlayerBar';
import { heritageAudio } from '../../utils/audioSystem';
import {
  Compass,
  MapPin,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Volume2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  ExternalLink
} from 'lucide-react';

interface VirtualTourPageProps {
  sites: HeritageSite[];
  selectedSiteId: string;
  onSelectSiteId: (siteId: string) => void;
  onUpdateSiteScenes: (siteId: string, updatedScenes: HeritageSite['scenes360']) => void;
  onRecordHotspotDecoded: (hotspotId: string) => void;
  onViewSiteDetail: (siteId: string) => void;
}

export const VirtualTourPage: React.FC<VirtualTourPageProps> = ({
  sites,
  selectedSiteId,
  onSelectSiteId,
  onUpdateSiteScenes,
  onRecordHotspotDecoded,
  onViewSiteDetail,
}) => {
  const currentSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  // Active 360 scene within current site (for procedural/custom panorama)
  const [currentSceneId, setCurrentSceneId] = useState<string>(currentSite.scenes360[0]?.id || '');
  const activeScene =
    currentSite.scenes360.find((s) => s.id === currentSceneId) || currentSite.scenes360[0];

  // Selected hotspot for modal
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // All hotspots across scenes in this site
  const allHotspots = currentSite.scenes360.flatMap((sc) => sc.hotspots);

  // Teacher Handlers: Add Hotspot, Add Transition, Add 360 Scene
  const handleAddHotspot = (newHs: Hotspot) => {
    const updatedScenes = currentSite.scenes360.map((sc) => {
      if (sc.id === activeScene.id) {
        return {
          ...sc,
          hotspots: [...sc.hotspots, newHs],
        };
      }
      return sc;
    });
    onUpdateSiteScenes(currentSite.id, updatedScenes);
  };

  const handleAddSceneTransition = (transition: {
    targetSceneId: string;
    title: string;
    yaw: number;
    pitch: number;
  }) => {
    const updatedScenes = currentSite.scenes360.map((sc) => {
      if (sc.id === activeScene.id) {
        const existing = sc.sceneTransitions || [];
        return {
          ...sc,
          sceneTransitions: [...existing, transition],
        };
      }
      return sc;
    });
    onUpdateSiteScenes(currentSite.id, updatedScenes);
  };

  const handleAddNewScene360 = (name: string, imageUrl: string) => {
    const newSceneId = `scene-${Date.now()}`;
    const newScene = {
      id: newSceneId,
      name,
      imageUrl,
      initialYaw: 0,
      initialPitch: 0,
      hotspots: [],
      sceneTransitions: [
        {
          targetSceneId: activeScene.id,
          title: `Quay lại ${activeScene.name}`,
          yaw: 180,
          pitch: -5,
        },
      ],
    };
    const updatedScenes = [...currentSite.scenes360, newScene];
    onUpdateSiteScenes(currentSite.id, updatedScenes);
    setCurrentSceneId(newSceneId);
  };

  return (
    <div className="w-full space-y-6 text-amber-100">
      {/* 1. TOP BAR: 5 HERITAGE SITES SELECTION TABS */}
      <div className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-[#281108] via-[#35160b] to-[#1c0a04] border-2 border-amber-700/60 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
                KHÔNG GIAN THỰC TẾ ẢO 360° ĐỘC LẬP
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-black text-amber-100 mt-0.5">
              Tham Quan 360° Từng Di Tích Lịch Sử
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {currentSite.isRankingVerified ? (
              <span className="px-3 py-1 bg-emerald-950 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-600 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentSite.rankingStatus}</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-950 text-amber-300 text-xs font-medium rounded-full border border-amber-600 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentSite.rankingStatus}</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => onViewSiteDetail(currentSite.id)}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-semibold rounded-xl border border-amber-700/60 shadow-sm flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Xem trang tư liệu đầy đủ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5 Distinct Sites Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
          {sites.map((site) => {
            const isSelected = site.id === currentSite.id;
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => {
                  heritageAudio.playTempleBell();
                  onSelectSiteId(site.id);
                  setCurrentSceneId(site.scenes360[0]?.id || '');
                }}
                className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-br from-red-800 via-amber-800 to-amber-700 text-white border-amber-300 shadow-xl scale-102 ring-2 ring-amber-400/50'
                    : 'bg-stone-900/80 hover:bg-stone-800 text-amber-200 border-amber-900/60 hover:border-amber-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-amber-300">
                    {site.type}
                  </span>
                  {site.externalTourUrl ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/60">
                      Live 360°
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-300/80 font-mono">
                      {site.scenes360.length} góc nhìn
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-serif font-black text-xs md:text-sm line-clamp-1">
                    {site.name}
                  </h4>
                  <p className="text-[10px] text-amber-200/80 line-clamp-1 mt-0.5">
                    {site.locality}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. AUDIO TOUR PLAYER FOR CURRENT SITE */}
      <AudioPlayerBar
        title={currentSite.audioGuide.title}
        transcript={currentSite.audioGuide.transcript}
        fileUrl={currentSite.audioGuide.fileUrl}
        durationText={currentSite.audioGuide.duration || '2:30'}
      />

      {/* 3. MAIN 360 VIEWER STAGE */}
      {currentSite.externalTourUrl ? (
        <div className="space-y-3">
          <NetlifyTourViewer
            tourUrl={currentSite.externalTourUrl}
            siteName={currentSite.name}
            subtitle="Khám phá toàn cảnh 360° với tour Marzipano trực tuyến độ phân giải cao"
            heightClass="h-[580px] md:h-[680px] lg:h-[750px]"
          />

          <div className="p-4 rounded-2xl bg-[#1e0e08]/90 border border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-200 shadow-md">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Bạn đang tham quan tour thực tế ảo 360° của <strong>{currentSite.name}</strong>. Kéo chuột để xoay 360°, phóng to/thu nhỏ, nhấp mũi tên chuyển cảnh.
              </span>
            </div>
            <a
              href={currentSite.externalTourUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở tour toàn màn hình</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="w-full h-[580px] md:h-[680px]">
          <PanoramaViewer
            scene={activeScene}
            allScenes={currentSite.scenes360}
            onSelectScene={(scId) => setCurrentSceneId(scId)}
            onSelectHotspot={(hs) => {
              setSelectedHotspot(hs);
              onRecordHotspotDecoded(hs.id);
            }}
            onAddHotspot={handleAddHotspot}
            onAddSceneTransition={handleAddSceneTransition}
            onAddNewScene360={handleAddNewScene360}
          />
        </div>
      )}

      {/* 4. ARCHITECTURAL DECODING CHECKLIST & QUICK ACCESS */}
      <div className="p-5 md:p-7 rounded-3xl bg-[#1e0e08]/90 border-2 border-amber-700/50 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-900/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-base md:text-lg text-amber-200">
              Điểm Giải Mã Kiến Trúc Của {currentSite.name} ({allHotspots.length})
            </h3>
          </div>
          <p className="text-xs text-amber-300/80">
            Học sinh có thể nhấp trực tiếp vào danh sách bên dưới để khám phá chi tiết kiến trúc nghệ thuật:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {allHotspots.map((hs) => (
            <div
              key={hs.id}
              onClick={() => {
                heritageAudio.playClick();
                setSelectedHotspot(hs);
                onRecordHotspotDecoded(hs.id);
              }}
              className="cursor-pointer group p-3.5 rounded-2xl bg-stone-900/80 hover:bg-stone-800 border border-amber-800/60 hover:border-amber-400 transition-all flex items-start gap-3 shadow-md"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-800 shrink-0 bg-stone-950">
                <img src={hs.detailedImage} alt={hs.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-amber-400 font-medium bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  {hs.architecturalPart}
                </span>
                <h4 className="font-serif font-bold text-sm text-amber-100 group-hover:text-amber-200 mt-1 line-clamp-1">
                  {hs.title}
                </h4>
                <p className="text-xs text-amber-300/70 line-clamp-2 mt-0.5">
                  {hs.explanation}
                </p>
              </div>
            </div>
          ))}

          {allHotspots.length === 0 && (
            <div className="col-span-3 text-center py-6 text-amber-300/70 text-xs">
              Chưa có điểm kiến trúc nào. Nhóm quản lý có thể cập nhật trong trang Quản trị hoặc chế độ biên soạn!
            </div>
          )}
        </div>
      </div>

      {/* Architectural Decoding Modal */}
      <ArtDecoderModal
        hotspot={selectedHotspot}
        allHotspots={allHotspots}
        onClose={() => setSelectedHotspot(null)}
        onNavigateHotspot={(hs) => setSelectedHotspot(hs)}
        onRecordDecoded={onRecordHotspotDecoded}
      />
    </div>
  );
};
