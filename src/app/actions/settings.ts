'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateProfileSchema, updatePasswordSchema, updateDefaultsSchema } from '@/lib/validators'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(data: { name: string; email: string }) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const parsed = updateProfileSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { name, email } = parsed.data

  try {
    // Check if email is already taken by another user
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return { success: false, error: 'Email is already in use' }
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email },
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Update profile error:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

export async function updatePasswordAction(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const parsed = updatePasswordSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { currentPassword, newPassword } = parsed.data

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user || !user.passwordHash) {
      return { success: false, error: 'User does not have a password' }
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return { success: false, error: 'Incorrect current password' }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    })

    return { success: true }
  } catch (error) {
    console.error('Update password error:', error)
    return { success: false, error: 'Failed to update password' }
  }
}

export async function deleteAccountAction() {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  try {
    // Due to onDelete: Cascade on all relations, this cleanly deletes everything.
    await prisma.user.delete({
      where: { id: session.user.id },
    })

    return { success: true }
  } catch (error) {
    console.error('Delete account error:', error)
    return { success: false, error: 'Failed to delete account' }
  }
}

export async function updateDefaultsAction(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const parsed = updateDefaultsSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { defaultUtmSource, defaultUtmMedium, defaultUtmCampaign, defaultExpiresIn } = parsed.data

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        defaultUtmSource,
        defaultUtmMedium,
        defaultUtmCampaign,
        defaultExpiresIn,
      },
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Update defaults error:', error)
    return { success: false, error: 'Failed to update defaults' }
  }
}
