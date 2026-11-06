/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BẢNG ĐÁP ÁN BẢO MẬT PHÍA MÁY CHỦ (SERVER-SIDE SECRET ANSWER KEYS)
 * Tuyệt đối không gửi tệp này xuống trình duyệt học sinh hoặc đóng gói vào client bundle.
 */

export interface SecretAnswer {
  id: string;
  siteId: string;
  correctIndex: number;
  explanation: string;
  points: number;
}

export const SERVER_QUIZ_ANSWER_KEYS: Record<string, SecretAnswer> = {
  'q-ha-1': {
    id: 'q-ha-1',
    siteId: 'chua-ha',
    correctIndex: 1, // Ngói mũi hài truyền thống
    explanation: 'Ngói mũi hài là loại ngói đất nung có đầu cong nhọn giống như chiếc hài cổ, rất phổ biến ở các ngôi chùa làng Bắc Bộ.',
    points: 20
  },
  'q-ha-2': {
    id: 'q-ha-2',
    siteId: 'chua-ha',
    correctIndex: 1, // Để chống ẩm mốc và mối mọt từ lòng đất
    explanation: 'Chân tảng đá xanh giúp cách ly phần gỗ với độ ẩm của nền đất, ngăn ngừa mối mọt và giữ cột bền vững qua hàng trăm năm.',
    points: 20
  },
  'q-hl-1': {
    id: 'q-hl-1',
    siteId: 'chua-ho-lenh',
    correctIndex: 1, // Có thể tháo lắp linh hoạt, tạo không gian mở
    explanation: 'Cửa bức bàn truyền thống có thể nhấc rời từng cánh khi có đại lễ hội để đón tiếp bà con dân làng cùng tề tựu đông đủ.',
    points: 20
  },
  'q-uk-1': {
    id: 'q-uk-1',
    siteId: 'chua-uc-ky',
    correctIndex: 1, // Sự thanh cao, sức sống bền bỉ và trường thọ
    explanation: 'Trong văn hóa truyền thống, hoa cúc là một trong tứ quý (Tùng - Cúc - Trúc - Mai), biểu trưng cho cốt cách thanh cao và sự trường thọ.',
    points: 20
  },
  'q-pd-1': {
    id: 'q-pd-1',
    siteId: 'dinh-phuong-do',
    correctIndex: 1, // Nghệ thuật chạm khắc gỗ hình rồng thời Hậu Lê độc đáo
    explanation: 'Đình Phương Độ nổi danh toàn quốc với các bức cốn mê chạm rồng theo kỹ thuật kênh bong thời Hậu Lê vô cùng tinh xảo.',
    points: 20
  },
  'q-pd-2': {
    id: 'q-pd-2',
    siteId: 'dinh-phuong-do',
    correctIndex: 2, // Di tích Kiến trúc Nghệ thuật cấp Quốc gia
    explanation: 'Đình Phương Độ đã được Nhà nước xếp hạng là Di tích Kiến trúc Nghệ thuật cấp Quốc gia.',
    points: 20
  },
  'q-xl-1': {
    id: 'q-xl-1',
    siteId: 'dinh-xuan-la',
    correctIndex: 1, // Gối lên đầu cột vươn ra đỡ mái hiên đình
    explanation: 'Đầu bẩy là kết cấu gỗ nhô ra từ đầu cột quân đỡ lấy tàu mái ngoài hiên, thường được chạm khắc hình rồng hoặc hoa lá rất đẹp mắt.',
    points: 20
  }
};
