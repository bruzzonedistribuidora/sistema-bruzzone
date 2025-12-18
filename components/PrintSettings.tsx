import React, { useState, useRef } from 'react';
import { Printer, Save, Layout, FileText, Type, Image as ImageIcon, AlignLeft, GripVertical, CheckSquare, Square, LayoutGrid, Maximize, Ruler, Move, MousePointer2, RefreshCw } from 'lucide-react';
import { PrintTemplate, DocumentType, PaperSize, Position } from '../types';

const PrintSettings: React.FC = () => {
  const [selectedType, setSelectedType] = useState<DocumentType>('FACTURA');
  const [editMode, setEditMode] = useState(true); // Default to visual edit mode
  const [activeElement, setActiveElement] = useState<keyof PrintTemplate['positions'] | null>(null);
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  // Default positions for A4 (Refined for Modern Layout)
  const defaultA4Positions = {
      logo: { x: 15, y: 15, visible: true },
      header: { x: 15, y: 55, visible: true }, // Sender Info (Left)
      docInfo: { x: 120, y: 15, visible: true }, // Invoice Title & Dates (Right)
      client: { x: 120, y: 55, visible: true }, // Bill To (Right)
      table: { x: 15, y: 110, visible: true }, // Items Table
      footer: { x: 15, y: 200, visible: true }, // Notes / Payment Info (Bottom Left)
      totals: { x: 130, y: 200, visible: true }, // Totals (Bottom Right)
      qr: { x: 170, y: 250, visible: false }, // QR (Optional)
  };

  const defaultTicketPositions = {
      logo: { x: 25, y: 5, visible: false },
      header: { x: 5, y: 20, visible: true },
      docInfo: { x: 5, y: 45, visible: true },
      client: { x: 5, y: 60, visible: true },
      table: { x: 2, y: 80, visible: true },
      totals: { x: 5, y: 150, visible: true },
      footer: { x: 5, y: 170, visible: true },
      qr: { x: 20, y: 190, visible: false },
  };

  // Default Template Configurations
  const [templates, setTemplates] = useState<Record<DocumentType, PrintTemplate>>({
      'FACTURA': {
          id: 'FACTURA', name: 'Factura de Venta', paperSize: 'A4', showLogo: true,
          headerText: 'Saldo Apps', subHeaderText: 'Juan Smith\ninfo@saldoapps.com\n555-0123\nCalle Falsa 123, Chicago, Estados Unidos',
          footerText: 'Instrucciones de pago:\nE-mail de Paypal: info@saldoapps.com\n\nCheques a nombre de: Juan Smith', showPrice: true, showTotal: true, fontSize: 'MEDIUM',
          positions: { ...defaultA4Positions }
      },
      'TICKET_INTERNO': {
          id: 'TICKET_INTERNO', name: 'Ticket de Venta (Interno)', paperSize: 'TICKET_80MM', showLogo: false,
          headerText: 'FERRECLOUD', subHeaderText: 'VENTA X',
          footerText: 'Comprobante no válido como factura.', showPrice: true, showTotal: true, fontSize: 'SMALL',
          positions: { ...defaultTicketPositions }
      },
      'REMITO': {
          id: 'REMITO', name: 'Remito de Entrega', paperSize: 'A4_QUARTER', showLogo: true,
          headerText: 'FERRETERIA FERRECLOUD', subHeaderText: 'ENTREGA DE MERCADERIA',
          footerText: 'Recibí conforme: __________________________', showPrice: false, showTotal: false, fontSize: 'SMALL',
          positions: { 
              logo: { x: 5, y: 5, visible: true }, header: { x: 30, y: 5, visible: true }, docInfo: { x: 70, y: 5, visible: true },
              client: { x: 5, y: 30, visible: true }, table: { x: 5, y: 50, visible: true }, totals: { x: 70, y: 110, visible: false },
              footer: { x: 5, y: 130, visible: true }, qr: { x: 5, y: 110, visible: false }
          }
      },
      'PRESUPUESTO': {
          id: 'PRESUPUESTO', name: 'Presupuesto / Cotización', paperSize: 'A4', showLogo: true,
          headerText: 'FERRECLOUD - PRESUPUESTO', subHeaderText: 'Validez: 15 días',
          footerText: 'Precios sujetos a modificación sin previo aviso.', showPrice: true, showTotal: true, fontSize: 'MEDIUM',
          positions: { ...defaultA4Positions }
      },
      'ORDEN_PEDIDO': {
          id: 'ORDEN_PEDIDO', name: 'Orden de Pedido', paperSize: 'A4', showLogo: true,
          headerText: 'ORDEN DE PEDIDO', subHeaderText: 'Uso Interno',
          footerText: '', showPrice: true, showTotal: true, fontSize: 'LARGE',
          positions: { ...defaultA4Positions }
      }
  });

  const currentTemplate = templates[selectedType];

  const updateTemplate = (updates: Partial<PrintTemplate>) => {
      setTemplates(prev => ({
          ...prev,
          [selectedType]: { ...prev[selectedType], ...updates }
      }));
  };

  const updatePosition = (key: keyof PrintTemplate['positions'], x: number, y: number) => {
      setTemplates(prev => ({
          ...prev,
          [selectedType]: {
              ...prev[selectedType],
              positions: {
                  ...prev[selectedType].positions,
                  [key]: { ...prev[selectedType].positions[key], x, y }
              }
          }
      }));
  };

  const updateVisibility = (key: keyof PrintTemplate['positions'], visible: boolean) => {
      setTemplates(prev => ({
          ...prev,
          [selectedType]: {
              ...prev[selectedType],
              positions: {
                  ...prev[selectedType].positions,
                  [key]: { ...prev[selectedType].positions[key], visible }
              }
          }
      }));
  };

  const resetPositions = () => {
      if (currentTemplate.paperSize === 'A4') {
          updateTemplate({ positions: { ...defaultA4Positions } });
      }
  };

  // --- DRAG LOGIC ---
  const handleMouseDown = (e: React.MouseEvent, key: keyof PrintTemplate['positions']) => {
      if (!editMode) return;
      e.stopPropagation();
      e.preventDefault();
      setActiveElement(key);
      setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !activeElement || !paperRef.current) return;
      
      const paperRect = paperRef.current.getBoundingClientRect();
      const xPx = e.clientX - paperRect.left;
      const yPx = e.clientY - paperRect.top;

      const paperWidthMm = parseFloat(getPaperStyle().width);
      const pxPerMm = paperRect.width / paperWidthMm;

      const xMm = Math.round(xPx / pxPerMm);
      const yMm = Math.round(yPx / pxPerMm);

      updatePosition(activeElement, xMm, yMm);
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const handleSave = () => {
      alert(`Diseño guardado para ${currentTemplate.name}`);
  };

  const getPaperStyle = () => {
      switch (currentTemplate.paperSize) {
          case 'A4': return { width: '210mm', height: '297mm' };
          case 'TICKET_80MM': return { width: '80mm', height: '250mm' }; 
          case 'A4_QUARTER': return { width: '105mm', height: '148mm' };
          case 'CUSTOM': 
            return { 
                width: `${currentTemplate.customWidth || 100}mm`, 
                height: `${currentTemplate.customHeight || 150}mm`
            };
          default: return { width: '210mm', height: '297mm' };
      }
  };

  const paperDims = getPaperStyle();

  const mockItems = [
      { qty: 100, desc: 'Prototipo', price: 50.00, total: 5000.00 },
      { qty: 500, desc: 'Diseño UX/UI', price: 10.00, total: 5000.00 },
  ];

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden" onMouseUp={handleMouseUp}>
        
        {/* Left Sidebar: Controls */}
        <div className="w-1/3 min-w-[350px] bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 shadow-xl">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Printer className="text-ferre-orange"/> Editor de Impresión
                </h2>
                <p className="text-sm text-gray-500 mt-1">Arrastra los elementos para diseñar tu comprobante.</p>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Plantilla</label>
                    <select 
                        className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferre-orange outline-none font-medium"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                    >
                        <option value="FACTURA">Factura Fiscal (A/B/C)</option>
                        <option value="TICKET_INTERNO">Ticket / Comprobante X</option>
                        <option value="REMITO">Remito de Entrega</option>
                        <option value="PRESUPUESTO">Presupuesto</option>
                        <option value="ORDEN_PEDIDO">Orden de Pedido</option>
                    </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Layout size={14}/> Configuración de Hoja</h3>
                        <button onClick={resetPositions} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><RefreshCw size={10}/> Resetear Posiciones</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {['A4', 'TICKET_80MM', 'A4_QUARTER', 'CUSTOM'].map(size => (
                            <button 
                                key={size}
                                onClick={() => updateTemplate({ paperSize: size as any })}
                                className={`text-xs font-bold py-2 rounded border ${currentTemplate.paperSize === size ? 'bg-ferre-orange text-white border-ferre-orange' : 'bg-white text-gray-600 border-gray-300'}`}>
                                {size.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active Element Properties */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Move size={16}/> Propiedades del Elemento
                        {activeElement ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase ml-auto">{activeElement}</span> : <span className="text-xs text-gray-400 font-normal ml-auto">Selecciona uno</span>}
                    </h3>
                    
                    {activeElement ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-4 bg-blue-50 p-3 rounded border border-blue-100">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={currentTemplate.positions[activeElement].visible} 
                                        onChange={(e) => updateVisibility(activeElement, e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-bold text-blue-800">Visible</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Posición X (mm)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                        value={currentTemplate.positions[activeElement].x}
                                        onChange={(e) => updatePosition(activeElement, parseInt(e.target.value) || 0, currentTemplate.positions[activeElement].y)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Posición Y (mm)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                        value={currentTemplate.positions[activeElement].y}
                                        onChange={(e) => updatePosition(activeElement, currentTemplate.positions[activeElement].x, parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            
                            {/* Contextual Inputs based on selection */}
                            {activeElement === 'header' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Empresa</label>
                                    <input type="text" className="w-full p-2 border rounded text-sm" value={currentTemplate.headerText} onChange={e => updateTemplate({ headerText: e.target.value })}/>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 mt-2">Datos Contacto</label>
                                    <textarea className="w-full p-2 border rounded text-sm h-16" value={currentTemplate.subHeaderText} onChange={e => updateTemplate({ subHeaderText: e.target.value })}/>
                                </div>
                            )}
                            {activeElement === 'footer' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Instrucciones / Notas</label>
                                    <textarea className="w-full p-2 border rounded text-sm h-20" value={currentTemplate.footerText} onChange={e => updateTemplate({ footerText: e.target.value })}/>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                            Haz clic en un elemento de la vista previa para editar su posición y contenido.
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6">
                    <button 
                        onClick={handleSave}
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg">
                        <Save size={18}/> Guardar Diseño
                    </button>
                </div>
            </div>
        </div>

        {/* Right Area: Live Preview Canvas */}
        <div className="flex-1 bg-gray-200 flex flex-col items-center justify-center p-8 overflow-auto relative cursor-crosshair" onMouseMove={handleMouseMove}>
            
            <div className="absolute top-4 right-4 flex gap-2 z-20">
                <button 
                    onClick={() => setEditMode(!editMode)}
                    className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm border flex items-center gap-2 transition-colors ${editMode ? 'bg-ferre-orange text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                    {editMode ? <Move size={14}/> : <MousePointer2 size={14}/>}
                    {editMode ? 'Modo Edición (Arrastrar)' : 'Solo Vista Previa'}
                </button>
            </div>

            {/* THE PAPER CANVAS */}
            <div 
                ref={paperRef}
                className="bg-white shadow-2xl transition-all duration-300 relative overflow-hidden mx-auto"
                style={{ 
                    width: paperDims.width,
                    height: paperDims.height,
                    minWidth: paperDims.width, 
                    minHeight: paperDims.height,
                    fontFamily: 'Inter, system-ui, sans-serif', // Modern Font
                    fontSize: currentTemplate.fontSize === 'SMALL' ? '10px' : currentTemplate.fontSize === 'LARGE' ? '14px' : '12px',
                    backgroundImage: editMode ? 'radial-gradient(#e5e7eb 1px, transparent 1px)' : 'none',
                    backgroundSize: '10px 10px',
                    color: '#333'
                }}
            >
                {/* 1. LOGO */}
                {currentTemplate.positions.logo.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'logo')}
                        className={`absolute cursor-move ${activeElement === 'logo' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300 border border-transparent hover:border-gray-200' : ''}`}
                        style={{ left: `${currentTemplate.positions.logo.x}mm`, top: `${currentTemplate.positions.logo.y}mm`, zIndex: 10 }}
                    >
                        <div className="w-16 h-16 text-blue-500 flex items-center justify-center font-bold text-4xl tracking-tighter">
                            <span className="relative">S<span className="absolute -right-2 top-0 text-blue-300 transform translate-x-1 translate-y-1 z-[-1]">A</span></span>
                        </div>
                    </div>
                )}

                {/* 2. HEADER INFO (SENDER) */}
                {currentTemplate.positions.header.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'header')}
                        className={`absolute cursor-move max-w-[80mm] ${activeElement === 'header' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300 border border-transparent hover:border-gray-200' : ''}`}
                        style={{ left: `${currentTemplate.positions.header.x}mm`, top: `${currentTemplate.positions.header.y}mm`, zIndex: 10 }}
                    >
                        <p className="font-bold text-xs mb-1">De</p>
                        <h1 className="font-bold text-lg leading-tight">{currentTemplate.headerText || 'Saldo Apps'}</h1>
                        <p className="whitespace-pre-line text-xs text-gray-500 leading-relaxed mt-1">{currentTemplate.subHeaderText}</p>
                    </div>
                )}

                {/* 3. DOCUMENT INFO (TOP RIGHT) */}
                {currentTemplate.positions.docInfo.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'docInfo')}
                        className={`absolute cursor-move text-right min-w-[70mm] ${activeElement === 'docInfo' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300 border border-transparent hover:border-gray-200' : ''}`}
                        style={{ left: `${currentTemplate.positions.docInfo.x}mm`, top: `${currentTemplate.positions.docInfo.y}mm`, zIndex: 10 }}
                    >
                        <h2 className="font-bold text-2xl mb-2">{currentTemplate.name}</h2>
                        <div className="flex justify-end gap-4 text-xs">
                            <div className="text-right">
                                <p className="text-gray-400">Orden #</p>
                                <p className="font-bold">10</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400">Fecha</p>
                                <p className="font-bold">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. CLIENT INFO (BILL TO) */}
                {currentTemplate.positions.client.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'client')}
                        className={`absolute cursor-move min-w-[60mm] text-right ${activeElement === 'client' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300 border border-transparent hover:border-gray-200' : ''}`}
                        style={{ left: `${currentTemplate.positions.client.x}mm`, top: `${currentTemplate.positions.client.y}mm`, zIndex: 10 }}
                    >
                        <p className="font-bold text-xs mb-1">Cobrar a</p>
                        <p className="font-bold text-lg">Shepard corp.</p>
                        <p className="text-xs text-gray-500">shepard@gmail.com</p>
                        <p className="text-xs text-gray-500">Calle Norte 32, Chicago, EE.UU.</p>
                    </div>
                )}

                {/* 5. ITEMS TABLE */}
                {currentTemplate.positions.table.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'table')}
                        className={`absolute cursor-move w-[180mm] ${activeElement === 'table' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300 border border-transparent hover:border-gray-200' : ''}`}
                        style={{ left: `${currentTemplate.positions.table.x}mm`, top: `${currentTemplate.positions.table.y}mm`, zIndex: 5 }}
                    >
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="py-2 px-3 w-1/2">Descripción</th>
                                    <th className="py-2 px-3 text-right">Valor Cada</th>
                                    <th className="py-2 px-3 text-center">Cant.</th>
                                    {currentTemplate.showTotal && <th className="py-2 px-3 text-right">Monto</th>}
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {mockItems.map((item, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-3 px-3">
                                            <p className="font-bold">{item.desc}</p>
                                            <p className="text-[10px] text-gray-400">Descripción extendida del servicio...</p>
                                        </td>
                                        <td className="py-3 px-3 text-right">${item.price.toFixed(2)}</td>
                                        <td className="py-3 px-3 text-center">{item.qty}</td>
                                        {currentTemplate.showTotal && <td className="py-3 px-3 text-right font-bold">${item.total.toFixed(2)}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 6. TOTALS */}
                {currentTemplate.positions.totals.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'totals')}
                        className={`absolute cursor-move min-w-[70mm] ${activeElement === 'totals' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300 border border-transparent hover:border-gray-200' : ''}`}
                        style={{ left: `${currentTemplate.positions.totals.x}mm`, top: `${currentTemplate.positions.totals.y}mm`, zIndex: 10 }}
                    >
                        <div className="text-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="font-bold">Total parcial:</span>
                                <span>USD 10,000.00</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Descuento (0%):</span>
                                <span>USD 0.00</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Impuestos:</span>
                                <span>USD 450.00</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 mt-2 font-bold text-sm">
                                <span>Total:</span>
                                <span>USD 10,450.00</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Cantidad pagada:</span>
                                <span>USD 0.00</span>
                            </div>
                            <div className="flex justify-between bg-gray-100 p-2 rounded mt-2 font-bold">
                                <span>Saldo adeudado:</span>
                                <span>USD 10,450.00</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. FOOTER / NOTES */}
                {currentTemplate.positions.footer.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'footer')}
                        className={`absolute cursor-move w-[90mm] ${activeElement === 'footer' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300 border border-transparent hover:border-gray-200' : ''}`}
                        style={{ left: `${currentTemplate.positions.footer.x}mm`, top: `${currentTemplate.positions.footer.y}mm`, zIndex: 10 }}
                    >
                        <p className="font-bold text-xs mb-2">Instrucciones de pago</p>
                        <p className="text-[10px] whitespace-pre-line text-gray-600 leading-relaxed mb-4">{currentTemplate.footerText}</p>
                        
                        <p className="font-bold text-xs mb-1">Notas</p>
                        <p className="text-[10px] text-gray-500">Gracias por su confianza.</p>
                        
                        <div className="mt-8 pt-8">
                             {/* Signature Mock */}
                             <div className="w-32 h-10 border-b border-gray-300 relative">
                                <div className="absolute bottom-2 left-4 text-blue-600 font-script text-xl opacity-80 rotate-[-10deg]">Firma</div>
                             </div>
                        </div>
                    </div>
                )}

                {/* 8. QR CODE (Hidden by default in template, but supported) */}
                {currentTemplate.positions.qr.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'qr')}
                        className={`absolute cursor-move ${activeElement === 'qr' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300 border border-transparent hover:border-gray-200' : ''}`}
                        style={{ left: `${currentTemplate.positions.qr.x}mm`, top: `${currentTemplate.positions.qr.y}mm`, zIndex: 10 }}
                    >
                        <div className="w-24 h-24 border border-black flex items-center justify-center text-[8px] text-center p-1 bg-white">QR AFIP</div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};

export default PrintSettings;