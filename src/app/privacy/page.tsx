'use client'

import React from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Shield, EyeOff, Lock, Server } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
                <h1 className="font-manrope font-extrabold text-4xl md:text-5xl mb-8 tracking-tight">Privacy Policy</h1>
                <p className="text-xl text-[var(--text-muted)] mb-16 leading-relaxed">
                    Proct is built with student privacy and institutional responsibility as core principles.
                    We believe integrity can be enforced without invasive surveillance.
                </p>

                <section className="mb-16">
                    <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-6 flex items-center gap-3">
                        <EyeOff className="text-[var(--accent)]" />
                        What Proct Does <span className="text-[var(--accent)]">NOT</span> Do
                    </h2>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-8">
                        <ul className="grid gap-4">
                            {[
                                "Does not use webcams",
                                "Does not access microphones",
                                "Does not record screens",
                                "Does not monitor personal behavior outside the quiz window",
                                "Does not track browsing history or external activity"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-[var(--text-secondary)]">
                                    <span className="text-[var(--accent)]/50">✕</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-6 flex items-center gap-3">
                            <Server className="text-indigo-500" />
                            What Proct Does Collect
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-8 h-full">
                            <p className="text-[var(--text-muted)] text-sm mb-4">Only information required for academic operation:</p>
                            <ul className="space-y-3">
                                <li className="text-[var(--text-secondary)]">• Name and institutional ID</li>
                                <li className="text-[var(--text-secondary)]">• Role (Admin, Faculty, Student)</li>
                                <li className="text-[var(--text-secondary)]">• Academic identifiers (department, semester, batch)</li>
                                <li className="text-[var(--text-secondary)]">• Quiz attempts, answers, and timestamps</li>
                                <li className="text-[var(--text-secondary)]">• Rule violation events (tab switch logs)</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-6 flex items-center gap-3">
                            <Lock className="text-emerald-500" />
                            Data Security
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-8 h-full">
                            <ul className="space-y-3">
                                <li className="text-[var(--text-secondary)]">• Secure authentication</li>
                                <li className="text-[var(--text-secondary)]">• Role-based access control</li>
                                <li className="text-[var(--text-secondary)]">• Server-side enforcement of quiz rules</li>
                                <li className="text-[var(--text-secondary)]">• Audit logs for administrative transparency</li>
                            </ul>
                        </div>
                    </section>
                </div>

                <section className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                    <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                    <h3 className="font-bold text-[var(--text-primary)] mb-2">Data Usage</h3>
                    <p className="text-[var(--text-muted)] text-sm max-w-lg mx-auto">
                        Data is used strictly for academic assessment. It is never sold or shared with third parties.
                        Access is restricted by role and permission.
                    </p>
                </section>

            </main>

            <Footer />
        </div>
    )
}
