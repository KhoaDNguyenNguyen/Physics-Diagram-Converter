import React from 'react';
import { AnalysisStatus } from '../types';
import { DiagramIcon, ErrorIcon, SpinnerIcon } from './icons/Icons';

interface SvgDisplayProps {
  status: AnalysisStatus;
  error: string | null;
}

const SvgDisplay: React.FC<SvgDisplayProps> = ({ status, error }) => {
  const renderContent = () => {
    switch (status) {
      case AnalysisStatus.ANALYZING:
        return (
          <div className="flex flex-col items-center justify-center h-full text-base-content-secondary">
            <SpinnerIcon />
            <p className="mt-4 font-semibold text-lg">AI is analyzing the diagram...</p>
            <p className="text-sm">Crafting your SVG, please wait.</p>
          </div>
        );
      case AnalysisStatus.ERROR:
        return (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <ErrorIcon />
            <p className="mt-2 font-semibold">An Error Occurred</p>
            <p className="text-sm text-center max-w-sm">{error || "Could not generate SVG."}</p>
          </div>
        );
      case AnalysisStatus.IDLE:
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-base-content-secondary">
            <DiagramIcon />
            <p className="mt-2 font-semibold">SVG output will appear here</p>
            <p className="text-sm">Upload a diagram and click "Convert"</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-grow bg-base-200 rounded-lg p-4 flex items-center justify-center min-h-[300px] lg:min-h-[350px]">
      {renderContent()}
    </div>
  );
};

export default SvgDisplay;