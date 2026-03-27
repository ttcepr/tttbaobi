export type FlapCorner = 'diagonal' | 'round' | 'square' | 'fancy';
export type TemplateType = 'envelope' | 'fold3' | 'invitation' | 'box';
export type PaperSize = 'A4' | 'A3' | 'A2' | 'A1';
export type PaperOrientation = 'portrait' | 'landscape';

export interface EnvelopeDimensions {
  width: number; // Chiều rộng mặt chính (mm)
  height: number; // Chiều cao mặt chính (mm)
  depth?: number; // Chiều sâu (dùng cho hộp)
  flapTopHeight: number; 
  flapBottomHeight: number; 
  flapSideWidth: number; 
  topFlapType: FlapCorner;
  bottomFlapType: FlapCorner;
  sideFlapType: FlapCorner;
  templateType: TemplateType;
  guideImage?: string;
}

export interface PrintItem {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

export interface DesignElement {
  id: string;
  type: 'text' | 'image';
  content: string; 
  x: number; 
  y: number; 
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  width?: number; 
  rotation?: number;
}

export interface AppState {
  dimensions: EnvelopeDimensions;
  elements: DesignElement[];
  selectedElementId: string | null;
}
