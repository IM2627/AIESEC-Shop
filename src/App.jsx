import { lazy, Suspense } from 'react'
import './index.css'

// Lazy load PublicShop component for better performance
const PublicShop = lazy(() => import('./components/PublicShop'))

export default function App() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aiesec-blue to-aiesec-teal">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
            <p className="text-white mt-4 text-lg">Loading AIESEC Shop...</p>
          </div>
        </div>
      }
    >
      <PublicShop />
    </Suspense>
  )
}
