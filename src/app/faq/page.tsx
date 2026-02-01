'use client'

import React from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { HelpCircle } from 'lucide-react'

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

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <h1 className="font-manrope font-extrabold text-4xl md:text-5xl mb-4 tracking-tight">Frequently Asked Questions</h1>
                    <p className="text-[var(--text-muted)]">Common questions about Proct's philosophy and features.</p>
                </div>

                <div className="grid gap-6">
                    {FAQS.map((faq, i) => (
                        <div key={i} className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] transition-colors">
                            <h3 className="font-manrope font-bold text-lg text-[var(--text-primary)] mb-3 flex items-start gap-3">
                                <HelpCircle className="text-[var(--text-muted)] mt-1 shrink-0" size={18} />
                                {faq.q}
                            </h3>
                            <p className="text-[var(--text-muted)] text-base leading-relaxed pl-8">
                                {faq.a}
                            </p>
                        </div>
                    ))}
                </div>

            </main>

            <Footer />
        </div>
    )
}
