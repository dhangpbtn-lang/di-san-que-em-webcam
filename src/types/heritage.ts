/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Hotspot {
  id: string;
  title: string;
  architecturalPart: string;
  artisticValue: string;
  explanation: string;
  detailedImage: string;
  yaw: number; // -180 to 180 degrees
  pitch: number; // -90 to 90 degrees
  audioSnippet?: {
    title: string;
    text: string;
    fileUrl?: string;
  };
}

export interface Scene360 {
  id: string;
  name: string;
  imageUrl: string;
  initialYaw?: number;
  initialPitch?: number;
  hotspots: Hotspot[];
  sceneTransitions?: {
    targetSceneId: string;
    title: string;
    yaw: number;
    pitch: number;
  }[];
}

export interface QuizQuestion {
  id: string;
  siteId?: string;
  question: string;
  options: string[];
  hint?: string;
  category: 'kiến trúc' | 'nghệ thuật' | 'lịch sử' | 'văn hóa';
  correctIndex?: number;
  explanation?: string;
}

export interface SecretQuizAnswerKey {
  id: string;
  siteId: string;
  correctIndex: number;
  explanation: string;
  points: number;
}

export interface HeritageSite {
  id: string;
  name: string;
  type: 'Chùa' | 'Đình' | 'Cụm di tích';
  locality: string;
  rankingStatus: string; // e.g. "Di tích cấp Quốc gia" hoặc "Nội dung đang cập nhật"
  isRankingVerified: boolean;
  period: string; // Niên đại
  isPeriodVerified: boolean;
  shortSummary: string;
  fullDescription: string;
  architectureOverview: string;
  artisticSignificance: string;
  coverImage: string;
  externalTourUrl?: string; // Tích hợp link tour 360 thực tế ảo (vd: Netlify tour cho Chùa Ha)
  gallery: {
    id: string;
    url: string;
    title: string;
    description: string;
    is360?: boolean;
  }[];
  scenes360: Scene360[];
  audioGuide: {
    title: string;
    fileUrl?: string;
    transcript: string;
    duration?: string;
  };
  quizQuestions: QuizQuestion[];
  isPublished: boolean;
  lastUpdated: string;
  coordinates?: SiteCoordinates;
  showOnSandtable?: boolean;
  documentarySources?: string[];
  sandtableMission?: string;
}

export interface SiteCoordinates {
  lat?: number;
  lng?: number;
  isVerified: boolean;
  notes?: string;
  source?: string;
  altitudeMeters?: number;
}

export interface SandtableSettings {
  centerLng: number;
  centerLat: number;
  defaultZoom: number;
  defaultPitch: number;
  defaultBearing: number;
  terrainExaggeration: number;
  activeMapStyle: 'satellite' | 'topo';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  requirement: string;
}

export interface StudentProgress {
  studentName: string;
  studentSchool: string;
  studentClass: string;
  exploredSites: string[]; // site IDs
  decodedHotspots: string[]; // hotspot IDs
  audioListened: string[]; // site IDs
  quizScores: Record<string, number>; // questionId or siteId -> score
  jigsawCompleted: string[]; // site IDs
  mysteryCompleted: string[]; // site IDs
  totalPoints: number;
  completedAt?: string;
  answeredQuestions?: Record<string, boolean>; // questionId -> boolean to prevent duplicate points
}
