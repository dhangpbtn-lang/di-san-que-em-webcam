/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedurally generates authentic 2:1 Equirectangular 360 Panorama canvases
// representing Vietnamese heritage courtyards, wooden beam architecture, and sanctums.

interface PanoramaTheme {
  skyColorTop: string;
  skyColorHorizon: string;
  floorColor: string;
  roofTileColor: string;
  pillarWoodColor: string;
  siteName: string;
  sceneName: string;
  isInterior?: boolean;
}

const memoizedPanoramas: Record<string, string> = {};

export function getProceduralPanorama(id: string, theme: PanoramaTheme): string {
  const cacheKey = `${id}_${theme.sceneName}`;
  if (memoizedPanoramas[cacheKey]) {
    return memoizedPanoramas[cacheKey];
  }

  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const { isInterior } = theme;

  if (isInterior) {
    // Interior Sanctuary (Đại Đình / Tiền Đường)
    // Dark lacquered wood ceiling and trusses
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    ceilGrad.addColorStop(0, '#1c0f08');
    ceilGrad.addColorStop(0.7, '#2e1810');
    ceilGrad.addColorStop(1, '#4a2511');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, width, height * 0.45);

    // Stone / brick tiled floor
    const floorGrad = ctx.createLinearGradient(0, height * 0.45, 0, height);
    floorGrad.addColorStop(0, '#5a2d18');
    floorGrad.addColorStop(0.3, '#783515');
    floorGrad.addColorStop(1, '#3b1809');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, height * 0.45, width, height * 0.55);

    // Draw timber framing: rafters, tie-beams (Kèo, Xà, Hoành)
    ctx.strokeStyle = '#2b1408';
    ctx.lineWidth = 14;
    for (let x = 0; x < width; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height * 0.42);
      ctx.stroke();
    }
    // Horizontal beams
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#3d1a0a';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.38);
    ctx.lineTo(width, height * 0.38);
    ctx.stroke();

    // Central Altar / Hương án & Hoành phi câu đối (Altar area in the center)
    const altarX = width * 0.5;
    const altarY = height * 0.46;
    // Golden glow behind altar
    const glow = ctx.createRadialGradient(altarX, altarY - 20, 10, altarX, altarY, 220);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(altarX, altarY, 220, 0, Math.PI * 2);
    ctx.fill();

    // Red and Gold Lacquered Board (Hoành phi)
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(altarX - 160, altarY - 110, 320, 55);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(altarX - 160, altarY - 110, 320, 55);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 26px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.fillText('VẠN CỔ ANH LINH', altarX, altarY - 73);

    // Lacquered Altar Table (Hương án gỗ sơn son thếp vàng)
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(altarX - 140, altarY, 280, 140);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(altarX - 140, altarY, 280, 140);

    // Incense Burner (Lư hương đồng)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(altarX, altarY + 30, 28, 0, Math.PI * 2);
    ctx.fill();

    // Massive Ironwood Pillars (Cột gỗ lim nguyên khối)
    const pillarPositions = [0.12, 0.28, 0.42, 0.58, 0.72, 0.88];
    pillarPositions.forEach((pos) => {
      const px = width * pos;
      const gradPillar = ctx.createLinearGradient(px - 35, 0, px + 35, 0);
      gradPillar.addColorStop(0, '#1c0f08');
      gradPillar.addColorStop(0.5, '#451a03');
      gradPillar.addColorStop(1, '#1c0f08');
      ctx.fillStyle = gradPillar;
      ctx.fillRect(px - 35, height * 0.15, 70, height * 0.65);

      // Stone base for pillar (Chân tảng đá xanh)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px - 45, height * 0.77, 90, 28);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 45, height * 0.77, 90, 28);
    });

  } else {
    // Exterior Panorama (Courtyard, curved roofs, stone stele, banyan tree)
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.5);
    skyGrad.addColorStop(0, theme.skyColorTop || '#1e3a8a');
    skyGrad.addColorStop(0.7, theme.skyColorHorizon || '#93c5fd');
    skyGrad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.5);

    // Soft clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 8; i++) {
      const cx = (i * 310 + 70) % width;
      const cy = 120 + (i % 3) * 60;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.arc(cx + 60, cy - 20, 65, 0, Math.PI * 2);
      ctx.arc(cx + 120, cy, 75, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant ancient trees
    ctx.fillStyle = '#14532d';
    for (let x = 0; x < width; x += 180) {
      ctx.beginPath();
      ctx.arc(x, height * 0.45, 90, 0, Math.PI, true);
      ctx.fill();
    }

    // Courtyard Floor (Sân gạch Bát Tràng đỏ gạch)
    const floorGrad = ctx.createLinearGradient(0, height * 0.48, 0, height);
    floorGrad.addColorStop(0, theme.floorColor || '#991b1b');
    floorGrad.addColorStop(0.5, '#7f1d1d');
    floorGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, height * 0.48, width, height * 0.52);

    // Brick paving perspective grid
    ctx.strokeStyle = 'rgba(254, 202, 202, 0.22)';
    ctx.lineWidth = 1.5;
    for (let row = 0; row < 14; row++) {
      const y = height * 0.48 + Math.pow(row / 14, 1.8) * (height * 0.52);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let col = 0; col < 32; col++) {
      const x0 = width * 0.5;
      const y0 = height * 0.48;
      const x1 = (col / 32) * width;
      const y1 = height;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // Central Traditional Building (Đình / Chùa facade)
    const bCenter = width * 0.5;
    const bWidth = 680;
    const bHeight = 240;
    const bTop = height * 0.26;

    // Curved Terracotta Roof (Mái ngói mũi hài uốn cong)
    ctx.fillStyle = theme.roofTileColor || '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(bCenter - bWidth * 0.58, bTop + 90); // curved tip (Đầu đao cong vút)
    ctx.quadraticCurveTo(bCenter - bWidth * 0.35, bTop + 35, bCenter, bTop);
    ctx.quadraticCurveTo(bCenter + bWidth * 0.35, bTop + 35, bCenter + bWidth * 0.58, bTop + 90);
    ctx.lineTo(bCenter + bWidth * 0.52, bTop + 140);
    ctx.lineTo(bCenter - bWidth * 0.52, bTop + 140);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Dragon ridge finial (Bờ nóc chạm rồng chầu mặt nguyệt)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(bCenter, bTop - 12, 18, 0, Math.PI * 2);
    ctx.fill();

    // Wooden walls and verandas
    ctx.fillStyle = '#451a03';
    ctx.fillRect(bCenter - bWidth * 0.45, bTop + 140, bWidth * 0.9, 130);

    // Stone Steps & Porch (Bậc tam cấp đá xanh)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(bCenter - bWidth * 0.48, bTop + 270, bWidth * 0.96, 45);
    ctx.fillStyle = '#475569';
    ctx.fillRect(bCenter - bWidth * 0.5, bTop + 300, bWidth, 25);

    // Front Wooden Pillars
    for (let p = -3; p <= 3; p++) {
      const px = bCenter + p * 85;
      ctx.fillStyle = '#783515';
      ctx.fillRect(px - 14, bTop + 140, 28, 130);
      // Stone base
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px - 18, bTop + 262, 36, 12);
    }

    // Great Bronze Incense Urn in the courtyard (Lư hương đồng)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(bCenter, height * 0.65, 45, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Smoke wisps
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bCenter, height * 0.63);
    ctx.bezierCurveTo(bCenter - 15, height * 0.58, bCenter + 15, height * 0.54, bCenter, height * 0.48);
    ctx.stroke();
  }

  // Vietnamese Heritage Decorative Border / Watermark (subtle museum signature)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 20px "Playfair Display", serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${theme.siteName} • ${theme.sceneName}`, width - 30, height - 30);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  memoizedPanoramas[cacheKey] = dataUrl;
  return dataUrl;
}
