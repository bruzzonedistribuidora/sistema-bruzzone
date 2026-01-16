
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
    Printer, Save, Layout, FileText, Type, Image as ImageIcon, 
    AlignLeft, GripVertical, CheckSquare, Square, LayoutGrid, Maximize, 
    Ruler, Move, MousePointer2, RefreshCw, ChevronRight, Search, Tags,
    ArrowUp, ArrowDown, EyeOff, Eye, Hash, Calendar, Table as TableIcon,
    Scissors, QrCode as QrIcon, AlignCenter, TextCursorInput, MonitorSmartphone,
    RotateCcw, Maximize2, Settings2, Trash2, Eye as EyeIcon, 
    ToggleLeft, ToggleRight, DollarSign, List, PencilLine,
    Columns, FileCode, Monitor, Smartphone, RefreshCcw, Box,
    CheckCircle2
} from 'lucide-react';
import { PrintTemplate, DocumentType, PaperSize, Position, CompanyConfig } from '../types';

const REPORT_LIST: { type: DocumentType, name: string, size: PaperSize, cat: string }[] = [
    { type: 'FACTURA', name: 'Factura de Venta (Modelo A/B)', size: 'A4', cat: 'COMPROBANTES' },
    { type: 'REMITO', name: 'Remito de Entrega (Modelo R)', size: 'A4', cat: 'COMPROBANTES' },
    { type: 'PRESUPUESTO', name: 'Presupuesto Comercial', size: 'A4', cat: 'COMPROBANTES' },
    { type: 'CLI_RESUMEN_CUENTA', name: 'Resumen de Cuenta Corriente', size: 'A4', cat: 'CLIENTES' },
    { type: 'PROD_BARRAS', name: 'Etiquetas de Estantería', size: 'ROLLO_62MM', cat: 'PRODUCTOS' },
];

const PAPER_DIMENSIONS: Record<PaperSize, { w: number, h: number }> = {
    'A4': { w: 210, h: 297 },
    'A5': { w: 148, h: 210 },
    'TICKET_80MM': { w: 80, h: 200 },
    'ROLLO_62MM': { w: 62, h: 40 },
    'A4_QUARTER': { w: 105, h: 148 },
    'CUSTOM': { w: 210, h: 297 }
};

