import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'

export const metadata: Metadata = {
  title: 'Contact Proct | Get in Touch with Triada',
  description: 'Reach out to the Proct team for institutional deployment, sales inquiries, or general questions about the platform.',
}
import { Footer } from '@/components/landing/Footer'
import { Mail, MessageSquare } from 'lucide-react'

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Brutalist Hero */}
                <section className="container mx-auto px-6 max-w-[1600px] pb-20 border-b border-[var(--border-subtle)]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-mono font-bold tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 bg-white rounded-none" />
                        Communications
                    </div>
                    <h1 className="font-jakarta font-black text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-tighter text-[var(--text-primary)] mb-6 uppercase">
                        Contact.
                    </h1>
                </section>

                <div className="container mx-auto px-6 max-w-[1600px] py-12">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Left Column */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-32">
                                <h2 className="font-jakarta font-black text-3xl md:text-4xl tracking-tighter uppercase mb-6">
                                    Direct<br/>Line
                                </h2>
                                <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed border-l border-[var(--accent)] pl-4">
                                    Proct is offered as an institution-level platform. We are ready to help you deploy integrity-first assessments.
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Grid */}
                        <div className="lg:col-span-8">
                            <div className="grid sm:grid-cols-2 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)]">
                                {/* Sales Box */}
                                <div className="bg-[var(--bg-primary)] p-8 md:p-12 flex flex-col justify-between hover:bg-[var(--bg-secondary)] transition-colors group">
                                    <div>
                                        <div className="font-mono text-xs text-[var(--accent)] mb-6 uppercase tracking-widest">
                                            Institutional
                                        </div>
                                        <h3 className="font-jakarta font-black text-3xl text-[var(--text-primary)] mb-6 uppercase tracking-tight">Deploy Proct</h3>
                                        <p className="font-mono text-[var(--text-muted)] mb-8 text-sm leading-relaxed">
                                            For colleges or universities interested in:
                                        </p>
                                        <ul className="space-y-4 font-mono text-sm text-[var(--text-muted)] mb-12">
                                            <li className="flex gap-3"><span className="text-[var(--text-primary)]">_</span> Campus-wide Piloting</li>
                                            <li className="flex gap-3"><span className="text-[var(--text-primary)]">_</span> Department licensing</li>
                                            <li className="flex gap-3"><span className="text-[var(--text-primary)]">_</span> Custom integration</li>
                                        </ul>
                                    </div>
                                    <div className="pt-8 border-t border-[var(--border-subtle)]">
                                        <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">Sales & Enterprise</p>
                                        <a href="mailto:triadactf@gmail.com" className="font-jakarta font-bold text-xl text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-3">
                                            <Mail size={20} />
                                            triadactf@gmail.com
                                        </a>
                                    </div>
                                </div>

                                {/* General Contact Box */}
                                <div className="bg-[var(--bg-primary)] p-8 md:p-12 flex flex-col justify-between hover:bg-[var(--bg-secondary)] transition-colors group">
                                    <div>
                                        <div className="font-mono text-xs text-[var(--accent)] mb-6 uppercase tracking-widest">
                                            Open Line
                                        </div>
                                        <h3 className="font-jakarta font-black text-3xl text-[var(--text-primary)] mb-6 uppercase tracking-tight">Inquiries</h3>
                                        <p className="font-mono text-[var(--text-muted)] mb-6 text-sm leading-relaxed">
                                            For general questions, feedback, or technical collaboration opportunities.
                                        </p>
                                        <p className="font-mono text-[var(--text-muted)] text-sm leading-relaxed opacity-70">
                                            Standard SLA: Response within 24-48 hours during business days.
                                        </p>
                                    </div>
                                    <div className="pt-8 border-t border-[var(--border-subtle)] mt-12 sm:mt-0">
                                        <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">General Comms</p>
                                        <a href="mailto:triadactf@gmail.com" className="font-jakarta font-bold text-xl text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-3">
                                            <MessageSquare size={20} />
                                            triadactf@gmail.com
                                        </a>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 font-mono text-xs text-[var(--text-muted)] uppercase tracking-widest opacity-50 flex gap-4">
                                <span>ORG: TRIADA</span>
                                <span>|</span>
                                <span>SYS: PROCT</span>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    )
}
