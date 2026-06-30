import { brandAssets } from '../lib/brandAssets'

export default function FinalBanner() {
  return (
    <section className="px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8" aria-label="Final brand banner">
      <div className="mx-auto max-w-5xl">
        <aside className="shop-panel-dark relative overflow-hidden p-3 sm:p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(195,255,189,0.1),transparent_32%),radial-gradient(circle_at_85%_12%,rgba(160,131,36,0.18),transparent_28%)]" />
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/8 bg-[rgba(255,255,255,0.03)]">
            <img
              src={brandAssets.missionBanner}
              alt="One LC. One People. One Mission."
              className="w-full object-contain"
            />
          </div>
        </aside>
      </div>
    </section>
  )
}
