import { useEffect, useRef, useState } from 'react'
import ProductCard from './ProductCard'

function isInteractiveTarget(target) {
  return Boolean(target?.closest('button, a, input, select, textarea, label'))
}

export default function ProductCarousel({ items, onSelect, label = 'Products', emptyMessage = 'No items in this category yet.' }) {
  const scrollerRef = useRef(null)
  const dragStateRef = useRef({
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    hasDragged: false,
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) {
      return undefined
    }

    function updateScrollMetrics() {
      const maxScrollLeft = Math.max(scroller.scrollWidth - scroller.clientWidth, 0)
      setCanScrollPrev(scroller.scrollLeft > 8)
      setCanScrollNext(scroller.scrollLeft < maxScrollLeft - 8)
      setProgress(maxScrollLeft > 0 ? (scroller.scrollLeft / maxScrollLeft) * 100 : 0)
    }

    updateScrollMetrics()

    scroller.addEventListener('scroll', updateScrollMetrics, { passive: true })
    window.addEventListener('resize', updateScrollMetrics)

    return () => {
      scroller.removeEventListener('scroll', updateScrollMetrics)
      window.removeEventListener('resize', updateScrollMetrics)
    }
  }, [items])

  function getScrollStep() {
    const scroller = scrollerRef.current
    const firstSlide = scroller?.querySelector('[data-carousel-slide]')

    if (!scroller || !firstSlide) {
      return 320
    }

    const slideWidth = firstSlide.getBoundingClientRect().width
    const styles = window.getComputedStyle(scroller)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0')

    return slideWidth + gap
  }

  function scrollByDirection(direction) {
    const scroller = scrollerRef.current
    if (!scroller) {
      return
    }

    scroller.scrollBy({
      left: direction * getScrollStep(),
      behavior: 'smooth',
    })
  }

  function handleWheel(event) {
    const scroller = scrollerRef.current
    if (!scroller) {
      return
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return
    }

    event.preventDefault()
    scroller.scrollLeft += event.deltaY
  }

  function handlePointerDown(event) {
    const scroller = scrollerRef.current
    if (!scroller || event.pointerType === 'touch' || isInteractiveTarget(event.target)) {
      return
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: scroller.scrollLeft,
      hasDragged: false,
    }

    setIsDragging(true)
    scroller.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    const scroller = scrollerRef.current
    const dragState = dragStateRef.current

    if (!scroller || dragState.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - dragState.startX
    if (Math.abs(deltaX) > 6) {
      dragState.hasDragged = true
    }

    scroller.scrollLeft = dragState.startScrollLeft - deltaX
  }

  function handlePointerUp(event) {
    const scroller = scrollerRef.current
    const dragState = dragStateRef.current

    if (!scroller || dragState.pointerId !== event.pointerId) {
      return
    }

    if (scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId)
    }

    dragStateRef.current = {
      pointerId: null,
      startX: 0,
      startScrollLeft: 0,
      hasDragged: false,
    }

    setIsDragging(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollByDirection(1)
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollByDirection(-1)
    }
  }

  return (
    <div className="shop-rail-shell">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="shop-kicker">{label}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Scroll ${label} products left`}
            onClick={() => scrollByDirection(-1)}
            disabled={!canScrollPrev}
            className="shop-rail-nav"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            aria-label={`Scroll ${label} products right`}
            onClick={() => scrollByDirection(1)}
            disabled={!canScrollNext}
            className="shop-rail-nav"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 bg-gradient-to-r from-[rgba(248,251,244,0.94)] to-transparent lg:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 bg-gradient-to-l from-[rgba(248,251,244,0.94)] to-transparent lg:block" />

        <div
          ref={scrollerRef}
          tabIndex={0}
          aria-label={`${label} products`}
          className={`shop-rail ${isDragging ? 'shop-rail-dragging' : ''}`}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} data-carousel-slide className="shop-rail-slide">
                <ProductCard item={item} onSelect={onSelect} />
              </div>
            ))
          ) : (
            <div className="shop-empty-rail" role="status">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="shop-rail-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
          {items.length} item{items.length === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  )
}
