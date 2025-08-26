'use client'

import React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'

interface HeroComponentProps {
	data: {
		title: string
		subtitle?: string
		image?: string
		description?: string
		backgroundColor?: string
		buttonText?: string
		// Enhanced fields for structural content
		stats?: Array<{
			value: string
			label: string
			description?: string
		}>
		pricing?: {
			price: string
			originalPrice?: string
			currency?: string
			period?: string
		}
		testimonials?: Array<{
			name: string
			role: string
			content: string
			rating?: number
		}>
		features?: string[]
	}
}

export function HeroComponent({ data }: HeroComponentProps) {
	return (
		<Card className="overflow-hidden">
			<div 
				className="relative"
				style={{
					background: data.backgroundColor || undefined
				}}
			>
				{/* Background Image */}
				{data.image && !data.backgroundColor && (
					<div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden rounded-t-lg">
						<Image
							src={data.image}
							alt={data.title}
							fill
							className="object-cover"
							priority
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
					</div>
				)}

				{/* Content Overlay */}
				<div className={`${data.image && !data.backgroundColor ? 'absolute inset-0' : 'relative'} flex items-center justify-center p-8 ${
					data.backgroundColor ? 'min-h-96' : ''
				}`}>
					<div className="text-center max-w-3xl">
						<h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${
							data.image || data.backgroundColor ? 'text-white' : 'text-foreground'
						}`}>
							{data.title}
						</h1>
						
						{data.subtitle && (
							<p className={`text-lg md:text-xl mb-6 ${
								data.image || data.backgroundColor ? 'text-white/90' : 'text-muted-foreground'
							}`}>
								{data.subtitle}
							</p>
						)}

						{data.description && (
							<p className={`text-base md:text-lg max-w-2xl mx-auto mb-6 ${
								data.image || data.backgroundColor ? 'text-white/80' : 'text-muted-foreground'
							}`}>
								{data.description}
							</p>
						)}

						{/* Pricing Display */}
						{data.pricing && (
							<div className="mb-6">
								<div className="flex items-center justify-center gap-3">
									<span className={`text-3xl font-bold ${
										data.image || data.backgroundColor ? 'text-white' : 'text-foreground'
									}`}>
										{data.pricing.price}
									</span>
									{data.pricing.originalPrice && (
										<span className={`text-lg line-through opacity-60 ${
											data.image || data.backgroundColor ? 'text-white/60' : 'text-muted-foreground'
										}`}>
											{data.pricing.originalPrice}
										</span>
									)}
									{data.pricing.period && (
										<span className={`text-sm opacity-80 ${
											data.image || data.backgroundColor ? 'text-white/80' : 'text-muted-foreground'
										}`}>
											/{data.pricing.period}
										</span>
									)}
								</div>
							</div>
						)}

						{data.buttonText && (
							<button className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors mb-6">
								{data.buttonText}
							</button>
						)}

						{/* Stats Display */}
						{data.stats && data.stats.length > 0 && (
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
								{data.stats.map((stat, index) => (
									<div key={index} className="text-center">
										<div className={`text-2xl font-bold mb-1 ${
											data.image || data.backgroundColor ? 'text-white' : 'text-foreground'
										}`}>
											{stat.value}
										</div>
										<div className={`text-sm font-medium mb-1 ${
											data.image || data.backgroundColor ? 'text-white/90' : 'text-foreground'
										}`}>
											{stat.label}
										</div>
										{stat.description && (
											<div className={`text-xs opacity-70 ${
												data.image || data.backgroundColor ? 'text-white/70' : 'text-muted-foreground'
											}`}>
												{stat.description}
											</div>
										)}
									</div>
								))}
							</div>
						)}

						{/* Features List */}
						{data.features && data.features.length > 0 && (
							<div className="mt-8 max-w-2xl mx-auto">
								<ul className="space-y-3 text-left">
									{data.features.slice(0, 3).map((feature, index) => (
										<li key={index} className={`flex items-start gap-3 ${
											data.image || data.backgroundColor ? 'text-white/90' : 'text-muted-foreground'
										}`}>
											<div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
											<span>{feature}</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>

				{/* Editor Overlay */}
				<div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
					<div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-muted-foreground border">
						Hero Component
					</div>
				</div>
			</div>
		</Card>
	)
}
