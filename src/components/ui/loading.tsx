'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function LoadingSpinner() {
	return (
		<div className="flex items-center justify-center p-4">
			<motion.div
				className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
				animate={{ rotate: 360 }}
				transition={{
					duration: 1,
					repeat: Infinity,
					ease: "linear"
				}}
			/>
		</div>
	)
}

export function LoadingDots() {
	return (
		<div className="flex items-center gap-1">
			{[0, 1, 2].map((i) => (
				<motion.div
					key={i}
					className="w-2 h-2 bg-current rounded-full"
					animate={{
						scale: [1, 1.2, 1],
						opacity: [0.7, 1, 0.7]
					}}
					transition={{
						duration: 1,
						repeat: Infinity,
						delay: i * 0.2
					}}
				/>
			))}
		</div>
	)
}
