/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { heritageAudio } from '../../utils/audioSystem';
import {
  Compass,
  Trophy,
  BookOpen,
  ShieldCheck,
  Bell,
  Home,
  Puzzle,
  Menu,
  X,
  Layers
} from 'lucide-react';

export type AppView = 'home' | 'library' | 'site-detail' | 'virtual-tour' | 'challenge' | 'achievements' | 'admin';

interface HeaderProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  exploredSitesCount: number;
  totalPoints: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  exploredSitesCount,
  totalPoints,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleNavClick = (view: AppView) => {
    heritageAudio.playClick();
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#200e08]/95 border-b-2 border-amber-600/50 backdrop-blur-md shadow-xl text-amber-100">
      {/* Decorative Traditional Border Top Accent */}
      <div className="h-1 bg-gradient-to-r from-red-700 via-amber-500 to-red-700" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* Bronze Bell / Temple Emblem */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-700 to-red-900 border-2 border-amber-400/80 flex items-center justify-center text-amber-200 shadow-md group-hover:scale-105 transition-transform">
            <span className="font-serif text-xl font-black">🏛️</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black text-lg md:text-xl text-amber-200 tracking-tight leading-tight group-hover:text-amber-100 transition-colors">
                DI SẢN QUÊ EM
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                THCS
              </span>
            </div>
            <p className="text-[11px] text-amber-400/80 hidden md:block">
              Hành trình khám phá kiến trúc & nghệ thuật di tích lịch sử
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'home'
                ? 'bg-amber-700 text-white shadow-md'
                : 'text-amber-200 hover:text-white hover:bg-stone-900/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Trang chủ</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('virtual-tour')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'virtual-tour'
                ? 'bg-gradient-to-r from-red-800 to-amber-700 text-white shadow-md ring-1 ring-amber-400'
                : 'text-amber-300 hover:text-white hover:bg-stone-900/60'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Tham quan 360°</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('library')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'library' || activeView === 'site-detail'
                ? 'bg-amber-700 text-white shadow-md'
                : 'text-amber-200 hover:text-white hover:bg-stone-900/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Thư viện 5 di tích</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('challenge')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'challenge'
                ? 'bg-amber-700 text-white shadow-md'
                : 'text-amber-200 hover:text-white hover:bg-stone-900/60'
            }`}
          >
            <Puzzle className="w-4 h-4" />
            <span>Thử thách di sản</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('achievements')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'achievements'
                ? 'bg-amber-700 text-white shadow-md'
                : 'text-amber-200 hover:text-white hover:bg-stone-900/60'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Thành tích ({totalPoints}đ)</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('admin')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              activeView === 'admin'
                ? 'bg-amber-900 border-amber-400 text-amber-200'
                : 'border-amber-700/50 text-amber-300 hover:bg-amber-950/60'
            }`}
            title="Dành cho nhóm học sinh quản lý"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Nhóm học sinh quản lý</span>
          </button>
        </nav>

        {/* Right Student Quick Stats & Bell sound trigger */}
        <div className="flex items-center gap-2.5">
          {/* Quick Sound Bell */}
          <button
            type="button"
            onClick={() => heritageAudio.playTempleBell()}
            className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-amber-300 border border-amber-700/60 transition-transform active:scale-90"
            title="Nghe tiếng chuông đồng cổ kính"
          >
            <Bell className="w-4 h-4 text-amber-400" />
          </button>

          {/* Student Progress Pill */}
          <div
            onClick={() => handleNavClick('achievements')}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-amber-600/60 hover:border-amber-400 transition-colors shadow-xs"
            title="Xem thành tích & nhận giấy chứng nhận"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-200">
              {exploredSitesCount}/5 di tích
            </span>
            <span className="text-amber-400 font-bold">•</span>
            <span className="text-xs font-mono font-bold text-amber-300">
              {totalPoints}đ
            </span>
          </div>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-stone-900 text-amber-300 border border-amber-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-3 pb-6 bg-[#26120a] border-b-2 border-amber-600 space-y-2 animate-in slide-in-from-top-4">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="w-full text-left p-3 rounded-xl text-sm font-bold hover:bg-stone-900 text-amber-100 flex items-center gap-2"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>Trang chủ</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('virtual-tour')}
            className="w-full text-left p-3 rounded-xl text-sm font-bold bg-amber-950/80 border border-amber-500 text-amber-200 flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Tham quan thực tế ảo 360°</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('library')}
            className="w-full text-left p-3 rounded-xl text-sm font-bold hover:bg-stone-900 text-amber-100 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Thư viện 5 di tích</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('challenge')}
            className="w-full text-left p-3 rounded-xl text-sm font-bold hover:bg-stone-900 text-amber-100 flex items-center gap-2"
          >
            <Puzzle className="w-4 h-4 text-amber-400" />
            <span>Thử thách di sản</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('achievements')}
            className="w-full text-left p-3 rounded-xl text-sm font-bold hover:bg-stone-900 text-amber-100 flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Thành tích & Giấy chứng nhận ({totalPoints}đ)</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('admin')}
            className="w-full text-left p-3 rounded-xl text-sm font-bold bg-amber-950/70 border border-amber-600 text-amber-300 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Dành cho nhóm học sinh quản lý</span>
          </button>
        </div>
      )}
    </header>
  );
};
