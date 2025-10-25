
import { useState, useCallback, useEffect } from 'react';
import { AnalysisStatus, DiagramComponent, DiagramAnalysisResponse, ComponentType } from '../types';
import { analyzeDiagram } from '../services/geminiService';

// Since Fabric.js is loaded from a CDN, we declare it as a global variable for TypeScript.
declare const fabric: any;

interface HistoryState {
  past: DiagramComponent[][];
  present: DiagramComponent[] | null;
  future: DiagramComponent[][];
}

const generateSvgFromComponents = (
  components: DiagramComponent[], 
  viewBox: { width: number, height: number }
): string => {
  let svgElements = '';

  components.forEach(comp => {
    // For groups (LaTeX), we apply transforms directly to the <g> tag.
    if (comp.type === ComponentType.GROUP && comp.svgString) {
      const groupTransform = `translate(${comp.x}, ${comp.y}) rotate(${comp.rotation}) scale(${comp.scaleX || 1} ${comp.scaleY || 1})`;
      svgElements += `<g transform="${groupTransform}">${comp.svgString.replace(/<svg.*?>|<\/svg>/g, '')}</g>`;
      return;
    }

    const transform = `translate(${comp.x + comp.width / 2}, ${comp.y + comp.height / 2}) rotate(${comp.rotation}) translate(-${comp.x + comp.width / 2}, -${comp.y + comp.height / 2})`;
    
    switch (comp.type) {
      case ComponentType.RECT:
        svgElements += `<rect x="${comp.x}" y="${comp.y}" width="${comp.width}" height="${comp.height}" fill="${comp.fill}" stroke="${comp.stroke}" stroke-width="${comp.strokeWidth}" transform="${transform}" />`;
        break;
      case ComponentType.ELLIPSE:
        svgElements += `<ellipse cx="${comp.x + comp.width / 2}" cy="${comp.y + comp.height / 2}" rx="${comp.width / 2}" ry="${comp.height / 2}" fill="${comp.fill}" stroke="${comp.stroke}" stroke-width="${comp.strokeWidth}" transform="${transform}" />`;
        break;
      case ComponentType.TEXT:
        svgElements += `<text x="${comp.x}" y="${comp.y + comp.height}" font-size="${comp.height}" fill="${comp.fill}" transform="${transform}">${comp.text || ''}</text>`;
        break;
      case ComponentType.PATH:
        svgElements += `<path d="${comp.path || ''}" fill="${comp.fill}" stroke="${comp.stroke}" stroke-width="${comp.strokeWidth}" transform="translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})" />`;
        break;
    }
  });

  return `<svg width="${viewBox.width}" height="${viewBox.height}" viewBox="0 0 ${viewBox.width} ${viewBox.height}" xmlns="http://www.w3.org/2000/svg">${svgElements}</svg>`;
};


export const usePhysicsDiagramConverter = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState<{width: number, height: number}>({width: 500, height: 400});
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: null,
    future: [],
  });

  const diagramComponents = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const setDiagramComponents = useCallback((updater: React.SetStateAction<DiagramComponent[] | null>) => {
    setHistory(currentHistory => {
      const newPresent = typeof updater === 'function' ? updater(currentHistory.present) : updater;
      
      if (currentHistory.present === newPresent) {
        return currentHistory;
      }
      
      const newPast = currentHistory.present ? [...currentHistory.past, currentHistory.present] : currentHistory.past;

      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.past.length === 0) {
        return currentHistory;
      }
      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);
      const newFuture = currentHistory.present ? [currentHistory.present, ...currentHistory.future] : currentHistory.future;
      return {
        past: newPast,
        present: previous,
        future: newFuture,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.future.length === 0) {
        return currentHistory;
      }
      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);
      const newPast = currentHistory.present ? [...currentHistory.past, currentHistory.present] : currentHistory.past;
      return {
        past: newPast,
        present: next,
        future: newFuture,
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (diagramComponents && viewBox) {
      const svg = generateSvgFromComponents(diagramComponents, viewBox);
      setSvgContent(svg);
    } else {
      setSvgContent(null);
    }
  }, [diagramComponents, viewBox]);


  const resetState = useCallback(() => {
    setStatus(AnalysisStatus.IDLE);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setHistory({ past: [], present: null, future: [] });
    setSvgContent(null);
    setError(null);
  }, [previewUrl]);

  const handleFileSelect = useCallback((file: File | null) => {
    resetState();
    if (file) {
      if (file.size > 4 * 1024 * 1024) { 
          setError("File size exceeds 4MB limit.");
          setStatus(AnalysisStatus.ERROR);
          return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, [resetState]);

  const handleConvert = useCallback(async () => {
    if (!selectedFile) return;

    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    setHistory({ past: [], present: null, future: [] });

    try {
      const result: DiagramAnalysisResponse = await analyzeDiagram(selectedFile);
      setHistory({ past: [], present: result.components, future: [] });
      setViewBox(result.viewBox);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setStatus(AnalysisStatus.ERROR);
    }
  }, [selectedFile]);

  const handleDownload = useCallback(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [svgContent]);

  const handleReset = useCallback(() => {
    resetState();
  }, [resetState]);

  return {
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
  };
};