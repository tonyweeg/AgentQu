/**
 * Document Home Page
 * The Open Document Project - Powered by PoliScAI
 *
 * Card grid for selecting which document to work on
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/layout/AppHeader';
import { DOCUMENTS, DocumentInfo } from '../types/document';
import {
  FileText,
  Scale,
  Building2,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

// Icon mapping for document types
const TYPE_ICONS: Record<string, React.ReactNode> = {
  constitution: <Scale className="w-8 h-8" />,
  charter: <Building2 className="w-8 h-8" />,
  ordinance: <FileText className="w-8 h-8" />,
  bylaw: <FileText className="w-8 h-8" />,
  other: <FileText className="w-8 h-8" />,
};

// Color mapping for document types
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  constitution: { bg: 'from-blue-600 to-indigo-700', text: 'text-blue-600', border: 'border-blue-200' },
  charter: { bg: 'from-emerald-600 to-green-700', text: 'text-emerald-600', border: 'border-emerald-200' },
  ordinance: { bg: 'from-amber-600 to-orange-700', text: 'text-amber-600', border: 'border-amber-200' },
  bylaw: { bg: 'from-purple-600 to-violet-700', text: 'text-purple-600', border: 'border-purple-200' },
  other: { bg: 'from-gray-600 to-slate-700', text: 'text-gray-600', border: 'border-gray-200' },
};

function DocumentCard({ doc }: { doc: DocumentInfo }) {
  const navigate = useNavigate();
  const colors = TYPE_COLORS[doc.type] || TYPE_COLORS.other;

  const handleClick = () => {
    navigate(`/documents/${doc.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border ${colors.border}`}
    >
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${colors.bg} p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            {TYPE_ICONS[doc.type]}
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium uppercase tracking-wide">
            {doc.type}
          </span>
        </div>
        <h3 className="mt-4 text-xl font-bold leading-tight">{doc.name}</h3>
        <div className="flex items-center gap-2 mt-2 text-white/80 text-sm">
          <MapPin className="w-4 h-4" />
          <span>{doc.jurisdiction}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {doc.description}
        </p>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          {doc.dateAdopted && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{new Date(doc.dateAdopted).getFullYear()}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-gray-500">
            <FileText className="w-4 h-4" />
            <span>{doc.sectionCount} sections</span>
          </div>
          {doc.submissionCount > 0 && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <Users className="w-4 h-4" />
              <span>{doc.submissionCount} flags</span>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="mt-6 flex items-center justify-between">
          <button className={`flex items-center gap-2 ${colors.text} font-medium text-sm group-hover:gap-3 transition-all`}>
            Open Document
            <ChevronRight className="w-4 h-4" />
          </button>
          {doc.sourceUrl && (
            <a
              href={doc.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="View original source"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.text.replace('text-', '') }} />
    </div>
  );
}

export function DocumentHome() {
  const activeDocuments = DOCUMENTS.filter(d => d.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <AppHeader />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-sky-400" />
            <span className="text-sky-400 font-medium">Powered by PoliScAI</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            The Open Document Project
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Community-driven scholarship for founding documents. Surface biases, propose revisions, and build more inclusive governance.
          </p>
        </div>
      </div>

      {/* Document Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Documents</h2>
            <p className="text-gray-500 mt-1">Select a document to begin reviewing and contributing</p>
          </div>
          <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">
            {activeDocuments.length} document{activeDocuments.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeDocuments.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}

          {/* Coming Soon Card */}
          <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">More Coming Soon</h3>
            <p className="text-gray-400 text-sm">
              Have a document you'd like to see here? Let us know!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>The Open Document Project is open source and community-driven.</p>
          <p className="mt-1">Engine: <strong>PoliScAI</strong> - Constitutional Scholarship AI</p>
        </div>
      </div>
    </div>
  );
}

export default DocumentHome;
