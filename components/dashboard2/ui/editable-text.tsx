'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Sparkles, RotateCcw, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  onRegenerate?: () => void
  onMagicEdit?: (instruction: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  label?: string
}

export function EditableText({
  value,
  onChange,
  onRegenerate,
  onMagicEdit,
  placeholder,
  className,
  multiline = false,
  label
}: EditableTextProps) {
  const { toast } = useToast()
  const [isMagicMode, setIsMagicMode] = useState(false)
  const [magicInstruction, setMagicInstruction] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Copied to clipboard" })
  }

  const handleMagicSubmit = () => {
    if (!magicInstruction.trim()) return
    onMagicEdit?.(magicInstruction)
    setMagicInstruction('')
    setIsMagicMode(false)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold">{label}</label>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
              title="Copy"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      )}

      {/* Main Input */}
      <div className="relative group">
        {multiline ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "w-full bg-white/40 dark:bg-black/20 border-black/10 dark:border-white/10",
              "focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20",
              "transition-all resize-none",
              isMagicMode && "border-purple-500/50 ring-1 ring-purple-500/20"
            )}
            placeholder={placeholder}
            rows={4}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "w-full bg-white/40 dark:bg-black/20 border-black/10 dark:border-white/10",
              "focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20",
              "transition-all",
              isMagicMode && "border-purple-500/50 ring-1 ring-purple-500/20"
            )}
            placeholder={placeholder}
          />
        )}

        {/* Floating Action Buttons */}
        {!isMagicMode && (
          <div className="absolute -bottom-9 left-0 right-0 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
            {onMagicEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMagicMode(true)}
                className="h-7 text-xs gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                <Sparkles className="w-3 h-3" />
                Refine with AI
              </Button>
            )}
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3 h-3" />
                Regenerate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Magic Edit Mode */}
      {isMagicMode && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/20 animate-in slide-in-from-top-2 fade-in duration-200">
          <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <Input
            value={magicInstruction}
            onChange={(e) => setMagicInstruction(e.target.value)}
            placeholder="How should AI refine this? (e.g., 'Make it more energetic')"
            className="flex-1 h-8 text-xs bg-white dark:bg-black/20 border-purple-500/20"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleMagicSubmit()
              if (e.key === 'Escape') setIsMagicMode(false)
            }}
          />
          <Button
            size="sm"
            onClick={handleMagicSubmit}
            disabled={!magicInstruction.trim()}
            className="h-8 px-3"
          >
            Apply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMagicMode(false)}
            className="h-8 px-3"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
