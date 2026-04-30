import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { ShieldCheck, Users, Zap, Lock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Proct | Integrity-First Assessment by Triada',
  description: 'Learn how Proct uses structural constraints instead of surveillance to enforce academic integrity in online assessments.',
}

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Brutalist Hero */}
                <section className="container mx-auto px-6 max-w-[1600px] pb-20 border-b border-[var(--border-subtle)]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-mono font-bold tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 bg-white rounded-none" />
                        About Proct
                    </div>
                    <h1 className="font-jakarta font-black text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-tighter text-[var(--text-primary)] mb-8">
                        TRUST.<br />
                        <span className="text-[var(--text-muted)]">REENGINEERED.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-3xl font-mono tracking-tight leading-relaxed">
                        Proct was created to solve a growing problem in academic institutions: the lack of trust in online internal assessments. Convenience cannot compromise integrity.
                    </p>
                </section>

                <div className="container mx-auto px-6 max-w-[1600px] py-20">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Left Column - Sticky Heading */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-32">
                                <h2 className="font-jakarta font-black text-3xl md:text-4xl tracking-tighter uppercase mb-6">
                                    Integrity by<br/>Design
                                </h2>
                                <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed border-l border-[var(--accent)] pl-4">
                                    Instead of invasive monitoring like webcams or screen recording, Proct relies on intelligent, structural constraints.
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Content Grid */}
                        <div className="lg:col-span-8">
                            <div className="grid sm:grid-cols-2 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)]">
                                {[
                                    { title: "Time Pressure", icon: Zap, desc: "Strict per-question limits force immediate recall." },
                                    { title: "Linear Flow", icon: ShieldCheck, desc: "No backtracking. Answers are locked instantly." },
                                    { title: "Identity Access", icon: Users, desc: "Restricted precisely by academic batch and year." },
                                    { title: "Zero Tolerance", icon: Lock, desc: "Auto-submission on focus loss or tab switching." }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-[var(--bg-primary)] p-8 hover:bg-[var(--bg-secondary)] transition-colors group">
                                        <item.icon size={24} className="mb-6 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                                        <h3 className="font-jakarta font-bold text-xl uppercase tracking-tight mb-3">{item.title}</h3>
                                        <p className="font-mono text-sm text-[var(--text-muted)]">{item.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-20 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8 md:p-12 relative overflow-hidden">
                                {/* Diagonal lines background */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 10px)' }} />
                                
                                <span className="font-mono text-xs font-bold text-[var(--accent)] uppercase tracking-widest mb-4 block">Origin</span>
                                <h3 className="font-jakarta font-black text-3xl md:text-4xl uppercase tracking-tighter mb-6 relative z-10">Built by Triada</h3>
                                <div className="space-y-4 font-mono text-sm text-[var(--text-muted)] relative z-10 max-w-2xl">
                                    <p>
                                        Proct is developed by Triada, a cybersecurity-focused team with deep experience in secure systems, competitive CTFs, and real-world threat modeling.
                                    </p>
                                    <p>
                                        We believe that security principles can radically improve everyday systems. Proct is the result of combining academic reality with hardcore security thinking.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
