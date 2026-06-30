const steps = [
  {
    title: 'Choose your item',
    description: 'Browse the collection, check the price, and place your order quickly.',
  },
  {
    title: 'Complete your order',
    description: 'Add your name, position, quantity, phone number, and preferred delivery deadline.',
  },
  {
    title: 'Receive confirmation',
    description: 'Once your order is saved, the team will follow up to arrange delivery or handoff.',
  },
]

export default function ShopHighlights() {
  return (
    <section
      id="reservation-flow"
      className="px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10"
      aria-labelledby="reservation-flow-title"
    >
      <div className="shop-panel mx-auto max-w-7xl p-6 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="shop-kicker">How to order</p>
          <h2 id="reservation-flow-title" className="mt-3 font-display text-5xl uppercase leading-[0.9] text-[var(--color-ink)] sm:text-6xl">
            Clear and effortless
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
            Everything is designed so members can reserve an item easily on mobile, tablet, or desktop.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-[1.45rem] border border-[rgba(12,24,18,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,252,240,0.9))] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(7,20,13,0.1)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-night)] text-sm font-bold text-white">
                0{index + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[var(--color-ink)]">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
