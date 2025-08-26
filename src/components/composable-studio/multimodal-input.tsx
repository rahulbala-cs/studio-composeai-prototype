'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
	Paperclip, 
	Image, 
	FileText, 
	Mic, 
	MicOff, 
	Upload, 
	X, 
	Play, 
	Pause,
	Volume2,
	File,
	Video,
	Music,
	Archive,
	Code,
	Layers,
	Download,
	Figma
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface AttachedFile {
	id: string
	file: File
	type: 'image' | 'document' | 'audio' | 'video' | 'code' | 'archive' | 'other'
	preview?: string // Base64 for images
	uploadProgress?: number
	status: 'pending' | 'uploading' | 'uploaded' | 'error'
	size: string
	name: string
}

interface VoiceRecording {
	id: string
	blob: Blob
	duration: number
	timestamp: Date
	transcription?: string
	isTranscribing?: boolean
}

interface MultiModalInputProps {
	onFilesAttached: (files: AttachedFile[]) => void
	onVoiceRecording: (recording: VoiceRecording) => void
	onRemoveFile: (fileId: string) => void
	onFigmaClick?: () => void
	attachedFiles: AttachedFile[]
	disabled?: boolean
	maxFileSize?: number // in MB
	acceptedTypes?: string[]
	showPreview?: boolean
	showFigmaButton?: boolean
}

