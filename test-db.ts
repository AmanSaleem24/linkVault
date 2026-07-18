import { prisma } from './src/lib/prisma'

async function main() {
  try {
    const user = await prisma.user.findFirst()
    console.log('Database connected successfully. Found user:', user)
  } catch (error) {
    console.error('Error connecting to database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
