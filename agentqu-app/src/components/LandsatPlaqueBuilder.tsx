import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Download,
  RefreshCw,
  Move,
  Shuffle,
  ArrowLeft,
  Satellite,
  Image as ImageIcon,
  Palette,
  HelpCircle,
  Grid3X3,
  Check,
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
  { label: '18×12" (Landscape)', value: 18/12, width: 5400, height: 3600 },
  { label: '12×18" (Portrait)', value: 12/18, width: 3600, height: 5400 },
  { label: '16×20" (Large)', value: 16/20, width: 4800, height: 6000 },
  { label: '11×14" (Standard)', value: 11/14, width: 3300, height: 4200 },
  { label: '8×10" (Small)', value: 8/10, width: 2400, height: 3000 },
  { label: '12×12" (Square)', value: 1, width: 3600, height: 3600 },
];

interface NameObject {
  id: string;
  name: string;
  letters: { char: string; variant: number; imageUrl: string; aspectRatio?: number }[];
  x: number;
  y: number;
  scale: number;
  width: number;
  renderedWidth: number; // Actual width after images load
  row: number;
  col: number;
}

interface GridConfig {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
}

interface LandsatPlaqueBuilderProps {
  onBack?: () => void;
}

type SetupStep = 'count' | 'builder';
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | null;

