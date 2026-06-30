import { useEffect, useMemo, useState } from 'react'
import { ITEM_CATEGORIES } from '../lib/catalog'
import { isMissingItemSchemaField } from '../lib/itemSchema'
import { supabase } from '../lib/supabase'
import FinalBanner from './FinalBanner'
import ProductCarousel from './ProductCarousel'
import ReservationForm from './ReservationForm'
import ShopHero from './ShopHero'
import ShopHighlights from './ShopHighlights'

function LoadingCard() {
  return (
    <div className="shop-card overflow-hidden p-3">
      <div className="aspect-[4/4.35] animate-pulse rounded-[1.35rem] bg-[rgba(12,24,18,0.08)]" />
      <div className="space-y-3 px-1 pb-1 pt-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-[rgba(12,24,18,0.08)]" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-[rgba(12,24,18,0.06)]" />
        <div className="mt-5 flex items-center justify-between">
          <div className="h-6 w-24 animate-pulse rounded-full bg-[rgba(12,24,18,0.08)]" />
          <div className="h-11 w-28 animate-pulse rounded-full bg-[rgba(12,24,18,0.08)]" />
        </div>
      </div>
    </div>
  )
}

function LoadingCarousel({ label = 'Products' }) {
  return (
    <div className="shop-rail-shell mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="shop-kicker">{label}</div>
        <div className="flex items-center gap-2">
          <div className="h-11 w-11 animate-pulse rounded-full bg-[rgba(12,24,18,0.08)]" />
          <div className="h-11 w-11 animate-pulse rounded-full bg-[rgba(12,24,18,0.08)]" />
        </div>
      </div>

      <div className="shop-rail">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="shop-rail-slide">
            <LoadingCard />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PublicShop() {
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [legacyCatalogMode, setLegacyCatalogMode] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let active = true

    async function loadItems() {
      setLoading(true)
      setError('')

      if (!supabase) {
        setItems([])
        setError('The shop is currently being configured. Please try again shortly.')
        setLoading(false)
        return
      }

      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error('The shop database is taking too long to respond. Please try again.')),
            10000,
          )
        })

        let data

        try {
          const request = supabase
            .from('items')
            .select('*')
            .or('active.eq.true,is_spotlight.eq.true')
            .order('is_spotlight', { ascending: false })
            .order('created_at', { ascending: false })

          const response = await Promise.race([request, timeoutPromise])

          if (response.error) {
            throw response.error
          }

          data = response.data || []
          if (active) {
            setLegacyCatalogMode(false)
          }
        } catch (schemaError) {
          if (!isMissingItemSchemaField(schemaError)) {
            throw schemaError
          }

          const fallbackRequest = supabase
            .from('items')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false })

          const fallbackResponse = await Promise.race([fallbackRequest, timeoutPromise])

          if (fallbackResponse.error) {
            throw fallbackResponse.error
          }

          data = (fallbackResponse.data || []).map((item) => ({
            ...item,
            is_spotlight: false,
            category: item.category || '',
          }))

          if (active) {
            setLegacyCatalogMode(true)
          }
        }

        if (active) {
          setItems(data || [])
        }
      } catch (fetchError) {
        if (active) {
          setItems([])
          const msg = fetchError?.message || ''
          const isNetworkError =
            !msg ||
            msg.toLowerCase().includes('failed to fetch') ||
            msg.toLowerCase().includes('networkerror') ||
            msg.toLowerCase().includes('network request failed') ||
            msg.toLowerCase().includes('load failed')
          setError(
            isNetworkError
              ? 'Unable to reach the shop database. Please check your connection and try again.'
              : msg || 'Unable to load the collection right now.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadItems()

    if (!supabase) {
      return () => {
        active = false
      }
    }

    const channel = supabase
      .channel('shop-items-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        loadItems()
      })
      .subscribe()

    return () => {
      active = false
      channel.unsubscribe()
    }
  }, [refreshTick])

  const catalogItems = useMemo(
    () => items.filter((item) => item.active),
    [items],
  )

  const featuredItem = useMemo(
    () =>
      items.find((item) => item.is_spotlight) ||
      catalogItems.find((item) => item.stock > 0 && item.image_url) ||
      catalogItems.find((item) => item.image_url) ||
      catalogItems[0] ||
      null,
    [catalogItems, items],
  )

  const categoryGroups = useMemo(
    () =>
      ITEM_CATEGORIES.map((category) => ({
        category,
        items: catalogItems.filter((item) => item.category === category),
      })),
    [catalogItems],
  )

  const itemCount = catalogItems.length

  const hasCategoryData = useMemo(
    () => catalogItems.some((item) => ITEM_CATEGORIES.includes(item.category)),
    [catalogItems],
  )

  function scrollToCatalog() {
    document.getElementById('product-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="shop-shell min-h-screen text-[var(--color-ink)]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(8,17,13,0.54),transparent_68%)]" />
        <div className="absolute left-[-12rem] top-28 h-80 w-80 rounded-full bg-[rgba(195,255,189,0.24)] blur-3xl" />
        <div className="absolute right-[-10rem] top-[24rem] h-[28rem] w-[28rem] rounded-full bg-[rgba(160,131,36,0.18)] blur-3xl" />
      </div>

      <main className="pb-16">
        <ShopHero
          featuredItem={featuredItem}
          onBrowseClick={scrollToCatalog}
          onFeaturedSelect={setSelectedItem}
        />

        <section id="product-catalog" className="px-4 pb-8 pt-1 sm:px-6 lg:px-8 lg:pb-12 lg:pt-2" aria-labelledby="catalog-title">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="shop-kicker">Collection</p>
                <h2 id="catalog-title" className="mt-3 font-display text-5xl uppercase leading-[0.9] text-[var(--color-ink)] sm:text-6xl">
                  {hasCategoryData ? 'Browse by category' : 'Our items'}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                  {hasCategoryData
                    ? 'Explore the official collection by category, compare items, and reserve what you need.'
                    : 'Explore the official collection, compare items, and reserve what you need.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="shop-chip">{itemCount} active item{itemCount === 1 ? '' : 's'}</div>
              </div>
            </div>

            {legacyCatalogMode ? (
              <div className="shop-panel mt-8 border-[rgba(160,131,36,0.16)] bg-[rgba(255,251,242,0.94)] p-5">
                <p className="shop-kicker !text-[var(--color-gold)]">Catalog compatibility mode</p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-ink-soft)]">
                  The latest category and spotlight database updates have not been applied yet, so the shop is temporarily showing the classic catalog view.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="mt-8 space-y-5">
                {ITEM_CATEGORIES.map((category) => (
                  <LoadingCarousel key={category} label={category} />
                ))}
              </div>
            ) : error ? (
              <div className="shop-panel mt-8 border-[rgba(143,31,29,0.12)] bg-[rgba(255,244,242,0.92)] p-6">
                <p className="shop-kicker !text-[var(--color-ruby)]">Shop unavailable</p>
                <p className="mt-3 text-base leading-7 text-[var(--color-ruby)]">{error}</p>
                <button
                  onClick={() => setRefreshTick((t) => t + 1)}
                  className="shop-button-ghost mt-5 text-sm"
                >
                  Try again
                </button>
              </div>
            ) : catalogItems.length === 0 ? (
              <div className="shop-panel mt-8 p-6">
                <p className="shop-kicker">No items yet</p>
                <p className="mt-3 text-base leading-7 text-[var(--color-ink-soft)]">
                  The collection will appear here as soon as items are published.
                </p>
              </div>
            ) : !hasCategoryData ? (
              <div className="mt-8">
                <ProductCarousel items={catalogItems} onSelect={setSelectedItem} label="All items" />
              </div>
            ) : (
              <div className="mt-8 space-y-5">
                {categoryGroups.map(({ category, items: categoryItems }) => (
                  <ProductCarousel
                    key={category}
                    items={categoryItems}
                    onSelect={setSelectedItem}
                    label={category}
                    emptyMessage={`No ${category.toLowerCase()} published yet.`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <ShopHighlights />
        <FinalBanner />
      </main>

      <footer className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="shop-panel-dark mx-auto max-w-7xl px-6 py-6 text-sm text-white/66">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-white">Official AIESEC University shop</p>
            <p>Presented by F&amp;L Department, Developed by TM&amp;IM Department, Mohamed Kallel 2026</p>
          </div>
        </div>
      </footer>

      {selectedItem ? (
        <ReservationForm
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => {
            setSelectedItem(null)
            setRefreshTick((currentValue) => currentValue + 1)
          }}
        />
      ) : null}
    </div>
  )
}
