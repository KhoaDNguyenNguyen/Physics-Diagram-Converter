import React, { useState, useCallback, useEffect } from 'react';
import { usePhysicsDiagramConverter } from './hooks/usePhysicsDiagramConverter';
import ImageUploader from './components/ImageUploader';
import SvgDisplay from './components/SvgDisplay';
import StatusBar from './components/StatusBar';
import SvgCodeEditor from './components/SvgCodeEditor';
import InteractiveSvgEditor from './components/InteractiveSvgEditor';
import { AnalysisStatus } from './types';
import { CodeIcon, DownloadIcon, RefreshIcon, SparklesIcon, UndoIcon, RedoIcon, KeyIcon, SpinnerIcon } from './components/icons/Icons';
import ApiKeyModal from './components/ApiKeyModal';
import { validateApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [isInitialKeyCheck, setIsInitialKeyCheck] = useState<boolean>(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const {
    status,
    selectedFile,
    previewUrl,
    diagramComponents,
    svgContent,
    error,
    handleFileSelect,
    handleConvert,
    handleDownload,
    handleReset,
    setDiagramComponents,
    canUndo,
    canRedo,
    undo,
    redo,
  } = usePhysicsDiagramConverter(apiKey);

  const [isEditorVisible, setIsEditorVisible] = useState(false);

  const handleVerifyKey = useCallback(async (keyToVerify: string) => {
    if (!keyToVerify) {
      setApiKeyError("API Key cannot be empty.");
      return;
    }
    setIsVerifyingKey(true);
    setApiKeyError(null);
    try {
      const isValid = await validateApiKey(keyToVerify);
      if (isValid) {
        setApiKey(keyToVerify);
        setIsApiKeyValid(true);
        localStorage.setItem('gemini_api_key', keyToVerify);
      } else {
        throw new Error("Invalid API Key. Please check your key and try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred during validation.";
      setApiKeyError(message);
      setIsApiKeyValid(false);
      localStorage.removeItem('gemini_api_key');
    } finally {
      setIsVerifyingKey(false);
      setIsInitialKeyCheck(false);
    }
  }, []);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      handleVerifyKey(storedKey);
    } else {
      setIsInitialKeyCheck(false);
    }
  }, [handleVerifyKey]);
  
  const handleClearKey = () => {
    setApiKey('');
    setIsApiKeyValid(false);
    localStorage.removeItem('gemini_api_key');
    setApiKeyError(null);
  }

  const isProcessing = status === AnalysisStatus.ANALYZING;
  const isSuccess = status === AnalysisStatus.SUCCESS;

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            // Prevent pasting the image into editable fields
            event.preventDefault(); 
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handleFileSelect]);

  if (isInitialKeyCheck) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center">
        <SpinnerIcon />
        <p className="mt-4 text-lg font-semibold text-gray-600">Verifying API Key...</p>
      </div>
    );
  }

  return (
    <>
      {!isApiKeyValid && (
        <ApiKeyModal
          onVerify={handleVerifyKey}
          isVerifying={isVerifyingKey}
          error={apiKeyError}
        />
      )}
      <div className={`min-h-screen bg-base-200 text-base-content font-sans ${!isApiKeyValid ? 'blur-sm pointer-events-none' : ''}`}>
        <header className="bg-base-100 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Physics Diagram Converter
              </h1>
              <span className="hidden sm:block text-sm font-medium text-gray-500">
                Powered by Nguyễn Nguyễn Đăng Khoa
              </span>
            </div>
             <button onClick={handleClearKey} title="Change API Key" className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors">
                <KeyIcon />
             </button>
          </div>
        </header>

        <main className="container mx-auto p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="bg-base-100 p-6 rounded-lg shadow-lg flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-base-content">
                1. Upload Diagram
              </h2>
              <ImageUploader
                onFileSelect={handleFileSelect}
                previewUrl={previewUrl}
                disabled={isProcessing}
              />
              {previewUrl && (
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleConvert}
                    disabled={!selectedFile || isProcessing || !isApiKeyValid}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                  >
                    <SparklesIcon />
                    {isProcessing ? 'Analyzing...' : 'Convert to SVG'}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                  >
                    <RefreshIcon />
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Output Panel */}
            <div className="bg-base-100 p-6 rounded-lg shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                <h2 className="text-xl font-semibold text-base-content">
                  2. Edit & Download SVG
                </h2>
                {isSuccess && diagramComponents && (
                   <div className="flex items-center gap-2">
                      <button onClick={undo} disabled={!canUndo} className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                          <UndoIcon />
                      </button>
                       <button onClick={redo} disabled={!canRedo} className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                          <RedoIcon />
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <button
                        onClick={() => setIsEditorVisible(!isEditorVisible)}
                        className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg shadow-md transition-all ${
                          isEditorVisible ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <CodeIcon />
                        {isEditorVisible ? 'Hide Code' : 'View Code'}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all"
                      >
                        <DownloadIcon />
                        Download
                      </button>
                   </div>
                )}
              </div>
              <div className="flex-grow flex flex-col gap-4">
                {isSuccess && diagramComponents ? (
                  <InteractiveSvgEditor
                    components={diagramComponents}
                    onComponentsChange={setDiagramComponents}
                  />
                ) : (
                  <SvgDisplay status={status} error={error} />
                )}
                {isSuccess && isEditorVisible && svgContent && (
                    <SvgCodeEditor 
                      svgCode={svgContent}
                      onCodeChange={() => {
                        // Code is now read-only as edits are made on the canvas
                      }}
                      isReadOnly={true}
                    />
                )}
              </div>
            </div>
          </div>

          <StatusBar status={status} error={error} />
        </main>
         <footer className="text-center p-4 text-base-content-secondary text-sm">
          <p>&copy; {new Date().getFullYear()} Physics Diagram Converter. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
};

export default App;
