import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/error-boundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'Studio AI Prototype - Composable Studio',
	description: 'An AI-powered conversational interface prototype for Composable Studio page building',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<ErrorBoundary>
					{children}
				</ErrorBoundary>
			</body>
		</html>
	)
}
