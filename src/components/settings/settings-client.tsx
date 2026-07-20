'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save, User, Mail, Shield, AlertTriangle, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateProfileAction, updatePasswordAction, deleteAccountAction, updateDefaultsAction } from '@/app/actions/settings'
import { signOut } from 'next-auth/react'
import { Link as LinkIcon } from 'lucide-react'
import { PRESET_DURATIONS, type ExpiryDuration } from '@/lib/validators'
import { ExpirySelector } from '@/components/home/expiry-selector'

interface SettingsClientProps {
  initialName: string
  initialEmail: string
  hasPassword: boolean
  isPro: boolean
  defaultUtmSource: string
  defaultUtmMedium: string
  defaultUtmCampaign: string
  defaultExpiresIn: string
}

export function SettingsClient({ 
  initialName, 
  initialEmail, 
  hasPassword,
  isPro,
  defaultUtmSource: initialSource,
  defaultUtmMedium: initialMedium,
  defaultUtmCampaign: initialCampaign,
  defaultExpiresIn: initialExpiresIn
}: SettingsClientProps) {
  const router = useRouter()

  // Profile State
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // UTM Defaults State
  const [utmSource, setUtmSource] = useState(initialSource)
  const [utmMedium, setUtmMedium] = useState(initialMedium)
  const [utmCampaign, setUtmCampaign] = useState(initialCampaign)

  // Expiry State
  const isCustomInit = initialExpiresIn && !PRESET_DURATIONS.find(p => p.value === initialExpiresIn)
  const customMatch = isCustomInit ? initialExpiresIn.match(/^(\d+)(m|h)$/) : null
  
  const [expiresIn, setExpiresIn] = useState<ExpiryDuration>(
    isCustomInit ? 'custom' : (initialExpiresIn as ExpiryDuration | null) || null
  )
  const [customValue, setCustomValue] = useState(customMatch ? customMatch[1] : '')
  const [customUnit, setCustomUnit] = useState<'m' | 'h'>(customMatch ? customMatch[2] as 'm'|'h' : 'm')
  
  const [isSavingDefaults, setIsSavingDefaults] = useState(false)

  // Danger Zone State
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    const res = await updateProfileAction({ name, email })
    setIsSavingProfile(false)
    if (res.success) {
      toast.success('Profile updated successfully')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update profile')
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match')
    }
    setIsSavingPassword(true)
    const res = await updatePasswordAction({ currentPassword, newPassword, confirmPassword })
    setIsSavingPassword(false)
    if (res.success) {
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      toast.error(res.error || 'Failed to update password')
    }
  }

  const handleUpdateDefaults = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingDefaults(true)
    
    let finalExpiry: string | null = null
    if (expiresIn === 'custom' && customValue) {
      const num = parseInt(customValue, 10)
      finalExpiry = `${num}${customUnit}`
    } else if (expiresIn !== 'custom' && expiresIn !== null) {
      finalExpiry = String(expiresIn)
    }

    const res = await updateDefaultsAction({ 
      defaultUtmSource: utmSource || null,
      defaultUtmMedium: utmMedium || null,
      defaultUtmCampaign: utmCampaign || null,
      defaultExpiresIn: finalExpiry
    })
    setIsSavingDefaults(false)
    if (res.success) {
      toast.success('Link defaults updated')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to update defaults')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setIsDeleting(true)
    const res = await deleteAccountAction()
    if (res.success) {
      toast.success('Account deleted')
      signOut({ callbackUrl: '/login' })
    } else {
      toast.error(res.error || 'Failed to delete account')
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid gap-8 pb-24">
      {/* ── Profile Settings ──────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-border dark:bg-card">
        <div className="border-b border-slate-100 p-6 dark:border-border">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-foreground">
            <User className="size-5 text-brand-500" />
            Profile Settings
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
            Update your personal information and email address.
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-border dark:bg-background dark:focus:bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-border dark:bg-background dark:focus:bg-background"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSavingProfile || (name === initialName && email === initialEmail)}
              className="gap-2 rounded-xl bg-brand-500 px-6 py-5 text-sm hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-500"
            >
              {isSavingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Changes
            </Button>
          </form>
        </div>
      </section>

      {/* ── Security Settings ──────────────────────────────────────────────── */}
      {hasPassword ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-border dark:bg-card">
          <div className="border-b border-slate-100 p-6 dark:border-border">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-foreground">
              <Shield className="size-5 text-brand-500" />
              Security
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
              Ensure your account is using a long, random password to stay secure.
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-border dark:bg-background dark:focus:bg-background"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-border dark:bg-background dark:focus:bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-border dark:bg-background dark:focus:bg-background"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="gap-2 rounded-xl bg-slate-900 px-6 py-5 text-sm hover:bg-slate-800 dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
              >
                {isSavingPassword ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Update Password
              </Button>
            </form>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-border dark:bg-card">
          <div className="border-b border-slate-100 p-6 dark:border-border">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-foreground">
              <Shield className="size-5 text-brand-500" />
              Security
            </h2>
          </div>
          <div className="p-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
              You signed in using a connected provider (e.g. Google). Password changes are managed by your provider.
            </div>
          </div>
        </section>
      )}

      {/* ── Link Defaults (UTM) ─────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-border dark:bg-card">
        <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 dark:border-border">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-foreground">
              <LinkIcon className="size-5 text-brand-500" />
              Link Defaults (UTM Tags)
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
              Automatically append these tracking tags to every new link you create.
            </p>
          </div>
          {!isPro && (
            <div className="inline-flex shrink-0 items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-900/50 dark:bg-brand-900/20 dark:text-brand-300">
              Pro Feature
            </div>
          )}
        </div>
        <div className="p-6">
          <form onSubmit={handleUpdateDefaults} className="space-y-6 max-w-xl">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Default Source
                </label>
                <input
                  type="text"
                  placeholder="e.g. twitter"
                  disabled={!isPro}
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border dark:bg-background dark:focus:bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Default Medium
                </label>
                <input
                  type="text"
                  placeholder="e.g. social"
                  disabled={!isPro}
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border dark:bg-background dark:focus:bg-background"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Default Campaign
                </label>
                <input
                  type="text"
                  placeholder="e.g. summer_sale"
                  disabled={!isPro}
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border dark:bg-background dark:focus:bg-background"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <ExpirySelector
                  value={expiresIn}
                  onChange={setExpiresIn}
                  customValue={customValue}
                  customUnit={customUnit}
                  onCustomValueChange={setCustomValue}
                  onCustomUnitChange={setCustomUnit}
                  disabled={!isPro}
                  label="Default Expiration"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                !isPro || 
                isSavingDefaults
              }
              className="gap-2 rounded-xl bg-brand-500 px-6 py-5 text-sm hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-500"
            >
              {isSavingDefaults ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Link Defaults
            </Button>
          </form>
        </div>
      </section>

      {/* ── Danger Zone ──────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-red-200/60 bg-white shadow-sm dark:border-red-900/30 dark:bg-card">
        <div className="border-b border-red-100 p-6 dark:border-red-900/20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-red-600 dark:text-red-400">
            <AlertTriangle className="size-5" />
            Danger Zone
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>
        <div className="p-6">
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Type <strong className="text-red-600 dark:text-red-400 font-bold select-none">DELETE</strong> below to confirm.
            </p>
            <input
              type="text"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="h-11 w-full max-w-xs rounded-xl border border-red-200 bg-red-50/50 px-4 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-red-900/50 dark:bg-red-950/20 dark:focus:bg-background"
            />
            <div className="pt-2">
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="gap-2 rounded-xl px-6 py-5 text-sm"
              >
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />}
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
