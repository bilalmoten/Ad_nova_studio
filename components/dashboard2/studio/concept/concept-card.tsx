'use client'

import { useState } from 'react'
import { Concept } from '@/lib/dashboard2/types'
import { GlassCard } from '../../ui/glass-card'
import { ChevronDown, ChevronUp, Edit, Sparkles, RefreshCw } from 'lucide-react'
import { getGradientFromId } from '@/lib/dashboard2/utils'
import { cn } from '@/lib/utils'
import { GradientButton } from '../../ui/gradient-button'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface ConceptCardProps {
  concept: Concept
  onSelect: () => void
  onEdit: () => void
  onRegenerate: () => void
}

export function ConceptCard({ concept, onSelect, onEdit, onRegenerate }: ConceptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard hover className="overflow-hidden">
        {/* Hero Image */}
        <div className={cn(
          'aspect-video bg-gradient-to-br flex items-center justify-center',
          getGradientFromId(concept.id)
        )}>
          <Sparkles className="w-16 h-16 text-white/30" />
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold mb-1">{concept.name}</h3>
              <p className="text-sm text-purple-400">{concept.tagline}</p>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {concept.description}
          </p>
          
          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 mb-4"
              >
                <div>
                  <h4 className="text-xs font-semibold text-purple-400 mb-2">Visual Style</h4>
                  <p className="text-sm text-muted-foreground">{concept.visualStyle}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-pink-400 mb-2">Color Palette</h4>
                  <p className="text-sm text-muted-foreground">{concept.colorPalette}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-purple-400 mb-2">Camera Work</h4>
                  <p className="text-sm text-muted-foreground">{concept.cameraWork}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-pink-400 mb-2">Pacing</h4>
                  <p className="text-sm text-muted-foreground">{concept.pacing}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-purple-400 mb-2">Key Moments</h4>
                  <ul className="space-y-1">
                    {concept.keyMoments.map((moment, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-pink-400 mt-0.5">•</span>
                        <span>{moment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </Button>
            {isExpanded && (
              <GradientButton
                onClick={onSelect}
                size="sm"
                className="ml-auto"
              >
                Select Concept
              </GradientButton>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
