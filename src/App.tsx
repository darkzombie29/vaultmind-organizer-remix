import React from 'react'
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  redirect,
} from '@tanstack/react-router'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

const PROCESS_URL_FUNCTION_URL = 'https://2skgwfqb--process-url.functions.blink.new'

// ── Root route ──────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: Root,
})

function Root() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'hsl(228 42% 7%)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{
              border: '3px solid hsl(258 84% 70% / 0.2)',
              borderTop: '3px solid hsl(258 84% 70%)',
            }}
          />
          <p className="text-sm" style={{ color: 'hsl(220 15% 45%)' }}>
            Loading VaultMind...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <DashboardPage user={user} processUrlFunctionUrl={PROCESS_URL_FUNCTION_URL} />
}

// ── Index route (/) ──────────────────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Root,
})

// ── Dashboard route (/dashboard) ─────────────────────────────────────────────
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Root,
})

// ── Router ────────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([indexRoute, dashboardRoute])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}
