import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex h-screen flex-col items-center justify-center text-center">
      <div className="container max-w-4xl px-4">
        <h1 className="mb-4 text-4xl font-bold text-fd-foreground md:text-6xl">
          🎬 Media SDK
        </h1>
        <p className="mb-8 text-xl text-fd-muted-foreground md:text-2xl">
          Declarative, AI-friendly API for video manipulation using FFmpeg
        </p>
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          <Link 
            href="/docs"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Get Started
          </Link>
          <Link 
            href="/docs/examples"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            View Examples
          </Link>
          <Link 
            href="https://github.com/jamesaphoenix/media-sdk" 
            target="_blank"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            GitHub
          </Link>
        </div>
        
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 font-semibold">🤖 AI-First Design</h3>
              <p className="text-sm text-fd-muted-foreground">
                Purpose-built for LLM integration and automation workflows
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 font-semibold">🧬 Self-Healing</h3>
              <p className="text-sm text-fd-muted-foreground">
                Automatic quality validation and optimization with AI vision
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 font-semibold">📱 Platform Ready</h3>
              <p className="text-sm text-fd-muted-foreground">
                Built-in TikTok, YouTube, Instagram optimization presets
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}