import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Bot, Target, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold">
            <BarChart3 className="h-6 w-6" />
            AI Visibility
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Track Your Brand&apos;s
            <br />
            <span className="text-primary">AI Visibility</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Monitor how ChatGPT, Claude, and Gemini mention your brand. Understand your visibility,
            track competitors, and optimize your AI presence.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything you need to optimize AI visibility
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-background p-6">
                <div className="mb-4 inline-block rounded-lg bg-primary/10 p-3">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Multi-LLM Monitoring</h3>
                <p className="text-muted-foreground">
                  Track mentions across ChatGPT, Claude, and Gemini. See how each AI model perceives
                  your brand.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <div className="mb-4 inline-block rounded-lg bg-primary/10 p-3">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Competitor Analysis</h3>
                <p className="text-muted-foreground">
                  Compare your visibility against competitors. Understand where you stand in
                  AI-generated recommendations.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <div className="mb-4 inline-block rounded-lg bg-primary/10 p-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Actionable Insights</h3>
                <p className="text-muted-foreground">
                  Get recommendations to improve your visibility. Analyze what content performs best
                  with AI models.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          AI Visibility Clone - Built with Next.js, Prisma, and OpenAI
        </div>
      </footer>
    </div>
  );
}
