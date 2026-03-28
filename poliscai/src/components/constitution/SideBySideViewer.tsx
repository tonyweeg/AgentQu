/**
 * SideBySideViewer Component - Enhanced Edition
 * PoliScai - Democracy V2.0
 *
 * Beautiful side-by-side display of Shadow (V1.0) and Revised (V2.0) text
 * with interactive highlights, tooltips, and visual connections
 */

import React, { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FlagSubmissionModal } from './FlagSubmissionModal';
import {
  Flag,
  Sparkles,
  Info,
  ArrowRight,
  FileText,
  Edit3,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Types for shadow annotations
interface ShadowAnnotation {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  description: string;
  type: string;
}

// Type badge configurations
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  gender_assumption: {
    label: 'Gender',
    color: 'text-pink-700',
    bg: 'bg-pink-100',
  },
  racial_exclusion: {
    label: 'Race',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
  },
  economic_exclusion: {
    label: 'Economic',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
  },
  age_assumption: {
    label: 'Age',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
  },
  default: {
    label: 'Bias',
    color: 'text-red-700',
    bg: 'bg-red-100',
  },
};

interface SideBySideViewerProps {
  clauseId: string;
  articleSection: string;
  title: string;
  originalText: string;
  revisedText?: string;
  shadowAnnotations?: ShadowAnnotation[];
  onSubmissionSuccess?: () => void;
}

