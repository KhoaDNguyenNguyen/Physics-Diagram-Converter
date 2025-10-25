import React from 'react';

interface SvgCodeEditorProps {
  svgCode: string;
  onCodeChange: (newCode: string) => void;
  isReadOnly?: boolean;
}

const SvgCodeEditor: React.FC<SvgCodeEditorProps> = ({ svgCode, onCodeChange, isReadOnly = false }) => {
  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if(!isReadOnly) {
        onCodeChange(event.target.value);
    }
  };

  return (
    <div className="flex flex-col h-64">
        <label htmlFor="svg-editor" className="text-sm font-medium text-base-content-secondary mb-1">SVG Code Viewer</label>
        <textarea
            id="svg-editor"
            value={svgCode}
            onChange={handleCodeChange}
            readOnly={isReadOnly}
            className={`w-full flex-grow p-3 font-mono text-sm bg-[#282c34] text-white rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none resize-y ${isReadOnly ? 'cursor-default' : ''}`}
            spellCheck="false"
            aria-label="SVG Code Editor"
        />
    </div>
  );
};

export default SvgCodeEditor;
