/**
 * SideBySideViewer Component
 * PoliScai - Democracy V2.0
 *
 * Side-by-side display of V1.0 original and V2.0 revised text
 * with shadow highlights and text selection for flagging
 */

import React, { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FlagSubmissionModal } from './FlagSubmissionModal';

// Types for shadow annotations
interface ShadowAnnotation {
  id: string;
  text: string;           // The flagged text in V1.0
  startIndex: number;
  endIndex: number;
  description: string;    // Shadow surfaced explanation
  type: string;
}

// Types for V2.0 revisions
interface V2Revision {
  originalText: string;   // Text in V1.0 that was revised
  revisedText: string;    // New text in V2.0
  type: 'revised' | 'added';
}

interface SideBySideViewerProps {
  clauseId: string;
  articleSection: string;
  title: string;
  originalText: string;
  revisedText?: string;
  shadowAnnotations?: ShadowAnnotation[];
  v2Revisions?: V2Revision[];
  onTextSelect?: (selection: { text: string; startIndex: number; endIndex: number }) => void;
  onSubmissionSuccess?: () => void;
}

export function SideBySideViewer({
  clauseId,
  articleSection,
  title,
  originalText,
  revisedText,
  shadowAnnotations = [],
  v2Revisions = [],
  onTextSelect,
  onSubmissionSuccess,
}: SideBySideViewerProps) {
  const { isAuthenticated } = useAuth();
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState({ start: 0, end: 0 });
  const [showFlagTooltip, setShowFlagTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showFlagModal, setShowFlagModal] = useState(false);

  // Handle text selection in V1.0 panel
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

    // Calculate actual indices in the original text
    const startIndex = originalText.indexOf(text);
    const endIndex = startIndex !== -1 ? startIndex + text.length : text.length;

    // Get selection position for tooltip
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

  // Handle opening the flag modal
  const handleOpenFlagModal = () => {
    setShowFlagTooltip(false);
    setShowFlagModal(true);
    // Clear the selection
    window.getSelection()?.removeAllRanges();
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowFlagModal(false);
    setSelectedText(null);
  };

  // Handle successful submission
  const handleSubmissionSuccess = () => {
    onSubmissionSuccess?.();
  };

  // Render V1.0 text with shadow highlights
  const renderOriginalText = () => {
    if (shadowAnnotations.length === 0) {
      return (
        <p className="text-gray-800 leading-relaxed font-serif text-lg">
          {originalText}
        </p>
      );
    }

    // Sort annotations by start index
    const sorted = [...shadowAnnotations].sort((a, b) => a.startIndex - b.startIndex);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((annotation, i) => {
      // Add text before this annotation
      if (annotation.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${i}`}>
            {originalText.slice(lastIndex, annotation.startIndex)}
          </span>
        );
      }

      // Add highlighted text
      parts.push(
        <span
          key={`shadow-${i}`}
          className="bg-red-100 text-red-900 px-1 rounded cursor-pointer hover:bg-red-200 transition-colors"
          title={annotation.description}
        >
          {annotation.text}
        </span>
      );

      lastIndex = annotation.endIndex;
    });

    // Add remaining text
    if (lastIndex < originalText.length) {
      parts.push(<span key="text-end">{originalText.slice(lastIndex)}</span>);
    }

    return (
      <p className="text-gray-800 leading-relaxed font-serif text-lg">
        {parts}
      </p>
    );
  };

  // Render V2.0 text with revision highlights
  const renderRevisedText = () => {
    if (!revisedText) {
      return (
        <div className="text-gray-400 italic">
          No V2.0 revision has been proposed for this clause yet.
        </div>
      );
    }

    // For now, simple render - later we'll add highlighting logic
    return (
      <p className="text-gray-800 leading-relaxed font-serif text-lg">
        {revisedText}
      </p>
    );
  };

  // Render shadow surfaced explanation panel
  const renderShadowExplanation = () => {
    if (shadowAnnotations.length === 0) return null;

    return (
      <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg">
        <h4 className="text-red-800 font-semibold mb-2">Shadow surfaced:</h4>
        <p className="text-red-700 text-sm leading-relaxed">
          {shadowAnnotations.map((a) => `"${a.text}"`).join(', ')} in {articleSection.includes('Amendment') ? 'this amendment' : '1787'}{' '}
          {shadowAnnotations[0]?.description || 'contains implicit assumptions that excluded certain persons from constitutional protections.'}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 divide-x divide-gray-200">
        {/* V1.0 Original Panel */}
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Shadow
              <span className="text-gray-400 font-normal ml-1">
                — Original {articleSection.includes('Amendment') ? `(Ratified)` : '(1787)'}
              </span>
            </h3>
            <p className="text-poliscai-dark font-medium">
              {articleSection}
            </p>
          </div>

          {/* Content */}
          <div
            onMouseUp={handleMouseUp}
            className="select-text cursor-text"
          >
            {renderOriginalText()}
          </div>

          {/* Shadow explanation */}
          {renderShadowExplanation()}
        </div>

        {/* V2.0 Revised Panel */}
        <div className="p-6 md:p-8 bg-gray-50/50">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Revised
              <span className="text-gray-400 font-normal ml-1">
                — V2.0 (Community Draft)
              </span>
            </h3>
            <p className="text-poliscai-dark font-medium">
              {articleSection}
            </p>
          </div>

          {/* Content */}
          <div>
            {renderRevisedText()}
          </div>
        </div>
      </div>

      {/* Text selection tooltip */}
      {showFlagTooltip && isAuthenticated && selectedText && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <div className="bg-poliscai-dark text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
            <button
              onClick={handleOpenFlagModal}
              className="text-sm font-medium hover:text-poliscai-secondary transition-colors"
            >
              Flag as ambiguity
            </button>
            <span className="text-white/40">|</span>
            <button
              onClick={() => setShowFlagTooltip(false)}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-poliscai-dark" />
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
