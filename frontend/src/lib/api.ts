const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export async function apiHealth(): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function apiTranscribe(file: File): Promise<{ transcript: string }> {
  const form = new FormData();
  form.append('audio', file);
  const res = await fetch(`${API_BASE}/api/transcribe`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Transcription failed');
  return res.json();
}

export async function apiTriage(transcript: string, source?: string): Promise<{ callId: string; triage: any }> {
  const res = await fetch(`${API_BASE}/api/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, source }),
  });
  if (!res.ok) throw new Error('Triage failed');
  return res.json();
}

export async function apiCalls(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/calls`);
  return res.json();
}

export async function apiCallDetail(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/calls/${id}`);
  return res.json();
}

export async function apiCalendar(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/calendar`);
  return res.json();
}

export async function apiReminders(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/reminders`);
  return res.json();
}


