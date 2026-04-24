import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Download,
  RefreshCw,
  Maximize2,
  Minimize2,
  Move,
  Shuffle,
  ChevronDown,
  ArrowLeft,
  Satellite,
  Image as ImageIcon,
  Palette,
  Layout,
  HelpCircle,
} from 'lucide-react';

// Letter variants available (from NASA Landsat)
const LETTER_VARIANTS: Record<string, number[]> = {
  a: [0, 1, 2, 3, 4],
  b: [0, 1],
  c: [0, 1, 2],
  d: [0, 1],
  e: [0, 1, 2, 3],
  f: [0, 1],
  g: [0],
  h: [0, 1],
  i: [0, 1, 2, 3, 4],
  j: [0, 1, 2],
  k: [0, 1],
  l: [0, 1, 2, 3],
  m: [0, 1, 2],
  n: [0, 1, 2],
  o: [0, 1],
  p: [0, 1],
  q: [0, 1],
  r: [0, 1, 2, 3],
  s: [0, 1, 2],
  t: [0, 1],
  u: [0, 1],
  v: [0, 1, 2, 3],
  w: [0, 1],
  x: [0, 1, 2],
  y: [0, 1, 2],
  z: [0, 1],
};

// Aspect ratio presets (all at 300 DPI for print-ready output)
const ASPECT_RATIOS = [
  { label: '18×12" (Landscape)', value: 18/12, width: 5400, height: 3600 },  // Default - common print size
  { label: '12×18" (Portrait)', value: 12/18, width: 3600, height: 5400 },
  { label: '16×20" (Large)', value: 16/20, width: 4800, height: 6000 },
  { label: '11×14" (Standard)', value: 11/14, width: 3300, height: 4200 },
  { label: '8×10" (Small)', value: 8/10, width: 2400, height: 3000 },
  { label: '12×12" (Square)', value: 1, width: 3600, height: 3600 },
];

interface NameObject {
  id: string;
  name: string;
  letters: { char: string; variant: number; imageUrl: string }[];
  x: number;
  y: number;
  scale: number;
  width: number;
}

interface LandsatPlaqueBuilderProps {
  onBack?: () => void;
}

