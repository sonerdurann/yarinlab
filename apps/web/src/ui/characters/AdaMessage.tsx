import { useEffect, useRef, useState } from 'react';
import { chapterFor } from '@yarinlab/shared';
import { useGameState } from '../../state/gameStore';
import { completedTaskIds } from '../../state/city';
import { Ada } from './Avatar';

/** Bölüm geçişlerinde Ada 2040'tan kısa bir hologram mesajıyla döner (prompt §4). 10 sn sonra kendiliğinden kapanır. */
export function AdaMessage() {
  const s = useGameState();
  const ch = chapterFor(completedTaskIds(s).length);
  const prev = useRef(ch.title);
  const [msg, setMsg] = useState<{ title: string; text: string } | null>(null);
  useEffect(() => {
    if (prev.current !== ch.title) { setMsg({ title: ch.title, text: ch.text }); prev.current = ch.title; }
  }, [ch.title, ch.text]);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 10000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg || s.decisionOpen || s.overlay !== 'none') return null;
  return (
    <aside className="ada-message panel" role="status" aria-label="Ada'dan mesaj">
      <Ada size={64} expr="talk" />
      <div><strong>📡 Yeni bölüm: {msg.title}</strong><p>{msg.text}</p></div>
      <button className="icon-btn" aria-label="Mesajı kapat" onClick={() => setMsg(null)}>✕</button>
    </aside>
  );
}
