import { PrismaClient, Role, Status } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zenpsy.com' },
    update: {},
    create: {
      email: 'admin@zenpsy.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
    },
  })

  // Create test user
  const userPassword = await bcrypt.hash('user123!', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@zenpsy.com' },
    update: {},
    create: {
      email: 'user@zenpsy.com',
      name: 'Test User',
      password: userPassword,
      role: Role.USER,
    },
  })

  // Create profiles
  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      bio: 'System administrator',
      location: 'San Francisco, CA',
    },
  })

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      bio: 'Regular user testing the application',
      location: 'New York, NY',
    },
  })

  // Create sample entities
  const sampleEntities = [
    {
      title: 'Welcome to Zen Psy App',
      description: 'This is your first sample entity. You can edit or delete it.',
      status: Status.ACTIVE,
      userId: user.id,
    },
    {
      title: 'Getting Started Guide',
      description: 'Learn how to use the application with this comprehensive guide.',
      status: Status.ACTIVE,
      userId: user.id,
    },
    {
      title: 'Archived Item',
      description: 'This item has been archived and is no longer active.',
      status: Status.ARCHIVED,
      userId: user.id,
    },
  ]

  for (const entity of sampleEntities) {
    await prisma.sampleEntity.create({
      data: entity,
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin user: admin@zenpsy.com / admin123!`)
  console.log(`👤 Test user: user@zenpsy.com / user123!`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
