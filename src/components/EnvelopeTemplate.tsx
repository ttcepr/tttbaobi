import React, { useState, useRef, useEffect } from 'react';
import { EnvelopeDimensions, DesignElement } from '../types';

interface Props {
  dimensions: EnvelopeDimensions;
  elements: DesignElement[];
  onElementUpdate?: (id: string, updates: Partial<DesignElement>) => void;
  onElementSelect?: (id: string | null) => void;
  selectedElementId?: string | null;
  showCutLines?: boolean;
  scale?: number;
  showA4Reference?: boolean;
  padding?: number;
}

export const EnvelopeTemplate: React.FC<Props> = ({
  dimensions,
  elements,
  onElementUpdate,
  onElementSelect,
  selectedElementId,
  showCutLines = true,
  scale = 1,
  showA4Reference = false,
  padding = 20,
}) => {
  const { width, height, depth = 0, flapTopHeight, flapBottomHeight, flapSideWidth, topFlapType, bottomFlapType, sideFlapType, templateType, borderThickness = 0.5, cutLineX = 50, cutLineY = 15, cutLineWidth = 40 } = dimensions;
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getShapePath = (type: string, w: number, h: number) => {
    switch (type) {
      case 'triangle':
        return `M 0 ${-h / 2} L ${w / 2} ${h / 2} L ${-w / 2} ${h / 2} Z`;
      case 'diamond':
        return `M 0 ${-h / 2} L ${w / 2} 0 L 0 ${h / 2} L ${-w / 2} 0 Z`;
      case 'star':
        const points = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? w / 2 : w / 4;
          points.push(`${r * Math.cos(angle)} ${r * Math.sin(angle)}`);
        }
        return `M ${points.join(' L ')} Z`;
      default:
        return "";
    }
  };

  // Layout calculations based on template
  let totalWidth = width + width + flapSideWidth;
  let totalHeight = height + Math.max(flapTopHeight, 0) + Math.max(flapBottomHeight, 0);

  if (templateType === 'fold3') {
    totalWidth = width * 3;
    totalHeight = height;
  } else if (templateType === 'invitation') {
    totalWidth = width;
    totalHeight = height;
  } else if (templateType === 'box') {
    totalWidth = flapSideWidth + width + depth + width + depth;
    totalHeight = flapTopHeight + height + flapBottomHeight;
  }

  const viewWidth = (totalWidth + padding * 2);
  const viewHeight = (totalHeight + padding * 2);

  const A4_W = 210;
  const A4_H = 297;

  // Coordinates for panels
  let frontX = padding + width;
  let frontY = padding + flapTopHeight;

  if (templateType === 'fold3' || templateType === 'invitation') {
    frontX = padding;
    frontY = padding;
  } else if (templateType === 'box') {
    frontX = padding + flapSideWidth + width + depth;
    frontY = padding + flapTopHeight;
  }
  
  const backX = templateType === 'box' ? padding + flapSideWidth : padding;
  const backY = frontY;

  const glueX = templateType === 'box' ? padding : frontX + width;
  const glueY = frontY;

  const topFlapX = frontX;
  const topFlapY = padding;

  const bottomFlapX = frontX;
  const bottomFlapY = frontY + height;

  const getFlapPath = (w: number, h: number, type: string, position: 'top' | 'bottom' | 'side') => {
    if (h <= 0 || w <= 0) return "";
    const inset = Math.min(w * 0.1, h * 0.5);
    
    if (position === 'top' || position === 'bottom') {
      if (type === 'diagonal') {
        return position === 'top' 
          ? `M 0 ${h} L ${inset} 0 L ${w - inset} 0 L ${w} ${h} Z`
          : `M 0 0 L ${inset} ${h} L ${w - inset} ${h} L ${w} 0 Z`;
      }
      if (type === 'round') {
        return position === 'top'
          ? `M 0 ${h} Q ${w/2} ${-h/2} ${w} ${h} Z`
          : `M 0 0 Q ${w/2} ${h * 1.5} ${w} 0 Z`;
      }
      if (type === 'fancy') {
        const r = h * 0.5;
        return position === 'top'
          ? `M 0 ${h} L 0 ${r} Q 0 0 ${r} 0 L ${w-r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h} Z`
          : `M 0 0 L 0 ${h-r} Q 0 ${h} ${r} ${h} L ${w-r} ${h} Q ${w} ${h} ${w} ${h-r} L ${w} 0 Z`;
      }
      return position === 'top'
        ? `M 0 ${h} L 0 0 L ${w} 0 L ${w} ${h} Z`
        : `M 0 0 L 0 ${h} L ${w} ${h} L ${w} 0 Z`;
    }
    
    if (position === 'side') {
      const sInset = Math.min(h * 0.1, w * 0.5);
      if (type === 'diagonal') {
        return `M 0 0 L ${w} ${sInset} L ${w} ${h - sInset} L 0 ${h} Z`;
      }
      if (type === 'round') {
        return `M 0 0 Q ${w * 1.5} ${h/2} 0 ${h} Z`;
      }
      if (type === 'fancy') {
        const r = w * 0.5;
        return `M 0 0 L ${w-r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h-r} Q ${w} ${h} ${w-r} ${h} L 0 ${h} Z`;
      }
      // square
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
    }
    return "";
  };

  const handleMouseDown = (e: React.MouseEvent, id: string, type: 'drag' | 'resize') => {
    e.stopPropagation();
    onElementSelect?.(id);
    if (type === 'drag') setIsDragging(true);
    else setIsResizing(true);

    const svg = svgRef.current;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;
    const mouseX = (e.clientX - CTM.e) / CTM.a;
    const mouseY = (e.clientY - CTM.f) / CTM.d;

    const el = elements.find(item => item.id === id);
    if (el) {
      if (type === 'drag') {
        const elX = (el.x / 100) * width + frontX;
        const elY = (el.y / 100) * height + frontY;
        setDragOffset({ x: mouseX - elX, y: mouseY - elY });
      } else {
        setDragOffset({ x: mouseX, y: mouseY });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if ((!isDragging && !isResizing) || !selectedElementId) return;
    const svg = svgRef.current;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;
    const mouseX = (e.clientX - CTM.e) / CTM.a;
    const mouseY = (e.clientY - CTM.f) / CTM.d;

    const el = elements.find(item => item.id === selectedElementId);
    if (!el) return;

    if (isDragging) {
      const newX = ((mouseX - dragOffset.x - frontX) / width) * 100;
      const newY = ((mouseY - dragOffset.y - frontY) / height) * 100;
      onElementUpdate?.(selectedElementId, { x: newX, y: newY });
    } else if (isResizing) {
      if (el.type === 'text') {
        const delta = (mouseY - dragOffset.y);
        onElementUpdate?.(selectedElementId, { fontSize: Math.max(8, (el.fontSize || 16) + delta * 0.5) });
        setDragOffset({ x: mouseX, y: mouseY });
      } else if (el.type === 'shape') {
        const deltaX = (mouseX - dragOffset.x);
        const deltaY = (mouseY - dragOffset.y);
        onElementUpdate?.(selectedElementId, { 
          width: Math.max(5, (el.width || 20) + (deltaX / width) * 100),
          height: Math.max(5, (el.height || 20) + (deltaY / height) * 100)
        });
        setDragOffset({ x: mouseX, y: mouseY });
      } else {
        const delta = (mouseX - dragOffset.x);
        onElementUpdate?.(selectedElementId, { width: Math.max(5, (el.width || 20) + delta * 0.5) });
        setDragOffset({ x: mouseX, y: mouseY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  return (
    <svg 
      ref={svgRef}
      width={`${viewWidth * scale}mm`} 
      height={`${viewHeight * scale}mm`} 
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className="bg-white shadow-lg select-none"
      onClick={() => onElementSelect?.(null)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Guide Image Background (Trace) */}
      {dimensions.guideImage && (
        <image 
          href={dimensions.guideImage} 
          x={padding} 
          y={padding} 
          width={totalWidth} 
          height={totalHeight} 
          opacity="0.3" 
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* A4 Reference Background */}
      {showA4Reference && (
        <rect 
          x={(viewWidth - A4_W) / 2} 
          y={(viewHeight - A4_H) / 2} 
          width={A4_W} 
          height={A4_H} 
          fill="#f8fafc" 
          stroke="#cbd5e1" 
          strokeWidth="0.5"
          strokeDasharray="5,5"
        />
      )}

      {/* Template Rendering */}
      {templateType === 'envelope' && (
        <>
          <rect x={frontX} y={frontY} width={width} height={height} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          <rect x={backX} y={backY} width={width} height={height} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          <line 
            x1={backX + width * (cutLineX / 100) - cutLineWidth / 2} 
            y1={backY + height * (cutLineY / 100)} 
            x2={backX + width * (cutLineX / 100) + cutLineWidth / 2} 
            y2={backY + height * (cutLineY / 100)} 
            stroke={showCutLines ? "#000000" : "none"} 
            strokeWidth={borderThickness} 
          />
          <g transform={`translate(${topFlapX}, ${topFlapY})`}>
            <path d={getFlapPath(width, flapTopHeight, topFlapType, 'top')} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          </g>
          <g transform={`translate(${bottomFlapX}, ${bottomFlapY})`}>
            <path d={getFlapPath(width, flapBottomHeight, bottomFlapType, 'bottom')} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          </g>
          <g transform={`translate(${glueX}, ${glueY})`}>
            <path d={getFlapPath(flapSideWidth, height, sideFlapType, 'side')} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          </g>
        </>
      )}

      {templateType === 'box' && (
        <>
          {/* Glue Flap */}
          <path d={`M ${padding} ${frontY + height * 0.1} L ${padding + flapSideWidth} ${frontY} L ${padding + flapSideWidth} ${frontY + height} L ${padding} ${frontY + height * 0.9} Z`} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          
          {/* Back Panel */}
          <rect x={padding + flapSideWidth} y={frontY} width={width} height={height} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          
          {/* Side Panel 1 */}
          <rect x={padding + flapSideWidth + width} y={frontY} width={depth} height={height} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          
          {/* Front Panel */}
          <rect x={padding + flapSideWidth + width + depth} y={frontY} width={width} height={height} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          
          {/* Side Panel 2 */}
          <rect x={padding + flapSideWidth + width * 2 + depth} y={frontY} width={depth} height={height} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />

          {/* Top Flaps (on Back and Front) */}
          {/* Top Flap Back */}
          <g transform={`translate(${padding + flapSideWidth}, ${padding})`}>
            <path d={getFlapPath(width, flapTopHeight, topFlapType, 'top')} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          </g>
          {/* Top Flap Front */}
          <g transform={`translate(${padding + flapSideWidth + width + depth}, ${padding})`}>
            <path d={getFlapPath(width, flapTopHeight, topFlapType, 'top')} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          </g>

          {/* Bottom Flaps (on Back and Front) */}
          {/* Bottom Flap Back */}
          <g transform={`translate(${padding + flapSideWidth}, ${frontY + height})`}>
            <path d={getFlapPath(width, flapBottomHeight, bottomFlapType, 'bottom')} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          </g>
          {/* Bottom Flap Front */}
          <g transform={`translate(${padding + flapSideWidth + width + depth}, ${frontY + height})`}>
            <path d={getFlapPath(width, flapBottomHeight, bottomFlapType, 'bottom')} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          </g>

          {/* Dust Flaps (on Sides) */}
          <g transform={`translate(${padding + flapSideWidth + width}, ${frontY})`}>
             <path d={`M 0 0 L ${depth} 0 L ${depth * 0.8} ${-flapTopHeight * 0.6} L ${depth * 0.2} ${-flapTopHeight * 0.6} Z`} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
             <path d={`M 0 ${height} L ${depth} ${height} L ${depth * 0.8} ${height + flapBottomHeight * 0.6} L ${depth * 0.2} ${height + flapBottomHeight * 0.6} Z`} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          </g>
          <g transform={`translate(${padding + flapSideWidth + width * 2 + depth}, ${frontY})`}>
             <path d={`M 0 0 L ${depth} 0 L ${depth * 0.8} ${-flapTopHeight * 0.6} L ${depth * 0.2} ${-flapTopHeight * 0.6} Z`} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
             <path d={`M 0 ${height} L ${depth} ${height} L ${depth * 0.8} ${height + flapBottomHeight * 0.6} L ${depth * 0.2} ${height + flapBottomHeight * 0.6} Z`} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          </g>
        </>
      )}

      {templateType === 'fold3' && (
        <>
          <rect x={padding} y={padding} width={width} height={height} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          <rect x={padding + width} y={padding} width={width} height={height} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
          <rect x={padding + width * 2} y={padding} width={width} height={height} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
        </>
      )}

      {templateType === 'invitation' && (
        <rect x={padding} y={padding} width={width} height={height} fill="none" stroke={showCutLines ? "#000000" : "none"} strokeWidth={borderThickness} />
      )}

      {/* Fold Lines */}
      {showCutLines && (
        <g stroke="#94a3b8" strokeWidth="0.3" strokeDasharray="2,1">
          {templateType === 'envelope' && (
            <>
              <line x1={frontX} y1={frontY} x2={frontX} y2={frontY + height} />
              <line x1={frontX + width} y1={frontY} x2={frontX + width} y2={frontY + height} />
              <line x1={frontX} y1={frontY} x2={frontX + width} y2={frontY} />
              <line x1={frontX} y1={frontY + height} x2={frontX + width} y2={frontY + height} />
            </>
          )}
          {templateType === 'fold3' && (
            <>
              <line x1={padding + width} y1={padding} x2={padding + width} y2={padding + height} />
              <line x1={padding + width * 2} y1={padding} x2={padding + width * 2} y2={padding + height} />
            </>
          )}
        </g>
      )}

      {/* Design Elements */}
      <g transform={`translate(${frontX}, ${frontY})`}>
        {elements.map((el) => {
          const isSelected = selectedElementId === el.id;
          const lines = el.content.split('\n');
          const anchor = el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start';
          
          return (
            <g 
              key={el.id} 
              transform={`translate(${(el.x / 100) * width}, ${(el.y / 100) * height}) rotate(${el.rotation || 0})`}
              onMouseDown={(e) => handleMouseDown(e, el.id, 'drag')}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {el.type === 'text' ? (
                <text
                  textAnchor={anchor}
                  fontSize={el.fontSize}
                  fontFamily={el.fontFamily || 'Inter'}
                  fill={el.color}
                  style={{ 
                    userSelect: 'none',
                    outline: isSelected ? '1px dashed #3b82f6' : 'none',
                  }}
                >
                  {lines.map((line, i) => (
                    <tspan key={i} x="0" dy={i === 0 ? 0 : '1.2em'}>{line}</tspan>
                  ))}
                </text>
              ) : el.type === 'image' ? (
                <image
                  href={el.content}
                  x={-(el.width || 20) * width / 200}
                  y={-(el.width || 20) * width / 200}
                  width={(el.width || 20) * width / 100}
                  style={{ 
                    outline: isSelected ? '1px dashed #3b82f6' : 'none'
                  }}
                />
              ) : (
                <g style={{ outline: isSelected ? '1px dashed #3b82f6' : 'none' }}>
                  {el.content === 'rect' && (
                    <rect 
                      x={-(el.width || 20) * width / 200} 
                      y={-(el.height || 20) * height / 200} 
                      width={(el.width || 20) * width / 100} 
                      height={(el.height || 20) * height / 100} 
                      fill={el.fillColor} 
                      stroke={el.borderColor} 
                      strokeWidth={el.borderWidth} 
                    />
                  )}
                  {el.content === 'circle' && (
                    <circle 
                      cx="0" 
                      cy="0" 
                      r={(el.width || 20) * width / 200} 
                      fill={el.fillColor} 
                      stroke={el.borderColor} 
                      strokeWidth={el.borderWidth} 
                    />
                  )}
                  {(el.content === 'triangle' || el.content === 'star' || el.content === 'diamond') && (
                    <path 
                      d={getShapePath(el.content, (el.width || 20) * width / 100, (el.height || 20) * height / 100)} 
                      fill={el.fillColor} 
                      stroke={el.borderColor} 
                      strokeWidth={el.borderWidth} 
                    />
                  )}
                </g>
              )}

              {/* Coordinate Display */}
              {isSelected && (
                <g transform="translate(0, -10)">
                  <rect x="-20" y="-12" width="40" height="12" fill="white" fillOpacity="0.8" rx="2" />
                  <text fontSize="8" textAnchor="middle" fill="#3b82f6" fontWeight="bold">
                    X:{el.x.toFixed(0)} Y:{el.y.toFixed(0)}
                  </text>
                </g>
              )}

              {/* Resize Handle */}
              {isSelected && (
                <circle
                  cx={el.type === 'text' ? 0 : (el.width || 20) * width / 200}
                  cy={el.type === 'text' ? (el.fontSize || 16) * lines.length * 0.6 : (el.type === 'shape' ? (el.height || 20) * height / 200 : (el.width || 20) * width / 200)}
                  r="3"
                  fill="#3b82f6"
                  style={{ cursor: 'nwse-resize' }}
                  onMouseDown={(e) => handleMouseDown(e, el.id, 'resize')}
                />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};