const LandsatPlaqueBuilder: React.FC<LandsatPlaqueBuilderProps> = ({ onBack }) => {
  // State
  const [names, setNames] = useState<NameObject[]>([]);
  const [newNameInput, setNewNameInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [spacing, setSpacing] = useState(80); // Space between name rows
  const [letterSpacing, setLetterSpacing] = useState(12); // Space between letters
  const [selectedNameId, setSelectedNameId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.15); // Smaller preview scale for large canvas
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Get random variant for a letter
  const getRandomVariant = (letter: string): number => {
    const variants = LETTER_VARIANTS[letter.toLowerCase()];
    if (!variants || variants.length === 0) return 0;
    return variants[Math.floor(Math.random() * variants.length)];
  };

  // Create letter objects for a name
  const createLetterObjects = (name: string) => {
    return name
      .toUpperCase()
      .split('')
      .filter(char => /[A-Z]/.test(char))
      .map(char => {
        const variant = getRandomVariant(char);
        return {
          char,
          variant,
          imageUrl: `/landsat-letters/${char.toLowerCase()}_${variant}.jpg`,
        };
      });
  };

  // Add a new name
  const addName = () => {
    if (!newNameInput.trim()) return;

    const letters = createLetterObjects(newNameInput);
    if (letters.length === 0) return;

    const newName: NameObject = {
      id: generateId(),
      name: newNameInput.trim(),
      letters,
      x: 0,
      y: 0,
      scale: 1,
      width: letters.length * 100 + (letters.length - 1) * letterSpacing,
    };

    setNames(prev => [...prev, newName]);
    setNewNameInput('');
  };

  // Remove a name
  const removeName = (id: string) => {
    setNames(prev => prev.filter(n => n.id !== id));
    if (selectedNameId === id) setSelectedNameId(null);
  };

  // Shuffle letter variants for a name
  const shuffleLetters = (id: string) => {
    setNames(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        return {
          ...n,
          letters: n.letters.map(l => ({
            ...l,
            variant: getRandomVariant(l.char),
            imageUrl: `/landsat-letters/${l.char.toLowerCase()}_${getRandomVariant(l.char)}.jpg`,
          })),
        };
      })
    );
  };

  // Base letter size - this determines how big letters appear on print canvas
  const BASE_LETTER_SIZE = 350;

  // Auto-arrange names in a balanced layout
  const autoArrange = useCallback(() => {
    if (names.length === 0) return;

    const canvasWidth = aspectRatio.width;
    const canvasHeight = aspectRatio.height;
    const letterWidth = BASE_LETTER_SIZE;
    const margin = spacing * 3;

    // Calculate name widths
    const nameWidths = names.map(n =>
      n.letters.length * letterWidth + (n.letters.length - 1) * letterSpacing
    );

    // Find optimal scale to fit all names
    const maxNameWidth = Math.max(...nameWidths);
    const availableWidth = canvasWidth - margin * 2;
    const availableHeight = canvasHeight - margin * 2;

    // Try to fit names in rows
    const rowHeight = BASE_LETTER_SIZE * 1.2; // Height per row with some padding
    const totalRows = names.length;
    const neededHeight = totalRows * rowHeight + (totalRows - 1) * spacing;

    // Calculate scale to fit everything with good margins
    let scale = Math.min(
      availableWidth / maxNameWidth,
      availableHeight / neededHeight,
      2.0 // Max scale
    );
    scale = Math.max(0.3, Math.min(scale, 2.0)); // Clamp scale

    // Position names centered vertically, each on its own row
    const scaledRowHeight = BASE_LETTER_SIZE * scale;
    const totalHeight = names.length * scaledRowHeight + (names.length - 1) * spacing;
    const startY = (canvasHeight - totalHeight) / 2;

    const arrangedNames = names.map((name, index) => {
      const nameWidth = nameWidths[index] * scale;
      const x = (canvasWidth - nameWidth) / 2;
      const y = startY + index * (scaledRowHeight + spacing);

      return {
        ...name,
        x,
        y,
        scale,
        width: nameWidths[index],
      };
    });

    setNames(arrangedNames);
  }, [names.length, aspectRatio, spacing, letterSpacing]);

  // Load an image and cache it
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (imageCache.current[src]) {
        resolve(imageCache.current[src]);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache.current[src] = img;
        setImagesLoaded(prev => ({ ...prev, [src]: true }));
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  // Preload all images for current names
  useEffect(() => {
    names.forEach(name => {
      name.letters.forEach(letter => {
        loadImage(letter.imageUrl).catch(console.error);
      });
    });
  }, [names]);

  // Draw the canvas
  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = aspectRatio.width;
    canvas.height = aspectRatio.height;

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each name
    for (const name of names) {
      const letterWidth = BASE_LETTER_SIZE * name.scale;
      const letterHeight = BASE_LETTER_SIZE * name.scale;
      const gap = letterSpacing * name.scale;

      let offsetX = 0;
      for (const letter of name.letters) {
        try {
          const img = await loadImage(letter.imageUrl);
          // Calculate aspect ratio of the letter image
          const imgAspect = img.width / img.height;
          const drawWidth = letterHeight * imgAspect;

          ctx.drawImage(
            img,
            name.x + offsetX,
            name.y,
            drawWidth,
            letterHeight
          );
          offsetX += drawWidth + gap;
        } catch (err) {
          // Draw placeholder
          ctx.fillStyle = '#cccccc';
          ctx.fillRect(name.x + offsetX, name.y, letterWidth, letterHeight);
          ctx.fillStyle = '#666666';
          ctx.font = `${40 * name.scale}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(letter.char, name.x + offsetX + letterWidth/2, name.y + letterHeight/2 + 15);
          offsetX += letterWidth + gap;
        }
      }
    }
  }, [names, aspectRatio, backgroundColor, letterSpacing]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle mouse down on name for dragging
  const handleNameMouseDown = (e: React.MouseEvent, nameId: string) => {
    e.preventDefault();
    const name = names.find(n => n.id === nameId);
    if (!name) return;

    setSelectedNameId(nameId);
    setIsDragging(true);

    // Calculate offset from name position to mouse position (scaled)
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left) / previewScale;
    const mouseY = (e.clientY - rect.top) / previewScale;

    setDragOffset({
      x: mouseX - name.x,
      y: mouseY - name.y,
    });
  };

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedNameId) return;

    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left) / previewScale;
    const mouseY = (e.clientY - rect.top) / previewScale;

    setNames(prev =>
      prev.map(n => {
        if (n.id !== selectedNameId) return n;
        return {
          ...n,
          x: mouseX - dragOffset.x,
          y: mouseY - dragOffset.y,
        };
      })
    );
  }, [isDragging, selectedNameId, dragOffset, previewScale]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Scale a name
  const scaleName = (id: string, delta: number) => {
    setNames(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        const newScale = Math.max(0.2, Math.min(2, n.scale + delta));
        return { ...n, scale: newScale };
      })
    );
  };

  // Export to JPG
  const exportToJPG = async () => {
    setIsExporting(true);

    try {
      // Create a high-res canvas for export
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = aspectRatio.width;
      exportCanvas.height = aspectRatio.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Draw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Draw each name
      for (const name of names) {
        const letterHeight = BASE_LETTER_SIZE * name.scale;
        const gap = letterSpacing * name.scale;

        let offsetX = 0;
        for (const letter of name.letters) {
          try {
            const img = await loadImage(letter.imageUrl);
            const imgAspect = img.width / img.height;
            const drawWidth = letterHeight * imgAspect;

            ctx.drawImage(
              img,
              name.x + offsetX,
              name.y,
              drawWidth,
              letterHeight
            );
            offsetX += drawWidth + gap;
          } catch (err) {
            console.error('Failed to load image:', letter.imageUrl);
          }
        }
      }

      // Convert to blob and download
      exportCanvas.toBlob(
        (blob) => {
          if (!blob) {
            alert('Failed to create image');
            setIsExporting(false);
            return;
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `landsat-plaque-${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsExporting(false);
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
      setIsExporting(false);
    }
  };

  // Quick color presets
  const colorPresets = [
    { color: '#ffffff', label: 'White' },
    { color: '#000000', label: 'Black' },
    { color: '#1a1a2e', label: 'Space' },
    { color: '#0a1628', label: 'Deep Blue' },
    { color: '#1e3a5f', label: 'Navy' },
    { color: '#2d3436', label: 'Charcoal' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Satellite className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">Landsat Family Plaques</h1>
              <p className="text-xs text-gray-400">Create print-ready satellite letter art</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={exportToJPG}
              disabled={names.length === 0 || isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export JPG
            </button>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Satellite className="w-5 h-5 text-blue-400" />
              How to Use
            </h2>
            <div className="space-y-3 text-sm text-gray-300">
              <p><strong>1. Add Names:</strong> Type names in the input field and click Add or press Enter.</p>
              <p><strong>2. Arrange:</strong> Click "Auto Arrange" for balanced layout, or drag names to position manually.</p>
              <p><strong>3. Customize:</strong> Choose aspect ratio, background color, and adjust spacing.</p>
              <p><strong>4. Shuffle:</strong> Click the shuffle icon on any name to get different letter variants.</p>
              <p><strong>5. Resize:</strong> Use +/- buttons to scale individual names.</p>
              <p><strong>6. Export:</strong> Click "Export JPG" for a 300 DPI print-ready image.</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Letter images from NASA Landsat Outreach program.
            </p>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Add Names */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Names
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addName()}
                placeholder="Enter a name..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={addName}
                disabled={!newNameInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Names List */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Names ({names.length})</h3>
              <button
                onClick={autoArrange}
                disabled={names.length === 0}
                className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <Layout className="w-3 h-3" />
                Auto Arrange
              </button>
            </div>

            {names.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No names added yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {names.map((name) => (
                  <div
                    key={name.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedNameId === name.id
                        ? 'bg-blue-600/20 border-blue-500'
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedNameId(name.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{name.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); scaleName(name.id, -0.1); }}
                          className="p-1 hover:bg-gray-600 rounded"
                          title="Decrease size"
                        >
                          <Minimize2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); scaleName(name.id, 0.1); }}
                          className="p-1 hover:bg-gray-600 rounded"
                          title="Increase size"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); shuffleLetters(name.id); }}
                          className="p-1 hover:bg-gray-600 rounded"
                          title="Shuffle letter variants"
                        >
                          <Shuffle className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeName(name.id); }}
                          className="p-1 hover:bg-red-600 rounded text-red-400"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Scale: {(name.scale * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Aspect Ratio
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.label}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    aspectRatio.label === ratio.label
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Print size: {(aspectRatio.width / 300).toFixed(0)}" × {(aspectRatio.height / 300).toFixed(0)}" @ 300 DPI ({aspectRatio.width} × {aspectRatio.height}px)
            </p>
          </div>

          {/* Background Color */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Background
            </h3>
            <div className="flex gap-2 flex-wrap mb-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => setBackgroundColor(preset.color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    backgroundColor === preset.color
                      ? 'border-blue-500 scale-110'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.label}
                />
              ))}
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-600"
                title="Custom color"
              />
            </div>
          </div>

          {/* Spacing */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="font-semibold mb-3">Spacing</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 flex justify-between">
                  <span>Name Spacing</span>
                  <span>{spacing}px</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={spacing}
                  onChange={(e) => setSpacing(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 flex justify-between">
                  <span>Letter Spacing</span>
                  <span>{letterSpacing}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Move className="w-4 h-4" />
                Preview (Drag names to reposition)
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Zoom:</span>
                <input
                  type="range"
                  min="0.08"
                  max="0.35"
                  step="0.01"
                  value={previewScale}
                  onChange={(e) => setPreviewScale(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-gray-400">{(previewScale * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div
              className="overflow-auto rounded-lg border border-gray-600"
              style={{ maxHeight: '70vh' }}
            >
              <div
                ref={previewRef}
                className="relative cursor-crosshair"
                style={{
                  width: aspectRatio.width * previewScale,
                  height: aspectRatio.height * previewScale,
                  backgroundColor: backgroundColor,
                }}
              >
                {/* Hidden canvas for actual rendering */}
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    width: aspectRatio.width * previewScale,
                    height: aspectRatio.height * previewScale,
                  }}
                />

                {/* Interactive name overlays */}
                {names.map((name) => {
                  // Calculate approximate width based on loaded images
                  const letterWidth = BASE_LETTER_SIZE * name.scale;
                  const gap = letterSpacing * name.scale;
                  const totalWidth = name.letters.length * letterWidth + (name.letters.length - 1) * gap;
                  const totalHeight = letterWidth;

                  return (
                    <div
                      key={name.id}
                      className={`absolute border-2 rounded transition-colors ${
                        selectedNameId === name.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-transparent hover:border-blue-400/50'
                      }`}
                      style={{
                        left: name.x * previewScale,
                        top: name.y * previewScale,
                        width: totalWidth * previewScale,
                        height: totalHeight * previewScale,
                        cursor: 'move',
                      }}
                      onMouseDown={(e) => handleNameMouseDown(e, name.id)}
                    >
                      {selectedNameId === name.id && (
                        <div className="absolute -top-6 left-0 text-xs bg-blue-600 px-2 py-0.5 rounded whitespace-nowrap">
                          {name.name}
                        </div>
                      )}
                    </div>
                  );
                })}

                {names.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Satellite className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Add names to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pb-8 text-center text-gray-500 text-sm">
        <p>
          Letter images from{' '}
          <a
            href="https://science.nasa.gov/mission/landsat/outreach/your-name-in-landsat/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            NASA Landsat Outreach
          </a>
        </p>
      </footer>
    </div>
  );
};

export default LandsatPlaqueBuilder;
