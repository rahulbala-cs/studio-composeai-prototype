'use client'

import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TwoColumnHeroProps {
	data: {
		title: string
		description?: string
		image?: string
		buttonText?: string
		buttonHref?: string
		layout?: 'image-left' | 'image-right'
		backgroundColor?: string
	}
}

export function TwoColumnHero({ data }: TwoColumnHeroProps) {
	const isImageLeft = data.layout === 'image-left' || data.layout === undefined

	return (
		<Card className="overflow-hidden">
			<div 
				className={`grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[400px] ${!isImageLeft ? 'lg:grid-flow-col-dense' : ''}`}
				style={{
					background: data.backgroundColor || undefined
				}}
			>
				{/* Image Column */}
				<div className={`relative ${!isImageLeft ? 'lg:col-start-2' : ''}`}>
					{data.image ? (
						<div className="relative h-64 lg:h-full w-full overflow-hidden">
							<Image
								src={data.image}
								alt={data.title}
								fill
								className="object-cover"
								priority
							/>
						</div>
					) : (
						<div className="h-64 lg:h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
							<div className="text-slate-400 text-center">
								<div className="w-16 h-16 bg-slate-300 rounded-lg mx-auto mb-2"></div>
								<p className="text-sm">Image Placeholder</p>
							</div>
						</div>
					)}
				</div>

				{/* Content Column */}
				<div className={`flex items-center p-8 lg:p-12 ${!isImageLeft ? 'lg:col-start-1' : ''}`}>
					<div className="max-w-lg">
						<h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-6 leading-tight">
							{data.title}
						</h1>
						
						{data.description && (
							<p className="text-lg text-muted-foreground mb-8 leading-relaxed">
								{data.description}
							</p>
						)}

						{data.buttonText && (
							<Button 
								size="lg" 
								className="px-8 py-3 text-base"
								asChild={!!data.buttonHref}
							>
								{data.buttonHref ? (
									<a href={data.buttonHref}>{data.buttonText}</a>
								) : (
									<span>{data.buttonText}</span>
								)}
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Editor Overlay */}
			<div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
				<div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-muted-foreground border">
					Two-Column Hero
				</div>
			</div>
		</Card>
	)
}