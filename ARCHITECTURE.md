# Studio AI Prototype - Architecture Overview

## Product Vision
A visual-first, context-aware AI assistant that transforms how users create and edit web content. The system "sees what the user sees and shows what it intends to do," turning the canvas into an interactive part of the conversation through a "Propose & Confirm" (Ghost Mode) workflow.

## Core Philosophy
- **Visual-First Interaction**: AI understands visual context and responds with visual previews
- **Safe & Controllable**: Every AI action is previewed before being applied
- **Context-Aware**: AI knows what component is selected and tailors responses accordingly
- **Multimodal Input**: Supports text, images, voice, and Figma integration
- **Component-Scoped Conversations**: AI can focus on specific page elements

## System Architecture

### 1. Main Application Structure

```
src/
├── app/                           # Next.js app router
│   ├── page.tsx                   # Main entry point
│   └── prototype/                 # Standalone prototype page
├── components/
│   ├── studio-prototype.tsx       # Main application orchestrator
│   ├── composable-studio/         # Core studio components
│   ├── page-components/           # Renderable page components
│   ├── ghost-mode/               # Ghost Mode system
│   └── ui/                       # Base UI components
├── contexts/                     # React contexts for state management
└── utils/                       # Utility functions and integrations
```

### 2. Core System Components

#### **StudioPrototype** (Main Orchestrator)
- **Location**: `src/components/studio-prototype.tsx`
- **Purpose**: Top-level component managing view states and component data
- **Key Features**:
  - Manages `compositions` vs `canvas` view modes
  - Handles component CRUD operations
  - Provides component update handlers for Ghost Mode
  - Wraps app with `ComponentContextProvider` and `GhostModeProvider`

#### **StudioCanvas** (Visual Rendering Engine)
- **Location**: `src/components/composable-studio/studio-canvas.tsx`
- **Purpose**: Renders page components with selection and hover states
- **Key Features**:
  - Renders `PageComponent[]` array with proper styling
  - Integrates AI Spark hover interactions
  - Shows Ghost Mode visual previews with shimmer effects
  - Supports component selection and context updating
  - Applies Ghost Mode changes temporarily for preview

#### **ComposePanel** (AI Chat Interface)
- **Location**: `src/components/composable-studio/compose-panel.tsx`
- **Purpose**: Natural language interface for content creation and editing
- **Key Features**:
  - Context-aware chat with dynamic placeholders
  - Ghost Mode command processing and response generation
  - Visual status indicators for processing and preview states
  - Context bar showing "Selected: [Component] • Page: [Page]" format
  - Integration with multimodal input (images, voice, Figma)

### 3. Ghost Mode System (Core Innovation)

#### **GhostModeProvider** (State Management)
- **Location**: `src/contexts/ghost-mode-context.tsx`
- **Purpose**: Manages the "Propose & Confirm" workflow state
- **Features**:
  - Tracks selected components and proposed changes
  - Processes commands with scripted AI responses
  - Manages processing and active preview states
  - Provides component update callbacks

#### **GhostPreviewOverlay** (Visual Preview System)
- **Location**: `src/components/ghost-mode/ghost-preview-overlay.tsx`
- **Purpose**: Creates visual preview effects during Ghost Mode
- **Features**:
  - Dims non-selected content (60% opacity)
  - Adds shimmering blue outline to selected components
  - Shows floating Accept/Discard action bar
  - CSS animations for smooth transitions

#### **AISpark** (Interaction Trigger)
- **Location**: `src/components/ghost-mode/ai-spark.tsx`
- **Purpose**: Hover-triggered entry point for AI interactions
- **Features**:
  - Animated sparkles with pulsing rings
  - Appears on component hover when not selected
  - Triggers component selection and AI focus

### 4. Component System

#### **PageComponent Interface** (Data Structure)
```typescript
interface PageComponent {
  id: string
  type: 'hero' | 'two-column-hero' | 'features' | 'cta'
  data: {
    title?: string
    description?: string
    backgroundColor?: string  // Ghost Mode support
    buttonText?: string      // Ghost Mode support
    // ... other component-specific props
  }
  position: { x: number; y: number }
  visible: boolean
}
```

#### **Renderable Components** (Visual Elements)
- **HeroComponent**: Full-width hero sections with background and CTA support
- **TwoColumnHero**: Split-layout heroes with image and content
- **FeaturesComponent**: Feature grid/list displays
- **CtaComponent**: Call-to-action buttons and sections

All components support:
- Ghost Mode props (`backgroundColor`, `buttonText`)
- Selection states with visual feedback
- Data-driven rendering from `PageComponent` data

### 5. Context Management

