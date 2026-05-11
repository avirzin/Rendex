import { Header } from '@/components/Header'
import { PoolStats } from '@/components/PoolStats'
import { PerformanceChart } from '@/components/PerformanceChart'
import { InvestorPosition } from '@/components/InvestorPosition'
import { AdminPanel } from '@/components/AdminPanel'

export default function Home() {
  return (
    <div className="bg-neutral-50 min-h-screen">
      <Header />

      <main className="pt-24 pb-16 max-w-6xl mx-auto px-8">

        <section className="text-center mb-12">
          <h2 className="text-4xl text-neutral-900 mb-3">Rendex</h2>
          <p className="text-lg text-neutral-600 mb-2">A simulated on-chain investment pool yielding 120% of CDI.</p>
          <p className="text-sm text-neutral-400">Educational simulation. No real funds.</p>
        </section>

        <section className="mb-8">
          <PoolStats />
        </section>

        <section className="mb-8">
          <PerformanceChart />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <InvestorPosition />
          <AdminPanel />
        </section>

      </main>

      <footer className="bg-white border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-8 py-8 text-center text-sm text-neutral-400">
          <p>© {new Date().getFullYear()} Rendex. Educational simulation. No real funds.</p>
          <p className="mt-1">Built as an Alchemy University Capstone Project.</p>
        </div>
      </footer>
    </div>
  )
}
