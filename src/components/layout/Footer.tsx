/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, ShieldAlert } from 'lucide-react';
import { AppView } from './Header';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#160803] border-t-2 border-amber-800/60 text-amber-200/90 pt-10 pb-8 mt-16 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-amber-900/50">
          {/* Col 1: About */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏛️</span>
              <h3 className="font-serif font-black text-lg text-amber-100">
                DI SẢN QUÊ EM
              </h3>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed font-serif max-w-md">
              Dự án website giáo dục trải nghiệm dành cho học sinh THCS, kết nối tình yêu di sản thông qua công nghệ thực tế ảo 360°, giải mã tinh hoa nghệ thuật chạm khắc và các trò chơi tương tác hấp dẫn.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-950/60 p-2.5 rounded-xl border border-amber-800/50 w-fit">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Dữ liệu lịch sử đang trong quá trình đối chiếu và bổ sung tư liệu thực địa.</span>
            </div>
          </div>

          {/* Col 2: Danh sách 5 di tích */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-bold tracking-wider text-amber-300">
              5 Di tích lịch sử
            </h4>
            <ul className="text-xs space-y-1.5 text-amber-100/70">
              <li className="hover:text-amber-300 cursor-pointer" onClick={() => onNavigate('virtual-tour')}>
                • Chùa Ha (Xã Phú Bình, tỉnh Thái Nguyên)
              </li>
              <li className="hover:text-amber-300 cursor-pointer" onClick={() => onNavigate('virtual-tour')}>
                • Đình Hộ Lệnh (Xã Điềm Thụy, tỉnh Thái Nguyên)
              </li>
              <li className="hover:text-amber-300 cursor-pointer" onClick={() => onNavigate('virtual-tour')}>
                • Chùa Úc Kỳ (Xã Phú Bình, tỉnh Thái Nguyên)
              </li>
              <li className="hover:text-amber-300 cursor-pointer" onClick={() => onNavigate('virtual-tour')}>
                • Đình Phương Độ (Xã Phú Bình, tỉnh Thái Nguyên)
              </li>
              <li className="hover:text-amber-300 cursor-pointer" onClick={() => onNavigate('virtual-tour')}>
                • Đình Xuân La (Xã Phú Bình, tỉnh Thái Nguyên)
              </li>
            </ul>
          </div>

          {/* Col 3: Chức năng học tập */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-bold tracking-wider text-amber-300">
              Hoạt động học tập
            </h4>
            <ul className="text-xs space-y-1.5 text-amber-100/70">
              <li className="hover:text-amber-300 cursor-pointer" onClick={() => onNavigate('virtual-tour')}>
                • Tham quan thực tế ảo 360°
              </li>
              <li className="hover:text-amber-300 cursor-pointer" onClick={() => onNavigate('library')}>
                • Giải mã kiến trúc & nghệ thuật
              </li>
              <li className="hover:text-amber-300 cursor-pointer" onClick={() => onNavigate('challenge')}>
                • Thử thách đố vui & ghép hình
              </li>
              <li className="hover:text-amber-300 cursor-pointer" onClick={() => onNavigate('achievements')}>
                • Nhận giấy chứng nhận danh dự
              </li>
              <li className="hover:text-amber-300 cursor-pointer" onClick={() => onNavigate('admin')}>
                • Cổng quản trị dành cho Thầy Cô
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-amber-300/60 gap-2">
          <p>© 2026 Di Sản Quê Em • Bảo tồn & Lan tỏa giá trị di sản văn hóa dân tộc.</p>
          <p className="flex items-center gap-1">
            <span>Thiết kế dành cho học sinh THCS</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>Việt Nam</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
