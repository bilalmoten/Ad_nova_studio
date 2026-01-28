'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Sparkles, Send, Copy, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface SmartInputProps {
  value: string
  onChange: (value: string) => void
  onRegenerate?: () => void
  onMagicEdit?: (prompt: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  minRows?: number
}

export function SmartInput({
  value,
  onChange,
  onRegenerate,
  onMagicEdit,
  placeholder,
  className,
  multiline = false,
  minRows = 3
}: SmartInputProps) {
  const { toast } = useToast()
  const [isMagicMode, setIsMagicMode] = useState(false)
  const [magicPrompt, setMagicPrompt] = useState('')

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    toast({ title: "Copied to clipboard" })
  }

  const handleMagicSubmit = () => {
    if (!magicPrompt.trim()) return
    onMagicEdit?.(magicPrompt)
    setMagicPrompt('')
    setIsMagicMode(false)
    toast({ title: "Magic Edit Applied", description: "Your text has been refined." })
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative group">
        {/* Main Input */}
        {multiline ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/40 dark:bg-black/20 border-black/5 dark:border-white/10 focus:border-purple-500/50 resize-y pr-10 transition-colors"
            placeholder={placeholder}
            rows={minRows}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/40 dark:bg-black/20 border-black/5 dark:border-white/10 focus:border-purple-500/50 pr-10 transition-colors"
            placeholder={placeholder}
          />
        )}

        {/* Floating Actions (Copy) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/10" 
                onClick={handleCopy}
                title="Copy text"
            >
                <Copy className="w-3 h-3" />
            </Button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between gap-2">
         {/* Magic Edit Toggle */}
         {isMagicMode ? (
            <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-left-2 fade-in duration-200">
               <Input 
                  value={magicPrompt}
                  onChange={(e) => setMagicPrompt(e.target.value)}
                  placeholder="How should AI change this? (e.g. 'Make it punchier')"
                  className="h-8 text-xs bg-purple-500/5 border-purple-500/20 focus:border-purple-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleMagicSubmit()}
               />
               <Button size="sm" className="h-8 w-8 px-0 shrink-0" onClick={handleMagicSubmit}>
                  <Send className="w-3 h-3" />
               </Button>
               <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs shrink-0" 
                  onClick={() => setIsMagicMode(false)}
                >
                  Cancel
               </Button>
            </div>
         ) : (
            <div className="flex gap-2">
               {onMagicEdit && (
                   <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsMagicMode(true)}
                        className="h-7 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-2 -ml-2 gap-1.5"
                    >
                        <Sparkles className="w-3 h-3" />
                        Edit with AI
                   </Button>
               )}
               {onRegenerate && (
                   <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onRegenerate}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 gap-1.5"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Regenerate
                   </Button>
               )}
            </div>
         )}
      </div>
    </div>
  )
}
