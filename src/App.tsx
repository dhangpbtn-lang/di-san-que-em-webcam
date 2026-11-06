/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeritageSite, StudentProgress, Badge } from './types/heritage';
import { INITIAL_HERITAGE_SITES, INITIAL_BADGES } from './data/defaultHeritageData';
import { Header, AppView } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/home/HomePage';
import { HeritageLibrary } from './components/library/HeritageLibrary';
import { SiteDetailPage } from './components/site/SiteDetailPage';
import { VirtualTourPage } from './components/viewer360/VirtualTourPage';
import { HeritageChallengeHub } from './components/games/HeritageChallengeHub';
import { AchievementsView } from './components/achievements/AchievementsView';
import { AdminPortal } from './components/admin/AdminPortal';
import { heritageAudio } from './utils/audioSystem';
import {
  fetchHeritageSitesFromFirestore,
  saveStudentProgressToFirestore,
  checkRealFirebaseConnection,
  ensureStudentAnonymousSession,
  auth,
  onAuthStateChanged
} from './firebase';

export default function App() {
  // 1. Heritage Sites State (Persisted in localStorage & synced with Firebase Firestore)
  const [sites, setSites] = useState<HeritageSite[]>(() => {
    try {
      const saved = localStorage.getItem('di_san_sites_v7');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_HERITAGE_SITES;
  });

  // Initial Firebase Cloud Connection check without pushing data unconfirmed
  useEffect(() => {
    let isMounted = true;
    async function checkCloud() {
      // Khởi tạo phiên định danh ẩn danh an toàn cho học sinh (nếu Console đã bật Anonymous Auth)
      ensureStudentAnonymousSession().catch(() => {});

      try {
        const cloudSites = await fetchHeritageSitesFromFirestore();
        // Chỉ cập nhật nếu Cloud đã có dữ liệu trước đó
        if (isMounted && cloudSites && cloudSites.length > 0) {
          setSites(cloudSites);
          try {
            localStorage.setItem('di_san_sites_v7', JSON.stringify(cloudSites));
          } catch {}
        }
      } catch (err) {
        // Giữ nguyên dữ liệu cục bộ an toàn
        console.info('Dữ liệu đang hoạt động ở chế độ cục bộ an toàn:', err);
      }
    }
    checkCloud();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save sites whenever updated locally
  useEffect(() => {
    try {
      localStorage.setItem('di_san_sites_v7', JSON.stringify(sites));
    } catch {}
  }, [sites]);

  // 2. Student Progress State (Khởi tạo điểm = 0, không tạo hồ sơ mẫu Nguyễn Hoàng Nam)
  const [progress, setProgress] = useState<StudentProgress>(() => {
    return {
      studentName: '',
      studentSchool: '',
      studentClass: '',
      exploredSites: [],
      decodedHotspots: [],
      audioListened: [],
      quizScores: {},
      jigsawCompleted: [],
      mysteryCompleted: [],
      totalPoints: 0,
      answeredQuestions: {},
    };
  });

  // Đồng bộ tiến độ theo UID người dùng (Bảo vệ dữ liệu, không gán bừa localStorage cũ)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const uidStorageKey = `di_san_progress_${user.uid}`;
        try {
          const savedUidData = localStorage.getItem(uidStorageKey);
          if (savedUidData) {
            setProgress(JSON.parse(savedUidData));
          }
        } catch {}
      } else {
        try {
          const guestData = localStorage.getItem('di_san_guest_progress');
          if (guestData) {
            setProgress(JSON.parse(guestData));
          }
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      const storageKey = auth.currentUser ? `di_san_progress_${auth.currentUser.uid}` : 'di_san_guest_progress';
      localStorage.setItem(storageKey, JSON.stringify(progress));
      if (auth.currentUser && (progress.studentName || progress.exploredSites.length > 0)) {
        saveStudentProgressToFirestore(progress);
      }
    } catch {}
  }, [progress]);

  // 3. Badges Dynamic Status
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);

  useEffect(() => {
    const updated = INITIAL_BADGES.map((b) => {
      let isUnlocked = false;
      if (b.id === 'badge-seed') {
        isUnlocked = progress.exploredSites.length >= 1;
      } else if (b.id === 'badge-explorer') {
        isUnlocked = progress.exploredSites.length >= 5;
      } else if (b.id === 'badge-decoder') {
        isUnlocked = progress.decodedHotspots.length >= 5;
      } else if (b.id === 'badge-scholar') {
        isUnlocked = progress.totalPoints >= 80;
      } else if (b.id === 'badge-puzzle-master') {
        isUnlocked = progress.jigsawCompleted.length >= 1;
      } else if (b.id === 'badge-ambassador') {
        isUnlocked = progress.exploredSites.length >= 5 && progress.totalPoints >= 100;
      }
      return { ...b, unlocked: isUnlocked };
    });
    setBadges(updated);
  }, [progress]);

  // 4. View Navigation State
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('chua-ha');

  // Navigation handlers
  const handleSelectSite = (siteId: string) => {
    setSelectedSiteId(siteId);
    setActiveView('site-detail');
    setProgress((prev) => {
      if (!prev.exploredSites.includes(siteId)) {
        return {
          ...prev,
          exploredSites: [...prev.exploredSites, siteId],
          totalPoints: prev.totalPoints + 15,
        };
      }
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVirtualTourForSite = (siteId: string) => {
    setSelectedSiteId(siteId);
    setActiveView('virtual-tour');
    setProgress((prev) => {
      if (!prev.exploredSites.includes(siteId)) {
        return {
          ...prev,
          exploredSites: [...prev.exploredSites, siteId],
          totalPoints: prev.totalPoints + 15,
        };
      }
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateSiteScenes = (siteId: string, updatedScenes: HeritageSite['scenes360']) => {
    setSites((prev) =>
      prev.map((s) =>
        s.id === siteId
          ? {
              ...s,
              scenes360: updatedScenes,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : s
      )
    );
  };

  const handleRecordHotspotDecoded = (hotspotId: string) => {
    setProgress((prev) => {
      if (!prev.decodedHotspots.includes(hotspotId)) {
        return {
          ...prev,
          decodedHotspots: [...prev.decodedHotspots, hotspotId],
          totalPoints: prev.totalPoints + 10,
        };
      }
      return prev;
    });
  };

  const handleAddPoints = (points: number) => {
    setProgress((prev) => ({
      ...prev,
      totalPoints: prev.totalPoints + points,
    }));
  };

  const handleRecordPuzzleSuccess = (siteId: string) => {
    setProgress((prev) => {
      if (!prev.jigsawCompleted.includes(siteId)) {
        return {
          ...prev,
          jigsawCompleted: [...prev.jigsawCompleted, siteId],
        };
      }
      return prev;
    });
  };

  const handleUpdateStudentInfo = (name: string, school: string, studentClass: string) => {
    setProgress((prev) => ({
      ...prev,
      studentName: name,
      studentSchool: school,
      studentClass: studentClass,
    }));
  };

  const handleResetDefaultSites = () => {
    setSites(INITIAL_HERITAGE_SITES);
    try {
      localStorage.removeItem('di_san_sites_v7');
    } catch {}
  };

  // Find active site for detail view
  const currentSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  return (
    <div className="min-h-screen bg-[#140602] text-amber-50 flex flex-col font-sans selection:bg-amber-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        exploredSitesCount={progress.exploredSites.length}
        totalPoints={progress.totalPoints}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* VIEW 1: HOME */}
        {activeView === 'home' && (
          <HomePage
            sites={sites}
            onSelectSite={handleSelectSite}
            onNavigate={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenVirtualTourForSite={handleOpenVirtualTourForSite}
          />
        )}

        {/* VIEW 2: DEDICATED 360 VIRTUAL TOUR PAGE (Chức năng 2 & Chức năng 3) */}
        {activeView === 'virtual-tour' && (
          <VirtualTourPage
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSelectSiteId={(id) => setSelectedSiteId(id)}
            onUpdateSiteScenes={handleUpdateSiteScenes}
            onRecordHotspotDecoded={handleRecordHotspotDecoded}
            onViewSiteDetail={(id) => {
              setSelectedSiteId(id);
              setActiveView('site-detail');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* VIEW 3: HERITAGE LIBRARY (Chức năng 1) */}
        {activeView === 'library' && (
          <HeritageLibrary
            sites={sites}
            exploredSiteIds={progress.exploredSites}
            onSelectSite={handleSelectSite}
            onOpenVirtualTour={handleOpenVirtualTourForSite}
            onAddPoints={handleAddPoints}
          />
        )}

        {/* VIEW 4: INDIVIDUAL SITE DETAIL (Tư liệu & 360) */}
        {activeView === 'site-detail' && currentSite && (
          <SiteDetailPage
            site={currentSite}
            allSites={sites}
            onBackToLibrary={() => {
              setActiveView('library');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectSite={handleSelectSite}
            onRecordHotspotDecoded={handleRecordHotspotDecoded}
            onOpenVirtualTourMode={handleOpenVirtualTourForSite}
            onUpdateSiteScenes={handleUpdateSiteScenes}
            onAddPoints={handleAddPoints}
          />
        )}

        {/* VIEW 5: HERITAGE CHALLENGE HUB (Chức năng 5) */}
        {activeView === 'challenge' && (
          <HeritageChallengeHub
            sites={sites}
            onAddPoints={handleAddPoints}
            onRecordPuzzleSuccess={handleRecordPuzzleSuccess}
          />
        )}

        {/* VIEW 6: ACHIEVEMENTS & CERTIFICATE (Chức năng 6) */}
        {activeView === 'achievements' && (
          <AchievementsView
            progress={progress}
            sites={sites}
            badges={badges}
            onUpdateStudentInfo={handleUpdateStudentInfo}
          />
        )}

        {/* VIEW 7: TEACHER & ADMIN CMS PORTAL (Quản trị nội dung) */}
        {activeView === 'admin' && (
          <AdminPortal
            sites={sites}
            onUpdateSites={(updated) => setSites(updated)}
            onResetDefault={handleResetDefaultSites}
            onPreviewSite={(siteId) => {
              setSelectedSiteId(siteId);
              setActiveView('site-detail');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
