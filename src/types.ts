export type FlapCorner = 'diagonal' | 'round' | 'square' | 'fancy';
export type TemplateType = 'envelope' | 'fold3' | 'invitation' | 'box' | 'custom';
export type PaperSize = 'A4' | 'A3' | 'A2' | 'A1' | 'custom';
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
  templateName?: string; // Tên loại mẫu nhập thủ công
  customerName?: string; // Tên khách hàng
  customerPhone?: string; // Số điện thoại
  customerAddress?: string; // Địa chỉ
  quantity?: number; // Số lượng
  guideImage?: string;
  borderThickness?: number; // Độ dày viền thiết kế
  cutLineX?: number; // Tọa độ X nét cắt (%)
  cutLineY?: number; // Tọa độ Y nét cắt (%)
  cutLineWidth?: number; // Chiều dài nét cắt (mm)
  backgroundColor?: string; // Màu nền khung thiết kế
}

export interface PrintItem {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string; // For text: string content, for image: base64, for shape: shape type (circle, square, etc.)
  x: number; 
  y: number; 
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  width?: number; 
  height?: number; // Added for shapes
  rotation?: number;
  borderWidth?: number; // Added for shapes/borders
  borderColor?: string; // Added for shapes
  fillColor?: string; // Added for shapes
}

export interface AppState {
  dimensions: EnvelopeDimensions;
  elements: DesignElement[];
  selectedElementId: string | null;
}
