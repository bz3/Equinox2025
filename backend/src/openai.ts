import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function openaiTranscribe(filePath: string, mimeType?: string): Promise<string> {
  // Use Whisper or Audio Transcriptions API via OpenAI SDK v4
  const file = fs.createReadStream(path.resolve(filePath));
  const response = await client.audio.transcriptions.create({
    file,
    model: 'gpt-4o-transcribe',
    response_format: 'json',
  } as any);
  const text: string = (response as any).text || (response as any).results?.[0]?.text || '';
  return text;
}

export async function classifyAndPlan(transcript: string): Promise<string> {
  const system = `Eres un asistente de triage de llamadas.
  Clasifica la llamada en una y solo una de: spam, personal, cita_medica.
  Devuelve un JSON con:
  {
    "classification": "spam|personal|cita_medica",
    "reason": "explicacion breve",
    "actions": [
      // acciones a ejecutar. Ejemplos:
      // {"type":"reject_and_list_robinson","payload":{}}
      // {"type":"set_reminder","payload":{"title":"Llamar a ...","remindAtIso":"2025-09-19T17:00:00Z"}}
      // {"type":"create_appointment","payload":{"title":"Cita médica","startIso":"2025-09-20T09:00:00Z","endIso":"2025-09-20T09:30:00Z"}}
    ],
    "calendarEntry": {"title":"","startIso":"","endIso":"","notes":""} | null,
    "reminder": {"title":"","remindAtIso":"","notes":""} | null
  }`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: transcript },
    ],
    temperature: 0,
    response_format: { type: 'json_object' as any },
  } as any);

  return completion.choices[0]?.message?.content ?? '{"classification":"personal","actions":[]}';
}


