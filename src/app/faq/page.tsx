import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'FAQ | Proct — Common Questions Answered',
  description: 'Answers to common questions about Proct\'s assessment platform, privacy approach, device support, and academic integrity features.',
}

const FAQS = [
    {
        q: "Is Proct an exam proctoring tool?",
        a: "No. Proct is designed for internal assessments, not high-stakes examinations. It focuses on fair flow rather than surveillance."
    },
    {
        q: "Does Proct use webcams or AI monitoring?",
        a: "No. Proct does not use webcams, microphones, or AI behavior analysis. We respect student privacy."
    },
    {
        q: "Can students cheat using AI tools?",
        a: "Proct significantly reduces misuse by using short per-question timers and a one-way flow. While no system is cheat-proof, Proct makes misuse impractical."
    },
    {
        q: "What devices are supported?",
        a: "Proct works on mobile phones, tablets, and laptops directly in the browser. No app installation is required."
    },
    {
        q: "Can faculty reuse questions?",
        a: "Yes. Faculty can manage question pools per subject."
    },
    {
        q: "Who controls user accounts?",
        a: "Accounts are managed centrally by the institution's administrators."
    }
]

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Brutalist Hero */}
                <section className="container mx-auto px-6 max-w-[1600px] pb-20 border-b border-[var(--border-subtle)]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-mono font-bold tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 bg-white rounded-none" />
                        Inquiries
                    </div>
                    <h1 className="font-jakarta font-black text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-tighter text-[var(--text-primary)] mb-6 uppercase">
                        FAQ.
                    </h1>
                </section>

                <div className="container mx-auto px-6 max-w-[1600px] py-12">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Left Column */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-32">
                                <h2 className="font-jakarta font-black text-3xl md:text-4xl tracking-tighter uppercase mb-6">
                                    Knowledge<br/>Base
                                </h2>
                                <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed border-l border-[var(--accent)] pl-4">
                                    Common inquiries regarding system capabilities, privacy parameters, and structural constraints.
                                </p>
                            </div>
                        </div>

                        {/* Right Column - FAQ Grid */}
                        <div className="lg:col-span-8">
                            <div className="border-t border-[var(--border-subtle)]">
                                {FAQS.map((faq, i) => (
                                    <div key={i} className="py-8 border-b border-[var(--border-subtle)] group">
                                        <div className="flex items-start gap-6">
                                            <div className="font-mono text-xs font-bold text-[var(--text-muted)] mt-1.5">
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                            <div>
                                                <h3 className="font-jakarta font-bold text-xl md:text-2xl text-[var(--text-primary)] mb-4 uppercase tracking-tight group-hover:text-[var(--accent)] transition-colors">
                                                    {faq.q}
                                                </h3>
                                                <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed max-w-2xl">
                                                    {faq.a}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
