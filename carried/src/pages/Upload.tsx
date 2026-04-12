/**
 * Upload Meeting Minutes Page
 * Carried - Motions carry, memory too
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Sparkles,
  CheckCircle2,
  Loader2,
  Upload as UploadIcon,
  File,
  X,
} from 'lucide-react';
import { db, COLLECTIONS } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Group, MeetingSource, SegmentType, SEGMENT_TYPE_INFO } from '../types';
import { extractSegments, extractMeetingMetadata } from '../lib/ai/extraction';
import { saveSegments } from '../lib/firestore/segments';
import { parseFile, validateFile, getFileType } from '../lib/parsers/fileParser';

type ProcessingStep = 'idle' | 'creating' | 'extracting' | 'embedding' | 'complete' | 'error';

export function Upload() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [extractedCount, setExtractedCount] = useState<Record<SegmentType, number>>({} as Record<SegmentType, number>);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [minutes, setMinutes] = useState('');
  const [source, setSource] = useState<MeetingSource>('paste');
  const [detectingMetadata, setDetectingMetadata] = useState(false);
  const [autoDetected, setAutoDetected] = useState<{ title: boolean; date: boolean }>({ title: false, date: false });

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect title and date when text is pasted
  const handleMinutesChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const previousLength = minutes.length;
    setMinutes(newText);

    // Only trigger detection if:
    // 1. Text was pasted (significant length increase)
    // 2. Text is long enough to contain meeting metadata
    // 3. Not already detecting
    const isPaste = newText.length - previousLength > 50;
    const hasEnoughText = newText.length > 100;

    if (isPaste && hasEnoughText && !detectingMetadata) {
      console.log('CARRIED_DEBUG: Detecting meeting metadata from pasted text...');
      setDetectingMetadata(true);

      try {
        const metadata = await extractMeetingMetadata(newText);
        console.log('CARRIED_DEBUG: Detected metadata:', metadata);

        // Only auto-fill if fields are empty or were previously auto-detected
        if (metadata.title && (title === '' || autoDetected.title)) {
          setTitle(metadata.title);
          setAutoDetected(prev => ({ ...prev, title: true }));
        }

        if (metadata.date && (date === new Date().toISOString().split('T')[0] || autoDetected.date)) {
          setDate(metadata.date);
          setAutoDetected(prev => ({ ...prev, date: true }));
        }
      } catch (err) {
        console.error('CARRIED_DEBUG: Metadata detection failed:', err);
      } finally {
        setDetectingMetadata(false);
      }
    }
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setError('');
    setParsingFile(true);

    // Determine source type
    const fileType = getFileType(file);
    if (fileType === 'pdf') {
      setSource('pdf');
    } else if (fileType === 'docx') {
      setSource('docx');
    } else {
      setSource('paste');
    }

    try {
      console.log('CARRIED_DEBUG: Parsing file:', file.name);
      const result = await parseFile(file);

      if (result.error) {
        setError(result.error);
        setSelectedFile(null);
        return;
      }

      // Set the extracted text
      setMinutes(result.text);
      console.log(`CARRIED_DEBUG: Extracted ${result.text.length} characters from file`);

      // Auto-detect metadata from the parsed text
      if (result.text.length > 100) {
        setDetectingMetadata(true);
        try {
          const metadata = await extractMeetingMetadata(result.text);
          console.log('CARRIED_DEBUG: Detected metadata from file:', metadata);

          if (metadata.title) {
            setTitle(metadata.title);
            setAutoDetected(prev => ({ ...prev, title: true }));
          }
          if (metadata.date) {
            setDate(metadata.date);
            setAutoDetected(prev => ({ ...prev, date: true }));
          }
        } catch (err) {
          console.error('CARRIED_DEBUG: Metadata detection failed:', err);
        } finally {
          setDetectingMetadata(false);
        }
      }
    } catch (err) {
      console.error('CARRIED_DEBUG: File parsing error:', err);
      setError('Failed to parse file. Please try again.');
      setSelectedFile(null);
    } finally {
      setParsingFile(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setMinutes('');
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setAutoDetected({ title: false, date: false });
    setSource('paste');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    async function fetchGroup() {
      if (!groupId) return;
      try {
        const groupDoc = await getDoc(doc(db, COLLECTIONS.GROUPS, groupId));
        if (groupDoc.exists()) {
          setGroup({ id: groupDoc.id, ...groupDoc.data() } as Group);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('CARRIED_DEBUG: Error fetching group:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGroup();
  }, [groupId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupId || !title.trim() || !minutes.trim()) return;

    setError('');
    setProcessingStep('creating');

    try {
      // Step 1: Create meeting document
      const meetingData: Record<string, any> = {
        groupId,
        title: title.trim(),
        meetingDate: new Date(date),
        rawMinutes: minutes.trim(),
        source,
        processingStatus: 'processing',
        segmentCount: 0,
        motionCount: 0, // Legacy field
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add filename if uploaded from file
      if (selectedFile) {
        meetingData.fileName = selectedFile.name;
      }

      const meetingRef = await addDoc(collection(db, COLLECTIONS.MEETINGS), meetingData);
      console.log('CARRIED_DEBUG: Meeting created:', meetingRef.id);

      // Step 2: Extract segments using Gemini
      setProcessingStep('extracting');
      const { segments, error: extractionError } = await extractSegments(minutes.trim());

      if (extractionError) {
        console.warn('CARRIED_DEBUG: Extraction warning:', extractionError);
      }

      console.log(`CARRIED_DEBUG: Extracted ${segments.length} segments`);

      // Count segments by type
      const typeCounts: Record<SegmentType, number> = {} as Record<SegmentType, number>;
      segments.forEach((s) => {
        typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
      });
      setExtractedCount(typeCounts);

      // Step 3: Save segments with embeddings
      setProcessingStep('embedding');
      const { saved, failed, segmentIds } = await saveSegments(groupId, meetingRef.id, segments);

      console.log(`CARRIED_DEBUG: Saved ${saved} segments, ${failed} failed`);

      // Step 4: Update meeting with segment count
      const motionCount = segments.filter((s) => s.type === 'motion').length;
      await updateDoc(meetingRef, {
        processingStatus: 'completed',
        segmentCount: saved,
        motionCount, // For backwards compatibility
        segmentIds,
        updatedAt: serverTimestamp(),
      });

      setProcessingStep('complete');
      setTimeout(() => {
        navigate(`/groups/${groupId}`);
      }, 3000);
    } catch (err) {
      console.error('CARRIED_DEBUG: Error processing meeting:', err);
      setError('Failed to process meeting. Please try again.');
      setProcessingStep('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  // Processing / Success view
  if (processingStep !== 'idle' && processingStep !== 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center max-w-md mx-auto px-4">
            {processingStep === 'complete' ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Meeting Processed!</h2>
                <p className="text-gray-500 mb-6">
                  Successfully extracted and embedded meeting content.
                </p>

                {/* Segment breakdown */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Extracted Content</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(extractedCount).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-600">
                          {SEGMENT_TYPE_INFO[type as SegmentType]?.label || type}
                        </span>
                        <span className="font-semibold text-indigo-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-400 mt-4">Redirecting to group page...</p>
              </>
            ) : (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {processingStep === 'creating' && 'Saving Meeting...'}
                  {processingStep === 'extracting' && 'AI Analyzing Minutes...'}
                  {processingStep === 'embedding' && 'Generating Embeddings...'}
                </h2>
                <p className="text-gray-500">
                  {processingStep === 'creating' && 'Creating meeting record in database.'}
                  {processingStep === 'extracting' && 'Gemini is identifying motions, discussions, reports, and more.'}
                  {processingStep === 'embedding' && 'Creating semantic embeddings for search.'}
                </p>

                {/* Progress indicator */}
                <div className="flex justify-center gap-2 mt-6">
                  <div className={`w-3 h-3 rounded-full ${processingStep === 'creating' ? 'bg-indigo-500' : 'bg-green-500'}`} />
                  <div className={`w-3 h-3 rounded-full ${processingStep === 'extracting' ? 'bg-indigo-500' : processingStep === 'embedding' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className={`w-3 h-3 rounded-full ${processingStep === 'embedding' ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(`/groups/${groupId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {group?.name}
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Meeting Minutes</h1>
              <p className="text-gray-500">Paste or upload meeting minutes to extract all content</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Upload File OR Paste Minutes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  1. Upload File or Paste Minutes
                </label>
                {(detectingMetadata || parsingFile) && (
                  <div className="flex items-center gap-2 text-indigo-600 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {parsingFile ? 'Parsing file...' : 'Detecting title & date...'}
                  </div>
                )}
              </div>

              {/* File Upload Dropzone */}
              {!selectedFile && !minutes && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.pdf,.txt"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <UploadIcon className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports DOCX, PDF, and TXT files (max 10MB)
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <File className="w-4 h-4" /> DOCX
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" /> PDF
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" /> TXT
                    </span>
                  </div>
                </div>
              )}

              {/* Selected File Display */}
              {selectedFile && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <File className="w-8 h-8 text-green-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-green-800 truncate">{selectedFile.name}</p>
                    <p className="text-sm text-green-600">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                      {minutes && ` • ${minutes.length.toLocaleString()} characters extracted`}
                    </p>
                    {minutes && minutes.includes('AUTHORITATIVE VOTING RECORDS') && (
                      <p className="text-xs text-indigo-600 mt-1 font-medium">
                        ✓ Vision extracted voting tables from PDF images
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="p-1 hover:bg-green-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-green-600" />
                  </button>
                </div>
              )}

              {/* Divider when no file */}
              {!selectedFile && !minutes && (
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-sm text-gray-400">or paste text below</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              )}

              {/* Textarea for paste (shown when no file selected, or to show extracted content) */}
              {(!selectedFile || minutes) && (
                <div className="relative">
                  <Textarea
                    placeholder={selectedFile ? '' : `Paste your meeting minutes here...

The AI will automatically detect the meeting title and date from your text.`}
                    value={minutes}
                    onChange={handleMinutesChange}
                    rows={selectedFile ? 6 : 10}
                    required
                    disabled={parsingFile}
                    className={selectedFile ? 'bg-gray-50' : ''}
                  />
                  {selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Text extracted from file. You can edit if needed.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Auto-detection success notice */}
            {(autoDetected.title || autoDetected.date) && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Auto-detected: {autoDetected.title && 'title'}
                  {autoDetected.title && autoDetected.date && ' and '}
                  {autoDetected.date && 'date'} - review below
                </span>
              </div>
            )}

            {/* Step 2: Title and Date (auto-filled or manual) */}
            {minutes.trim().length > 0 && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  2. Confirm Meeting Details
                  {autoDetected.title && autoDetected.date && (
                    <span className="text-green-600 ml-2">(auto-detected)</span>
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Meeting Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Meeting Title
                      {autoDetected.title && <span className="text-green-500 ml-1">✓</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Board Meeting - January 2025"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setAutoDetected(prev => ({ ...prev, title: false }));
                      }}
                      className={`w-full px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        autoDetected.title ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'
                      }`}
                      required
                    />
                  </div>

                  {/* Meeting Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Meeting Date
                      {autoDetected.date && <span className="text-green-500 ml-1">✓</span>}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value);
                          setAutoDetected(prev => ({ ...prev, date: false }));
                        }}
                        className={`w-full pl-10 pr-4 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          autoDetected.date ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Notice */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-900">AI-Powered Extraction</p>
                <p className="text-sm text-indigo-700">
                  Gemini AI will extract motions, votes, discussions, reports, and more from your minutes.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/groups/${groupId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || !minutes.trim() || detectingMetadata || parsingFile}
              >
                {parsingFile ? 'Parsing File...' : detectingMetadata ? 'Detecting...' : 'Upload & Extract Content'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Upload;
