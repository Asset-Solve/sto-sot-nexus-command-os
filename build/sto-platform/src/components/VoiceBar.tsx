'use client';

/**
 * Voice command bar. Uses the browser Web Speech API (Chrome/Edge) for
 * speech-to-text, posts the transcript to /api/voice, speaks the answer via
 * speechSynthesis, navigates, and hands controlled-action drafts to the
 * action drawer (never executes them). Typed commands use the same grammar.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/lib/api';

export type VoiceDraft = { actionId: string; label: string; payload: Record<string, unknown> };

export default function VoiceBar({ onDraft }: { onDraft?: (d: VoiceDraft) => void }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [text, setText] = useState('');
  const [last, setLast] = useState<string>('');
  const recRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  function speak(s: string) {
    try {
      const u = new SpeechSynthesisUtterance(s);
      u.rate = 1.05;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* speech optional */ }
  }

  async function handleCommand(transcript: string) {
    if (!transcript.trim()) return;
    const r = await post('/api/voice', { transcript });
    setLast(`${r.intent}: ${r.speech}`);
    speak(r.speech);
    if (r.intent === 'draft_action' && r.draft && onDraft) {
      if (r.route) router.push(`${r.route}?draft=${encodeURIComponent(JSON.stringify(r.draft))}`);
      else onDraft(r.draft);
    } else if ((r.intent === 'navigate' || r.intent === 'query') && r.route) {
      router.push(r.route);
    }
    setText('');
  }

  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setText(t);
      handleCommand(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 380, flex: 1, maxWidth: 640 }}>
      <button
        className={`btn mic ${listening ? 'listening' : ''}`}
        title={supported ? 'Voice command (Web Speech API)' : 'Voice not supported in this browser — type a command'}
        onClick={toggleMic}
        disabled={!supported}
      >
        {listening ? '● Listening…' : '🎙 Voice'}
      </button>
      <input
        placeholder='Command: "show material shortages" · "open permits" · "reserve 6 sets of MAT-4714" · "event status"'
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCommand(text)}
        style={{ flex: 1 }}
      />
      {last && <span className="voicehint" title={last}>{last.slice(0, 60)}{last.length > 60 ? '…' : ''}</span>}
    </div>
  );
}
