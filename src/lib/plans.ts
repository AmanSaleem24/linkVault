import { SubscriptionStatus } from '@prisma/client'

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Up to 50 links/month',
      'Up to 10 QR codes/month',
      'Basic link stats (click count)',
      'Link expiration',
    ],
  },
  pro: {
    name: 'Pro',
    price: 99,
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO_MONTHLY!,
    features: [
      'Unlimited links',
      'Unlimited QR codes',
      'Full analytics (geo, referrers, devices, time series)',
      'Audit log',
      'CSV export',
      'No link expiration limits',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
