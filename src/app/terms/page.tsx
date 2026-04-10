'use client'

import React from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { FileText, Scale, AlertCircle, Users, ShieldCheck } from 'lucide-react'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
                <h1 className="font-manrope font-extrabold text-4xl md:text-5xl mb-4 tracking-tight">Terms & Conditions</h1>
                <p className="text-[var(--text-muted)] mb-2">Last updated: February 2026</p>
                <p className="text-lg text-[var(--text-muted)] mb-12 leading-relaxed">
                    Please read these terms carefully before using the Proct platform.
                </p>

                <div className="space-y-12">
                    {/* Section 1 */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-3">
                            <FileText className="text-[var(--accent)]" size={24} />
                            1. Acceptance of Terms
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6">
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                By accessing or using Proct, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you may not use the platform. These terms apply to all users including administrators, faculty members, and students.
                            </p>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-3">
                            <Users className="text-blue-500" size={24} />
                            2. User Accounts
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                <strong className="text-[var(--text-primary)]">Account Creation:</strong> Accounts are created and managed by institutional administrators. Users are responsible for maintaining the confidentiality of their login credentials.
                            </p>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                <strong className="text-[var(--text-primary)]">Accurate Information:</strong> Users must provide accurate information and update it as necessary. Misrepresentation of identity is strictly prohibited.
                            </p>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                <strong className="text-[var(--text-primary)]">Account Security:</strong> You are responsible for all activities that occur under your account. Notify your administrator immediately of any unauthorized use.
                            </p>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-3">
                            <Scale className="text-purple-500" size={24} />
                            3. Acceptable Use
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6">
                            <p className="text-[var(--text-secondary)] mb-4">Users agree NOT to:</p>
                            <ul className="space-y-2 text-[var(--text-secondary)]">
                                <li>• Share quiz content, questions, or answers with unauthorized parties</li>
                                <li>• Attempt to circumvent security measures or quiz enforcement rules</li>
                                <li>• Use automated tools, bots, or scripts during assessments</li>
                                <li>• Access quizzes not assigned to their academic cohort</li>
                                <li>• Impersonate another user or provide false credentials</li>
                                <li>• Interfere with the platform&apos;s functionality or security</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-3">
                            <ShieldCheck className="text-emerald-500" size={24} />
                            4. Academic Integrity
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                Proct enforces academic integrity through controlled quiz flow, time limits, and monitoring of rule violations. Users agree to comply with their institution&apos;s academic integrity policies.
                            </p>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                Violations may be logged and reported to institutional administrators for appropriate action.
                            </p>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-3">
                            <AlertCircle className="text-[var(--accent)]" size={24} />
                            5. Limitation of Liability
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                Proct is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted access or error-free operation.
                            </p>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                In no event shall Proct or Triada be liable for any indirect, incidental, or consequential damages arising from use of the platform.
                            </p>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4">
                            6. Changes to Terms
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6">
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. Users will be notified of significant changes through the platform.
                            </p>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="p-8 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-center">
                        <h3 className="font-bold text-[var(--text-primary)] mb-2">Questions about these terms?</h3>
                        <p className="text-[var(--text-muted)] text-sm">
                            Contact us at <a href="mailto:legal@proct.platform" className="text-[var(--accent)] hover:underline">legal@proct.platform</a>
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    )
}
