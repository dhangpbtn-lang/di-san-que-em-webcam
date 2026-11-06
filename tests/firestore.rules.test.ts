/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Bộ kiểm thử Firebase Emulator Security Rules dành cho dự án: DI SẢN QUÊ EM
 * Sử dụng thư viện chuẩn: @firebase/rules-unit-testing
 */

import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'di-san-que-em';
const RULES_PATH = path.resolve(__dirname, '../firestore.rules');

describe('DI SẢN QUÊ EM - Firebase Security Rules Test Suite', () => {
  beforeAll(async () => {
    const rules = fs.readFileSync(RULES_PATH, 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    // Thiết lập dữ liệu mẫu ban đầu bằng quyền Admin Emulator
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // 1. Di tích Chùa Ha (đã xuất bản)
      await db.collection('heritageSites').doc('chua-ha').set({
        id: 'chua-ha',
        name: 'Chùa Ha',
        type: 'Chùa',
        locality: 'Xã Phú Bình, tỉnh Thái Nguyên',
        shortSummary: 'Di tích lịch sử văn hóa lâu đời.',
        coverImage: 'https://example.com/chua-ha.jpg',
        isPublished: true,
      });

      // 2. Di tích bản nháp (chưa xuất bản)
      await db.collection('heritageSites').doc('di-tich-nhap').set({
        id: 'di-tich-nhap',
        name: 'Di tích đang khảo sát',
        type: 'Đình',
        locality: 'Xã Phú Bình, tỉnh Thái Nguyên',
        shortSummary: 'Đang xác minh hồ sơ.',
        coverImage: 'https://example.com/nhap.jpg',
        isPublished: false,
      });

      // 3. Câu hỏi và đáp án bảo mật
      await db.collection('questions').doc('q_ha_1').set({
        id: 'q_ha_1',
        question: 'Mái Chùa Ha lợp ngói gì?',
        options: ['Ngói mũi hài', 'Ngói tây', 'Ngói âm dương', 'Mái tôn'],
      });

      await db.collection('questionAnswers').doc('q_ha_1').set({
        id: 'q_ha_1',
        correctIndex: 0,
        explanation: 'Ngói mũi hài truyền thống giúp thoát nước mưa và tạo nét duyên dáng.',
      });

      // 4. Hồ sơ Admin hợp lệ
      await db.collection('adminUsers').doc('teacher_admin_uid').set({
        uid: 'teacher_admin_uid',
        email: 'giaovien@school.edu.vn',
        role: 'editor_teacher',
        isActive: true,
      });

      // 5. Hồ sơ Admin bị khóa
      await db.collection('adminUsers').doc('disabled_admin_uid').set({
        uid: 'disabled_admin_uid',
        email: 'khoa@school.edu.vn',
        role: 'editor_teacher',
        isActive: false, // Bị khóa
      });
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  // ===========================================================================
  // NHÓM 1: KHÁCH TRUY CẬP VÃNG LAI (CHƯA ĐĂNG NHẬP) - YÊU CẦU 4
  // ===========================================================================
  describe('Kịch bản 1: Khách vãng lai (Unauthenticated)', () => {
    it('CHO PHÉP đọc di tích đã xuất bản (Chùa Ha)', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(unauthDb.collection('heritageSites').doc('chua-ha').get());
    });

    it('TỪ CHỐI đọc di tích đang là bản nháp chưa kiểm chứng', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('heritageSites').doc('di-tich-nhap').get());
    });

    it('TỪ CHỐI chỉnh sửa hoặc xóa di tích', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(
        unauthDb.collection('heritageSites').doc('chua-ha').update({
          name: 'Tên bị tấn công',
        })
      );
    });

    it('TỪ CHỐI tự tạo tài khoản quản trị trong adminUsers', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(
        unauthDb.collection('adminUsers').doc('attacker').set({
          uid: 'attacker',
          email: 'attacker@bad.com',
          role: 'super_admin',
          isActive: true,
        })
      );
    });
  });

  // ===========================================================================
  // NHÓM 2: HỌC SINH (CHUẨN HÓA THEO UID & CHỐNG GIAN LẬN) - YÊU CẦU 2 & 3
  // ===========================================================================
  describe('Kịch bản 2: Học sinh (student_alice)', () => {
    it('CHO PHÉP khởi tạo tiến độ học sinh chuẩn hóa đúng UID của mình với điểm = 0', async () => {
      const aliceDb = testEnv.authenticatedContext('student_alice').firestore();
      await assertSucceeds(
        aliceDb.collection('studentProgress').doc('student_alice').set({
          studentId: 'student_alice',
          userId: 'student_alice',
          studentName: 'Nguyễn Văn A',
          studentSchool: 'THCS Phú Bình',
          studentClass: '7A1',
          totalPoints: 0,
        })
      );
    });

    it('TỪ CHỐI học sinh tạo tiến độ với documentId không khớp với UID của mình (Chống chiếm hồ sơ)', async () => {
      const aliceDb = testEnv.authenticatedContext('student_alice').firestore();
      // Alice cố gắng tạo hồ sơ mang ID của Bob
      await assertFails(
        aliceDb.collection('studentProgress').doc('student_bob').set({
          studentId: 'student_bob',
          userId: 'student_bob',
          studentName: 'Nguyễn Văn A',
          studentSchool: 'THCS Phú Bình',
          studentClass: '7A1',
          totalPoints: 0,
        })
      );
    });

    it('TỪ CHỐI học sinh tạo tiến độ với trường studentId hoặc userId sai lệch UID (Chống giả mạo trường)', async () => {
      const aliceDb = testEnv.authenticatedContext('student_alice').firestore();
      await assertFails(
        aliceDb.collection('studentProgress').doc('student_alice').set({
          studentId: 'rogue_id', // Không khớp UID
          userId: 'student_alice',
          studentName: 'Nguyễn Văn A',
          studentSchool: 'THCS Phú Bình',
          studentClass: '7A1',
          totalPoints: 0,
        })
      );
    });

    it('TỪ CHỐI học sinh tự tạo tiến độ với điểm > 0 từ client (dù chỉ là 15 điểm hay 10,000 điểm)', async () => {
      const aliceDb = testEnv.authenticatedContext('student_alice').firestore();
      await assertFails(
        aliceDb.collection('studentProgress').doc('student_alice').set({
          studentId: 'student_alice',
          userId: 'student_alice',
          studentName: 'Nguyễn Văn A',
          studentSchool: 'THCS Phú Bình',
          studentClass: '7A1',
          totalPoints: 15,
        })
      );
    });

    it('TỪ CHỐI học sinh tự sửa hoặc tăng điểm từ client (dù chỉ tăng 15 điểm)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('studentProgress').doc('student_alice').set({
          studentId: 'student_alice',
          userId: 'student_alice',
          studentName: 'Nguyễn Văn A',
          studentSchool: 'THCS Phú Bình',
          studentClass: '7A1',
          totalPoints: 15,
        });
      });

      const aliceDb = testEnv.authenticatedContext('student_alice').firestore();

      // Cố ý cộng 15 điểm lên 30 từ client -> BỊ TỪ CHỐI
      await assertFails(
        aliceDb.collection('studentProgress').doc('student_alice').update({
          totalPoints: 30,
        })
      );

      // Cập nhật thông tin họ tên và giữ nguyên điểm 15 -> ĐƯỢC CHẤP THUẬN
      await assertSucceeds(
        aliceDb.collection('studentProgress').doc('student_alice').update({
          studentName: 'Nguyễn Văn A (Cập nhật)',
          totalPoints: 15,
        })
      );
    });

    it('TỪ CHỐI học sinh đọc hoặc xem trước đáp án câu hỏi từ questionAnswers (Yêu cầu 3)', async () => {
      const aliceDb = testEnv.authenticatedContext('student_alice').firestore();

      // Đọc câu hỏi công khai -> ĐƯỢC PHÉP
      await assertSucceeds(aliceDb.collection('questions').doc('q_ha_1').get());

      // Đọc đáp án câu hỏi -> BỊ TỪ CHỐI (Không thể xem trước đáp án tính điểm)
      await assertFails(aliceDb.collection('questionAnswers').doc('q_ha_1').get());
    });

    it('TỪ CHỐI học sinh tự tạo chứng nhận từ client', async () => {
      const aliceDb = testEnv.authenticatedContext('student_alice').firestore();
      await assertFails(
        aliceDb.collection('certificates').doc('cert_alice').set({
          id: 'cert_alice',
          studentUid: 'student_alice',
          studentName: 'Nguyễn Văn A',
          score: 100,
          issuedAt: new Date().toISOString(),
        })
      );
    });
  });

  // ===========================================================================
  // NHÓM 3: QUẢN TRỊ VIÊN & RÀNG BUỘC UID TRONG adminUsers - YÊU CẦU 1
  // ===========================================================================
  describe('Kịch bản 3: Quản trị viên (Master Educator & Editor Teacher)', () => {
    it('CHO PHÉP Giáo viên trưởng (dhangpbtn@gmail.com có email_verified) cập nhật di tích', async () => {
      const masterDb = testEnv
        .authenticatedContext('master_uid', { email: 'dhangpbtn@gmail.com', email_verified: true })
        .firestore();

      await assertSucceeds(
        masterDb.collection('heritageSites').doc('chua-ha').update({
          shortSummary: 'Thông tin lịch sử đã được Giáo viên trưởng kiểm chứng chính thức.',
        })
      );
    });

    it('TỪ CHỐI email giả mạo dhangpbtn@gmail.com nhưng chưa xác minh (email_verified: false)', async () => {
      const spoofDb = testEnv
        .authenticatedContext('spoof_uid', { email: 'dhangpbtn@gmail.com', email_verified: false })
        .firestore();

      await assertFails(
        spoofDb.collection('heritageSites').doc('chua-ha').update({
          name: 'Tên bị tấn công giả mạo',
        })
      );
    });

    it('CHO PHÉP Super Admin tạo tài khoản admin mới khi docId KHỚP với trường uid', async () => {
      const masterDb = testEnv
        .authenticatedContext('master_uid', { email: 'dhangpbtn@gmail.com', email_verified: true })
        .firestore();

      await assertSucceeds(
        masterDb.collection('adminUsers').doc('teacher_new_uid').set({
          uid: 'teacher_new_uid', // Trùng khớp docId
          email: 'teacher2@school.edu.vn',
          role: 'editor_teacher',
          isActive: true,
        })
      );
    });

    it('TỪ CHỐI tạo tài khoản admin khi docId KHÔNG TRÙNG KHỚP với trường uid (Ràng buộc UID)', async () => {
      const masterDb = testEnv
        .authenticatedContext('master_uid', { email: 'dhangpbtn@gmail.com', email_verified: true })
        .firestore();

      await assertFails(
        masterDb.collection('adminUsers').doc('doc_id_mismatch').set({
          uid: 'actual_different_uid', // Sai lệch docId
          email: 'mismatch@school.edu.vn',
          role: 'editor_teacher',
          isActive: true,
        })
      );
    });

    it('TỪ CHỐI tài khoản quản trị bị khóa (isActive: false) thực hiện tác vụ ghi', async () => {
      const disabledDb = testEnv
        .authenticatedContext('disabled_admin_uid', { email: 'khoa@school.edu.vn' })
        .firestore();

      await assertFails(
        disabledDb.collection('heritageSites').doc('chua-ha').update({
          name: 'Đổi tên trái phép',
        })
      );
    });

    it('CHO PHÉP Quản trị viên đọc đáp án câu hỏi từ questionAnswers để kiểm tra', async () => {
      const masterDb = testEnv
        .authenticatedContext('master_uid', { email: 'dhangpbtn@gmail.com', email_verified: true })
        .firestore();

      await assertSucceeds(masterDb.collection('questionAnswers').doc('q_ha_1').get());
    });
  });
});
