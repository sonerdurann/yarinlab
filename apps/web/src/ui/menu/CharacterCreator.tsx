import { useState } from 'react';
import { gameStore, useGameState } from '../../state/gameStore';
import { ACCESSORIES, HAIR_COLOR, HAIR_STYLES, OUTFIT, SKIN, type AvatarLook, type Profile } from '../../state/profile';
import { profileStore } from '../../state/profileStore';
import { AvatarFace, type Expression } from '../characters/Avatar';
import { Modal } from '../Modal/Modal';
import { sfx } from '../../audio/sfx';

function Swatches({ label, colors, value, onPick }: { label: string; colors: string[]; value: number; onPick: (i: number) => void }) {
  return (
    <fieldset className="swatches">
      <legend>{label}</legend>
      {colors.map((c, i) => (
        <label key={c} className={i === value ? 'on' : ''} style={{ background: c }}>
          <input type="radio" name={label} checked={i === value} onChange={() => onPick(i)} />
          <span className="sr-only">{label} {i + 1}</span>
        </label>
      ))}
    </fieldset>
  );
}

/** Karakter oluşturucu (prompt §4): 6 ten tonu, 5 saç, saç rengi, kıyafet rengi, aksesuar, takma ad önizlemesi. */
export function CharacterCreator() {
  const s = useGameState();
  return s.creatorOpen ? <Creator initial={s.profile} /> : null;
}

function Creator({ initial }: { initial: Profile }) {
  const [draft, setDraft] = useState<Profile>(initial);
  const [expr, setExpr] = useState<Expression>('joy');
  const look = draft.avatar;
  const set = (patch: Partial<AvatarLook>) => { sfx('select'); setDraft({ ...draft, avatar: { ...look, ...patch } }); setExpr('joy'); };
  const random = () => set({
    skin: Math.floor(Math.random() * SKIN.length), hair: Math.floor(Math.random() * HAIR_STYLES.length), hairColor: Math.floor(Math.random() * HAIR_COLOR.length),
    outfit: Math.floor(Math.random() * OUTFIT.length), acc: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id,
  });
  const done = () => { profileStore.save(draft); sfx('complete'); gameStore.closeCreator(); };
  return (
    <Modal titleId="creator-title" title="Karakterini oluştur" onClose={done} wide>
      <div className="creator">
        <div className="creator-preview" onMouseEnter={() => setExpr('talk')} onMouseLeave={() => setExpr('joy')}>
          <AvatarFace look={look} size={170} expr={expr} full title="Avatar önizlemesi" />
          <strong className="creator-name">{draft.nickname || 'Takma adın'}</strong>
          <button onClick={random}>🎲 Rastgele</button>
        </div>
        <div className="creator-options">
          <label className="field">Takma ad <span className="hint">(gerçek adını yazma)</span>
            <input value={draft.nickname} maxLength={20} onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} placeholder="ör. GüneşAvcısı" />
          </label>
          <Swatches label="Ten tonu" colors={SKIN} value={look.skin} onPick={(i) => set({ skin: i })} />
          <fieldset className="chips">
            <legend>Saç modeli</legend>
            {HAIR_STYLES.map((h, i) => (
              <label key={h} className={i === look.hair ? 'on' : ''}><input type="radio" name="hair" checked={i === look.hair} onChange={() => set({ hair: i })} />{h}</label>
            ))}
          </fieldset>
          <Swatches label="Saç rengi" colors={HAIR_COLOR} value={look.hairColor} onPick={(i) => set({ hairColor: i })} />
          <Swatches label="Kıyafet rengi" colors={OUTFIT} value={look.outfit} onPick={(i) => set({ outfit: i })} />
          <fieldset className="chips">
            <legend>Aksesuar</legend>
            {ACCESSORIES.map((a) => (
              <label key={a.id} className={a.id === look.acc ? 'on' : ''}><input type="radio" name="acc" checked={a.id === look.acc} onChange={() => set({ acc: a.id })} />{a.label}</label>
            ))}
          </fieldset>
        </div>
      </div>
      <div className="actions">
        <button className="primary" onClick={done}>Hazırım ✓</button>
      </div>
    </Modal>
  );
}