const LandsatPlaqueBuilder: React.FC<LandsatPlaqueBuilderProps> = ({ onBack }) => {
  // Setup state
  const [setupStep, setSetupStep] = useState<SetupStep>('count');
  const [plannedNameCount, setPlannedNameCount] = useState(5);

  // Builder state
  const [names, setNames] = useState<NameObject[]>([]);
  const [newNameInput, setNewNameInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [spacing, setSpacing] = useState(80);
  const [letterSpacing, setLetterSpacing] = useState(12);
  const [selectedNameId, setSelectedNameId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, scale: 1 });
  const [isExporting, setIsExporting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.15);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridConfig, setGridConfig] = useState<GridConfig>({ rows: 2, cols: 3, cellWidth: 0, cellHeight: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});

  // Base letter size
  const BASE_LETTER_SIZE = 350;

  // Calculate optimal grid based on name count
  const calculateGrid = useCallback((count: number, canvasWidth: number, canvasHeight: number): GridConfig => {
    const isLandscape = canvasWidth > canvasHeight;
    let rows: number, cols: number;

    if (count <= 2) {
      rows = isLandscape ? 1 : 2;
      cols = isLandscape ? 2 : 1;
    } else if (count <= 4) {
      rows = 2;
      cols = 2;
    } else if (count <= 6) {
      rows = isLandscape ? 2 : 3;
      cols = isLandscape ? 3 : 2;
    } else if (count <= 9) {
      rows = 3;
      cols = 3;
    } else {
      rows = Math.ceil(Math.sqrt(count));
      cols = Math.ceil(count / rows);
    }

    const margin = spacing * 2;
    const cellWidth = (canvasWidth - margin) / cols;
    const cellHeight = (canvasHeight - margin) / rows;

    return { rows, cols, cellWidth, cellHeight };
  }, [spacing]);

  // Update grid when name count or aspect ratio changes
  useEffect(() => {
    const grid = calculateGrid(plannedNameCount, aspectRatio.width, aspectRatio.height);
    setGridConfig(grid);
  }, [plannedNameCount, aspectRatio, calculateGrid]);

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

  // Snap position to grid cell center
  const snapToGridPosition = useCallback((centerX: number, centerY: number, nameWidth: number, nameHeight: number): { x: number; y: number; row: number; col: number } => {
    const margin = spacing;

    // Determine which cell center is closest
    const col = Math.max(0, Math.min(gridConfig.cols - 1, Math.round((centerX - margin - gridConfig.cellWidth / 2) / gridConfig.cellWidth)));
    const row = Math.max(0, Math.min(gridConfig.rows - 1, Math.round((centerY - margin - gridConfig.cellHeight / 2) / gridConfig.cellHeight)));

    // Calculate cell center position
    const cellCenterX = margin + col * gridConfig.cellWidth + gridConfig.cellWidth / 2;
    const cellCenterY = margin + row * gridConfig.cellHeight + gridConfig.cellHeight / 2;

    // Position name centered in cell, but clamp to canvas bounds
    let x = cellCenterX - nameWidth / 2;
    let y = cellCenterY - nameHeight / 2;

    // Clamp to stay within canvas
    x = Math.max(20, Math.min(x, aspectRatio.width - nameWidth - 20));
    y = Math.max(20, Math.min(y, aspectRatio.height - nameHeight - 20));

    return { x, y, row, col };
  }, [spacing, gridConfig, aspectRatio]);

  // Add a new name
  const addName = () => {
    if (!newNameInput.trim()) return;

    const letters = createLetterObjects(newNameInput);
    if (letters.length === 0) return;

    // Find next available grid position
    const usedPositions = new Set(names.map(n => `${n.row}-${n.col}`));
    let row = 0, col = 0;
    for (let r = 0; r < gridConfig.rows; r++) {
      for (let c = 0; c < gridConfig.cols; c++) {
        if (!usedPositions.has(`${r}-${c}`)) {
          row = r;
          col = c;
          break;
        }
      }
      if (!usedPositions.has(`${row}-${col}`)) break;
    }

    const margin = spacing;
    const x = margin + col * gridConfig.cellWidth + gridConfig.cellWidth / 2;
    const y = margin + row * gridConfig.cellHeight + gridConfig.cellHeight / 2;

    // Calculate scale to fit in cell
    const nameWidth = letters.length * BASE_LETTER_SIZE + (letters.length - 1) * letterSpacing;
    const maxWidth = gridConfig.cellWidth * 0.9;
    const scale = Math.min(maxWidth / nameWidth, 1.5);

    const newName: NameObject = {
      id: generateId(),
      name: newNameInput.trim(),
      letters,
      x: x - (nameWidth * scale) / 2,
      y: y - (BASE_LETTER_SIZE * scale) / 2,
      scale,
      width: nameWidth,
      renderedWidth: 0, // Will be calculated after images load
      row,
      col,
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
          letters: n.letters.map(l => {
            const newVariant = getRandomVariant(l.char);
            return {
              ...l,
              variant: newVariant,
              imageUrl: `/landsat-letters/${l.char.toLowerCase()}_${newVariant}.jpg`,
            };
          }),
        };
      })
    );
  };

  // Auto-arrange names in grid
  const autoArrange = useCallback(() => {
    if (names.length === 0) return;

    const margin = spacing;
    const arrangedNames = names.map((name, index) => {
      const row = Math.floor(index / gridConfig.cols);
      const col = index % gridConfig.cols;

      const cellCenterX = margin + col * gridConfig.cellWidth + gridConfig.cellWidth / 2;
      const cellCenterY = margin + row * gridConfig.cellHeight + gridConfig.cellHeight / 2;

      const nameWidth = name.letters.length * BASE_LETTER_SIZE + (name.letters.length - 1) * letterSpacing;
      const maxWidth = gridConfig.cellWidth * 0.85;
      const maxHeight = gridConfig.cellHeight * 0.7;
      const scale = Math.min(maxWidth / nameWidth, maxHeight / BASE_LETTER_SIZE, 1.5);

      return {
        ...name,
        x: cellCenterX - (nameWidth * scale) / 2,
        y: cellCenterY - (BASE_LETTER_SIZE * scale) / 2,
        scale,
        row,
        col,
      };
    });

    setNames(arrangedNames);
  }, [names.length, gridConfig, spacing, letterSpacing]);

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
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  // Preload all images and calculate actual rendered widths
  useEffect(() => {
    const calculateRenderedWidths = async () => {
      const updates: { id: string; renderedWidth: number; letters: typeof names[0]['letters'] }[] = [];

      for (const name of names) {
        if (name.renderedWidth > 0) continue; // Already calculated

        const letterHeight = BASE_LETTER_SIZE * name.scale;
        const gap = letterSpacing * name.scale;
        let totalWidth = 0;
        const updatedLetters = [...name.letters];

        for (let i = 0; i < name.letters.length; i++) {
          const letter = name.letters[i];
          try {
            const img = await loadImage(letter.imageUrl);
            const aspectRatio = img.width / img.height;
            updatedLetters[i] = { ...letter, aspectRatio };
            totalWidth += letterHeight * aspectRatio;
            if (i < name.letters.length - 1) totalWidth += gap;
          } catch {
            totalWidth += letterHeight * 0.5; // Fallback
            if (i < name.letters.length - 1) totalWidth += gap;
          }
        }

        updates.push({ id: name.id, renderedWidth: totalWidth, letters: updatedLetters });
      }

      if (updates.length > 0) {
        setNames(prev => prev.map(n => {
          const update = updates.find(u => u.id === n.id);
          if (update) {
            return { ...n, renderedWidth: update.renderedWidth, letters: update.letters };
          }
          return n;
        }));
      }
    };

    calculateRenderedWidths();
  }, [names.length, letterSpacing]); // Only recalculate when names are added

  // Draw the canvas
  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = aspectRatio.width;
    canvas.height = aspectRatio.height;

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
          ctx.fillStyle = '#cccccc';
          ctx.fillRect(name.x + offsetX, name.y, letterHeight, letterHeight);
          offsetX += letterHeight + gap;
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
    e.stopPropagation();
    const name = names.find(n => n.id === nameId);
    if (!name) return;

    setSelectedNameId(nameId);
    setIsDragging(true);

    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left) / previewScale;
    const mouseY = (e.clientY - rect.top) / previewScale;

    setDragOffset({
      x: mouseX - name.x,
      y: mouseY - name.y,
    });
  };

  // Handle resize handle mouse down
  const handleResizeMouseDown = (e: React.MouseEvent, nameId: string, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();

    const name = names.find(n => n.id === nameId);
    if (!name) return;

    setSelectedNameId(nameId);
    setIsResizing(true);
    setResizeHandle(handle);

    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      scale: name.scale,
    });
  };

  // Handle mouse move for dragging/resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && selectedNameId) {
      const rect = previewRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = (e.clientX - rect.left) / previewScale;
      const mouseY = (e.clientY - rect.top) / previewScale;

      let newX = mouseX - dragOffset.x;
      let newY = mouseY - dragOffset.y;

      const name = names.find(n => n.id === selectedNameId);
      if (name) {
        const letterHeight = BASE_LETTER_SIZE * name.scale;
        // Use actual rendered width if available
        const nameWidth = name.renderedWidth > 0
          ? name.renderedWidth
          : name.letters.length * letterHeight * 0.5 + (name.letters.length - 1) * letterSpacing * name.scale;
        const nameHeight = letterHeight;

        // Snap to grid if enabled
        if (snapToGrid) {
          const centerX = newX + nameWidth / 2;
          const centerY = newY + nameHeight / 2;
          const snapped = snapToGridPosition(centerX, centerY, nameWidth, nameHeight);
          newX = snapped.x;
          newY = snapped.y;
        } else {
          // Just clamp to canvas bounds
          newX = Math.max(20, Math.min(newX, aspectRatio.width - nameWidth - 20));
          newY = Math.max(20, Math.min(newY, aspectRatio.height - nameHeight - 20));
        }
      }

      setNames(prev =>
        prev.map(n => {
          if (n.id !== selectedNameId) return n;
          return { ...n, x: newX, y: newY };
        })
      );
    } else if (isResizing && selectedNameId && resizeHandle) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const delta = (deltaX + deltaY) / 2;
      const scaleFactor = delta / 200;

      const newScale = Math.max(0.3, Math.min(2.5, resizeStart.scale + scaleFactor));

      setNames(prev =>
        prev.map(n => {
          if (n.id !== selectedNameId) return n;
          return { ...n, scale: newScale };
        })
      );
    }
  }, [isDragging, isResizing, selectedNameId, dragOffset, previewScale, resizeHandle, resizeStart, snapToGrid, names, snapToGridPosition, aspectRatio, letterSpacing]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Export to JPG
  const exportToJPG = async () => {
    setIsExporting(true);

    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = aspectRatio.width;
      exportCanvas.height = aspectRatio.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

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

  // Setup Step - Ask for name count
  if (setupStep === 'count') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <Satellite className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Landsat Family Plaques</h1>
            <p className="text-gray-400">Create print-ready satellite letter art</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-center">How many names will you add?</h2>
            <p className="text-gray-400 text-sm mb-6 text-center">
              This helps us create the perfect grid layout for your plaque.
            </p>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <button
                  key={num}
                  onClick={() => setPlannedNameCount(num)}
                  className={`py-4 rounded-xl text-xl font-bold transition-all ${
                    plannedNameCount === num
                      ? 'bg-blue-600 text-white scale-105'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-2 block">Or enter a custom number:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={plannedNameCount}
                onChange={(e) => setPlannedNameCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-center text-xl font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="text-center text-sm text-gray-400 mb-6">
              Grid will be: <span className="text-white font-semibold">
                {calculateGrid(plannedNameCount, aspectRatio.width, aspectRatio.height).rows} rows × {calculateGrid(plannedNameCount, aspectRatio.width, aspectRatio.height).cols} columns
              </span>
            </div>

            <button
              onClick={() => setSetupStep('builder')}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Continue to Builder
            </button>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 w-full py-3 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  // Builder Step
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSetupStep('count')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Satellite className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">Landsat Family Plaques</h1>
              <p className="text-xs text-gray-400">Planning for {plannedNameCount} names • {gridConfig.rows}×{gridConfig.cols} grid</p>
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
              <p><strong>1. Add Names:</strong> Type names and click Add. They'll snap to the grid.</p>
              <p><strong>2. Drag:</strong> Click and drag names to reposition. They snap to grid cells.</p>
              <p><strong>3. Resize:</strong> Use the corner handles to resize each name.</p>
              <p><strong>4. Shuffle:</strong> Click the shuffle icon to get different letter variants.</p>
              <p><strong>5. Auto Arrange:</strong> Click to automatically arrange all names in the grid.</p>
              <p><strong>6. Export:</strong> Click "Export JPG" for a 300 DPI print-ready image.</p>
            </div>
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
              Add Names ({names.length}/{plannedNameCount})
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
                disabled={!newNameInput.trim() || names.length >= plannedNameCount}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {names.length >= plannedNameCount && (
              <p className="text-xs text-amber-400 mt-2">
                You've reached your planned name count. Change it in settings if needed.
              </p>
            )}
          </div>

          {/* Names List */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Names</h3>
              <button
                onClick={autoArrange}
                disabled={names.length === 0}
                className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <Grid3X3 className="w-3 h-3" />
                Auto Arrange
              </button>
            </div>

            {names.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No names added yet
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
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
                      Scale: {(name.scale * 100).toFixed(0)}% • Row {name.row + 1}, Col {name.col + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grid Settings */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              Grid Settings
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Show grid lines</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Snap to grid</span>
              </label>
              <div className="pt-2 border-t border-gray-700">
                <label className="text-sm text-gray-400">Planned names:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={plannedNameCount}
                  onChange={(e) => setPlannedNameCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                  className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
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
              {(aspectRatio.width / 300).toFixed(0)}" × {(aspectRatio.height / 300).toFixed(0)}" @ 300 DPI
            </p>
          </div>

          {/* Background Color */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Background
            </h3>
            <div className="flex gap-2 flex-wrap">
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
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Move className="w-4 h-4" />
                Preview (Drag to reposition, corners to resize)
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
                className="relative"
                style={{
                  width: aspectRatio.width * previewScale,
                  height: aspectRatio.height * previewScale,
                  backgroundColor: backgroundColor,
                }}
              >
                {/* Grid lines */}
                {showGrid && (
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    width={aspectRatio.width * previewScale}
                    height={aspectRatio.height * previewScale}
                    style={{ zIndex: 10 }}
                  >
                    {/* Grid cell backgrounds */}
                    {Array.from({ length: gridConfig.rows }).map((_, row) =>
                      Array.from({ length: gridConfig.cols }).map((_, col) => {
                        const x = (spacing + col * gridConfig.cellWidth) * previewScale;
                        const y = (spacing + row * gridConfig.cellHeight) * previewScale;
                        return (
                          <rect
                            key={`cell-${row}-${col}`}
                            x={x}
                            y={y}
                            width={gridConfig.cellWidth * previewScale}
                            height={gridConfig.cellHeight * previewScale}
                            fill="none"
                            stroke="rgba(59, 130, 246, 0.4)"
                            strokeWidth="1"
                          />
                        );
                      })
                    )}
                    {/* Cell center markers */}
                    {Array.from({ length: gridConfig.rows }).map((_, row) =>
                      Array.from({ length: gridConfig.cols }).map((_, col) => {
                        const centerX = (spacing + col * gridConfig.cellWidth + gridConfig.cellWidth / 2) * previewScale;
                        const centerY = (spacing + row * gridConfig.cellHeight + gridConfig.cellHeight / 2) * previewScale;
                        return (
                          <g key={`center-${row}-${col}`}>
                            <line
                              x1={centerX - 6}
                              y1={centerY}
                              x2={centerX + 6}
                              y2={centerY}
                              stroke="rgba(59, 130, 246, 0.5)"
                              strokeWidth="1"
                            />
                            <line
                              x1={centerX}
                              y1={centerY - 6}
                              x2={centerX}
                              y2={centerY + 6}
                              stroke="rgba(59, 130, 246, 0.5)"
                              strokeWidth="1"
                            />
                          </g>
                        );
                      })
                    )}
                  </svg>
                )}

                {/* Hidden canvas for actual rendering */}
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    width: aspectRatio.width * previewScale,
                    height: aspectRatio.height * previewScale,
                  }}
                />

                {/* Interactive name overlays with resize handles */}
                {names.map((name) => {
                  const letterHeight = BASE_LETTER_SIZE * name.scale;
                  // Use actual rendered width if available, otherwise estimate
                  const totalWidth = name.renderedWidth > 0
                    ? name.renderedWidth
                    : name.letters.length * letterHeight * 0.5 + (name.letters.length - 1) * letterSpacing * name.scale;
                  const totalHeight = letterHeight;
                  const isSelected = selectedNameId === name.id;

                  return (
                    <div
                      key={name.id}
                      className="absolute"
                      style={{
                        left: name.x * previewScale,
                        top: name.y * previewScale,
                        width: totalWidth * previewScale,
                        height: totalHeight * previewScale,
                        zIndex: isSelected ? 30 : 20,
                      }}
                    >
                      {/* Selection outline - dashed border when selected */}
                      {isSelected && (
                        <div
                          className="absolute -inset-1 border-2 border-dashed border-blue-400 rounded pointer-events-none"
                          style={{ background: 'rgba(59, 130, 246, 0.05)' }}
                        />
                      )}

                      {/* Drag area - transparent overlay for interaction */}
                      <div
                        className="absolute inset-0 cursor-move"
                        onMouseDown={(e) => handleNameMouseDown(e, name.id)}
                        onClick={() => setSelectedNameId(name.id)}
                      />

                      {/* Resize handles - only show when selected */}
                      {isSelected && (
                        <>
                          {/* Corner handles - small circles */}
                          {(['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((handle) => {
                            const isTop = handle?.includes('n');
                            const isLeft = handle?.includes('w');
                            return (
                              <div
                                key={handle}
                                className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full shadow-md hover:bg-blue-100 transition-colors"
                                style={{
                                  top: isTop ? -6 : 'auto',
                                  bottom: !isTop ? -6 : 'auto',
                                  left: isLeft ? -6 : 'auto',
                                  right: !isLeft ? -6 : 'auto',
                                  cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize',
                                  zIndex: 40,
                                }}
                                onMouseDown={(e) => handleResizeMouseDown(e, name.id, handle)}
                              />
                            );
                          })}

                          {/* Name label - positioned above */}
                          <div
                            className="absolute left-0 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap shadow-md"
                            style={{ top: -20, zIndex: 40 }}
                          >
                            {name.name}
                          </div>
                        </>
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
