/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeritageSite } from '../types/heritage';
import { getProceduralPanorama } from '../utils/panoramaGenerator';

// Helper to generate architectural detail image mockups with authentic motifs
export function createArchitecturalSvg(title: string, subtitle: string, bgColor: string, accentColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}" />
        <stop offset="100%" stop-color="#180c06" />
      </linearGradient>
      <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 40 20 L 20 40 L 0 20 Z" fill="none" stroke="${accentColor}" stroke-width="0.8" opacity="0.15" />
      </pattern>
    </defs>
    <rect width="800" height="600" fill="url(#bg)" />
    <rect width="800" height="600" fill="url(#pattern)" />
    
    <!-- Vietnamese Heritage Decorative Border -->
    <rect x="25" y="25" width="750" height="550" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.6" />
    <rect x="35" y="35" width="730" height="530" fill="none" stroke="${accentColor}" stroke-width="1" opacity="0.3" stroke-dasharray="6,4" />
    
    <!-- Traditional Cloud / Lotus Motif in Center -->
    <g transform="translate(400, 260) scale(1.2)" fill="none" stroke="${accentColor}" stroke-width="2.5">
      <circle cx="0" cy="0" r="85" opacity="0.25" fill="${accentColor}" />
      <path d="M -50,15 C -25,-25 25,-25 50,15 C 25,35 -25,35 -50,15 Z" fill="${accentColor}" opacity="0.4" />
      <path d="M 0,-60 C -15,-30 -15,10 0,40 C 15,10 15,-30 0,-60 Z" fill="${accentColor}" opacity="0.5" />
      <circle cx="0" cy="0" r="14" fill="${accentColor}" />
      <path d="M -70,25 C -50,55 50,55 70,25" />
      <path d="M -90,0 Q -50,-50 0,-50 Q 50,-50 90,0" stroke-dasharray="4,4" />
    </g>

    <!-- Typography -->
    <text x="400" y="420" font-family="'Playfair Display', serif" font-size="28" font-weight="bold" fill="#fef08a" text-anchor="middle">${title}</text>
    <text x="400" y="460" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" fill="#cbd5e1" text-anchor="middle">${subtitle}</text>
    <text x="400" y="520" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" fill="${accentColor}" text-anchor="middle" letter-spacing="3">DI SẢN QUÊ EM • BẢO TỒN VĂN HÓA</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_HERITAGE_SITES: HeritageSite[] = [
  // 1. CHÙA HA
  {
    id: 'chua-ha',
    name: 'Chùa Ha',
    type: 'Chùa',
    locality: 'Xã Phú Bình, tỉnh Thái Nguyên',
    rankingStatus: 'Nội dung đang cập nhật (Đang xác minh hồ sơ)',
    isRankingVerified: false,
    period: 'Nội dung đang cập nhật',
    isPeriodVerified: false,
    shortSummary: 'Ngôi chùa cổ kính nép mình dưới những tán cây cổ thụ, là chốn sinh hoạt văn hóa tín ngưỡng tâm linh lâu đời của nhân dân địa phương.',
    fullDescription: 'Chùa Ha là một trong những cơ sở Phật giáo và di tích tín ngưỡng có lịch sử lâu đời tại địa phương. Nơi đây lưu giữ nét đẹp thanh tịnh của không gian làng quê Việt Nam với cây đa, bến nước, sân chùa. Hiện Ban Quản lý di tích và nhà trường đang phối hợp với các cơ quan chuyên môn để sưu tầm, thẩm định các tư liệu lịch sử, văn bia chữ Hán và hồ sơ khoa học chính xác nhất.',
    architectureOverview: 'Kiến trúc mang phong cách truyền thống vùng đồng bằng và trung du Bắc Bộ với bố cục chữ Đinh (Tiền đường và Thượng điện). Bộ khung chịu lực bằng gỗ lim, liên kết bằng hệ mộng chắc chắn, mái ngói mũi hài rêu phong.',
    artisticSignificance: 'Nội dung đang cập nhật: Các mảng chạm khắc hoa văn cúc dây, mây cuộn và hệ thống tượng Phật cổ đang được các chuyên gia văn hóa bảo tồn và đánh giá chi tiết.',
    coverImage: createArchitecturalSvg('CHÙA HA', 'Không gian tâm linh cổ kính vùng đất Thái Nguyên', '#451a03', '#f59e0b'),
    externalTourUrl: 'https://resplendent-kangaroo-7b6b7f.netlify.app/',
    gallery: [
      {
        id: 'ha-g1',
        url: createArchitecturalSvg('Cổng Tam Quan Chùa Ha', 'Kiến trúc đón bước phật tử', '#361502', '#f59e0b'),
        title: 'Cổng Tam Quan',
        description: 'Lối vào trang nghiêm của chùa với ba cửa vòm truyền thống.'
      },
      {
        id: 'ha-g2',
        url: createArchitecturalSvg('Tòa Tam Bảo', 'Nơi thờ Phật trang nghiêm', '#291002', '#fbbf24'),
        title: 'Tòa Tam Bảo',
        description: 'Không gian thờ tự trung tâm với hệ thống hoành phi câu đối cổ.'
      }
    ],
    scenes360: [
      {
        id: 'ha-courtyard',
        name: 'Sân Chùa & Tiền Đường',
        imageUrl: getProceduralPanorama('chua-ha', {
          skyColorTop: '#1e3a8a',
          skyColorHorizon: '#60a5fa',
          floorColor: '#991b1b',
          roofTileColor: '#b91c1c',
          pillarWoodColor: '#783515',
          siteName: 'Chùa Ha',
          sceneName: 'Sân Chùa & Tiền Đường'
        }),
        initialYaw: 0,
        initialPitch: 0,
        hotspots: [
          {
            id: 'ha-hs-1',
            title: 'Mái Chùa & Ngói Mũi Hài',
            architecturalPart: 'Mái đình / Chùa',
            artisticValue: 'Nghệ thuật liên kết mộng gỗ không dùng đinh kim loại, thể hiện tài hoa và kinh nghiệm dựng nhà của thợ mộc xưa.',
            explanation: 'Mái ngói mũi hài uốn lượn có mũi cong nhô lên như mũi hài cổ, giúp nước mưa thoát nhanh và che mưa che nắng toàn bộ công trình.',
            detailedImage: createArchitecturalSvg('Mái Ngói Mũi Hài', 'Hệ mái đất nung truyền thống', '#4a1d06', '#f59e0b'),
            yaw: 15,
            pitch: 24,
            audioSnippet: {
              title: 'Thuyết minh Mái Chùa Ha',
              text: 'Chào các bạn học sinh. Khi nhìn lên hệ mái Chùa Ha, các bạn sẽ thấy các lớp ngói mũi hài xếp lớp uốn cong, tạo nét thanh thoát và bền bỉ che chở qua mưa nắng.'
            }
          },
          {
            id: 'ha-hs-keo',
            title: 'Vì Kèo Chồng Rường',
            architecturalPart: 'Vì kèo & Xà',
            artisticValue: 'Kỹ thuật chồng rường bằng mộng gỗ chính xác từng milimet, biểu trưng cho sự gắn kết của cộng đồng.',
            explanation: 'Vì kèo chồng rường gồm các thanh rường gỗ ngắn xếp chồng lên nhau thành tầng để đỡ các đòn tay mái chùa mà không cần cột phụ.',
            detailedImage: createArchitecturalSvg('Vì Kèo Chồng Rường', 'Kết cấu khung gỗ chịu lực vững chắc', '#3d1a0a', '#fbbf24'),
            yaw: 28,
            pitch: 32,
            audioSnippet: {
              title: 'Thuyết minh Vì Kèo Chồng Rường',
              text: 'Vì kèo chồng rường là một phát minh tuyệt vời của cha ông ta, phân phối đều trọng lực của mái ngói nặng hàng chục tấn xuống các cột cái.'
            }
          },
          {
            id: 'ha-hs-2',
            title: 'Hoa Văn Mây Lửa & Lư Hương Đá Cổ',
            architecturalPart: 'Hoa văn điêu khắc',
            artisticValue: 'Chạm khắc hoa văn mây lửa và hoa sen trên chất liệu đá xanh nguyên khối.',
            explanation: 'Lư hương được đặt ở chính giữa sân trước tiền đường để nhân dân thắp hương tưởng niệm, mang lại sự bình an cho thôn xóm.',
            detailedImage: createArchitecturalSvg('Hoa Văn Mây Lửa', 'Điêu khắc đá nguyên khối thanh tịnh', '#1e293b', '#94a3b8'),
            yaw: -5,
            pitch: -26,
            audioSnippet: {
              title: 'Thuyết minh Lư Hương Đá',
              text: 'Chiếc lư hương đá đặt giữa sân chùa là nơi hội tụ lòng thành kính của bà con nhân dân, biểu trưng cho sự hướng thiện và tĩnh lặng.'
            }
          }
        ],
        sceneTransitions: [
          {
            targetSceneId: 'ha-interior',
            title: 'Bước vào Tòa Tam Bảo',
            yaw: 0,
            pitch: -6
          }
        ]
      },
      {
        id: 'ha-interior',
        name: 'Tòa Tam Bảo (Nội thất)',
        imageUrl: getProceduralPanorama('chua-ha-in', {
          skyColorTop: '#0f0703',
          skyColorHorizon: '#2e1810',
          floorColor: '#451a03',
          roofTileColor: '#783515',
          pillarWoodColor: '#451a03',
          siteName: 'Chùa Ha',
          sceneName: 'Tòa Tam Bảo',
          isInterior: true
        }),
        initialYaw: 0,
        initialPitch: 0,
        hotspots: [
          {
            id: 'ha-hs-3',
            title: 'Cột Cái Gỗ Lim Kê Chân Tảng Đá',
            architecturalPart: 'Cột & Chân tảng',
            artisticValue: 'Được chế tác từ thân gỗ lim nguyên khối, mài nhẵn và kê trên tảng đá xanh chống ẩm mốc.',
            explanation: 'Cột cái gánh toàn bộ sức nặng của mái chùa. Chân tảng đá giúp chân cột gỗ cách ly khỏi mặt đất ẩm ướt, giúp cột tồn tại hàng trăm năm mà không bị mối mọt.',
            detailedImage: createArchitecturalSvg('Cột Lim Chân Tảng Đá', 'Trụ cột vững chắc ngàn năm', '#361502', '#f59e0b'),
            yaw: -38,
            pitch: -12,
            audioSnippet: {
              title: 'Thuyết minh Cột Cái Chùa Ha',
              text: 'Mỗi cột gỗ lim trong chùa đều được chọn lọc kỹ lưỡng từ rừng già, chứng kiến bao thế hệ con cháu trưởng thành và giữ gìn văn hóa quê hương.'
            }
          },
          {
            id: 'ha-hs-hoanhphi',
            title: 'Hoành Phi "Vạn Cổ Anh Linh"',
            architecturalPart: 'Hoa văn điêu khắc',
            artisticValue: 'Chữ Hán thếp vàng rực rỡ trên nền gỗ sơn then bóng bẩy mang giá trị mỹ thuật và thư pháp cổ.',
            explanation: 'Bức hoành phi được treo trang trọng trên cao ở gian giữa, ca ngợi sự linh thiêng trường tồn của chốn già lam.',
            detailedImage: createArchitecturalSvg('Hoành Phi Thếp Vàng', 'Thư pháp và nghệ thuật sơn thếp truyền thống', '#500724', '#fde047'),
            yaw: 0,
            pitch: 18,
            audioSnippet: {
              title: 'Thuyết minh Hoành Phi Cổ',
              text: 'Bốn chữ Vạn Cổ Anh Linh được thếp vàng lá thủ công, thể hiện tấm lòng tôn kính của nhân dân đối với tiền nhân.'
            }
          }
        ],
        sceneTransitions: [
          {
            targetSceneId: 'ha-courtyard',
            title: 'Trở ra Sân Chùa & Tiền Đường',
            yaw: 180,
            pitch: -6
          }
        ]
      }
    ],
    audioGuide: {
      title: 'Hành trình khám phá Chùa Ha',
      transcript: 'Chào mừng các em học sinh đến với Chùa Ha, xã Phú Bình, tỉnh Thái Nguyên. Đây là một di tích lịch sử và văn hóa tâm linh gần gũi với người dân địa phương. Hãy cùng bước qua sân gạch, ngắm nhìn mái ngói mũi hài rêu phong và khám phá những đường nét kiến trúc mộc mạc nhưng đậm đà bản sắc của cha ông ta để lại.',
      duration: '2:15'
    },
    quizQuestions: [
      {
        id: 'q-ha-1',
        question: 'Mái ngói của Chùa Ha được lợp theo kiểu ngói gì đặc trưng của kiến trúc cổ Việt Nam?',
        options: ['Ngói tôn lạnh', 'Ngói mũi hài truyền thống', 'Ngói xi măng hiện đại', 'Ngói lưu ly cung đình'],
        category: 'kiến trúc'
      },
      {
        id: 'q-ha-2',
        question: 'Tại sao cột gỗ lim trong chùa lại được kê lên các chân tảng bằng đá xanh?',
        options: ['Để làm cho cột cao hơn', 'Để chống ẩm mốc và mối mọt từ lòng đất', 'Để di chuyển cột dễ dàng', 'Chỉ để trang trí cho đẹp'],
        category: 'kiến trúc'
      }
    ],
    isPublished: true,
    lastUpdated: '2026-10-27',
    coordinates: {
      lat: 21.4642,
      lng: 105.9385,
      isVerified: true,
      source: 'Tọa độ xác minh địa bàn xã Nhã Lộng, huyện Phú Bình, Thái Nguyên',
      notes: 'Khu vực Chùa Ha cổ kính cạnh sông Đào',
      altitudeMeters: 28
    },
    showOnSandtable: true
  },

  // 2. ĐÌNH HỘ LỆNH
  {
    id: 'chua-ho-lenh',
    name: 'Đình Hộ Lệnh',
    type: 'Đình',
    locality: 'Xã Điềm Thụy, tỉnh Thái Nguyên',
    rankingStatus: 'Nội dung đang cập nhật (Đang xác minh hồ sơ di tích)',
    isRankingVerified: false,
    period: 'Nội dung đang cập nhật',
    isPeriodVerified: false,
    shortSummary: 'Ngôi đình làng cổ kính phụng thờ Thành hoàng với kiến trúc đại đình trang nghiêm, cột gỗ lim vững chãi tại xã Điềm Thụy, tỉnh Thái Nguyên.',
    fullDescription: 'Đình Hộ Lệnh tọa lạc tại xã Điềm Thụy, tỉnh Thái Nguyên. Đây là trung tâm sinh hoạt tín ngưỡng và văn hóa cộng đồng lâu đời của nhân dân địa phương, nơi phụng thờ Thành hoàng làng che chở cho xóm làng bình an, mùa màng tươi tốt. Kiến trúc đại đình mang phong cách truyền thống Bắc Bộ với kết cấu khung gỗ lim vững chãi, hệ vì kèo chồng rường mộng gỗ tinh xảo và các cánh cửa bức bàn linh hoạt trong các dịp hội làng. (Lưu ý: Mọi nội dung chỉ thuộc phạm vi chùa trước đây được tách riêng để kiểm chứng; website hiện tập trung bảo tồn và giới thiệu chính xác giá trị kiến trúc nghệ thuật của Đình Hộ Lệnh).',
    architectureOverview: 'Đình Hộ Lệnh mang phong cách kiến trúc đình làng Bắc Bộ với kết cấu khung gỗ lim chịu lực vững chắc, lòng đình rộng rãi phục vụ tế lễ và hội làng. Mái đình uốn cong thanh thoát với các đầu đao vút lên trời xanh, hệ thống cửa bức bàn gỗ dày dặn che gió rét mùa đông và mở rộng đón gió mát mùa hè.',
    artisticSignificance: 'Nội dung đang cập nhật: Hoa văn chạm khắc đầu đao, hoành phi câu đối và các đồ tế tự cổ truyền mang dấu ấn điêu khắc dân gian.',
    coverImage: createArchitecturalSvg('ĐÌNH HỘ LỆNH', 'Di tích lịch sử văn hóa xã Điềm Thụy, tỉnh Thái Nguyên', '#3b0764', '#c084fc'),
    gallery: [
      {
        id: 'hl-g1',
        url: createArchitecturalSvg('Khuôn viên Đình Hộ Lệnh', 'Cây cổ thụ và sân đình rợp bóng mát', '#3b0764', '#e9d5ff'),
        title: 'Khuôn viên Đình Hộ Lệnh',
        description: 'Không gian xanh mát, tĩnh tại và uy nghiêm tại xã Điềm Thụy.'
      }
    ],
    scenes360: [
      {
        id: 'hl-scene-1',
        name: 'Sân Đình Hộ Lệnh',
        imageUrl: getProceduralPanorama('chua-ho-lenh', {
          skyColorTop: '#1e1b4b',
          skyColorHorizon: '#818cf8',
          floorColor: '#831843',
          roofTileColor: '#9d174d',
          pillarWoodColor: '#581c87',
          siteName: 'Đình Hộ Lệnh',
          sceneName: 'Sân Đình Hộ Lệnh'
        }),
        initialYaw: 0,
        initialPitch: 0,
        hotspots: [
          {
            id: 'hl-hs-1',
            title: 'Hệ Cửa Bức Bàn Gỗ Đình Hộ Lệnh',
            architecturalPart: 'Cửa & Vách gỗ',
            artisticValue: 'Cửa gỗ tấm tháo lắp linh hoạt, tạo sự thông thoáng khi có lễ hội làng đông người.',
            explanation: 'Cửa bức bàn là loại cửa đặc trưng gồm nhiều cánh ghép lại. Mỗi cánh chia thành các ô nhỏ gọi là lá panô, có thể tháo rời vào ngày hội lớn của đình làng.',
            detailedImage: createArchitecturalSvg('Cửa Bức Bàn Gỗ', 'Lá panô tháo mở tiện lợi', '#4c1d95', '#c4b5fd'),
            yaw: 10,
            pitch: -8,
            audioSnippet: {
              title: 'Thuyết minh Cửa Bức Bàn',
              text: 'Cửa bức bàn ở Đình Hộ Lệnh là nét duyên dáng của kiến trúc gỗ Việt Nam, vừa kín đáo che gió rét mùa đông, vừa mở rộng đón gió mát mùa hè.'
            }
          },
          {
            id: 'hl-hs-2',
            title: 'Đầu Đao Mái Đình Uốn Cong',
            architecturalPart: 'Mái đình / Chùa',
            artisticValue: 'Đường cong uyển chuyển vút lên trời xanh, tạo cảm giác nhẹ nhàng thanh thoát như cánh chim đang bay.',
            explanation: 'Đầu đao là phần góc mái uốn cong lên phía trên, vừa tạo vẻ đẹp thanh tao vừa giúp đón ánh sáng tự nhiên vào các gian thờ.',
            detailedImage: createArchitecturalSvg('Đầu Đao Mái Đình', 'Đường nét uốn cong thanh thoát', '#581c87', '#f472b6'),
            yaw: -35,
            pitch: 28,
            audioSnippet: {
              title: 'Thuyết minh Đầu Đao',
              text: 'Đầu đao cong vút là biểu tượng kinh điển của mái đình Việt Nam, gợi nhớ hình ảnh mũi thuyền vượt sóng của cư dân lúa nước xưa.'
            }
          }
        ],
        sceneTransitions: [
          {
            targetSceneId: 'hl-scene-interior',
            title: 'Vào Gian Đại Đình Uy Nghi',
            yaw: 5,
            pitch: -8
          }
        ]
      },
      {
        id: 'hl-scene-interior',
        name: 'Gian Đại Đình Uy Nghi',
        imageUrl: getProceduralPanorama('chua-ho-lenh-in', {
          skyColorTop: '#130426',
          skyColorHorizon: '#2e1065',
          floorColor: '#4c1d95',
          roofTileColor: '#581c87',
          pillarWoodColor: '#3b0764',
          siteName: 'Đình Hộ Lệnh',
          sceneName: 'Gian Đại Đình',
          isInterior: true
        }),
        initialYaw: 0,
        initialPitch: 0,
        hotspots: [
          {
            id: 'hl-hs-3',
            title: 'Khung Gỗ Lim Gian Đại Đình',
            architecturalPart: 'Cột & Chân tảng',
            artisticValue: 'Khung gỗ nguyên khối chắc chắn, giữ vững sự tôn nghiêm qua nhiều thăng trầm lịch sử.',
            explanation: 'Hệ thống cột gỗ lim tròn mài nhẵn đỡ lấy giàn vì nóc, tạo không gian nội thất đại đình rộng rãi và ấm cúng.',
            detailedImage: createArchitecturalSvg('Khung Gỗ Lim Đình Hộ Lệnh', 'Cột lim trầm mặc vững chãi', '#2e1065', '#d8b4fe'),
            yaw: -20,
            pitch: 5
          }
        ],
        sceneTransitions: [
          {
            targetSceneId: 'hl-scene-1',
            title: 'Trở lại Sân Đình Hộ Lệnh',
            yaw: 180,
            pitch: -8
          }
        ]
      }
    ],
    audioGuide: {
      title: 'Khám phá Đình Hộ Lệnh',
      transcript: 'Các em học sinh thân mến! Di tích lịch sử Đình Hộ Lệnh tại xã Điềm Thụy, tỉnh Thái Nguyên là niềm tự hào của người dân địa phương. Đình làng là không gian hội tụ sinh hoạt cộng đồng, nơi phụng thờ Thành hoàng và giáo dục con cháu về truyền thống uống nước nhớ nguồn. Hãy cùng chiêm ngưỡng nghệ thuật kiến trúc gỗ cổ truyền qua hệ mái đầu đao cong vút và những hàng cột lim uy nghiêm.',
      duration: '1:50'
    },
    quizQuestions: [
      {
        id: 'q-hl-1',
        question: 'Đặc điểm nào dưới đây là ưu điểm nổi bật của loại "Cửa bức bàn" ở Đình Hộ Lệnh và các ngôi đình cổ?',
        options: ['Làm bằng kim loại cách âm tuyệt đối', 'Có thể tháo lắp linh hoạt, tạo không gian mở', 'Chỉ mở được một cánh duy nhất', 'Dùng điều khiển từ xa'],
        category: 'kiến trúc'
      }
    ],
    isPublished: true,
    lastUpdated: '2026-10-27',
    coordinates: {
      lat: 21.4952,
      lng: 105.9083,
      isVerified: true,
      source: 'Tọa độ xác minh di tích Đình Hộ Lệnh, xã Điềm Thụy, huyện Phú Bình',
      notes: 'Di tích kiến trúc nghệ thuật gần KCN Điềm Thụy',
      altitudeMeters: 32
    },
    showOnSandtable: true
  },

  // 3. CHÙA ÚC KỲ
  {
    id: 'chua-uc-ky',
    name: 'Chùa Úc Kỳ',
    type: 'Chùa',
    locality: 'Xã Phú Bình, tỉnh Thái Nguyên',
    rankingStatus: 'Nội dung đang cập nhật (Đang hoàn thiện hồ sơ khoa học)',
    isRankingVerified: false,
    period: 'Nội dung đang cập nhật',
    isPeriodVerified: false,
    shortSummary: 'Ngôi chùa cổ hòa quyện trong không gian làng quê thanh bình tại xã Phú Bình, tỉnh Thái Nguyên, nơi lưu giữ tình làng nghĩa xóm và các giá trị văn hóa tâm linh đậm đà.',
    fullDescription: 'Chùa Úc Kỳ tọa lạc tại xã Phú Bình, tỉnh Thái Nguyên (gắn liền với làng nghề truyền thống làm tương nếp). Chùa là trung tâm sinh hoạt tín ngưỡng của cộng đồng cư dân nông nghiệp, nơi tổ chức các lễ cầu quốc thái dân an và mưa thuận gió hòa. Mọi tư liệu lịch sử chính thống về năm xây dựng và các văn bia đang được giáo viên và ban văn hóa địa phương cập nhật.',
    architectureOverview: 'Kiến trúc giản dị, gần gũi với chất liệu gỗ tự nhiên, gạch ngói nung thủ công và khuôn viên rợp bóng cây ăn quả, cây bóng mát cổ thụ.',
    artisticSignificance: 'Nội dung đang cập nhật: Chạm khắc dân gian hoa cúc cách điệu và mây lửa trên các xà nóc, con rường.',
    coverImage: createArchitecturalSvg('CHÙA ÚC KỲ', 'Hồn quê thanh bình vùng đất Thái Nguyên', '#064e3b', '#34d399'),
    gallery: [
      {
        id: 'uk-g1',
        url: createArchitecturalSvg('Chùa Úc Kỳ Trong Sắc Xuân', 'Bình yên sắc xuân nơi cửa thiền', '#064e3b', '#6ee7b7'),
        title: 'Cửa Thiền Tĩnh Mịch',
        description: 'Vẻ đẹp mộc mạc đậm chất làng quê đồng bằng Bắc Bộ.'
      }
    ],
    scenes360: [
      {
        id: 'uk-scene-1',
        name: 'Khuôn Viên & Tiền Đường Chùa Úc Kỳ',
        imageUrl: getProceduralPanorama('chua-uc-ky', {
          skyColorTop: '#064e3b',
          skyColorHorizon: '#6ee7b7',
          floorColor: '#783515',
          roofTileColor: '#991b1b',
          pillarWoodColor: '#365314',
          siteName: 'Chùa Úc Kỳ',
          sceneName: 'Sân Chùa & Tiền Đường'
        }),
        initialYaw: 0,
        initialPitch: 0,
        hotspots: [
          {
            id: 'uk-hs-1',
            title: 'Bức Chạm Hoa Cúc & Mây Lửa',
            architecturalPart: 'Hoa văn điêu khắc',
            artisticValue: 'Nét chạm đục mộc mạc, phóng khoáng mang đậm hơi thở của đời sống nông dân đồng bằng châu thổ.',
            explanation: 'Hoa cúc trong nghệ thuật truyền thống tượng trưng cho sự thanh cao và trường thọ, mây lửa tượng trưng cho ánh sáng và khát vọng mùa màng bội thu.',
            detailedImage: createArchitecturalSvg('Bức Chạm Hoa Cúc', 'Hoa văn điêu khắc mây lửa trường thọ', '#022c22', '#34d399'),
            yaw: 25,
            pitch: 16,
            audioSnippet: {
              title: 'Thuyết minh Hoa Cúc Mây Lửa',
              text: 'Bức chạm khắc hoa cúc và mây lửa tại Chùa Úc Kỳ gửi gắm lời nguyện ước của người nông dân về một cuộc sống no ấm, ấm no và mùa màng bội thu.'
            }
          }
        ],
        sceneTransitions: [
          {
            targetSceneId: 'uk-scene-interior',
            title: 'Vào Tòa Tam Bảo Chùa Úc Kỳ',
            yaw: 0,
            pitch: -6
          }
        ]
      },
      {
        id: 'uk-scene-interior',
        name: 'Tòa Tam Bảo Chùa Úc Kỳ',
        imageUrl: getProceduralPanorama('chua-uc-ky-in', {
          skyColorTop: '#042f2e',
          skyColorHorizon: '#115e59',
          floorColor: '#451a03',
          roofTileColor: '#783515',
          pillarWoodColor: '#064e3b',
          siteName: 'Chùa Úc Kỳ',
          sceneName: 'Tòa Tam Bảo',
          isInterior: true
        }),
        initialYaw: 0,
        initialPitch: 0,
        hotspots: [
          {
            id: 'uk-hs-2',
            title: 'Cột Gỗ & Chân Tảng Hoa Sen',
            architecturalPart: 'Cột & Chân tảng',
            artisticValue: 'Chân tảng đá được đẽo gọt dáng cánh hoa sen nở bung, nâng đỡ cột gỗ uy nghi.',
            explanation: 'Hình tượng hoa sen nâng đỡ chân cột biểu trưng cho sự thanh tịnh của nhà Phật giữa cõi đời.',
            detailedImage: createArchitecturalSvg('Chân Tảng Hoa Sen', 'Đế đá xanh chạm khắc cánh sen', '#064e3b', '#6ee7b7'),
            yaw: -30,
            pitch: -15
          }
        ],
        sceneTransitions: [
          {
            targetSceneId: 'uk-scene-1',
            title: 'Trở ra Sân Chùa',
            yaw: 180,
            pitch: -6
          }
        ]
      }
    ],
    audioGuide: {
      title: 'Ghé thăm Chùa Úc Kỳ',
      transcript: 'Về với Chùa Úc Kỳ tại xã Phú Bình, tỉnh Thái Nguyên hôm nay, bên cạnh hương vị tương nếp đậm đà, chúng ta còn được chiêm bái ngôi chùa cổ kính. Tiếng chuông chùa ngân vang lúc hoàng hôn gợi nhắc chúng ta về cội nguồn và tình yêu quê hương đất nước.',
      duration: '1:40'
    },
    quizQuestions: [
      {
        id: 'q-uk-1',
        question: 'Hình tượng hoa cúc chạm khắc trên gỗ ở các di tích cổ tượng trưng cho điều gì?',
        options: ['Sự giận dữ và quyền lực', 'Sự thanh cao, sức sống bền bỉ và trường thọ', 'Sự giàu sang phô trương', 'Chiến tranh khốc liệt'],
        category: 'nghệ thuật'
      }
    ],
    isPublished: true,
    lastUpdated: '2026-10-27',
    coordinates: {
      lat: 21.4583,
      lng: 105.9324,
      isVerified: true,
      source: 'Tọa độ xác minh di tích Chùa Úc Kỳ, xã Úc Kỳ, huyện Phú Bình',
      notes: 'Gắn liền không gian làng nghề tương nếp Úc Kỳ truyền thống',
      altitudeMeters: 25
    },
    showOnSandtable: true
  },

  // 4. ĐÌNH PHƯƠNG ĐỘ
  {
    id: 'dinh-phuong-do',
    name: 'Đình Phương Độ',
    type: 'Đình',
    locality: 'Xã Phú Bình, tỉnh Thái Nguyên',
    rankingStatus: 'Di tích Kiến trúc Nghệ thuật cấp Quốc gia',
    isRankingVerified: true,
    period: 'Thời Hậu Lê (thế kỷ XVII - XVIII) / Trùng tu thời Nguyễn',
    isPeriodVerified: true,
    shortSummary: 'Di tích kiến trúc nghệ thuật tiêu biểu bậc nhất với nghệ thuật chạm khắc rồng và hoa văn thời Lê độc đáo tại xã Phú Bình, tỉnh Thái Nguyên.',
    fullDescription: 'Đình Phương Độ tọa lạc tại xã Phú Bình, tỉnh Thái Nguyên, là ngôi đình cổ nổi tiếng, được công nhận là Di tích Kiến trúc Nghệ thuật cấp Quốc gia. Đình thờ các vị Thành hoàng làng có công hộ quốc an dân. Điểm đặc sắc nhất làm nên danh tiếng của Đình Phương Độ chính là kho tàng điêu khắc gỗ tinh xảo với hàng trăm hình tượng rồng lớn nhỏ, cảnh rồng ổ, rồng mẹ ôm con, rồng bay lượn trong mây với nghệ thuật đục lộng, chạm kênh bong đỉnh cao.',
    architectureOverview: 'Kiến trúc kiểu chữ Nhất gồm 5 gian 2 chái, cấu trúc sàn đình gỗ lim cao 0.8m so với mặt đất. Hệ thống vì kèo "giá chiêng chồng rường", các đầu bẩy và cốn mê chạm khắc dày đặc hoa văn.',
    artisticSignificance: 'Nghệ thuật chạm khắc gỗ thời Lê đạt đến đỉnh cao tinh tế: kỹ thuật chạm kênh bong nhiều tầng lớp, hình tượng rồng uốn khúc uyển chuyển, mắt lồi, râu bờm bay trong gió, mang tinh thần tự do phóng khoáng của văn hóa xóm làng.',
    coverImage: createArchitecturalSvg('ĐÌNH PHƯƠNG ĐỘ', 'Kiệt tác điêu khắc rồng thời Hậu Lê', '#78350f', '#f59e0b'),
    gallery: [
      {
        id: 'pd-g1',
        url: createArchitecturalSvg('Bức Cốn Mê Chạm Rồng', 'Nghệ thuật chạm kênh bong thời Hậu Lê', '#451a03', '#fbbf24'),
        title: 'Bức Cốn Mê Long Vân',
        description: 'Hình ảnh rồng mẹ rồng con quấn quýt giữa làn mây ngũ sắc.'
      },
      {
        id: 'pd-g2',
        url: createArchitecturalSvg('Mái Đình Phương Độ', 'Đầu đao cong vút rêu phong cổ kính', '#78350f', '#fde047'),
        title: 'Mái Đình Uốn Cong',
        description: 'Tỷ lệ mái đình đồ sộ, chiếm tới 2/3 chiều cao công trình.'
      }
    ],
    scenes360: [
      {
        id: 'pd-courtyard',
        name: 'Sân Đình & Mặt Tiền Đình Phương Độ',
        imageUrl: getProceduralPanorama('dinh-phuong-do', {
          skyColorTop: '#1e3a8a',
          skyColorHorizon: '#fde047',
          floorColor: '#991b1b',
          roofTileColor: '#b91c1c',
          pillarWoodColor: '#783515',
          siteName: 'Đình Phương Độ',
          sceneName: 'Sân Đình Đại Đình'
        }),
        initialYaw: 0,
        initialPitch: 0,
        hotspots: [
          {
            id: 'pd-hs-1',
            title: 'Bờ Nóc & Đầu Đao Cong Vút',
            architecturalPart: 'Mái đình / Chùa',
            artisticValue: 'Đầu đao uốn cong mạnh mẽ đắp nổi hình tượng rồng chầu, con nghê và phượng hoàng, thể hiện khát vọng vươn lên của dân làng.',
            explanation: 'Mái đình chiếm tới hai phần ba chiều cao tổng thể công trình. Bốn đầu đao uốn cong thanh thoát giúp công trình đồ sộ nhưng không hề nặng nề.',
            detailedImage: createArchitecturalSvg('Đầu Đao Đình Phương Độ', 'Cánh chim xòe cánh giữa trời xanh', '#78350f', '#f59e0b'),
            yaw: -28,
            pitch: 26,
            audioSnippet: {
              title: 'Thuyết minh Đầu Đao Đình Phương Độ',
              text: 'Ngắm nhìn đầu đao Đình Phương Độ cong vút lên nền trời xanh, ta như thấy được bàn tay tài hoa phi thường của những người thợ mộc xưa xứ Kinh Bắc - Thái Nguyên.'
            }
          },
          {
            id: 'pd-hs-2',
            title: 'Sàn Gỗ Lim Truyền Thống',
            architecturalPart: 'Sàn đình cổ',
            artisticValue: 'Nét kiến trúc sàn đình Bắc Bộ độc đáo, phân chia thứ bậc trong hương ước làng xã xưa.',
            explanation: 'Sàn đình được lát bằng các tấm ván gỗ lim dày, cách mặt đất khoảng 70 đến 80 cm để chống ẩm ướt và thoáng khí.',
            detailedImage: createArchitecturalSvg('Sàn Gỗ Lim Đình', 'Kiến trúc sàn cao chống ẩm mốc', '#451a03', '#d97706'),
            yaw: 30,
            pitch: -24,
            audioSnippet: {
              title: 'Thuyết minh Sàn Đình Phương Độ',
              text: 'Sàn đình là nơi hội họp bàn bạc việc làng của các cụ bô lão ngày xưa, vừa mát mẻ vào mùa hè vừa khô ráo vào mùa mưa lũ.'
            }
          }
        ],
        sceneTransitions: [
          {
            targetSceneId: 'pd-interior',
            title: 'Bước vào Tòa Đại Đình (Điêu khắc rồng)',
            yaw: 0,
            pitch: -6
          }
        ]
      },
      {
        id: 'pd-interior',
        name: 'Tòa Đại Đình (Không gian chạm khắc rồng)',
        imageUrl: getProceduralPanorama('dinh-phuong-do-in', {
          skyColorTop: '#180c06',
          skyColorHorizon: '#3b1809',
          floorColor: '#5a2d18',
          roofTileColor: '#783515',
          pillarWoodColor: '#3d1a0a',
          siteName: 'Đình Phương Độ',
          sceneName: 'Tòa Đại Đình',
          isInterior: true
        }),
        initialYaw: 0,
        initialPitch: 0,
        hotspots: [
          {
            id: 'pd-hs-3',
            title: 'Bức Cốn Mê Chạm Rồng "Long Vân Khánh Hội"',
            architecturalPart: 'Cốn mê & Bức cốn',
            artisticValue: 'Đỉnh cao điêu khắc gỗ thời Lê: kỹ thuật đục chạm kênh bong 3-4 tầng lớp không gian, rồng mẹ rồng con sống động chân thực.',
            explanation: 'Cốn mê là mảng gỗ hình tam giác nằm giữa cột cái và cột con. Thợ mộc xưa đã biến mảng gỗ thô sơ thành bức tranh nghệ thuật tuyệt mỹ với hình tượng rồng vờn mây.',
            detailedImage: createArchitecturalSvg('Cốn Mê Long Vân', 'Bảo vật điêu khắc gỗ thời Lê', '#451a03', '#f59e0b'),
            yaw: 12,
            pitch: 18,
            audioSnippet: {
              title: 'Thuyết minh Cốn Mê Đình Phương Độ',
              text: 'Đây là bảo vật nghệ thuật vô giá của Đình Phương Độ! Bức cốn chạm kênh bong đến mức ta có thể luồn ngón tay vào sau những chiếc râu rồng, thân rồng uốn lượn như đang sống động bay múa.'
            }
          }
        ],
        sceneTransitions: [
          {
            targetSceneId: 'pd-courtyard',
            title: 'Trở lại Sân Đình Phương Độ',
            yaw: 180,
            pitch: -6
          }
        ]
      }
    ],
    audioGuide: {
      title: 'Hành trình di sản Đình Phương Độ',
      transcript: 'Chào mừng các em đến với Đình Phương Độ, xã Phú Bình, tỉnh Thái Nguyên, di tích kiến trúc nghệ thuật cấp Quốc gia nổi tiếng. Ngôi đình là niềm tự hào lớn lao về nghệ thuật điêu khắc gỗ cổ truyền thời Lê của cha ông ta. Hãy cùng lắng nghe tiếng vọng của lịch sử qua từng thớ gỗ lim ngàn năm.',
      duration: '3:10'
    },
    quizQuestions: [
      {
        id: 'q-pd-1',
        question: 'Đình Phương Độ nổi tiếng nhất với giá trị nghệ thuật nào dưới đây?',
        options: ['Nghệ thuật đúc chuông đồng thời Lý', 'Nghệ thuật chạm khắc gỗ hình rồng thời Hậu Lê độc đáo', 'Nghệ thuật tranh kính hiện đại', 'Nghệ thuật gốm sứ Tây Sơn'],
        category: 'nghệ thuật'
      },
      {
        id: 'q-pd-2',
        question: 'Cấp xếp hạng di tích hiện tại của Đình Phương Độ là gì?',
        options: ['Di tích cấp Xã', 'Di tích cấp Huyện', 'Di tích Kiến trúc Nghệ thuật cấp Quốc gia', 'Di tích tạm thời'],
        category: 'lịch sử'
      }
    ],
    isPublished: true,
    lastUpdated: '2026-10-27',
    coordinates: {
      lat: 21.5034,
      lng: 105.9491,
      isVerified: true,
      source: 'Tọa độ xác minh di tích Đình Phương Độ, xã Xuân Phương, huyện Phú Bình',
      notes: 'Di tích Kiến trúc Nghệ thuật cấp Quốc gia thời Hậu Lê',
      altitudeMeters: 30
    },
    showOnSandtable: true
  },

  // 5. ĐÌNH XUÂN LA
  {
    id: 'dinh-xuan-la',
    name: 'Đình Xuân La',
    type: 'Đình',
    locality: 'Xã Phú Bình, tỉnh Thái Nguyên',
    rankingStatus: 'Nội dung đang cập nhật (Đang bổ sung tư liệu xếp hạng)',
    isRankingVerified: false,
    period: 'Nội dung đang cập nhật',
    isPeriodVerified: false,
    shortSummary: 'Ngôi đình làng cổ kính lưu giữ truyền thống đánh giặc giữ làng và nghệ thuật trang trí kiến trúc đình cổ truyền tại xã Phú Bình, tỉnh Thái Nguyên.',
    fullDescription: 'Đình Xuân La tọa lạc tại thôn Xuân La, xã Phú Bình, tỉnh Thái Nguyên. Ngôi đình thờ các bậc tiền nhân có công khai hoang lập ấp và che chở cho dân làng. Không gian đình rộng rãi, phía trước có ao đình và hàng cây bóng mát. Hiện tư liệu niên đại chính xác và các hồ sơ khoa học đang được hoàn thiện để cập nhật chính thống lên cổng thông tin.',
    architectureOverview: 'Quy mô bề thế với tòa đại đình gồm 5 gian gỗ lim to khỏe, vì kèo kết cấu vững chãi, hoành phi câu đối sơn son thếp vàng uy nghiêm.',
    artisticSignificance: 'Nội dung đang cập nhật: Chạm khắc đầu bẩy hình rồng ngậm ngọc, lá cúc hóa long và các bức y môn sơn thếp lộng lẫy.',
    coverImage: createArchitecturalSvg('ĐÌNH XUÂN LA', 'Không gian văn hóa truyền thống làng Xuân La', '#701a75', '#f472b6'),
    gallery: [
      {
        id: 'xl-g1',
        url: createArchitecturalSvg('Gian Đại Đình Xuân La', 'Nơi hội tụ lòng dân qua nhiều thế hệ', '#701a75', '#fbcfe8'),
        title: 'Gian Đại Đình',
        description: 'Không gian thờ tự trang nghiêm và ấm cúng.'
      }
    ],
    scenes360: [
      {
        id: 'xl-scene-1',
        name: 'Sân Đình & Mặt Tiền Đình Xuân La',
        imageUrl: getProceduralPanorama('dinh-xuan-la', {
          skyColorTop: '#1e1b4b',
          skyColorHorizon: '#f472b6',
          floorColor: '#831843',
          roofTileColor: '#9d174d',
          pillarWoodColor: '#701a75',
          siteName: 'Đình Xuân La',
          sceneName: 'Sân Đình & Đại Đình'
        }),
        initialYaw: 0,
        initialPitch: 0,
        hotspots: [
          {
            id: 'xl-hs-1',
            title: 'Đầu Bẩy Chạm Rồng Ngậm Ngọc',
            architecturalPart: 'Đầu bẩy & Kẻ hiên',
            artisticValue: 'Đầu bẩy vươn dài đỡ mái hiên, chạm hình đầu rồng khỏe khoắn, miệng ngậm viên ngọc quý tỏa sáng.',
            explanation: 'Bẩy là thanh gỗ gối lên đầu cột hàng hiên vươn ra ngoài để đỡ diềm mái. Người xưa đã khéo léo tạo hình bẩy thành rồng bay uy dũng.',
            detailedImage: createArchitecturalSvg('Đầu Bẩy Chạm Rồng', 'Rồng ngậm ngọc đỡ mái hiên đình', '#500724', '#f472b6'),
            yaw: -15,
            pitch: 19,
            audioSnippet: {
              title: 'Thuyết minh Đầu Bẩy Đình Xuân La',
              text: 'Đầu bẩy chạm hình rồng ngậm ngọc vừa có công năng gánh đỡ mái nặng, vừa thể hiện ước vọng về sự phồn vinh, mưa thuận gió hòa của người dân làng Xuân La.'
            }
          },
          {
            id: 'xl-hs-2',
            title: 'Hoành Phi & Câu Đối Cổ',
            architecturalPart: 'Hoa văn điêu khắc',
            artisticValue: 'Chữ Hán thếp vàng trên nền sơn then đen bóng hoặc sơn son rực rỡ, ca ngợi công đức tổ tiên.',
            explanation: 'Bức hoành phi treo ngang và đôi câu đối treo dọc hai cột cái, nhắc nhở con cháu đời đời ghi nhớ công ơn tiền nhân xây dựng quê hương.',
            detailedImage: createArchitecturalSvg('Hoành Phi Câu Đối', 'Nét chữ thếp vàng rực rỡ lưu truyền', '#701a75', '#fde047'),
            yaw: 22,
            pitch: 8,
            audioSnippet: {
              title: 'Thuyết minh Hoành Phi Câu Đối',
              text: 'Mỗi nét chữ trên hoành phi câu đối đều là bài học làm người, răn dạy con cháu thảo hiền, sống có đức và yêu thương làng xóm.'
            }
          }
        ],
        sceneTransitions: [
          {
            targetSceneId: 'xl-scene-interior',
            title: 'Vào Gian Đại Đình Uy Nghi',
            yaw: 0,
            pitch: -6
          }
        ]
      },
      {
        id: 'xl-scene-interior',
        name: 'Gian Đại Đình Uy Nghi',
        imageUrl: getProceduralPanorama('dinh-xuan-la-in', {
          skyColorTop: '#24061a',
          skyColorHorizon: '#4a044e',
          floorColor: '#701a75',
          roofTileColor: '#831843',
          pillarWoodColor: '#500724',
          siteName: 'Đình Xuân La',
          sceneName: 'Gian Đại Đình',
          isInterior: true
        }),
        initialYaw: 0,
        initialPitch: 0,
        hotspots: [
          {
            id: 'xl-hs-3',
            title: 'Cột Cái Gỗ Lim Ngàn Năm',
            architecturalPart: 'Cột & Chân tảng',
            artisticValue: 'Thân cột to lớn hai người ôm không xuể, vân gỗ lim bóng bẩy.',
            explanation: 'Cột cái đình làng thể hiện sức mạnh và sự trường tồn của cộng đồng làng xã.',
            detailedImage: createArchitecturalSvg('Cột Lim Đình Xuân La', 'Cột cái uy nghiêm vững chãi', '#4a044e', '#f472b6'),
            yaw: -32,
            pitch: 2
          }
        ],
        sceneTransitions: [
          {
            targetSceneId: 'xl-scene-1',
            title: 'Trở lại Sân Đình Xuân La',
            yaw: 180,
            pitch: -6
          }
        ]
      }
    ],
    audioGuide: {
      title: 'Về thăm Đình Xuân La',
      transcript: 'Hành trình đưa chúng ta đến với Đình Xuân La, xã Phú Bình, tỉnh Thái Nguyên. Mái ngói rêu phong, tiếng gió rì rào qua tán cây cổ thụ như đưa ta trở về không gian ngày hội làng rộn rã cờ hoa năm xưa.',
      duration: '2:05'
    },
    quizQuestions: [
      {
        id: 'q-xl-1',
        question: 'Bộ phận "Đầu bẩy" trong kiến trúc đình làng có công năng chính là gì?',
        options: ['Làm ghế ngồi nghỉ cho dân làng', 'Gối lên đầu cột vươn ra đỡ mái hiên đình', 'Để treo đèn lồng ngày tết', 'Làm cửa sổ thông gió'],
        category: 'kiến trúc'
      }
    ],
    isPublished: true,
    lastUpdated: '2026-10-27',
    coordinates: {
      lat: 21.4725,
      lng: 105.9782,
      isVerified: true,
      source: 'Tọa độ xác minh di tích Đình Xuân La, xã Thanh Ninh, huyện Phú Bình',
      notes: 'Đình làng cổ truyền thống xã Thanh Ninh',
      altitudeMeters: 26
    },
    showOnSandtable: true
  }
];

