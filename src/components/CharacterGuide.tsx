import React, { useState } from 'react';
import { ArrowRight, Volume2 } from 'lucide-react';
import { CHARACTERS, PIGS, PLAYABLE_BIRDS } from '../data/characters';
import { soundEngine } from '../audio/soundEngine';
import { BirdType, PigType } from '../types/game';
import { BirdPortrait } from './BirdPortrait';

interface CharacterGuideProps {
  onBack: () => void;
  onPlayWithBird?: (bird: BirdType) => void;
}

const ALL_BIRDS_LIST: BirdType[] = [...PLAYABLE_BIRDS, 'mighty_eagle'];
const ALL_PIGS_LIST: PigType[] = ['minion', 'corporal', 'foreman', 'king'];

export const CharacterGuide: React.FC<CharacterGuideProps> = ({
  onBack,
  onPlayWithBird,
}) => {
  const [tab, setTab] = useState<'birds' | 'pigs'>('birds');
  const [selectedBird, setSelectedBird] = useState<BirdType>('red');
  const [selectedPig, setSelectedPig] = useState<PigType>('minion');

  const birdMeta = CHARACTERS[selectedBird];
  const pigMeta = PIGS[selectedPig];

  return (
    <div className="relative flex flex-col w-full h-full bg-gradient-to-b from-sky-500 via-sky-300 to-emerald-200 overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-6 px-6 py-4 bg-slate-950/85 text-white border-b border-white/15 backdrop-blur-sm shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה לתפריט</span>
        </button>

        <h1 className="font-display text-2xl font-bold tracking-tight text-amber-300 whitespace-nowrap">
          ספר הדמויות המלא
        </h1>

        <div className="flex items-center gap-1 p-1 bg-white/10 rounded-xl shrink-0">
          <button
            onClick={() => setTab('birds')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'birds'
                ? 'bg-amber-400 text-slate-950 font-semibold'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            הציפורים ({ALL_BIRDS_LIST.length})
          </button>
          <button
            onClick={() => setTab('pigs')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'pigs'
                ? 'bg-lime-400 text-slate-950 font-semibold'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            החזירים ({ALL_PIGS_LIST.length})
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Roster Grid */}
          <div className="lg:col-span-7 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-amber-950/15">
            {tab === 'birds' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {ALL_BIRDS_LIST.map((bId) => {
                  const item = CHARACTERS[bId];
                  const active = selectedBird === bId;
                  return (
                    <button
                      key={bId}
                      onClick={() => {
                        setSelectedBird(bId);
                        soundEngine.playBirdVoice(bId);
                      }}
                      className={`flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer ${
                        active
                          ? 'bg-amber-50 border-amber-500 shadow-md scale-[1.03]'
                          : 'bg-slate-50/80 border-slate-200 hover:bg-amber-50/40 hover:border-amber-300'
                      }`}
                    >
                      <BirdPortrait bird={bId} size={68} state={active ? 'aim' : 'idle'} />
                      <span className="mt-1.5 font-display text-sm font-bold text-slate-900 text-center leading-tight">
                        {item.heName.split(' (')[0]}
                      </span>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {item.enName}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {ALL_PIGS_LIST.map((pId) => {
                  const item = PIGS[pId];
                  const active = selectedPig === pId;
                  return (
                    <button
                      key={pId}
                      onClick={() => {
                        setSelectedPig(pId);
                        soundEngine.playPigPop();
                      }}
                      className={`flex flex-col items-center p-4 rounded-xl border transition-all cursor-pointer ${
                        active
                          ? 'bg-lime-50 border-lime-600 shadow-md scale-[1.03]'
                          : 'bg-slate-50/80 border-slate-200 hover:bg-lime-50/40 hover:border-lime-400'
                      }`}
                    >
                      <BirdPortrait pig={pId} size={78} />
                      <span className="mt-2 font-display text-sm font-bold text-slate-900 text-center">
                        {item.heName}
                      </span>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {item.enName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Inspector Card */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-white/15">
            {tab === 'birds' ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-sky-100/95 p-2 shadow-inner border border-white/40">
                    <BirdPortrait bird={selectedBird} size={96} state="flying" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-amber-300 font-medium">
                      {birdMeta.enName} · {birdMeta.title}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white mt-0.5">
                      {birdMeta.heName}
                    </h2>
                    <button
                      onClick={() => soundEngine.playBirdVoice(selectedBird)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-amber-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>השמע קול</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">יכולת מיוחדת</div>
                    <div className="font-semibold text-amber-300 mt-0.5">
                      {birdMeta.abilityName}
                    </div>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{birdMeta.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-300">
                    <span>יעיל במיוחד נגד:</span>
                    <span className="font-semibold text-emerald-300">
                      {birdMeta.strongAgainst}
                    </span>
                  </div>
                </div>

                {onPlayWithBird && (
                  <button
                    onClick={() => onPlayWithBird(selectedBird)}
                    className="w-full py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-base shadow-md transition-colors cursor-pointer"
                  >
                    שחק עכשיו עם {birdMeta.heName.split(' (')[0]}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-lime-100/95 p-2 shadow-inner border border-white/40">
                    <BirdPortrait pig={selectedPig} size={96} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-lime-300 font-medium">
                      {pigMeta.enName} · צבא החזירים
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white mt-0.5">
                      {pigMeta.heName}
                    </h2>
                    <button
                      onClick={() => soundEngine.playPigPop()}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-lime-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>השמע קול</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4 text-sm">
                  <p className="text-slate-200 leading-relaxed">{pigMeta.role}</p>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                    <div>
                      <div className="text-xs text-slate-400">עמידות (HP)</div>
                      <div className="font-display text-xl font-bold text-white tabular-nums">
                        {pigMeta.hp}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">ניקוד בחיסול</div>
                      <div className="font-display text-xl font-bold text-lime-300 tabular-nums">
                        +{pigMeta.score.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
