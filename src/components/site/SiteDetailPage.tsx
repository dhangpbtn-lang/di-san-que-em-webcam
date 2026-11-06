/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HeritageSite, Hotspot } from '../../types/heritage';
import { PanoramaViewer } from '../viewer360/PanoramaViewer';
import { NetlifyTourViewer } from '../viewer360/NetlifyTourViewer';
import { AudioPlayerBar } from '../audio/AudioPlayerBar';
import { ArtDecoderModal } from '../decoder/ArtDecoderModal';
import { heritageAudio } from '../../utils/audioSystem';
import { submitQuizAnswerToCloud } from '../../services/quizService';
import {
  ArrowLeft,
  Compass,
  MapPin,
  Calendar,
  Sparkles,
  Layers,
  BookOpen,
  Volume2,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Maximize2,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Info
} from 'lucide-react';

interface SiteDetailPageProps {
  site: HeritageSite;
  allSites: HeritageSite[];
  onBackToLibrary: () => void;
  onSelectSite: (siteId: string) => void;
  onRecordHotspotDecoded: (hotspotId: string) => void;
  onOpenVirtualTourMode: (siteId: string) => void;
  onUpdateSiteScenes?: (siteId: string, updatedScenes: HeritageSite['scenes360']) => void;
  onAddPoints?: (points: number) => void;
}

type SiteTab = 'all' | 'intro' | 'architecture' | 'tour360' | 'audio' | 'challenge';

