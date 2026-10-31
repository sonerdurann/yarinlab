import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { gameStore, taskSteps, useGameState } from './state/gameStore';
import { TopBar } from './ui/Hud/Hud';
import { CityIndicators, EndingPanel, EventLogPanel, MainMenu, ProgressPanel } from './ui/City/CityPanels';
import { BuildPanel } from './ui/City/BuildPanel';
import { HelpPanel } from './ui/City/HelpPanel';
import { AssessmentPanel } from './ui/City/AssessmentPanel';
import { AssignmentsPanel } from './ui/City/AssignmentsPanel';
import { settingsStore } from './state/settingsStore';
import { teacherStore } from './state/teacherStore';
import { TaskPanel } from './ui/TaskPanel/TaskPanel';
import { DecisionModal } from './ui/DecisionModal/DecisionModal';
import { TeacherPanel } from './ui/TeacherPanel/TeacherPanel';
import { SourcesPanel } from './ui/Sources/SourcesPanel';
import { FutureComparison } from './ui/FutureComparison/FutureComparison';
import { Intro } from './ui/Intro/Intro';
import { Logo } from './ui/Logo';
import { SettingsPanel } from './ui/Settings/SettingsPanel';
import { PeriodSwitch, PeriodTint } from './ui/PeriodSwitch/PeriodSwitch';
import { AuthPanel } from './ui/Auth/AuthPanel';
import { authStore } from './state/authStore';
import { startSaveSync } from './state/saveSync';
import { startSfx } from './audio/sfx';
import { SchoolPanel } from './ui/SchoolPanel/SchoolPanel';

export function App() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const gs = useGameState();
  const { notice, decisionOpen } = gs;
  const [sheet, setSheet] = useState(false);
  const next = taskSteps(gs).find((t) => !t.done);

  useEffect(() => {
    if (!host.current) return;
    // Oyun motoru ayrı parça olarak geç yüklenir (ilk boyama hızlansın).
    let cancelled = false;
    const el = host.current;
    void import('./game/createGame').then((m) => {
      if (!cancelled) game.current = m.createGame(el);
    });
    return () => {
      cancelled = true;
      game.current?.destroy(true);
      game.current = null;
    };
  }, []);

  useEffect(() => { startSaveSync(); startSfx(); void authStore.refresh(); }, []);

  const zoom = (delta: number) => game.current?.scene.getScene('WorldScene')?.events.emit('zoom', delta);

  // Klavye: +/- ile yakınlaştırma (pencere açıkken devre dışı)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role=dialog]') || (e.target as HTMLElement)?.matches?.('input, textarea, select')) return;
      if (e.key === '+' || e.key === '=') zoom(0.1);
      if (e.key === '-' || e.key === '_') zoom(-0.1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const skipToZones = () => {
    setSheet(true);
    setTimeout(() => document.getElementById('zones')?.focus(), 50);
  };

  const pick = (id: string) => {
    gameStore.selectHotspot(id);
    game.current?.scene.getScene('WorldScene')?.events.emit('focus-hotspot', id);
  };

  return (
    <div className="app">
      <div ref={host} className="world" />
      <PeriodTint />
      <button className="skip" onClick={skipToZones}>Bölge listesine geç</button>
      <TopBar />
      <PeriodSwitch />
      <div className="zoom-btns">
        <button aria-label="Yakınlaştır" onClick={() => zoom(0.1)}>+</button>
        <button aria-label="Uzaklaştır" onClick={() => zoom(-0.1)}>−</button>
      </div>
      <div className={sheet ? 'dock open' : 'dock'}>
        <div className="cta-bar">
          <button aria-expanded={sheet} onClick={() => setSheet(!sheet)}>{sheet ? 'Gizle' : 'Görevler'}</button>
          <span className="cta-text">Görev: {next ? next.label : 'Tamamlandı'}</span>
          {!decisionOpen && (
            <button className="primary" onClick={gameStore.openDecision}>
              {gs.canteenVisited ? 'Devam' : 'Göreve başla'}
            </button>
          )}
        </div>
        <TaskPanel onPick={pick} />
        <CityIndicators />
      </div>
      {gs.schoolOpen && <SchoolPanel onPick={pick} />}
      {notice && !decisionOpen && (
        <aside role="status" className="panel toast">
          <p>{notice}</p>
          <button onClick={gameStore.clearNotice}>Tamam</button>
        </aside>
      )}
      <div className={gs.worldReady ? 'loading done' : 'loading'} role="status" aria-hidden={gs.worldReady}>
        <Logo size={56} />
        <p>Harita yükleniyor…</p>
        <span className="spinner" aria-hidden="true" />
      </div>
      <MainMenu onSettings={settingsStore.open} onTeacher={teacherStore.openTeacher} onSources={teacherStore.openSources} />
      <BuildPanel />
      <EventLogPanel />
      <ProgressPanel />
      <HelpPanel />
      <EndingPanel />
      <AssessmentPanel />
      <AssignmentsPanel />
      <AuthPanel />
      <Intro />
      <DecisionModal />
      <FutureComparison />
      <TeacherPanel />
      <SourcesPanel />
      <SettingsPanel />
    </div>
  );
}
