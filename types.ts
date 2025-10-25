
export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum ComponentType {
  RECT = 'RECT',
  PATH = 'PATH',
  TEXT = 'TEXT',
  GROUP = 'GROUP',
  ELLIPSE = 'ELLIPSE',
}

export interface DiagramComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text?: string;
  path?: string;
  svgString?: string; // Property to store raw SVG for complex groups like LaTeX
  children?: DiagramComponent[];
  // FIX: Add scale properties to separate base dimensions from transformations
  scaleX?: number;
  scaleY?: number;
}

export interface DiagramAnalysisResponse {
  components: DiagramComponent[];
  viewBox: {
    width: number;
    height: number;
  }
}
