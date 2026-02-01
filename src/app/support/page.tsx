'use client'

import React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { LifeBuoy, BookOpen, Settings, AlertCircle } from 'lucide-react'

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-5xl">
                <h1 className="font-manrope font-extrabold text-4xl md:text-5xl mb-8 tracking-tight">Support & Assistance</h1>
                <p className="text-xl text-[var(--text-muted)] mb-16 leading-relaxed max-w-2xl">
                    Proct is designed to be simple and reliable, but support is always available for your institution.
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-500">
                            <BookOpen size={24} />
                        </div>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-6">Faculty Support</h2>
                        <ul className="space-y-4 text-[var(--text-muted)]">
                            <li className="flex gap-3"><span className="text-[var(--text-primary)]">→</span> Quiz creation guidance</li>
                            <li className="flex gap-3"><span className="text-[var(--text-primary)]">→</span> Result and grading assistance</li>
                            <li className="flex gap-3"><span className="text-[var(--text-primary)]">→</span> Rule enforcement clarification</li>
                        </ul>
                    </div>

                    <div className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-500">
                            <Settings size={24} />
                        </div>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-6">Admin Support</h2>
                        <ul className="space-y-4 text-[var(--text-muted)]">
                            <li className="flex gap-3"><span className="text-[var(--text-primary)]">→</span> User onboarding</li>
                            <li className="flex gap-3"><span className="text-[var(--text-primary)]">→</span> Subject and faculty assignment</li>
                            <li className="flex gap-3"><span className="text-[var(--text-primary)]">→</span> Audit and reporting help</li>
                        </ul>
                    </div>
                </div>

                <section className="p-8 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 max-w-3xl">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="text-[var(--accent)] shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-[var(--text-primary)] text-lg mb-2">Reporting Issues</h3>
                            <p className="text-[var(--text-muted)] text-sm mb-4">
                                If you encounter access problems, loading issues, or unexpected behavior, please contact your institutional administrator or reach out to us.
                            </p>
                            <Link href="/contact">
                                <button className="text-sm font-medium text-[var(--text-primary)] border-b border-[var(--accent)] pb-0.5 hover:text-[var(--accent)] transition-colors">
                                    Contact Support Team &rarr;
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    )
}
