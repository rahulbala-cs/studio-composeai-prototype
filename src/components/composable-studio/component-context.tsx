'use client'

import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { PageComponent } from '@/types'

export interface ComponentContext {
	selectedComponentId: string | null
	hoveredComponentId: string | null
	selectedComponent: PageComponent | null
	hoveredComponent: PageComponent | null
	allComponents: PageComponent[]
	selectionHistory: Array<{
		componentId: string
		timestamp: Date
		action: 'selected' | 'deselected' | 'hovered' | 'unhovered'
	}>
}

export interface ComponentContextActions {
	selectComponent: (componentId: string | null) => void
	hoverComponent: (componentId: string | null) => void
	updateComponent: (componentId: string, updates: Partial<PageComponent>) => void
	updateAllComponents: (components: PageComponent[]) => void
	getComponentBreadcrumb: (componentId?: string) => string
}

interface ComponentContextProviderProps {
	children: React.ReactNode
	initialComponents?: PageComponent[]
}

const ComponentContextContext = createContext<{
	context: ComponentContext
	actions: ComponentContextActions
} | null>(null)

export function ComponentContextProvider({ 
	children, 
	initialComponents = [] 
}: ComponentContextProviderProps) {
	const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
	const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null)
	const [allComponents, setAllComponents] = useState<PageComponent[]>(initialComponents)
	const [selectionHistory, setSelectionHistory] = useState<ComponentContext['selectionHistory']>([])

	// Get selected and hovered components
	const selectedComponent = allComponents.find(c => c.id === selectedComponentId) || null
	const hoveredComponent = allComponents.find(c => c.id === hoveredComponentId) || null

	// Actions
	const selectComponent = (componentId: string | null) => {
		const previousId = selectedComponentId
		setSelectedComponentId(componentId)
		
		// Add to history
		const timestamp = new Date()
		setSelectionHistory(prev => [
			...prev,
			...(previousId ? [{ componentId: previousId, timestamp, action: 'deselected' as const }] : []),
			...(componentId ? [{ componentId, timestamp, action: 'selected' as const }] : [])
		].slice(-20)) // Keep last 20 actions
	}

	const hoverComponent = (componentId: string | null) => {
		const previousId = hoveredComponentId
		setHoveredComponentId(componentId)
		
		// Add to history for analytics (optional)
		const timestamp = new Date()
		if (previousId !== componentId) {
			setSelectionHistory(prev => [
				...prev,
				...(previousId ? [{ componentId: previousId, timestamp, action: 'unhovered' as const }] : []),
				...(componentId ? [{ componentId, timestamp, action: 'hovered' as const }] : [])
			].slice(-20))
		}
	}

	const updateComponent = (componentId: string, updates: Partial<PageComponent>) => {
		setAllComponents(prev => 
			prev.map(component => 
				component.id === componentId 
					? { ...component, ...updates }
					: component
			)
		)
	}

	const updateAllComponents = (components: PageComponent[]) => {
		setAllComponents(components)
	}


	const getComponentBreadcrumb = (componentId?: string) => {
		const id = componentId || selectedComponentId
		if (!id) return 'No component selected'
		
		const component = allComponents.find(c => c.id === id)
		if (!component) return 'Component not found'
		
		const typeMap: Record<string, string> = {
			'hero': 'Hero Section',
			'two-column-hero': 'Two-Column Hero',
			'features': 'Features Section',
			'cta': 'Call-to-Action',
			'text': 'Text Block',
			'image': 'Image',
			'testimonials': 'Testimonials',
			'section': 'Section',
			'grid': 'Grid Layout'
		}
		
		const componentName = typeMap[component.type] || component.type
		const title = component.data?.title || component.data?.name || 'Untitled'
		
		return `${componentName}${title !== 'Untitled' ? ` • ${title}` : ''}`
	}

	const contextValue = {
		context: {
			selectedComponentId,
			hoveredComponentId,
			selectedComponent,
			hoveredComponent,
			allComponents,
			selectionHistory
		},
		actions: {
			selectComponent,
			hoverComponent,
			updateComponent,
			updateAllComponents,
			getComponentBreadcrumb
		}
	}

	return (
		<ComponentContextContext.Provider value={contextValue}>
			{children}
		</ComponentContextContext.Provider>
	)
}

export function useComponentContext() {
	const context = useContext(ComponentContextContext)
	if (!context) {
		throw new Error('useComponentContext must be used within a ComponentContextProvider')
	}
	return context
}

// Hook for easier access to just the context data
export function useSelectedComponent() {
	const { context } = useComponentContext()
	return {
		selectedComponent: context.selectedComponent,
		selectedComponentId: context.selectedComponentId,
		isComponentSelected: !!context.selectedComponentId
	}
}

