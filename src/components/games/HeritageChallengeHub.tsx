/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { HeritageSite, QuizQuestion } from '../../types/heritage';
import { heritageAudio } from '../../utils/audioSystem';
import {
  HelpCircle,
  Puzzle,
  Eye,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Search,
  Loader2
} from 'lucide-react';
import { submitQuizAnswerToCloud } from '../../services/quizService';

interface HeritageChallengeHubProps {
  sites: HeritageSite[];
  onAddPoints: (points: number) => void;
  onRecordPuzzleSuccess: (siteId: string) => void;
}

type ChallengeTab = 'quiz' | 'identify' | 'jigsaw' | 'mystery';

export const HeritageChallengeHub: React.FC<HeritageChallengeHubProps> = ({
  sites,
  onAddPoints,
  onRecordPuzzleSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<ChallengeTab>('quiz');

  // GAME 1: QUIZ STATE
  const allQuestions: { question: QuizQuestion; siteId: string; siteName: string }[] = sites.flatMap((s) =>
    s.quizQuestions.map((q) => ({ question: q, siteId: s.id, siteName: s.name }))
  );
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    isCorrect: boolean;
    explanation: string;
    earnedPoints: number;
    alreadyAnswered?: boolean;
  } | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  // GAME 2: ARCHITECTURAL IDENTIFIER STATE
  const identificationItems = [
    {
      id: 'id-1',
      title: 'Bức Cốn Mê "Long Vân Khánh Hội"',
      site: 'Đình Phương Độ',
      description: 'Chạm khắc rồng mẹ rồng con kênh bong nhiều tầng lớp tinh xảo thời Hậu Lê tại Đình Phương Độ (xã Phú Bình, tỉnh Thái Nguyên).',
      image: sites.find((s) => s.id === 'dinh-phuong-do')?.gallery[0]?.url || '',
      category: 'Điêu khắc gỗ',
    },
    {
      id: 'id-2',
      title: 'Kèo Chồng Rường & Mái Ngói Mũi Hài',
      site: 'Chùa Ha',
      description: 'Hệ mộng gỗ lim chắc chắn kết hợp ngói nung dáng mũi hài uốn cong tại Chùa Ha (xã Phú Bình, tỉnh Thái Nguyên).',
      image: sites.find((s) => s.id === 'chua-ha')?.gallery[0]?.url || '',
      category: 'Kết cấu chịu lực',
    },
    {
      id: 'id-3',
      title: 'Đầu Bẩy Hiên Chạm Rồng Ngậm Ngọc',
      site: 'Đình Xuân La',
      description: 'Thanh gỗ nhô ra đỡ tàu mái hiên đình làng, uốn lượn uy nghiêm tại Đình Xuân La (xã Phú Bình, tỉnh Thái Nguyên).',
      image: sites.find((s) => s.id === 'dinh-xuan-la')?.gallery[0]?.url || '',
      category: 'Hoa văn trang trí',
    },
    {
      id: 'id-4',
      title: 'Cửa Bức Bàn Tháo Lắp Linh Hoạt',
      site: 'Đình Hộ Lệnh',
      description: 'Hệ cửa gồm nhiều lá panô gỗ cổ truyền, tháo dỡ tiện lợi vào mùa lễ hội tại Đình Hộ Lệnh (xã Điềm Thụy, tỉnh Thái Nguyên).',
      image: sites.find((s) => s.id === 'chua-ho-lenh')?.gallery[0]?.url || '',
      category: 'Nội thất & Cửa',
    },
  ];
  const [identifyIndex, setIdentifyIndex] = useState(0);
  const [identifyGuess, setIdentifyGuess] = useState<string | null>(null);
  const [identifySubmitted, setIdentifySubmitted] = useState(false);
  const [identifyScore, setIdentifyScore] = useState(0);

  // GAME 3: JIGSAW PUZZLE STATE
  const [puzzleSiteIndex, setPuzzleSiteIndex] = useState(3);
  const puzzleSize = 3;
  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [puzzleMoves, setPuzzleMoves] = useState(0);

  const initPuzzle = () => {
    const array = Array.from({ length: puzzleSize * puzzleSize }, (_, i) => i);
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    setTiles(array);
    setSelectedTile(null);
    setIsPuzzleSolved(false);
    setPuzzleMoves(0);
  };

  useEffect(() => {
    initPuzzle();
  }, [puzzleSiteIndex]);

  const handleTileClick = (index: number) => {
    if (isPuzzleSolved) return;
    heritageAudio.playClick();

    if (selectedTile === null) {
      setSelectedTile(index);
    } else {
      const newTiles = [...tiles];
      [newTiles[selectedTile], newTiles[index]] = [newTiles[index], newTiles[selectedTile]];
      setTiles(newTiles);
      setSelectedTile(null);
      setPuzzleMoves((m) => m + 1);

      const solved = newTiles.every((val, idx) => val === idx);
      if (solved) {
        setIsPuzzleSolved(true);
        heritageAudio.playCorrect();
        heritageAudio.playFanfare();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        onAddPoints(50);
        onRecordPuzzleSuccess(sites[puzzleSiteIndex].id);
      }
    }
  };

  // GAME 4: MYSTERY HERITAGE GUESSER
  const mysteryRounds = [
    {
      id: 'mys-1',
      clues: [
        'Di tích kiến trúc nghệ thuật cấp Quốc gia tại xã Phú Bình, tỉnh Thái Nguyên.',
        'Nổi tiếng với hàng trăm hình tượng rồng thời Hậu Lê chạm kênh bong tinh xảo.',
        'Có sàn đình bằng gỗ lim cao khoảng 80cm mát rượi.',
        'Kiến trúc hình chữ Nhất gồm 5 gian 2 chái đồ sộ.',
      ],
      correctSiteId: 'dinh-phuong-do',
      correctName: 'Đình Phương Độ',
    },
    {
      id: 'mys-2',
      clues: [
        'Tọa lạc tại xã Phú Bình, tỉnh Thái Nguyên, không gian thanh tịnh rợp bóng cây cổ thụ.',
        'Hệ mái lợp ngói mũi hài rêu phong và vì nóc chồng rường vững chãi.',
        'Cột cái gỗ lim kê trên chân tảng đá xanh chống mối mọt.',
        'Nơi sinh hoạt tín ngưỡng Phật giáo lâu đời của nhân dân.',
      ],
      correctSiteId: 'chua-ha',
      correctName: 'Chùa Ha',
    },
    {
      id: 'mys-3',
      clues: [
        'Nằm ở xã Phú Bình, tỉnh Thái Nguyên, là ngôi đình làng thờ Thành hoàng làng che chở cho dân làng.',
        'Có đầu bẩy hiên chạm hình đầu rồng ngậm viên ngọc quý.',
        'Lưu giữ nhiều hoành phi, câu đối cổ ca ngợi công đức tiền nhân.',
        'Quy mô bề thế với tòa đại đình gồm 5 gian gỗ lim to khỏe.',
      ],
      correctSiteId: 'dinh-xuan-la',
      correctName: 'Đình Xuân La',
    },
  ];
  const [mysteryIndex, setMysteryIndex] = useState(0);
  const [revealedClues, setRevealedClues] = useState(1);
  const [mysteryGuess, setMysteryGuess] = useState<string | null>(null);
  const [mysterySubmitted, setMysterySubmitted] = useState(false);
  const [mysteryScore, setMysteryScore] = useState(0);

  const handleSelectQuizOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
    heritageAudio.playClick();
  };

  const handleSubmitQuizAnswer = async () => {
    if (selectedOption === null || isAnswerSubmitted || isVerifying) return;
    setIsVerifying(true);
    const cur = allQuestions[currentQuizIndex];
    try {
      const result = await submitQuizAnswerToCloud(cur.siteId, cur.question.id, selectedOption);
      setQuizResult(result);
      setIsAnswerSubmitted(true);

      if (result.isCorrect) {
        heritageAudio.playCorrect();
        if (result.earnedPoints > 0) {
          setQuizScore((s) => s + result.earnedPoints);
          onAddPoints(result.earnedPoints);
        }
      } else {
        heritageAudio.playClick();
      }
    } catch {
      setIsAnswerSubmitted(true);
      setQuizResult({
        isCorrect: false,
        explanation: 'Không thể kết nối máy chủ chấm điểm lúc này.',
        earnedPoints: 0,
        alreadyAnswered: false,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex < allQuestions.length - 1) {
      setCurrentQuizIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setQuizResult(null);
    } else {
      heritageAudio.playFanfare();
      confetti({ particleCount: 80, spread: 60 });
    }
  };

  return (
    <div className="w-full bg-[#1e0e08]/95 border-2 border-amber-700/50 rounded-3xl p-4 md:p-8 text-amber-100 shadow-2xl space-y-6">
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-800/40">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
            CHỨNG MINH TÀI NĂNG HỌC HỎI
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-extrabold text-amber-200">
            Thử Thách Di Sản Quê Em
          </h2>
          <p className="text-xs md:text-sm text-amber-300/80 mt-1">
            4 trò chơi tương tác: Trắc nghiệm, Nhận diện, Ghép tranh & Đoán di tích bí ẩn.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-stone-950/80 rounded-2xl border border-amber-800/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('quiz');
              heritageAudio.playClick();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'quiz'
                ? 'bg-gradient-to-r from-red-800 to-amber-700 text-white shadow-md'
                : 'text-amber-300/80 hover:text-white hover:bg-stone-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Trắc nghiệm ({quizScore}đ)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('identify');
              heritageAudio.playClick();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'identify'
                ? 'bg-gradient-to-r from-red-800 to-amber-700 text-white shadow-md'
                : 'text-amber-300/80 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Nhận diện</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('jigsaw');
              heritageAudio.playClick();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'jigsaw'
                ? 'bg-gradient-to-r from-red-800 to-amber-700 text-white shadow-md'
                : 'text-amber-300/80 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Puzzle className="w-4 h-4" />
            <span>Ghép hình</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('mystery');
              heritageAudio.playClick();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              activeTab === 'mystery'
                ? 'bg-gradient-to-r from-red-800 to-amber-700 text-white shadow-md'
                : 'text-amber-300/80 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Di tích bí ẩn</span>
          </button>
        </div>
      </div>

      {/* QUIZ TAB */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          {currentQuizIndex < allQuestions.length ? (
            <div className="bg-stone-950/60 border border-amber-700/40 rounded-2xl p-5 md:p-7 space-y-5">
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span className="px-3 py-1 bg-amber-950/80 rounded-full border border-amber-600/50">
                  Câu hỏi {currentQuizIndex + 1} / {allQuestions.length} • {allQuestions[currentQuizIndex].siteName}
                </span>
                <span className="font-mono text-amber-300">Điểm hiện tại: {quizScore}</span>
              </div>

              <h3 className="text-base md:text-xl font-serif font-bold text-amber-100 leading-snug">
                {allQuestions[currentQuizIndex].question.question}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {allQuestions[currentQuizIndex].question.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  let style = 'bg-stone-900/80 hover:bg-stone-800 border-amber-900/60 text-amber-200';

                  if (isAnswerSubmitted && quizResult) {
                    if (isSelected && quizResult.isCorrect) {
                      style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isSelected && !quizResult.isCorrect) {
                      style = 'bg-red-950/80 border-red-500 text-red-200';
                    } else {
                      style = 'bg-stone-900/40 border-stone-800 text-amber-200/50';
                    }
                  } else if (isSelected) {
                    style = 'bg-amber-900/80 border-amber-400 text-white font-bold ring-2 ring-amber-400';
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isAnswerSubmitted || isVerifying}
                      onClick={() => handleSelectQuizOption(idx)}
                      className={`p-4 rounded-xl text-left text-sm md:text-base border transition-all flex items-start gap-3 ${style}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-stone-950/60 border border-current flex items-center justify-center shrink-0 font-bold text-xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {isAnswerSubmitted && quizResult && (
                <div
                  className={`p-4 rounded-2xl border space-y-2 ${
                    quizResult.isCorrect
                      ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
                      : 'bg-red-950/60 border-red-500/60 text-red-100'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {quizResult.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>
                          {quizResult.earnedPoints > 0
                            ? `Chính xác tuyệt vời! (+${quizResult.earnedPoints} điểm)`
                            : 'Chính xác! (Câu hỏi này em đã nhận điểm trước đó)'}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-400" />
                        <span>Chưa chính xác rồi em nhé!</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs md:text-sm leading-relaxed text-amber-100/90 font-serif">
                    <span className="font-sans font-bold text-amber-300">Giải thích: </span>
                    {quizResult.explanation}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                {!isAnswerSubmitted ? (
                  <button
                    type="button"
                    disabled={selectedOption === null || isVerifying}
                    onClick={handleSubmitQuizAnswer}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 text-stone-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang chấm điểm trên máy chủ...</span>
                      </>
                    ) : (
                      <span>Kiểm tra câu trả lời</span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuizQuestion}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
                  >
                    <span>{currentQuizIndex < allQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem tổng kết'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-4 bg-stone-950/60 border border-amber-700/40 rounded-2xl p-6">
              <Trophy className="w-16 h-16 text-amber-400 mx-auto" />
              <h3 className="text-2xl font-serif font-bold text-amber-200">
                Chúc mừng em đã hoàn thành Thử thách Trắc nghiệm!
              </h3>
              <p className="text-amber-100/80">
                Tổng điểm đạt được: <span className="text-amber-300 font-bold text-xl">{quizScore} điểm</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setCurrentQuizIndex(0);
                  setSelectedOption(null);
                  setIsAnswerSubmitted(false);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại từ đầu</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* IDENTIFY TAB */}
      {activeTab === 'identify' && (
        <div className="space-y-6">
          <div className="bg-stone-950/60 border border-amber-700/40 rounded-2xl p-5 md:p-7 space-y-5">
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span className="px-3 py-1 bg-amber-950/80 rounded-full border border-amber-600/50">
                Chi tiết {identifyIndex + 1} / {identificationItems.length} • Thử tài quan sát
              </span>
              <span className="font-mono text-amber-300">Điểm nhận diện: {identifyScore}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="rounded-2xl overflow-hidden border-2 border-amber-700/60 bg-stone-950 shadow-xl relative">
                <img
                  src={identificationItems[identifyIndex].image}
                  alt="Chi tiết kiến trúc"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-amber-950/90 text-amber-300 text-xs font-semibold rounded-full border border-amber-600/60">
                  {identificationItems[identifyIndex].category}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-base md:text-lg font-serif font-bold text-amber-200">
                  Chi tiết kiến trúc đặc sắc này thuộc về di tích lịch sử nào?
                </h4>
                <p className="text-xs text-amber-300/70 italic">
                  Gợi ý: « {identificationItems[identifyIndex].description} »
                </p>

                <div className="space-y-2 pt-2">
                  {sites.map((site) => {
                    const isSelected = identifyGuess === site.name;
                    const isTarget = site.name === identificationItems[identifyIndex].site;
                    let style = 'bg-stone-900/80 hover:bg-stone-800 border-amber-900/60 text-amber-200';

                    if (identifySubmitted) {
                      if (isTarget) {
                        style = 'bg-emerald-950/90 border-emerald-500 text-emerald-200 font-bold';
                      } else if (isSelected && !isTarget) {
                        style = 'bg-red-950/90 border-red-500 text-red-200';
                      } else {
                        style = 'bg-stone-900/30 border-stone-800 text-amber-200/40';
                      }
                    } else if (isSelected) {
                      style = 'bg-amber-900/80 border-amber-400 text-white ring-2 ring-amber-400';
                    }

                    return (
                      <button
                        key={site.id}
                        type="button"
                        disabled={identifySubmitted}
                        onClick={() => {
                          setIdentifyGuess(site.name);
                          heritageAudio.playClick();
                        }}
                        className={`w-full p-3 rounded-xl text-left text-sm font-medium border transition-all ${style}`}
                      >
                        <span className="font-semibold">{site.name}</span>{' '}
                        <span className="text-xs opacity-75 font-normal">({site.locality})</span>
                      </button>
                    );
                  })}
                </div>

                {identifySubmitted && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs md:text-sm ${
                      identifyGuess === identificationItems[identifyIndex].site
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                        : 'bg-red-950/60 border-red-500 text-red-200'
                    }`}
                  >
                    <p className="font-bold">
                      {identifyGuess === identificationItems[identifyIndex].site
                        ? 'Chính xác! (+25 điểm)'
                        : `Chưa đúng! Đáp án chính xác là: ${identificationItems[identifyIndex].site}`}
                    </p>
                    <p className="mt-1 text-amber-100/90">
                      Tên chi tiết: <span className="font-bold">{identificationItems[identifyIndex].title}</span>.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  {!identifySubmitted ? (
                    <button
                      type="button"
                      disabled={!identifyGuess}
                      onClick={() => {
                        if (!identifyGuess) return;
                        setIdentifySubmitted(true);
                        if (identifyGuess === identificationItems[identifyIndex].site) {
                          heritageAudio.playCorrect();
                          setIdentifyScore((s) => s + 25);
                          onAddPoints(25);
                        } else {
                          heritageAudio.playClick();
                        }
                      }}
                      className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-stone-950 font-bold text-xs md:text-sm rounded-xl disabled:opacity-40"
                    >
                      Xác nhận đáp án
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifyIndex((i) => (i + 1) % identificationItems.length);
                        setIdentifyGuess(null);
                        setIdentifySubmitted(false);
                      }}
                      className="px-5 py-2 bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 text-white font-bold text-xs md:text-sm rounded-xl"
                    >
                      Hình tiếp theo ➜
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JIGSAW TAB */}
      {activeTab === 'jigsaw' && (
        <div className="space-y-6">
          <div className="bg-stone-950/60 border border-amber-700/40 rounded-2xl p-5 md:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-amber-900/40">
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-300 font-semibold">Chọn di tích để ghép hình:</span>
                <select
                  value={puzzleSiteIndex}
                  onChange={(e) => setPuzzleSiteIndex(parseInt(e.target.value))}
                  className="bg-stone-900 border border-amber-700 text-amber-200 text-xs rounded-lg px-2.5 py-1.5"
                >
                  {sites.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 text-xs text-amber-300 font-mono">
                <span>Số bước đi: {puzzleMoves}</span>
                <button
                  type="button"
                  onClick={initPuzzle}
                  className="flex items-center gap-1 px-3 py-1 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-lg border border-amber-700/50"
                  title="Xáo trộn lại tranh"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xáo lại</span>
                </button>
              </div>
            </div>

            <p className="text-xs md:text-sm text-amber-300/80">
              Nhấn vào 2 mảnh bất kỳ để đổi chỗ cho nhau sao cho tạo thành bức tranh di tích hoàn chỉnh!
            </p>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 grid grid-cols-3 gap-1 bg-amber-950/80 p-2 rounded-2xl border-2 border-amber-600/70 shadow-2xl">
                {tiles.map((tileVal, slotIdx) => {
                  const isSelected = selectedTile === slotIdx;
                  const row = Math.floor(tileVal / puzzleSize);
                  const col = tileVal % puzzleSize;
                  const posX = (col / (puzzleSize - 1)) * 100;
                  const posY = (row / (puzzleSize - 1)) * 100;

                  return (
                    <div
                      key={slotIdx}
                      onClick={() => handleTileClick(slotIdx)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-150 ${
                        isSelected ? 'ring-4 ring-amber-400 scale-95 z-10' : 'hover:opacity-90'
                      }`}
                      style={{
                        backgroundImage: `url(${sites[puzzleSiteIndex].coverImage})`,
                        backgroundSize: `${puzzleSize * 100}% ${puzzleSize * 100}%`,
                        backgroundPosition: `${posX}% ${posY}%`,
                      }}
                    >
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-[9px] text-amber-300 rounded font-mono">
                        {slotIdx + 1}
                      </span>
                    </div>
                  );
                })}

                {isPuzzleSolved && (
                  <div className="absolute inset-0 bg-stone-950/85 rounded-2xl flex flex-col items-center justify-center text-center p-4 z-20">
                    <Sparkles className="w-12 h-12 text-amber-400 animate-spin" />
                    <h4 className="text-lg font-serif font-bold text-amber-200 mt-2">
                      Ghép Tranh Thành Công!
                    </h4>
                    <p className="text-xs text-amber-300/80 mt-1">
                      Hoàn thành trong {puzzleMoves} bước • Nhận ngay +50 điểm!
                    </p>
                    <button
                      type="button"
                      onClick={initPuzzle}
                      className="mt-3 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-lg"
                    >
                      Chơi lại
                    </button>
                  </div>
                )}
              </div>

              <div className="text-center space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
                  Tranh mẫu tham khảo:
                </span>
                <div className="w-40 h-40 rounded-xl overflow-hidden border border-amber-600/50 shadow-md">
                  <img
                    src={sites[puzzleSiteIndex].coverImage}
                    alt="Tranh mẫu"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-amber-300/80 font-serif font-bold">
                  {sites[puzzleSiteIndex].name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MYSTERY TAB */}
      {activeTab === 'mystery' && (
        <div className="space-y-6">
          <div className="bg-stone-950/60 border border-amber-700/40 rounded-2xl p-5 md:p-7 space-y-5">
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span className="px-3 py-1 bg-amber-950/80 rounded-full border border-amber-600/50">
                Thử thách {mysteryIndex + 1} / {mysteryRounds.length} • Giải mã dữ kiện
              </span>
              <span className="font-mono text-amber-300">Điểm thám tử: {mysteryScore}</span>
            </div>

            <div className="space-y-3">
              <h4 className="text-base md:text-lg font-serif font-bold text-amber-200 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <span>Các manh mối lịch sử & kiến trúc đã khám phá:</span>
              </h4>

              <div className="space-y-2">
                {mysteryRounds[mysteryIndex].clues.slice(0, revealedClues).map((clue, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-950/40 border border-amber-700/40 rounded-xl text-xs md:text-sm text-amber-100 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-300 font-mono text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{clue}</span>
                  </div>
                ))}
              </div>

              {revealedClues < mysteryRounds[mysteryIndex].clues.length && !mysterySubmitted && (
                <button
                  type="button"
                  onClick={() => {
                    setRevealedClues((c) => c + 1);
                    heritageAudio.playClick();
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
                >
                  + Mở thêm gợi ý tiếp theo ({revealedClues}/4)
                </button>
              )}

              <div className="pt-3 space-y-2">
                <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                  Dựa vào các manh mối trên, đây là di tích nào?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {sites.map((s) => {
                    const isSelected = mysteryGuess === s.id;
                    const isTarget = s.id === mysteryRounds[mysteryIndex].correctSiteId;
                    let style = 'bg-stone-900/80 hover:bg-stone-800 border-amber-900/60 text-amber-200';

                    if (mysterySubmitted) {
                      if (isTarget) {
                        style = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold';
                      } else if (isSelected && !isTarget) {
                        style = 'bg-red-950 border-red-500 text-red-200';
                      } else {
                        style = 'bg-stone-900/30 text-stone-500 border-stone-800';
                      }
                    } else if (isSelected) {
                      style = 'bg-amber-900 border-amber-400 text-white ring-2 ring-amber-400';
                    }

                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={mysterySubmitted}
                        onClick={() => {
                          setMysteryGuess(s.id);
                          heritageAudio.playClick();
                        }}
                        className={`p-3 rounded-xl text-left text-xs md:text-sm font-medium border transition-all ${style}`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {mysterySubmitted && (
                <div
                  className={`p-4 rounded-xl border text-sm ${
                    mysteryGuess === mysteryRounds[mysteryIndex].correctSiteId
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                      : 'bg-red-950/70 border-red-500 text-red-200'
                  }`}
                >
                  <p className="font-bold">
                    {mysteryGuess === mysteryRounds[mysteryIndex].correctSiteId
                      ? 'Chúc mừng em đoán rất chính xác! (+30 điểm)'
                      : `Rất tiếc! Đây chính là: ${mysteryRounds[mysteryIndex].correctName}`}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                {!mysterySubmitted ? (
                  <button
                    type="button"
                    disabled={!mysteryGuess}
                    onClick={() => {
                      if (!mysteryGuess) return;
                      setMysterySubmitted(true);
                      if (mysteryGuess === mysteryRounds[mysteryIndex].correctSiteId) {
                        heritageAudio.playCorrect();
                        setMysteryScore((s) => s + 30);
                        onAddPoints(30);
                      } else {
                        heritageAudio.playClick();
                      }
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-bold text-xs md:text-sm rounded-xl disabled:opacity-40"
                  >
                    Kiểm tra dự đoán
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMysteryIndex((i) => (i + 1) % mysteryRounds.length);
                      setMysteryGuess(null);
                      setMysterySubmitted(false);
                      setRevealedClues(1);
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-red-700 to-amber-700 text-white font-bold text-xs md:text-sm rounded-xl"
                  >
                    Di tích tiếp theo ➜
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
