/**
 * ClauseSelector Component - Enhanced Edition
 * PoliScai - Democracy V2.0
 *
 * Beautiful dropdown selector for navigating constitutional clauses
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, FileText, Scale, CheckCircle2 } from 'lucide-react';
import { ALL_ARTICLES, ALL_AMENDMENTS } from '../../data';

interface ClauseOption {
  id: string;
  label: string;
  title: string;
  category: 'article' | 'amendment';
}

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

// Demo data to show which have revisions
const CLAUSES_WITH_REVISIONS = ['article-1-section-2'];

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

  const filteredOptions = ALL_OPTIONS.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const articleOptions = filteredOptions.filter((opt) => opt.category === 'article');
  const amendmentOptions = filteredOptions.filter((opt) => opt.category === 'amendment');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const hasRevision = (id: string) => CLAUSES_WITH_REVISIONS.includes(id);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button - Glass morphism style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-auto min-w-[360px] flex items-center justify-between gap-4 px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-poliscai-secondary/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-poliscai-secondary" />
          </div>
          <div className="text-left">
            <span className="text-white font-medium">
              {selectedOption?.label || 'Select a clause'}
            </span>
            {selectedOption && (
              <span className="block text-white/60 text-sm truncate max-w-[200px]">
                {selectedOption.title}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-full min-w-[450px] max-h-[450px] overflow-hidden bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 animate-scale-in">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search articles and amendments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-poliscai-primary/20 focus:border-poliscai-primary text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {articleOptions.length > 0 && (
              <div>
                <div className="px-4 py-3 bg-gradient-to-r from-poliscai-primary/5 to-transparent flex items-center gap-2 sticky top-0 backdrop-blur-sm">
                  <FileText className="w-4 h-4 text-poliscai-primary" />
                  <span className="text-xs font-bold text-poliscai-primary uppercase tracking-wider">
                    Articles
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {articleOptions.length} sections
                  </span>
                </div>
                {articleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full px-4 py-3 text-left transition-all flex items-center gap-3 ${
                      opt.id === selectedId
                        ? 'bg-poliscai-primary/10 border-l-4 border-poliscai-primary'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex-1">
                      <span className={`font-semibold ${opt.id === selectedId ? 'text-poliscai-primary' : 'text-gray-800'}`}>
                        {opt.label}
                      </span>
                      <span className="text-gray-500 ml-2 text-sm">{opt.title}</span>
                    </div>
                    {hasRevision(opt.id) && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        V2.0
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {amendmentOptions.length > 0 && (
              <div>
                <div className="px-4 py-3 bg-gradient-to-r from-poliscai-secondary/5 to-transparent flex items-center gap-2 sticky top-0 backdrop-blur-sm">
                  <Scale className="w-4 h-4 text-poliscai-secondary" />
                  <span className="text-xs font-bold text-poliscai-secondary uppercase tracking-wider">
                    Amendments
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {amendmentOptions.length} amendments
                  </span>
                </div>
                {amendmentOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full px-4 py-3 text-left transition-all flex items-center gap-3 ${
                      opt.id === selectedId
                        ? 'bg-poliscai-primary/10 border-l-4 border-poliscai-primary'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex-1">
                      <span className={`font-semibold ${opt.id === selectedId ? 'text-poliscai-primary' : 'text-gray-800'}`}>
                        {opt.label}
                      </span>
                      <span className="text-gray-500 ml-2 text-sm">{opt.title}</span>
                    </div>
                    {hasRevision(opt.id) && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        V2.0
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {filteredOptions.length === 0 && (
              <div className="px-4 py-12 text-center">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No clauses found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Try searching for "{searchTerm.slice(0, 10)}..."
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClauseSelector;
