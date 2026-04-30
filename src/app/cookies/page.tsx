'use client'

import React from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Cookie, Settings, Shield, Info, ToggleRight } from 'lucide-react'

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 font-inter">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Brutalist Hero */}
                <section className="container mx-auto px-6 max-w-[1600px] pb-20 border-b border-[var(--border-subtle)]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-mono font-bold tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 bg-white rounded-none" />
                        Storage Policies
                    </div>
                    <h1 className="font-jakarta font-black text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-tighter text-[var(--text-primary)] mb-6 uppercase">
                        Cookies.
                    </h1>
                </section>

                <div className="container mx-auto px-6 max-w-[1600px] py-12">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Left Column */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-32">
                                <h2 className="font-jakarta font-black text-3xl md:text-4xl tracking-tighter uppercase mb-6">
                                    Local<br/>State
                                </h2>
                                <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed border-l border-[var(--accent)] pl-4">
                                    Last updated: February 2026<br/><br/>
                                    This policy explains how Proct uses cookies and similar technologies for strictly functional purposes.
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Content */}
                        <div className="lg:col-span-8 space-y-12">

                            {/* What Are Cookies? */}
                            <section>
                                <div className="border-t border-[var(--border-subtle)] py-8">
                                    <h3 className="font-jakarta font-bold text-2xl text-[var(--text-primary)] mb-4 uppercase tracking-tight flex items-center gap-3">
                                        <Cookie size={20} className="text-[var(--accent)]" /> What Are Cookies?
                                    </h3>
                                    <p className="text-[var(--text-muted)] font-mono text-sm leading-relaxed">
                                        Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience. Proct uses cookies primarily for authentication and essential functionality.
                                    </p>
                                </div>
                            </section>

                            {/* Types of Cookies */}
                            <section>
                                <h3 className="font-jakarta font-bold text-2xl text-[var(--text-primary)] mb-6 uppercase tracking-tight flex items-center gap-3">
                                    <Settings size={20} className="text-blue-500" /> Active Cookies
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-px bg-[var(--border-subtle)] border border-[var(--border-subtle)]">
                                    {/* Essential */}
                                    <div className="bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors p-8">
                                        <div className="font-mono text-xs text-emerald-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-none bg-emerald-500 block" /> Essential
                                        </div>
                                        <h4 className="font-jakarta font-bold text-xl text-[var(--text-primary)] mb-4 uppercase tracking-tight">System Auth</h4>
                                        <p className="font-mono text-[var(--text-muted)] text-sm mb-6 leading-relaxed">
                                            Required for the platform to function. Cannot be disabled.
                                        </p>
                                        <ul className="space-y-3 font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
                                            <li><code className="text-[var(--text-primary)]">next-auth.session-token</code><br/>User authentication</li>
                                            <li className="pt-3 border-t border-[var(--border-subtle)]"><code className="text-[var(--text-primary)]">next-auth.csrf-token</code><br/>Security protection</li>
                                        </ul>
                                    </div>

                                    {/* Preference */}
                                    <div className="bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors p-8">
                                        <div className="font-mono text-xs text-blue-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-none bg-blue-500 block" /> Preference
                                        </div>
                                        <h4 className="font-jakarta font-bold text-xl text-[var(--text-primary)] mb-4 uppercase tracking-tight">UI State</h4>
                                        <p className="font-mono text-[var(--text-muted)] text-sm mb-6 leading-relaxed">
                                            Remember settings for a better experience.
                                        </p>
                                        <ul className="space-y-3 font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4">
                                            <li><code className="text-[var(--text-primary)]">theme</code><br/>Light/dark mode preference</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* What we don't do */}
                            <section>
                                <div className="border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                                    <div className="bg-[var(--bg-secondary)] px-8 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
                                        <Shield size={16} className="text-emerald-500" />
                                        <h3 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-widest">
                                            Zero Tracking Policy
                                        </h3>
                                    </div>
                                    <div className="p-8">
                                        <ul className="grid gap-4 font-mono text-sm text-[var(--text-secondary)]">
                                            <li className="flex items-center gap-4"><span className="text-[var(--accent)] font-bold">✕</span> No third-party advertising cookies</li>
                                            <li className="flex items-center gap-4"><span className="text-[var(--accent)] font-bold">✕</span> No cross-site tracking</li>
                                            <li className="flex items-center gap-4"><span className="text-[var(--accent)] font-bold">✕</span> No selling of cookie data to third parties</li>
                                            <li className="flex items-center gap-4"><span className="text-[var(--accent)] font-bold">✕</span> No social media tracking pixels</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Managing & Contact */}
                            <section className="grid sm:grid-cols-2 gap-6">
                                <div className="p-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                                    <h4 className="font-jakarta font-bold text-lg text-[var(--text-primary)] mb-4 uppercase tracking-tight flex items-center gap-2">
                                        <ToggleRight size={18} className="text-purple-500" /> Managing Cookies
                                    </h4>
                                    <p className="font-mono text-sm text-[var(--text-muted)] leading-relaxed">
                                        You can control cookies through your browser settings. Access your browser's privacy settings and clear site data for proct.platform.
                                    </p>
                                </div>
                                <div className="p-8 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                                    <h4 className="font-jakarta font-bold text-lg text-[var(--text-primary)] mb-4 uppercase tracking-tight flex items-center gap-2">
                                        <Info size={18} className="text-[var(--accent)]" /> Consent
                                    </h4>
                                    <p className="font-mono text-sm text-[var(--text-muted)] leading-relaxed">
                                        By using Proct, you consent to the use of essential cookies necessary for the platform to function securely.
                                    </p>
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
