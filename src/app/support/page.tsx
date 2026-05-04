import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/landing/Navbar'

export const metadata: Metadata = {
  title: 'Support | Proct Platform Assistance',
  description: 'Get support for Proct — guidance for faculty quiz operations, admin system setup, and critical incident response.',
}
import { Footer } from '@/components/landing/Footer'
import { BookOpen, Settings, AlertCircle } from 'lucide-react'

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Brutalist Hero */}
                <section className="container mx-auto px-6 max-w-[1600px] pb-20 border-b border-[var(--border-subtle)]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-mono font-bold tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 bg-white rounded-none" />
                        Assistance
                    </div>
                    <h1 className="font-jakarta font-black text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-tighter text-[var(--text-primary)] mb-6 uppercase">
                        Support.
                    </h1>
                    <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-3xl font-mono tracking-tight leading-relaxed">
                        Official guidance for faculty quiz operations, admin system setup, and critical incident response.
                    </p>
                </section>

                <div className="container mx-auto px-6 max-w-[1600px] py-12">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Left Column */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-32">
                                <h2 className="font-jakarta font-black text-3xl md:text-4xl tracking-tighter uppercase mb-6">
                                    Operator<br/>Guidance
                                </h2>
                                <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed border-l border-[var(--accent)] pl-4">
                                    Proct is designed to be purely functional and reliable. Official support lines are open for institutional deployment.
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Content Grid */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="grid sm:grid-cols-2 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)]">
                                <div className="bg-[var(--bg-primary)] p-8 hover:bg-[var(--bg-secondary)] transition-colors">
                                    <div className="font-mono text-xs text-[var(--accent)] mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen size={14} /> Faculty
                                    </div>
                                    <h3 className="font-jakarta font-bold text-xl uppercase tracking-tight mb-3">Quiz Ops</h3>
                                    <ul className="space-y-4 font-mono text-sm text-[var(--text-muted)]">
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Quiz creation guidance</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Grading matrix assistance</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Rule enforcement logic</li>
                                    </ul>
                                </div>

                                <div className="bg-[var(--bg-primary)] p-8 hover:bg-[var(--bg-secondary)] transition-colors">
                                    <div className="font-mono text-xs text-[var(--accent)] mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <Settings size={14} /> Admin
                                    </div>
                                    <h3 className="font-jakarta font-bold text-xl uppercase tracking-tight mb-3">System Ops</h3>
                                    <ul className="space-y-4 font-mono text-sm text-[var(--text-muted)]">
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Root access onboarding</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Department routing</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Security auditing & reports</li>
                                    </ul>
                                </div>
                            </div>

                            <section className="p-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <AlertCircle className="text-[var(--accent)] shrink-0 mt-1" size={20} />
                                        <div>
                                            <h3 className="font-jakarta font-bold text-xl text-[var(--text-primary)] uppercase tracking-tight mb-3">System Faults</h3>
                                            <p className="font-mono text-[var(--text-muted)] text-sm max-w-md">
                                                For critical downtime, access restrictions, or suspected compromises, engage technical support immediately.
                                            </p>
                                        </div>
                                    </div>
                                    <Link href="/contact" className="w-full md:w-auto">
                                        <button className="w-full bg-[var(--text-primary)] hover:bg-[var(--accent)] text-[var(--bg-primary)] hover:text-white px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-colors">
                                            Engage Support
                                        </button>
                                    </Link>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    )
}
