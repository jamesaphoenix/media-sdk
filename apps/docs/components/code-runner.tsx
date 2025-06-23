'use client';

import { useState } from 'react';
import { Play, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from 'fumadocs-ui/components/button';

interface CodeRunnerProps {
  code: string;
  language?: string;
  title?: string;
  description?: string;
}

export function CodeRunner({ code, language = 'typescript', title, description }: CodeRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');

    try {
      // Simulate running the code
      // In a real implementation, this would execute the code
      setOutput(`// FFmpeg Command Generated:
ffmpeg -i input.mp4 -filter_complex "[0:v]scale=1080:1920,drawtext=text='Hello World':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2[v]" -map "[v]" -map 0:a? output.mp4

// Timeline JSON:
{
  "layers": [
    { "type": "video", "source": "input.mp4" },
    { "type": "text", "text": "Hello World", "position": "center" }
  ],
  "duration": 10,
  "resolution": { "width": 1080, "height": 1920 }
}`);
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border">
      {(title || description) && (
        <div className="border-b bg-muted/30 px-4 py-3">
          {title && <h4 className="text-sm font-semibold">{title}</h4>}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-sm">
          <code className={`language-${language}`}>{code}</code>
        </pre>
        
        <div className="absolute right-2 top-2 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-8 px-2"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRun}
            disabled={isRunning}
            className="h-8 px-3"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play className="mr-1 h-3.5 w-3.5" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>
      
      {output && (
        <div className="border-t bg-muted/20">
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
            Output
          </div>
          <pre className="overflow-x-auto px-4 pb-4 text-xs">
            <code>{output}</code>
          </pre>
        </div>
      )}
    </div>
  );
}