/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Tệp khởi tạo dịch vụ Firebase SDK cho DI SẢN QUÊ EM
 * Sử dụng cấu hình độc lập từ src/firebaseConfig.ts
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';
import { HeritageSite, StudentProgress } from './types/heritage';

// 1. Khởi tạo Firebase App (Tránh khởi tạo trùng lặp)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Khởi tạo Firestore, Auth và Storage
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export { onAuthStateChanged };
export type { User };

// 3. Chuẩn hóa mã lỗi theo Skill Firebase Integration
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. KIỂM TRA KẾT NỐI THẬT (Tuyệt đối không giả lập trạng thái thành công)
export async function checkRealFirebaseConnection(): Promise<{
  connected: boolean;
  message: string;
  errorDetail?: string;
}> {
  try {
    // Thử truy vấn tài liệu cấu hình từ Cloud Firestore server
    const testDoc = doc(db, 'siteConfig', 'ping');
    await getDocFromServer(testDoc);
    return {
      connected: true,
      message: `Đã kết nối thành công tới Cloud Firestore (Dự án: ${firebaseConfig.projectId})`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Phân tích mã lỗi thực tế
    if (errorMsg.includes('client is offline') || errorMsg.includes('Failed to get document because the client is offline')) {
      return {
        connected: false,
        message: 'Không thể kết nối đến máy chủ Firestore (Đang ngoại tuyến hoặc chưa bật Firestore trên Firebase Console)',
        errorDetail: errorMsg,
      };
    }

    if (errorMsg.includes('permission-denied') || errorMsg.includes('PERMISSION_DENIED')) {
      // Máy chủ Firestore phản hồi chính xác về quyền hạn => Kết nối mạng thành công
      return {
        connected: true,
        message: `Đã kết nối máy chủ Firestore (${firebaseConfig.projectId}) - Trạng thái bảo mật hoạt động tốt`,
      };
    }

    return {
      connected: false,
      message: `Lỗi kết nối Firebase: ${errorMsg}`,
      errorDetail: errorMsg,
    };
  }
}

// 5. Quản lý xác thực quản trị viên
export const PRIMARY_ADMIN_EMAIL = 'dhangpbtn@gmail.com';

export function isTeacherAdmin(user: User | null): boolean {
  if (!user) return false;
  if (user.email === PRIMARY_ADMIN_EMAIL) return true;
  return false;
}

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithEmailPass(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function createAdminAccount(email: string, pass: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// 6. Tải và ghi thông tin di tích trên Cloud Firestore (Tuân thủ allow list: isPublished == true)
export async function fetchHeritageSitesFromFirestore(): Promise<HeritageSite[]> {
  const path = 'heritageSites';
  try {
    const isAdminUser = isTeacherAdmin(auth.currentUser);
    // Khách & Học sinh chỉ truy vấn các di tích đã xuất bản để tương thích chặt chẽ với Security Rules
    const targetQuery = isAdminUser
      ? collection(db, path)
      : query(collection(db, path), where('isPublished', '==', true));

    const snap = await getDocs(targetQuery);
    if (snap.empty) {
      return [];
    }
    const sites: HeritageSite[] = [];
    snap.forEach((docItem) => {
      sites.push(docItem.data() as HeritageSite);
    });
    return sites;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveHeritageSiteToFirestore(site: HeritageSite): Promise<void> {
  const path = `heritageSites/${site.id}`;
  try {
    await setDoc(doc(db, 'heritageSites', site.id), site);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteHeritageSiteFromFirestore(siteId: string): Promise<void> {
  const path = `heritageSites/${siteId}`;
  try {
    await deleteDoc(doc(db, 'heritageSites', siteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 7. YÊU CẦU 9: CHUYỂN DỮ LIỆU HIỆN TẠI SANG FIRESTORE KHI VÀ CHỈ KHI CÓ XÁC NHẬN CỦA NGƯỜI DÙNG
export async function migrateSitesToFirestoreWithConfirmation(sites: HeritageSite[]): Promise<{
  successCount: number;
  total: number;
}> {
  let count = 0;
  for (const s of sites) {
    await saveHeritageSiteToFirestore(s);
    count++;
  }
  return { successCount: count, total: sites.length };
}

// 8. Tự động khởi tạo phiên học sinh an toàn (Anonymous Authentication)
export async function ensureStudentAnonymousSession(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    // Nếu chưa bật Anonymous Auth trên Firebase Console, ứng dụng tự động hoạt động ở chế độ ngoại tuyến an toàn
    console.info('Phiên học sinh hoạt động ngoại tuyến an toàn (localStorage):', err);
    return null;
  }
}

// 9. Lưu kết quả học sinh chuẩn hóa tuyệt đối theo UID (Ngăn chiếm dụng hồ sơ)
export async function saveStudentProgressToFirestore(progress: StudentProgress): Promise<void> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) {
    // Học sinh chưa xác thực danh tính lưu trữ an toàn trong localStorage
    return;
  }

  const path = `studentProgress/${currentUid}`;
  try {
    await setDoc(doc(db, 'studentProgress', currentUid), {
      studentId: currentUid,
      userId: currentUid,
      studentName: progress.studentName,
      studentSchool: progress.studentSchool,
      studentClass: progress.studentClass,
      totalPoints: progress.totalPoints,
      completedAt: new Date().toISOString(),
      exploredSites: progress.exploredSites,
      decodedHotspots: progress.decodedHotspots,
    }, { merge: true });
  } catch (error) {
    console.info('Tiến độ học sinh được bảo toàn trong bộ nhớ cục bộ:', error);
  }
}

// 10. YÊU CẦU 4: TÍCH HỢP FIREBASE STORAGE (Tải ảnh di tích, ảnh 360°, âm thanh MP3, giấy chứng nhận)
export async function uploadFileToFirebaseStorage(
  file: File,
  folder: 'images' | 'audio' | 'panoramas' | 'certificates' = 'images',
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  // Chuẩn hóa tên file an toàn
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${folder}/${Date.now()}_${sanitizedName}`;
  const fileRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) {
          onProgress(percent);
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });
}
