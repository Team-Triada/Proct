'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useTheme } from '../ThemeProvider'

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const { theme, toggleTheme } = useTheme()

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center"
            >
                <div className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]" />
                <div className="page-container relative z-10 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                        <div className="w-8 h-8 relative">
                            <Image src="/icon.png" alt="Proct" fill className="object-contain" />
                        </div>
                        <span className="font-jakarta font-bold text-[var(--text-primary)] text-lg tracking-tight">Proct</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/about" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors tracking-wide">About</Link>
                        <Link href="/docs" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors tracking-wide">Docs</Link>
                        <Link href="/faq" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors tracking-wide">FAQ</Link>
                        <Link href="/support" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors tracking-wide">Support</Link>
                        <Link href="/contact" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors tracking-wide">Contact</Link>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] transition-all"
                            aria-label="Toggle theme"
                        >
                            <motion.div
                                initial={false}
                                animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                                transition={{ duration: 0.3 }}
                            >
                                {theme === 'dark' ? (
                                    <Moon size={18} className="text-[var(--text-secondary)]" />
                                ) : (
                                    <Sun size={18} className="text-[var(--text-secondary)]" />
                                )}
                            </motion.div>
                        </button>

                        <Link
                            href="/login"
                            className="bg-[var(--accent)] hover:bg-[var(--accent-muted)] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-[0_0_20px_-4px_rgba(224,62,62,0.4)] hover:shadow-[0_0_30px_-4px_rgba(224,62,62,0.5)] ring-1 ring-white/10"
                        >
                            Sign In
                        </Link>
                    </div>

                    {/* Mobile Controls */}
                    <div className="md:hidden flex items-center gap-2">
                        {/* Theme Toggle Mobile */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Moon size={20} className="text-[var(--text-secondary)]" />
                            ) : (
                                <Sun size={20} className="text-[var(--text-secondary)]" />
                            )}
                        </button>

                        {/* Hamburger */}
                        <button
                            className="text-[var(--text-primary)] p-2"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-[var(--bg-primary)] pt-24 px-6 md:hidden"
                    >
                        <div className="flex flex-col gap-6 text-center">
                            <Link href="/about" onClick={() => setIsOpen(false)} className="text-lg font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 border-b border-[var(--border-subtle)]">About</Link>
                            <Link href="/docs" onClick={() => setIsOpen(false)} className="text-lg font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 border-b border-[var(--border-subtle)]">Docs</Link>
                            <Link href="/faq" onClick={() => setIsOpen(false)} className="text-lg font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 border-b border-[var(--border-subtle)]">FAQ</Link>
                            <Link href="/support" onClick={() => setIsOpen(false)} className="text-lg font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 border-b border-[var(--border-subtle)]">Support</Link>
                            <Link href="/contact" onClick={() => setIsOpen(false)} className="text-lg font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 border-b border-[var(--border-subtle)]">Contact</Link>
                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="w-full mt-4 bg-[var(--accent)] hover:bg-[var(--accent-muted)] text-white py-4 rounded-xl font-bold transition-colors shadow-[0_0_30px_-4px_rgba(224,62,62,0.4)] flex items-center justify-center"
                            >
                                Sign In
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
