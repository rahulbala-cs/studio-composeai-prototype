'use client'

import React from 'react'
import { Check, Star, Zap, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FeaturesComponentProps {
	data: {
		title: string
		features: string[]
		layout?: 'list' | 'grid'
		backgroundColor?: string
	}
}

const featureIcons = [Check, Star, Zap, Shield]

export function FeaturesComponent({ data }: FeaturesComponentProps) {
	const layout = data.layout || 'list'

	return (
		<Card className="relative" style={{ background: data.backgroundColor || undefined }}>
			<CardHeader>
				<CardTitle className={`text-2xl md:text-3xl text-center ${
					data.backgroundColor ? 'text-white' : ''
				}`}>
					{data.title}
				</CardTitle>
			</CardHeader>
			
			<CardContent>
				{layout === 'list' ? (
					<div className="space-y-4">
						{data.features.map((feature, index) => {
							const IconComponent = featureIcons[index % featureIcons.length]
							return (
								<div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
									<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
										<IconComponent className="w-4 h-4" />
									</div>
									<span className={`text-base font-medium ${
										data.backgroundColor ? 'text-white' : ''
									}`}>{feature}</span>
								</div>
							)
						})}
					</div>
				) : (
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{data.features.map((feature, index) => {
							const IconComponent = featureIcons[index % featureIcons.length]
							return (
								<div key={index} className="text-center p-6 rounded-lg bg-muted/50">
									<div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
										<IconComponent className="w-6 h-6" />
									</div>
									<h3 className={`font-semibold text-lg mb-2 ${
										data.backgroundColor ? 'text-white' : ''
									}`}>Feature {index + 1}</h3>
									<p className={`${
										data.backgroundColor ? 'text-white/80' : 'text-muted-foreground'
									}`}>{feature}</p>
								</div>
							)
						})}
					</div>
				)}
			</CardContent>

			{/* Editor Overlay */}
			<div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
				<div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-muted-foreground border">
					Features Component
				</div>
			</div>
		</Card>
	)
}