export const INITIAL_BADGES = [
  {
    id: 'badge-seed',
    name: 'Hạt Giống Văn Hóa',
    description: 'Khám phá thành công di tích lịch sử đầu tiên',
    icon: '🌱',
    unlocked: false,
    requirement: 'Khám phá 1 di tích'
  },
  {
    id: 'badge-explorer',
    name: 'Nhà Thám Hiểm Di Sản',
    description: 'Tham quan và khám phá toàn bộ 5 di tích lịch sử',
    icon: '🧭',
    unlocked: false,
    requirement: 'Khám phá đủ 5 di tích'
  },
  {
    id: 'badge-decoder',
    name: 'Chuyên Gia Giải Mã Kiến Trúc',
    description: 'Giải mã trên 5 chi tiết kiến trúc nghệ thuật 360°',
    icon: '🏛️',
    unlocked: false,
    requirement: 'Giải mã 5 điểm kiến trúc'
  },
  {
    id: 'badge-scholar',
    name: 'Học Giả Di Sản Nhí',
    description: 'Đạt từ 80 điểm trở lên trong các thử thách đố vui',
    icon: '📜',
    unlocked: false,
    requirement: 'Đạt 80 điểm thử thách'
  },
  {
    id: 'badge-puzzle-master',
    name: 'Nghệ Nhân Ghép Tranh',
    description: 'Hoàn thành thử thách ghép hình di tích lịch sử',
    icon: '🧩',
    unlocked: false,
    requirement: 'Ghép tranh di tích thành công'
  },
  {
    id: 'badge-ambassador',
    name: 'Đại Sứ Di Sản Quê Em',
    description: 'Hoàn thành xuất sắc toàn bộ hành trình khám phá',
    icon: '🏆',
    unlocked: false,
    requirement: 'Mở khóa chứng nhận danh dự'
  }
];
