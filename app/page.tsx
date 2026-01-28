import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  Code2, 
  Database, 
  Film,
  Layers, 
  Rocket, 
  Shield, 
  Sparkles,
  Terminal,
  Zap
} from "lucide-react";
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="flex justify-center mb-6">
          <Badge variant="secondary" className="px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Empowering the Next Generation of Advertisers
          </Badge>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Create Viral Ads with
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            {" "}AdNova AI
          </span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          The all-in-one AI Video Studio. Transform your concepts into high-converting video ads in minutes, not days.
        </p>
        
        <div className="flex gap-4 justify-center">
          {user ? (
            <Link href="/dashboard2">
              <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                Go to Studio <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/signin">
                <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  Start Creating <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline">
                  View Templates
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">The Future of Ad Creation</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>AI Concept Engine</CardTitle>
              <CardDescription>
                Turn simple text prompts into high-impact advertising concepts automatically.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-violet-600" />
              </div>
              <CardTitle>Smart Storyboarding</CardTitle>
              <CardDescription>
                Visualize your ad shot-by-shot with AI-generated storyboards and scene descriptions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/20 flex items-center justify-center mb-4">
                <Film className="w-6 h-6 text-fuchsia-600" />
              </div>
              <CardTitle>One-Click Production</CardTitle>
              <CardDescription>
                Go from storyboard to final video with cinematic AI generation and smooth transitions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Instant Iteration</CardTitle>
              <CardDescription>
                Swap shots, refine prompts, and adjust concepts in real-time until it&apos;s perfect.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-cyan-600" />
              </div>
              <CardTitle>Professional Exports</CardTitle>
              <CardDescription>
                Download your ads in high resolution, ready for YouTube, TikTok, or Instagram.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-rose-600" />
              </div>
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Your data and assets are protected with industry-leading encryption and RLS.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Code Examples */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Quick Start</h2>
        
        <Tabs defaultValue="setup" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="component">Component</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup">
            <Card>
              <CardHeader>
                <CardTitle>Get up and running</CardTitle>
                <CardDescription>Clone the repo and install dependencies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-950 rounded-lg p-4 font-mono text-sm text-zinc-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-400">Terminal</span>
                  </div>
                  <pre className="overflow-x-auto">
{`# Clone the repository
git clone https://github.com/your-repo/nextjs-supabase-starter.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Type-safe database queries</CardTitle>
                <CardDescription>Generated types from your schema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-950 rounded-lg p-4 font-mono text-sm text-zinc-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-400">server/queries/posts.ts</span>
                  </div>
                  <pre className="overflow-x-auto">
{`import { createClient } from '@/lib/supabase/server'

export async function getPosts() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!inner(username)')
    .order('created_at', { ascending: false })
    
  if (error) throw error
  return data // Fully typed!
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="component">
            <Card>
              <CardHeader>
                <CardTitle>Server Components by default</CardTitle>
                <CardDescription>Fetch data directly in components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-950 rounded-lg p-4 font-mono text-sm text-zinc-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-400">app/posts/page.tsx</span>
                  </div>
                  <pre className="overflow-x-auto">
{`export default async function PostsPage() {
  const posts = await getPosts()
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Posts</h1>
      <div className="grid gap-4">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to launch your next campaign?</h2>
            <p className="text-xl mb-8 text-indigo-50">
              Join thousands of creators using AdNova to scale their video production.
            </p>
            <div className="flex gap-4 justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Open Studio <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/signin">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Get Started Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <Button size="lg" variant="ghost" className="text-white hover:text-white hover:bg-white/20">
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
