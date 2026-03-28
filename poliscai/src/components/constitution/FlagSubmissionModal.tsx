/**
 * FlagSubmissionModal Component
 * PoliScai - Democracy V2.0
 *
 * Modal for submitting ambiguity flags on constitutional text
 */

import React, { useState } from 'react';
import { X, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createSubmission } from '../../lib/firestore/submissions';
import { AmbiguityType } from '../../types/submission';

interface FlagSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clauseId: string;
  clauseRef: string;
  flaggedText: string;
  flaggedTextStart: number;
  flaggedTextEnd: number;
  onSubmitSuccess?: () => void;
}

const AMBIGUITY_TYPES: { value: AmbiguityType; label: string; description: string }[] = [
  {
    value: 'gender_assumption',
    label: 'Gender Assumption',
    description: 'Text assumes male as default or excludes women',
  },
  {
    value: 'racial_exclusion',
    label: 'Racial Exclusion',
    description: 'Text excludes or discriminates based on race',
  },
  {
    value: 'economic_exclusion',
    label: 'Economic Exclusion',
    description: 'Text privileges property owners or excludes the poor',
  },
  {
    value: 'citizenship_definition',
    label: 'Citizenship Definition',
    description: 'Ambiguous or exclusionary definition of citizenship',
  },
  {
    value: 'deferred_to_state',
    label: 'Deferred to States',
    description: 'Allows states to define rights inconsistently',
  },
  {
    value: 'pronoun_language_bias',
    label: 'Pronoun/Language Bias',
    description: 'Uses gendered pronouns or biased language',
  },
  {
    value: 'corporate_personhood',
    label: 'Corporate Personhood',
    description: 'Ambiguity enabling corporate constitutional rights',
  },
  {
    value: 'religious_assumption',
    label: 'Religious Assumption',
    description: 'Assumes or privileges a particular religious view',
  },
  {
    value: 'age_exclusion',
    label: 'Age Exclusion',
    description: 'Excludes or discriminates based on age',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other type of shadow or ambiguity',
  },
];

export function FlagSubmissionModal({
  isOpen,
  onClose,
  clauseId,
  clauseRef,
  flaggedText,
  flaggedTextStart,
  flaggedTextEnd,
  onSubmitSuccess,
}: FlagSubmissionModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<AmbiguityType>('other');
  const [shadowDescription, setShadowDescription] = useState('');
  const [citation, setCitation] = useState('');
  const [eraOperative, setEraOperative] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be signed in to submit a flag.');
      return;
    }

    if (!shadowDescription.trim()) {
      setError('Please describe the shadow or ambiguity.');
      return;
    }

    if (shadowDescription.length > 500) {
      setError('Description must be 500 characters or less.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createSubmission({
        clauseId,
        clauseRef,
        flaggedText,
        flaggedTextStart,
        flaggedTextEnd,
        type,
        shadowDescription: shadowDescription.trim(),
        citation: citation.trim() || undefined,
        eraOperative: eraOperative.trim() || undefined,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous Scholar',
      });

      // Reset form
      setType('other');
      setShadowDescription('');
      setCitation('');
      setEraOperative('');

      onSubmitSuccess?.();
      onClose();
    } catch (err) {
      console.error('POLISCAI_DEBUG: Error submitting flag:', err);
      setError('Failed to submit flag. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-poliscai-primary text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Flag Ambiguity</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Selected Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Text from {clauseRef}
            </label>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-900 font-serif italic">"{flaggedText}"</p>
            </div>
          </div>

          {/* Ambiguity Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Shadow/Ambiguity *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AmbiguityType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-poliscai-primary focus:border-transparent"
            >
              {AMBIGUITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} — {t.description}
                </option>
              ))}
            </select>
          </div>

          {/* Shadow Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe the Shadow *
              <span className="text-gray-400 font-normal ml-2">
                ({shadowDescription.length}/500)
              </span>
            </label>
            <textarea
              value={shadowDescription}
              onChange={(e) => setShadowDescription(e.target.value)}
              placeholder="Explain what this text assumes, excludes, or how it has been historically interpreted to limit rights..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-poliscai-primary focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Be specific about who was excluded and how this language enabled that exclusion.
            </p>
          </div>

          {/* Citation (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Historical Citation
              <span className="text-gray-400 font-normal ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={citation}
              onChange={(e) => setCitation(e.target.value)}
              placeholder="e.g., Dred Scott v. Sandford (1857)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-poliscai-primary focus:border-transparent"
            />
          </div>

          {/* Era Operative (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Era Operative
              <span className="text-gray-400 font-normal ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={eraOperative}
              onChange={(e) => setEraOperative(e.target.value)}
              placeholder="e.g., 1787–1868"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-poliscai-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              When was this interpretation actively enforced?
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Community Note */}
          <div className="mb-6 p-4 bg-poliscai-primary/5 border border-poliscai-primary/20 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong className="text-poliscai-dark">Community Review:</strong> Your submission will be
              reviewed by the community. If 75% of voters approve, it will be added to the canon of
              surfaced shadows for this clause.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !shadowDescription.trim()}
              className="px-6 py-3 bg-poliscai-primary text-white rounded-lg hover:bg-poliscai-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Flag
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FlagSubmissionModal;
