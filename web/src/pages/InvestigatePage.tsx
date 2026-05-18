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
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-700 text-white shadow-sm">
              <Wrench className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                SelfAware®
              </p>
              <h1 className="text-lg font-semibold text-zinc-900">Autonomous Cortex</h1>
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

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <SpotlightHero className="border border-zinc-200/80 bg-white/90 p-6 shadow-sm md:p-8">
            <div className="space-y-2">
              <Badge variant="info">Agentic · SSE</Badge>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                Investigation console
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">
                Streams thoughts, simulated tool calls, and a final answer. Output is
                indicative only; correlate with ground-truth systems before operational
                decisions.
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
