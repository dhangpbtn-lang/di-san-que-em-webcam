/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HeritageSite } from '../../types/heritage';
import { PanoramaViewer } from '../viewer360/PanoramaViewer';
import { heritageAudio } from '../../utils/audioSystem';
import { AppView } from '../layout/Header';
import {
  Compass,
  Sparkles,
  BookOpen,
  Volume2,
  Puzzle,
  Trophy,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Eye,
  Maximize2
} from 'lucide-react';

interface HomePageProps {
  sites: HeritageSite[];
  onSelectSite: (siteId: string) => void;
  onNavigate: (view: AppView) => void;
  onOpenVirtualTourForSite?: (siteId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  sites,
  onSelectSite,
  onNavigate,
  onOpenVirtualTourForSite,
}) => {
  // Use Chùa Ha as the primary featured site
  const chuaHaSite = sites.find((s) => s.id === 'chua-ha') || sites[0];
  const chuaHaScene = chuaHaSite.scenes360[0];

  return (
    <div className="w-full space-y-16 text-amber-100">
      {/* 1. HERO SECTION */}
      <section className="relative rounded-3xl overflow-hidden border-2 border-amber-600/60 bg-gradient-to-b from-[#2a1208] via-[#38180c] to-[#1a0a05] p-6 sm:p-10 md:p-14 shadow-2xl text-center space-y-6">
        {/* Traditional Ornamental Top Knot */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs md:text-sm font-semibold tracking-wider uppercase">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Dự án giáo dục di sản địa phương cho học sinh THCS</span>
        </div>

        <div className="space-y-3 max-w-4xl mx-auto">
          <h1 className="font-serif font-black text-3xl sm:text-5xl md:text-6xl text-amber-100 tracking-tight leading-tight">
            HÀNH TRÌNH KHÁM PHÁ <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              KIẾN TRÚC & NGHỆ THUẬT
            </span>
          </h1>
          <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-amber-300/90 font-medium">
            Di tích lịch sử: Chùa Ha • Đình Hộ Lệnh • Chùa Úc Kỳ • Đình Phương Độ • Đình Xuân La
          </p>
          <p className="text-xs sm:text-sm md:text-base text-amber-100/80 max-w-2xl mx-auto leading-relaxed pt-2">
            Đắm mình trong không gian thực tế ảo 360° hỗ trợ ảnh chất lượng cao 8192 × 4096 px, xoay đa chiều, khám phá mái đình, cột gỗ lim, vì kèo chồng rường, hoa văn chạm khắc và lắng nghe thuyết minh MP3 truyền cảm.
          </p>
        </div>

        {/* Hero Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              heritageAudio.playTempleBell();
              onNavigate('virtual-tour');
            }}
            className="px-6 sm:px-8 py-3.5 bg-gradient-to-r from-red-800 via-amber-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-serif font-bold text-sm sm:text-base rounded-2xl shadow-xl flex items-center gap-2.5 transition-all transform hover:scale-103 active:scale-95 border border-amber-400/50"
          >
            <Compass className="w-5 h-5 text-amber-300" />
            <span>Tham quan 360° ngay</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>

          <button
            type="button"
            onClick={() => {
              heritageAudio.playClick();
              onNavigate('library');
            }}
            className="px-5 sm:px-6 py-3.5 bg-stone-900/90 hover:bg-stone-800 text-amber-200 font-serif font-bold text-sm sm:text-base rounded-2xl border-2 border-amber-600/70 shadow-lg flex items-center gap-2 transition-all transform hover:scale-103 active:scale-95"
          >
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>Thư viện 5 di tích</span>
          </button>

          <button
            type="button"
            onClick={() => {
              heritageAudio.playClick();
              onNavigate('challenge');
            }}
            className="px-5 sm:px-6 py-3.5 bg-stone-900/90 hover:bg-stone-800 text-amber-200 font-serif font-bold text-sm sm:text-base rounded-2xl border border-amber-800/70 shadow-lg flex items-center gap-2 transition-all transform hover:scale-103 active:scale-95"
          >
            <Puzzle className="w-5 h-5 text-amber-400" />
            <span>Thử thách đố vui</span>
          </button>
        </div>

        {/* Quick highlight bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto border-t border-amber-800/40 text-left">
          <div className="p-3 bg-stone-950/40 rounded-xl border border-amber-900/40">
            <span className="text-xl font-bold font-mono text-amber-300">5</span>
            <p className="text-[11px] text-amber-200/80">Di tích trang 360° riêng biệt</p>
          </div>
          <div className="p-3 bg-stone-950/40 rounded-xl border border-amber-900/40">
            <span className="text-xl font-bold font-mono text-amber-300">8192 × 4096</span>
            <p className="text-[11px] text-amber-200/80">Hỗ trợ ảnh JPG equirectangular 2:1</p>
          </div>
          <div className="p-3 bg-stone-950/40 rounded-xl border border-amber-900/40">
            <span className="text-xl font-bold font-mono text-amber-300">Mũi tên 3D</span>
            <p className="text-[11px] text-amber-200/80">Chuyển giữa các vị trí trong di tích</p>
          </div>
          <div className="p-3 bg-stone-950/40 rounded-xl border border-amber-900/40">
            <span className="text-xl font-bold font-mono text-amber-300">Thuyết minh MP3</span>
            <p className="text-[11px] text-amber-200/80">Thuyết minh & giải mã chi tiết</p>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE 360 PREVIEW (CHÙA HA) */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
              TRẢI NGHIỆM TRỰC QUAN THỰC TẾ ẢO
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-black text-amber-100">
              Trải Nghiệm 360°: {chuaHaSite.name}
            </h2>
            <p className="text-xs md:text-sm text-amber-300/80 mt-1">
              Kéo chuột để xoay 360°, phóng to/thu nhỏ, nhấp vào các điểm lấp lánh để giải mã mái chùa, vì kèo, cột lim và lư hương đá:
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                heritageAudio.playTempleBell();
                onOpenVirtualTourForSite
                  ? onOpenVirtualTourForSite('chua-ha')
                  : onNavigate('virtual-tour');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 text-white font-bold text-xs rounded-xl shadow-md w-fit"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Mở chế độ 360° toàn màn hình</span>
            </button>
          </div>
        </div>

        {/* 360 viewer box */}
        <div className="w-full h-[480px] md:h-[540px]">
          <PanoramaViewer
            scene={chuaHaScene}
            allScenes={chuaHaSite.scenes360}
            onSelectHotspot={() => {
              heritageAudio.playClick();
              onOpenVirtualTourForSite
                ? onOpenVirtualTourForSite('chua-ha')
                : onNavigate('virtual-tour');
            }}
          />
        </div>
      </section>

      {/* 3. 6 MAIN APP FEATURES SHOWCASE */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
            6 CHỨC NĂNG NỀN TẢNG
          </span>
          <h2 className="text-2xl md:text-4xl font-serif font-black text-amber-100">
            Hành Trang Khám Phá Di Sản Toàn Diện
          </h2>
          <p className="text-xs md:text-sm text-amber-300/80 max-w-xl mx-auto">
            Hệ thống chức năng được thiết kế trực quan, khoa học, bám sát chương trình giáo dục địa phương THCS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* F1 */}
          <div
            onClick={() => onNavigate('library')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#200e08]/90 border border-amber-700/50 hover:border-amber-400 shadow-xl transition-all space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-amber-200">
              1. Thư Viện 5 Di Tích
            </h3>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Trang giới thiệu riêng biệt cho Chùa Ha, Đình Hộ Lệnh, Chùa Úc Kỳ, Đình Phương Độ và Đình Xuân La với dữ liệu kiểm chứng và cập nhật thực địa.
            </p>
          </div>

          {/* F2 */}
          <div
            onClick={() => onNavigate('virtual-tour')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#200e08]/90 border border-amber-700/50 hover:border-amber-400 shadow-xl transition-all space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-amber-200">
              2. Tham Quan Thực Tế Ảo 360°
            </h3>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Trình xem panorama 360° tương tác, hỗ trợ xoay, thu phóng, chuyển vị trí và tương thích ảnh toàn cảnh độ phân giải cao 8192 × 4096 px.
            </p>
          </div>

          {/* F3 */}
          <div
            onClick={() => onNavigate('virtual-tour')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#200e08]/90 border border-amber-700/50 hover:border-amber-400 shadow-xl transition-all space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-amber-200">
              3. Giải Mã Kiến Trúc Nghệ Thuật
            </h3>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Nhấn vào các điểm tương tác để xem chi tiết bộ phận kiến trúc, hình ảnh đặc tả, lời giải thích dễ hiểu và giá trị mỹ thuật độc đáo.
            </p>
          </div>

          {/* F4 */}
          <div
            onClick={() => onNavigate('library')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#200e08]/90 border border-amber-700/50 hover:border-amber-400 shadow-xl transition-all space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform">
              <Volume2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-amber-200">
              4. Thuyết Minh Di Tích Âm Thanh
            </h3>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Trình phát âm thanh MP3 hoàn chỉnh với phát, tạm dừng, nghe lại, chỉnh âm lượng, tốc độ và kịch bản văn bản nổi bật.
            </p>
          </div>

          {/* F5 */}
          <div
            onClick={() => onNavigate('challenge')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#200e08]/90 border border-amber-700/50 hover:border-amber-400 shadow-xl transition-all space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform">
              <Puzzle className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-amber-200">
              5. Thử Thách Di Sản Tương Tác
            </h3>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Trắc nghiệm lịch sử, nhận diện chi tiết hoa văn, ghép tranh di tích và đoán di tích bí ẩn với tính điểm tức thì và giải thích cặn kẽ.
            </p>
          </div>

          {/* F6 */}
          <div
            onClick={() => onNavigate('achievements')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#200e08]/90 border border-amber-700/50 hover:border-amber-400 shadow-xl transition-all space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-amber-200">
              6. Thành Tích & Giấy Chứng Nhận
            </h3>
            <p className="text-xs text-amber-100/80 leading-relaxed">
              Ghi danh họ tên, theo dõi điểm số, mở khóa huy hiệu danh dự và in Giấy chứng nhận hoàn thành hành trình có con dấu bảo tàng sắc nét.
            </p>
          </div>
        </div>
      </section>

      {/* 4. LIST OF 5 HERITAGE SITES PREVIEW */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
              DANH MỤC 5 DI TÍCH
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-black text-amber-100">
              Khám Phá Chi Tiết Từng Di Tích
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              onClick={() => {
                heritageAudio.playTempleBell();
                onSelectSite(site.id);
              }}
              className="group cursor-pointer rounded-3xl overflow-hidden bg-gradient-to-b from-[#241007] to-[#150702] border border-amber-800/60 hover:border-amber-400 shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-stone-950">
                  <img
                    src={site.coverImage}
                    alt={site.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-stone-950/80 text-[11px] text-amber-300 border border-amber-700 font-semibold">
                    {site.type}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-serif font-bold text-lg text-amber-100 group-hover:text-amber-200">
                    {site.name}
                  </h3>
                  <p className="text-xs text-amber-400/80 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{site.locality}</span>
                  </p>
                  <p className="text-xs text-amber-100/70 line-clamp-2">
                    {site.shortSummary}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between text-xs text-amber-400 font-bold border-t border-amber-900/30 mt-2">
                <span>Khám phá ngay</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
