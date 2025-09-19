import { z } from 'zod';
import { classifyAndPlan } from './openai.js';

const TriageSchema = z.object({
  classification: z.enum(['spam', 'personal', 'cita_medica']),
  reason: z.string().optional(),
  actions: z
    .array(
      z.object({
        type: z.enum(['reject_and_list_robinson', 'set_reminder', 'create_appointment', 'notify_user']),
        payload: z.record(z.any()),
      })
    )
    .default([]),
  calendarEntry: z
    .object({ title: z.string(), startIso: z.string(), endIso: z.string(), notes: z.string().optional() })
    .nullable()
    .optional(),
  reminder: z.object({ title: z.string(), remindAtIso: z.string(), notes: z.string().optional() }).nullable().optional(),
});

export type TriageResult = z.infer<typeof TriageSchema>;

export async function performTriage(transcript: string): Promise<TriageResult> {
  const raw = await classifyAndPlan(transcript);
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    json = { classification: 'personal', actions: [] };
  }
  const parsed = TriageSchema.safeParse(json);
  if (!parsed.success) {
    return { classification: 'personal', actions: [], reason: 'fallback' } as TriageResult;
  }
  return parsed.data;
}


