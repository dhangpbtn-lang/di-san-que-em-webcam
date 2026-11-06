/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BẢNG QUẢN TRỊ NỘI DUNG CMS (ADMIN PORTAL) - DI SẢN QUÊ EM
 * Phiên bản hoàn thiện: Cơ chế Lưu Thay Đổi & Hủy thống nhất,
 * Kiểm soát trạng thái chưa lưu (isDirty), Thanh lưu cố định khi cuộn trang,
 * Bảo vệ chuyển trang, Xác thực Firebase Admin & Cloud Firestore thực tế.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { HeritageSite, Hotspot, QuizQuestion, Scene360 } from '../../types/heritage';
import { heritageAudio } from '../../utils/audioSystem';
import {
  db,
  auth,
  loginWithGoogle,
  loginWithEmailPass,
  createAdminAccount,
  logoutUser,
  saveHeritageSiteToFirestore,
  fetchHeritageSitesFromFirestore,
  deleteHeritageSiteFromFirestore,
  migrateSitesToFirestoreWithConfirmation,
  uploadFileToFirebaseStorage,
  checkRealFirebaseConnection,
  PRIMARY_ADMIN_EMAIL
} from '../../firebase';
import { firebaseConfig } from '../../firebaseConfig';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Upload,
  Layers,
  MapPin,
  Volume2,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Eye,
  LogOut,
  Edit3,
  Cloud,
  CloudUpload,
  RefreshCw,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  ExternalLink,
  HardDrive,
  Copy,
  Info,
  AlertTriangle,
  ArrowRight,
  Radio,
  Compass
} from 'lucide-react';

interface AdminPortalProps {
  sites: HeritageSite[];
  onUpdateSites: (updatedSites: HeritageSite[]) => void;
  onResetDefault: () => void;
  onPreviewSite?: (siteId: string) => void;
}

