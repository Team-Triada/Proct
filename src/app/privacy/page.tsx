'use client'

import React from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Shield, EyeOff, Lock, Server } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Brutalist Hero */}
                <section className="container mx-auto px-6 max-w-[1600px] pb-20 border-b border-[var(--border-subtle)]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-mono font-bold tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 bg-white rounded-none" />
                        Data Policies
                    </div>
                    <h1 className="font-jakarta font-black text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-tighter text-[var(--text-primary)] mb-6 uppercase">
                        Privacy.
                    </h1>
                </section>

                <div className="container mx-auto px-6 max-w-[1600px] py-12">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Left Column */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-32">
                                <h2 className="font-jakarta font-black text-3xl md:text-4xl tracking-tighter uppercase mb-6">
                                    Trust &<br/>Verifiability
                                </h2>
                                <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed border-l border-[var(--accent)] pl-4">
                                    Proct is built with student privacy and institutional responsibility as core principles. We believe integrity can be enforced without invasive surveillance.
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Content */}
                        <div className="lg:col-span-8 space-y-12">
                            <section>
                                <div className="border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                                    <div className="bg-[var(--bg-secondary)] px-8 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
                                        <EyeOff size={16} className="text-[var(--accent)]" />
                                        <h3 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-widest">
                                            Out Of Scope (What we DO NOT do)
                                        </h3>
                                    </div>
                                    <div className="p-8">
                                        <ul className="grid gap-4 font-mono text-sm">
                                            {[
                                                "Does not use webcams or physical monitoring",
                                                "Does not access microphones or audio feeds",
                                                "Does not record screens",
                                                "Does not monitor personal behavior outside the quiz window",
                                                "Does not track browsing history or external activity"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-center gap-4 text-[var(--text-secondary)]">
                                                    <span className="text-[var(--accent)] font-bold">✕</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <div className="grid md:grid-cols-2 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)]">
                                <section className="bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors p-8">
                                    <div className="font-mono text-xs text-indigo-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <Server size={14} /> Collected Data
                                    </div>
                                    <h2 className="font-jakarta font-bold text-2xl text-[var(--text-primary)] mb-6 uppercase tracking-tight">Required Ops Data</h2>
                                    <ul className="space-y-4 font-mono text-sm text-[var(--text-muted)]">
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Name and institutional ID</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Role (Admin, Faculty, Student)</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Academic scope (sem, batch)</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Quiz attempts, answers & timestamps</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Rule violation events (tab switch)</li>
                                    </ul>
                                </section>

                                <section className="bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors p-8">
                                    <div className="font-mono text-xs text-emerald-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <Lock size={14} /> Security Matrix
                                    </div>
                                    <h2 className="font-jakarta font-bold text-2xl text-[var(--text-primary)] mb-6 uppercase tracking-tight">Data Security</h2>
                                    <ul className="space-y-4 font-mono text-sm text-[var(--text-muted)]">
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Secure authentication layers</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Strict role-based access control</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Server-side rule enforcement</li>
                                        <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Cryptographic answer validation</li>
                                    </ul>
                                </section>
                            </div>

                            <section className="p-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] relative overflow-hidden">
                                {/* Diagonal lines background */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 10px)' }} />
                                
                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                                    <Shield className="w-12 h-12 text-[var(--text-muted)] shrink-0" />
                                    <div>
                                        <h3 className="font-jakarta font-bold text-[var(--text-primary)] uppercase tracking-tight mb-2 text-xl">Data Usage Strictness</h3>
                                        <p className="font-mono text-[var(--text-muted)] text-sm leading-relaxed max-w-xl">
                                            Data is utilized strictly for academic assessment integrity. It is never sold, shared, or exploited by third parties. Database access is highly restricted.
                                        </p>
                                    </div>
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
