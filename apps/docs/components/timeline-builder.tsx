'use client';

import { useState } from 'react';
import { Plus, X, Play, Download } from 'lucide-react';
import { Button } from 'fumadocs-ui/components/button';

interface Layer {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image';
  source?: string;
  text?: string;
  position?: string;
  duration?: number;
  startTime?: number;
}

export function TimelineBuilder() {
  const [layers, setLayers] = useState<Layer[]>([
    { id: '1', type: 'video', source: 'background.mp4' }
  ]);
  const [selectedLayer, setSelectedLayer] = useState<string>('1');

  const addLayer = (type: Layer['type']) => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type,
      source: type === 'video' ? 'video.mp4' : type === 'audio' ? 'audio.mp3' : type === 'image' ? 'image.png' : undefined,
      text: type === 'text' ? 'Sample Text' : undefined,
      position: 'center',
      startTime: 0,
      duration: 5
    };
    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
  };

  const removeLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedLayer === id) {
      setSelectedLayer(layers[0]?.id || '');
    }
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const generateCode = () => {
    let code = `import { Timeline } from '@jamesaphoenix/media-sdk';\n\nconst timeline = new Timeline()`;
    
    layers.forEach(layer => {
      if (layer.type === 'video') {
        code += `\n  .addVideo('${layer.source}')`;
      } else if (layer.type === 'audio') {
        code += `\n  .addAudio('${layer.source}', {`;
        if (layer.startTime) code += `\n    startTime: ${layer.startTime},`;
        if (layer.duration) code += `\n    duration: ${layer.duration}`;
        code += `\n  })`;
      } else if (layer.type === 'text') {
        code += `\n  .addText('${layer.text}', {`;
        code += `\n    position: '${layer.position}',`;
        if (layer.startTime) code += `\n    startTime: ${layer.startTime},`;
        if (layer.duration) code += `\n    duration: ${layer.duration}`;
        code += `\n  })`;
      } else if (layer.type === 'image') {
        code += `\n  .addImage('${layer.source}', {`;
        code += `\n    position: '${layer.position}',`;
        if (layer.startTime) code += `\n    startTime: ${layer.startTime},`;
        if (layer.duration) code += `\n    duration: ${layer.duration}`;
        code += `\n  })`;
      }
    });
    
    code += `;\n\nconst command = timeline.getCommand('output.mp4');`;
    
    return code;
  };

  const selectedLayerData = layers.find(l => l.id === selectedLayer);

  return (
    <div className="not-prose my-6 rounded-lg border bg-card">
      <div className="border-b p-4">
        <h3 className="text-lg font-semibold">Interactive Timeline Builder</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Build your timeline visually and see the generated code
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Layer List */}
        <div className="space-y-2">
          <div className="text-sm font-semibold mb-2">Layers</div>
          
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              className={`flex items-center justify-between p-2 rounded border cursor-pointer ${
                selectedLayer === layer.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setSelectedLayer(layer.id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
                <span className="text-sm capitalize">{layer.type}</span>
                <span className="text-xs text-muted-foreground">
                  {layer.source || layer.text}
                </span>
              </div>
              
              {layers.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(layer.id);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          
          <div className="flex gap-1 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => addLayer('video')}
              className="flex-1"
            >
              <Plus className="h-3 w-3 mr-1" />
              Video
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addLayer('text')}
              className="flex-1"
            >
              <Plus className="h-3 w-3 mr-1" />
              Text
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addLayer('image')}
              className="flex-1"
            >
              <Plus className="h-3 w-3 mr-1" />
              Image
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addLayer('audio')}
              className="flex-1"
            >
              <Plus className="h-3 w-3 mr-1" />
              Audio
            </Button>
          </div>
        </div>

        {/* Layer Properties */}
        <div className="space-y-3">
          <div className="text-sm font-semibold mb-2">Properties</div>
          
          {selectedLayerData && (
            <div className="space-y-3">
              {(selectedLayerData.type === 'video' || selectedLayerData.type === 'audio' || selectedLayerData.type === 'image') && (
                <div>
                  <label className="text-xs font-medium">Source</label>
                  <input
                    type="text"
                    value={selectedLayerData.source || ''}
                    onChange={(e) => updateLayer(selectedLayerData.id, { source: e.target.value })}
                    className="w-full mt-1 px-2 py-1 text-sm border rounded"
                  />
                </div>
              )}
              
              {selectedLayerData.type === 'text' && (
                <div>
                  <label className="text-xs font-medium">Text</label>
                  <input
                    type="text"
                    value={selectedLayerData.text || ''}
                    onChange={(e) => updateLayer(selectedLayerData.id, { text: e.target.value })}
                    className="w-full mt-1 px-2 py-1 text-sm border rounded"
                  />
                </div>
              )}
              
              {(selectedLayerData.type === 'text' || selectedLayerData.type === 'image') && (
                <div>
                  <label className="text-xs font-medium">Position</label>
                  <select
                    value={selectedLayerData.position || 'center'}
                    onChange={(e) => updateLayer(selectedLayerData.id, { position: e.target.value })}
                    className="w-full mt-1 px-2 py-1 text-sm border rounded"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
              )}
              
              {selectedLayerData.type !== 'video' && (
                <>
                  <div>
                    <label className="text-xs font-medium">Start Time (s)</label>
                    <input
                      type="number"
                      value={selectedLayerData.startTime || 0}
                      onChange={(e) => updateLayer(selectedLayerData.id, { startTime: Number(e.target.value) })}
                      className="w-full mt-1 px-2 py-1 text-sm border rounded"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium">Duration (s)</label>
                    <input
                      type="number"
                      value={selectedLayerData.duration || 5}
                      onChange={(e) => updateLayer(selectedLayerData.id, { duration: Number(e.target.value) })}
                      className="w-full mt-1 px-2 py-1 text-sm border rounded"
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Generated Code */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Generated Code</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(generateCode())}
              className="h-7 px-2"
            >
              <Download className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
          
          <pre className="p-3 rounded border bg-muted/30 text-xs overflow-x-auto">
            <code>{generateCode()}</code>
          </pre>
        </div>
      </div>

      <div className="border-t p-4 flex justify-end gap-2">
        <Button variant="outline" size="sm">
          <Play className="h-3.5 w-3.5 mr-1" />
          Preview
        </Button>
        <Button size="sm">
          <Download className="h-3.5 w-3.5 mr-1" />
          Export Command
        </Button>
      </div>
    </div>
  );
}