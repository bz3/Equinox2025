import { useEffect, useState } from 'react'
import './App.css'
import { apiCalls, apiCalendar, apiReminders, apiTriage, apiTranscribe } from './lib/api'

type CallRow = {
  id: string
  created_at: string
  source: string
  status: string
  transcript: string
  classification: string
}

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState('')
  const [source, setSource] = useState('simulado')
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<any | null>(null)
  const [calls, setCalls] = useState<CallRow[]>([])
  const [calendar, setCalendar] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])

  async function handleTranscribe() {
    if (!file) return
    setLoading(true)
    try {
      const res = await apiTranscribe(file)
      setTranscript(res.transcript)
    } finally {
      setLoading(false)
    }
  }

  async function handleTriage() {
    if (!transcript.trim()) return
    setLoading(true)
    try {
      const res = await apiTriage(transcript, source)
      setLastResult(res)
      await refreshData()
    } finally {
      setLoading(false)
    }
  }

  async function refreshData() {
    const [c, cal, rem] = await Promise.all([apiCalls(), apiCalendar(), apiReminders()])
    setCalls(c)
    setCalendar(cal)
    setReminders(rem)
  }

  useEffect(() => {
    refreshData()
  }, [])

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Asistente de Llamadas - Demo</h1>
      <p>Sube un audio o pega un texto para simular la llamada. El asistente hará triage y creará acciones.</p>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>1) Audio</h2>
          <input type="file" accept="audio/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button disabled={!file || loading} onClick={handleTranscribe} style={{ marginLeft: 8 }}>
            {loading ? 'Procesando...' : 'Transcribir'}
          </button>
          <div style={{ marginTop: 12 }}>
            <label>
              Origen:
              <input value={source} onChange={e => setSource(e.target.value)} style={{ marginLeft: 8 }} />
            </label>
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>2) Transcript</h2>
          <textarea rows={8} value={transcript} onChange={e => setTranscript(e.target.value)} style={{ width: '100%' }} />
          <button disabled={loading || !transcript.trim()} onClick={handleTriage} style={{ marginTop: 8 }}>Triage</button>
        </div>
      </section>

      {lastResult && (
        <section style={{ marginTop: 16, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>Resultado</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(lastResult, null, 2)}</pre>
        </section>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>Calendario</h2>
          {calendar.length === 0 ? <p>Sin entradas</p> : (
            <ul>
              {calendar.map((c) => (
                <li key={c.id}>{c.title} — {c.start_iso} → {c.end_iso}</li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>Recordatorios</h2>
          {reminders.length === 0 ? <p>Sin recordatorios</p> : (
            <ul>
              {reminders.map((r) => (
                <li key={r.id}>{r.title} — {r.remind_at_iso}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section style={{ marginTop: 16, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2>Llamadas recientes</h2>
        {calls.length === 0 ? <p>Sin llamadas</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Fecha</th>
                <th style={{ textAlign: 'left' }}>Origen</th>
                <th style={{ textAlign: 'left' }}>Estado</th>
                <th style={{ textAlign: 'left' }}>Clase</th>
              </tr>
            </thead>
            <tbody>
              {calls.map(c => (
                <tr key={c.id}>
                  <td>{c.created_at}</td>
                  <td>{c.source}</td>
                  <td>{c.status}</td>
                  <td>{c.classification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default App
