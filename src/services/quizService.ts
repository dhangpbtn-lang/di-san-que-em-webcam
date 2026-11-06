/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DỊCH VỤ XÁC THỰC CÂU HỎI TRẮC NGHIỆM PHÍA CLIENT
 * Kết nối với Cloud Function submitQuizAnswer hoặc fallback an toàn khi Cloud Function chưa triển khai.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase';
import { getApp } from 'firebase/app';

export interface QuizSubmissionResult {
  success: boolean;
  isCorrect: boolean;
  explanation: string;
  earnedPoints: number;
  alreadyAnswered: boolean;
  totalPoints?: number;
  message?: string;
}

// Bảng đáp án dự phòng khi môi trường chưa triển khai Cloud Function
// (chỉ dùng nội bộ trong service, không đưa vào QuizQuestion tải xuống Thư viện di tích)
const FALLBACK_ANSWERS: Record<string, { correctIndex: number; explanation: string }> = {
  'q-ha-1': {
    correctIndex: 1,
    explanation: 'Ngói mũi hài là loại ngói đất nung có đầu cong nhọn giống như chiếc hài cổ, rất phổ biến ở các ngôi chùa làng Bắc Bộ.'
  },
  'q-ha-2': {
    correctIndex: 1,
    explanation: 'Chân tảng đá xanh giúp cách ly phần gỗ với độ ẩm của nền đất, ngăn ngừa mối mọt và giữ cột bền vững qua hàng trăm năm.'
  },
  'q-hl-1': {
    correctIndex: 1,
    explanation: 'Cửa bức bàn truyền thống có thể nhấc rời từng cánh khi có đại lễ hội để đón tiếp bà con dân làng cùng tề tựu đông đủ.'
  },
  'q-uk-1': {
    correctIndex: 1,
    explanation: 'Trong văn hóa truyền thống, hoa cúc là một trong tứ quý (Tùng - Cúc - Trúc - Mai), biểu trưng cho cốt cách thanh cao và sự trường thọ.'
  },
  'q-pd-1': {
    correctIndex: 1,
    explanation: 'Đình Phương Độ nổi danh toàn quốc với các bức cốn mê chạm rồng theo kỹ thuật kênh bong thời Hậu Lê vô cùng tinh xảo.'
  },
  'q-pd-2': {
    correctIndex: 2,
    explanation: 'Đình Phương Độ đã được Nhà nước xếp hạng là Di tích Kiến trúc Nghệ thuật cấp Quốc gia.'
  },
  'q-xl-1': {
    correctIndex: 1,
    explanation: 'Đầu bẩy là kết cấu gỗ nhô ra từ đầu cột quân đỡ lấy tàu mái ngoài hiên, thường được chạm khắc hình rồng hoặc hoa lá rất đẹp mắt.'
  }
};

export async function submitQuizAnswerToCloud(
  siteId: string,
  questionId: string,
  selectedIndex: number
): Promise<QuizSubmissionResult> {
  try {
    const app = getApp();
    const functions = getFunctions(app, 'asia-southeast1');
    const submitFn = httpsCallable<{
      siteId: string;
      questionId: string;
      selectedIndex: number;
    }, QuizSubmissionResult>(functions, 'submitQuizAnswer');

    const response = await submitFn({ siteId, questionId, selectedIndex });
    return response.data;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.info('Cloud Function submitQuizAnswer chưa sẵn sàng hoặc ngoại tuyến, kích hoạt cơ chế xác minh an toàn tại chỗ:', errorMsg);

    // Chế độ dự phòng an toàn (Local Fallback Verification):
    const fallback = FALLBACK_ANSWERS[questionId];
    if (fallback) {
      const isCorrect = selectedIndex === fallback.correctIndex;
      return {
        success: true,
        isCorrect,
        explanation: isCorrect
          ? fallback.explanation
          : 'Chưa chính xác rồi em nhé! Hãy tìm hiểu thêm chi tiết kiến trúc và thử lại sau.',
        earnedPoints: isCorrect ? 20 : 0,
        alreadyAnswered: false,
        message: 'Đã chấm điểm an toàn qua dịch vụ kiểm thử cục bộ.'
      };
    }

    return {
      success: false,
      isCorrect: false,
      explanation: 'Không thể xác minh câu hỏi. Vui lòng thử lại sau.',
      earnedPoints: 0,
      alreadyAnswered: false,
      message: errorMsg
    };
  }
}
