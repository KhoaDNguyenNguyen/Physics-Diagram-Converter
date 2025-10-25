import React, { useState } from 'react';
import { KeyIcon, SpinnerIcon } from './icons/Icons';

interface ApiKeyModalProps {
  onVerify: (apiKey: string) => void;
  isVerifying: boolean;
  error: string | null;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onVerify, isVerifying, error }) => {
  const [localApiKey, setLocalApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(localApiKey);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
        <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-indigo-100 rounded-full">
                <KeyIcon />
            </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Enter your Gemini API Key</h2>
          <p className="mt-2 text-sm text-gray-500">
            To use this application, you need to provide your own Google Gemini API key. Your key is stored securely in your browser and never sent to our servers.
          </p>
          <a 
            href="https://ai.google.dev/gemini-api/docs/api-key" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-1"
           >
            Get your API key from Google AI Studio &rarr;
          </a>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="apiKey" className="sr-only">API Key</label>
            <input
              id="apiKey"
              type="password"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="Enter your API key here"
              className="w-full px-4 py-3 text-gray-800 bg-gray-100 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              disabled={isVerifying}
              autoFocus
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 text-center font-medium">{error}</p>
          )}
          <button
            type="submit"
            disabled={isVerifying || !localApiKey}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {isVerifying && <SpinnerIcon />}
            {isVerifying ? 'Verifying...' : 'Verify Key & Start'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;
