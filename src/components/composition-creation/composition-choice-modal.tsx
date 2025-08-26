'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, Settings, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CompositionChoiceModalProps {
	isOpen: boolean
	onClose: () => void
	onCreateWithAI: (prompt: string) => void
	onCreateManually: () => void
}

export function CompositionChoiceModal({ 
	isOpen, 
	onClose, 
	onCreateWithAI, 
	onCreateManually 
}: CompositionChoiceModalProps) {
	const [userInput, setUserInput] = useState('')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (userInput.trim()) {
			onCreateWithAI(userInput.trim())
			setUserInput('') // Clear input after submission
		}
	}

	// Reset input when modal opens/closes
	React.useEffect(() => {
		if (!isOpen) {
			setUserInput('')
		}
	}, [isOpen])

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 20 }}
				className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4"
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-slate-200">
					<h2 className="text-xl font-semibold text-slate-800">
						Create New Composition
					</h2>
					<Button variant="ghost" size="sm" onClick={onClose}>
						<X className="w-4 h-4" />
					</Button>
				</div>

								{/* Content */}
				<div className="p-6 space-y-6">
					{/* Describe Option */}
					<div className="space-y-4">
						<div>
							<h3 className="text-lg font-medium text-slate-800 mb-3">
								Describe what you want to create:
							</h3>
							
							{/* Text Input */}
							<form onSubmit={handleSubmit} className="space-y-3">
								<Input
									value={userInput}
									onChange={(e) => setUserInput(e.target.value)}
									placeholder="E.g., 'Create a landing page for our new headphones'"
									className="w-full text-base"
								/>
								<Button
									type="submit"
									disabled={!userInput.trim()}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white"
									size="lg"
								>
									<Send className="w-4 h-4 mr-2" />
									Create with description
								</Button>
							</form>

							{/* Examples */}
							<div className="bg-slate-50 rounded-lg p-3 mt-3">
								<h4 className="text-xs font-medium text-slate-600 mb-2">Examples:</h4>
								<div className="space-y-1 text-xs text-slate-500">
									<div className="flex items-center gap-2">
										<span className="text-slate-400">•</span>
										<span>"Create a landing page for our new headphones"</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-slate-400">•</span>
										<span>"Build a template for blog posts"</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-slate-400">•</span>
										<span>"Make a product catalog page"</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-slate-400">•</span>
										<span>"Set up an about us page"</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* OR Divider */}
					<div className="flex items-center gap-4">
						<div className="flex-1 border-t border-slate-200"></div>
						<span className="text-sm text-slate-500 font-medium">OR</span>
						<div className="flex-1 border-t border-slate-200"></div>
					</div>

					{/* Manual Option */}
					<div>
						<Button
							onClick={onCreateManually}
							variant="outline"
							className="w-full border-slate-300 hover:bg-slate-50"
							size="lg"
						>
							<Settings className="w-4 h-4 mr-2" />
							Choose manually from a form
						</Button>
					</div>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 bg-slate-50 rounded-b-lg">
					<p className="text-xs text-slate-500 text-center">
						You can always adjust settings later regardless of which option you choose
					</p>
				</div>
			</motion.div>
		</div>
	)
}
