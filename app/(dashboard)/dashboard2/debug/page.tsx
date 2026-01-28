'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard2/layout/dashboard-layout'
import { GlassCard } from '@/components/dashboard2/ui/glass-card'
import { GradientButton } from '@/components/dashboard2/ui/gradient-button'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Image as ImageIcon, Video, Check, X, Copy, Download, Key, Server as ServerIcon, Globe } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type TestType = 'text' | 'image' | 'video'
type ProviderType = 'gemini' | 'openam'

interface TestResult {
  type: TestType
  success: boolean
  model: string
  durationMs?: number
  data?: string
  error?: string
  images?: Array<{ dataUrl: string; mimeType: string }>
  video?: { url?: string; dataUrl?: string; isUrl: boolean }
}

export default function DebugPage() {
  const [activeTest, setActiveTest] = useState<TestType>('text')
  const [activeProvider, setActiveProvider] = useState<ProviderType>('gemini')
  
  // Azure state
  const [azureEndpoint, setAzureEndpoint] = useState('')
  const [azureKey, setAzureKey] = useState('')

  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const defaultPrompts = {
    text: 'Generate a catchy tagline for an innovative tech startup that makes AI-powered coffee machines',
    image: 'A sleek modern coffee machine on a marble countertop, morning sunlight streaming through windows, steam rising from a freshly brewed espresso, photorealistic, 4k',
    video: 'Slow-motion pour of creamy latte art being created in a coffee cup, warm ambient lighting, cinematic quality',
  }

  // Model Mapping
  const models = {
    gemini: {
       text: 'gemini-3-pro-preview',
       image: 'gemini-3-pro-image-preview',
       video: 'veo-3.1-fast-generate-preview'
    },
    openam: {
       text: 'gpt-5.2',
       image: 'gpt-image-1',
       video: 'sora-2'
    }
  }

  const runTest = async () => {
    if (!prompt.trim()) return
    
    setIsLoading(true)
    setResult(null)

    try {
      const payload: any = { 
          prompt,
          model: models[activeProvider][activeTest]
      }

      if (activeProvider === 'openam') {
          payload.azureEndpoint = azureEndpoint
          payload.azureKey = azureKey
      }

      const response = await fetch(`/api/studio/debug?type=${activeTest}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        type: activeTest,
        success: false,
        model: 'unknown',
        error: error instanceof Error ? error.message : 'Request failed',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyResult = () => {
    if (result) {
      // Copy without the large base64 data
      const copyData = { ...result }
      if (copyData.images) {
        copyData.images = copyData.images.map(img => ({ ...img, dataUrl: '[base64 data]' }))
      }
      if (copyData.video?.dataUrl) {
        copyData.video = { ...copyData.video, dataUrl: '[base64 data]' }
      }
      navigator.clipboard.writeText(JSON.stringify(copyData, null, 2))
    }
  }

  const downloadImage = (dataUrl: string, index: number) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `generated-image-${index + 1}.png`
    link.click()
  }

  const downloadVideo = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = 'generated-video.mp4'
    link.target = '_blank'
    link.click()
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Debug Console</h1>
          <p className="text-muted-foreground">
            Test and validate AI model integration directly
          </p>
        </div>

        {/* Configuration */}
        <GlassCard className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ServerIcon className="w-5 h-5 text-purple-400" />
                Configuration
            </h2>

            <div className="space-y-6">
                {/* Provider Selector */}
                <div>
                   <Label className="mb-2 block">AI Provider</Label>
                   <Tabs value={activeProvider} onValueChange={(v) => setActiveProvider(v as ProviderType)}>
                        <TabsList className="bg-black/20">
                            <TabsTrigger value="gemini" className="gap-2">
                                <Sparkles className="w-4 h-4" /> Google Gemini
                            </TabsTrigger>
                            <TabsTrigger value="openam" className="gap-2">
                                <Globe className="w-4 h-4" /> OpenAM / Azure
                            </TabsTrigger>
                        </TabsList>
                   </Tabs>
                </div>

                {/* Azure Secrets (Only if OpenAM) */}
                {activeProvider === 'openam' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="col-span-full">
                            <p className="text-xs text-blue-300 mb-2">
                                Leave blank to use server environment variables (AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY).
                            </p>
                        </div>
                        <div>
                            <Label className="mb-2 block text-xs">Azure Endpoint</Label>
                            <Input 
                                value={azureEndpoint}
                                onChange={(e) => setAzureEndpoint(e.target.value)}
                                placeholder="Start with https://..."
                                className="bg-black/30 border-white/10 font-mono text-xs"
                            />
                        </div>
                        <div>
                            <Label className="mb-2 block text-xs">Azure API Key</Label>
                            <Input 
                                type="password"
                                value={azureKey}
                                onChange={(e) => setAzureKey(e.target.value)}
                                placeholder="Optional if in .env"
                                className="bg-black/30 border-white/10 font-mono text-xs"
                            />
                        </div>
                    </div>
                )}
            </div>
        </GlassCard>

        {/* Test Type Selector */}
        <div className="flex gap-4 mb-6">
          {[
            { type: 'text' as TestType, icon: Sparkles, label: 'Text Generation' },
            { type: 'image' as TestType, icon: ImageIcon, label: 'Image Generation' },
            { type: 'video' as TestType, icon: Video, label: 'Video Generation' },
          ].map(({ type, icon: Icon, label }) => (
            <GlassCard
              key={type}
              className={`flex-1 p-4 cursor-pointer transition-all ${
                activeTest === type 
                  ? 'ring-2 ring-purple-500 bg-purple-500/10' 
                  : 'hover:bg-white/5'
              }`}
              onClick={() => {
                setActiveTest(type)
                setPrompt(defaultPrompts[type])
                setResult(null)
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activeTest === type ? 'bg-purple-500' : 'bg-white/10'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">{label}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                      {models[activeProvider][type]}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Prompt Input */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold">Prompt</label>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setPrompt(defaultPrompts[activeTest])}
              className="text-xs"
            >
              Use Default
            </Button>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Enter your ${activeTest} generation prompt...`}
            className="min-h-[120px] bg-black/20 border-white/10"
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-muted-foreground">
              {activeTest === 'video' && (
                <span className="text-yellow-500">
                    {activeProvider === 'openam' ? '⚠️ Sora 2 generation may take 2-10 minutes' : '⚠️ Veo generation may take 2-5 minutes'}
                </span>
              )}
            </div>
            <GradientButton 
              onClick={runTest} 
              disabled={isLoading || !prompt.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Test
                </>
              )}
            </GradientButton>
          </div>
        </GlassCard>

        {/* Result */}
        {result && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {result.success ? (
                  <div className="p-2 rounded-full bg-green-500/20">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                ) : (
                  <div className="p-2 rounded-full bg-red-500/20">
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                )}
                <div>
                  <div className="font-semibold">
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Model: {result.model} • {result.durationMs ? `${(result.durationMs / 1000).toFixed(1)}s` : 'N/A'}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={copyResult}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>

            {result.error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                <div className="text-sm text-red-400 font-mono whitespace-pre-wrap">{result.error}</div>
              </div>
            )}

            {result.success && (
              <div className="space-y-4">
                {/* Text result */}
                {result.type === 'text' && result.data && (
                  <div className="p-4 rounded-lg bg-black/20 border border-white/10">
                    <pre className="text-sm whitespace-pre-wrap">
                      {typeof result.data === 'string' 
                        ? result.data 
                        : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Image result - ACTUAL IMAGE DISPLAY */}
                {result.type === 'image' && result.images && result.images.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Generated {result.images.length} image{result.images.length !== 1 ? 's' : ''}
                    </div>
                    <div className="grid gap-4">
                      {result.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={img.dataUrl} 
                            alt={`Generated image ${index + 1}`}
                            className="w-full rounded-lg border border-white/10"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => downloadImage(img.dataUrl, index)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video result - ACTUAL VIDEO PLAYER */}
                {result.type === 'video' && result.video && (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Video generated successfully!
                    </div>
                    <div className="relative group">
                      <video 
                        src={result.video.isUrl ? result.video.url : result.video.dataUrl}
                        controls
                        autoPlay
                        loop
                        className="w-full rounded-lg border border-white/10"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => downloadVideo(result.video?.isUrl ? result.video.url! : (result.video?.dataUrl || ''))}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    {result.video.isUrl && (
                      <div className="text-xs text-muted-foreground">
                        Video URL: <code className="bg-white/10 px-1 py-0.5 rounded">{result.video.url}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Raw JSON */}
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                View raw response (without media data)
              </summary>
              <pre className="mt-2 p-4 rounded-lg bg-black/30 text-xs font-mono overflow-auto max-h-64">
                {JSON.stringify({
                  ...result,
                  images: result.images?.map(img => ({ ...img, dataUrl: '[base64 truncated]' })),
                  video: result.video ? { ...result.video, dataUrl: result.video.dataUrl ? '[base64 truncated]' : undefined } : undefined,
                }, null, 2)}
              </pre>
            </details>
          </GlassCard>
        )}

        {/* Info */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Models can be changed in <code className="bg-white/10 px-1 py-0.5 rounded">lib/ai/studio-client.ts</code></p>
          <p className="mt-1">Prompts can be customized in <code className="bg-white/10 px-1 py-0.5 rounded">lib/studio/prompts.ts</code></p>
        </div>
      </div>
    </DashboardLayout>
  )
}
