/**
 * Upload Meeting Minutes Page
 * Carried - Motions carry, memory too
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
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
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { db, COLLECTIONS } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useGroupMembership } from '../hooks/useGroupMembership';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Group, Meeting, MeetingSource, SegmentType, SEGMENT_TYPE_INFO } from '../types';
import { extractSegments, extractMeetingMetadata } from '../lib/ai/extraction';
import { saveSegments } from '../lib/firestore/segments';
import { parseFile, validateFile, getFileType } from '../lib/parsers/fileParser';
import { useFileDrop } from '../contexts/FileDropContext';

type ProcessingStep = 'idle' | 'creating' | 'extracting' | 'embedding' | 'complete' | 'error';

export function Upload() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { canAddMeetings, loading: membershipLoading } = useGroupMembership(groupId);
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

  // File drop context (for drag-drop from GroupHome)
  const { pendingFile, setPendingFile } = useFileDrop();

  // Duplicate detection state
  const [duplicateMeeting, setDuplicateMeeting] = useState<Meeting | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

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
    } else if (fileType === 'xlsx') {
      setSource('xlsx');
    } else {
      setSource('paste');
    }

    try {
      console.log('CARRIED_DEBUG: Starting parseFile for:', file.name, file.size, 'bytes');
      console.log('CARRIED_DEBUG: File type:', file.type);
      const result = await parseFile(file);
      console.log('CARRIED_DEBUG: parseFile returned:', result.text?.length || 0, 'chars, error:', result.error);

      if (result.error) {
        setError(result.error);
        setSelectedFile(null);
        return;
      }

      // Set the extracted text
      setMinutes(result.text);
      console.log(`CARRIED_DEBUG: Extracted ${result.text.length} characters from file`);

      // Auto-detect metadata from the parsed text
      let detectedTitle = '';
      let detectedDate = '';

      if (result.text.length > 100) {
        setDetectingMetadata(true);
        try {
          const metadata = await extractMeetingMetadata(result.text);
          console.log('CARRIED_DEBUG: Detected metadata from file:', metadata);

          if (metadata.title) {
            detectedTitle = metadata.title;
            setTitle(metadata.title);
            setAutoDetected(prev => ({ ...prev, title: true }));
          }
          if (metadata.date) {
            detectedDate = metadata.date;
            setDate(metadata.date);
            setAutoDetected(prev => ({ ...prev, date: true }));
          }
        } catch (err) {
          console.error('CARRIED_DEBUG: Metadata detection failed:', err);
        } finally {
          setDetectingMetadata(false);
        }
      }

      // AUTO-SUBMIT: If we have text, title, and date, automatically process
      if (result.text.trim() && detectedTitle && detectedDate) {
        console.log('CARRIED_DEBUG: Auto-submitting with detected metadata');
        // Pass values directly to avoid state timing issues
        await processSubmission({
          title: detectedTitle,
          date: detectedDate,
          minutes: result.text,
        });
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

  // Redirect non-members
  useEffect(() => {
    if (!membershipLoading && !canAddMeetings && !loading) {
      console.log('CARRIED_DEBUG: User cannot add meetings, redirecting to group home');
      navigate(`/groups/${groupId}`);
    }
  }, [membershipLoading, canAddMeetings, loading, navigate, groupId]);

  // Handle pending file from drag-drop on GroupHome
  useEffect(() => {
    if (pendingFile && !parsingFile && !selectedFile) {
      console.log('CARRIED_DEBUG: Processing pending file from drag-drop:', pendingFile.name);
      handleFileSelect(pendingFile);
      setPendingFile(null); // Clear the pending file
    }
  }, [pendingFile, parsingFile, selectedFile, setPendingFile]);

  // Check for duplicate meetings
  const checkForDuplicates = async (): Promise<Meeting | null> => {
    if (!groupId || !date) return null;

    try {
      setCheckingDuplicates(true);
      console.log('CARRIED_DEBUG: Checking for duplicates...');

      // Query meetings with same date in this group
      const meetingsRef = collection(db, COLLECTIONS.MEETINGS);
      const meetingDate = new Date(date);

      // Create date range for the same day
      const startOfDay = new Date(meetingDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(meetingDate);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        meetingsRef,
        where('groupId', '==', groupId),
        where('meetingDate', '>=', startOfDay),
        where('meetingDate', '<=', endOfDay)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Check for title similarity
        const trimmedTitle = title.trim().toLowerCase();

        for (const docSnap of snapshot.docs) {
          const meeting = { id: docSnap.id, ...docSnap.data() } as Meeting;
          const existingTitle = (meeting.title || '').toLowerCase();

          // Check for exact match or high similarity
          if (
            existingTitle === trimmedTitle ||
            existingTitle.includes(trimmedTitle) ||
            trimmedTitle.includes(existingTitle) ||
            calculateSimilarity(existingTitle, trimmedTitle) > 0.7
          ) {
            console.log('CARRIED_DEBUG: Found potential duplicate:', meeting.title);
            return meeting;
          }
        }

        // Even if titles don't match, same date is suspicious
        if (snapshot.docs.length > 0) {
          const firstMatch = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Meeting;
          console.log('CARRIED_DEBUG: Found meeting on same date:', firstMatch.title);
          return firstMatch;
        }
      }

      return null;
    } catch (error) {
      console.error('CARRIED_DEBUG: Error checking duplicates:', error);
      return null;
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Simple string similarity (Dice coefficient)
  const calculateSimilarity = (str1: string, str2: string): number => {
    if (str1 === str2) return 1;
    if (str1.length < 2 || str2.length < 2) return 0;

    const bigrams1 = new Set<string>();
    const bigrams2 = new Set<string>();

    for (let i = 0; i < str1.length - 1; i++) {
      bigrams1.add(str1.substring(i, i + 2));
    }
    for (let i = 0; i < str2.length - 1; i++) {
      bigrams2.add(str2.substring(i, i + 2));
    }

    let intersection = 0;
    bigrams1.forEach((bigram) => {
      if (bigrams2.has(bigram)) intersection++;
    });

    return (2 * intersection) / (bigrams1.size + bigrams2.size);
  };

  // Handle form submission with duplicate check
  const handleSubmitWithDuplicateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupId || !title.trim() || !minutes.trim()) return;

    // First check for duplicates
    const duplicate = await checkForDuplicates();
    if (duplicate) {
      setDuplicateMeeting(duplicate);
      setShowDuplicateWarning(true);
      return;
    }

    // No duplicate found, proceed with submission
    await processSubmission();
  };

  // Process the actual submission (called directly or after duplicate warning)
  // Can accept override values for auto-submit scenarios
  const processSubmission = async (overrides?: { title?: string; date?: string; minutes?: string }) => {
    const submitTitle = overrides?.title || title;
    const submitDate = overrides?.date || date;
    const submitMinutes = overrides?.minutes || minutes;

    if (!user || !groupId || !submitTitle.trim() || !submitMinutes.trim()) return;

    setShowDuplicateWarning(false);
    setDuplicateMeeting(null);
    setError('');
    setProcessingStep('creating');

    try {
      // Step 1: Create meeting document
      const meetingData: Record<string, any> = {
        groupId,
        title: submitTitle.trim(),
        meetingDate: new Date(submitDate),
        rawMinutes: submitMinutes.trim(),
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
      const { segments, error: extractionError } = await extractSegments(submitMinutes.trim());

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
        navigate(`/groups/${groupId}`, {
          state: {
            uploadedMeeting: submitTitle.trim(),
            uploadedFile: selectedFile?.name || null
          }
        });
      }, 2000);
    } catch (err) {
      console.error('CARRIED_DEBUG: Error processing meeting:', err);
      setError('Failed to process meeting. Please try again.');
      setProcessingStep('error');
    }
  };

  if (loading || membershipLoading) {
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

          <form onSubmit={handleSubmitWithDuplicateCheck} className="space-y-6">
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
                    accept=".docx,.pdf,.txt,.xlsx,.xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <UploadIcon className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports DOCX, PDF, TXT, and XLSX files (max 30MB)
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
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" /> XLSX
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
                disabled={!title.trim() || !minutes.trim() || detectingMetadata || parsingFile || checkingDuplicates}
              >
                {checkingDuplicates ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking for duplicates...
                  </>
                ) : parsingFile ? (
                  'Parsing File...'
                ) : detectingMetadata ? (
                  'Detecting...'
                ) : (
                  'Upload & Extract Content'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && duplicateMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Possible Duplicate Detected</h3>
                <p className="text-sm text-gray-500">A similar meeting may already exist</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Existing meeting found:</p>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{duplicateMeeting.title}</p>
                  <p className="text-sm text-gray-500">
                    {duplicateMeeting.meetingDate?.toDate
                      ? duplicateMeeting.meetingDate.toDate().toLocaleDateString()
                      : 'Date unknown'}
                    {duplicateMeeting.segmentCount !== undefined && (
                      <span className="ml-2">• {duplicateMeeting.segmentCount} segments</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDuplicateWarning(false);
                  navigate(`/groups/${groupId}/meetings/${duplicateMeeting.id}`);
                }}
                className="w-full justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Existing Meeting
              </Button>
              <Button
                onClick={() => processSubmission()}
                className="w-full justify-center"
              >
                Upload Anyway
              </Button>
              <button
                onClick={() => {
                  setShowDuplicateWarning(false);
                  setDuplicateMeeting(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;
