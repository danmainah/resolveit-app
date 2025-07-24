import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// Handle graceful shutdown
const gracefulShutdown = async () => {
  await prisma.$disconnect()
}

process.on('beforeExit', gracefulShutdown)

process.on('SIGINT', async () => {
  await gracefulShutdown()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await gracefulShutdown()
  process.exit(0)
})

export default prisma