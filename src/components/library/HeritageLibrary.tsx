/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * THƯ VIỆN DI TÍCH LỊCH SỬ ĐỊA PHƯƠNG - DI SẢN QUÊ EM
 * Tích hợp 2 chế độ hiển thị:
 * 1. DANH SÁCH DI TÍCH (Grid thẻ 5 di tích)
 * 2. SA BÀN 3D PHÚ BÌNH (MapLibre GL JS + DEM 3D Terrain)
 */

import React, { useState } from 'react';
import { HeritageSite } from '../../types/heritage';
import { heritageAudio } from '../../utils/audioSystem';
import { Sandtable3D } from './Sandtable3D';
import {
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Sparkles,
  Layers,
  Filter,
  LayoutGrid
} from 'lucide-react';

interface HeritageLibraryProps {
  sites: HeritageSite[];
  exploredSiteIds: string[];
  onSelectSite: (siteId: string) => void;
  onOpenVirtualTour?: (siteId: string) => void;
  onAddPoints?: (amount: number, reason: string) => void;
}

export const HeritageLibrary: React.FC<HeritageLibraryProps> = ({
  sites,
  exploredSiteIds,
  onSelectSite,
  onOpenVirtualTour,
  onAddPoints,
}) => {
  // Chế độ hiển thị trong Thư viện di tích: Danh sách 5 di tích hoặc Sa bàn số 3D
  const [viewMode, setViewMode] = useState<'list' | 'sandtable'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Chùa' | 'Đình'>('all');

  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.shortSummary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || site.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full space-y-6 text-amber-100">
      {/* Header & Bộ chuyển chế độ hiển thị */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-900/40">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
            THƯ VIỆN DI TÍCH LỊCH SỬ ĐỊA PHƯƠNG
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-black text-amber-100">
            5 Di Tích Kiến Trúc & Nghệ Thuật
          </h2>
          <p className="text-xs md:text-sm text-amber-300/80 mt-1">
            Khám phá tinh hoa kiến trúc gỗ, nghệ thuật chạm khắc rồng và bề dày lịch sử huyện Phú Bình, tỉnh Thái Nguyên.
          </p>
        </div>

        {/* Nút chuyển đổi 2 chế độ: DANH SÁCH 5 DI TÍCH & SA BÀN SỐ 3D */}
        <div className="flex items-center gap-1.5 p-1.5 bg-stone-950/90 rounded-2xl border-2 border-amber-700/60 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              heritageAudio.playClick();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-amber-700 text-white shadow-md'
                : 'text-amber-300/80 hover:text-white hover:bg-stone-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>DANH SÁCH 5 DI TÍCH</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('sandtable');
              heritageAudio.playClick();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'sandtable'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 font-black shadow-md ring-2 ring-amber-400/60'
                : 'text-amber-300/80 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>SA BÀN SỐ 3D</span>
          </button>
        </div>
      </div>

      {/* CHẾ ĐỘ 1: SA BÀN SỐ 3D DI SẢN (TÍCH HỢP TRỰC TIẾP TRONG THƯ VIỆN) */}
      {viewMode === 'sandtable' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Sandtable3D
            sites={sites}
            onSelectSite={onSelectSite}
            onOpenVirtualTour={onOpenVirtualTour}
            onAddPoints={onAddPoints}
          />
        </div>
      )}

      {/* CHẾ ĐỘ 2: DANH SÁCH 5 DI TÍCH (GIỮ NGUYÊN TOÀN BỘ GIAO DIỆN & DỮ LIỆU) */}
      {viewMode === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Filter và Search cho danh sách */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-950/60 border border-amber-900/40 rounded-2xl">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-stone-900/90 rounded-xl border border-amber-800/60">
              <button
                type="button"
                onClick={() => {
                  setFilterType('all');
                  heritageAudio.playClick();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-amber-700 text-white'
                    : 'text-amber-300/80 hover:text-white'
                }`}
              >
                Tất cả (5)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterType('Chùa');
                  heritageAudio.playClick();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterType === 'Chùa'
                    ? 'bg-amber-700 text-white'
                    : 'text-amber-300/80 hover:text-white'
                }`}
              >
                Chùa (2)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterType('Đình');
                  heritageAudio.playClick();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterType === 'Đình'
                    ? 'bg-amber-700 text-white'
                    : 'text-amber-300/80 hover:text-white'
                }`}
              >
                Đình (3)
              </button>
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative">
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên di tích, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-stone-900/90 border border-amber-800/70 rounded-xl text-xs md:text-sm text-amber-100 placeholder-amber-400/50 focus:border-amber-400 focus:outline-hidden w-56 sm:w-64"
              />
            </div>
          </div>

          {/* Grid 5 di tích */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSites.map((site) => {
              const isExplored = exploredSiteIds.includes(site.id);

              return (
                <div
                  key={site.id}
                  className="group rounded-3xl overflow-hidden bg-gradient-to-b from-[#261209] to-[#180a04] border-2 border-amber-700/50 hover:border-amber-400 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Badges Container */}
                    <div className="relative h-56 overflow-hidden bg-stone-950">
                      <img
                        src={site.coverImage}
                        alt={site.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#180a04] via-transparent to-black/30" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="px-3 py-1 bg-amber-950/90 text-amber-200 text-xs font-bold rounded-full border border-amber-600/70 shadow-md">
                          {site.type}
                        </span>

                        {isExplored ? (
                          <span className="px-2.5 py-1 bg-emerald-950/90 text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-500 flex items-center gap-1 shadow-md">
                            ✓ Đã khám phá
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-950/80 text-amber-300 text-[11px] font-medium rounded-full border border-amber-700">
                            Chưa khám phá
                          </span>
                        )}
                      </div>

                      {/* 360 Feature Pill */}
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-stone-950/85 text-amber-300 text-xs font-semibold rounded-lg border border-amber-600/60 flex items-center gap-1.5 shadow-md">
                        <Compass className="w-3.5 h-3.5 text-amber-400" />
                        <span>{site.externalTourUrl ? 'Tour 360° Trực Tuyến' : 'Có 360° VR'}</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      {/* Status Indicator */}
                      <div>
                        {site.isRankingVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>{site.rankingStatus}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/90">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>{site.rankingStatus}</span>
                          </span>
                        )}

                        <h3 className="text-xl md:text-2xl font-serif font-black text-amber-100 group-hover:text-amber-200 transition-colors mt-0.5">
                          {site.name}
                        </h3>
                      </div>

                      <p className="text-xs text-amber-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="line-clamp-1">{site.locality}</span>
                      </p>

                      <p className="text-xs md:text-sm text-amber-100/80 line-clamp-2 leading-relaxed">
                        {site.shortSummary}
                      </p>
                    </div>
                  </div>

                  {/* Action Button: Khám phá ngay */}
                  <div className="p-5 pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        heritageAudio.playTempleBell();
                        onSelectSite(site.id);
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-red-800 via-amber-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-serif font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 group-hover:gap-3 transition-all active:scale-95 border border-amber-500/40 cursor-pointer"
                    >
                      <span>Khám phá ngay</span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
