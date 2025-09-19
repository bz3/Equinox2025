import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { openaiTranscribe } from './openai.js';
import { initializeDatabase, db } from './persistence.js';
import { performTriage } from './triage.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

// Multer storage for uploaded audio files
const upload = multer({ dest: path.join(process.cwd(), 'src', 'uploads') });

io.on('connection', (socket) => {
  // Clients can subscribe to call-specific rooms to receive updates
  socket.on('subscribe', (callId: string) => {
    socket.join(`call:${callId}`);
  });
});

// Health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Upload audio and transcribe
app.post('/api/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing audio file' });
    }
    const transcript = await openaiTranscribe(req.file.path, req.file.mimetype);
    res.json({ transcript });
  } catch (error: any) {
    console.error('Transcription error', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// Triage a conversation text and create actions
app.post('/api/triage', async (req: Request, res: Response) => {
  try {
    const { source, transcript } = req.body as { source?: string; transcript: string };
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Missing transcript' });
    }

    const callId = cryptoRandomId();
    const createdAt = new Date().toISOString();

    db.prepare(
      'INSERT INTO calls (id, created_at, source, status, transcript, classification) VALUES (?, ?, ?, ?, ?, ?)' 
    ).run(callId, createdAt, source ?? 'unknown', 'processing', transcript, 'pending');

    io.to(`call:${callId}`).emit('event', { type: 'status', status: 'processing' });

    const triage = await performTriage(transcript);

    db.prepare('UPDATE calls SET status = ?, classification = ? WHERE id = ?')
      .run('completed', triage.classification, callId);

    // Insert actions
    const insertAction = db.prepare(
      'INSERT INTO actions (id, call_id, type, payload_json, status) VALUES (?, ?, ?, ?, ?)' 
    );
    for (const action of triage.actions) {
      insertAction.run(cryptoRandomId(), callId, action.type, JSON.stringify(action.payload), 'pending');
    }

    // If appointment, also create calendar entry
    if (triage.calendarEntry) {
      db.prepare('INSERT INTO calendar (id, call_id, title, start_iso, end_iso, notes) VALUES (?, ?, ?, ?, ?, ?)')
        .run(cryptoRandomId(), callId, triage.calendarEntry.title, triage.calendarEntry.startIso, triage.calendarEntry.endIso, triage.calendarEntry.notes ?? null);
    }

    // If reminder, create reminder entry
    if (triage.reminder) {
      db.prepare('INSERT INTO reminders (id, call_id, title, remind_at_iso, notes) VALUES (?, ?, ?, ?, ?)')
        .run(cryptoRandomId(), callId, triage.reminder.title, triage.reminder.remindAtIso, triage.reminder.notes ?? null);
    }

    io.to(`call:${callId}`).emit('event', { type: 'triage_completed', triage });

    res.json({ callId, triage });
  } catch (error: any) {
    console.error('Triage error', error);
    res.status(500).json({ error: 'Triage failed' });
  }
});

// List calls with summary
app.get('/api/calls', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM calls ORDER BY created_at DESC LIMIT 200').all();
  res.json(rows);
});

// Get call details with actions
app.get('/api/calls/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const call = db.prepare('SELECT * FROM calls WHERE id = ?').get(id);
  if (!call) return res.status(404).json({ error: 'Not found' });
  const actions = db.prepare('SELECT * FROM actions WHERE call_id = ?').all(id);
  const reminders = db.prepare('SELECT * FROM reminders WHERE call_id = ?').all(id);
  const calendar = db.prepare('SELECT * FROM calendar WHERE call_id = ?').all(id);
  res.json({ call, actions, reminders, calendar });
});

// List calendar and reminders
app.get('/api/calendar', (_req: Request, res: Response) => {
  const items = db.prepare('SELECT * FROM calendar ORDER BY start_iso DESC LIMIT 200').all();
  res.json(items);
});
app.get('/api/reminders', (_req: Request, res: Response) => {
  const items = db.prepare('SELECT * FROM reminders ORDER BY remind_at_iso DESC LIMIT 200').all();
  res.json(items);
});

initializeDatabase();

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

function cryptoRandomId(): string {
  // Simple random ID (not for cryptographic use)
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}


