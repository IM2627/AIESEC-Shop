import { useEffect, useMemo, useRef, useState } from 'react'
import { formatCurrency, formatDateLabel, getTodayIsoDate } from '../lib/formatters'
import { submitReservation } from '../lib/reservationService'
import { brandAssets } from '../lib/brandAssets'

const initialFormState = {
  name: '',
  position: '',
  size: '',
  quantity: '1',
  phoneNumber: '',
  maximumDeliveryDate: '',
}

const positionOptions = ['LCP', 'LCVP', 'Team Leader', 'Middle Manager', 'Oldie', 'Newbie']
const sizeOptions = ['S', 'M', 'L', 'XL']
const sizeRequiredCategories = new Set(['T-shirts', 'Hoodies'])

function itemRequiresSize(item) {
  return sizeRequiredCategories.has(item?.category)
}

function validateReservation(values, item) {
  const errors = {}
  const quantity = Number.parseInt(values.quantity, 10)
  const today = getTodayIsoDate()
  const requiresSize = itemRequiresSize(item)

  if (!values.name.trim()) {
    errors.name = 'Please enter your name.'
  }

  if (!positionOptions.includes(values.position)) {
    errors.position = 'Please select your position.'
  }

  if (requiresSize && !sizeOptions.includes(values.size)) {
    errors.size = 'Please select a size.'
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = 'Quantity must be at least 1.'
  } else if (quantity > item.stock) {
    errors.quantity = 'The requested quantity is currently unavailable. Please choose a smaller quantity.'
  }

  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = 'Please enter your phone number.'
  } else if (values.phoneNumber.replace(/[^\d+]/g, '').length < 8) {
    errors.phoneNumber = 'Please enter a valid phone number.'
  }

  if (!values.maximumDeliveryDate) {
    errors.maximumDeliveryDate = 'Please choose your latest delivery date.'
  } else if (values.maximumDeliveryDate < today) {
    errors.maximumDeliveryDate = 'The latest delivery date must be today or later.'
  }

  return errors
}

