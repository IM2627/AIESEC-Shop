import { formatCurrency, getInitials } from '../lib/formatters'
import { getItemCategoryLabel } from '../lib/catalog'
import { brandAssets } from '../lib/brandAssets'

const sizedCategories = new Set(['T-shirts', 'Hoodies'])

function ProductPlaceholder({ name }) {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[linear-gradient(160deg,rgba(8,17,13,0.98),rgba(18,35,26,0.92))] text-[var(--color-gold-soft)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(195,255,189,0.18),transparent_44%),radial-gradient(circle_at_bottom,rgba(160,131,36,0.22),transparent_40%)]" />
      <img
        src={brandAssets.universityCrest}
        alt=""
        aria-hidden="true"
        className="absolute right-4 top-4 h-16 w-16 object-contain opacity-[0.16]"
      />
      <div className="relative flex flex-col items-center justify-center">
        <span className="font-display text-6xl uppercase leading-none">{getInitials(name) || 'UN'}</span>
        <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/54">Visual coming soon</p>
      </div>
    </div>
  )
}

export default function ProductCard({ item, onSelect }) {
  const isAvailable = item.stock > 0
  const categoryLabel = getItemCategoryLabel(item.category)
  const showsSizes = sizedCategories.has(item.category)

  return (
    <article className="shop-card group flex h-full flex-col overflow-hidden p-3">
      <div className="relative aspect-[4/4.35] overflow-hidden rounded-[1.35rem] border border-[rgba(12,24,18,0.08)] bg-[rgba(236,248,233,0.92)]">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <ProductPlaceholder name={item.name} />
        )}

        <div
          className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] ${
            isAvailable
              ? 'border-[rgba(255,255,255,0.72)] bg-white/84 text-[var(--color-ink-soft)]'
              : 'border-[rgba(143,31,29,0.16)] bg-[rgba(255,244,242,0.92)] text-[var(--color-ruby)]'
          }`}
        >
          {isAvailable ? 'Available' : 'Sold out'}
        </div>

        <div className="absolute right-3 top-3 rounded-full border border-[rgba(12,24,18,0.08)] bg-[rgba(251,248,239,0.92)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          {categoryLabel}
        </div>
      </div>

        <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[1.04rem] font-semibold leading-snug text-[var(--color-ink)]">{item.name}</h3>
              <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                {categoryLabel} - {isAvailable ? 'Available now' : 'Currently unavailable'}
              </p>
              {showsSizes ? (
                <p className="mt-2 text-sm font-medium text-[var(--color-ink-soft)]">Sizes: S • M • L • XL</p>
              ) : null}
            </div>
            <img src={brandAssets.universityCrest} alt="" aria-hidden="true" className="h-10 w-10 shrink-0 object-contain opacity-60" />
          </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">Price</p>
            <p className="mt-1 text-xl font-bold text-[var(--color-ink)]">{formatCurrency(item.price)}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(item)}
            disabled={!isAvailable}
            className="shop-button-primary min-w-[7.4rem] px-4 py-2.5 text-sm disabled:border-[rgba(12,24,18,0.08)] disabled:bg-[rgba(12,24,18,0.08)] disabled:text-[rgba(12,24,18,0.42)] disabled:shadow-none"
          >
            Order
          </button>
        </div>
      </div>
    </article>
  )
}
