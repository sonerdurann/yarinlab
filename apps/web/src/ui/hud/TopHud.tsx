import { useState } from 'react';
import { levelForXp, xpForLevel } from '@yarinlab/shared';
import { gameStore, useGameState } from '../../state/gameStore';
import { cityOf } from '../../state/city';
import { teacherStore } from '../../state/teacherStore';
import { settingsStore } from '../../state/settingsStore';
import { authStore, useAuth } from '../../state/authStore';
import { syncLabel, useSync } from '../../state/saveSync';
import { useCountUp } from '../useCountUp';
import { Logo } from '../Logo';
import { Icon } from '../Icon';
import { TimeChip } from '../City/CityPanels';
import { AvatarFace } from '../characters/Avatar';
import { useProfile } from '../../state/profileStore';

const fmt = (n: number) => n.toLocaleString('tr-TR');

/** Animasyonlu sayı: ekranda ilerler, ekran okuyucu yalnızca son değeri okur. */
function Num({ value }: { value: number }) {
  const v = useCountUp(value);
  return (
    <>
      <span aria-hidden="true">{fmt(v)}</span>
      <span className="sr-only">{fmt(value)}</span>
    </>
  );
}

type Res = { key: string; ico: string; label: string; value: number; unit?: string; tone: 'good' | 'ok' | 'bad'; info: string; hide?: boolean };

/** Kaynak göstergesi: tıklayınca açıklama kartı açılır (prompt §5 üst panel). */
function ResourcePill({ r, open, onToggle }: { r: Res; open: boolean; onToggle: () => void }) {
  return (
    <span className={`pill tone-${r.tone}${r.hide ? ' hide-sm' : ''}`} title={r.info}>
      <button className="pill-btn" aria-expanded={open} aria-controls={`res-${r.key}`} onClick={onToggle}>
        <span className="ico" aria-hidden="true">{r.ico}</span><span className="sr-only">{r.label} </span><Num value={r.value} />{r.unit ? <span className="unit">{r.unit}</span> : null}
      </button>
      {open && (
        <span id={`res-${r.key}`} role="note" className="res-card">
          <strong>{r.ico} {r.label}</strong>
          <span>{r.info}</span>
        </span>
      )}
    </span>
  );
}

/** Üst HUD: bütçe, enerji, su, atık, emisyon, refah, yıl/mevsim/hava, günü bitir; hesap ve ayarlar. */
export function TopHud() {
  const st = useGameState();
  const { world } = st;
  const ind = cityOf(st).indicators;
  const { user } = useAuth();
  const sync = useSync();
  const profile = useProfile();
  const [open, setOpen] = useState<string | null>(null);
  const lvl = levelForXp(st.xp), lo = xpForLevel(lvl), hi = xpForLevel(lvl + 1);
  const t = (v: number, good: number, ok: number, higher = true): Res['tone'] => (higher ? (v >= good ? 'good' : v >= ok ? 'ok' : 'bad') : v <= good ? 'good' : v <= ok ? 'ok' : 'bad');
  const res: Res[] = [
    { key: 'budget', ico: '💰', label: 'Bütçe', value: world.budget, tone: t(world.budget, 6000, 2500), info: 'Kasa: oyun puanı, gerçek para değil. Her gün +300 gelir, yapıların bakımı düşülür.' },
    { key: 'energy', ico: '⚡', label: 'Enerji', value: world.energyScore, tone: ind.energy.outageHours > 0 ? 'bad' : t(world.energyScore, 70, 45), info: `Temiz enerji payı %${ind.energy.renewableSharePct}. Üretim ${ind.energy.prodKwh} / talep ${ind.energy.demandKwh} kWh${ind.energy.outageHours ? `, ${ind.energy.outageHours} saat kesinti` : ''}.` },
    { key: 'water', ico: '💧', label: 'Su', value: world.waterScore, tone: t(world.waterScore, 70, 45), info: `Günlük su kullanımı ${ind.waterUseM3} m³ (varsayım). Yağmur hasadı ve sera tasarrufu artırır.` },
    { key: 'waste', ico: '🗑️', label: 'Atık', value: Math.round(ind.wasteKg), unit: ' kg', tone: t(ind.wasteKg, 30, 45, false), info: `Okulun günlük çöpü (varsayım): ${ind.collectionNeed} çöp kamyonu seferi.` },
    { key: 'emission', ico: '🌫️', label: 'Emisyon', value: ind.emissionIndex, tone: t(ind.emissionIndex, 75, 95, false), hide: true, info: 'Göreli emisyon endeksi; başlangıç 100. Birimsizdir, kg CO₂e değildir.' },
    { key: 'wellbeing', ico: '😊', label: 'Refah', value: world.wellbeing, tone: t(world.wellbeing, 70, 45), hide: true, info: 'Şehirde yaşayanların mutluluğu ve sağlığı (oyun göstergesi).' },
  ];
  return (
    <header className="hud-top topbar">
      <span className="brand">
        <Logo />
        <strong>YarınLab<span className="slogan-mini">Geleceği sen tasarla</span></strong>
      </span>
      <span className="pills" aria-label="Kaynaklar">
        {res.map((r) => <ResourcePill key={r.key} r={r} open={open === r.key} onToggle={() => setOpen(open === r.key ? null : r.key)} />)}
      </span>
      <TimeChip />
      <span className="topbar-actions">
        <span className="pill level" title={`${st.xp} XP`}><span className="ico" aria-hidden="true">⭐</span>Seviye {lvl}
          <span className="xpbar" aria-hidden="true"><span style={{ width: `${Math.round((100 * (st.xp - lo)) / Math.max(1, hi - lo))}%` }} /></span>
        </span>
        <span role="status" className="sync hide-sm">{syncLabel(sync.status)}</span>
        <button className="me" onClick={authStore.open} aria-label={user ? `Hesabım: ${user.displayName}` : 'Giriş'}>
          <AvatarFace look={profile.avatar} size={30} />{user ? <span className="lbl" aria-hidden="true">{user.displayName}</span> : <span className="lbl" aria-hidden="true">Giriş</span>}
        </button>
        <button onClick={teacherStore.openTeacher} aria-label="Öğretmen" title="Öğretmen paneli"><span aria-hidden="true" className="ico-only">🍎</span><span className="lbl" aria-hidden="true">Öğretmen</span></button>
        <button onClick={settingsStore.open} aria-label="Ayarlar" title="Ayarlar"><Icon name="gear" /></button>
        <button onClick={() => gameStore.openOverlay('help')} aria-label="Yardım" title="Yardım"><Icon name="question" /></button>
        <button onClick={() => gameStore.openOverlay('menu')} aria-label="Ana menü" title="Ana menü"><Icon name="menuList" /></button>
      </span>
    </header>
  );
}