export default function ReservationForm({ item, onClose, onSuccess }) {
  const nameInputRef = useRef(null)
  const closeTimeoutRef = useRef(null)
  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !loading) {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    window.setTimeout(() => {
      nameInputRef.current?.focus()
    }, 30)

    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current)
      }

      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [loading, onClose])

  const quantity = Number.parseInt(formData.quantity, 10) || 0
  const totalPrice = useMemo(() => Number(item.price || 0) * quantity, [item.price, quantity])
  const minimumDate = getTodayIsoDate()
  const requiresSize = itemRequiresSize(item)

  function getFieldErrors(nextValues) {
    return validateReservation(nextValues, item)
  }

  function updateField(field, value) {
    const nextData = { ...formData, [field]: value }
    setFormData(nextData)
    setSubmitError('')

    if (touched[field]) {
      setErrors(getFieldErrors(nextData))
    }
  }

  function markFieldTouched(field) {
    setTouched((current) => ({ ...current, [field]: true }))
    setErrors(getFieldErrors(formData))
  }

  function selectSize(size) {
    const nextData = { ...formData, size }
    setFormData(nextData)
    setSubmitError('')
    setTouched((current) => ({ ...current, size: true }))
    setErrors(getFieldErrors(nextData))
  }

  function updateQuantity(nextQuantity) {
    const safeQuantity = String(Math.max(1, nextQuantity))
    updateField('quantity', safeQuantity)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = getFieldErrors(formData)
    setTouched({
      name: true,
      position: true,
      size: true,
      quantity: true,
      phoneNumber: true,
      maximumDeliveryDate: true,
    })
    setErrors(nextErrors)
    setSubmitError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoading(true)

    try {
      await submitReservation({
        itemId: item.id,
        name: formData.name.trim(),
        position: formData.position.trim(),
        size: requiresSize ? formData.size : '',
        quantity,
        phoneNumber: formData.phoneNumber.trim(),
        maximumDeliveryDate: formData.maximumDeliveryDate,
      })

      setSuccessMessage(
        `Your order for ${item.name}${requiresSize ? ` in size ${formData.size}` : ''} has been recorded. The team will contact you on your phone number before ${formatDateLabel(formData.maximumDeliveryDate)}.`,
      )

      closeTimeoutRef.current = window.setTimeout(() => {
        onSuccess()
      }, 1600)
    } catch (error) {
      setSubmitError(error.message || 'Unable to save your order right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(3,7,5,0.76)] p-3 backdrop-blur-md sm:p-6">
      <button
        type="button"
        aria-label="Close reservation form"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!loading) {
            onClose()
          }
        }}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-title"
        className="relative z-10 mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--color-parchment)] shadow-[0_36px_100px_rgba(4,12,8,0.4)] animate-[shop-rise_320ms_ease-out]"
      >
        <div className="grid h-full flex-1 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative overflow-hidden border-b border-[rgba(12,24,18,0.08)] bg-[linear-gradient(160deg,rgba(7,13,10,0.98),rgba(18,34,26,0.94))] p-5 text-white sm:p-7 lg:border-b-0 lg:border-r lg:border-r-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(195,255,189,0.12),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(160,131,36,0.22),transparent_24%)]" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="shop-kicker shop-kicker-gold">Order</p>
                  <h2 id="reservation-title" className="mt-3 font-display text-5xl uppercase leading-[0.88] text-white sm:text-6xl">
                    Place your order
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/8 text-lg text-white transition hover:bg-white/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
                >
                  X
                </button>
              </div>

              <p className="mt-4 max-w-md text-sm leading-6 text-white/72">
                Review your item, add your details, and confirm your order in seconds.
              </p>
            </div>

            <div className="relative mt-8 overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
              <div className="aspect-[5/4] bg-[rgba(255,255,255,0.04)]">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="relative flex h-full items-center justify-center bg-[linear-gradient(160deg,rgba(10,18,14,0.98),rgba(23,40,31,0.92))]">
                    <img
                      src={brandAssets.universityCrest}
                      alt=""
                      aria-hidden="true"
                      className="absolute right-5 top-5 h-16 w-16 object-contain opacity-[0.16]"
                    />
                    <img
                      src={brandAssets.forgeEmblem}
                      alt=""
                      aria-hidden="true"
                      className="absolute bottom-2 right-2 h-32 w-32 object-contain opacity-[0.2]"
                    />
                    <div className="relative text-center">
                      <span className="font-display text-6xl uppercase leading-none text-[var(--color-gold-soft)]">
                        {String(item.name || '')
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((segment) => segment.charAt(0).toUpperCase())
                          .join('') || 'UN'}
                      </span>
                      <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/54">Visual coming soon</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white/52">Selected item</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/66">
                    {item.description || 'Official AIESEC University item available to order.'}
                  </p>
                </div>

                <dl className="space-y-3 rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <dt className="text-white/56">Unit price</dt>
                    <dd className="font-bold text-white">{formatCurrency(item.price)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <dt className="text-white/56">Estimated total</dt>
                    <dd className="font-bold text-white">{formatCurrency(totalPrice)}</dd>
                  </div>
                </dl>

                <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-white/52">Order handoff</p>
                  <p className="mt-3 text-sm leading-6 text-white/72">
                    Your phone number and latest delivery date help us organise the handoff of your item.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="shop-scroll-area overflow-y-auto p-5 sm:p-7">
            {successMessage ? (
              <div className="flex min-h-full flex-col items-start justify-center rounded-[1.8rem] border border-[rgba(160,131,36,0.16)] bg-white/76 p-6 shadow-[0_18px_36px_rgba(7,20,13,0.08)]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gold)] text-[var(--color-night)] animate-[shop-pulse_2s_infinite]">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-[2.5]">
                    <path d="M5 12.5 9.5 17 19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mt-6 shop-kicker">Order saved</p>
                <h3 className="mt-3 font-display text-5xl uppercase leading-[0.9] text-[var(--color-ink)]">Thank you</h3>
                <p className="mt-4 max-w-md text-sm leading-7 text-[var(--color-ink-soft)]">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <p className="shop-kicker">Your details</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">Complete your order</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
                    Fill in the requested details so the team can confirm and prepare your order.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="reservation-name" className="shop-label">
                      Full name
                    </label>
                    <input
                      ref={nameInputRef}
                      id="reservation-name"
                      type="text"
                      value={formData.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      onBlur={() => markFieldTouched('name')}
                      className={`shop-input ${errors.name ? 'shop-input-error' : ''}`}
                      placeholder="Your full name"
                      disabled={loading}
                      aria-invalid={Boolean(touched.name && errors.name)}
                    />
                    {touched.name && errors.name ? <p className="shop-field-error">{errors.name}</p> : null}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="reservation-position" className="shop-label">
                      Position
                    </label>
                    <select
                      id="reservation-position"
                      value={formData.position}
                      onChange={(event) => updateField('position', event.target.value)}
                      onBlur={() => markFieldTouched('position')}
                      className={`shop-input shop-select ${errors.position ? 'shop-input-error' : ''}`}
                      disabled={loading}
                      aria-invalid={Boolean(touched.position && errors.position)}
                      aria-describedby={touched.position && errors.position ? 'reservation-position-error' : undefined}
                    >
                      <option value="" disabled>
                        Select your position
                      </option>
                      {positionOptions.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                    {touched.position && errors.position ? (
                      <p id="reservation-position-error" className="shop-field-error">
                        {errors.position}
                      </p>
                    ) : null}
                  </div>

                  {requiresSize ? (
                    <div className="sm:col-span-2">
                      <span className="shop-label">Size</span>
                      <div
                        className={`flex flex-wrap gap-2 rounded-[1.4rem] border p-3 ${
                          touched.size && errors.size
                            ? 'border-[rgba(143,31,29,0.28)] bg-[rgba(255,244,242,0.95)]'
                            : 'border-[rgba(12,24,18,0.08)] bg-white/72'
                        }`}
                        role="radiogroup"
                        aria-labelledby="reservation-size-label"
                        aria-describedby={touched.size && errors.size ? 'reservation-size-error' : undefined}
                      >
                        <span id="reservation-size-label" className="sr-only">
                          Size
                        </span>
                        {sizeOptions.map((size) => {
                          const isSelected = formData.size === size

                          return (
                            <button
                              key={size}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => selectSize(size)}
                              className={`shop-size-chip ${isSelected ? 'shop-size-chip-active' : ''}`}
                              disabled={loading}
                            >
                              {size}
                            </button>
                          )
                        })}
                      </div>
                      {touched.size && errors.size ? (
                        <p id="reservation-size-error" className="shop-field-error">
                          {errors.size}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor="reservation-quantity" className="shop-label">
                      Quantity
                    </label>
                    <div
                      className={`rounded-[1.3rem] border bg-white/86 p-2 ${
                        touched.quantity && errors.quantity
                          ? 'border-[rgba(143,31,29,0.28)] bg-[rgba(255,244,242,0.95)]'
                          : 'border-[rgba(12,24,18,0.1)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(quantity - 1)}
                          disabled={loading || quantity <= 1}
                          className="shop-quantity-button"
                        >
                          -
                        </button>
                        <input
                          id="reservation-quantity"
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(event) => updateField('quantity', event.target.value)}
                          onBlur={() => markFieldTouched('quantity')}
                          className="w-full border-0 bg-transparent px-2 py-2 text-center text-lg font-semibold text-[var(--color-ink)] outline-none"
                          disabled={loading}
                          aria-invalid={Boolean(touched.quantity && errors.quantity)}
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(quantity + 1)}
                          disabled={loading}
                          className="shop-quantity-button"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {touched.quantity && errors.quantity ? <p className="shop-field-error">{errors.quantity}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="reservation-phone" className="shop-label">
                      Phone number
                    </label>
                    <input
                      id="reservation-phone"
                      type="tel"
                      inputMode="tel"
                      value={formData.phoneNumber}
                      onChange={(event) => updateField('phoneNumber', event.target.value)}
                      onBlur={() => markFieldTouched('phoneNumber')}
                      className={`shop-input ${errors.phoneNumber ? 'shop-input-error' : ''}`}
                      placeholder="+216 12 345 678"
                      disabled={loading}
                      aria-invalid={Boolean(touched.phoneNumber && errors.phoneNumber)}
                    />
                    {touched.phoneNumber && errors.phoneNumber ? <p className="shop-field-error">{errors.phoneNumber}</p> : null}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="reservation-date" className="shop-label">
                      Latest delivery date
                    </label>
                    <input
                      id="reservation-date"
                      type="date"
                      min={minimumDate}
                      value={formData.maximumDeliveryDate}
                      onChange={(event) => updateField('maximumDeliveryDate', event.target.value)}
                      onBlur={() => markFieldTouched('maximumDeliveryDate')}
                      className={`shop-input ${errors.maximumDeliveryDate ? 'shop-input-error' : ''}`}
                      disabled={loading}
                      aria-invalid={Boolean(touched.maximumDeliveryDate && errors.maximumDeliveryDate)}
                    />
                    <p className="mt-2 shop-helper">
                      Choose the latest date that works for you. The team will coordinate around this deadline.
                    </p>
                    {touched.maximumDeliveryDate && errors.maximumDeliveryDate ? (
                      <p className="shop-field-error">{errors.maximumDeliveryDate}</p>
                    ) : null}
                  </div>
                </div>

                {submitError ? (
                  <div className="rounded-[1.3rem] border border-[rgba(143,31,29,0.18)] bg-[rgba(255,244,242,0.95)] px-4 py-3 text-sm leading-6 text-[var(--color-ruby)]" aria-live="polite">
                    {submitError}
                  </div>
                ) : null}

                <div className="rounded-[1.5rem] border border-[rgba(12,24,18,0.08)] bg-white/80 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">Total</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--color-ink)]">{formatCurrency(totalPrice)}</p>
                    </div>
                    <p className="max-w-xs text-sm leading-6 text-[var(--color-muted)]">
                      After you place your order, the team will contact you on your phone number to confirm the next steps.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={onClose} className="shop-button-ghost" disabled={loading}>
                    Back
                  </button>
                  <button type="submit" className="shop-button-primary min-w-[9rem]" disabled={loading}>
                    {loading ? 'Ordering...' : 'Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
