'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Settings, User, FileBarChart, ArrowRight } from 'lucide-react'
import { ShineBorder } from '@/components/ui/shine-border'
import BorderGlow from '@/components/ui/border-glow'

const WorkflowNode = ({ icon: Icon, label, sublabel, delay }: { icon: React.ComponentType<{ size?: number; className?: string }>, label: string, sublabel: string, delay: number }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ delay, duration: 0.5, type: "spring" }}
        viewport={{ once: true }}
        className="flex flex-col items-center gap-3 relative z-10"
    >
        <div className="relative w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center shadow-lg group hover:border-[var(--accent)]/50 transition-colors overflow-hidden">
            <ShineBorder shineColor={["var(--accent)", "transparent"]} duration={12} borderWidth={1} />
            <Icon size={26} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors relative z-10" />

            {/* Pulsing ring on active */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: delay + 1 }}
                className="absolute inset-0 rounded-2xl border border-[var(--accent)] pointer-events-none"
            />
        </div>
        <span className="eyebrow" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{label}</span>
        <span className="font-inter text-xs text-[var(--text-muted)] text-center max-w-[120px]">{sublabel}</span>
    </motion.div>
)

const ConnectorArrow = ({ delay }: { delay: number }) => (
    <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ delay, duration: 0.4 }}
        viewport={{ once: true }}
        className="hidden md:flex items-center text-[var(--text-muted)]"
    >
        <div className="w-16 h-[1px] bg-[var(--border)]" />
        <ArrowRight size={14} className="text-[var(--accent)] -ml-1" />
    </motion.div>
)

export const WorkflowDiagram = () => {
    return (
        <div className="w-full max-w-4xl mx-auto relative">
            {/* Terminal Chrome Wrapper with BorderGlow */}
            <BorderGlow
                backgroundColor="var(--bg-secondary)"
                colors={['#e03e3e', '#60a5fa', '#34d399']}
                glowColor="0 60 60"
                borderRadius={16}
                glowRadius={30}
                glowIntensity={0.5}
                edgeSensitivity={25}
                coneSpread={20}
                className="p-[1px]"
            >
                <div className="flex flex-col w-full h-full rounded-[15px] overflow-hidden bg-[var(--bg-secondary)]">
                    {/* macOS Title Bar */}
                    <div className="terminal-chrome-bar">
                        <div className="terminal-dot terminal-dot-red" />
                        <div className="terminal-dot terminal-dot-yellow" />
                        <div className="terminal-dot terminal-dot-green" />
                        <span className="terminal-title">proct — integrity engine</span>
                        <div className="w-[30px]" /> {/* Spacer for centering */}
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-12 relative flex-1">
                        {/* Ambient glow inside terminal */}
                        <div className="absolute inset-0 glow-red opacity-50 pointer-events-none" />

                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 relative z-10">
                            <WorkflowNode icon={Settings} label="Configure Rules" sublabel="Set timers, modes & restrictions" delay={0.2} />
                            <ConnectorArrow delay={0.5} />
                            <WorkflowNode icon={User} label="Student Attempt" sublabel="Enforced, timed & watermarked" delay={0.8} />
                            <ConnectorArrow delay={1.1} />
                            <WorkflowNode icon={FileBarChart} label="Integrity Analysis" sublabel="Logs, scores & audit trails" delay={1.4} />
                        </div>
                    </div>
                </div>
            </BorderGlow>
        </div>
    )
}
