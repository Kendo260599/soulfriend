import { createTRPCRouter } from '@/lib/trpc'
import { sampleRouter } from './sample'

export const appRouter = createTRPCRouter({
  sample: sampleRouter,
})

export type AppRouter = typeof appRouter
