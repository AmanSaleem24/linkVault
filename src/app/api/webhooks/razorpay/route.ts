import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { invalidateSubscriptionCache } from '@/lib/plan'

async function getRequestBody(request: Request): Promise<string> {
  const chunks: Uint8Array[] = []
  const reader = request.body?.getReader()
  if (!reader) return ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }

  const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }

  return Buffer.from(combined).toString('utf-8')
}

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

type RazorpayWebhookEvent = {
  entity: string
  account_id: string
  event: string
  contains: string[]
  payload: {
    subscription?: {
      entity: {
        id: string
        user_id: string
        plan_id: string
        status: string
        current_end: number
        ended_at: number | null
        cancelled_at: number | null
      }
    }
    payment?: {
      entity: {
        id: string
        subscription_id: string
        status: string
      }
    }
  }
  created_at: number
}

function extractEventId(event: RazorpayWebhookEvent): string {
  const subEntity = event.payload?.subscription?.entity
  const paymentEntity = event.payload?.payment?.entity
  if (subEntity?.id) return `sub_${subEntity.id}`
  if (paymentEntity?.id) return `pay_${paymentEntity.id}`
  return `evt_${event.created_at}_${event.event}`
}

async function processEvent(
  rawEvent: RazorpayWebhookEvent,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
) {
  const eventType = rawEvent.event
  const subEntity = rawEvent.payload?.subscription?.entity

  if (!subEntity) return

  const razorpaySubId = subEntity.id
  const statusMap: Record<string, { status: string; currentPeriodEnd?: Date }> = {
    'subscription.activated': { status: 'ACTIVE' },
    'subscription.authenticated': { status: 'AUTHENTICATED' },
    'subscription.charged': { status: 'ACTIVE' },
    'subscription.halted': { status: 'PAST_DUE' },
    'subscription.cancelled': { status: 'CANCELLED' },
    'subscription.completed': { status: 'COMPLETED' },
  }

  const mapping = statusMap[eventType]
  if (!mapping) return

  const subscription = await tx.subscription.findUnique({
    where: { razorpaySubscriptionId: razorpaySubId },
  })

  if (!subscription) {
    console.warn(`[webhook] subscription not found for ${razorpaySubId}`)
    return
  }

  const currentPeriodEnd =
    subEntity.current_end && subEntity.current_end > 0
      ? new Date(subEntity.current_end * 1000)
      : null

  await tx.subscription.update({
    where: { razorpaySubscriptionId: razorpaySubId },
    data: {
      status: mapping.status as Parameters<typeof tx.subscription.update>[0]['data']['status'],
      currentPeriodEnd: currentPeriodEnd ?? subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subEntity.cancelled_at !== null || subEntity.ended_at !== null,
    },
  })

  await invalidateSubscriptionCache(subscription.userId)
}

export async function POST(request: Request) {
  const body = await getRequestBody(request)
  const signature = request.headers.get('x-razorpay-signature') ?? ''
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!

  if (!verifyWebhookSignature(body, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let rawEvent: RazorpayWebhookEvent
  try {
    rawEvent = JSON.parse(body) as RazorpayWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventId = extractEventId(rawEvent)

  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId },
  })

  if (existing?.processedAt) {
    return NextResponse.json({ received: true, deduped: true })
  }

  const now = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.webhookEvent.upsert({
      where: { eventId },
      create: {
        eventId,
        eventType: rawEvent.event,
        payload: rawEvent as unknown as Parameters<typeof tx.webhookEvent.create>[0]['data']['payload'],
      },
      update: {},
    })

    await processEvent(rawEvent, tx)

    await tx.webhookEvent.update({
      where: { eventId },
      data: { processedAt: now },
    })
  })

  return NextResponse.json({ received: true })
}