#### **ComponentContextProvider** (Selection State)
- **Location**: `src/components/composable-studio/component-context.tsx`
- **Purpose**: Manages component selection, hover states, and history
- **Features**:
  - Tracks `selectedComponentId` and `hoveredComponentId`
  - Provides component breadcrumb generation
  - Maintains selection history for undo/redo
  - Syncs with external component state

#### **State Flow**:
```
User Hovers Component → ComponentContext updates → AI Spark appears
User Clicks Component → ComponentContext + GhostMode update → Context Bar updates
User Types Command → GhostMode processes → Visual Preview activates
User Accepts/Discards → Component data updates → Visual changes apply/revert
```

### 6. AI Integration Points

#### **Command Processing Pipeline**
1. **Input Capture**: ComposePanel receives user command
2. **Context Check**: Determines if component is selected for Ghost Mode
3. **Command Analysis**: Scripted responses based on command patterns
4. **Preview Generation**: GhostMode creates proposed changes object
5. **Visual Feedback**: Canvas shows preview with shimmer effects
6. **User Decision**: Accept applies changes, Discard reverts to original

#### **Multimodal Input System**
- **Text**: Natural language commands and conversations
- **Images**: Visual analysis with design token extraction
- **Voice**: Audio recording with transcription
- **Figma**: Design URL import with token analysis

### 7. Key User Flows

#### **Primary Ghost Mode Flow** (Core Innovation)
```
1. User hovers hero component → AI Spark appears
2. User clicks spark/component → Context bar shows "Selected: Hero • Landing Page"
3. User types: "Change the background to a dark gradient and make the button text 'Shop Now'"
4. System shows "Processing..." → Ghost Mode activates with visual preview
5. User sees dimmed page + shimmering hero with dark gradient + "Shop Now" button
6. Floating action bar appears: [✅ Accept] [❌ Discard]
7. User clicks Accept → Changes apply permanently
```

#### **Content Creation Flow**
```
1. User starts with empty canvas or composition template
2. User types: "Create a landing page for smart headphones"
3. AI generates multiple PageComponents with realistic content
4. Components appear on canvas with selection/editing capabilities
5. User can select any component to enter Ghost Mode for refinements
```

### 8. Technical Implementation Details

#### **State Synchronization**
- **ComponentContext**: Manages selection across all components
- **GhostMode**: Handles preview states and proposed changes
- **StudioPrototype**: Maintains source of truth for component data
- **ComposePanel**: Reflects context changes in UI and chat

#### **Visual Effects**
- **Shimmer Animation**: CSS keyframes with linear gradients
- **Dimming Effect**: Framer Motion opacity transitions
- **Selection Feedback**: Blue outline with pulsing glow animations
- **Loading States**: Rotating spinners and progress indicators

#### **Data Flow**
```
PageComponent[] → StudioCanvas → Renders with Ghost Mode overlays
User Interaction → ComponentContext → Updates selection state
Command Input → GhostMode → Generates proposed changes
Accept Action → StudioPrototype → Updates PageComponent data
```

### 9. Extension Points

#### **Adding New Component Types**
1. Create component in `src/components/page-components/`
2. Add type to `PageComponent` interface
3. Add render case in `StudioCanvas.renderComponent()`
4. Ensure Ghost Mode props support (`backgroundColor`, `buttonText`, etc.)

#### **Adding New Ghost Mode Commands**
1. Extend `generateScriptedResponse()` in `ghost-mode-context.tsx`
2. Add command patterns and response logic
3. Update `ProposedChange` interface if needed
4. Test with component rendering

#### **Enhancing Visual Effects**
1. Modify CSS animations in `ghost-preview-overlay.tsx`
2. Add new animation keyframes in global styles
3. Update Framer Motion configurations
4. Test across different component types

### 10. Development Guidelines

#### **State Management Principles**
- Use React Context for cross-component state
- Keep component data in parent (StudioPrototype)
- Sync external state with internal context
- Avoid prop drilling for frequently accessed state

#### **Component Design Principles**
- Support Ghost Mode props for visual previews
- Implement selection visual feedback
- Use `data-component-id` for DOM targeting
- Maintain responsive design across all states

#### **Ghost Mode Integration Checklist**
- [ ] Component supports `backgroundColor` prop
- [ ] Component supports `buttonText` prop  
- [ ] Component renders properly with Ghost Mode changes
- [ ] Selection outline appears correctly
- [ ] Shimmer effect works on component
- [ ] Accept/Discard actions work as expected

This architecture enables rapid feature development while maintaining the core visual-first, context-aware AI experience that makes users feel safe and empowered when working with AI assistance.