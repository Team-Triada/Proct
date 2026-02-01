'use client'

import React from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { ShieldCheck, Users, Zap } from 'lucide-react'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h1 className="font-manrope font-extrabold text-4xl md:text-5xl mb-8 tracking-tight">About Proct</h1>
                    <p className="text-xl text-[var(--text-muted)] mb-12 leading-relaxed">
                        Proct was created to solve a growing problem in academic institutions:
                        <span className="text-[var(--text-primary)] font-medium"> the lack of trust in online internal assessments.</span>
                    </p>

                    <div className="prose max-w-none text-[var(--text-muted)] mb-20">
                        <p className="mb-6">
                            As online quizzes became common, misuse also increased. Many existing tools prioritized convenience but failed to address fairness, identity control, and accountability.
                        </p>
                        <p>
                            Proct was built to fill this gap.
                        </p>
                    </div>

                    <section className="mb-24">
                        <h2 className="font-manrope font-bold text-3xl text-[var(--text-primary)] mb-8">Our Philosophy</h2>
                        <div className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                            <div className="flex items-start gap-6">
                                <div className="bg-[var(--accent-subtle)] p-4 rounded-xl text-[var(--accent)] shrink-0">
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-[var(--text-primary)] mb-4">Integrity through Design, not Surveillance.</h3>
                                    <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-6">
                                        Instead of invasive monitoring like webcams or screen recording, Proct relies on intelligent constraints:
                                    </p>
                                    <ul className="grid sm:grid-cols-2 gap-4">
                                        {["Time pressure", "Controlled navigation", "Identity-based access", "Transparent enforcement"].map(i => (
                                            <li key={i} className="flex items-center gap-2 text-[var(--text-secondary)]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                                {i}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="font-manrope font-bold text-3xl text-[var(--text-primary)] mb-8">Built by Triada</h2>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                                <Users className="mb-6 text-[var(--text-muted)]" size={24} />
                                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-4">The Team</h3>
                                <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
                                    Proct is developed by Triada, a cybersecurity-focused team with experience in secure systems, competitive CTFs, and real-world threat modeling.
                                </p>
                                <p className="text-[var(--text-muted)] text-sm">
                                    We believe that security principles can improve everyday systems, including education.
                                </p>
                            </div>

                            <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                                <Zap className="mb-6 text-[var(--warning)]" size={24} />
                                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-4">Our Approach</h3>
                                <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
                                    Proct is a result of combining:
                                </p>
                                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                                    <li>• Academic reality</li>
                                    <li>• Security thinking</li>
                                    <li>• Practical constraints</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    )
}
