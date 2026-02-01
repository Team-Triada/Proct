'use client'

import React from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Mail, MessageSquare } from 'lucide-react'

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
                <h1 className="font-manrope font-extrabold text-4xl md:text-5xl mb-8 tracking-tight">Contact Sales</h1>
                <p className="text-xl text-[var(--text-muted)] mb-16 leading-relaxed">
                    Proct is offered as an institution-level platform. We are ready to help you deploy integrity-first assessments.
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-20">
                    <div className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between">
                        <div>
                            <h3 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-6">Start a Pilot</h3>
                            <p className="text-[var(--text-muted)] mb-6 text-sm">
                                If your college or university is interested in:
                            </p>
                            <ul className="space-y-3 text-[var(--text-secondary)] text-sm mb-8">
                                <li>• Piloting Proct</li>
                                <li>• Department-wide deployment</li>
                                <li>• Custom integrations</li>
                            </ul>
                        </div>
                        <div className="pt-8 border-t border-[var(--border-subtle)]">
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Contact Sales</p>
                            <a href="mailto:sales@proct.platform" className="text-lg font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors flex items-center gap-2">
                                <Mail size={18} />
                                sales@proct.platform
                            </a>
                        </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between">
                        <div>
                            <h3 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-6">General Contact</h3>
                            <p className="text-[var(--text-muted)] mb-6 text-sm">
                                For general inquiries, feedback, or collaboration opportunities.
                            </p>
                            <p className="text-[var(--text-muted)] text-sm mb-4">
                                We aim to respond within a reasonable time frame during working days.
                            </p>
                        </div>
                        <div className="pt-8 border-t border-[var(--border-subtle)]">
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Get in Touch</p>
                            <a href="mailto:contact@proct.platform" className="text-lg font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors flex items-center gap-2">
                                <MessageSquare size={18} />
                                contact@proct.platform
                            </a>
                        </div>
                    </div>
                </div>

                <div className="text-center opacity-50">
                    <p className="text-sm text-[var(--text-muted)]">📍 Organization: Proct by Triada</p>
                </div>

            </main>

            <Footer />
        </div>
    )
}
