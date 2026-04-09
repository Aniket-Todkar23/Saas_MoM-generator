import { create } from 'zustand'

export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing' | 'done'

interface RecordingStore {
  // Recording state
  state: RecordingState
  transcript: string
  elapsed: number
  mom: string
  error: string | null

  // Abort controller for Gemini call (not serializable — stored as ref outside)
  abortController: AbortController | null

  // Actions
  setRecordingState: (s: RecordingState) => void
  setTranscript: (t: string) => void
  appendTranscript: (t: string) => void
  setElapsed: (e: number) => void
  incrementElapsed: () => void
  setMom: (m: string) => void
  setError: (e: string | null) => void
  setAbortController: (ac: AbortController | null) => void
  reset: () => void
}

export const useRecordingStore = create<RecordingStore>((set) => ({
  state: 'idle',
  transcript: '',
  elapsed: 0,
  mom: '',
  error: null,
  abortController: null,

  setRecordingState: (s) => set({ state: s }),
  setTranscript: (t) => set({ transcript: t }),
  appendTranscript: (t) => set((prev) => ({ transcript: prev.transcript + t })),
  setElapsed: (e) => set({ elapsed: e }),
  incrementElapsed: () => set((prev) => ({ elapsed: prev.elapsed + 1 })),
  setMom: (m) => set({ mom: m }),
  setError: (e) => set({ error: e }),
  setAbortController: (ac) => set({ abortController: ac }),

  reset: () => set({
    state: 'idle',
    transcript: '',
    elapsed: 0,
    mom: '',
    error: null,
    abortController: null,
  }),
}))
