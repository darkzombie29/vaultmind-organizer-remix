import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Input, toast } from '@blinkdotnew/ui'
import { Vault, Eye, EyeOff, Globe, Loader2 } from 'lucide-react'
import { blink } from '../blink/client'

type AuthTab = 'signin' | 'signup'

export function LoginPage() {
  const [tab, setTab] = useState<AuthTab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      if (tab === 'signin') {
        await blink.auth.signInWithEmail(email, password)
        toast.success('Welcome back!')
      } else {
        await blink.auth.signUp({ email, password })
        toast.success('Account created! Welcome to VaultMind.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true)
    try {
      await blink.auth.signInWithGoogle()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed'
      toast.error(message)
      setIsGoogleLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'hsl(228 42% 7%)' }}
    >
      {/* Background glow blobs */}
      <div
        className="glow-blob w-96 h-96 -top-20 -left-20 opacity-30"
        style={{ background: 'hsl(258 84% 50%)' }}
      />
      <div
        className="glow-blob w-80 h-80 bottom-0 right-0 opacity-20"
        style={{ background: 'hsl(280 70% 50%)' }}
      />
      <div
        className="glow-blob w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10"
        style={{ background: 'hsl(258 84% 60%)' }}
      />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'hsl(228 38% 10%)',
            border: '1px solid hsl(228 30% 18%)',
            boxShadow: '0 25px 60px -15px hsl(258 84% 70% / 0.15)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(258 84% 70%), hsl(280 70% 65%))',
                boxShadow: '0 0 30px hsl(258 84% 70% / 0.4)',
              }}
            >
              <Vault className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold gradient-text tracking-tight">VaultMind</h1>
              <p className="text-sm mt-1.5" style={{ color: 'hsl(220 15% 55%)' }}>
                Your second brain for everything you save online.
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: 'hsl(228 42% 7%)' }}
          >
            {(['signin', 'signup'] as AuthTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200"
                style={
                  tab === t
                    ? {
                        background: 'hsl(258 84% 70%)',
                        color: 'hsl(258 84% 10%)',
                        boxShadow: '0 0 15px hsl(258 84% 70% / 0.3)',
                      }
                    : { color: 'hsl(220 15% 55%)' }
                }
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Auth form */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'hsl(220 15% 65%)' }}>
                Email address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                style={{
                  background: 'hsl(228 42% 7%)',
                  border: '1px solid hsl(228 30% 18%)',
                  color: 'hsl(220 20% 88%)',
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'hsl(220 15% 65%)' }}>
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                  style={{
                    background: 'hsl(228 42% 7%)',
                    border: '1px solid hsl(228 30% 18%)',
                    color: 'hsl(220 20% 88%)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'hsl(220 15% 55%)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full font-semibold btn-glow mt-1"
              style={{ background: 'hsl(258 84% 70%)', color: 'hsl(258 84% 10%)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {tab === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : tab === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'hsl(228 30% 18%)' }} />
            <span className="text-xs" style={{ color: 'hsl(220 15% 45%)' }}>
              or continue with
            </span>
            <div className="flex-1 h-px" style={{ background: 'hsl(228 30% 18%)' }} />
          </div>

          {/* Google auth */}
          <Button
            variant="outline"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading}
            className="w-full h-11 font-medium"
            style={{
              background: 'hsl(228 42% 7%)',
              border: '1px solid hsl(228 30% 18%)',
              color: 'hsl(220 20% 88%)',
            }}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Globe className="w-4 h-4 mr-2" />
            )}
            Continue with Google
          </Button>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: 'hsl(220 15% 40%)' }}>
            By signing in, you agree to our{' '}
            <span className="underline cursor-pointer" style={{ color: 'hsl(258 84% 70%)' }}>
              Terms
            </span>{' '}
            and{' '}
            <span className="underline cursor-pointer" style={{ color: 'hsl(258 84% 70%)' }}>
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </motion.div>
    </div>
  )
}
