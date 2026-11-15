import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Compass,
  Crown,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { BirdPortrait } from './components/BirdPortrait';
import { CharacterGuide } from './components/CharacterGuide';
import { GameCanvas } from './components/GameCanvas';
import { TitleBackdrop } from './components/TitleBackdrop';
import { CHARACTERS, PLAYABLE_BIRDS } from './data/characters';
import { EPISODES, LEVELS } from './data/levels';
import { BirdType, GameScreen, ProgressMap, RoundState } from './types/game';

const STORAGE_KEY = 'angry_birds_classic_progress_v1';

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as ProgressMap;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

export function App() {
  const [screen, setScreen] = useState<GameScreen>('TITLE_MENU');
  const [selectedEpisode, setSelectedEpisode] = useState<string>('all');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [muted, setMuted] = useState(false);

  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());

  // Live level state
  const [score, setScore] = useState(0);
  const [queue, setQueue] = useState<BirdType[]>([]);
  const [activeBird, setActiveBird] = useState<BirdType | null>(null);
  const [roundState, setRoundState] = useState<RoundState>('READY');
  const [isPaused, setIsPaused] = useState(false);
  const [allBirdsOpen, setAllBirdsOpen] = useState(false);
  const [birdOverride, setBirdOverride] = useState<BirdType | null>(null);
  const [eagleUsedThisLevel, setEagleUsedThisLevel] = useState(false);
  const [eagleSignal, setEagleSignal] = useState(0);
  const [nextTurnSignal, setNextTurnSignal] = useState(0);
  const [cameraMode, setCameraMode] = useState<'auto' | 'sling' | 'target'>('auto');
  const [cameraSeq, setCameraSeq] = useState(0);

  const [victoryInfo, setVictoryInfo] = useState<{
    finalScore: number;
    stars: number;
    unusedBirds: number;
  } | null>(null);
  const [defeatScore, setDefeatScore] = useState<number | null>(null);

  const level = LEVELS[currentLevelIdx];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  }, [progress]);

  const totalStars = useMemo(
    () => Object.values(progress).reduce((sum, p) => sum + (p?.stars || 0), 0),
    [progress],
  );

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  const startLevel = useCallback((idx: number, initialBirdOverride?: BirdType) => {
    setCurrentLevelIdx(idx);
    setScore(0);
    setVictoryInfo(null);
    setDefeatScore(null);
    setIsPaused(false);
    setEagleUsedThisLevel(false);
    setCameraMode('auto');
    setBirdOverride(initialBirdOverride ?? null);
    setRunKey((k) => k + 1);
    setScreen('PLAYING');
  }, []);

  const restartCurrentLevel = () => {
    startLevel(currentLevelIdx);
  };

  const handleLevelComplete = useCallback(
    (finalScore: number, stars: number, unusedBirds: number) => {
      setVictoryInfo({ finalScore, stars, unusedBirds });
      setProgress((prev) => {
        const cur = prev[level.id] || { stars: 0, highScore: 0, unlocked: true };
        return {
          ...prev,
          [level.id]: {
            stars: Math.max(cur.stars, stars),
            highScore: Math.max(cur.highScore, finalScore),
            unlocked: true,
          },
        };
      });
    },
    [level.id],
  );

  const handleLevelFailed = useCallback((finalScore: number) => {
    setDefeatScore(finalScore);
  }, []);

  const cycleCamera = () => {
    const next = cameraMode === 'auto' ? 'target' : cameraMode === 'target' ? 'sling' : 'auto';
    setCameraMode(next);
    setCameraSeq((s) => s + 1);
  };

  const handleSummonEagle = () => {
    if (eagleUsedThisLevel) return;
    if (roundState !== 'READY' && roundState !== 'AIMING') return;
    setEagleUsedThisLevel(true);
    setEagleSignal((s) => s + 1);
  };

  const handleQueueChange = useCallback((q: BirdType[], active: BirdType | null) => {
    setQueue(q);
    setActiveBird(active);
  }, []);

  const handleConsumeOverride = useCallback(() => {
    setBirdOverride(null);
  }, []);

  // =================== TITLE MENU ===================
  if (screen === 'TITLE_MENU') {
    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden">
        <TitleBackdrop />

        {/* Audio toggle */}
        <button
          onClick={toggleMute}
          aria-label={muted ? 'הפעל שמע' : 'השתק שמע'}
          className="absolute top-5 left-5 z-20 p-3 rounded-2xl bg-slate-950/75 text-white hover:bg-slate-900 border border-white/20 shadow-lg transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Center Title Card */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl">
          <div className="animate-float-slow mb-3 flex items-center gap-3">
            <BirdPortrait bird="chuck" size={64} state="flying" />
            <BirdPortrait bird="red" size={88} state="aim" />
            <BirdPortrait bird="bomb" size={68} state="flying" />
          </div>

          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-red-500 text-stroke-dark leading-none">
            ANGRY BIRDS
          </h1>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-amber-300 text-stroke-sm">
            אנגרי ברדס — המהדורה הקלאסית
          </p>
          <p className="mt-3 text-sm sm:text-base font-medium text-slate-900 bg-white/80 backdrop-blur-xs px-4 py-2 rounded-xl shadow-sm border border-amber-900/15">
            כל 10 הדמויות המקוריות, 4 דרגות חזירים, מנוע פיזיקה מלא ו-24 שלבים ב-4 פרקים
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => startLevel(0)}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950 font-display font-bold text-xl shadow-xl border-2 border-amber-950/40 transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>התחל משחק</span>
            </button>

            <button
              onClick={() => setScreen('LEVEL_SELECT')}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-display font-bold text-lg shadow-xl border border-white/20 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>בחירת שלב ({totalStars}/{LEVELS.length * 3})</span>
            </button>

            <button
              onClick={() => setScreen('CHARACTERS')}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/95 hover:bg-white text-slate-900 font-display font-bold text-lg shadow-xl border border-slate-900/15 transition-colors whitespace-nowrap cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-red-600" />
              <span>ספר הדמויות</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =================== CHARACTER GUIDE ===================
  if (screen === 'CHARACTERS') {
    return (
      <CharacterGuide
        onBack={() => setScreen('TITLE_MENU')}
        onPlayWithBird={(b) => {
          setAllBirdsOpen(true);
          startLevel(0, b);
        }}
      />
    );
  }

  // =================== LEVEL SELECT ===================
  if (screen === 'LEVEL_SELECT') {
    return (
      <div className="flex flex-col w-full h-full bg-gradient-to-b from-sky-500 via-sky-300 to-emerald-200 overflow-hidden">
        <header className="flex items-center justify-between gap-6 px-6 py-4 bg-slate-950/85 text-white border-b border-white/15 shrink-0">
          <button
            onClick={() => setScreen('TITLE_MENU')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            חזרה לתפריט
          </button>

          <h1 className="font-display text-2xl font-bold text-amber-300 whitespace-nowrap">
            מפת השלבים · {totalStars} / {LEVELS.length * 3} כוכבים
          </h1>

          <button
            onClick={() => setScreen('CHARACTERS')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>ספר הדמויות</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Episode Filter Bar */}
          <div className="max-w-6xl mx-auto mb-6 flex flex-wrap items-center gap-2 p-1.5 bg-slate-950/20 backdrop-blur-xs rounded-2xl w-fit">
            <button
              onClick={() => setSelectedEpisode('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedEpisode === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-900 bg-white/60 hover:bg-white/90'
              }`}
            >
              כל השלבים ({LEVELS.length})
            </button>
            {EPISODES.map((ep) => {
              const epStars = LEVELS.filter(
                (l) => l.id >= ep.range[0] && l.id <= ep.range[1],
              ).reduce((acc, l) => acc + (progress[l.id]?.stars || 0), 0);
              const active = selectedEpisode === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEpisode(ep.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-900 bg-white/60 hover:bg-white/90'
                  }`}
                >
                  {ep.heName} · {epStars}/18★
                </button>
              );
            })}
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {LEVELS.map((lvl, idx) => {
              if (selectedEpisode !== 'all') {
                const ep = EPISODES.find((e) => e.id === selectedEpisode);
                if (ep && (lvl.id < ep.range[0] || lvl.id > ep.range[1])) {
                  return null;
                }
              }
              const saved = progress[lvl.id];
              const stars = saved?.stars || 0;
              const best = saved?.highScore || 0;
              const leadBird = lvl.birds[0];
              return (
                <button
                  key={lvl.id}
                  onClick={() => startLevel(idx)}
                  className="group flex flex-col justify-between text-right bg-white/95 hover:bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl border border-amber-950/15 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xs font-semibold text-sky-700">
                        שלב {lvl.id} · {lvl.worldHe}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300 fill-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <h2 className="mt-1.5 font-display text-lg font-bold text-slate-900">
                      {lvl.nameHe}
                    </h2>

                    <div className="mt-3 flex items-center gap-1 overflow-hidden">
                      {lvl.birds.slice(0, 5).map((b, bi) => (
                        <BirdPortrait key={`${b}-${bi}`} bird={b} size={38} />
                      ))}
                      {lvl.birds.length > 5 && (
                        <span className="text-xs font-bold text-slate-500">
                          +{lvl.birds.length - 5}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 tabular-nums">
                      שיא: {best > 0 ? best.toLocaleString() : '—'}
                    </span>
                    <span className="font-bold text-amber-600 group-hover:text-amber-700">
                      שחק ({CHARACTERS[leadBird].heName.split(' (')[0]})
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =================== PLAYING VIEW ===================
  const currentMeta = activeBird ? CHARACTERS[activeBird] : null;
  const bestScore = Math.max(score, progress[level.id]?.highScore || 0);

  return (
    <div className="relative flex flex-col w-full h-full bg-sky-400 overflow-hidden select-none">
      {/* Unobtrusive Top HUD */}
      <header className="relative z-20 flex items-center justify-between gap-4 px-4 py-2.5 bg-slate-950/85 text-white border-b border-white/15 backdrop-blur-sm shrink-0">
        {/* Controls Zone */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPaused(true)}
            title="השהה / תפריט"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
          <button
            onClick={restartCurrentLevel}
            title="התחל שלב מחדש"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMute}
            title={muted ? 'הפעל שמע' : 'השתק שמע'}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={cycleCamera}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-sky-300" />
            <span>
              מצלמה:{' '}
              {cameraMode === 'auto'
                ? 'אוטומטי'
                : cameraMode === 'target'
                  ? 'מבנה החזירים'
                  : 'רוגטקה'}
            </span>
          </button>
        </div>

        {/* Center Level & Active Bird Ability Guide */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-display font-bold text-amber-300 text-sm sm:text-base whitespace-nowrap truncate">
            שלב {level.id}: {level.nameHe}
          </span>
          {currentMeta && (
            <span className="hidden md:inline text-xs text-slate-300 whitespace-nowrap truncate">
              · תור: {currentMeta.heName.split(' (')[0]} ({currentMeta.abilityName})
            </span>
          )}
        </div>

        {/* Score & Special Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {(roundState === 'FLYING' || roundState === 'SETTLING') && (
            <button
              onClick={() => setNextTurnSignal((s) => s + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>ציפור הבאה</span>
            </button>
          )}

          <button
            onClick={handleSummonEagle}
            disabled={eagleUsedThisLevel || (roundState !== 'READY' && roundState !== 'AIMING')}
            title="זמן את הנשר האדיר (פעם בשלב)"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              eagleUsedThisLevel
                ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">הנשר האדיר</span>
          </button>

          <div className="text-left leading-tight shrink-0">
            <div className="text-[11px] text-slate-400 tabular-nums">
              שיא {bestScore.toLocaleString()}
            </div>
            <div className="font-display text-lg font-bold text-amber-300 tabular-nums">
              {score.toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Physics Arena */}
      <div className="relative flex-1 min-h-0">
        <GameCanvas
          key={`${level.id}-${runKey}`}
          level={level}
          isPaused={isPaused}
          allBirdsUnlocked={allBirdsOpen}
          activeBirdOverride={birdOverride}
          onConsumeOverride={handleConsumeOverride}
          onScoreChange={setScore}
          onQueueChange={handleQueueChange}
          onRoundStateChange={setRoundState}
          onLevelComplete={handleLevelComplete}
          onLevelFailed={handleLevelFailed}
          triggerNextTurnSignal={nextTurnSignal}
          triggerEagleSignal={eagleSignal}
          cameraPresetSignal={{ mode: cameraMode, seq: cameraSeq }}
        />

        {/* Floating Free-Bird Switcher Drawer (top-right corner under HUD) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-start gap-2">
          <button
            onClick={() => setAllBirdsOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/75 hover:bg-slate-900 text-white text-xs font-medium border border-white/15 backdrop-blur-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{allBirdsOpen ? 'סגור החלפת ציפורים' : 'החלף לכל ציפור'}</span>
          </button>

          {allBirdsOpen && (
            <div className="bg-slate-950/88 backdrop-blur-md rounded-2xl p-2.5 border border-white/15 shadow-2xl grid grid-cols-3 gap-1.5 max-w-[230px]">
              {PLAYABLE_BIRDS.map((bId) => {
                const isSelected = activeBird === bId;
                return (
                  <button
                    key={bId}
                    disabled={roundState !== 'READY' && roundState !== 'AIMING'}
                    onClick={() => {
                      setBirdOverride(bId);
                      soundEngine.playBirdVoice(bId);
                    }}
                    title={CHARACTERS[bId].heName}
                    className={`flex flex-col items-center p-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-45 ${
                      isSelected
                        ? 'bg-amber-400/25 ring-1 ring-amber-400'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <BirdPortrait bird={bId} size={40} />
                    <span className="text-[10px] font-medium text-slate-200 truncate max-w-[60px]">
                      {CHARACTERS[bId].heName.split(' (')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Remaining Queue Indicator (top-left under HUD) */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 hidden sm:flex items-center gap-1 bg-slate-950/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15">
          <span className="text-xs text-slate-200 ml-1">בתור:</span>
          {activeBird && <BirdPortrait bird={activeBird} size={30} state="aim" />}
          {queue.map((b, i) => (
            <BirdPortrait key={`${b}-${i}`} bird={b} size={26} />
          ))}
          {!activeBird && queue.length === 0 && (
            <span className="text-xs text-slate-300">אחרונה!</span>
          )}
        </div>

        {/* PAUSE MODAL */}
        {isPaused && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-900/20 text-center">
              <h2 className="font-display text-3xl font-bold text-slate-900">המשחק מושהה</h2>
              <p className="mt-1 text-sm text-slate-600">
                שלב {level.id} · {level.nameHe}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-lg cursor-pointer"
                >
                  המשך לשחק
                </button>
                <button
                  onClick={restartCurrentLevel}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold cursor-pointer"
                >
                  התחל שלב מחדש
                </button>
                <button
                  onClick={() => {
                    setIsPaused(false);
                    setScreen('CHARACTERS');
                  }}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold cursor-pointer"
                >
                  ספר הדמויות והיכולות
                </button>
                <button
                  onClick={() => {
                    setIsPaused(false);
                    setScreen('LEVEL_SELECT');
                  }}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
                >
                  מפת השלבים
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VICTORY MODAL */}
        {victoryInfo && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-7 shadow-2xl border-4 border-amber-400 text-center">
              <div className="flex justify-center gap-2 -mt-12 mb-3">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-14 h-14 drop-shadow-md transition-transform ${
                      s <= victoryInfo.stars
                        ? 'text-amber-400 fill-amber-400 scale-110'
                        : 'text-slate-300 fill-slate-200'
                    }`}
                  />
                ))}
              </div>

              <h2 className="font-display text-3xl font-bold text-slate-900">
                כל הכבוד! השלב הושלם!
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {level.worldHe} · {level.nameHe}
              </p>

              <div className="mt-5 py-4 px-5 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-xs text-amber-800 font-medium">ניקוד סופי</div>
                <div className="font-display text-4xl font-bold text-slate-900 tabular-nums mt-0.5">
                  {victoryInfo.finalScore.toLocaleString()}
                </div>
                {victoryInfo.unusedBirds > 0 && (
                  <div className="mt-1 text-xs text-emerald-700 font-semibold">
                    כולל בונוס {victoryInfo.unusedBirds} ציפורים שנותרו (+
                    {(victoryInfo.unusedBirds * 10000).toLocaleString()})
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {currentLevelIdx < LEVELS.length - 1 ? (
                  <button
                    onClick={() => startLevel(currentLevelIdx + 1)}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-lg shadow-md cursor-pointer whitespace-nowrap"
                  >
                    לשלב הבא
                  </button>
                ) : (
                  <button
                    onClick={() => setScreen('LEVEL_SELECT')}
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-lg shadow-md cursor-pointer whitespace-nowrap"
                  >
                    סיימת את כל השלבים!
                  </button>
                )}

                <button
                  onClick={restartCurrentLevel}
                  className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold cursor-pointer whitespace-nowrap"
                >
                  שחק שוב
                </button>
                <button
                  onClick={() => setScreen('LEVEL_SELECT')}
                  className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer whitespace-nowrap"
                >
                  שלבים
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DEFEAT MODAL */}
        {defeatScore !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-7 shadow-2xl border-4 border-lime-500 text-center">
              <div className="flex justify-center -mt-12 mb-2">
                <div className="rounded-full bg-lime-100 p-2 border-4 border-white shadow-lg">
                  <BirdPortrait pig="king" size={76} />
                </div>
              </div>

              <h2 className="font-display text-3xl font-bold text-slate-900">
                החזירים שרדו הפעם!
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                נגמרו הציפורים. נסו זווית חדשה או הפעילו יכולת מיוחדת באוויר!
              </p>

              <div className="mt-4 py-3 px-4 rounded-2xl bg-slate-100">
                <div className="text-xs text-slate-500">ניקוד שהושג</div>
                <div className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                  {defeatScore.toLocaleString()}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={restartCurrentLevel}
                  className="flex-1 py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-lg shadow-md cursor-pointer whitespace-nowrap"
                >
                  נסה שוב
                </button>
                <button
                  onClick={() => setScreen('LEVEL_SELECT')}
                  className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer whitespace-nowrap"
                >
                  מפת שלבים
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
