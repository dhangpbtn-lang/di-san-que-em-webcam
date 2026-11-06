/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Maximize2,
  Minimize2,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';
import { heritageAudio } from '../../utils/audioSystem';

interface NetlifyTourViewerProps {
  tourUrl: string;
  siteName: string;
  subtitle?: string;
  heightClass?: string;
}

export const NetlifyTourViewer: React.FC<NetlifyTourViewerProps> = ({
  tourUrl,
  siteName,
  subtitle = 'Khám phá không gian thực tế ảo đa điểm với Marzipano 360°',
  heightClass = 'h-[580px] md:h-[680px] lg:h-[750px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Monitor fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    heritageAudio.playClick();
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // If browser blocks HTML5 fullscreen inside iframe, fallback to opening in new tab
      window.open(tourUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleReload = () => {
    heritageAudio.playClick();
    setIsLoading(true);
    setHasError(false);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl md:rounded-3xl border-2 border-amber-600/70 bg-[#120703] shadow-2xl overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none h-screen' : heightClass
      }`}
    >
      {/* Top Controls Toolbar */}
      <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-[#240e06] via-[#331409] to-[#1a0904] border-b border-amber-800/60 flex flex-wrap items-center justify-between gap-3 text-amber-100 z-10 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-black text-sm md:text-base text-amber-100">
                Tour 360° Thực Tế Ảo • {siteName}
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 text-[10px] font-semibold border border-emerald-600/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Marzipano Live
              </span>
            </div>
            <p className="text-[11px] text-amber-300/80 hidden md:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Reload Button */}
          <button
            type="button"
            onClick={handleReload}
            title="Tải lại khung hình 360°"
            className="p-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-amber-800/60 transition-colors hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* In-app Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-amber-300 hover:text-white text-xs font-semibold border border-amber-800/60 transition-all shadow-sm"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Mở toàn màn hình khung này'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Toàn màn hình</span>
              </>
            )}
          </button>

          {/* Primary Action: Mở tour toàn màn hình (tab mới) */}
          <a
            href={tourUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => heritageAudio.playTempleBell()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-800 via-amber-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white text-xs font-bold shadow-lg border border-amber-400/50 transition-all transform hover:scale-102 active:scale-98"
            title="Mở đường link tour 360° gốc trong thẻ mới"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở tour toàn màn hình</span>
          </a>
        </div>
      </div>

      {/* Main Iframe Viewer Area */}
      <div className="relative flex-1 w-full h-full bg-black">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 text-amber-200 p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-3 border-amber-500/30 border-t-amber-400 animate-spin" />
            <div className="space-y-1">
              <p className="font-serif font-bold text-base text-amber-100">
                Đang nạp không gian 360° {siteName}...
              </p>
              <p className="text-xs text-amber-300/70 max-w-sm">
                Đang kết nối tới dữ liệu hình ảnh độ phân giải cao và các điểm chuyển cảnh Marzipano.
              </p>
            </div>
          </div>
        )}

        {/* The Embedded Iframe */}
        <iframe
          key={iframeKey}
          src={tourUrl}
          title={`Tour thực tế ảo 360° - ${siteName}`}
          className="w-full h-full border-0 block"
          allow="fullscreen; accelerometer; gyroscope; magnetometer; xr-spatial-tracking"
          allowFullScreen
          loading="lazy"
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />

        {/* Subtle Bottom Helper Ribbon */}
        {!isFullscreen && (
          <div className="absolute bottom-2 left-2 right-2 pointer-events-none z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-amber-900/60 text-[11px] text-amber-200/90 shadow-md">
            <div className="flex items-center gap-2 pointer-events-auto">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Hướng dẫn:</strong> Kéo chuột/vuốt để xoay 360° • Cuộn chuột phóng to/thu nhỏ • Nhấp mũi tên để chuyển không gian
              </span>
            </div>
            <a
              href={tourUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto text-amber-300 hover:text-white underline font-semibold ml-auto"
            >
              Mở tab mới ↗
            </a>
          </div>
        )}
      </div>

      {/* Fallback & Security Policy Notice Box (Always accessible below or when error occurs) */}
      {hasError && (
        <div className="p-4 bg-amber-950/90 border-t-2 border-amber-600 text-amber-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-amber-200">
                Trình duyệt có thể đang giới hạn tải khung nhúng từ trang ngoài
              </p>
              <p className="text-amber-300/80">
                Để trải nghiệm đầy đủ các góc nhìn và âm thanh gốc, bạn hãy nhấn nút mở trực tiếp tour trong thẻ mới.
              </p>
            </div>
          </div>
          <a
            href={tourUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Mở trực tiếp Tour 360° {siteName}</span>
          </a>
        </div>
      )}
    </div>
  );
};
