import React from 'react';
import { AnalysisStatus } from '../types';

interface StatusBarProps {
  status: AnalysisStatus;
  error: string | null;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, error }) => {
  let message = '';
  let bgColor = 'bg-gray-500';
  let textColor = 'text-white';

  switch (status) {
    case AnalysisStatus.ANALYZING:
      message = 'Analyzing diagram... Please wait.';
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case AnalysisStatus.SUCCESS:
      message = 'Success! Your SVG has been generated.';
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case AnalysisStatus.ERROR:
      message = `Error: ${error || 'An unknown error occurred.'}`;
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    default:
      return null;
  }

  return (
    <div className={`mt-8 p-4 rounded-lg text-center font-medium ${bgColor} ${textColor} transition-all`}>
      {message}
    </div>
  );
};

export default StatusBar;
