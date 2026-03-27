import React, { useState, useEffect } from 'react';
import { EnvelopeDimensions, PrintItem, DesignElement, PaperSize, PaperOrientation } from '../types';

const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  'A4': { width: 210, height: 297 },
  'A3': { width: 297, height: 420 },
  'A2': { width: 420, height: 594 },
  'A1': { width: 594, height: 841 },
  'custom': { width: 210, height: 297 },
};
import { EnvelopeTemplate } from './EnvelopeTemplate';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, RotateCw, LayoutGrid, Download, Printer, ChevronLeft } from 'lucide-react';

interface Props {
  dimensions: EnvelopeDimensions;
  elements: DesignElement[];
  onBack: () => void;
}

export const PrintLayout: React.FC<Props> = ({ dimensions, elements, onBack }) => {
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [customPaperWidth, setCustomPaperWidth] = useState<number>(210);
  const [customPaperHeight, setCustomPaperHeight] = useState<number>(297);
  const [orientation, setOrientation] = useState<PaperOrientation>('portrait');
  const [items, setItems] = useState<PrintItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoCount, setAutoCount] = useState<number>(1);
  const [dragPos, setDragPos] = useState<{ x: number, y: number } | null>(null);

  const basePaperDim = paperSize === 'custom' 
    ? { width: customPaperWidth, height: customPaperHeight }
    : PAPER_DIMENSIONS[paperSize];
  const paperDim = orientation === 'portrait' 
    ? basePaperDim 
    : { width: basePaperDim.height, height: basePaperDim.width };
  
  const MARGIN = 20;
  const GAP = 5;

  const templateWidth = dimensions.templateType === 'box' 
    ? dimensions.width * 2 + dimensions.depth * 2 + dimensions.flapSideWidth
    : dimensions.templateType === 'fold3'
    ? dimensions.width * 3
    : dimensions.templateType === 'invitation' || dimensions.templateType === 'custom'
    ? dimensions.width
    : dimensions.width * 2 + dimensions.flapSideWidth;
  const templateHeight = dimensions.templateType === 'invitation' || dimensions.templateType === 'custom' || dimensions.templateType === 'fold3'
    ? dimensions.height
    : dimensions.height + dimensions.flapTopHeight + dimensions.flapBottomHeight;

  // Auto layout logic
  const autoLayout = (count?: number) => {
    const cols = Math.floor((paperDim.width - 2 * MARGIN + GAP) / (templateWidth + GAP));
    const rows = Math.floor((paperDim.height - 2 * MARGIN + GAP) / (templateHeight + GAP));
    
    const colsRotated = Math.floor((paperDim.width - 2 * MARGIN + GAP) / (templateHeight + GAP));
    const rowsRotated = Math.floor((paperDim.height - 2 * MARGIN + GAP) / (templateWidth + GAP));

    const useRotated = (colsRotated * rowsRotated) > (cols * rows);
    const finalCols = useRotated ? colsRotated : cols;
    const finalRows = useRotated ? rowsRotated : rows;
    const itemWidth = useRotated ? templateHeight : templateWidth;
    const itemHeight = useRotated ? templateWidth : templateHeight;

    const maxItems = finalCols * finalRows;
    const targetCount = count !== undefined ? Math.min(count, maxItems) : maxItems;

    const newItems: PrintItem[] = [];
    let added = 0;
    for (let r = 0; r < finalRows && added < targetCount; r++) {
      for (let c = 0; c < finalCols && added < targetCount; c++) {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          x: MARGIN + c * (itemWidth + GAP),
          y: MARGIN + r * (itemHeight + GAP),
          rotation: useRotated ? 90 : 0,
        });
        added++;
      }
    }
    setItems(newItems);
  };

  useEffect(() => {
    autoLayout();
  }, [dimensions, paperSize, orientation, customPaperWidth, customPaperHeight]);

  const addItem = () => {
    const newItem: PrintItem = {
      id: Math.random().toString(36).substr(2, 9),
      x: 20,
      y: 20,
      rotation: 0,
    };
    setItems([...items, newItem]);
    setSelectedId(newItem.id);
  };

  const duplicateItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const newItem: PrintItem = {
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        x: item.x + 10,
        y: item.y + 10,
      };
      setItems([...items, newItem]);
      setSelectedId(newItem.id);
    }
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const rotateItem = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, rotation: (i.rotation + 90) % 360 } : i));
  };

  const canvasRef = React.useRef<HTMLDivElement>(null);

  const updateItemPos = (id: string, x: number, y: number) => {
    setItems(items.map(i => i.id === id ? { ...i, x, y } : i));
  };

  const handleDrag = (id: string, info: any) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mmPerPx = paperDim.width / rect.width;
    
    const item = items.find(i => i.id === id);
    if (item) {
      const newX = item.x + info.offset.x * mmPerPx;
      const newY = item.y + info.offset.y * mmPerPx;
      setDragPos({ x: Math.round(newX), y: Math.round(newY) });
    }
  };

  const handleDragEnd = (id: string, info: any) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mmPerPx = paperDim.width / rect.width;
    
    const item = items.find(i => i.id === id);
    if (item) {
      const newX = item.x + info.offset.x * mmPerPx;
      const newY = item.y + info.offset.y * mmPerPx;
      updateItemPos(id, newX, newY);
    }
    setDragPos(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 overflow-hidden">
      {/* Print Toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 no-print shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold text-sm transition-all"
          >
            <ChevronLeft size={18} />
            Quay lại thiết kế
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Khổ giấy:</span>
              <select 
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="bg-white px-2 py-1 rounded border border-slate-200 text-xs font-bold outline-none"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="A2">A2</option>
                <option value="A1">A1</option>
                <option value="custom">Tùy chỉnh</option>
              </select>
            </div>
            {paperSize === 'custom' && (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <input 
                  type="number" 
                  value={customPaperWidth} 
                  onChange={(e) => setCustomPaperWidth(Number(e.target.value))}
                  className="w-16 bg-white px-2 py-1 rounded border border-slate-200 text-xs font-bold outline-none"
                  placeholder="W"
                />
                <span className="text-[10px] font-bold text-slate-400">x</span>
                <input 
                  type="number" 
                  value={customPaperHeight} 
                  onChange={(e) => setCustomPaperHeight(Number(e.target.value))}
                  className="w-16 bg-white px-2 py-1 rounded border border-slate-200 text-xs font-bold outline-none"
                  placeholder="H"
                />
                <span className="text-[10px] font-bold text-slate-500 px-1 uppercase">mm</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Hướng:</span>
              <select 
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as PaperOrientation)}
                className="bg-white px-2 py-1 rounded border border-slate-200 text-xs font-bold outline-none"
              >
                <option value="portrait">Dọc</option>
                <option value="landscape">Ngang</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Số lượng:</span>
              <input 
                type="number" 
                min="1" 
                max="50"
                value={autoCount}
                onChange={(e) => setAutoCount(parseInt(e.target.value) || 1)}
                className="w-12 h-7 bg-white border border-slate-200 rounded text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                onClick={() => autoLayout(autoCount)}
                className="h-7 px-3 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 transition-all flex items-center gap-1"
                title="Tự động sắp xếp theo số lượng"
              >
                <LayoutGrid size={12} />
                Tự động
              </button>
            </div>
            <button 
              onClick={addItem}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
              title="Thêm bản sao thủ công"
            >
              <Plus size={16} />
              Thêm
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
          >
            <Printer size={18} />
            In / Xuất PDF
          </button>
        </div>
      </div>

      {/* Print Canvas */}
      <div className="flex-1 overflow-auto p-12 flex justify-center items-start scrollbar-hide">
        <div 
          ref={canvasRef}
          className="print-area bg-white relative shadow-2xl overflow-hidden"
          style={{
            width: `${paperDim.width}mm`,
            height: `${paperDim.height}mm`,
            minWidth: `${paperDim.width}mm`,
            minHeight: `${paperDim.height}mm`,
          }}
          onClick={() => setSelectedId(null)}
        >
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                drag
                dragMomentum={false}
                onDrag={(_, info) => handleDrag(item.id, info)}
                onDragEnd={(_, info) => handleDragEnd(item.id, info)}
                // We'll use style for position and rotation
                style={{
                  position: 'absolute',
                  left: `${item.x}mm`,
                  top: `${item.y}mm`,
                  rotate: item.rotation,
                  cursor: 'move',
                  zIndex: selectedId === item.id ? 50 : 10,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(item.id);
                }}
                className={`group relative ${selectedId === item.id ? 'ring-2 ring-blue-500' : ''}`}
              >
                <EnvelopeTemplate 
                  dimensions={dimensions} 
                  elements={elements} 
                  showCutLines={true}
                  scale={1}
                  padding={0}
                />

                {/* Coordinate Tooltip */}
                {dragPos && selectedId === item.id && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-mono pointer-events-none z-[100]">
                    X: {dragPos.x}mm, Y: {dragPos.y}mm
                  </div>
                )}

                {/* Item Controls */}
                {selectedId === item.id && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white shadow-xl border border-slate-200 p-1 rounded-lg no-print">
                    <button 
                      onClick={(e) => { e.stopPropagation(); rotateItem(item.id); }}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                      title="Xoay 90°"
                    >
                      <RotateCw size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); duplicateItem(item.id); }}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                      title="Nhân bản"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Grid helper */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] no-print" 
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '10mm 10mm' }} />

          {/* Technical Data Block at the bottom of the page */}
          <div className="absolute bottom-4 left-4 right-4 border border-slate-400 p-3 flex flex-col gap-2 text-[9px] font-mono text-slate-800 bg-white/50 z-[100]">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="font-bold uppercase tracking-wider">Bảng thông số kỹ thuật (Technical Data Sheet)</span>
              <span>Ngày in: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
            
            {/* Customer Info Row */}
            <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-1">
              <div className="flex gap-2"><span>Khách hàng:</span> <span className="font-bold">{dimensions.customerName || 'N/A'}</span></div>
              <div className="flex gap-2"><span>SĐT:</span> <span className="font-bold">{dimensions.customerPhone || 'N/A'}</span></div>
              <div className="flex gap-2"><span>Địa chỉ:</span> <span className="font-bold truncate">{dimensions.customerAddress || 'N/A'}</span></div>
            </div>

            <div className="grid grid-cols-4 gap-x-4 gap-y-1">
              <div className="flex justify-between">
                <span>Loại mẫu:</span> 
                <span className="font-bold">{dimensions.templateName || 'Tùy chỉnh'}</span>
              </div>
              <div className="flex justify-between"><span>Số lượng:</span> <span className="font-bold">{dimensions.quantity || 1}</span></div>
              <div className="flex justify-between"><span>Chiều rộng (W):</span> <span className="font-bold">{dimensions.width} mm</span></div>
              <div className="flex justify-between"><span>Chiều cao (H):</span> <span className="font-bold">{dimensions.height} mm</span></div>
              {dimensions.depth && <div className="flex justify-between"><span>Chiều sâu (D):</span> <span className="font-bold">{dimensions.depth} mm</span></div>}
              <div className="flex justify-between"><span>Nắp trên (TF):</span> <span className="font-bold">{dimensions.flapTopHeight} mm</span></div>
              <div className="flex justify-between"><span>Nắp dưới (BF):</span> <span className="font-bold">{dimensions.flapBottomHeight} mm</span></div>
              <div className="flex justify-between"><span>Tai dán (SF):</span> <span className="font-bold">{dimensions.flapSideWidth} mm</span></div>
              <div className="flex justify-between"><span>Nét vẽ:</span> <span className="font-bold">{dimensions.borderThickness} mm</span></div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${paperDim.width}mm !important;
            height: ${paperDim.height}mm !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          @page {
            size: ${paperSize} ${orientation};
            margin: 0;
          }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};
