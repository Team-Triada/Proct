'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export const Footer = () => (
    <footer className="py-12 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)]">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="w-5 h-5 relative">
                        <Image src="/icon.png" alt="Proct" fill className="object-contain" />
                    </div>
                    <span className="font-manrope font-semibold text-[var(--text-primary)] tracking-tight">Proct</span>
                </div>

                <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-muted)] font-inter">
                    <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">About</Link>
                    <Link href="/docs" className="hover:text-[var(--text-primary)] transition-colors">Docs</Link>
                    <Link href="/faq" className="hover:text-[var(--text-primary)] transition-colors">FAQ</Link>
                    <Link href="/support" className="hover:text-[var(--text-primary)] transition-colors">Support</Link>
                    <Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors">Contact</Link>
                </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-[var(--text-muted)] font-inter">
                    © {new Date().getFullYear()} Triada. Integrity-First Online Quizzes.
                </p>
                <div className="flex flex-wrap justify-center gap-6 text-xs text-[var(--text-muted)] font-inter">
                    <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms & Conditions</Link>
                    <Link href="/cookies" className="hover:text-[var(--text-primary)] transition-colors">Cookie Policy</Link>
                </div>
            </div>
        </div>
    </footer>
)
