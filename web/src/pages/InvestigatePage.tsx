import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { BookOpen, ExternalLink, Loader2, MessageSquare, Wrench } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { GridBackground, MovingBorder, SpotlightHero } from '@/components/aceternity'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { postInvestigateStream, type SseEvent } from '@/lib/api'

const schema = z.object({
  message: z.string().min(1, 'Describe what to investigate.'),
})

type FormValues = z.infer<typeof schema>

type TimelineEntry =
  | { kind: 'thought'; text: string }
  | { kind: 'tool'; name: string; detail: unknown }
  | { kind: 'answer'; text: string }

const INVESTIGATE_EXAMPLES: { label: string; message: string }[] = [
  {
    label: 'Pump tripping',
    message:
      'Chilled-water pump P-CP-S3 trips every 20 minutes on overload. Which documents and upstream dependencies should we verify first?',
  },
  {
    label: 'Power loss',
    message:
      'Half of Floor 4 lost power at 02:15. Outline impact to AHUs and feeders and what to pull from maintenance records.',
  },
  {
    label: 'Sensor drift',
    message:
      'Space temp sensor T-4-12 reads 4°F high vs adjacent zone. What calibration SOP and evidence chain should the technician follow?',
  },
  {
    label: 'Startup after outage',
    message:
      'After a 30-minute campus outage, what is the safe restart order for chiller plant and critical labs?',
  },
  {
    label: 'Short compliance',
    message:
      'List the minimum documentation needed for an LOTO event on RTU-07 per our policy pack.',
  },
  {
    label: 'Cross-system',
    message:
      'If NeuralPulse finds bulletin MB-2024-07 and SpatialNexus shows feeder BUS-A downstream of TRF-12-AUX1, what should we tell the shift lead?',
  },
]

export function InvestigatePage() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [streaming, setStreaming] = useState(false)
  const [finalId, setFinalId] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  })

  const handleEvent = useCallback((ev: SseEvent) => {
    const event = typeof ev.event === 'string' ? ev.event : ''
    if (event === 'thought' && typeof ev.text === 'string') {
      setTimeline((t) => [...t, { kind: 'thought', text: ev.text as string }])
    }
    if (event === 'tool' && typeof ev.name === 'string') {
      setTimeline((t) => [
        ...t,
        { kind: 'tool', name: ev.name as string, detail: ev.detail },
      ])
    }
    if (event === 'answer' && typeof ev.text === 'string') {
      setTimeline((t) => [...t, { kind: 'answer', text: ev.text as string }])
    }
    if (event === 'done' && typeof ev.request_id === 'string') {
      setFinalId(ev.request_id as string)
    }
  }, [])

  async function onSubmit(values: FormValues) {
    setTimeline([])
    setFinalId(null)
    setStreaming(true)
    try {
      await postInvestigateStream(values.message.trim(), handleEvent)
      toast.success('Investigation stream completed')
    } catch (e) {
      toast.error('Stream failed', {
        description: e instanceof Error ? e.message : 'Unknown error',
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <GridBackground />
      <header
        className="border-b border-[var(--color-mist-edge)] bg-white/85 backdrop-blur-md"
        role="banner"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-slate-ops)] text-[var(--color-amber)] shadow-sm">
              <Wrench className="size-5" aria-hidden />
            </div>
            <div>
              <p className="mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-amber-deep)]">
                SelfAware® · Cortex IV
              </p>
              <h1 className="ops-display text-xl font-extrabold text-[var(--color-slate-ops)]">
                Mission Console
              </h1>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/docs" target="_blank" rel="noreferrer">
              <BookOpen className="size-4" />
              OpenAPI
              <ExternalLink className="size-3 opacity-60" />
            </a>
          </Button>
        </div>
      </header>

      <main
        id="main"
        role="main"
        className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-8">
          <SpotlightHero className="p-6 md:p-9">
            <div className="space-y-3 pr-24">
              <Badge variant="info">Agentic · live SSE · ReAct</Badge>
              <h2 className="ops-display text-3xl font-extrabold tracking-tight text-[var(--color-slate-ops)] md:text-4xl">
                Investigation console
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-slate-ops-soft)]">
                Streams analyst thoughts, real tool calls to NeuralPulse + SpatialNexus, and
                a final synthesized answer. Read-only against field systems. Correlate with
                ground-truth before operational decisions.
              </p>
            </div>
          </SpotlightHero>

          <MovingBorder>
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="size-5 text-violet-700" />
                  Message
                </CardTitle>
                <CardDescription>POST /v1/investigate (text/event-stream)</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="message">Investigation brief</Label>
                    <p className="text-xs text-zinc-500">Try an example</p>
                    <div className="flex flex-wrap gap-2">
                      {INVESTIGATE_EXAMPLES.map((ex) => (
                        <Button
                          key={ex.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-auto max-w-full whitespace-normal py-1.5 text-left text-xs font-normal"
                          onClick={() => form.setValue('message', ex.message)}
                        >
                          {ex.label}
                        </Button>
                      ))}
                    </div>
                    <Textarea
                      id="message"
                      placeholder="What failed? What evidence should the agent gather?"
                      {...form.register('message')}
                    />
                    {form.formState.errors.message?.message ? (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.message.message}
                      </p>
                    ) : null}
                  </div>
                  <Button type="submit" disabled={streaming}>
                    {streaming ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Streaming…
                      </>
                    ) : (
                      'Run investigation'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </MovingBorder>

          <div className="space-y-4">
            {timeline
              .filter((e) => e.kind === 'answer')
              .map((e, i) => (
                <motion.div
                  key={`ans-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Answer</CardTitle>
                      {finalId ? (
                        <CardDescription className="font-mono text-xs">
                          {finalId}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                        {e.text}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tool timeline</CardTitle>
              <CardDescription>Events from the agent stream</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[70vh] space-y-3 overflow-y-auto text-sm">
              {timeline.length === 0 ? (
                <p className="text-zinc-500">No events yet.</p>
              ) : (
                timeline.map((e, i) =>
                  e.kind === 'thought' ? (
                    <div
                      key={`t-${i}`}
                      className="rounded-lg border border-violet-100 bg-violet-50/60 p-3 text-violet-900"
                    >
                      <Badge variant="info" className="mb-1 text-[10px]">
                        thought
                      </Badge>
                      <p>{e.text}</p>
                    </div>
                  ) : e.kind === 'tool' ? (
                    <div
                      key={`o-${i}`}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-800"
                    >
                      <Badge variant="warning" className="mb-1 text-[10px]">
                        tool
                      </Badge>
                      <div className="font-semibold">{e.name}</div>
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(e.detail, null, 0)}
                      </pre>
                    </div>
                  ) : null,
                )
              )}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}
