/**
 * ClauseSelector Component
 * PoliScai - Democracy V2.0
 *
 * Dropdown selector for navigating to specific constitutional clauses
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { ALL_ARTICLES, ALL_AMENDMENTS } from '../../data';

interface ClauseOption {
  id: string;
  label: string;
  title: string;
  category: 'article' | 'amendment';
}

// Build options from data
const buildOptions = (): ClauseOption[] => {
  const options: ClauseOption[] = [];

  ALL_ARTICLES.forEach((article) => {
    options.push({
      id: article.id,
      label: article.articleSection,
      title: article.title,
      category: 'article',
    });
  });

  ALL_AMENDMENTS.forEach((amendment) => {
    options.push({
      id: amendment.id,
      label: amendment.articleSection,
      title: amendment.title,
      category: 'amendment',
    });
  });

  return options;
};

const ALL_OPTIONS = buildOptions();

interface ClauseSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ClauseSelector({ selectedId, onSelect }: ClauseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = ALL_OPTIONS.find((opt) => opt.id === selectedId);

  // Filter options based on search
  const filteredOptions = ALL_OPTIONS.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const articleOptions = filteredOptions.filter((opt) => opt.category === 'article');
  const amendmentOptions = filteredOptions.filter((opt) => opt.category === 'amendment');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-auto min-w-[400px] flex items-center justify-between gap-4 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-poliscai-primary/50 transition-colors"
      >
        <div className="text-left">
          <span className="text-poliscai-dark font-medium">
            {selectedOption?.label || 'Select a clause'}
          </span>
          {selectedOption && (
            <span className="text-gray-500 ml-2">({selectedOption.title})</span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[500px] max-h-[400px] overflow-hidden bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search articles and amendments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-poliscai-primary"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-[320px] overflow-y-auto">
            {articleOptions.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                  Articles
                </div>
                {articleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-poliscai-primary/5 transition-colors ${
                      opt.id === selectedId ? 'bg-poliscai-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium text-poliscai-dark">{opt.label}</span>
                    <span className="text-gray-500 ml-2 text-sm">{opt.title}</span>
                  </button>
                ))}
              </div>
            )}

            {amendmentOptions.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                  Amendments
                </div>
                {amendmentOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-poliscai-primary/5 transition-colors ${
                      opt.id === selectedId ? 'bg-poliscai-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium text-poliscai-dark">{opt.label}</span>
                    <span className="text-gray-500 ml-2 text-sm">{opt.title}</span>
                  </button>
                ))}
              </div>
            )}

            {filteredOptions.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No clauses found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClauseSelector;
