'use client'

import React from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Cookie, Settings, Shield, Info, ToggleRight } from 'lucide-react'

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
                <h1 className="font-manrope font-extrabold text-4xl md:text-5xl mb-4 tracking-tight">Cookie Policy</h1>
                <p className="text-[var(--text-muted)] mb-2">Last updated: February 2026</p>
                <p className="text-lg text-[var(--text-muted)] mb-12 leading-relaxed">
                    This policy explains how Proct uses cookies and similar technologies.
                </p>

                <div className="space-y-12">
                    {/* What are Cookies */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-3">
                            <Cookie className="text-[var(--accent)]" size={24} />
                            What Are Cookies?
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6">
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience. Proct uses cookies primarily for authentication and essential functionality.
                            </p>
                        </div>
                    </section>

                    {/* Types of Cookies */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-3">
                            <Settings className="text-blue-500" size={24} />
                            Types of Cookies We Use
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6">
                                <h3 className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    Essential Cookies
                                </h3>
                                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                    Required for the platform to function. These handle authentication, session management, and security. Cannot be disabled.
                                </p>
                                <ul className="mt-3 space-y-1 text-[var(--text-muted)] text-sm">
                                    <li>• <code className="text-[var(--accent)]">next-auth.session-token</code> - User authentication</li>
                                    <li>• <code className="text-[var(--accent)]">next-auth.csrf-token</code> - Security protection</li>
                                </ul>
                            </div>

                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6">
                                <h3 className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                    Preference Cookies
                                </h3>
                                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                    Remember your settings and preferences for a better experience.
                                </p>
                                <ul className="mt-3 space-y-1 text-[var(--text-muted)] text-sm">
                                    <li>• <code className="text-[var(--accent)]">theme</code> - Light/dark mode preference</li>
                                </ul>
                            </div>

                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6">
                                <h3 className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-[var(--text-muted)]"></span>
                                    Analytics Cookies
                                </h3>
                                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                    Proct does <strong>not</strong> use third-party analytics or tracking cookies. We do not track user behavior for advertising purposes.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* What We Don't Do */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-3">
                            <Shield className="text-emerald-500" size={24} />
                            What We Don&apos;t Do
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6">
                            <ul className="space-y-3 text-[var(--text-secondary)]">
                                <li className="flex items-center gap-3">
                                    <span className="text-[var(--accent)]">✕</span>
                                    No third-party advertising cookies
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="text-[var(--accent)]">✕</span>
                                    No cross-site tracking
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="text-[var(--accent)]">✕</span>
                                    No selling of cookie data to third parties
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="text-[var(--accent)]">✕</span>
                                    No social media tracking pixels
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Managing Cookies */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-3">
                            <ToggleRight className="text-purple-500" size={24} />
                            Managing Cookies
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                You can control cookies through your browser settings. However, disabling essential cookies will prevent you from using the platform.
                            </p>
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                <strong className="text-[var(--text-primary)]">To clear cookies:</strong> Access your browser&apos;s privacy settings and clear site data for proct.platform.
                            </p>
                        </div>
                    </section>

                    {/* More Information */}
                    <section>
                        <h2 className="font-manrope font-bold text-2xl text-[var(--text-primary)] mb-4 flex items-center gap-3">
                            <Info className="text-[var(--accent)]" size={24} />
                            More Information
                        </h2>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-6">
                            <p className="text-[var(--text-secondary)] leading-relaxed">
                                For more details about how we handle your data, please read our{' '}
                                <a href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</a>.
                                If you have questions about our cookie practices, contact us at{' '}
                                <a href="mailto:privacy@proct.platform" className="text-[var(--accent)] hover:underline">privacy@proct.platform</a>.
                            </p>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="p-8 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-center">
                        <Cookie className="w-12 h-12 text-[var(--accent)] mx-auto mb-4" />
                        <h3 className="font-bold text-[var(--text-primary)] mb-2">Cookie Consent</h3>
                        <p className="text-[var(--text-muted)] text-sm max-w-lg mx-auto">
                            By using Proct, you consent to the use of essential cookies necessary for the platform to function.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    )
}
