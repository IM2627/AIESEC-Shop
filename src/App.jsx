import { lazy, Suspense } from 'react'
import './index.css'

const PublicShop = lazy(() => import('./components/PublicShop'))

function AppFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="shop-panel w-full max-w-md px-8 py-10 text-center">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-[3px] border-[rgba(12,24,18,0.16)] border-t-[var(--color-gold)]" />
        <p className="mt-5 shop-kicker">AIESEC SHOP</p>
        <p className="mt-3 font-display text-4xl uppercase leading-none text-[var(--color-ink)]">Loading the shop</p>
        <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
          Preparing the official AIESEC University collection.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<AppFallback />}>
      <PublicShop />
    </Suspense>
  )
}
