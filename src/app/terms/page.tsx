'use client'

import React from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { FileText, Scale, AlertCircle, Users, ShieldCheck } from 'lucide-react'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Brutalist Hero */}
                <section className="container mx-auto px-6 max-w-[1600px] pb-20 border-b border-[var(--border-subtle)]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-mono font-bold tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 bg-white rounded-none" />
                        Legal Matrix
                    </div>
                    <h1 className="font-jakarta font-black text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-tighter text-[var(--text-primary)] mb-6 uppercase">
                        Terms.
                    </h1>
                </section>

                <div className="container mx-auto px-6 max-w-[1600px] py-12">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Left Column */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-32">
                                <h2 className="font-jakarta font-black text-3xl md:text-4xl tracking-tighter uppercase mb-6">
                                    Service<br/>Agreements
                                </h2>
                                <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed border-l border-[var(--accent)] pl-4">
                                    Last updated: February 2026<br/><br/>
                                    Please read these terms carefully before engaging with the Proct platform.
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Content */}
                        <div className="lg:col-span-8">
                            <div className="border-t border-[var(--border-subtle)]">
                                {/* Section 1 */}
                                <div className="py-12 border-b border-[var(--border-subtle)]">
                                    <div className="font-mono text-xs font-bold text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                        01 <FileText size={12} className="text-[var(--accent)]" />
                                    </div>
                                    <h3 className="font-jakarta font-bold text-2xl text-[var(--text-primary)] mb-6 uppercase tracking-tight">Acceptance of Terms</h3>
                                    <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed max-w-2xl">
                                        By accessing or using Proct, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you may not use the platform. These terms apply to all users including administrators, faculty members, and students.
                                    </p>
                                </div>

                                {/* Section 2 */}
                                <div className="py-12 border-b border-[var(--border-subtle)]">
                                    <div className="font-mono text-xs font-bold text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                        02 <Users size={12} className="text-blue-500" />
                                    </div>
                                    <h3 className="font-jakarta font-bold text-2xl text-[var(--text-primary)] mb-6 uppercase tracking-tight">User Accounts</h3>
                                    <div className="space-y-6 text-[var(--text-muted)] font-mono text-sm leading-relaxed max-w-2xl">
                                        <p><span className="text-[var(--text-primary)] font-bold">Account Creation:</span> Accounts are created and managed by institutional administrators. Users are responsible for maintaining the confidentiality of their login credentials.</p>
                                        <p><span className="text-[var(--text-primary)] font-bold">Accurate Information:</span> Users must provide accurate information and update it as necessary. Misrepresentation of identity is strictly prohibited.</p>
                                        <p><span className="text-[var(--text-primary)] font-bold">Account Security:</span> You are responsible for all activities that occur under your account. Notify your administrator immediately of any unauthorized use.</p>
                                    </div>
                                </div>

                                {/* Section 3 */}
                                <div className="py-12 border-b border-[var(--border-subtle)]">
                                    <div className="font-mono text-xs font-bold text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                        03 <Scale size={12} className="text-purple-500" />
                                    </div>
                                    <h3 className="font-jakarta font-bold text-2xl text-[var(--text-primary)] mb-6 uppercase tracking-tight">Acceptable Use</h3>
                                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-8 font-mono text-sm">
                                        <p className="text-[var(--text-primary)] mb-6 font-bold">Users agree NOT to:</p>
                                        <ul className="space-y-4 text-[var(--text-muted)]">
                                            <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Share quiz content, questions, or answers with unauthorized parties</li>
                                            <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Attempt to circumvent security measures or quiz enforcement rules</li>
                                            <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Use automated tools, bots, or scripts during assessments</li>
                                            <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Access quizzes not assigned to their academic cohort</li>
                                            <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Impersonate another user or provide false credentials</li>
                                            <li className="flex gap-3 items-start"><span className="text-[var(--text-primary)]">_</span> Disable or circumvent fullscreen enforcement mode during assessments</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Section 4 */}
                                <div className="py-12 border-b border-[var(--border-subtle)]">
                                    <div className="font-mono text-xs font-bold text-[var(--text-muted)] mb-3 flex items-center gap-2">
                                        04 <ShieldCheck size={12} className="text-emerald-500" />
                                    </div>
                                    <h3 className="font-jakarta font-bold text-2xl text-[var(--text-primary)] mb-6 uppercase tracking-tight">Academic Integrity</h3>
                                    <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed max-w-2xl mb-4">
                                        Proct enforces academic integrity through controlled quiz flow, time limits, and monitoring of rule violations. Users agree to comply with their institution's academic integrity policies.
                                    </p>
                                    <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed max-w-2xl">
                                        Violations may be logged and reported to institutional administrators for appropriate action.
                                    </p>
                                </div>

                                {/* Section 5 & 6 Box */}
                                <div className="grid sm:grid-cols-2 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)] mt-12">
                                    <div className="bg-[var(--bg-primary)] p-8">
                                        <div className="font-mono text-xs font-bold text-[var(--accent)] mb-4">05 / LIABILITY</div>
                                        <h3 className="font-jakarta font-bold text-xl text-[var(--text-primary)] mb-4 uppercase tracking-tight">Limitation of Liability</h3>
                                        <p className="font-mono text-sm text-[var(--text-muted)] leading-relaxed">
                                            Proct is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access or error-free operation. In no event shall Proct or Triada be liable for any indirect, incidental, or consequential damages.
                                        </p>
                                    </div>
                                    <div className="bg-[var(--bg-primary)] p-8">
                                        <div className="font-mono text-xs font-bold text-[var(--accent)] mb-4">06 / MODIFICATIONS</div>
                                        <h3 className="font-jakarta font-bold text-xl text-[var(--text-primary)] mb-4 uppercase tracking-tight">Changes to Terms</h3>
                                        <p className="font-mono text-sm text-[var(--text-muted)] leading-relaxed">
                                            We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-12 p-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex justify-between items-center">
                                    <h3 className="font-mono text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Inquiries</h3>
                                    <a href="mailto:legal@proct.platform" className="font-mono text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">legal@proct.platform</a>
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
