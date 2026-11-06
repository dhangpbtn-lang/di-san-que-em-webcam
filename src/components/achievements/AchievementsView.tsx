/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import confetti from 'canvas-confetti';
import { Badge, HeritageSite, StudentProgress } from '../../types/heritage';
import { heritageAudio } from '../../utils/audioSystem';
import {
  Trophy,
  Award,
  Compass,
  CheckCircle2,
  Printer,
  Sparkles,
  Share2,
  User,
  GraduationCap
} from 'lucide-react';

interface AchievementsViewProps {
  progress: StudentProgress;
  sites: HeritageSite[];
  badges: Badge[];
  onUpdateStudentInfo: (name: string, school: string, studentClass: string) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  progress,
  sites,
  badges,
  onUpdateStudentInfo,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const totalSitesCount = sites.length;
  const exploredCount = progress.exploredSites.length;
  const decodedCount = progress.decodedHotspots.length;

  const handlePrint = () => {
    heritageAudio.playFanfare();
    confetti({ particleCount: 100, spread: 80 });
    window.print();
  };

  const handleClaimCertificate = () => {
    heritageAudio.playFanfare();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="w-full space-y-8 text-amber-100">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sites explored */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-[#2a130b] to-[#1a0a05] border border-amber-700/50 shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-400/80 font-medium">
              Di Tích Đã Khám Phá
            </p>
            <p className="text-xl md:text-2xl font-bold font-mono text-amber-200">
              {exploredCount} / {totalSitesCount}
            </p>
          </div>
        </div>

        {/* Total Points */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-[#2a130b] to-[#1a0a05] border border-amber-700/50 shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-400/80 font-medium">
              Điểm Tích Lũy
            </p>
            <p className="text-xl md:text-2xl font-bold font-mono text-amber-300">
              {progress.totalPoints} đ
            </p>
          </div>
        </div>

        {/* Decoded hotspots */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-[#2a130b] to-[#1a0a05] border border-amber-700/50 shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-400/80 font-medium">
              Điểm Kiến Trúc Giải Mã
            </p>
            <p className="text-xl md:text-2xl font-bold font-mono text-amber-200">
              {decodedCount} điểm
            </p>
          </div>
        </div>

        {/* Badges Earned */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-[#2a130b] to-[#1a0a05] border border-amber-700/50 shadow-xl flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-400/80 font-medium">
              Huy Hiệu Danh Dự
            </p>
            <p className="text-xl md:text-2xl font-bold font-mono text-amber-200">
              {badges.filter((b) => b.unlocked).length} / {badges.length}
            </p>
          </div>
        </div>
      </div>

      {/* Student Profile Input Card */}
      <div className="p-5 md:p-6 rounded-3xl bg-[#1e0e08]/90 border-2 border-amber-700/50 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-amber-400" />
          <h3 className="text-base md:text-lg font-serif font-bold text-amber-200">
            Thông Tin Học Sinh Nhận Chứng Nhận
          </h3>
        </div>
        <p className="text-xs text-amber-300/80">
          Nhập họ tên, trường và lớp của em để in dấu ấn lên Giấy chứng nhận danh dự nhé!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1">
              Họ và tên hoặc biệt danh:
            </label>
            <input
              type="text"
              value={progress.studentName}
              placeholder="VD: Nguyễn Văn An"
              onChange={(e) =>
                onUpdateStudentInfo(e.target.value, progress.studentSchool, progress.studentClass)
              }
              className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-amber-800/80 text-amber-100 text-sm focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1">
              Lớp:
            </label>
            <input
              type="text"
              value={progress.studentClass}
              placeholder="VD: 7A1, 8B..."
              onChange={(e) =>
                onUpdateStudentInfo(progress.studentName, progress.studentSchool, e.target.value)
              }
              className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-amber-800/80 text-amber-100 text-sm focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1">
              Trường THCS:
            </label>
            <input
              type="text"
              value={progress.studentSchool}
              placeholder="VD: THCS Phú Bình, THCS Điềm Thụy..."
              onChange={(e) =>
                onUpdateStudentInfo(progress.studentName, e.target.value, progress.studentClass)
              }
              className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-amber-800/80 text-amber-100 text-sm focus:border-amber-400 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Badges Showcase */}
      <div className="p-5 md:p-6 rounded-3xl bg-[#1e0e08]/90 border-2 border-amber-700/50 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-base md:text-lg font-serif font-bold text-amber-200">
            Huy Hiệu Di Sản Của Em
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                b.unlocked
                  ? 'bg-gradient-to-br from-amber-950/80 to-stone-900 border-amber-500/70 shadow-lg'
                  : 'bg-stone-950/40 border-stone-800/80 opacity-55'
              }`}
            >
              <span className="text-3xl shrink-0 p-1 bg-stone-900/80 rounded-xl border border-amber-900/50">
                {b.icon}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-serif font-bold text-sm text-amber-200">
                    {b.name}
                  </h4>
                  {b.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-xs text-amber-100/80 mt-0.5">{b.description}</p>
                <p className="text-[10px] text-amber-400/70 mt-1 font-mono">
                  Yêu cầu: {b.requirement}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Actions & Preview */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl md:text-2xl font-serif font-bold text-amber-200 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-amber-400" />
              <span>Chứng Nhận Hoàn Thành Hành Trình Di Sản</span>
            </h3>
            <p className="text-xs md:text-sm text-amber-300/80 mt-0.5">
              Vinh danh học sinh đã tích cực tìm hiểu và lan tỏa giá trị lịch sử kiến trúc quê hương.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClaimCertificate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tuyên dương</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 font-semibold text-xs md:text-sm rounded-xl border border-amber-600/60 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>In chứng nhận</span>
            </button>
          </div>
        </div>

        {/* Official Certificate Visual Canvas */}
        <div
          ref={certificateRef}
          className="relative w-full max-w-4xl mx-auto p-6 md:p-12 bg-[#fffcf4] text-[#2c1407] rounded-3xl border-8 border-double border-[#852a16] shadow-2xl overflow-hidden print:m-0 print:border-4"
        >
          {/* Traditional Ornate Border Frame */}
          <div className="absolute inset-2 border-2 border-[#b45309]/40 rounded-2xl pointer-events-none" />
          <div className="absolute inset-4 border border-[#852a16]/20 rounded-xl pointer-events-none" />

          {/* Certificate Header */}
          <div className="relative text-center space-y-2 z-10">
            <p className="text-xs md:text-sm font-semibold tracking-widest uppercase text-[#852a16]">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-[11px] md:text-xs text-stone-600 italic">
              Độc lập - Tự do - Hạnh phúc
            </p>
            <div className="w-32 h-0.5 bg-[#852a16] mx-auto my-1" />

            <div className="pt-4 space-y-1">
              <span className="text-xs uppercase tracking-widest text-[#b45309] font-bold">
                CHƯƠNG TRÌNH GIÁO DỤC DI SẢN ĐỊA PHƯƠNG
              </span>
              <h2 className="text-2xl md:text-4xl font-serif font-black text-[#7a1f0d] tracking-wide">
                GIẤY CHỨNG NHẬN
              </h2>
              <p className="text-base md:text-lg font-serif italic text-amber-900 font-bold">
                Đại Sứ Khám Phá Di Sản Quê Em
              </p>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="relative my-8 text-center space-y-4 z-10">
            <p className="text-sm md:text-base text-stone-700">
              Chứng nhận em học sinh:
            </p>
            <p className="text-2xl md:text-3xl font-serif font-extrabold text-[#7a1f0d] tracking-wide border-b-2 border-dotted border-amber-800/40 inline-block px-8 py-1">
              {progress.studentName || 'Học Sinh Tiêu Biểu'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs md:text-sm text-stone-700 pt-1">
              <span>
                Lớp: <strong className="text-stone-900">{progress.studentClass || '7A'}</strong>
              </span>
              <span>•</span>
              <span>
                Trường: <strong className="text-stone-900">{progress.studentSchool || 'THCS Điềm Thụy'}</strong>
              </span>
            </div>

            <p className="max-w-2xl mx-auto text-xs md:text-sm text-stone-700 leading-relaxed pt-2">
              Đã xuất sắc hoàn thành hành trình khám phá thực tế ảo 360°, giải mã tinh hoa kiến trúc và chinh phục các thử thách lịch sử tại 5 di tích quê hương:{' '}
              <strong className="text-[#7a1f0d]">
                Chùa Ha, Đình Hộ Lệnh, Chùa Úc Kỳ, Đình Phương Độ, Đình Xuân La
              </strong>.
            </p>

            <div className="inline-flex items-center gap-6 p-3 bg-amber-50/80 border border-amber-300 rounded-xl text-xs md:text-sm font-mono text-amber-950 font-bold shadow-xs">
              <span>Điểm số đạt được: {progress.totalPoints} điểm</span>
              <span>•</span>
              <span>Di tích đã khám phá: {progress.exploredSites.length}/5</span>
            </div>
          </div>

          {/* Signatures & Red Official Seal */}
          <div className="relative grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-amber-200 z-10">
            <div className="text-center space-y-1">
              <p className="text-xs uppercase text-stone-600 font-bold">NHÓM HỌC SINH THỰC HIỆN</p>
              <p className="text-[11px] text-stone-500 italic">(Ký và ghi rõ họ tên)</p>
              <div className="h-16 flex items-center justify-center">
                <span className="font-serif italic text-lg text-stone-800">Ban Tổ Chức Di Sản</span>
              </div>
            </div>

            <div className="relative text-center space-y-1">
              <p className="text-xs text-stone-600 italic">
                Thái Nguyên, ngày 27 tháng 10 năm 2026
              </p>
              <p className="text-xs uppercase text-stone-800 font-bold">BAN TỔ CHỨC HÀNH TRÌNH</p>

              {/* Official Museum Red Stamp Seal */}
              <div className="h-16 flex items-center justify-center relative">
                <div className="w-24 h-24 rounded-full border-4 border-red-700 text-red-700 flex flex-col items-center justify-center text-center p-1 font-serif rotate-[-12deg] shadow-md opacity-90 select-none">
                  <span className="text-[8px] font-bold uppercase tracking-tight">BAN QUẢN LÝ</span>
                  <span className="text-[9px] font-extrabold uppercase">DI SẢN QUÊ EM</span>
                  <span className="text-[8px] font-bold">★ ★ ★</span>
                  <span className="text-[7px] italic">BẢO TỒN VĂN HÓA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
