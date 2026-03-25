import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  BarChart3, 
  BookOpen, 
  Trash2, 
  Info, 
  CheckCircle2,
  ChevronRight,
  FileSearch,
  Settings2,
  Check,
  Download
} from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { 
  extractTextFromFile, 
  analyzeAcademicWordCount, 
  AcademicCountResult, 
  DEFAULT_MARKERS,
  ExclusionMarker
} from './lib/fileParser';
import { cn } from './lib/utils';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AcademicCountResult | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
  const [markers, setMarkers] = useState<ExclusionMarker[]>(DEFAULT_MARKERS);
  const [showSettings, setShowSettings] = useState(true);

  const handleFileSelect = async (selectedFile: File) => {
    setIsLoading(true);
    setFile(selectedFile);
    
    try {
      const text = await extractTextFromFile(selectedFile);
      setRawText(text);
      const analysis = analyzeAcademicWordCount(text, markers);
      setResult(analysis);
    } catch (error) {
      console.error('Error processing file:', error);
      setFile(null);
      setRawText(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-analyze if markers change
  useEffect(() => {
    if (rawText) {
      const analysis = analyzeAcademicWordCount(rawText, markers);
      setResult(analysis);
    }
  }, [markers, rawText]);

  const toggleMarker = (id: string) => {
    setMarkers(prev => prev.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const handleDownload = () => {
    if (!result) return;
    
    const blob = new Blob([result.mainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic_text_${file?.name.replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setRawText(null);
    setResult(null);
    setViewMode('summary');
  };

  const exclusionPercentage = useMemo(() => {
    if (!result || result.totalCount === 0) return 0;
    return Math.round(((result.totalCount - result.academicCount) / result.totalCount) * 100);
  }, [result]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">AcademicCount</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium",
                showSettings ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Settings2 className="w-4 h-4" />
              Exclusion Rules
            </button>
            {file && (
              <button 
                onClick={reset}
                className="text-sm font-medium text-slate-500 hover:text-red-600 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800">Smart Exclusion Rules</h3>
                    <p className="text-sm text-slate-500">Select which sections should be excluded from the academic count.</p>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {markers.map(marker => (
                    <button
                      key={marker.id}
                      onClick={() => toggleMarker(marker.id)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                        marker.enabled 
                          ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      {marker.label}
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                        marker.enabled ? "bg-blue-600 text-white" : "bg-slate-100 text-transparent"
                      )}>
                        <Check className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  Precise word counts for <br />
                  <span className="text-blue-600">academic excellence.</span>
                </h2>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                  Automatically exclude bibliographies, references, and appendices to get your true academic word count in seconds.
                </p>
              </div>

              <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Smart Exclusion</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Detects common academic section headers like "References" or "Bibliography" to isolate main text.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="bg-green-50 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Multi-Format</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Full support for PDF, DOCX, and plain text files. No conversion needed.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="bg-purple-50 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Privacy First</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    All processing happens locally in your browser. Your documents are never uploaded to a server.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Result Summary Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-8 text-white">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">{file?.name}</span>
                      </div>
                      <h2 className="text-3xl font-bold">Analysis Complete</h2>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setViewMode('summary')}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                          viewMode === 'summary' ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"
                        )}
                      >
                        Summary
                      </button>
                      <button 
                        onClick={() => setViewMode('details')}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                          viewMode === 'details' ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"
                        )}
                      >
                        Text Preview
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {viewMode === 'summary' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Academic Word Count</p>
                          <div className="flex items-baseline gap-3">
                            <span className="text-7xl font-black text-blue-600 tabular-nums">{result.academicCount.toLocaleString()}</span>
                            <span className="text-xl font-medium text-slate-400">words</span>
                          </div>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Count</p>
                            <p className="text-2xl font-bold text-slate-800 tabular-nums">{result.totalCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Excluded</p>
                            <p className="text-2xl font-bold text-red-500 tabular-nums">
                              -{(result.totalCount - result.academicCount).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <FileSearch className="w-5 h-5 text-blue-600" />
                          </div>
                          <h3 className="font-bold text-slate-800">Exclusion Breakdown</h3>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-medium text-slate-600">Excluded Content</span>
                            <span className="text-sm font-bold text-slate-900">{exclusionPercentage}%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${exclusionPercentage}%` }}
                              className="h-full bg-blue-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detected Markers</p>
                          {result.excludedSections.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {result.excludedSections.map((section, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 shadow-sm">
                                  {section}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-500 italic text-sm">
                              <Info className="w-4 h-4" />
                              No specific exclusion markers found.
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-xs text-blue-700 leading-relaxed">
                            <strong>Note:</strong> The academic count includes everything up to the first detected reference or appendix section.
                          </p>
                        </div>

                        <button
                          onClick={handleDownload}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-[0.98]"
                        >
                          <Download className="w-4 h-4" />
                          Download Academic Text (.txt)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
                        <div className="flex flex-col border border-slate-200 rounded-2xl overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Content</span>
                            <span className="text-xs font-medium text-slate-400">{result.academicCount} words</span>
                          </div>
                          <div className="flex-1 p-4 overflow-y-auto text-sm text-slate-600 leading-relaxed font-mono whitespace-pre-wrap bg-white">
                            {result.mainText || "No content detected."}
                          </div>
                        </div>
                        <div className="flex flex-col border border-slate-200 rounded-2xl overflow-hidden">
                          <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Excluded Content</span>
                            <span className="text-xs font-medium text-red-400">{result.totalCount - result.academicCount} words</span>
                          </div>
                          <div className="flex-1 p-4 overflow-y-auto text-sm text-slate-400 leading-relaxed font-mono whitespace-pre-wrap bg-slate-50">
                            {result.excludedText || "No excluded content detected."}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={reset}
                  className="group flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  Analyze Another Document
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-400">
            © 2026 AcademicCount. Built for researchers and students.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
