function getApiBase(): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('apiBase') : null
  return stored || (import.meta.env.VITE_API_BASE as string) || 'http://localhost:4000'
}

export async function apiHealth(): Promise<{ ok: boolean }> {
  const res = await fetch(`${getApiBase()}/api/health`);
  return res.json();
}

export async function apiTranscribe(file: File): Promise<{ transcript: string }> {
  const form = new FormData();
  form.append('audio', file);
  const res = await fetch(`${API_BASE}/api/transcribe`, {
    // @ts-ignore
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Transcription failed');
  return res.json();
}

export async function apiTriage(transcript: string, source?: string): Promise<{ callId: string; triage: any }> {
  const res = await fetch(`${getApiBase()}/api/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, source }),
  });
  if (!res.ok) throw new Error('Triage failed');
  return res.json();
}

export async function apiCalls(): Promise<any[]> {
  const res = await fetch(`${getApiBase()}/api/calls`);
  return res.json();
}

export async function apiCallDetail(id: string): Promise<any> {
  const res = await fetch(`${getApiBase()}/api/calls/${id}`);
  return res.json();
}

export async function apiCalendar(): Promise<any[]> {
  const res = await fetch(`${getApiBase()}/api/calendar`);
  return res.json();
}

export async function apiReminders(): Promise<any[]> {
  const res = await fetch(`${getApiBase()}/api/reminders`);
  return res.json();
}

export function setApiBase(url: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('apiBase', url)
  }
}

export function getCurrentApiBase(): string {
  return getApiBase()
}


