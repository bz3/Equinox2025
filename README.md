# Equinox2025

Prototype de asistente de llamadas con backend Express + OpenAI y frontend React (Vite).

- Backend: /backend (API: /api/transcribe, /api/triage, /api/calls, /api/calendar, /api/reminders)
- Frontend: /frontend (UI para demo: subir audio / pegar texto, ver resultados)

Despliegue:
- Backend en Render (usar render.yaml)
- Frontend en Vercel (VITE_API_BASE apuntando al backend)
