import { formatCurrency } from '../lib/formatters'
import { brandAssets, brandNarrative } from '../lib/brandAssets'
import { getItemCategoryLabel } from '../lib/catalog'

export default function ShopHero({ featuredItem, onBrowseClick, onFeaturedSelect }) {
  const hasFeaturedImage = Boolean(featuredItem?.image_url)
  const isFeaturedAvailable = Boolean(featuredItem && featuredItem.active && featuredItem.stock > 0)
  const heroImage = featuredItem?.image_url || brandAssets.forgeEmblem
  const featuredCategory = featuredItem ? getItemCategoryLabel(featuredItem.category) : ''

  return (
    <section className="relative overflow-hidden px-4 pb-1 pt-4 sm:px-6 lg:px-8 lg:pb-2 lg:pt-8">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[minmax(0,1.08fr)_430px] lg:items-start">
        <div className="shop-panel-dark relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(195,255,189,0.13),transparent_36%),radial-gradient(circle_at_86%_18%,rgba(160,131,36,0.24),transparent_24%),linear-gradient(160deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="shop-chip shop-chip-dark">AIESEC SHOP</span>
              <span className="shop-chip shop-chip-dark !border-[rgba(160,131,36,0.28)] !text-[var(--color-gold-soft)]">
                {brandNarrative.identity} 26.27
              </span>
            </div>

            <p className="mt-8 shop-kicker shop-kicker-gold">{brandNarrative.tone}</p>

            <div className="mt-4 max-w-3xl">
              <h1 className="font-display text-[clamp(4.4rem,10vw,8rem)] uppercase leading-[0.88] text-white">AIESEC Shop</h1>
              <p className="mt-4 font-crest text-lg uppercase tracking-[0.18em] text-[var(--color-gold-soft)] sm:text-xl">
                Enjoy your AIESEC Experience with us
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onBrowseClick} className="shop-button-primary">
                Browse items
              </button>
              <a href="#reservation-flow" className="shop-button-secondary text-center">
                How to order
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <article className="shop-panel relative flex flex-col overflow-hidden p-3 sm:p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(160,131,36,0.1),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(195,255,189,0.16),transparent_28%)]" />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-[rgba(12,24,18,0.08)] bg-[linear-gradient(180deg,rgba(12,24,18,0.96),rgba(18,35,26,0.86))]">
              <div className="flex items-center justify-between px-4 pt-4">
                <span className="shop-chip shop-chip-dark !py-2">Featured item</span>
                <img src={brandAssets.genBadge} alt="" aria-hidden="true" className="h-7 w-auto opacity-80" />
              </div>

              <div className="relative px-4 pb-4 pt-3">
                <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle,rgba(160,131,36,0.18),transparent_56%)] blur-2xl" aria-hidden="true" />
                <img
                  src={heroImage}
                  alt={featuredItem?.name || 'University collection visual'}
                  className={`w-full ${hasFeaturedImage ? 'aspect-[4/2.8] rounded-[1.35rem] object-cover' : 'aspect-[4/2.8] object-contain px-10 py-6 animate-[shop-float_8s_ease-in-out_infinite]'}`}
                />
              </div>
            </div>

            <div className="relative mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="shop-kicker">Spotlight</p>
                <h2 className="mt-2 text-[1.9rem] font-semibold leading-tight text-[var(--color-ink)]">
                  {featuredItem?.name || 'University selection'}
                </h2>
                {featuredItem ? (
                  <p className="mt-2 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    {featuredCategory} - {featuredItem.active ? 'Published item' : 'Spotlight only'}
                  </p>
                ) : null}
                <p className="mt-2 max-w-sm text-sm leading-5 text-[var(--color-muted)]">
                  {featuredItem
                    ? `${formatCurrency(featuredItem.price)}. ${
                        !featuredItem.active
                          ? 'This spotlight item is currently hidden from the main catalog.'
                          : isFeaturedAvailable
                            ? 'Available to order now.'
                            : 'This spotlight item is currently sold out.'
                      }`
                    : 'Discover the official AIESEC University edit of apparel and member items.'}
                </p>
              </div>

              {isFeaturedAvailable ? (
                <button type="button" onClick={() => onFeaturedSelect(featuredItem)} className="shop-button-primary shrink-0 px-5 py-3">
                  Order
                </button>
              ) : (
                <button type="button" onClick={onBrowseClick} className="shop-button-ghost shrink-0 px-5 py-3">
                  View all
                </button>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
