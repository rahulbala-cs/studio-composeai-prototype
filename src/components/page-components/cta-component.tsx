'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CtaComponentProps {
	data: {
		text: string
		href?: string
		variant?: 'primary' | 'secondary' | 'outline'
		size?: 'sm' | 'default' | 'lg'
		title?: string
		description?: string
		backgroundColor?: string
	}
}

export function CtaComponent({ data }: CtaComponentProps) {
	const variant = data.variant === 'primary' ? 'default' : data.variant || 'default'
	const size = data.size || 'lg'

	return (
		<Card className="relative" style={{ background: data.backgroundColor || undefined }}>
			<CardContent className="p-8 md:p-12">
				<div className="text-center max-w-2xl mx-auto space-y-6">
					{data.title && (
						<h2 className={`text-2xl md:text-3xl font-bold ${
							data.backgroundColor ? 'text-white' : ''
						}`}>
							{data.title}
						</h2>
					)}
					
					{data.description && (
						<p className={`text-lg ${
							data.backgroundColor ? 'text-white/80' : 'text-muted-foreground'
						}`}>
							{data.description}
						</p>
					)}

					<div className="pt-4">
						<Button
							variant={variant}
							size={size}
							className="group inline-flex items-center gap-2 px-8 py-3 text-lg font-medium"
							asChild
						>
							<a href={data.href || '#'}>
								{data.text}
								<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
							</a>
						</Button>
					</div>
				</div>
			</CardContent>

			{/* Editor Overlay */}
			<div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
				<div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-muted-foreground border">
					CTA Component
				</div>
			</div>
		</Card>
	)
}