export function SideBySideViewer({
  clauseId,
  articleSection,
  title,
  originalText,
  revisedText,
  shadowAnnotations = [],
  onSubmissionSuccess,
}: SideBySideViewerProps) {
  const { isAuthenticated } = useAuth();
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState({ start: 0, end: 0 });
  const [showFlagTooltip, setShowFlagTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [showAnnotationDetails, setShowAnnotationDetails] = useState<ShadowAnnotation | null>(null);

  // Handle text selection in Shadow panel
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowFlagTooltip(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setShowFlagTooltip(false);
      return;
    }

    const startIndex = originalText.indexOf(text);
    const endIndex = startIndex !== -1 ? startIndex + text.length : text.length;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText(text);
    setSelectedIndices({ start: startIndex !== -1 ? startIndex : 0, end: endIndex });
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setShowFlagTooltip(true);
  }, [originalText]);

  const handleOpenFlagModal = () => {
    setShowFlagTooltip(false);
    setShowFlagModal(true);
    window.getSelection()?.removeAllRanges();
  };

  const handleModalClose = () => {
    setShowFlagModal(false);
    setSelectedText(null);
  };

  const handleSubmissionSuccess = () => {
    onSubmissionSuccess?.();
  };

  // Get type config for annotation
  const getTypeConfig = (type: string) => {
    return TYPE_CONFIG[type] || TYPE_CONFIG.default;
  };

  // Render Shadow text with beautiful highlights
  const renderOriginalText = () => {
    if (shadowAnnotations.length === 0) {
      return (
        <p className="text-gray-800 leading-relaxed font-serif text-lg">
          {originalText}
        </p>
      );
    }

    const sorted = [...shadowAnnotations].sort((a, b) => a.startIndex - b.startIndex);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((annotation, i) => {
      if (annotation.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${i}`}>
            {originalText.slice(lastIndex, annotation.startIndex)}
          </span>
        );
      }

      const typeConfig = getTypeConfig(annotation.type);
      const isHovered = hoveredAnnotation === annotation.id;

      parts.push(
        <span
          key={`shadow-${i}`}
          className={`
            relative inline-block cursor-pointer transition-all duration-200
            ${isHovered ? 'scale-105' : ''}
          `}
          onMouseEnter={() => setHoveredAnnotation(annotation.id)}
          onMouseLeave={() => setHoveredAnnotation(null)}
          onClick={() => setShowAnnotationDetails(annotation)}
        >
          <span
            className={`
              relative z-10 px-1.5 py-0.5 rounded-md font-medium
              bg-gradient-to-r from-red-100 to-red-50
              text-red-900 border-b-2 border-red-400
              hover:from-red-200 hover:to-red-100
              hover:border-red-500
              transition-all duration-200
            `}
          >
            {annotation.text}
          </span>

          {/* Animated underline */}
          <span className={`
            absolute bottom-0 left-0 right-0 h-0.5 bg-red-500
            transform origin-left transition-transform duration-300
            ${isHovered ? 'scale-x-100' : 'scale-x-0'}
          `} />

          {/* Hover tooltip */}
          {isHovered && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-fade-in">
              <span className="block px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-xs whitespace-normal">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${typeConfig.bg} ${typeConfig.color} mb-1`}>
                  {typeConfig.label}
                </span>
                <span className="block mt-1">{annotation.description}</span>
              </span>
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </span>
          )}
        </span>
      );

      lastIndex = annotation.endIndex;
    });

    if (lastIndex < originalText.length) {
      parts.push(<span key="text-end">{originalText.slice(lastIndex)}</span>);
    }

    return (
      <p className="text-gray-800 leading-relaxed font-serif text-lg">
        {parts}
      </p>
    );
  };

  // Render Revised text with beautiful highlights showing improvements
  const renderRevisedText = () => {
    if (!revisedText) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
            <Edit3 className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-gray-500 font-medium mb-2">No revision yet</p>
          <p className="text-gray-400 text-sm max-w-xs">
            Flag biases in the Shadow text to start the community revision process
          </p>
        </div>
      );
    }

    // Highlight new inclusive language in green
    const inclusiveTerms = [
      'eligible persons',
      'without distinction',
      'citizenship status',
    ];

    // Build highlighted segments

    // Simple highlighting of inclusive terms
    const segments: React.ReactNode[] = [];
    let remainingText = revisedText;
    let keyIndex = 0;

    inclusiveTerms.forEach(term => {
      const parts = remainingText.split(term);
      if (parts.length > 1) {
        segments.push(<span key={`seg-${keyIndex++}`}>{parts[0]}</span>);
        segments.push(
          <span
            key={`term-${keyIndex++}`}
            className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 font-medium border-b-2 border-emerald-400"
          >
            {term}
          </span>
        );
        remainingText = parts.slice(1).join(term);
      }
    });

    if (remainingText) {
      segments.push(<span key={`seg-${keyIndex}`}>{remainingText}</span>);
    }

    return (
      <p className="text-gray-800 leading-relaxed font-serif text-lg">
        {segments.length > 0 ? segments : revisedText}
      </p>
    );
  };

  // Calculate revision progress
  const progressPercent = revisedText ? 100 : Math.min(shadowAnnotations.length * 33, 99);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-poliscai-primary via-poliscai-primary to-indigo-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-serif text-xl font-bold">{articleSection}</h2>
            <p className="text-white/70 text-sm">{title}</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-wide">Revision Progress</p>
              <p className="text-white font-bold">{progressPercent}%</p>
            </div>
            <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inline Legend */}
      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-500 font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-b-2 border-red-400 text-xs font-medium">
              flagged bias
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-b-2 border-emerald-400 text-xs font-medium">
              inclusive revision
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Info className="w-4 h-4" />
            <span className="text-xs">Click highlighted text for details</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2">
        {/* Shadow (V1.0) Panel */}
        <div className="p-6 md:p-8 border-r border-gray-100 relative">
          {/* Panel Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                Shadow
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  V1.0
                </span>
              </h3>
              <p className="text-gray-500 text-sm">
                Original {articleSection.includes('Amendment') ? '(Ratified)' : '(1787)'}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          {shadowAnnotations.length > 0 && (
            <div className="flex items-center gap-4 mb-6 p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-800 font-medium text-sm">
                  {shadowAnnotations.length} bias{shadowAnnotations.length !== 1 ? 'es' : ''} flagged
                </span>
              </div>
              <div className="flex -space-x-1">
                {shadowAnnotations.slice(0, 3).map((ann, i) => {
                  const config = getTypeConfig(ann.type);
                  return (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-full ${config.bg} flex items-center justify-center text-[10px] font-bold ${config.color} border-2 border-white`}
                    >
                      {config.label[0]}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content */}
          <div
            onMouseUp={handleMouseUp}
            className="select-text cursor-text relative"
          >
            {renderOriginalText()}
          </div>

          {/* Instruction for flagging */}
          {isAuthenticated && shadowAnnotations.length === 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-poliscai-secondary/10 to-amber-50 rounded-xl border border-poliscai-secondary/20">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-poliscai-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-poliscai-dark text-sm">Surface the shadow</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Select any text that contains implicit bias or exclusion to flag it for review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Revised (V2.0) Panel */}
        <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-emerald-50/30">
          {/* Panel Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                Revised
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                  V2.0
                </span>
              </h3>
              <p className="text-gray-500 text-sm">Community Draft</p>
            </div>
          </div>

          {/* Status Bar */}
          {revisedText ? (
            <div className="flex items-center gap-4 mb-6 p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-800 font-medium text-sm">Draft approved</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-6 p-3 bg-gray-100 rounded-xl">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 font-medium text-sm">Awaiting revision</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            {renderRevisedText()}
          </div>

          {/* Arrow indicator when both panels have content */}
          {revisedText && (
            <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-3">
                <ArrowRight className="w-5 h-5 text-emerald-600" />
                <p className="text-emerald-800 text-sm">
                  <span className="font-medium">This revision addresses:</span> {shadowAnnotations.map(a => `"${a.text}"`).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text selection tooltip */}
      {showFlagTooltip && isAuthenticated && selectedText && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full animate-bounce-in"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <div className="bg-gradient-to-r from-poliscai-primary to-indigo-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <Flag className="w-4 h-4 text-poliscai-secondary" />
            <button
              onClick={handleOpenFlagModal}
              className="text-sm font-semibold hover:text-poliscai-secondary transition-colors"
            >
              Flag as bias
            </button>
            <span className="text-white/30">|</span>
            <button
              onClick={() => setShowFlagTooltip(false)}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-poliscai-primary" />
          </div>
        </div>
      )}

      {/* Annotation Details Modal */}
      {showAnnotationDetails && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAnnotationDetails(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
              <h3 className="text-white font-bold text-lg">Flagged Bias</h3>
              <p className="text-white/80 text-sm">Community-identified issue</p>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-serif font-bold text-red-800 bg-red-100 px-3 py-1 rounded-lg">
                  "{showAnnotationDetails.text}"
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getTypeConfig(showAnnotationDetails.type).bg} ${getTypeConfig(showAnnotationDetails.type).color}`}>
                  {getTypeConfig(showAnnotationDetails.type).label}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {showAnnotationDetails.description}
              </p>
              <button
                onClick={() => setShowAnnotationDetails(null)}
                className="mt-6 w-full py-3 bg-gradient-to-r from-poliscai-primary to-indigo-800 text-white font-medium rounded-xl hover:shadow-lg transition-shadow"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Submission Modal */}
      <FlagSubmissionModal
        isOpen={showFlagModal}
        onClose={handleModalClose}
        clauseId={clauseId}
        clauseRef={articleSection}
        flaggedText={selectedText || ''}
        flaggedTextStart={selectedIndices.start}
        flaggedTextEnd={selectedIndices.end}
        onSubmitSuccess={handleSubmissionSuccess}
      />
    </div>
  );
}

export default SideBySideViewer;
