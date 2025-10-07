import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/lib/trpc'

export const sampleRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.sampleEntity.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.sampleEntity.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.sampleEntity.create({
        data: {
          title: input.title,
          description: input.description,
          userId: ctx.session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user owns this entity
      const entity = await ctx.prisma.sampleEntity.findUnique({
        where: { id: input.id },
      })

      if (!entity) {
        throw new Error('Entity not found')
      }

      if (entity.userId !== ctx.session.user.id) {
        throw new Error('Unauthorized')
      }

      return ctx.prisma.sampleEntity.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user owns this entity
      const entity = await ctx.prisma.sampleEntity.findUnique({
        where: { id: input.id },
      })

      if (!entity) {
        throw new Error('Entity not found')
      }

      if (entity.userId !== ctx.session.user.id) {
        throw new Error('Unauthorized')
      }

      return ctx.prisma.sampleEntity.delete({
        where: { id: input.id },
      })
    }),
})
