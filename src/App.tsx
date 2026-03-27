import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Type, 
  Image as ImageIcon, 
  Printer, 
  Plus, 
  Trash2, 
  Move, 
  RotateCw, 
  Maximize,
  Save,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EnvelopeDimensions, DesignElement, FlapCorner } from './types';
import { EnvelopeTemplate } from './components/EnvelopeTemplate';
import { PrintLayout } from './components/PrintLayout';

import { Box3D } from './components/Box3D';

const INITIAL_DIMENSIONS: EnvelopeDimensions = {
  width: 80,
  height: 160,
  depth: 40,
  flapTopHeight: 30,
  flapBottomHeight: 15,
  flapSideWidth: 15,
  topFlapType: 'round',
  bottomFlapType: 'diagonal',
  sideFlapType: 'diagonal',
  templateType: 'envelope',
};

export default function App() {
  const [dimensions, setDimensions] = useState<EnvelopeDimensions>(INITIAL_DIMENSIONS);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTab, setActiveTab] = useState<'dims' | 'text' | 'image'>('dims');
  const [showA4Ref, setShowA4Ref] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [zoom, setZoom] = useState(3);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const guideInputRef = useRef<HTMLInputElement>(null);

  const FONTS = [
    { name: 'Không chân (Hiện đại)', value: 'Inter' },
    { name: 'Có chân (Cổ điển)', value: 'Playfair Display' },
    { name: 'Viết tay (Mềm mại)', value: 'Dancing Script' },
    { name: 'Nghệ thuật (Bay bổng)', value: 'Pacifico' },
    { name: 'Hình khối (Mạnh mẽ)', value: 'Montserrat' },
    { name: 'Máy đánh chữ', value: 'Roboto Mono' },
    { name: 'Thư pháp (Trang trọng)', value: 'Great Vibes' },
    { name: 'Nét thanh nét đậm', value: 'Charm' },
    { name: 'Quý phái', value: 'Pinyon Script' },
    { name: 'Khuôn mẫu (Stencil)', value: 'Saira Stencil One' },
  ];

  const TEMPLATES = [
    { id: 'envelope', name: 'Bao lì xì / Bì thư' },
    { id: 'box', name: 'Hộp giấy / Carton' },
    { id: 'fold3', name: 'Thiệp gấp 3' },
    { id: 'invitation', name: 'Thiệp mời đơn' },
  ];

  const handleDimChange = (key: keyof EnvelopeDimensions, value: any) => {
    setDimensions(prev => ({ ...prev, [key]: value }));
  };

  const addText = () => {
    const newEl: DesignElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: 'Nội dung mới\nXuống dòng',
      x: 50,
      y: 50,
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#000000',
      textAlign: 'center',
      rotation: 0,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newEl: DesignElement = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          content: event.target?.result as string,
          x: 50,
          y: 50,
          width: 40,
          rotation: 0,
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGuideUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        handleDimChange('guideImage', ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeGuide = () => {
    handleDimChange('guideImage', undefined);
  };

  const saveDesign = () => {
    const design = {
      dimensions,
      elements,
      version: '1.0'
    };
    localStorage.setItem('packaging_design_pro', JSON.stringify(design));
    alert('Đã lưu thiết kế thành công!');
  };

  const loadDesign = () => {
    const saved = localStorage.getItem('packaging_design_pro');
    if (saved) {
      try {
        const design = JSON.parse(saved);
        setDimensions(design.dimensions);
        setElements(design.elements);
        alert('Đã tải thiết kế thành công!');
      } catch (e) {
        alert('Lỗi khi tải thiết kế!');
      }
    } else {
      alert('Không tìm thấy thiết kế đã lưu!');
    }
  };

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedId(null);
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Thiết kế Bao bì Pro</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Bao Lì Xì & Phong bì</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={saveDesign}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
            title="Lưu thiết kế hiện tại"
          >
            <Save size={18} />
            Lưu
          </button>
          <button 
            onClick={loadDesign}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
            title="Tải thiết kế đã lưu"
          >
            <Download size={18} className="rotate-0" />
            Mở
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          {!isPrinting && (
            <button 
              onClick={() => setIsPrinting(true)}
              className="flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
            >
              Tiếp theo
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Controls */}
        {!isPrinting && (
          <aside className="w-96 bg-white border-r border-slate-200 flex flex-col shadow-sm z-40">
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('dims')}
                className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-all ${activeTab === 'dims' ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50/30' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Settings size={20} />
                Kích thước
              </button>
              <button 
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-all ${activeTab === 'text' ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50/30' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Type size={20} />
                Văn bản
              </button>
              <button 
                onClick={() => setActiveTab('image')}
                className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-all ${activeTab === 'image' ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50/30' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ImageIcon size={20} />
                Hình ảnh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {activeTab === 'dims' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Loại sản phẩm</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleDimChange('templateType', t.id)}
                          className={`w-full py-2 px-4 text-xs font-bold rounded-lg border text-left transition-all ${
                            dimensions.templateType === t.id 
                            ? 'bg-rose-600 border-rose-600 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mặt chính (mm)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Chiều rộng</label>
                        <input 
                          type="number" 
                          value={dimensions.width}
                          onChange={(e) => handleDimChange('width', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Chiều cao</label>
                        <input 
                          type="number" 
                          value={dimensions.height}
                          onChange={(e) => handleDimChange('height', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-mono"
                        />
                      </div>
                      {dimensions.templateType === 'box' && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600">Chiều sâu (Dày)</label>
                          <input 
                            type="number" 
                            value={dimensions.depth}
                            onChange={(e) => handleDimChange('depth', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Lưỡi gà & Tai dán (mm)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Cao lưỡi gà (trên)</label>
                        <input 
                          type="number" 
                          value={dimensions.flapTopHeight}
                          onChange={(e) => handleDimChange('flapTopHeight', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Dài lưỡi là (dưới)</label>
                        <input 
                          type="number" 
                          value={dimensions.flapBottomHeight}
                          onChange={(e) => handleDimChange('flapBottomHeight', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Rộng tai dán</label>
                        <input 
                          type="number" 
                          value={dimensions.flapSideWidth}
                          onChange={(e) => handleDimChange('flapSideWidth', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Kiểu góc lưỡi gà</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nắp trên</label>
                        <div className="flex gap-1">
                          {(['diagonal', 'round', 'square', 'fancy'] as FlapCorner[]).map((type) => (
                            <button
                              key={type}
                              onClick={() => handleDimChange('topFlapType', type)}
                              className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all ${
                                dimensions.topFlapType === type 
                                ? 'bg-rose-600 border-rose-600 text-white' 
                                : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {type === 'diagonal' ? 'Chéo' : type === 'round' ? 'Tròn' : type === 'square' ? 'Vuông' : 'Cách điệu'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nắp dưới</label>
                        <div className="flex gap-1">
                          {(['diagonal', 'round', 'square', 'fancy'] as FlapCorner[]).map((type) => (
                            <button
                              key={type}
                              onClick={() => handleDimChange('bottomFlapType', type)}
                              className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all ${
                                dimensions.bottomFlapType === type 
                                ? 'bg-rose-600 border-rose-600 text-white' 
                                : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {type === 'diagonal' ? 'Chéo' : type === 'round' ? 'Tròn' : type === 'square' ? 'Vuông' : 'Cách điệu'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nắp cạnh (Tai dán)</label>
                        <div className="flex gap-1">
                          {(['diagonal', 'round', 'square', 'fancy'] as FlapCorner[]).map((type) => (
                            <button
                              key={type}
                              onClick={() => handleDimChange('sideFlapType', type)}
                              className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all ${
                                dimensions.sideFlapType === type 
                                ? 'bg-rose-600 border-rose-600 text-white' 
                                : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {type === 'diagonal' ? 'Chéo' : type === 'round' ? 'Tròn' : type === 'square' ? 'Vuông' : 'Cách điệu'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ảnh mẫu (Trace)</h3>
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={guideInputRef}
                        onChange={handleGuideUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {!dimensions.guideImage ? (
                        <button
                          onClick={() => guideInputRef.current?.click()}
                          className="w-full py-2 px-4 text-xs font-bold rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-rose-300 hover:text-rose-50 transition-all flex items-center justify-center gap-2"
                        >
                          <ImageIcon size={14} />
                          Tải ảnh mẫu để đồ theo
                        </button>
                      ) : (
                        <button
                          onClick={removeGuide}
                          className="w-full py-2 px-4 text-xs font-bold rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={14} />
                          Xóa ảnh mẫu
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400 italic">Dùng để đồ theo khuôn có sẵn</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-6">
                  <button 
                    onClick={addText}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                  >
                    <Plus size={18} />
                    Thêm văn bản
                  </button>

                  {selectedElement?.type === 'text' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Nội dung</label>
                        <textarea 
                          value={selectedElement.content}
                          onChange={(e) => updateElement(selectedId!, { content: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Phông chữ</label>
                        <select 
                          value={selectedElement.fontFamily}
                          onChange={(e) => updateElement(selectedId!, { fontFamily: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                          style={{ fontFamily: selectedElement.fontFamily }}
                        >
                          {FONTS.map(f => (
                            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Căn lề</label>
                        <div className="flex gap-2">
                          {(['left', 'center', 'right'] as const).map((align) => (
                            <button
                              key={align}
                              onClick={() => updateElement(selectedId!, { textAlign: align })}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all capitalize ${
                                selectedElement.textAlign === align 
                                ? 'bg-slate-900 border-slate-900 text-white' 
                                : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {align === 'left' ? 'Trái' : align === 'center' ? 'Giữa' : 'Phải'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600">Cỡ chữ</label>
                          <input 
                            type="number" 
                            value={selectedElement.fontSize}
                            onChange={(e) => updateElement(selectedId!, { fontSize: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600">Màu sắc</label>
                          <input 
                            type="color" 
                            value={selectedElement.color}
                            onChange={(e) => updateElement(selectedId!, { color: e.target.value })}
                            className="w-full h-10 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteElement(selectedId!)}
                        className="w-full py-2 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                        Xóa phần tử
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'image' && (
                <div className="space-y-6">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                  >
                    <Plus size={18} />
                    Tải ảnh lên
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  {selectedElement?.type === 'image' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Kích thước (%)</label>
                        <input 
                          type="range" 
                          min="5" max="100"
                          value={selectedElement.width}
                          onChange={(e) => updateElement(selectedId!, { width: Number(e.target.value) })}
                          className="w-full accent-rose-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Xoay (độ)</label>
                        <input 
                          type="range" 
                          min="0" max="360"
                          value={selectedElement.rotation}
                          onChange={(e) => updateElement(selectedId!, { rotation: Number(e.target.value) })}
                          className="w-full accent-rose-600"
                        />
                      </div>
                      <button 
                        onClick={() => deleteElement(selectedId!)}
                        className="w-full py-2 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                        Xóa phần tử
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedId && (
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-4">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Vị trí & Điều chỉnh</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-indigo-600">Vị trí X (%)</label>
                      <input 
                        type="number" 
                        value={selectedElement?.x}
                        onChange={(e) => updateElement(selectedId!, { x: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-indigo-600">Vị trí Y (%)</label>
                      <input 
                        type="number" 
                        value={selectedElement?.y}
                        onChange={(e) => updateElement(selectedId!, { y: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Main Viewport */}
        <div className="flex-1 relative overflow-auto bg-[#f1f3f5] flex items-center justify-center p-12">
          <AnimatePresence mode="wait">
            {isPrinting ? (
              <motion.div 
                key="print"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full flex items-start justify-center"
              >
                <PrintLayout 
                  dimensions={dimensions} 
                  elements={elements} 
                  onBack={() => setIsPrinting(false)}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="relative"
              >
                {show3D && dimensions.templateType === 'box' ? (
                  <Box3D dimensions={dimensions} />
                ) : (
                  <EnvelopeTemplate 
                    dimensions={dimensions} 
                    elements={elements}
                    onElementSelect={setSelectedId}
                    onElementUpdate={updateElement}
                    selectedElementId={selectedId}
                    showA4Reference={showA4Ref}
                    scale={zoom}
                  />
                )}
                
                {/* Visual Hints */}
                {!show3D && (
                  <div className="absolute -top-8 left-0 right-0 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Mặt sau</span>
                    <span>Mặt trước (Thiết kế tại đây)</span>
                    <span>Dán</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Controls for Editor */}
          {!isPrinting && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/50">
              <div className="px-4 py-2 border-r border-slate-200 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="a4ref" 
                    checked={showA4Ref} 
                    onChange={(e) => setShowA4Ref(e.target.checked)}
                    className="accent-rose-600"
                  />
                  <label htmlFor="a4ref" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Khung A4</label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phóng to:</span>
                  <input 
                    type="range" 
                    min="1" max="10" step="0.5"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-24 accent-rose-600"
                  />
                  <span className="text-[10px] font-bold text-slate-600 w-8">{zoom}x</span>
                </div>
              </div>
              <div className="px-4 py-2 border-r border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kích thước tổng</p>
                <p className="text-sm font-bold text-slate-700">
                  {(dimensions.width * 2 + dimensions.flapSideWidth).toFixed(0)} x {(dimensions.height + dimensions.flapTopHeight + dimensions.flapBottomHeight).toFixed(0)} mm
                </p>
              </div>
              {dimensions.templateType === 'box' && (
                <button 
                  onClick={() => setShow3D(!show3D)}
                  className={`p-3 rounded-xl transition-all flex items-center gap-2 ${show3D ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                  title="Xem mô hình 3D"
                >
                  <Maximize size={20} />
                  <span className="text-[10px] font-bold uppercase">3D</span>
                </button>
              )}
              <button 
                onClick={() => setElements([])}
                className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="Xóa tất cả thiết kế"
              >
                <Trash2 size={20} />
              </button>
              <button 
                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Lưu bản nháp"
              >
                <Save size={20} />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer / Status */}
      <footer className="h-8 bg-white border-t border-slate-200 flex items-center justify-between px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex gap-4">
          <span>Khổ giấy: A4 (210x297mm)</span>
          <span>Đơn vị: Milimet (mm)</span>
        </div>
        <div>
          © 2026 Thiết kế Bao bì Pro
        </div>
      </footer>
    </div>
  );
}
