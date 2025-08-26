'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

export function ThinkingIndicator() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className="flex items-start gap-2"
		>
			<div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
				<Bot className="w-3 h-3" />
			</div>
			
			<div className="max-w-[85%] bg-slate-100 rounded-lg p-2">
				<div className="flex items-center gap-1 text-slate-600">
					<span className="text-xs">Thinking</span>
					<div className="thinking-dots">
						<div className="thinking-dot"></div>
						<div className="thinking-dot"></div>
						<div className="thinking-dot"></div>
					</div>
				</div>
			</div>
		</motion.div>
	)
}
