import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { gameStore, useGameState } from './state/gameStore';
import { EndingPanel, EventLogPanel, ProgressPanel } from './ui/City/CityPanels';
import { TopHud } from './ui/hud/TopHud';
import { LeftHud } from './ui/hud/LeftHud';
import { RightHud } from './ui/hud/RightHud';
import { Dock, DockDrawer } from './ui/hud/Dock';
import { BuildingCard } from './ui/City/BuildingCard';
import { GuidePanel } from './ui/guide/GuidePanel';
import { TitleScreen } from './ui/menu/TitleScreen';
import { CharacterCreator } from './ui/menu/CharacterCreator';
import { AdaMessage } from './ui/characters/AdaMessage';
import { BuildPanel } from './ui/City/BuildPanel';
import { HelpPanel } from './ui/City/HelpPanel';
import { AssessmentPanel } from './ui/City/AssessmentPanel';
import { AssignmentsPanel } from './ui/City/AssignmentsPanel';
import { settingsStore } from './state/settingsStore';
import { teacherStore } from './state/teacherStore';
import { DecisionModal } from './ui/DecisionModal/DecisionModal';
import { TeacherPanel } from './ui/TeacherPanel/TeacherPanel';
import { SourcesPanel } from './ui/Sources/SourcesPanel';
import { FutureComparison } from './ui/FutureComparison/FutureComparison';
import { Intro } from './ui/Intro/Intro';
import { Mascot } from './ui/Mascot';
import { SettingsPanel } from './ui/Settings/SettingsPanel';
import { PeriodSwitch, PeriodTint } from './ui/PeriodSwitch/PeriodSwitch';
import { AuthPanel } from './ui/Auth/AuthPanel';
import { authStore } from './state/authStore';
import { startSaveSync } from './state/saveSync';
import { startSfx } from './audio/sfx';
import { startAmbience } from './audio/ambience';
import { SchoolPanel } from './ui/SchoolPanel/SchoolPanel';

export function App() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const gs = useGameState();
  const { notice, decisionOpen } = gs;

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

  useEffect(() => { startSaveSync(); startSfx(); startAmbience(); void authStore.refresh(); }, []);
  // Bildirimler 8 sn sonra kendiliğinden kapanır (ekranda kalıp düğmeleri örtmesin).
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => gameStore.clearNotice(), 8000);
    return () => clearTimeout(t);
  }, [notice]);

  const scene = () => game.current?.scene.getScene(gameStore.get().mapView === 'coast' ? 'CoastScene' : 'WorldScene');
  const zoom = (delta: number) => scene()?.events.emit('zoom', delta);

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
    gameStore.setDrawer('tasks');
    setTimeout(() => document.getElementById('zones')?.focus(), 50);
  };

  const pick = (id: string) => {
    gameStore.selectHotspot(id);
    if (gameStore.get().mapView === 'world') game.current?.scene.getScene('WorldScene')?.events.emit('focus-hotspot', id);
  };

  return (
    <div className={`app view-${gs.mapView}${gs.drawer !== 'none' ? ' has-drawer' : ''}`}>
      <div ref={host} className="world" />
      <PeriodTint />
      <button className="skip" onClick={skipToZones}>Bölge listesine geç</button>
      <TopHud />
      <PeriodSwitch />
      <LeftHud />
      <RightHud game={game} onZoom={zoom} />
      <DockDrawer onPick={pick} />
      <BuildingCard />
      <Dock onMap={() => { gameStore.setMapView('world'); game.current?.scene.getScene('WorldScene')?.events.emit('focus-hotspot', 'school'); }} />
      <GuidePanel />
      <AdaMessage />
      <p className="rotate-hint" aria-hidden="true">📱↻ Daha geniş görünüm için cihazını yan çevir</p>
      {gs.schoolOpen && <SchoolPanel onPick={pick} />}
      {notice && !decisionOpen && (
        <aside role="status" className="panel toast">
          <Mascot mood={/rozet|kuruldu|seviye/i.test(notice) ? 'wow' : /kesinti|baskın|kilitli|yetmiyor|Önce/i.test(notice) ? 'worried' : 'happy'} size={48} />
          <p>{notice}</p>
          <button onClick={gameStore.clearNotice} aria-label="Bildirimi kapat">Tamam</button>
        </aside>
      )}
      <div className={gs.worldReady ? 'loading done' : 'loading'} role="status" aria-hidden={gs.worldReady}>
        <Mascot mood="wave" size={110} />
        <p>Şehrin hazırlanıyor…</p>
        <span className="spinner" aria-hidden="true" />
      </div>
      <TitleScreen onSettings={settingsStore.open} onTeacher={teacherStore.openTeacher} onSources={teacherStore.openSources} />
      <CharacterCreator />
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