const PrintSettings: React.FC = () => {
  const [selectedType, setSelectedType] = useState<DocumentType>('FACTURA');
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : {};
  }, []);

  const [templates, setTemplates] = useState<Record<string, PrintTemplate>>(() => {
      const saved = localStorage.getItem('ferrecloud_print_templates_v7');
      if (saved) return JSON.parse(saved);

      const initial: Record<string, PrintTemplate> = {};
      REPORT_LIST.forEach(report => {
          initial[report.type] = {
              id: report.type,
              name: report.name,
              paperSize: report.size,
              orientation: 'VERTICAL',
              titleText: report.type,
              docLetterText: report.type === 'FACTURA' ? 'A' : 'R',
              docCodeText: 'Cod. 01',
              headerText: companyConfig.fantasyName || 'NOMBRE DE EMPRESA',
              subHeaderText: `Dirección de la Empresa\nCiudad - Provincia\nResponsable Inscripto`,
              footerText: 'Comprobante generado por FerreCloud System',
              totalsLabel: 'TOTAL A PAGAR',
              voucherPointOfSale: '00001',
              voucherNumber: '00000001',
              voucherCuitEmisor: companyConfig.cuit || '00-00000000-0',
              voucherIIBBEmisor: companyConfig.iibb || '000000000',
              showPrices: true,
              showSkus: true,
              showBrands: true,
              showIvaColumn: true,
              showVoucherDate: true,
              showVoucherCuit: true,
              showVoucherTitle: true,
              showVoucherNumber: true,
              positions: {
                  logo: { x: 10, y: 10, visible: true, width: 40, height: 25, fontSize: 10 },
                  docLetter: { x: 105, y: 8, visible: true, width: 12, height: 14, fontSize: 32 }, 
                  header: { x: 10, y: 35, visible: true, width: 85, fontSize: 12 },
                  voucherInfo: { x: 130, y: 15, visible: true, width: 65, fontSize: 18 }, 
                  client: { x: 10, y: 55, visible: true, width: 190, fontSize: 10 },
                  table: { x: 10, y: 90, visible: true, width: 190, fontSize: 10 },
                  totals: { x: 140, y: 240, visible: true, width: 65, fontSize: 12 },
                  footer: { x: 10, y: 285, visible: true, width: 190, fontSize: 8 },
                  qr: { x: 10, y: 240, visible: true, width: 16, height: 16, fontSize: 10 }
              }
          };
      });
      return initial;
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_print_templates_v7', JSON.stringify(templates));
  }, [templates]);

  const currentTemplate = templates[selectedType] || templates['FACTURA'];
  
  const dims = useMemo(() => {
    const base = PAPER_DIMENSIONS[currentTemplate.paperSize as PaperSize] || PAPER_DIMENSIONS['A4'];
    return currentTemplate.orientation === 'HORIZONTAL' ? { w: base.h, h: base.w } : { w: base.w, h: base.h };
  }, [currentTemplate.paperSize, currentTemplate.orientation]);

  const updateTemplate = (updates: Partial<PrintTemplate>) => {
    setTemplates(prev => ({
        ...prev,
        [selectedType]: { ...prev[selectedType], ...updates }
    }));
  };

  const updatePosition = (key: string, updates: Partial<Position>) => {
      const newPositions = { ...currentTemplate.positions };
      if (newPositions[key]) {
        newPositions[key] = { ...newPositions[key], ...updates };
        updateTemplate({ positions: newPositions });
      }
  };

  const handleMouseDown = (e: React.MouseEvent, key: string) => {
      e.stopPropagation();
      setActiveElement(key);
      setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !activeElement || !paperRef.current) return;
      const paperRect = paperRef.current.getBoundingClientRect();
      const pxPerMm = paperRect.width / dims.w;
      const newX = Math.round((e.clientX - paperRect.left) / pxPerMm);
      const newY = Math.round((e.clientY - paperRect.top) / pxPerMm);
      updatePosition(activeElement, { x: newX, y: newY });
  };

  const SubFieldToggle = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
      <button 
        onClick={onClick}
        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>
          <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
          {active ? <CheckCircle2 size={14}/> : <div className="w-3.5 h-3.5 rounded-full border border-slate-200"></div>}
      </button>
  );

  const renderElementEditor = () => {
      if (!activeElement) return null;
      const pos = currentTemplate.positions[activeElement];

      return (
          <div className="space-y-6 animate-fade-in">
              {/* Controles de Tamaño y Estilo Universales */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner space-y-6">
                  <h4 className="text-[9px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                      <Maximize size={12}/> Geometría y Estilo
                  </h4>
                  <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Ancho (mm)</label>
                              <input 
                                type="range" min="5" max={dims.w} step="1"
                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                value={pos.width || 10} 
                                onChange={e => updatePosition(activeElement, { width: parseInt(e.target.value) })} 
                              />
                              <div className="text-right text-[9px] font-black text-slate-600 mt-1">{pos.width || '-'} mm</div>
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Alto (mm)</label>
                            <input 
                                type="range" min="5" max={dims.h} step="1"
                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                value={pos.height || 10} 
                                onChange={e => updatePosition(activeElement, { height: parseInt(e.target.value) })} 
                            />
                            <div className="text-right text-[9px] font-black text-slate-600 mt-1">{pos.height || '-'} mm</div>
                          </div>
                      </div>

                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Tamaño Fuente / Escala</label>
                          <input 
                            type="range" min="6" max="72" step="1"
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            value={pos.fontSize || 12} 
                            onChange={e => updatePosition(activeElement, { fontSize: parseInt(e.target.value) })} 
                          />
                          <div className="text-right text-[9px] font-black text-slate-600 mt-1">{pos.fontSize || '12'} px</div>
                      </div>
                  </div>
              </div>

              {activeElement === 'header' && (
                  <div className="space-y-3">
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Nombre de Empresa</label>
                          <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold" value={currentTemplate.headerText} onChange={e => updateTemplate({headerText: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Sub-cabecera (Dirección/Fiscal)</label>
                          <textarea className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-[10px] h-20 resize-none font-bold" value={currentTemplate.subHeaderText} onChange={e => updateTemplate({subHeaderText: e.target.value})} />
                      </div>
                  </div>
              )}

              {activeElement === 'voucherInfo' && (
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <SubFieldToggle label="Título Doc." active={currentTemplate.showVoucherTitle} onClick={() => updateTemplate({showVoucherTitle: !currentTemplate.showVoucherTitle})} />
                        <SubFieldToggle label="Nº Voucher" active={currentTemplate.showVoucherNumber} onClick={() => updateTemplate({showVoucherNumber: !currentTemplate.showVoucherNumber})} />
                        <SubFieldToggle label="Fecha" active={currentTemplate.showVoucherDate} onClick={() => updateTemplate({showVoucherDate: !currentTemplate.showVoucherDate})} />
                        <SubFieldToggle label="CUIT Emisor" active={currentTemplate.showVoucherCuit} onClick={() => updateTemplate({showVoucherCuit: !currentTemplate.showVoucherCuit})} />
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                          <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Texto Título Principal</label>
                          <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-black uppercase" value={currentTemplate.titleText} onChange={e => updateTemplate({titleText: e.target.value})} />
                      </div>
                  </div>
              )}

              {activeElement === 'docLetter' && (
                  <div className="grid grid-cols-2 gap-2">
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Letra Central</label>
                          <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-center text-lg font-black" value={currentTemplate.docLetterText} maxLength={1} onChange={e => updateTemplate({docLetterText: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Código ARCA</label>
                          <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs" value={currentTemplate.docCodeText} onChange={e => updateTemplate({docCodeText: e.target.value})} />
                      </div>
                  </div>
              )}

              {activeElement === 'footer' && (
                  <div>
                      <label className="text-[8px] font-black uppercase text-slate-400">Texto de Pie de Página</label>
                      <textarea className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-[10px] h-24 resize-none font-bold" value={currentTemplate.footerText} onChange={e => updateTemplate({footerText: e.target.value})} />
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden animate-fade-in" onMouseUp={() => setIsDragging(false)} onMouseMove={handleMouseMove}>
        
        {/* PANEL DE CONTROL IZQUIERDO */}
        <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col shadow-2xl z-30">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter leading-none">
                        <Printer className="text-indigo-400" size={20}/> Diseño Imprenta
                    </h2>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Editor de Maquetación ARCA</p>
                </div>
                <button onClick={() => alert('Diseño de imprenta guardado en memoria local.')} className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-lg active:scale-95"><Save size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-20">
                <div className="bg-slate-900 p-5 rounded-[2rem] text-white shadow-xl">
                    <label className="block text-[9px] font-black text-indigo-400 uppercase mb-3 tracking-widest">Documento activo</label>
                    <select 
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-black text-xs uppercase outline-none focus:bg-white/10"
                        value={selectedType}
                        onChange={(e) => { setSelectedType(e.target.value as DocumentType); setActiveElement(null); }}
                    >
                        {REPORT_LIST.map(r => <option key={r.type} value={r.type} className="text-slate-900">{r.name}</option>)}
                    </select>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Maximize2 size={14} className="text-indigo-600"/> Ajustes del Papel
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Medida</label>
                            <select className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-xs uppercase" value={currentTemplate.paperSize} onChange={e => updateTemplate({ paperSize: e.target.value as PaperSize })}>
                                <option value="A4">A4 (210x297)</option><option value="A5">A5 (148x210)</option><option value="TICKET_80MM">Ticketera 80mm</option>
                            </select>
                        </div>
                        <button onClick={() => updateTemplate({ orientation: 'VERTICAL' })} className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${currentTemplate.orientation === 'VERTICAL' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>Vertical</button>
                        <button onClick={() => updateTemplate({ orientation: 'HORIZONTAL' })} className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${currentTemplate.orientation === 'HORIZONTAL' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>Horizontal</button>
                    </div>
                </div>

                <div className={`p-6 rounded-[2.5rem] transition-all border-2 ${activeElement ? 'bg-indigo-50 border-indigo-200 shadow-lg' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                    <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-6">
                        <PencilLine size={16}/> {activeElement ? `Editor: ${activeElement.toUpperCase()}` : 'Seleccione un bloque'}
                    </h3>
                    {renderElementEditor()}
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><LayoutGrid size={14}/> Capas del Diseño</h3>
                    <div className="grid grid-cols-1 gap-1">
                        {Object.keys(currentTemplate.positions).map(key => (
                            <div key={key} className={`flex items-center justify-between p-3 rounded-xl transition-all ${activeElement === key ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-50'}`}>
                                <button onClick={() => setActiveElement(key)} className="flex items-center gap-3 flex-1 text-left">
                                    <GripVertical size={14} className={activeElement === key ? 'text-white/50' : 'text-slate-300'}/>
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${currentTemplate.positions[key].visible || activeElement === key ? '' : 'text-slate-300 line-through'}`}>{key}</span>
                                </button>
                                <button 
                                    onClick={() => {
                                        const newPositions = { ...currentTemplate.positions };
                                        newPositions[key].visible = !newPositions[key].visible;
                                        updateTemplate({ positions: newPositions });
                                    }}
                                    className={`p-1.5 rounded-lg ${activeElement === key ? 'text-white' : 'text-slate-300 hover:text-indigo-600'}`}>
                                    {currentTemplate.positions[key].visible ? <EyeIcon size={16}/> : <EyeOff size={16}/>}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* ÁREA DE TRABAJO (LIENZO) */}
        <div className="flex-1 bg-slate-200 flex flex-col items-center p-12 overflow-auto relative scroll-smooth custom-scrollbar">
            <div className="mb-8 bg-slate-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-4 shadow-2xl shrink-0">
                <span className="text-indigo-400">{selectedType}</span>
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                <span>{dims.w}mm x {dims.h}mm</span>
            </div>
            
            <div 
                ref={paperRef}
                className="bg-white shadow-[0_45px_70px_-15px_rgba(0,0,0,0.4)] relative flex-shrink-0 border border-slate-300 transition-all duration-500 overflow-hidden"
                style={{ width: `${dims.w}mm`, height: `${dims.h}mm` }}
            >
                {/* REGLA MILIMÉTRICA OPCIONAL (VISUAL) */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '5mm 5mm'}}></div>

                {currentTemplate.positions.logo?.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'logo')}
                        className={`absolute cursor-move transition-all flex items-center justify-center border-2 ${activeElement === 'logo' ? 'border-indigo-500 bg-indigo-50/20 z-50' : 'border-transparent'}`}
                        style={{ 
                            left: `${currentTemplate.positions.logo.x}mm`, 
                            top: `${currentTemplate.positions.logo.y}mm`, 
                            width: `${currentTemplate.positions.logo.width}mm`, 
                            height: `${currentTemplate.positions.logo.height}mm` 
                        }}
                    >
                        {companyConfig.logo ? (
                            <img src={companyConfig.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center rounded-sm">
                                <ImageIcon size={24} className="text-slate-300"/>
                                <span className="text-[6px] font-black uppercase text-slate-400 mt-1">EMBLEMA</span>
                            </div>
                        )}
                    </div>
                )}

                {currentTemplate.positions.docLetter?.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'docLetter')}
                        className={`absolute cursor-move bg-white border-2 border-slate-900 flex flex-col items-center justify-center shadow-sm z-40 ${activeElement === 'docLetter' ? 'ring-4 ring-indigo-500' : ''}`}
                        style={{ 
                            left: `${currentTemplate.positions.docLetter.x}mm`, 
                            top: `${currentTemplate.positions.docLetter.y}mm`, 
                            width: `${currentTemplate.positions.docLetter.width}mm`, 
                            height: `${currentTemplate.positions.docLetter.height}mm`,
                            marginLeft: `-${(currentTemplate.positions.docLetter.width || 0) / 2}mm`
                        }}
                    >
                        <span className="font-black leading-none" style={{ fontSize: `${currentTemplate.positions.docLetter.fontSize || 32}px` }}>{currentTemplate.docLetterText}</span>
                        <span className="text-[6px] font-black uppercase mt-1 tracking-tighter">{currentTemplate.docCodeText}</span>
                    </div>
                )}

                {currentTemplate.positions.voucherInfo?.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'voucherInfo')}
                        className={`absolute cursor-move transition-all ${activeElement === 'voucherInfo' ? 'ring-2 ring-indigo-500 bg-indigo-50/10' : ''}`}
                        style={{ 
                            left: `${currentTemplate.positions.voucherInfo.x}mm`, 
                            top: `${currentTemplate.positions.voucherInfo.y}mm`,
                            width: `${currentTemplate.positions.voucherInfo.width}mm`
                        }}
                    >
                        {currentTemplate.showVoucherTitle && (
                            <h2 className="font-black text-slate-800 uppercase text-center mb-3 tracking-[0.1em]" style={{ fontSize: `${currentTemplate.positions.voucherInfo.fontSize}px` }}>
                                {currentTemplate.titleText}
                            </h2>
                        )}
                        <div className="space-y-1 font-bold text-slate-700" style={{ fontSize: '9px' }}>
                            {currentTemplate.showVoucherNumber && <p>Nº {currentTemplate.voucherPointOfSale} - {currentTemplate.voucherNumber}</p>}
                            {currentTemplate.showVoucherDate && <p>Fecha: {new Date().toLocaleDateString()}</p>}
                            {currentTemplate.showVoucherCuit && <p>C.U.I.T.: {currentTemplate.voucherCuitEmisor}</p>}
                        </div>
                    </div>
                )}

                {currentTemplate.positions.header?.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'header')}
                        className={`absolute cursor-move transition-all ${activeElement === 'header' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ 
                            left: `${currentTemplate.positions.header.x}mm`, 
                            top: `${currentTemplate.positions.header.y}mm`,
                            width: `${currentTemplate.positions.header.width}mm`
                        }}
                    >
                        <p className="font-black uppercase leading-none text-slate-800 mb-2" style={{ fontSize: `${currentTemplate.positions.header.fontSize}px` }}>
                            {currentTemplate.headerText}
                        </p>
                        <div className="text-[8px] font-bold text-slate-400 uppercase italic whitespace-pre-line leading-relaxed">
                            {currentTemplate.subHeaderText}
                        </div>
                    </div>
                )}

                {currentTemplate.positions.client?.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'client')}
                        className={`absolute cursor-move border border-slate-300 p-4 grid grid-cols-2 gap-4 rounded-sm ${activeElement === 'client' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ 
                            left: `${currentTemplate.positions.client.x}mm`, 
                            top: `${currentTemplate.positions.client.y}mm`,
                            width: `${currentTemplate.positions.client.width}mm`
                        }}
                    >
                        <div className="space-y-1 font-medium" style={{ fontSize: `${currentTemplate.positions.client.fontSize}px` }}>
                            <p><strong>Sr/es:</strong> CLIENTE EJEMPLO S.A.</p>
                            <p><strong>CUIT:</strong> 30-11223344-5</p>
                        </div>
                        <div className="space-y-1 font-medium text-right" style={{ fontSize: `${currentTemplate.positions.client.fontSize}px` }}>
                            <p><strong>IVA:</strong> Responsable Inscripto</p>
                        </div>
                    </div>
                )}

                {currentTemplate.positions.table?.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'table')}
                        className={`absolute cursor-move ${activeElement === 'table' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ 
                            left: `${currentTemplate.positions.table.x}mm`, 
                            top: `${currentTemplate.positions.table.y}mm`,
                            width: `${currentTemplate.positions.table.width}mm`
                        }}
                    >
                        <table className="w-full text-left border-t border-b border-slate-800">
                            <thead className="font-black uppercase bg-slate-50" style={{ fontSize: '9px' }}>
                                <tr>
                                    <th className="py-2 px-1">Cód</th>
                                    <th className="py-2">Detalle</th>
                                    <th className="py-2 text-center">Cant</th>
                                    {currentTemplate.showPrices && <th className="py-2 text-right pr-1">Total</th>}
                                </tr>
                            </thead>
                            <tbody className="font-medium text-slate-700" style={{ fontSize: `${currentTemplate.positions.table.fontSize}px` }}>
                                <tr className="border-b border-slate-100">
                                    <td className="py-2 px-1 font-mono">X01</td>
                                    <td className="py-2 uppercase font-bold">ARTÍCULO DE PRUEBA DISEÑO</td>
                                    <td className="py-2 text-center">1,00</td>
                                    {currentTemplate.showPrices && <td className="py-2 text-right font-black pr-1">$5.000,00</td>}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {currentTemplate.positions.totals?.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'totals')}
                        className={`absolute cursor-move border border-slate-900 shadow-sm ${activeElement === 'totals' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ 
                            left: `${currentTemplate.positions.totals.x}mm`, 
                            top: `${currentTemplate.positions.totals.y}mm`,
                            width: `${currentTemplate.positions.totals.width}mm`
                        }}
                    >
                        <div className="p-2 space-y-1 font-bold text-slate-700 bg-white" style={{ fontSize: '9px' }}>
                            <div className="flex justify-between items-center bg-slate-900 text-white p-2">
                                <span className="uppercase tracking-widest" style={{ fontSize: `${currentTemplate.positions.totals.fontSize}px` }}>{currentTemplate.totalsLabel}</span>
                                <span className="font-black" style={{ fontSize: `${currentTemplate.positions.totals.fontSize}px` }}>$5.000,00</span>
                            </div>
                        </div>
                    </div>
                )}

                {currentTemplate.positions.footer?.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'footer')}
                        className={`absolute cursor-move text-center font-bold text-slate-400 uppercase italic ${activeElement === 'footer' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ 
                            left: `${currentTemplate.positions.footer.x}mm`, 
                            top: `${currentTemplate.positions.footer.y}mm`,
                            width: `${currentTemplate.positions.footer.width}mm`,
                            fontSize: `${currentTemplate.positions.footer.fontSize}px`
                        }}
                    >
                        {currentTemplate.footerText}
                    </div>
                )}

                {currentTemplate.positions.qr?.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'qr')}
                        className={`absolute cursor-move transition-all ${activeElement === 'qr' ? 'ring-2 ring-indigo-500 z-50' : ''}`}
                        style={{ 
                            left: `${currentTemplate.positions.qr.x}mm`, 
                            top: `${currentTemplate.positions.qr.y}mm`, 
                            width: `${currentTemplate.positions.qr.width}mm`, 
                            height: `${currentTemplate.positions.qr.height}mm` 
                        }}
                    >
                        <div className="w-full h-full border border-slate-200 p-1 bg-white shadow-sm flex items-center justify-center">
                            <QrIcon size="80%" className="opacity-20"/>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default PrintSettings;
