import type { Metadata } from 'next'
import DocsClient from './DocsClient'

export const metadata: Metadata = {
  title: 'Documentation | Proct System Manual',
  description: 'Complete documentation for the Proct assessment platform — faculty workflows, student flows, security mechanics, and tech stack.',
}

export default function DocsPage() {
  return <DocsClient />
}