export function MultiModalInput({
	onFilesAttached,
	onVoiceRecording,
	onRemoveFile,
	onFigmaClick,
	attachedFiles = [],
	disabled = false,
	maxFileSize = 10, // 10MB default
	acceptedTypes = [
		'image/*',
		'.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.xlsx',
		'.zip', '.rar', '.7z',
		'.js', '.ts', '.tsx', '.jsx', '.py', '.html', '.css', '.json',
		'audio/*',
		'video/*'
	],
	showPreview = true,
	showFigmaButton = false
}: MultiModalInputProps) {
	const [isDragOver, setIsDragOver] = useState(false)
	const [isRecording, setIsRecording] = useState(false)
	const [recordingTime, setRecordingTime] = useState(0)
	const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([])
	const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null)
	const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
	const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

	const fileInputRef = useRef<HTMLInputElement>(null)
	const imageInputRef = useRef<HTMLInputElement>(null)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioChunksRef = useRef<Blob[]>([])
	const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const dropZoneRef = useRef<HTMLDivElement>(null)

	// Get file type from file extension and mime type
	const getFileType = useCallback((file: File): AttachedFile['type'] => {
		const { type, name } = file
		const ext = name.toLowerCase().split('.').pop() || ''

		if (type.startsWith('image/')) return 'image'
		if (type.startsWith('audio/')) return 'audio'
		if (type.startsWith('video/')) return 'video'
		
		// Document types
		if (type.includes('pdf') || type.includes('document') || type.includes('text') || type.includes('csv') || type.includes('sheet')) {
			return 'document'
		}

		// Code files
		if (['js', 'ts', 'tsx', 'jsx', 'py', 'html', 'css', 'json', 'xml', 'yml', 'yaml'].includes(ext)) {
			return 'code'
		}

		// Archive files
		if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
			return 'archive'
		}

		return 'other'
	}, [])

	// Format file size
	const formatFileSize = useCallback((bytes: number): string => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}, [])

	// Get file icon
	const getFileIcon = useCallback((type: AttachedFile['type'], size = 16) => {
		const iconProps = { size, className: "flex-shrink-0" }
		
		switch (type) {
			case 'image': return <Image {...iconProps} className="text-blue-600" />
			case 'document': return <FileText {...iconProps} className="text-green-600" />
			case 'audio': return <Music {...iconProps} className="text-purple-600" />
			case 'video': return <Video {...iconProps} className="text-red-600" />
			case 'code': return <Code {...iconProps} className="text-yellow-600" />
			case 'archive': return <Archive {...iconProps} className="text-gray-600" />
			default: return <File {...iconProps} className="text-gray-600" />
		}
	}, [])

	// Handle file processing
	const processFiles = useCallback(async (files: FileList) => {
		const fileArray = Array.from(files)
		const validFiles: AttachedFile[] = []

		for (const file of fileArray) {
			// Validate file size
			if (file.size > maxFileSize * 1024 * 1024) {
				console.warn(`File ${file.name} exceeds maximum size of ${maxFileSize}MB`)
				continue
			}

			const attachedFile: AttachedFile = {
				id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				file,
				type: getFileType(file),
				status: 'pending',
				size: formatFileSize(file.size),
				name: file.name
			}

			// Generate preview for images
			if (attachedFile.type === 'image') {
				try {
					const preview = await new Promise<string>((resolve, reject) => {
						const reader = new FileReader()
						reader.onload = (e) => resolve(e.target?.result as string)
						reader.onerror = reject
						reader.readAsDataURL(file)
					})
					attachedFile.preview = preview
				} catch (error) {
					console.warn('Failed to generate image preview:', error)
				}
			}

			validFiles.push(attachedFile)
		}

		if (validFiles.length > 0) {
			onFilesAttached(validFiles)
			simulateUpload(validFiles)
		}
	}, [maxFileSize, getFileType, formatFileSize, onFilesAttached])

	// Simulate file upload with progress
	const simulateUpload = useCallback((files: AttachedFile[]) => {
		files.forEach(file => {
			let progress = 0
			const interval = setInterval(() => {
				progress += Math.random() * 15 + 5 // Random progress between 5-20%
				
				if (progress >= 100) {
					progress = 100
					clearInterval(interval)
					setUploadProgress(prev => {
						const newProgress = { ...prev }
						delete newProgress[file.id]
						return newProgress
					})
					// In real app, this would trigger a callback to update file status
				} else {
					setUploadProgress(prev => ({
						...prev,
						[file.id]: Math.min(progress, 100)
					}))
				}
			}, 200)
		})
	}, [])

	// Drag and drop handlers
	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(false)
	}, [])

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
	}, [])

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragOver(false)
		
		if (disabled) return
		
		const files = e.dataTransfer.files
		if (files.length > 0) {
			processFiles(files)
		}
	}, [disabled, processFiles])

	// File input handlers
	const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (files) {
			processFiles(files)
		}
		// Reset input value
		e.target.value = ''
	}, [processFiles])

	// Voice recording functions
	const startRecording = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			mediaRecorderRef.current = new MediaRecorder(stream)
			audioChunksRef.current = []
			
			mediaRecorderRef.current.ondataavailable = (event) => {
				audioChunksRef.current.push(event.data)
			}
			
			mediaRecorderRef.current.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
				const recording: VoiceRecording = {
					id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					blob: audioBlob,
					duration: recordingTime,
					timestamp: new Date()
				}
				
				setVoiceRecordings(prev => [...prev, recording])
				onVoiceRecording(recording)
				
				// Cleanup
				stream.getTracks().forEach(track => track.stop())
				setRecordingTime(0)
			}
			
			mediaRecorderRef.current.start()
			setIsRecording(true)
			
			// Start recording timer
			recordingIntervalRef.current = setInterval(() => {
				setRecordingTime(prev => prev + 1)
			}, 1000)
			
		} catch (error) {
			console.error('Failed to start recording:', error)
		}
	}, [recordingTime, onVoiceRecording])

	const stopRecording = useCallback(() => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop()
			setIsRecording(false)
			
			if (recordingIntervalRef.current) {
				clearInterval(recordingIntervalRef.current)
				recordingIntervalRef.current = null
			}
		}
	}, [isRecording])

	// Play audio recording
	const playAudioRecording = useCallback((recording: VoiceRecording) => {
		if (isPlayingAudio === recording.id) {
			audioRef.current?.pause()
			setIsPlayingAudio(null)
			return
		}

		const audio = new Audio(URL.createObjectURL(recording.blob))
		audioRef.current = audio
		
		audio.onended = () => {
			setIsPlayingAudio(null)
		}
		
		audio.play()
		setIsPlayingAudio(recording.id)
	}, [isPlayingAudio])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (recordingIntervalRef.current) {
				clearInterval(recordingIntervalRef.current)
			}
			if (audioRef.current) {
				audioRef.current.pause()
			}
		}
	}, [])

	// Format recording time
	const formatTime = useCallback((seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}, [])

	return (
		<div className="space-y-3">
			{/* Attachment Menu */}
			<AnimatePresence>
				{showAttachmentMenu && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="p-3 bg-slate-50 rounded-lg border border-slate-200"
					>
						<div className="grid grid-cols-2 gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => imageInputRef.current?.click()}
								className="flex items-center gap-2 p-3 h-auto justify-start hover:bg-blue-50"
								disabled={disabled}
							>
								<Image className="w-4 h-4 text-blue-600" />
								<div className="text-left">
									<div className="text-sm font-medium">Images</div>
									<div className="text-xs text-slate-500">PNG, JPG, GIF, SVG</div>
								</div>
							</Button>
							
							<Button
								variant="ghost"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
								className="flex items-center gap-2 p-3 h-auto justify-start hover:bg-green-50"
								disabled={disabled}
							>
								<FileText className="w-4 h-4 text-green-600" />
								<div className="text-left">
									<div className="text-sm font-medium">Documents</div>
									<div className="text-xs text-slate-500">PDF, DOC, TXT, CSV</div>
								</div>
							</Button>
							
							<Button
								variant="ghost"
								size="sm"
								onClick={isRecording ? stopRecording : startRecording}
								className={`flex items-center gap-2 p-3 h-auto justify-start ${
									isRecording ? 'hover:bg-red-50 text-red-600' : 'hover:bg-purple-50'
								}`}
								disabled={disabled}
							>
								{isRecording ? (
									<MicOff className="w-4 h-4 text-red-600" />
								) : (
									<Mic className="w-4 h-4 text-purple-600" />
								)}
								<div className="text-left">
									<div className="text-sm font-medium">
										{isRecording ? 'Stop Recording' : 'Voice Input'}
									</div>
									<div className="text-xs text-slate-500">
										{isRecording ? formatTime(recordingTime) : 'Record audio message'}
									</div>
								</div>
							</Button>
							
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setShowAttachmentMenu(false)
									// In real app, this would open a cloud storage picker
								}}
								className="flex items-center gap-2 p-3 h-auto justify-start hover:bg-yellow-50"
								disabled={disabled}
							>
								<Layers className="w-4 h-4 text-yellow-600" />
								<div className="text-left">
									<div className="text-sm font-medium">Cloud Files</div>
									<div className="text-xs text-slate-500">Google Drive, Dropbox</div>
								</div>
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Drag & Drop Zone */}
			<AnimatePresence>
				{isDragOver && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						className="fixed inset-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl z-50 flex items-center justify-center"
						ref={dropZoneRef}
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
					>
						<div className="text-center">
							<Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
							<div className="text-lg font-medium text-blue-900 mb-1">
								Drop your files here
							</div>
							<div className="text-sm text-blue-700">
								Images, documents, and more
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Attached Files Display */}
			<AnimatePresence>
				{attachedFiles.length > 0 && showPreview && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="space-y-2"
					>
						{attachedFiles.map((file) => (
							<motion.div
								key={file.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
							>
								{/* File Icon or Preview */}
								<div className="flex-shrink-0">
									{file.type === 'image' && file.preview ? (
										<img 
											src={file.preview} 
											alt={file.name}
											className="w-10 h-10 object-cover rounded"
										/>
									) : (
										<div className="w-10 h-10 flex items-center justify-center bg-white rounded border">
											{getFileIcon(file.type, 20)}
										</div>
									)}
								</div>
								
								{/* File Info */}
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium text-slate-900 truncate">
										{file.name}
									</div>
									<div className="flex items-center gap-2 text-xs text-slate-500">
										<span>{file.size}</span>
										<span>•</span>
										<span className="capitalize">{file.type}</span>
									</div>
									
									{/* Upload Progress */}
									{uploadProgress[file.id] !== undefined && (
										<div className="mt-2">
											<div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
												<span>Uploading...</span>
												<span>{Math.round(uploadProgress[file.id])}%</span>
											</div>
											<Progress value={uploadProgress[file.id]} className="h-1" />
										</div>
									)}
								</div>
								
								{/* Remove Button */}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onRemoveFile(file.id)}
									className="p-1 h-6 w-6 hover:bg-red-50 hover:text-red-600"
								>
									<X className="w-3 h-3" />
								</Button>
							</motion.div>
						))}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Voice Recordings */}
			<AnimatePresence>
				{voiceRecordings.length > 0 && showPreview && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="space-y-2"
					>
						{voiceRecordings.map((recording) => (
							<motion.div
								key={recording.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200"
							>
								<div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded">
									<Volume2 className="w-5 h-5 text-purple-600" />
								</div>
								
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium text-purple-900">
										Voice Recording
									</div>
									<div className="text-xs text-purple-700">
										{formatTime(recording.duration)} • {recording.timestamp.toLocaleTimeString()}
									</div>
									{recording.transcription && (
										<div className="mt-1 text-xs text-slate-600 italic">
											"{recording.transcription}"
										</div>
									)}
								</div>
								
								<Button
									variant="ghost"
									size="sm"
									onClick={() => playAudioRecording(recording)}
									className="p-2 h-8 w-8 hover:bg-purple-100"
								>
									{isPlayingAudio === recording.id ? (
										<Pause className="w-4 h-4 text-purple-600" />
									) : (
										<Play className="w-4 h-4 text-purple-600" />
									)}
								</Button>
							</motion.div>
						))}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Input Controls */}
			<div className="flex items-center gap-2">
				{/* Attachment Button */}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
					className={`p-2 h-8 w-8 ${
						showAttachmentMenu ? 'bg-blue-50 text-blue-600' : ''
					}`}
					title="Attach files"
					disabled={disabled}
				>
					<Paperclip className="w-3 h-3" />
				</Button>
				
				{/* Voice Recording Button */}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={isRecording ? stopRecording : startRecording}
					className={`p-2 h-8 w-8 ${
						isRecording ? 'bg-red-50 text-red-600 animate-pulse' : ''
					}`}
					title={isRecording ? 'Stop recording' : 'Voice input'}
					disabled={disabled}
				>
					{isRecording ? (
						<MicOff className="w-3 h-3" />
					) : (
						<Mic className="w-3 h-3" />
					)}
				</Button>
				
				{/* Figma Button */}
				{showFigmaButton && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onFigmaClick}
						className="p-2 h-8 w-8 hover:bg-orange-50 hover:text-orange-600"
						title="Import from Figma"
						disabled={disabled}
					>
						<Figma className="w-3 h-3" />
					</Button>
				)}
			</div>

			{/* Hidden File Inputs */}
			<input
				ref={fileInputRef}
				type="file"
				hidden
				multiple
				accept={acceptedTypes.join(',')}
				onChange={handleFileInputChange}
			/>
			<input
				ref={imageInputRef}
				type="file"
				hidden
				multiple
				accept="image/*"
				onChange={handleFileInputChange}
			/>

			{/* Global drag handlers */}
			<div
				className="fixed inset-0 pointer-events-none"
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			/>
		</div>
	)
}

// Hook for using multimodal input in other components
export function useMultiModalInput() {
	const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
	const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([])

	const handleFilesAttached = useCallback((files: AttachedFile[]) => {
		setAttachedFiles(prev => [...prev, ...files])
	}, [])

	const handleVoiceRecording = useCallback((recording: VoiceRecording) => {
		setVoiceRecordings(prev => [...prev, recording])
	}, [])

	const removeFile = useCallback((fileId: string) => {
		setAttachedFiles(prev => prev.filter(f => f.id !== fileId))
	}, [])

	const removeVoiceRecording = useCallback((recordingId: string) => {
		setVoiceRecordings(prev => prev.filter(r => r.id !== recordingId))
	}, [])

	const clearAll = useCallback(() => {
		setAttachedFiles([])
		setVoiceRecordings([])
	}, [])

	return {
		attachedFiles,
		voiceRecordings,
		handleFilesAttached,
		handleVoiceRecording,
		removeFile,
		removeVoiceRecording,
		clearAll,
		hasAttachments: attachedFiles.length > 0 || voiceRecordings.length > 0
	}
}

export type { AttachedFile, VoiceRecording }