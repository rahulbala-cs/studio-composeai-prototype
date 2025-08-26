'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Star } from 'lucide-react'

interface TestimonialsComponentProps {
  data: {
    title?: string
    subtitle?: string
    backgroundColor?: string
    testimonials: Array<{
      name: string
      role: string
      content: string
      rating?: number
      image?: string
    }>
  }
}

export function TestimonialsComponent({ data }: TestimonialsComponentProps) {
  const renderStars = (rating: number = 5) => {
    return (
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, index) => (
          <Star 
            key={index} 
            className={`w-4 h-4 ${
              index < rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div 
        className="p-8 lg:p-12"
        style={{
          background: data.backgroundColor || undefined
        }}
      >
        {/* Header */}
        {(data.title || data.subtitle) && (
          <div className="text-center mb-12">
            {data.title && (
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                data.backgroundColor ? 'text-white' : 'text-foreground'
              }`}>
                {data.title}
              </h2>
            )}
            {data.subtitle && (
              <p className={`text-lg ${
                data.backgroundColor ? 'text-white/90' : 'text-muted-foreground'
              }`}>
                {data.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Testimonials Grid */}
        <div className={`grid gap-8 ${
          data.testimonials.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
          data.testimonials.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {data.testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg border ${
                data.backgroundColor 
                  ? 'bg-white/10 border-white/20 backdrop-blur-sm' 
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {/* Rating */}
              {testimonial.rating && renderStars(testimonial.rating)}

              {/* Content */}
              <blockquote className={`text-base mb-4 leading-relaxed ${
                data.backgroundColor ? 'text-white/90' : 'text-slate-700'
              }`}>
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                {testimonial.image && (
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className={`font-medium ${
                    data.backgroundColor ? 'text-white' : 'text-slate-900'
                  }`}>
                    {testimonial.name}
                  </div>
                  <div className={`text-sm ${
                    data.backgroundColor ? 'text-white/70' : 'text-slate-500'
                  }`}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Overlay */}
      <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
        <div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-muted-foreground border">
          Testimonials Component
        </div>
      </div>
    </Card>
  )
}