type AdminTab =
  | 'info'
  | 'sandtable'
  | 'scenes'
  | 'hotspots'
  | 'audio'
  | 'quiz'
  | 'sites-list'
  | 'storage'
  | 'rules-guide'
  | 'backup';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  sites,
  onUpdateSites,
  onResetDefault,
  onPreviewSite,
}) => {
  // ==============================================================
  // 1. AUTHENTICATION & ADMIN ROLE STATE
  // ==============================================================
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(auth.currentUser));
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
  const [isDemoReadOnly, setIsDemoReadOnly] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<string>('');
  const [authMode, setAuthMode] = useState<'google' | 'passcode' | 'email' | 'register'>('google');
  const [passcode, setPasscode] = useState('');
  const [emailInput, setEmailInput] = useState('dhangpbtn@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // ==============================================================
  // 2. REAL FIREBASE CONNECTION CHECK (Không giả lập)
  // ==============================================================
  const [connStatus, setConnStatus] = useState<{
    checked: boolean;
    connected: boolean;
    message: string;
    errorDetail?: string;
  }>({
    checked: false,
    connected: false,
    message: 'Đang kiểm tra kết nối Cloud Firestore...',
  });
  const [isCheckingConn, setIsCheckingConn] = useState(false);

  const performRealConnectionCheck = async () => {
    setIsCheckingConn(true);
    const result = await checkRealFirebaseConnection();
    setConnStatus({
      checked: true,
      connected: result.connected,
      message: result.message,
      errorDetail: result.errorDetail,
    });
    setIsCheckingConn(false);
  };

  useEffect(() => {
    performRealConnectionCheck();
  }, []);

  // Xác thực quyền quản trị viên bằng Google và Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsAuthenticated(true);
        setIsDemoReadOnly(false);

        // 1. Quản trị viên giáo viên trưởng gốc
        if (user.email === PRIMARY_ADMIN_EMAIL && user.emailVerified) {
          setIsAdminVerified(true);
          setAdminRole('Nhóm quản lý dự án (Quản trị chính)');
          try {
            const adminDocRef = doc(db, 'adminUsers', user.uid);
            const snap = await getDoc(adminDocRef);
            if (!snap.exists()) {
              await setDoc(adminDocRef, {
                uid: user.uid,
                email: user.email,
                role: 'super_admin',
                isActive: true,
              });
            }
          } catch (e) {
            console.info('Auto-seed admin profile:', e);
          }
          return;
        }

        // 2. Tra cứu quyền quản trị viên trong adminUsers/{uid}
        try {
          const adminDoc = await getDoc(doc(db, 'adminUsers', user.uid));
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            if (data && data.isActive === true && data.uid === user.uid) {
              setIsAdminVerified(true);
              setAdminRole(data.role === 'super_admin' ? 'Quản trị viên cấp cao' : 'Thành viên nhóm quản lý nội dung');
              return;
            }
          }
        } catch (err) {
          console.warn('Tra cứu quyền admin Firestore:', err);
        }

        // Tài khoản chưa được cấp quyền quản trị
        setIsAdminVerified(false);
        setAdminRole('Tài khoản chưa phân quyền (Chỉ đọc)');
      } else {
        if (!isDemoReadOnly) {
          setIsAuthenticated(false);
          setIsAdminVerified(false);
        }
      }
    });
    return () => unsub();
  }, [isDemoReadOnly]);

  // ==============================================================
  // 3. SELECTION & TABS STATE
  // ==============================================================
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.id || 'chua-ha');
  const [activeTab, setActiveTab] = useState<AdminTab>('info');

  const originalSite = useMemo(() => {
    return sites.find((s) => s.id === selectedSiteId) || sites[0];
  }, [sites, selectedSiteId]);

  // ==============================================================
  // 4. DRAFT STATE & DIRTY CHECKING (CƠ CHẾ LƯU VÀ HỦY THỐNG NHẤT)
  // Không tự động lưu khi giáo viên đang nhập liệu
  // ==============================================================
  const [editingSite, setEditingSite] = useState<HeritageSite>(() => {
    return JSON.parse(JSON.stringify(sites[0] || {}));
  });

  // Khi selectedSiteId thay đổi (sau khi đã kiểm tra guard), tải lại bản nháp từ originalSite
  useEffect(() => {
    if (originalSite) {
      setEditingSite(JSON.parse(JSON.stringify(originalSite)));
      setSaveError('');
      setSaveSuccessMsg('');
    }
  }, [selectedSiteId, sites]);

  // Kiểm tra dữ liệu có thay đổi hay không (isDirty)
  const isDirty = useMemo(() => {
    if (!originalSite || !editingSite) return false;
    return JSON.stringify(editingSite) !== JSON.stringify(originalSite);
  }, [editingSite, originalSite]);

  // Hàm cập nhật trường trong bản nháp (không ghi Firestore trực tiếp)
  const updateDraftField = <K extends keyof HeritageSite>(field: K, value: HeritageSite[K]) => {
    setEditingSite((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveError('');
  };

  // ==============================================================
  // 5. CẢNH BÁO XÁC NHẬN KHI RỜI BIỂU MẪU CHƯA LƯU (TAB / SITE GUARD)
  // ==============================================================
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: 'tab' | 'site';
    target: string;
  } | null>(null);
  const [showUnsavedPromptModal, setShowUnsavedPromptModal] = useState(false);

  const requestTabChange = (tab: AdminTab) => {
    if (tab === activeTab) return;
    if (isDirty) {
      setPendingNavigation({ type: 'tab', target: tab });
      setShowUnsavedPromptModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const requestSiteChange = (siteId: string) => {
    if (siteId === selectedSiteId) return;
    if (isDirty) {
      setPendingNavigation({ type: 'site', target: siteId });
      setShowUnsavedPromptModal(true);
    } else {
      setSelectedSiteId(siteId);
    }
  };

  const handleDiscardAndNavigate = () => {
    if (!pendingNavigation) {
      setShowUnsavedPromptModal(false);
      return;
    }
    // Hủy bỏ thay đổi: khôi phục về bản gốc
    if (originalSite) {
      setEditingSite(JSON.parse(JSON.stringify(originalSite)));
    }
    if (pendingNavigation.type === 'tab') {
      setActiveTab(pendingNavigation.target as AdminTab);
    } else if (pendingNavigation.type === 'site') {
      setSelectedSiteId(pendingNavigation.target);
    }
    setPendingNavigation(null);
    setShowUnsavedPromptModal(false);
  };

  // ==============================================================
  // 6. THAO TÁC LƯU THAY ĐỔI & HỦY THAY ĐỔI
  // ==============================================================
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleCancelChanges = () => {
    if (!originalSite) return;
    setEditingSite(JSON.parse(JSON.stringify(originalSite)));
    setSaveError('');
    showToast('Đã hủy bỏ các thay đổi và khôi phục nội dung ban đầu.');
  };

  const handleSaveSiteChanges = async (): Promise<boolean> => {
    setSaveError('');
    setSaveSuccessMsg('');

    // 1. Kiểm tra xác thực quyền quản trị viên
    if (!isAdminVerified) {
      setSaveError(
        `Thao tác bị từ chối: Nhóm quản lý cần đăng nhập tài khoản Google Quản trị viên (${PRIMARY_ADMIN_EMAIL}) để ghi dữ liệu lên Cloud Firestore. Mã giaovien2025 chỉ hoạt động ở chế độ xem trước (Chỉ đọc).`
      );
      return false;
    }

    // 2. Kiểm tra các trường dữ liệu bắt buộc
    if (!editingSite.name.trim()) {
      setSaveError('Tên di tích không được để trống!');
      return false;
    }
    if (!editingSite.locality.trim()) {
      setSaveError('Địa chỉ hành chính của di tích không được để trống!');
      return false;
    }
    if (!editingSite.shortSummary.trim()) {
      setSaveError('Tóm tắt ngắn di tích không được để trống!');
      return false;
    }
    if (!editingSite.coverImage.trim()) {
      setSaveError('Ảnh đại diện di tích không được để trống!');
      return false;
    }

    setIsSaving(true);
    try {
      const siteToSave: HeritageSite = {
        ...editingSite,
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      // 3. Ghi trực tiếp vào Cloud Firestore
      await saveHeritageSiteToFirestore(siteToSave);

      // 4. Cập nhật state cha
      const updatedList = sites.map((s) => (s.id === siteToSave.id ? siteToSave : s));
      onUpdateSites(updatedList);
      setEditingSite(siteToSave);

      // 5. Tải lại dữ liệu từ Cloud Firestore để xác minh lưu thành công
      try {
        const verifiedSites = await fetchHeritageSitesFromFirestore();
        if (verifiedSites && verifiedSites.length > 0) {
          onUpdateSites(verifiedSites);
        }
      } catch (verifyErr) {
        console.warn('Xác minh dữ liệu tải lại:', verifyErr);
      }

      heritageAudio.playFanfare();
      const successMessage = `LƯU THÀNH CÔNG: Dữ liệu di tích "${siteToSave.name}" đã được ghi nhận và đồng bộ trên Cloud Firestore!`;
      setSaveSuccessMsg(successMessage);
      showToast(successMessage);
      setTimeout(() => setSaveSuccessMsg(''), 7000);
      return true;
    } catch (err: unknown) {
      console.error('Lỗi khi lưu di tích lên Cloud Firestore:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setSaveError(
        `LƯU THẤT BẠI: ${errMsg}. Toàn bộ nội dung nhóm quản lý vừa chỉnh sửa vẫn được giữ nguyên để thử lại.`
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNavigate = async () => {
    const success = await handleSaveSiteChanges();
    if (success && pendingNavigation) {
      if (pendingNavigation.type === 'tab') {
        setActiveTab(pendingNavigation.target as AdminTab);
      } else if (pendingNavigation.type === 'site') {
        setSelectedSiteId(pendingNavigation.target);
      }
      setPendingNavigation(null);
      setShowUnsavedPromptModal(false);
    }
  };

  // ==============================================================
  // 7. THÊM DI TÍCH MỚI (NÚT LƯU DI TÍCH MỚI RIÊNG BIỆT)
  // ==============================================================
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteType, setNewSiteType] = useState<'Chùa' | 'Đình' | 'Cụm di tích'>('Chùa');
  const [newSiteLocality, setNewSiteLocality] = useState('Xã Phú Bình, tỉnh Thái Nguyên');
  const [newSiteSummary, setNewSiteSummary] = useState('');
  const [newSiteDesc, setNewSiteDesc] = useState('');
  const [newSiteTourUrl, setNewSiteTourUrl] = useState('');
  const [isSavingNewSite, setIsSavingNewSite] = useState(false);
  const [addSiteError, setAddSiteError] = useState('');

  const handleAddNewSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSiteError('');

    if (!newSiteName.trim()) {
      setAddSiteError('Vui lòng nhập tên di tích!');
      return;
    }
    if (!newSiteLocality.trim()) {
      setAddSiteError('Vui lòng nhập địa chỉ di tích!');
      return;
    }
    if (!newSiteSummary.trim()) {
      setAddSiteError('Vui lòng nhập tóm tắt giới thiệu ngắn!');
      return;
    }

    if (!isAdminVerified) {
      setAddSiteError(
        `Thao tác bị từ chối: Nhóm quản lý cần đăng nhập tài khoản Google Quản trị viên (${PRIMARY_ADMIN_EMAIL}) để thêm di tích lên Cloud Firestore.`
      );
      return;
    }

    setIsSavingNewSite(true);
    try {
      const newId =
        newSiteName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 40) + `-${Date.now().toString().slice(-4)}`;

      const newSite: HeritageSite = {
        id: newId,
        name: newSiteName.trim(),
        type: newSiteType,
        locality: newSiteLocality.trim(),
        rankingStatus: 'Nội dung đang cập nhật (Đang xác minh hồ sơ)',
        isRankingVerified: false,
        period: 'Nội dung đang cập nhật',
        isPeriodVerified: false,
        shortSummary: newSiteSummary.trim(),
        fullDescription:
          newSiteDesc.trim() ||
          'Thông tin lịch sử và kiến trúc đang được Ban quản lý và nhà trường cập nhật.',
        architectureOverview: 'Kiến trúc truyền thống Việt Nam.',
        artisticSignificance: 'Nghệ thuật điêu khắc hoa văn truyền thống.',
        coverImage: sites[0]?.coverImage || '',
        externalTourUrl: newSiteTourUrl.trim() || undefined,
        gallery: [],
        scenes360: [],
        audioGuide: {
          title: `Thuyết minh giới thiệu ${newSiteName.trim()}`,
          transcript: 'Nội dung bài thuyết minh đang được cập nhật.',
        },
        quizQuestions: [],
        isPublished: true,
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      await saveHeritageSiteToFirestore(newSite);

      const updatedSites = [...sites, newSite];
      onUpdateSites(updatedSites);
      setSelectedSiteId(newId);
      setShowAddSiteModal(false);

      // Reset form
      setNewSiteName('');
      setNewSiteSummary('');
      setNewSiteDesc('');
      setNewSiteTourUrl('');

      // Tải lại xác minh
      try {
        const verified = await fetchHeritageSitesFromFirestore();
        if (verified && verified.length > 0) onUpdateSites(verified);
      } catch {}

      heritageAudio.playFanfare();
      showToast(`LƯU THÀNH CÔNG: Đã thêm và lưu di tích "${newSite.name}" lên Cloud Firestore!`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAddSiteError(`Lỗi thêm di tích: ${errMsg}`);
    } finally {
      setIsSavingNewSite(false);
    }
  };

  // ==============================================================
  // 8. XÓA DI TÍCH (XÁC NHẬN XÓA RIÊNG BIỆT - KHÔNG DÙNG NÚT LƯU)
  // ==============================================================
  const [sitePendingDelete, setSitePendingDelete] = useState<HeritageSite | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const requestDeleteSite = (site: HeritageSite) => {
    if (sites.length <= 1) {
      alert('Hệ thống cần lưu giữ ít nhất 1 di tích. Không thể xóa hết toàn bộ!');
      return;
    }
    setSitePendingDelete(site);
    setDeleteError('');
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!sitePendingDelete) return;

    if (!isAdminVerified) {
      setDeleteError(
        `Thao tác bị từ chối: Nhóm quản lý cần đăng nhập tài khoản Google Quản trị viên (${PRIMARY_ADMIN_EMAIL}) để xóa di tích khỏi Cloud Firestore.`
      );
      return;
    }

    setIsDeleting(true);
    try {
      await deleteHeritageSiteFromFirestore(sitePendingDelete.id);

      const remaining = sites.filter((s) => s.id !== sitePendingDelete.id);
      onUpdateSites(remaining);
      setSelectedSiteId(remaining[0].id);
      setShowDeleteConfirmModal(false);
      setSitePendingDelete(null);

      // Tải lại xác minh
      try {
        const verified = await fetchHeritageSitesFromFirestore();
        if (verified && verified.length > 0) onUpdateSites(verified);
      } catch {}

      showToast(`Đã xóa vĩnh viễn di tích "${sitePendingDelete.name}" khỏi hệ thống!`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setDeleteError(`Lỗi khi xóa di tích: ${errMsg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // ==============================================================
  // 9. FIREBASE STORAGE & UPLOAD QUẢN LÝ TỆP TIN
  // ==============================================================
  const [uploadFolder, setUploadFolder] = useState<'images' | 'audio' | 'panoramas' | 'certificates'>(
    'images'
  );
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  const handleFileUploadToStorage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folderOverride?: typeof uploadFolder,
    applyToField?: 'coverImage' | 'audio' | 'newPanorama'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    const targetFolder = folderOverride || uploadFolder;

    try {
      setUploadProgress(0);
      const url = await uploadFileToFirebaseStorage(file, targetFolder, (progress) => {
        setUploadProgress(progress);
      });
      setUploadedUrl(url);
      setUploadProgress(100);
      showToast(`Tải tệp "${file.name}" lên Firebase Storage thành công!`);

      // Tự động gán vào bản nháp (marks isDirty)
      if (applyToField === 'coverImage') {
        updateDraftField('coverImage', url);
        showToast('Đã cập nhật ảnh đại diện mới vào bản nháp. Nhấn "LƯU THAY ĐỔI" để hoàn tất.');
      } else if (applyToField === 'audio') {
        updateDraftField('audioGuide', {
          ...editingSite.audioGuide,
          fileUrl: url,
          title: `Thuyết minh MP3 (${file.name})`,
        });
        showToast('Đã gán file MP3 vào bản nháp. Nhấn "LƯU THAY ĐỔI" để hoàn tất.');
      } else if (applyToField === 'newPanorama') {
        const newScene: Scene360 = {
          id: `scene-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          imageUrl: url,
          hotspots: [],
        };
        updateDraftField('scenes360', [...editingSite.scenes360, newScene]);
        showToast('Đã thêm không gian 360° mới vào bản nháp. Nhấn "LƯU THAY ĐỔI" để hoàn tất.');
      }
    } catch (err: unknown) {
      console.error('Lỗi tải file lên Firebase Storage:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(`Tải tệp lên Firebase Storage thất bại: ${msg}`);
      setUploadProgress(null);
    }
  };

  // ==============================================================
  // 10. GIẢI MÃ KIẾN TRÚC & NGÂN HÀNG CÂU HỎI LOCAL MUTATIONS
  // ==============================================================
  // Hotspot Draft
  const [newHotspotTitle, setNewHotspotTitle] = useState('');
  const [newHotspotPart, setNewHotspotPart] = useState('');
  const [newHotspotArt, setNewHotspotArt] = useState('');
  const [newHotspotExp, setNewHotspotExp] = useState('');

  const handleAddHotspotToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotspotTitle.trim()) return;

    const newHs: Hotspot = {
      id: `hs-${Date.now()}`,
      title: newHotspotTitle.trim(),
      architecturalPart: newHotspotPart.trim() || 'Chi tiết kiến trúc',
      artisticValue: newHotspotArt.trim() || 'Đang cập nhật giá trị nghệ thuật',
      explanation: newHotspotExp.trim() || 'Đang cập nhật lời giải thích',
      detailedImage: editingSite.coverImage,
      yaw: 0,
      pitch: 0,
    };

    if (editingSite.scenes360.length === 0) {
      // Tự động tạo scene mặc định nếu chưa có
      const defaultScene: Scene360 = {
        id: `scene-main-${editingSite.id}`,
        name: 'Toàn cảnh chính',
        imageUrl: editingSite.coverImage,
        hotspots: [newHs],
      };
      updateDraftField('scenes360', [defaultScene]);
    } else {
      const updatedScenes = editingSite.scenes360.map((sc, idx) => {
        if (idx === 0) {
          return { ...sc, hotspots: [...sc.hotspots, newHs] };
        }
        return sc;
      });
      updateDraftField('scenes360', updatedScenes);
    }

    setNewHotspotTitle('');
    setNewHotspotPart('');
    setNewHotspotArt('');
    setNewHotspotExp('');
    showToast('Đã thêm điểm giải mã vào bản nháp. Nhấn "LƯU THAY ĐỔI" để lưu lên Cloud!');
  };

  const handleDeleteHotspotFromDraft = (hotspotId: string) => {
    const updatedScenes = editingSite.scenes360.map((sc) => ({
      ...sc,
      hotspots: sc.hotspots.filter((h) => h.id !== hotspotId),
    }));
    updateDraftField('scenes360', updatedScenes);
    showToast('Đã xóa điểm giải mã khỏi bản nháp. Nhấn "LƯU THAY ĐỔI" để lưu lên Cloud.');
  };

  // Quiz Draft
  const [newQText, setNewQText] = useState('');
  const [newQOpts, setNewQOpts] = useState(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQExp, setNewQExp] = useState('');

  const handleAddQuestionToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || newQOpts.some((o) => !o.trim())) {
      alert('Vui lòng điền đầy đủ nội dung câu hỏi và 4 đáp án lựa chọn!');
      return;
    }

    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      siteId: editingSite.id,
      question: newQText.trim(),
      options: [...newQOpts],
      correctIndex: newQCorrect,
      explanation: newQExp.trim() || 'Kiến thức về di tích lịch sử địa phương.',
      category: 'kiến trúc',
    };

    updateDraftField('quizQuestions', [...editingSite.quizQuestions, newQuestion]);
    setNewQText('');
    setNewQOpts(['', '', '', '']);
    setNewQExp('');
    showToast('Đã thêm câu hỏi vào bộ câu hỏi bản nháp. Nhấn "LƯU THAY ĐỔI" để lưu lên Cloud!');
  };

  const handleDeleteQuestionFromDraft = (qId: string) => {
    const remaining = editingSite.quizQuestions.filter((q) => q.id !== qId);
    updateDraftField('quizQuestions', remaining);
    showToast('Đã xóa câu hỏi khỏi bản nháp. Nhấn "LƯU THAY ĐỔI" để lưu lên Cloud.');
  };

  // Cloud Migration Modal (Sao Lưu)
  const [showMigrateConfirmModal, setShowMigrateConfirmModal] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const handleConfirmMigrationToFirestore = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateSitesToFirestoreWithConfirmation(sites);
      setShowMigrateConfirmModal(false);
      showToast(`Đã chuyển thành công toàn bộ ${result.successCount} di tích sang Cloud Firestore!`);
      performRealConnectionCheck();
    } catch (err: unknown) {
      console.error('Lỗi khi chuyển dữ liệu sang Firestore:', err);
      alert(
        'Không thể hoàn tất chuyển dữ liệu lên Firestore. Vui lòng kiểm tra quyền quản trị Google.'
      );
    } finally {
      setIsMigrating(false);
    }
  };

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      setIsAuthenticated(true);
      heritageAudio.playFanfare();
      showToast(`Chào mừng Thầy Cô ${user.displayName || user.email}!`);
    } catch (err: unknown) {
      console.error('Google Sign-in error:', err);
      setAuthError('Không thể đăng nhập bằng Google. Nhóm quản lý có thể thử lại hoặc đăng nhập bằng Email/Mật khẩu.');
    }
  };

  const handleEmailPassSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'register') {
        const user = await createAdminAccount(emailInput, passwordInput);
        setCurrentUser(user);
        setIsAuthenticated(true);
        heritageAudio.playFanfare();
        showToast(`Đã tạo tài khoản và đăng nhập thành công cho ${user.email}!`);
      } else {
        const user = await loginWithEmailPass(emailInput, passwordInput);
        setCurrentUser(user);
        setIsAuthenticated(true);
        heritageAudio.playFanfare();
        showToast(`Chào mừng trở lại, ${user.email}!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('user-not-found') ||
        msg.includes('wrong-password') ||
        msg.includes('invalid-credential')
      ) {
        setAuthError('Email hoặc mật khẩu không chính xác. Nhóm quản lý có thể chuyển sang tạo tài khoản mới.');
      } else if (msg.includes('email-already-in-use')) {
        setAuthError('Email này đã được đăng ký. Nhóm quản lý vui lòng chọn Đăng nhập.');
      } else {
        setAuthError(`Lỗi xác thực: ${msg}`);
      }
    }
  };

  const handlePasscodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'giaovien2025' || passcode === 'disanqueem' || passcode === 'admin123') {
      setIsAuthenticated(true);
      setIsDemoReadOnly(true);
      setIsAdminVerified(false);
      setAdminRole('Chế độ xem trước (Chỉ đọc)');
      setAuthError('');
      heritageAudio.playFanfare();
      showToast(
        'Đã vào chế độ xem trước (Chỉ đọc). Mã giaovien2025 không có quyền ghi dữ liệu lên Cloud!'
      );
    } else {
      setAuthError('Mã xác thực không đúng. Nhóm quản lý vui lòng thử lại!');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    setIsAuthenticated(false);
    setIsAdminVerified(false);
    setIsDemoReadOnly(false);
    setCurrentUser(null);
    showToast('Đã đăng xuất khỏi cổng quản trị.');
  };

  // ==============================================================
  // 11. MÀN HÌNH ĐĂNG NHẬP NẾU CHƯA XÁC THỰC
  // ==============================================================
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-lg mx-auto my-10 p-6 sm:p-8 bg-[#200e08] border-2 border-amber-600/60 rounded-3xl text-amber-100 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
            DÀNH CHO NHÓM HỌC SINH QUẢN LÝ DỰ ÁN
          </span>
          <h2 className="text-2xl font-serif font-bold text-amber-200">
            Cổng Quản Trị Hệ Thống (CMS)
          </h2>
          <p className="text-xs text-amber-300/80">
            Dự án Firebase Cloud:{' '}
            <code className="bg-stone-900 px-1.5 py-0.5 rounded text-amber-400 font-mono">
              {firebaseConfig.projectId}
            </code>
          </p>
        </div>

        {/* Trạng thái kết nối Firebase thực tế */}
        <div className="p-3 bg-stone-950/80 border border-amber-900/60 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connStatus.connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-amber-200 font-medium">Trạng thái Firebase:</span>
          </div>
          <span
            className={`text-[11px] font-semibold ${
              connStatus.connected ? 'text-emerald-400' : 'text-amber-300'
            }`}
          >
            {connStatus.checked
              ? connStatus.connected
                ? 'Đã kết nối máy chủ'
                : 'Sẵn sàng cấu hình'
              : 'Đang kiểm tra...'}
          </span>
        </div>

        {/* 1-Click Google Sign-in */}
        <div className="space-y-3 p-4 bg-stone-900/90 border border-amber-600/40 rounded-2xl">
          <p className="text-xs font-semibold text-amber-300 text-center">
            Đăng nhập Google của nhóm quản lý
          </p>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3 bg-white hover:bg-slate-100 text-stone-900 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Đăng nhập với Google ({PRIMARY_ADMIN_EMAIL})</span>
          </button>
        </div>

        {/* Tab switch giữa Email/Password & Passcode */}
        <div className="flex border-b border-amber-900/60 pb-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setAuthMode('passcode')}
            className={`pb-1 px-3 font-semibold transition-colors ${
              authMode === 'passcode'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-amber-300/60'
            }`}
          >
            Mã quản trị viên
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('email')}
            className={`pb-1 px-3 font-semibold transition-colors ${
              authMode === 'email'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-amber-300/60'
            }`}
          >
            Firebase Email/Password
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`pb-1 px-3 font-semibold transition-colors ${
              authMode === 'register'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-amber-300/60'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {authError && (
          <p className="text-xs text-red-400 font-medium bg-red-950/60 p-3 rounded-lg border border-red-800">
            {authError}
          </p>
        )}

        {/* Form Email / Password */}
        {(authMode === 'email' || authMode === 'register') && (
          <form onSubmit={handleEmailPassSignIn} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Email quản trị viên:
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="giaovien@gmail.com"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Mật khẩu:
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              {authMode === 'register' ? 'Tạo tài khoản quản trị mới' : 'Đăng nhập Firebase'}
            </button>
          </form>
        )}

        {/* Form Passcode */}
        {authMode === 'passcode' && (
          <form onSubmit={handlePasscodeLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Mã xác thực quản trị (Xem trước):
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Nhập mã..."
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              Mở cổng quản trị (Xem trước)
            </button>
          </form>
        )}
      </div>
    );
  }

  // ==============================================================
  // 12. GIAO DIỆN CHÍNH CỦA BẢNG QUẢN TRỊ CMS (KHI ĐÃ ĐĂNG NHẬP)
  // ==============================================================
  return (
    <div className="w-full max-w-7xl mx-auto my-6 p-4 sm:p-6 md:p-8 bg-[#1a0a05] border-2 border-amber-700/60 rounded-3xl text-amber-100 shadow-2xl space-y-6 relative pb-28">
      {/* Toast thông báo chung */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900/95 border-2 border-amber-500 text-amber-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* TOP HEADER: Trạng thái kết nối, User Info & Site Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-800/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isAdminVerified
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAdminVerified ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {isAdminVerified
                  ? `Admin: ${currentUser?.email} (${adminRole})`
                  : 'Chế độ xem trước (Chỉ đọc)'}
              </span>

              {/* Huy hiệu kết nối thật */}
              <button
                type="button"
                onClick={performRealConnectionCheck}
                title="Nhấn để kiểm tra kết nối lại"
                className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1 transition-colors ${
                  connStatus.connected
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                    : 'bg-amber-950/80 text-amber-300 border-amber-700'
                }`}
              >
                <Cloud className={`w-3 h-3 ${isCheckingConn ? 'animate-spin' : ''}`} />
                <span>
                  {connStatus.checked
                    ? connStatus.connected
                      ? `Firebase (${firebaseConfig.projectId}): Đã kết nối`
                      : `Firebase (${firebaseConfig.projectId}): Ngoại tuyến`
                    : 'Đang kiểm tra kết nối...'}
                </span>
              </button>
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-amber-200">
              Bảng Quản Trị Hệ Thống Di Sản Quê Em (CMS)
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Xem trước di tích đang chọn */}
          {onPreviewSite && editingSite && (
            <button
              type="button"
              onClick={() => onPreviewSite(editingSite.id)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
              title="Xem trước trang hiển thị của di tích này như học sinh xem"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước</span>
            </button>
          )}

          {/* Nút Thêm Di Tích Mới */}
          <button
            type="button"
            onClick={() => setShowAddSiteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-semibold rounded-xl border border-amber-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm di tích</span>
          </button>

          {/* Select di tích hiện tại (với Navigation Guard) */}
          <select
            value={selectedSiteId}
            onChange={(e) => requestSiteChange(e.target.value)}
            className="px-3.5 py-2 bg-stone-900 border border-amber-700 rounded-xl text-amber-200 text-xs md:text-sm font-semibold focus:outline-hidden"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type}) {s.isPublished ? '✓' : '(Nháp)'}
              </option>
            ))}
          </select>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs rounded-xl border border-amber-800/60"
            title="Đăng xuất khỏi khu vực quản trị"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </div>

      {/* Banner cảnh báo quyền ghi CMS nếu chưa xác thực Google */}
      {!isAdminVerified && (
        <div className="p-3.5 bg-amber-950/80 border-2 border-amber-500/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Chế độ xem trước (Chỉ đọc):</strong> Bạn đang truy cập bằng mã nội bộ. Mã{' '}
              <code className="bg-stone-900 px-1 py-0.5 rounded text-amber-300">giaovien2025</code>{' '}
              không có quyền ghi dữ liệu lên Cloud Firestore. Nhóm quản lý hãy đăng nhập tài khoản Google để thực hiện lưu thay đổi.
            </span>
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl shrink-0 shadow-md transition-transform active:scale-95"
          >
            Đăng nhập Google để Lưu
          </button>
        </div>
      )}

      {/* THANH ĐIỀU HƯỚNG TABS (CÓ NAVIGATION GUARD KIỂM TRA isDirty) */}
      <div className="flex flex-wrap gap-2 border-b border-amber-900/40 pb-3">
        <button
          type="button"
          onClick={() => requestTabChange('info')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'info'
              ? 'bg-amber-700 text-white shadow-md'
              : 'bg-stone-900/60 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Sửa Di Tích</span>
        </button>

        <button
          type="button"
          onClick={() => requestTabChange('sandtable')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'sandtable'
              ? 'bg-amber-700 text-white shadow-md'
              : 'bg-stone-900/60 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Quản Lý Sa Bàn 3D</span>
        </button>

        <button
          type="button"
          onClick={() => requestTabChange('sites-list')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'sites-list'
              ? 'bg-amber-700 text-white shadow-md'
              : 'bg-stone-900/60 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Danh Sách 5 Di Tích ({sites.length})</span>
        </button>

        <button
          type="button"
          onClick={() => requestTabChange('scenes')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'scenes'
              ? 'bg-amber-700 text-white shadow-md'
              : 'bg-stone-900/60 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Ảnh 360° & Tour VR</span>
        </button>

        <button
          type="button"
          onClick={() => requestTabChange('hotspots')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'hotspots'
              ? 'bg-amber-700 text-white shadow-md'
              : 'bg-stone-900/60 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Giải Mã Kiến Trúc</span>
        </button>

        <button
          type="button"
          onClick={() => requestTabChange('audio')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'audio'
              ? 'bg-amber-700 text-white shadow-md'
              : 'bg-stone-900/60 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Thuyết Minh MP3</span>
        </button>

        <button
          type="button"
          onClick={() => requestTabChange('quiz')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'quiz'
              ? 'bg-amber-700 text-white shadow-md'
              : 'bg-stone-900/60 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Ngân Hàng Câu Hỏi ({editingSite?.quizQuestions?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => requestTabChange('storage')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'storage'
              ? 'bg-amber-700 text-white shadow-md'
              : 'bg-stone-900/60 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Firebase Storage</span>
        </button>

        <button
          type="button"
          onClick={() => requestTabChange('rules-guide')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'rules-guide'
              ? 'bg-amber-700 text-white shadow-md'
              : 'bg-stone-900/60 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Hướng Dẫn Security Rules</span>
        </button>

        <button
          type="button"
          onClick={() => requestTabChange('backup')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'backup'
              ? 'bg-amber-700 text-white shadow-md'
              : 'bg-stone-900/60 text-amber-300/80 hover:bg-stone-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Chuyển Firestore (Xác Nhận)</span>
        </button>
      </div>

      {/* ==============================================================
          THANH ĐIỀU KHIỂN LƯU / HỦY Ở ĐẦU FORM (TOP ACTION BAR)
          ============================================================== */}
      <div className="p-4 bg-stone-950/80 border-2 border-amber-600/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-200 text-sm">
              Di tích đang biên tập: {editingSite.name} ({editingSite.type})
            </span>
            {isDirty ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Có thay đổi chưa lưu
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                Đã đồng bộ với Cloud
              </span>
            )}
          </div>
          <p className="text-xs text-amber-300/70">
            Dữ liệu được giữ trong bản nháp cục bộ và chỉ ghi lên Cloud Firestore khi nhóm quản lý nhấn "LƯU THAY ĐỔI".
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Nút Hủy Thay Đổi */}
          <button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={handleCancelChanges}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              isDirty && !isSaving
                ? 'bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-700 shadow-md cursor-pointer'
                : 'bg-stone-900/40 text-stone-500 border border-stone-800 cursor-not-allowed opacity-50'
            }`}
            title="Khôi phục lại nội dung đã lưu ban đầu"
          >
            <X className="w-4 h-4" />
            <span>HỦY</span>
          </button>

          {/* Nút Lưu Thay Đổi */}
          <button
            type="button"
            disabled={!isDirty || isSaving || !isAdminVerified}
            onClick={() => handleSaveSiteChanges()}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg transition-transform active:scale-95 ${
              isDirty && !isSaving && isAdminVerified
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 ring-2 ring-amber-400/50 cursor-pointer'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60 border border-stone-700'
            }`}
            title={
              !isAdminVerified
                ? 'Cần đăng nhập Google Quản trị viên để lưu dữ liệu'
                : !isDirty
                ? 'Chưa có thay đổi nào cần lưu'
                : 'Nhấn để lưu tất cả thay đổi lên Cloud Firestore'
            }
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                <span>Đang ghi Cloud...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>LƯU THAY ĐỔI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thông báo LƯU THÀNH CÔNG hoặc LƯU THẤT BẠI */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-lg animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-red-950/90 border-2 border-red-500 text-red-200 rounded-2xl flex items-center gap-2.5 text-xs font-medium shadow-lg animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ==============================================================
          TAB 1: THÔNG TIN DI TÍCH (SỬA & XUẤT BẢN)
          ============================================================== */}
      {activeTab === 'info' && editingSite && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-amber-950/30 border border-amber-600/40 rounded-2xl text-xs text-amber-200">
            <div>
              <p className="font-bold text-amber-400">
                Chỉnh sửa thông tin hồ sơ di tích: {editingSite.name} ({editingSite.type})
              </p>
              <p className="text-amber-300/80 mt-0.5">
                Cập nhật thông tin lịch sử đã được kiểm chứng. Các trường chưa xác thực giữ nguyên "Nội dung đang cập nhật".
              </p>
            </div>

            {/* Trạng thái xuất bản (Đã xuất bản / Bản nháp) */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-amber-300">Trạng thái:</span>
              <button
                type="button"
                onClick={() => updateDraftField('isPublished', !editingSite.isPublished)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors ${
                  editingSite.isPublished
                    ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                    : 'bg-stone-800 text-amber-400 border border-amber-700 hover:bg-stone-700'
                }`}
              >
                {editingSite.isPublished ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã xuất bản (Học sinh xem được)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Bản nháp (Đang ẩn với học sinh)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Tên di tích: *
              </label>
              <input
                type="text"
                value={editingSite.name}
                onChange={(e) => updateDraftField('name', e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Phân loại di tích:
              </label>
              <select
                value={editingSite.type}
                onChange={(e) =>
                  updateDraftField('type', e.target.value as HeritageSite['type'])
                }
                className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              >
                <option value="Chùa">Chùa</option>
                <option value="Đình">Đình</option>
                <option value="Cụm di tích">Cụm di tích</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Địa chỉ hành chính (Mô hình 2 cấp chuẩn): *
              </label>
              <input
                type="text"
                value={editingSite.locality}
                onChange={(e) => updateDraftField('locality', e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Đường dẫn Tour 360° thực tế ảo (vd: Link Netlify):
              </label>
              <input
                type="url"
                value={editingSite.externalTourUrl || ''}
                placeholder="https://resplendent-kangaroo-7b6b7f.netlify.app/"
                onChange={(e) => updateDraftField('externalTourUrl', e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Cấp xếp hạng di tích:
              </label>
              <input
                type="text"
                value={editingSite.rankingStatus}
                onChange={(e) => updateDraftField('rankingStatus', e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
              <label className="flex items-center gap-2 mt-1.5 text-xs text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSite.isRankingVerified}
                  onChange={(e) => updateDraftField('isRankingVerified', e.target.checked)}
                  className="accent-amber-500 rounded"
                />
                <span>Đã có văn bản xếp hạng chính thức</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Niên đại khởi dựng / Trùng tu:
              </label>
              <input
                type="text"
                value={editingSite.period}
                onChange={(e) => updateDraftField('period', e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
              <label className="flex items-center gap-2 mt-1.5 text-xs text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSite.isPeriodVerified}
                  onChange={(e) => updateDraftField('isPeriodVerified', e.target.checked)}
                  className="accent-amber-500 rounded"
                />
                <span>Đã xác minh qua văn bia hoặc thư tịch cổ</span>
              </label>
            </div>

            {/* Ảnh đại diện & Tải lên Storage */}
            <div className="md:col-span-2 space-y-2 p-3 bg-stone-950/70 border border-amber-800/60 rounded-xl">
              <label className="block text-xs font-semibold text-amber-300">
                Ảnh đại diện di tích (URL hoặc Tải lên Firebase Storage): *
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  type="text"
                  value={editingSite.coverImage}
                  onChange={(e) => updateDraftField('coverImage', e.target.value)}
                  placeholder="https://... hoặc data:image/svg+xml..."
                  className="flex-1 w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100 font-mono"
                />
                <label className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl cursor-pointer shrink-0 shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh lên Storage</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUploadToStorage(e, 'images', 'coverImage')}
                  />
                </label>
              </div>

              {editingSite.coverImage && (
                <div className="h-28 w-44 rounded-xl overflow-hidden border border-amber-700/60 bg-black mt-2">
                  <img
                    src={editingSite.coverImage}
                    alt={editingSite.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Tóm tắt ngắn (Hiển thị tại Thư viện Di tích): *
              </label>
              <input
                type="text"
                value={editingSite.shortSummary}
                onChange={(e) => updateDraftField('shortSummary', e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Bài giới thiệu chi tiết (Lịch sử, tín ngưỡng & bối cảnh):
              </label>
              <textarea
                rows={4}
                value={editingSite.fullDescription}
                onChange={(e) => updateDraftField('fullDescription', e.target.value)}
                className="w-full p-3.5 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Đặc điểm kiến trúc tổng quan:
              </label>
              <textarea
                rows={3}
                value={editingSite.architectureOverview}
                onChange={(e) => updateDraftField('architectureOverview', e.target.value)}
                className="w-full p-3.5 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Giá trị nghệ thuật & mảng chạm khắc:
              </label>
              <textarea
                rows={3}
                value={editingSite.artisticSignificance}
                onChange={(e) => updateDraftField('artisticSignificance', e.target.value)}
                className="w-full p-3.5 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 2: DANH SÁCH 5 DI TÍCH (QUẢN LÝ THÊM/SỬA/XÓA)
          ============================================================== */}
      {activeTab === 'sites-list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-amber-200">
              Danh sách di tích hiện có trong hệ thống ({sites.length}):
            </h4>
            <button
              type="button"
              onClick={() => setShowAddSiteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm di tích mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.map((s, idx) => (
              <div
                key={s.id}
                className={`p-4 rounded-2xl border transition-all ${
                  s.id === selectedSiteId
                    ? 'bg-amber-950/40 border-amber-500 shadow-md'
                    : 'bg-stone-900/70 border-amber-800/50 hover:border-amber-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-900/60 text-amber-300">
                      #{idx + 1} • {s.type}
                    </span>
                    <h5 className="font-serif font-bold text-base text-amber-100 mt-1">{s.name}</h5>
                    <p className="text-xs text-amber-300/80">{s.locality}</p>
                    <p className="text-xs text-stone-400 mt-1 line-clamp-2">{s.shortSummary}</p>
                  </div>

                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.isPublished
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-stone-800 text-stone-400 border border-stone-600'
                    }`}
                  >
                    {s.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-amber-900/40">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        requestSiteChange(s.id);
                        requestTabChange('info');
                      }}
                      className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg cursor-pointer"
                    >
                      Sửa nội dung
                    </button>

                    {onPreviewSite && (
                      <button
                        type="button"
                        onClick={() => onPreviewSite(s.id)}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs rounded-lg border border-amber-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Xem trước</span>
                      </button>
                    )}
                  </div>

                  {/* Nút Xóa Di Tích với xác nhận modal */}
                  <button
                    type="button"
                    onClick={() => requestDeleteSite(s)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg cursor-pointer"
                    title={`Xóa di tích ${s.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 3: ẢNH 360° & TOUR VR
          ============================================================== */}
      {activeTab === 'scenes' && editingSite && (
        <div className="space-y-5">
          <div className="p-4 bg-stone-950/70 border border-amber-800/60 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-amber-200">
              Ảnh toàn cảnh 360° Equirectangular tỷ lệ 2:1 (Hỗ trợ độ phân giải cao)
            </h4>
            <p className="text-xs text-amber-300/80">
              Nhóm quản lý có thể tải ảnh 360° trực tiếp lên Firebase Storage để tích hợp vào tour tương tác của {editingSite.name}. Sau khi tải lên, nhấn "LƯU THAY ĐỔI" để lưu cấu hình.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl cursor-pointer shadow-md">
                <Upload className="w-4 h-4" />
                <span>Tải ảnh 360° mới lên Firebase Storage</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUploadToStorage(e, 'panoramas', 'newPanorama')}
                />
              </label>

              {uploadProgress !== null && (
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <div className="w-32 bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span>{uploadProgress}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Danh sách scenes 360 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-amber-200">
              Các không gian 360° hiện có ({editingSite.scenes360.length}):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editingSite.scenes360.map((sc, scIdx) => (
                <div
                  key={sc.id}
                  className="p-4 bg-stone-900/80 border border-amber-700/60 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif font-bold text-sm text-amber-200">{sc.name}</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-400 bg-amber-950 px-2 py-0.5 rounded">
                        {sc.hotspots.length} điểm giải mã
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingSite.scenes360.filter((_, idx) => idx !== scIdx);
                          updateDraftField('scenes360', updated);
                          showToast('Đã xóa không gian 360 khỏi bản nháp.');
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Xóa không gian này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="aspect-2/1 rounded-xl overflow-hidden bg-black border border-amber-800/40 relative">
                    <img src={sc.imageUrl} alt={sc.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 4: ĐIỂM GIẢI MÃ KIẾN TRÚC
          ============================================================== */}
      {activeTab === 'hotspots' && editingSite && (
        <div className="space-y-5">
          <form
            onSubmit={handleAddHotspotToDraft}
            className="p-4 bg-stone-950/70 border border-amber-800/60 rounded-2xl space-y-3"
          >
            <h4 className="text-sm font-bold text-amber-200">
              Thêm điểm giải mã kiến trúc nghệ thuật trên không gian 360°:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Tiêu đề điểm kiến trúc (vd: Mái ngói mũi hài, Kèo chạm rồng...)"
                value={newHotspotTitle}
                onChange={(e) => setNewHotspotTitle(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
              />
              <input
                type="text"
                placeholder="Bộ phận cấu kiện (Mái, Cột, Vì kèo, Đầu dư...)"
                value={newHotspotPart}
                onChange={(e) => setNewHotspotPart(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
              />
              <input
                type="text"
                placeholder="Giá trị nghệ thuật chạm khắc..."
                value={newHotspotArt}
                onChange={(e) => setNewHotspotArt(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
              />
              <input
                type="text"
                placeholder="Lời giải thích chi tiết cho học sinh..."
                value={newHotspotExp}
                onChange={(e) => setNewHotspotExp(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Thêm vào danh sách giải mã (Bản nháp)
            </button>
          </form>

          {/* Danh sách hotspots hiện có */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-amber-200">Các điểm giải mã hiện có:</h4>
            {editingSite.scenes360.flatMap((sc) =>
              sc.hotspots.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-stone-900/80 border border-amber-800/60 rounded-xl text-xs flex justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-amber-200">{h.title}</span> ({h.architecturalPart})
                    <p className="text-amber-300/80 mt-0.5">{h.explanation}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteHotspotFromDraft(h.id)}
                    className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                    title="Xóa điểm giải mã"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 5: THUYẾT MINH MP3
          ============================================================== */}
      {activeTab === 'audio' && editingSite && (
        <div className="space-y-5">
          <div className="p-4 bg-stone-950/70 border border-amber-800/60 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-amber-200">Quản lý file âm thanh thuyết minh MP3</h4>
            <p className="text-xs text-amber-300/80">
              Tải file thuyết minh MP3 của nhóm dự án lên Firebase Storage để học sinh nghe thuyết minh tự động khi tham quan. Nhớ nhấn "LƯU THAY ĐỔI" sau khi chỉnh sửa.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl cursor-pointer shadow-md">
                <Upload className="w-4 h-4" />
                <span>Tải file MP3 lên Firebase Storage</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleFileUploadToStorage(e, 'audio', 'audio')}
                />
              </label>

              {editingSite.audioGuide?.fileUrl && (
                <audio controls src={editingSite.audioGuide.fileUrl} className="h-9" />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Tiêu đề bài thuyết minh:
              </label>
              <input
                type="text"
                value={editingSite.audioGuide?.title || ''}
                onChange={(e) =>
                  updateDraftField('audioGuide', {
                    ...editingSite.audioGuide,
                    title: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Lời thoại bài thuyết minh (Hiển thị văn bản cho học sinh đọc theo):
              </label>
              <textarea
                rows={5}
                value={editingSite.audioGuide?.transcript || ''}
                onChange={(e) =>
                  updateDraftField('audioGuide', {
                    ...editingSite.audioGuide,
                    transcript: e.target.value,
                  })
                }
                className="w-full p-3 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 6: NGÂN HÀNG CÂU HỎI TRẮC NGHIỆM
          ============================================================== */}
      {activeTab === 'quiz' && editingSite && (
        <div className="space-y-5">
          <form
            onSubmit={handleAddQuestionToDraft}
            className="p-4 bg-stone-950/70 border border-amber-800/60 rounded-2xl space-y-3"
          >
            <h4 className="text-sm font-bold text-amber-200">
              Thêm câu hỏi trắc nghiệm mới cho {editingSite.name}:
            </h4>
            <input
              type="text"
              placeholder="Nội dung câu hỏi..."
              value={newQText}
              onChange={(e) => setNewQText(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {newQOpts.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-950 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 border border-amber-700">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="text"
                    placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newQOpts];
                      updated[idx] = e.target.value;
                      setNewQOpts(updated);
                    }}
                    className="w-full px-3 py-2 bg-stone-900 border border-amber-800 rounded-lg text-xs text-amber-100"
                  />
                  <input
                    type="radio"
                    name="correctOpt"
                    checked={newQCorrect === idx}
                    onChange={() => setNewQCorrect(idx)}
                    title="Đánh dấu đáp án đúng"
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              ))}
            </div>
            <input
              type="text"
              placeholder="Lời giải thích vì sao đáp án chính xác..."
              value={newQExp}
              onChange={(e) => setNewQExp(e.target.value)}
              className="w-full px-3 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Thêm vào bộ câu hỏi (Bản nháp)
            </button>
          </form>

          {/* Danh sách câu hỏi */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-amber-200">
              Câu hỏi hiện có ({editingSite.quizQuestions.length}):
            </h4>
            {editingSite.quizQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-3 bg-stone-900/80 border border-amber-800/60 rounded-xl flex justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-amber-200">
                    Câu {idx + 1}: {q.question}
                  </p>
                  <p className="text-emerald-400 mt-1">
                    Đáp án đúng:{' '}
                    {q.correctIndex !== undefined
                      ? `${String.fromCharCode(65 + q.correctIndex)}. ${q.options[q.correctIndex]}`
                      : 'Đáp án được bảo mật máy chủ'}
                  </p>
                  {q.explanation && (
                    <p className="text-stone-400 mt-0.5 italic">Giải thích: {q.explanation}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteQuestionFromDraft(q.id)}
                  className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB: QUẢN LÝ SA BÀN 3D (TỌA ĐỘ GPS, GHIM & ĐỊA HÌNH PHÚ BÌNH)
          ============================================================== */}
      {activeTab === 'sandtable' && editingSite && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Di tích đang cấu hình */}
          <div className="p-4 bg-amber-950/40 border border-amber-600/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-200">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <h4 className="font-serif font-bold text-sm text-amber-100">
                  Cấu hình Tọa độ Sa Bàn 3D cho: {editingSite.name} ({editingSite.type})
                </h4>
              </div>
              <p className="text-amber-300/80 mt-1">
                Tọa độ GPS sẽ dùng để cắm ghim 3D trên bản đồ địa hình MapLibre GL JS của Thư viện di tích. Mọi thay đổi cần nhấn "LƯU THAY ĐỔI" để ghi nhận lên Cloud Firestore.
              </p>
            </div>

            {/* Trạng thái hiển thị ghim */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-300">Hiển thị ghim 3D:</span>
              <button
                type="button"
                onClick={() =>
                  updateDraftField('showOnSandtable', editingSite.showOnSandtable !== false ? false : true)
                }
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer ${
                  editingSite.showOnSandtable !== false
                    ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                    : 'bg-stone-800 text-amber-400 border border-amber-700 hover:bg-stone-700'
                }`}
              >
                {editingSite.showOnSandtable !== false ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đang bật ghim trên Sa Bàn</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Đang ẩn ghim</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form chỉnh sửa tọa độ GPS & Trạng thái xác minh */}
          <div className="p-5 bg-stone-950/80 border border-amber-800/60 rounded-2xl space-y-4">
            <h5 className="font-bold text-sm text-amber-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Tọa độ thực địa & Nguồn gốc kiểm chứng (Tuyệt đối không dùng tọa độ giả)</span>
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Vĩ độ (Latitude, °N): *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editingSite.coordinates?.lat ?? ''}
                  placeholder="21.4642"
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined;
                    updateDraftField('coordinates', {
                      ...editingSite.coordinates,
                      lat: val,
                      isVerified: editingSite.coordinates?.isVerified ?? true,
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Kinh độ (Longitude, °E): *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editingSite.coordinates?.lng ?? ''}
                  placeholder="105.9385"
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined;
                    updateDraftField('coordinates', {
                      ...editingSite.coordinates,
                      lng: val,
                      isVerified: editingSite.coordinates?.isVerified ?? true,
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Cao độ địa hình (Altitude, mét):
                </label>
                <input
                  type="number"
                  value={editingSite.coordinates?.altitudeMeters ?? 28}
                  placeholder="28"
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined;
                    updateDraftField('coordinates', {
                      ...editingSite.coordinates,
                      altitudeMeters: val,
                      isVerified: editingSite.coordinates?.isVerified ?? true,
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100 font-mono"
                />
              </div>
            </div>

            {/* Phím tắt gán nhanh tọa độ xã chuẩn Phú Bình */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-amber-300">
                Phím tắt gán tọa độ chuẩn theo địa bàn hành chính các xã huyện Phú Bình:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Xã Nhã Lộng (Chùa Ha)', lat: 21.4642, lng: 105.9385, alt: 28, note: 'Khu vực Chùa Ha cổ kính cạnh sông Đào' },
                  { name: 'Xã Điềm Thụy (Đình Hộ Lệnh)', lat: 21.4952, lng: 105.9083, alt: 32, note: 'Di tích kiến trúc nghệ thuật gần KCN Điềm Thụy' },
                  { name: 'Xã Úc Kỳ (Chùa Úc Kỳ)', lat: 21.4583, lng: 105.9324, alt: 25, note: 'Làng nghề tương nếp Úc Kỳ truyền thống' },
                  { name: 'Xã Xuân Phương (Đình Phương Độ)', lat: 21.5034, lng: 105.9491, alt: 30, note: 'Di tích Quốc gia thời Hậu Lê' },
                  { name: 'Xã Thanh Ninh (Đình Xuân La)', lat: 21.4725, lng: 105.9782, alt: 26, note: 'Đình làng cổ truyền thống xã Thanh Ninh' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      updateDraftField('coordinates', {
                        lat: preset.lat,
                        lng: preset.lng,
                        altitudeMeters: preset.alt,
                        isVerified: true,
                        source: `Tọa độ xác minh theo địa bạ ${preset.name}`,
                        notes: preset.note,
                      });
                      showToast(`Đã áp dụng tọa độ mẫu: ${preset.name}`);
                    }}
                    className="px-2.5 py-1 bg-stone-900 hover:bg-amber-950/80 text-amber-300 hover:text-white rounded-lg border border-amber-800/60 text-xs transition-colors cursor-pointer"
                  >
                    📍 {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Trạng thái xác minh tọa độ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-amber-900/40">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSite.coordinates?.isVerified ?? false}
                    onChange={(e) =>
                      updateDraftField('coordinates', {
                        ...editingSite.coordinates,
                        isVerified: e.target.checked,
                      })
                    }
                    className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Đã xác minh tọa độ thực tế (Cho phép hiển thị ghim 3D trên bản đồ)</span>
                </label>

                <p className="text-[11px] text-amber-300/70 italic">
                  * Nếu bỏ chọn xác minh, sa bàn sẽ hiển thị trạng thái "Cần bổ sung tọa độ trong CMS" theo đúng yêu cầu bảo tồn di sản.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Nguồn xác minh tọa độ:
                </label>
                <input
                  type="text"
                  value={editingSite.coordinates?.source || ''}
                  placeholder="VD: Bản đồ địa bạ huyện Phú Bình / Khảo sát GPS thực địa..."
                  onChange={(e) =>
                    updateDraftField('coordinates', {
                      ...editingSite.coordinates,
                      isVerified: editingSite.coordinates?.isVerified ?? true,
                      source: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Ghi chú địa hình / Mốc nhận dạng vị trí:
                </label>
                <input
                  type="text"
                  value={editingSite.coordinates?.notes || ''}
                  placeholder="VD: Cạnh sông Đào, ven đồi cây cổ thụ..."
                  onChange={(e) =>
                    updateDraftField('coordinates', {
                      ...editingSite.coordinates,
                      isVerified: editingSite.coordinates?.isVerified ?? true,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
                />
              </div>

              {/* Nguồn tư liệu nghiên cứu & Hồ sơ khoa học */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Nguồn tư liệu khảo cứu / Hồ sơ khoa học trích dẫn trên Sa bàn 3D:
                </label>
                <textarea
                  rows={2}
                  value={editingSite.documentarySources?.join('\n') || ''}
                  placeholder="Nhập mỗi nguồn tư liệu trên một dòng (VD: Hồ sơ di tích cấp Quốc gia số 123/QĐ-BVHTT, Văn bia chữ Hán thời Lê...)"
                  onChange={(e) =>
                    updateDraftField(
                      'documentarySources',
                      e.target.value.split('\n').filter((line) => line.trim().length > 0)
                    )
                  }
                  className="w-full p-3 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
                />
              </div>

              {/* Nhiệm vụ học tập gợi ý trên sa bàn */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Câu hỏi / Nhiệm vụ gợi ý cho học sinh khi khám phá di tích này trên sa bàn:
                </label>
                <input
                  type="text"
                  value={editingSite.sandtableMission || ''}
                  placeholder="VD: Tìm và đối chiếu bức chạm rồng cốn mê tại gian giữa của di tích..."
                  onChange={(e) => updateDraftField('sandtableMission', e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
                />
              </div>
            </div>
          </div>

          {/* BẢNG TỔNG HỢP TRẠNG THÁI TỌA ĐỘ 5 DI TÍCH */}
          <div className="p-5 bg-stone-950/80 border border-amber-800/60 rounded-2xl space-y-3">
            <h5 className="font-bold text-sm text-amber-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Bảng Tổng Hợp Vị Trí 5 Di Tích Trên Sa Bàn 3D:</span>
              </span>
              <span className="text-xs text-amber-300 font-normal">
                {sites.filter((s) => s.coordinates?.isVerified).length}/{sites.length} di tích đã xác minh
              </span>
            </h5>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-amber-100">
                <thead className="bg-amber-950/60 text-amber-300 font-bold border-b border-amber-800/60">
                  <tr>
                    <th className="p-2.5">Di tích</th>
                    <th className="p-2.5">Phân loại</th>
                    <th className="p-2.5">Địa chỉ</th>
                    <th className="p-2.5">Tọa độ GPS (°N, °E)</th>
                    <th className="p-2.5">Trạng thái xác minh</th>
                    <th className="p-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/30">
                  {sites.map((s) => {
                    const hasCoord = s.coordinates?.lat && s.coordinates?.lng;
                    const isVer = s.coordinates?.isVerified;
                    const isCurrent = s.id === editingSite.id;

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-amber-950/30 transition-colors ${
                          isCurrent ? 'bg-amber-900/20 font-semibold' : ''
                        }`}
                      >
                        <td className="p-2.5 flex items-center gap-1.5">
                          <span>{s.type === 'Chùa' ? '⛩️' : '🏛️'}</span>
                          <span className={isCurrent ? 'text-amber-300 font-bold' : ''}>
                            {s.name}
                          </span>
                        </td>
                        <td className="p-2.5 text-amber-300">{s.type}</td>
                        <td className="p-2.5 text-stone-300">{s.locality}</td>
                        <td className="p-2.5 font-mono text-[11px]">
                          {hasCoord ? (
                            <span className="text-amber-200">
                              {s.coordinates?.lat?.toFixed(4)}°, {s.coordinates?.lng?.toFixed(4)}°
                            </span>
                          ) : (
                            <span className="text-red-400 italic">Chưa có tọa độ</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {isVer ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" />
                              Đã xác minh
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3 h-3" />
                              Cần bổ sung tọa độ
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => requestSiteChange(s.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-600 text-stone-950 font-bold'
                                : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {isCurrent ? 'Đang sửa' : 'Chọn sửa'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 7: FIREBASE STORAGE QUẢN LÝ TỆP TIN
          ============================================================== */}
      {activeTab === 'storage' && (
        <div className="p-5 bg-stone-950/70 border border-amber-700/60 rounded-2xl space-y-5">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-amber-200">
              Quản lý Firebase Storage ({firebaseConfig.storageBucket})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-900/80 border border-amber-800/40 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-300">Thư mục tải lên:</span>
              <div className="flex flex-wrap gap-2">
                {(['images', 'audio', 'panoramas', 'certificates'] as const).map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => setUploadFolder(folder)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      uploadFolder === folder
                        ? 'bg-amber-600 text-stone-950'
                        : 'bg-stone-800 text-amber-300/80 hover:bg-stone-700'
                    }`}
                  >
                    /{folder}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-amber-600/60 rounded-xl cursor-pointer hover:border-amber-500 transition-colors bg-stone-950/40">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-200">
                    Chọn tệp tải lên thư mục /{uploadFolder}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUploadToStorage(e)}
                  />
                </label>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-amber-300">Tiến trình: {uploadProgress}%</span>
                </div>
              )}

              {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
            </div>

            <div className="p-4 bg-stone-900/80 border border-amber-800/40 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-300">URL tệp vừa tải lên:</span>
              {uploadedUrl ? (
                <div className="space-y-2">
                  <div className="p-2.5 bg-stone-950 rounded-lg border border-amber-900 break-all font-mono text-[11px] text-amber-200">
                    {uploadedUrl}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedUrl);
                        showToast('Đã sao chép link tệp vào clipboard!');
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép URL</span>
                    </button>
                    {uploadFolder === 'images' && (
                      <button
                        type="button"
                        onClick={() => {
                          updateDraftField('coverImage', uploadedUrl);
                          showToast('Đã áp dụng làm ảnh đại diện cho di tích!');
                        }}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs rounded-lg border border-amber-700 cursor-pointer"
                      >
                        Dùng làm ảnh đại diện
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Chưa có tệp nào được tải lên trong phiên này.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 8: HƯỚNG DẪN SECURITY RULES
          ============================================================== */}
      {activeTab === 'rules-guide' && (
        <div className="p-5 bg-stone-950/70 border border-amber-700/60 rounded-2xl space-y-4 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-amber-200">
              Cấu hình Firestore Security Rules & Phân Quyền Bảo Mật
            </h4>
          </div>
          <p className="leading-relaxed">
            Hệ thống áp dụng chính sách <strong>Default Deny</strong> và xác minh quyền quản trị viên thông qua tài khoản Google đã xác thực (<code className="text-amber-400">{PRIMARY_ADMIN_EMAIL}</code>) kết hợp tài liệu quyền trong <code className="text-amber-400">adminUsers/&#123;uid&#125;</code>.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-300">
            <li>
              <strong>sites & heritageSites:</strong> Khách và học sinh chỉ đọc được các di tích có <code className="text-amber-400">isPublished == true</code>. Chỉ Quản trị viên mới có quyền tạo, sửa, xóa di tích.
            </li>
            <li>
              <strong>studentProgress:</strong> Học sinh chỉ được ghi tiến độ vào tài liệu có documentId đúng bằng UID của mình (<code className="text-amber-400">request.auth.uid == uid</code>).
            </li>
            <li>
              <strong>certificates:</strong> Chỉ cấp thông qua kết quả xác minh từ máy chủ.
            </li>
          </ul>
        </div>
      )}

      {/* ==============================================================
          TAB 9: CHUYỂN FIRESTORE & ĐẶT LẠI MẶC ĐỊNH
          ============================================================== */}
      {activeTab === 'backup' && (
        <div className="p-5 bg-stone-950/70 border border-amber-700/60 rounded-2xl space-y-5">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-amber-200">
              Đồng bộ dữ liệu di tích lên Cloud Firestore (Yêu cầu xác nhận)
            </h4>
            <p className="text-xs text-amber-300/80">
              Chuyển toàn bộ danh sách {sites.length} di tích hiện tại lên Cloud Firestore một cách an toàn. Thao tác này chỉ thực hiện khi nhóm quản lý nhấn xác nhận.
            </p>
            <button
              type="button"
              onClick={() => setShowMigrateConfirmModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CloudUpload className="w-4 h-4" />
              <span>Chuyển dữ liệu sang Cloud Firestore</span>
            </button>
          </div>

          <div className="pt-4 border-t border-amber-900/40 space-y-2">
            <h4 className="text-sm font-bold text-red-400">Khôi phục về dữ liệu gốc mặc định</h4>
            <p className="text-xs text-stone-400">
              Nếu muốn đặt lại dữ liệu 5 di tích về bản gốc lịch sử đã được kiểm chứng ban đầu, nhóm quản lý có thể nhấn nút dưới đây.
            </p>
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Nhóm quản lý có chắc chắn muốn đặt lại toàn bộ dữ liệu 5 di tích về bản gốc mặc định?'
                  )
                ) {
                  onResetDefault();
                  showToast('Đã đặt lại dữ liệu về mặc định kiểm chứng!');
                }
              }}
              className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-300 text-xs font-semibold rounded-xl border border-red-800 cursor-pointer"
            >
              Đặt lại về dữ liệu gốc mặc định
            </button>
          </div>
        </div>
      )}

      {/* ==============================================================
          THANH LƯU CỐ ĐỊNH KHI CUỘN TRANG (STICKY BOTTOM ACTION BAR)
          Chỉ hiển thị khi có thay đổi hợp lệ (isDirty)
          ============================================================== */}
      {isDirty && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-[#1d0c07]/95 border-2 border-amber-500 rounded-2xl shadow-2xl p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <div>
              <p className="text-xs md:text-sm font-bold text-amber-200">
                Di tích "{editingSite.name}" đang có thay đổi chưa lưu
              </p>
              <p className="text-[11px] text-amber-300/70">
                Hãy nhấn "LƯU THAY ĐỔI" để đồng bộ lên Cloud Firestore hoặc "Hủy" để khôi phục.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCancelChanges}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs md:text-sm font-semibold rounded-xl border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Hủy bỏ</span>
            </button>

            <button
              type="button"
              disabled={isSaving || !isAdminVerified}
              onClick={() => handleSaveSiteChanges()}
              className={`px-5 py-2 text-stone-950 font-bold text-xs md:text-sm rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${
                !isAdminVerified
                  ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                  : isSaving
                  ? 'bg-amber-500 text-stone-950 opacity-80 cursor-wait'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 ring-2 ring-amber-400/50 cursor-pointer'
              }`}
              title={
                !isAdminVerified
                  ? 'Cần đăng nhập Google Quản trị viên để lưu'
                  : 'Lưu tất cả thay đổi lên Cloud Firestore'
              }
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang ghi Cloud...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>LƯU THAY ĐỔI</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL CẢNH BÁO RỜI TRANG KHI CHƯA LƯU (UNSAVED CHANGES MODAL)
          ============================================================== */}
      {showUnsavedPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#200e08] border-2 border-amber-600 rounded-3xl p-6 text-amber-100 space-y-4 shadow-2xl animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-lg text-amber-200">
                Bạn có thay đổi chưa được lưu!
              </h3>
              <p className="text-xs text-amber-300/80">
                Các nội dung chỉnh sửa trên di tích <strong>"{editingSite.name}"</strong> chưa được ghi lên Cloud Firestore. Nếu chuyển trang ngay bây giờ, các thay đổi chưa lưu sẽ bị mất.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveAndNavigate}
                disabled={isSaving || !isAdminVerified}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi ngay và tiếp tục</span>
              </button>

              <button
                type="button"
                onClick={handleDiscardAndNavigate}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold rounded-xl border border-stone-700 cursor-pointer"
              >
                Hủy bỏ thay đổi và tiếp tục chuyển trang
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUnsavedPromptModal(false);
                  setPendingNavigation(null);
                }}
                className="w-full py-2 text-stone-400 hover:text-stone-200 text-xs font-medium cursor-pointer"
              >
                Ở lại tiếp tục chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL XÁC NHẬN XÓA DI TÍCH RIÊNG BIỆT (DELETE MODAL)
          ============================================================== */}
      {showDeleteConfirmModal && sitePendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#200e08] border-2 border-red-600 rounded-3xl p-6 text-amber-100 space-y-4 shadow-2xl animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-lg text-red-200">
                Xác nhận xóa vĩnh viễn di tích?
              </h3>
              <p className="text-xs text-amber-300/80">
                Nhóm quản lý có chắc chắn muốn xóa di tích <strong>"{sitePendingDelete.name}"</strong>? Thao tác này sẽ xóa vĩnh viễn dữ liệu khỏi Cloud Firestore và không thể khôi phục lại.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-red-400 font-medium bg-red-950/60 p-2.5 rounded-lg border border-red-800">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setSitePendingDelete(null);
                }}
                className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold rounded-xl border border-stone-700 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL THÊM DI TÍCH MỚI (NÚT LƯU DI TÍCH MỚI RIÊNG BIỆT)
          ============================================================== */}
      {showAddSiteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-[#200e08] border-2 border-amber-600 rounded-3xl p-6 text-amber-100 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-2 border-b border-amber-800/60">
              <h3 className="font-serif font-bold text-lg text-amber-200">
                Thêm Di Tích Lịch Sử Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSiteModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addSiteError && (
              <p className="text-xs text-red-400 font-medium bg-red-950/60 p-2.5 rounded-lg border border-red-800">
                {addSiteError}
              </p>
            )}

            <form onSubmit={handleAddNewSite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Tên di tích: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đình ..."
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-sm text-amber-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    Phân loại:
                  </label>
                  <select
                    value={newSiteType}
                    onChange={(e) => setNewSiteType(e.target.value as typeof newSiteType)}
                    className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
                  >
                    <option value="Chùa">Chùa</option>
                    <option value="Đình">Đình</option>
                    <option value="Cụm di tích">Cụm di tích</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    Địa chỉ (2 cấp): *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSiteLocality}
                    onChange={(e) => setNewSiteLocality(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Tóm tắt giới thiệu ngắn: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Câu tóm tắt xuất hiện trên thẻ thư viện..."
                  value={newSiteSummary}
                  onChange={(e) => setNewSiteSummary(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Link Tour thực tế ảo 360° (nếu có):
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newSiteTourUrl}
                  onChange={(e) => setNewSiteTourUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Mô tả chi tiết:
                </label>
                <textarea
                  rows={3}
                  placeholder="Nội dung lịch sử và kiến trúc..."
                  value={newSiteDesc}
                  onChange={(e) => setNewSiteDesc(e.target.value)}
                  className="w-full p-3 bg-stone-900 border border-amber-800 rounded-xl text-xs text-amber-100"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  disabled={isSavingNewSite}
                  onClick={() => setShowAddSiteModal(false)}
                  className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs rounded-xl border border-stone-700 cursor-pointer"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewSite}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSavingNewSite ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSavingNewSite ? 'Đang lưu Cloud...' : 'LƯU DI TÍCH MỚI'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL XÁC NHẬN CHUYỂN DỮ LIỆU SANG FIRESTORE (SAO LƯU)
          ============================================================== */}
      {showMigrateConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#200e08] border-2 border-amber-600 rounded-3xl p-6 text-amber-100 space-y-4 shadow-2xl animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-lg text-amber-200">
                Xác nhận chuyển dữ liệu sang Firestore?
              </h3>
              <p className="text-xs text-amber-300/80">
                Dữ liệu của <strong>{sites.length} di tích</strong> (bao gồm Chùa Ha, Đình Hộ Lệnh, Chùa Úc Kỳ, Đình Phương Độ, Đình Xuân La) sẽ được tải lên Cloud Firestore của dự án Firebase <code>{firebaseConfig.projectId}</code>.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isMigrating}
                onClick={() => setShowMigrateConfirmModal(false)}
                className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold rounded-xl border border-stone-700 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isMigrating}
                onClick={handleConfirmMigrationToFirestore}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isMigrating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isMigrating ? 'Đang chuyển...' : 'Tôi xác nhận'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
