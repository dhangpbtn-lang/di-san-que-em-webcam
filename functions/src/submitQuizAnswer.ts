/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CLOUD FUNCTION: submitQuizAnswer
 * Chấm điểm câu hỏi trắc nghiệm an toàn trên máy chủ Firebase.
 * 
 * ĐẶC TÍNH BẢO MẬT:
 * 1. Kiểm tra xác thực Firebase Auth UID (bắt buộc đăng nhập, kể cả anonymous session).
 * 2. Xác thực câu hỏi và đáp án từ nguồn bí mật (không dựa vào dữ liệu gửi từ client).
 * 3. Chống cộng điểm lặp lại (Duplicate Points Prevention) bằng transaction trên trường answeredQuestions.
 * 4. Cập nhật điểm nguyên tử (Atomic transaction) trên tài liệu studentProgress/{uid}.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SERVER_QUIZ_ANSWER_KEYS } from './secretQuizAnswers';

// Khởi tạo Firebase Admin SDK nếu chưa có
if (!admin.apps.length) {
  admin.initializeApp();
}

interface SubmitQuizPayload {
  siteId: string;
  questionId: string;
  selectedIndex: number;
}

interface SubmitQuizResponse {
  success: boolean;
  isCorrect: boolean;
  explanation: string;
  earnedPoints: number;
  alreadyAnswered: boolean;
  totalPoints: number;
}

export const submitQuizAnswer = functions.https.onCall(
  async (data: SubmitQuizPayload, context): Promise<SubmitQuizResponse> => {
    // 1. Kiểm tra xác thực danh tính
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Yêu cầu xác thực danh tính học sinh trước khi gửi câu trả lời.'
      );
    }

    const uid = context.auth.uid;
    const { siteId, questionId, selectedIndex } = data;

    if (!questionId || typeof selectedIndex !== 'number') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Dữ liệu gửi lên không hợp lệ (thiếu questionId hoặc selectedIndex).'
      );
    }

    // 2. Tra cứu đáp án chính xác từ nguồn bí mật phía máy chủ
    // Ưu tiên đọc từ collection questionAnswers trên Firestore, nếu chưa có thì dùng SERVER_QUIZ_ANSWER_KEYS mặc định
    const db = admin.firestore();
    let correctAnswer = SERVER_QUIZ_ANSWER_KEYS[questionId];

    try {
      const qDoc = await db.collection('questionAnswers').doc(questionId).get();
      if (qDoc.exists) {
        const qData = qDoc.data();
        if (qData && typeof qData.correctIndex === 'number') {
          correctAnswer = {
            id: questionId,
            siteId: siteId || qData.siteId || '',
            correctIndex: qData.correctIndex,
            explanation: qData.explanation || '',
            points: 20
          };
        }
      }
    } catch (err) {
      console.warn('Tra cứu Firestore questionAnswers thất bại, sử dụng bảng khóa mặc định:', err);
    }

    if (!correctAnswer) {
      throw new functions.https.HttpsError(
        'not-found',
        `Không tìm thấy dữ liệu chấm điểm cho câu hỏi: ${questionId}`
      );
    }

    const isCorrect = selectedIndex === correctAnswer.correctIndex;
    const pointsToAward = isCorrect ? (correctAnswer.points || 20) : 0;

    // 3. Thực hiện Firestore Transaction để kiểm tra điểm lặp và cập nhật điểm nguyên tử
    const studentRef = db.collection('studentProgress').doc(uid);

    return await db.runTransaction(async (transaction) => {
      const studentDoc = await transaction.get(studentRef);
      let currentPoints = 0;
      let answeredMap: Record<string, boolean> = {};

      if (studentDoc.exists) {
        const docData = studentDoc.data() || {};
        currentPoints = typeof docData.totalPoints === 'number' ? docData.totalPoints : 0;
        answeredMap = docData.answeredQuestions || {};
      }

      // Kiểm tra nếu câu hỏi này đã từng được cộng điểm trước đây
      const isAlreadyAnswered = Boolean(answeredMap[questionId]);

      if (!isCorrect) {
        return {
          success: true,
          isCorrect: false,
          explanation: 'Chưa chính xác rồi em nhé! Hãy tìm hiểu thêm kiến trúc di tích và thử lại sau.',
          earnedPoints: 0,
          alreadyAnswered: isAlreadyAnswered,
          totalPoints: currentPoints
        };
      }

      // Trả lời đúng
      let finalPoints = currentPoints;
      let pointsEarnedThisTurn = 0;

      if (!isAlreadyAnswered) {
        pointsEarnedThisTurn = pointsToAward;
        finalPoints += pointsToAward;
        answeredMap[questionId] = true;

        if (studentDoc.exists) {
          transaction.update(studentRef, {
            totalPoints: finalPoints,
            answeredQuestions: answeredMap,
            lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Tạo mới tài liệu tiến độ nếu chưa có
          transaction.set(studentRef, {
            studentId: uid,
            userId: uid,
            totalPoints: finalPoints,
            answeredQuestions: answeredMap,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      return {
        success: true,
        isCorrect: true,
        explanation: correctAnswer.explanation,
        earnedPoints: pointsEarnedThisTurn,
        alreadyAnswered: isAlreadyAnswered,
        totalPoints: finalPoints
      };
    });
  }
);
