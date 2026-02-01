'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Settings, User, FileBarChart } from 'lucide-react'

const WorkflowNode = ({ icon: Icon, label, delay }: { icon: any, label: string, delay: number }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ delay, duration: 0.5, type: "spring" }}
        viewport={{ once: true }}
        className="flex flex-col items-center gap-4 relative z-10"
    >
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center shadow-lg group hover:border-[var(--accent)]/50 transition-colors">
            <Icon size={28} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />

            {/* Pulsing ring on active */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: delay + 1 }}
                className="absolute inset-0 rounded-2xl border border-[var(--accent)] pointer-events-none"
            />
        </div>
        <span className="font-manrope font-semibold text-[var(--text-primary)] text-sm tracking-wide">{label}</span>
    </motion.div>
)

export const WorkflowDiagram = () => {
    return (
        <div className="w-full max-w-4xl mx-auto py-20 relative">
            <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
                <WorkflowNode icon={Settings} label="Configure Rules" delay={0.2} />
                <WorkflowNode icon={User} label="Student Attempt" delay={0.8} />
                <WorkflowNode icon={FileBarChart} label="Analyze Integrity" delay={1.4} />
            </div>
        </div>
    )
}
