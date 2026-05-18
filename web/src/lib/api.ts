const base =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

export type SseEvent = Record<string, unknown>

/** POST /v1/investigate — Server-Sent Events (data: JSON lines). */
export async function postInvestigateStream(
  message: string,
  onEvent: (ev: SseEvent) => void,
): Promise<void> {
  const res = await fetch(`${base}/v1/investigate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const err = (await res.json()) as { detail?: unknown }
      if (typeof err.detail === 'string') detail = err.detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const dec = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const parts = buf.split('\n\n')
    buf = parts.pop() ?? ''
    for (const block of parts) {
      for (const line of block.split('\n')) {
        if (line.startsWith('data:')) {
          const json = line.slice(5).trim()
          try {
            onEvent(JSON.parse(json) as SseEvent)
          } catch {
            /* ignore malformed chunk */
          }
        }
      }
    }
  }
}
