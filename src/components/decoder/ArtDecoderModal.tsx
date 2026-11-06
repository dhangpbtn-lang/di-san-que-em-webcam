/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Hotspot } from '../../types/heritage';
import { narrator, heritageAudio } from '../../utils/audioSystem';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface ArtDecoderModalProps {
  hotspot: Hotspot | null;
  allHotspots?: Hotspot[];
  onClose: () => void;
  onNavigateHotspot?: (hotspot: Hotspot) => void;
  onRecordDecoded?: (hotspotId: string) => void;
}

export const ArtDecoderModal: React.FC<ArtDecoderModalProps> = ({
  hotspot,
  allHotspots = [],
  onClose,
  onNavigateHotspot,
  onRecordDecoded,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isZoomImage, setIsZoomImage] = useState(false);

  useEffect(() => {
    if (hotspot && onRecordDecoded) {
      onRecordDecoded(hotspot.id);
    }
    // Stop audio when switching hotspot
    narrator.stop();
    setIsPlayingAudio(false);
  }, [hotspot, onRecordDecoded]);

  if (!hotspot) return null;

  const currentIndex = allHotspots.findIndex((h) => h.id === hotspot.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allHotspots.length - 1;

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      narrator.stop();
      setIsPlayingAudio(false);
    } else {
      const textToRead = `${hotspot.title}. ${hotspot.explanation} Về giá trị nghệ thuật: ${hotspot.artisticValue}. ${hotspot.audioSnippet?.text || ''}`;
      narrator.speak(textToRead, {
        onEnd: () => setIsPlayingAudio(false),
      });
      setIsPlayingAudio(true);
      heritageAudio.playClick();
    }
  };

  const handleClose = () => {
    narrator.stop();
    setIsPlayingAudio(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-gradient-to-b from-[#2b140c] to-[#1a0a05] text-amber-100 rounded-3xl border-2 border-amber-600/60 shadow-2xl flex flex-col">
        {/* Header with Traditional Ornaments */}
        <div className="sticky top-0 z-20 px-6 py-4 bg-[#2b140c]/95 border-b border-amber-700/50 flex items-center justify-between backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/40">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-amber-400/80 font-medium">
                GIẢI MÃ KIẾN TRÚC & NGHỆ THUẬT
              </p>
              <h3 className="text-lg md:text-xl font-bold font-serif text-amber-200 line-clamp-1">
                {hotspot.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-amber-300/80 hover:text-amber-100 hover:bg-amber-900/40 rounded-full transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 space-y-5">
          {/* Detailed Image & Zoom Option */}
          <div className="relative group rounded-2xl overflow-hidden border border-amber-700/60 bg-stone-950 shadow-inner">
            <img
              src={hotspot.detailedImage}
              alt={hotspot.title}
              className={`w-full object-cover transition-transform duration-300 ${
                isZoomImage ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in group-hover:scale-102'
              } h-56 md:h-64`}
              onClick={() => setIsZoomImage(!isZoomImage)}
            />
            <button
              type="button"
              onClick={() => setIsZoomImage(!isZoomImage)}
              className="absolute bottom-3 right-3 px-2.5 py-1.5 bg-stone-900/85 text-amber-200 text-xs rounded-lg border border-amber-500/50 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{isZoomImage ? 'Thu nhỏ' : 'Phóng to chi tiết'}</span>
            </button>
            <div className="absolute top-3 left-3 px-3 py-1 bg-amber-950/90 text-amber-300 text-xs font-semibold rounded-full border border-amber-600/70 shadow-md">
              {hotspot.architecturalPart}
            </div>
          </div>

          {/* Audio Narration Action Bar (Chức năng 4: Thuyết minh điểm kiến trúc) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-amber-950/50 border border-amber-600/40 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg transition-all ${
                  isPlayingAudio
                    ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold'
                    : 'bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Tạm dừng đọc</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Nghe thuyết minh kiến trúc</span>
                  </>
                )}
              </button>
              {isPlayingAudio && (
                <span className="text-xs text-amber-300 animate-pulse font-medium">
                  Đang đọc thuyết minh...
                </span>
              )}
            </div>
            <span className="text-[11px] text-amber-300/80 bg-stone-900/60 px-2.5 py-1 rounded-md border border-amber-800/40">
              Giọng đọc truyền cảm
            </span>
          </div>

          {/* Section 1: Lời Giải Thích Kiến Trúc Dành Cho Học Sinh THCS */}
          <div className="p-4 bg-stone-900/60 border border-amber-800/40 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h4>Cấu trúc & Nguyên lý kiến trúc:</h4>
            </div>
            <p className="text-amber-100/90 text-sm md:text-base leading-relaxed">
              {hotspot.explanation}
            </p>
          </div>

          {/* Section 2: Giá Trị Nghệ Thuật & Điêu Khắc Đặc Sắc */}
          <div className="p-4 bg-amber-950/40 border border-amber-600/40 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <h4>Giá trị nghệ thuật & Tinh hoa văn hóa:</h4>
            </div>
            <p className="text-amber-100/90 text-sm md:text-base leading-relaxed">
              {hotspot.artisticValue}
            </p>
          </div>

          {/* Teacher audio transcript note */}
          {hotspot.audioSnippet?.text && (
            <div className="p-3 bg-stone-950/40 border border-amber-900/40 rounded-xl text-xs text-amber-300/70 italic">
              « {hotspot.audioSnippet.text} »
            </div>
          )}
        </div>

        {/* Footer with Hotspot Navigation */}
        <div className="sticky bottom-0 z-20 px-6 py-3.5 bg-[#200e08]/95 border-t border-amber-700/50 flex items-center justify-between backdrop-blur-xs">
          <div className="flex items-center gap-2">
            {hasPrev && (
              <button
                type="button"
                onClick={() => {
                  heritageAudio.playClick();
                  onNavigateHotspot?.(allHotspots[currentIndex - 1]);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-900/80 hover:bg-stone-800 text-amber-200 text-xs rounded-lg border border-amber-700/40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={() => {
                  heritageAudio.playClick();
                  onNavigateHotspot?.(allHotspots[currentIndex + 1]);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-900/80 hover:bg-stone-800 text-amber-200 text-xs rounded-lg border border-amber-700/40"
              >
                <span>Tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Đã hiểu kiến trúc này ✓
          </button>
        </div>
      </div>
    </div>
  );
};
