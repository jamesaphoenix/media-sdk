'use client';

import { useState } from 'react';
import { Sliders, RotateCw } from 'lucide-react';
import { Button } from 'fumadocs-ui/components/button';

interface FilterValue {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hue: number;
}

const defaultValues: FilterValue = {
  brightness: 0,
  contrast: 1,
  saturation: 1,
  blur: 0,
  hue: 0
};

export function FilterPlayground() {
  const [filters, setFilters] = useState<FilterValue>(defaultValues);
  const [showCode, setShowCode] = useState(false);

  const updateFilter = (key: keyof FilterValue, value: number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setFilters(defaultValues);
  };

  const generateCode = () => {
    const filterCommands: string[] = [];
    
    if (filters.brightness !== 0) {
      filterCommands.push(`.addFilter('brightness', { value: ${filters.brightness} })`);
    }
    
    if (filters.contrast !== 1) {
      filterCommands.push(`.addFilter('contrast', { value: ${filters.contrast} })`);
    }
    
    if (filters.saturation !== 1) {
      filterCommands.push(`.addFilter('saturation', { value: ${filters.saturation} })`);
    }
    
    if (filters.blur > 0) {
      filterCommands.push(`.addFilter('blur', { radius: ${filters.blur} })`);
    }
    
    if (filters.hue !== 0) {
      filterCommands.push(`.addFilter('hue', { degrees: ${filters.hue} })`);
    }

    const code = `import { Timeline } from '@jamesaphoenix/media-sdk';

const timeline = new Timeline()
  .addVideo('input.mp4')${filterCommands.length > 0 ? '\n  ' + filterCommands.join('\n  ') : ''};

const command = timeline.getCommand('output.mp4');`;

    return code;
  };

  return (
    <div className="not-prose my-6 rounded-lg border bg-card">
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Filter Playground
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Experiment with video filters and see the generated code
          </p>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={reset}
        >
          <RotateCw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Filter Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Brightness</label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {filters.brightness > 0 ? '+' : ''}{filters.brightness.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={filters.brightness}
              onChange={(e) => updateFilter('brightness', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Contrast</label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {filters.contrast.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={filters.contrast}
              onChange={(e) => updateFilter('contrast', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Saturation</label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {filters.saturation.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={filters.saturation}
              onChange={(e) => updateFilter('saturation', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Blur</label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {filters.blur}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={filters.blur}
              onChange={(e) => updateFilter('blur', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Hue Shift</label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {filters.hue}°
              </span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="10"
              value={filters.hue}
              onChange={(e) => updateFilter('hue', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Visual Preview */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="text-center text-sm text-muted-foreground mb-3">
            Visual Preview (Simulated)
          </div>
          <div 
            className="mx-auto w-48 h-32 rounded bg-gradient-to-br from-purple-500 to-pink-500"
            style={{
              filter: `
                brightness(${1 + filters.brightness})
                contrast(${filters.contrast})
                saturate(${filters.saturation})
                blur(${filters.blur / 10}px)
                hue-rotate(${filters.hue}deg)
              `.trim()
            }}
          />
        </div>

        {/* Generated Code */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="mb-3"
          >
            {showCode ? 'Hide' : 'Show'} Generated Code
          </Button>
          
          {showCode && (
            <pre className="p-3 rounded border bg-muted/30 text-xs overflow-x-auto">
              <code>{generateCode()}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}