export const SiteDetailPage: React.FC<SiteDetailPageProps> = ({
  site,
  allSites,
  onBackToLibrary,
  onSelectSite,
  onRecordHotspotDecoded,
  onOpenVirtualTourMode,
  onUpdateSiteScenes,
  onAddPoints,
}) => {
  // Navigation tabs: Giới thiệu, Kiến trúc nghệ thuật, Tham quan 360°, Thuyết minh, Thử thách
  // For Chùa Ha or when entering detail page, students can switch between tabs or view 'all'
  const [activeTab, setActiveTab] = useState<SiteTab>('all');

  // Selected 360 scene for procedural/custom viewer
  const [currentSceneId, setCurrentSceneId] = useState<string>(site.scenes360[0]?.id || '');
  const activeScene = site.scenes360.find((s) => s.id === currentSceneId) || site.scenes360[0];

  // Selected hotspot for decoding modal
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // All hotspots across all scenes in this site
  const allSiteHotspots = site.scenes360.flatMap((sc) => sc.hotspots);

  // Next site in line
  const currentIndex = allSites.findIndex((s) => s.id === site.id);
  const nextSite = allSites[(currentIndex + 1) % allSites.length];

  // Mini Challenge/Quiz state for this site (Được xác thực an toàn qua Cloud Function)
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isVerifyingQuiz, setIsVerifyingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    isCorrect: boolean;
    explanation: string;
    earnedPoints: number;
    alreadyAnswered?: boolean;
  } | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<number, boolean>>({});

  const currentQuestion = site.quizQuestions[quizIndex] || site.quizQuestions[0];

  const handleSelectQuizOption = (index: number) => {
    if (isAnswerSubmitted || isVerifyingQuiz) return;
    heritageAudio.playClick();
    setSelectedOption(index);
  };

  const handleSubmitQuizAnswer = async () => {
    if (selectedOption === null || isAnswerSubmitted || isVerifyingQuiz || !currentQuestion) return;
    setIsVerifyingQuiz(true);
    try {
      const result = await submitQuizAnswerToCloud(site.id, currentQuestion.id, selectedOption);
      setQuizResult(result);
      setIsAnswerSubmitted(true);
      if (result.isCorrect) {
        heritageAudio.playCorrect();
        if (result.earnedPoints > 0) {
          setUserScore((prev) => prev + result.earnedPoints);
          if (onAddPoints) onAddPoints(result.earnedPoints);
        }
        setAnsweredMap((prev) => ({ ...prev, [quizIndex]: true }));
      } else {
        heritageAudio.playClick();
        setAnsweredMap((prev) => ({ ...prev, [quizIndex]: false }));
      }
    } catch {
      setIsAnswerSubmitted(true);
      setQuizResult({
        isCorrect: false,
        explanation: 'Không thể kết nối máy chủ chấm điểm lúc này.',
        earnedPoints: 0,
        alreadyAnswered: false,
      });
    } finally {
      setIsVerifyingQuiz(false);
    }
  };

  const handleNextQuestion = () => {
    heritageAudio.playClick();
    if (quizIndex < site.quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setQuizResult(null);
    }
  };

  const handleResetQuiz = () => {
    heritageAudio.playClick();
    setQuizIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizResult(null);
    setUserScore(0);
    setAnsweredMap({});
  };

  // Handlers for teacher editing inside SiteDetailPage (for sites using procedural panorama)
  const handleAddHotspot = (newHs: Hotspot) => {
    if (!onUpdateSiteScenes) return;
    const updatedScenes = site.scenes360.map((sc) => {
      if (sc.id === activeScene.id) {
        return {
          ...sc,
          hotspots: [...sc.hotspots, newHs],
        };
      }
      return sc;
    });
    onUpdateSiteScenes(site.id, updatedScenes);
  };

  const handleAddSceneTransition = (transition: {
    targetSceneId: string;
    title: string;
    yaw: number;
    pitch: number;
  }) => {
    if (!onUpdateSiteScenes) return;
    const updatedScenes = site.scenes360.map((sc) => {
      if (sc.id === activeScene.id) {
        const existing = sc.sceneTransitions || [];
        return {
          ...sc,
          sceneTransitions: [...existing, transition],
        };
      }
      return sc;
    });
    onUpdateSiteScenes(site.id, updatedScenes);
  };

  const handleAddNewScene360 = (name: string, imageUrl: string) => {
    if (!onUpdateSiteScenes) return;
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
    const updatedScenes = [...site.scenes360, newScene];
    onUpdateSiteScenes(site.id, updatedScenes);
    setCurrentSceneId(newSceneId);
  };

  return (
    <div className="w-full space-y-8 text-amber-100">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-900/40">
        <button
          type="button"
          onClick={() => {
            heritageAudio.playClick();
            onBackToLibrary();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs md:text-sm font-semibold rounded-xl border border-amber-700/50 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Thư viện di tích</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-amber-300/80">
          <span className="cursor-pointer hover:underline" onClick={onBackToLibrary}>
            Thư viện
          </span>
          <span>/</span>
          <span className="text-amber-300 font-bold">{site.name}</span>
        </div>
      </div>

      {/* Hero Site Banner & Meta */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-amber-700/60 bg-gradient-to-r from-[#2c1208] via-[#3a180b] to-[#1a0904] p-6 md:p-10 shadow-2xl space-y-4">
        {/* Verification Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/40">
            {site.type} Cổ Truyền
          </span>

          {site.isRankingVerified ? (
            <span className="px-3 py-1 bg-emerald-950/90 text-emerald-300 text-xs font-bold rounded-full border border-emerald-600 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{site.rankingStatus}</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-950/90 text-amber-300 text-xs font-medium rounded-full border border-amber-600/70 flex items-center gap-1.5 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>{site.rankingStatus}</span>
            </span>
          )}

          <span className="px-3 py-1 bg-stone-900/90 text-amber-200 text-xs font-medium rounded-full border border-stone-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Niên đại: {site.period}</span>
          </span>

          {site.externalTourUrl && (
            <span className="px-3 py-1 bg-red-950/90 text-red-200 text-xs font-bold rounded-full border border-red-600/70 flex items-center gap-1.5 shadow-sm animate-pulse">
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span>Tour 360° Trực Tuyến Sẵn Sàng</span>
            </span>
          )}
        </div>

        {/* Site Title & Locality */}
        <div>
          <h1 className="text-3xl md:text-5xl font-serif font-black text-amber-100 tracking-tight">
            {site.name}
          </h1>
          <p className="text-xs md:text-sm text-amber-300 flex items-center gap-1.5 mt-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">{site.locality}</span>
          </p>
        </div>

        {/* Short Summary */}
        <p className="text-sm md:text-base text-amber-100/90 max-w-3xl leading-relaxed font-serif">
          {site.shortSummary}
        </p>
      </div>

      {/* 5 CHÍNH QUY NHẤT: BỘ ĐIỀU HƯỚNG 5 MỤC NỘI DUNG YÊU CẦU */}
      <div className="sticky top-2 z-20 p-1.5 rounded-2xl bg-[#1d0b05]/95 backdrop-blur-md border-2 border-amber-700/60 shadow-2xl flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          {/* Tab 1: Giới thiệu */}
          <button
            type="button"
            onClick={() => {
              heritageAudio.playClick();
              setActiveTab('intro');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'intro'
                ? 'bg-amber-600 text-white shadow-lg ring-1 ring-amber-300'
                : 'text-amber-200 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Giới thiệu</span>
          </button>

          {/* Tab 2: Kiến trúc nghệ thuật */}
          <button
            type="button"
            onClick={() => {
              heritageAudio.playClick();
              setActiveTab('architecture');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'architecture'
                ? 'bg-amber-600 text-white shadow-lg ring-1 ring-amber-300'
                : 'text-amber-200 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kiến trúc nghệ thuật</span>
          </button>

          {/* Tab 3: Tham quan 360° */}
          <button
            type="button"
            onClick={() => {
              heritageAudio.playClick();
              setActiveTab('tour360');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tour360'
                ? 'bg-gradient-to-r from-red-800 to-amber-600 text-white shadow-lg ring-1 ring-amber-300'
                : 'text-amber-200 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span>Tham quan 360°</span>
            {site.externalTourUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* Tab 4: Thuyết minh */}
          <button
            type="button"
            onClick={() => {
              heritageAudio.playClick();
              setActiveTab('audio');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audio'
                ? 'bg-amber-600 text-white shadow-lg ring-1 ring-amber-300'
                : 'text-amber-200 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Thuyết minh</span>
          </button>

          {/* Tab 5: Thử thách */}
          <button
            type="button"
            onClick={() => {
              heritageAudio.playClick();
              setActiveTab('challenge');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'challenge'
                ? 'bg-amber-600 text-white shadow-lg ring-1 ring-amber-300'
                : 'text-amber-200 hover:bg-stone-800/80 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Thử thách ({site.quizQuestions.length})</span>
          </button>
        </div>

        {/* View All Toggle */}
        <button
          type="button"
          onClick={() => {
            heritageAudio.playClick();
            setActiveTab('all');
          }}
          className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
            activeTab === 'all'
              ? 'bg-stone-800 text-amber-300 border-amber-500'
              : 'text-amber-300/70 hover:text-white border-transparent'
          }`}
        >
          Xem toàn bộ trang
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: THAM QUAN 360° (Hiển thị khi activeTab === 'tour360' hoặc 'all') */}
      {/* ========================================================================= */}
      {(activeTab === 'tour360' || activeTab === 'all') && (
        <section id="tour-360-section" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl md:text-2xl font-serif font-bold text-amber-200">
                  Mục 3: Tham Quan Thực Tế Ảo 360°
                </h2>
              </div>
              <p className="text-xs md:text-sm text-amber-300/80 mt-0.5">
                {site.externalTourUrl
                  ? `Khám phá toàn cảnh 360° thực tế của ${site.name} với đầy đủ các vị trí tham quan, mũi tên chuyển cảnh và chức năng điều khiển.`
                  : 'Kéo chuột hoặc vuốt để xoay 360°. Nhấn vào các điểm lấp lánh để khám phá kiến trúc nghệ thuật!'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {site.externalTourUrl ? (
                <a
                  href={site.externalTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-800 via-amber-800 to-amber-700 hover:from-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 border border-amber-500/40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở tour toàn màn hình</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    heritageAudio.playClick();
                    onOpenVirtualTourMode(site.id);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Chế độ 360° Chuyên Sâu</span>
                </button>
              )}
            </div>
          </div>

          {/* Conditional 360 Rendering: If site has externalTourUrl (Chùa Ha), use NetlifyTourViewer; else PanoramaViewer */}
          {site.externalTourUrl ? (
            <div className="space-y-3">
              <NetlifyTourViewer
                tourUrl={site.externalTourUrl}
                siteName={site.name}
                subtitle="Dữ liệu hình ảnh panorama thực tế 360° với các điểm chuyển cảnh và góc nhìn chi tiết"
                heightClass="h-[580px] md:h-[680px] lg:h-[750px]"
              />

              {/* Security Policy Fallback & User Guide Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#240f06] to-[#1a0a04] border border-amber-800/70 text-xs text-amber-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-200">
                      Ghi chú trải nghiệm 360°:
                    </span>{' '}
                    <span>
                      Nếu khung tham quan tải chậm hoặc bị hạn chế bởi chính sách bảo mật trình duyệt, bạn có thể nhấn nút mở trực tiếp để xem toàn màn hình trong tab mới với trải nghiệm mượt mà nhất.
                    </span>
                  </div>
                </div>

                <a
                  href={site.externalTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 border border-amber-400/40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở trực tiếp Tour 360° {site.name}</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="w-full h-[540px] md:h-[620px]">
              <PanoramaViewer
                scene={activeScene}
                allScenes={site.scenes360}
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
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: THUYẾT MINH (Hiển thị khi activeTab === 'audio' hoặc 'all')     */}
      {/* ========================================================================= */}
      {(activeTab === 'audio' || activeTab === 'all') && (
        <section id="audio-section" className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Volume2 className="w-4 h-4" />
            <span>Mục 4: Thuyết Minh Âm Thanh Chính Thức</span>
          </div>
          <AudioPlayerBar
            title={site.audioGuide.title}
            transcript={site.audioGuide.transcript}
            fileUrl={site.audioGuide.fileUrl}
            durationText={site.audioGuide.duration || '2:30'}
          />
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: KIẾN TRÚC NGHỆ THUẬT (Hiển thị khi activeTab === 'architecture' hoặc 'all') */}
      {/* ========================================================================= */}
      {(activeTab === 'architecture' || activeTab === 'all') && (
        <section id="architecture-section" className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-[#1e0e08]/90 border-2 border-amber-700/50 shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-amber-900/50 pb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl md:text-2xl font-serif font-bold text-amber-200">
                Mục 2: Kiến Trúc Nghệ Thuật Cổ Truyền
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Architecture Overview */}
              <div className="p-5 rounded-2xl bg-stone-900/80 border border-amber-800/60 space-y-2">
                <h3 className="text-base font-bold text-amber-300 font-serif flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Đặc Điểm Kiến Trúc & Kết Cấu Gỗ:
                </h3>
                <p className="text-xs md:text-sm text-amber-100/90 leading-relaxed font-serif">
                  {site.architectureOverview}
                </p>
              </div>

              {/* Artistic Significance */}
              <div className="p-5 rounded-2xl bg-stone-900/80 border border-amber-800/60 space-y-2">
                <h3 className="text-base font-bold text-amber-300 font-serif flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Giá Trị Nghệ Thuật Điêu Khắc:
                </h3>
                <p className="text-xs md:text-sm text-amber-100/90 leading-relaxed font-serif">
                  {site.artisticSignificance}
                </p>
              </div>
            </div>

            {/* Architectural Decoding Grid */}
            <div className="pt-4 border-t border-amber-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-amber-200">
                    Các Điểm Nhấn Kiến Trúc & Hoa Văn Cần Giải Mã ({allSiteHotspots.length})
                  </h3>
                  <p className="text-xs text-amber-300/80 mt-0.5">
                    Học sinh có thể nhấp trực tiếp vào từng thẻ dưới đây để nghe thuyết minh chi tiết và quan sát ảnh cận cảnh:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {allSiteHotspots.map((hs) => (
                  <div
                    key={hs.id}
                    onClick={() => {
                      heritageAudio.playClick();
                      setSelectedHotspot(hs);
                      onRecordHotspotDecoded(hs.id);
                    }}
                    className="group cursor-pointer p-4 rounded-2xl bg-stone-900/90 hover:bg-stone-800/95 border border-amber-800/60 hover:border-amber-400 shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="h-36 rounded-xl overflow-hidden border border-amber-800/40 relative">
                        <img
                          src={hs.detailedImage}
                          alt={hs.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-stone-950/85 text-[10px] text-amber-300 border border-amber-700 font-medium">
                          {hs.architecturalPart}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-amber-200 group-hover:text-amber-100 line-clamp-1">
                          {hs.title}
                        </h4>
                        <p className="text-xs text-amber-300/70 mt-1 line-clamp-2">
                          {hs.explanation}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-amber-900/40 flex items-center justify-between text-xs text-amber-400 font-semibold">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Giải mã ngay</span>
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: GIỚI THIỆU (Hiển thị khi activeTab === 'intro' hoặc 'all')      */}
      {/* ========================================================================= */}
      {(activeTab === 'intro' || activeTab === 'all') && (
        <section id="intro-section" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Full Monograph / History description */}
            <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl bg-[#1e0e08]/90 border-2 border-amber-700/50 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl md:text-2xl font-serif font-bold text-amber-200">
                  Mục 1: Giới Thiệu Lịch Sử & Không Gian Văn Hóa
                </h2>
              </div>
              <p className="text-sm md:text-base text-amber-100/90 leading-relaxed font-serif whitespace-pre-line">
                {site.fullDescription}
              </p>

              {/* Administrative Address Note */}
              <div className="pt-4 border-t border-amber-900/50 flex items-center gap-2 text-xs text-amber-300">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Địa chỉ hành chính:</strong> {site.locality} (Đã chuẩn hóa mô hình chính quyền địa phương hai cấp).
                </span>
              </div>
            </div>

            {/* Gallery & Next Site Recommendation */}
            <div className="space-y-6">
              {/* Gallery */}
              <div className="p-5 rounded-3xl bg-[#1e0e08]/90 border-2 border-amber-700/50 shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h4 className="font-serif font-bold text-sm text-amber-200">Tư Liệu Hình Ảnh</h4>
                </div>

                <div className="space-y-3">
                  {site.gallery.map((g) => (
                    <div key={g.id} className="rounded-xl overflow-hidden border border-amber-800 bg-stone-950">
                      <img src={g.url} alt={g.title} className="w-full h-32 object-cover" />
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-amber-200">{g.title}</p>
                        <p className="text-[11px] text-amber-300/70">{g.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next site card */}
              {nextSite && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/80 to-[#220d06] border-2 border-amber-600/50 shadow-xl space-y-3">
                  <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                    TIẾP TỤC HÀNH TRÌNH
                  </span>
                  <h4 className="font-serif font-bold text-base text-amber-100">
                    {nextSite.name}
                  </h4>
                  <p className="text-xs text-amber-300/80 line-clamp-2">
                    {nextSite.shortSummary}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      heritageAudio.playClick();
                      onSelectSite(nextSite.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                  >
                    <span>Khám phá {nextSite.name}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: THỬ THÁCH (Hiển thị khi activeTab === 'challenge' hoặc 'all')   */}
      {/* ========================================================================= */}
      {(activeTab === 'challenge' || activeTab === 'all') && (
        <section id="challenge-section" className="space-y-4">
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#2a1309] via-[#35170c] to-[#1c0904] border-2 border-amber-600/70 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-800/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-amber-200">
                    Mục 5: Thử Thách & Trắc Nghiệm Di Tích
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-amber-300/80 mt-0.5">
                  Kiểm tra kiến thức thu hoạch được sau chuyến tham quan {site.name}!
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-amber-950 border border-amber-600 text-xs text-amber-300 font-bold">
                  Điểm thử thách: <span className="text-emerald-400 text-sm">{userScore}</span> đ
                </div>
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs text-amber-300 border border-amber-800/60"
                >
                  Làm lại
                </button>
              </div>
            </div>

            {/* Quiz Question Card */}
            {currentQuestion && (
              <div className="space-y-4 max-w-3xl mx-auto">
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs text-amber-300/80">
                  <span>
                    Câu hỏi {quizIndex + 1} / {site.quizQuestions.length}
                  </span>
                  <span className="capitalize px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-[11px]">
                    Chủ đề: {currentQuestion.category}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                    style={{
                      width: `${((quizIndex + 1) / site.quizQuestions.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Question Prompt */}
                <h3 className="text-base md:text-lg font-serif font-bold text-amber-100 leading-snug">
                  {currentQuestion.question}
                </h3>

                {/* Answer Options */}
                <div className="space-y-2.5 pt-1">
                  {currentQuestion.options.map((opt, oIdx) => {
                    let optionStyle =
                      'bg-stone-900/90 hover:bg-stone-800 border-amber-900/70 text-amber-200';

                    if (selectedOption === oIdx) {
                      optionStyle =
                        'bg-amber-950 border-amber-500 text-amber-100 ring-2 ring-amber-400/50';
                    }

                    if (isAnswerSubmitted && quizResult) {
                      if (quizResult.isCorrect && selectedOption === oIdx) {
                        optionStyle =
                          'bg-emerald-950/90 border-emerald-500 text-emerald-200 ring-2 ring-emerald-400/50';
                      } else if (!quizResult.isCorrect && selectedOption === oIdx) {
                        optionStyle =
                          'bg-red-950/90 border-red-500 text-red-200 ring-2 ring-red-400/50';
                      } else {
                        optionStyle = 'opacity-40 border-stone-800 text-stone-400';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectQuizOption(oIdx)}
                        disabled={isAnswerSubmitted || isVerifyingQuiz}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs md:text-sm font-medium transition-all flex items-center justify-between gap-3 ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-stone-950 border border-amber-700/60 flex items-center justify-center text-xs font-bold shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isAnswerSubmitted && quizResult?.isCorrect && selectedOption === oIdx && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {isAnswerSubmitted && !quizResult?.isCorrect && selectedOption === oIdx && (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Submit / Next Button */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  {!isAnswerSubmitted ? (
                    <button
                      type="button"
                      disabled={selectedOption === null || isVerifyingQuiz}
                      onClick={handleSubmitQuizAnswer}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 text-white font-bold text-xs md:text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      {isVerifyingQuiz ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang kiểm tra...</span>
                        </>
                      ) : (
                        <span>Xác nhận câu trả lời</span>
                      )}
                    </button>
                  ) : (
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-950/90 p-3.5 rounded-xl border border-amber-800/60">
                      <div className="text-xs">
                        <span className="font-bold text-amber-300">Giải thích: </span>
                        <span className="text-amber-100/90">
                          {quizResult?.explanation || currentQuestion.explanation || 'Kiến thức về di tích lịch sử địa phương.'}
                        </span>
                        {quizResult?.alreadyAnswered && (
                          <span className="text-amber-400 font-semibold ml-2">(Bạn đã nhận điểm câu hỏi này trước đó)</span>
                        )}
                      </div>
                      {quizIndex < site.quizQuestions.length - 1 ? (
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                        >
                          <span>Câu tiếp theo</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="shrink-0 text-emerald-400 font-bold text-xs">
                          Đã hoàn thành tất cả câu hỏi! 🎉
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Architectural Art Decoding Modal */}
      <ArtDecoderModal
        hotspot={selectedHotspot}
        allHotspots={allSiteHotspots}
        onClose={() => setSelectedHotspot(null)}
        onNavigateHotspot={(hs) => setSelectedHotspot(hs)}
        onRecordDecoded={onRecordHotspotDecoded}
      />
    </div>
  );
};
