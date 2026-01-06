
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
    Printer, Save, Layout, FileText, Type, Image as ImageIcon, 
    AlignLeft, GripVertical, CheckSquare, Square, LayoutGrid, Maximize, 
    Ruler, Move, MousePointer2, RefreshCw, ChevronRight, Search, Tags,
    ArrowUp, ArrowDown, EyeOff, Eye, Hash, Calendar, Table as TableIcon,
    Scissors, QrCode as QrIcon, AlignCenter, TextCursorInput, MonitorSmartphone,
    RotateCcw, Maximize2, Settings2, Trash2, Eye as EyeIcon, 
    ToggleLeft, ToggleRight, DollarSign, List, PencilLine
} from 'lucide-react';
import { PrintTemplate, DocumentType, PaperSize, Position, CompanyConfig, TableColumnConfig } from '../types';

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

  // Use the PrintTemplate type for the templates state to resolve 'any' usage and ensure consistency
  const [templates, setTemplates] = useState<Record<string, PrintTemplate>>(() => {
      const saved = localStorage.getItem('ferrecloud_print_templates_v6');
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
              positions: {
                  logo: { x: 10, y: 10, visible: true },
                  docLetter: { x: 105, y: 8, visible: true }, 
                  header: { x: 10, y: 35, visible: true },
                  voucherInfo: { x: 130, y: 15, visible: true }, 
                  client: { x: 10, y: 55, visible: true },
                  table: { x: 10, y: 90, visible: true },
                  totals: { x: 140, y: 240, visible: true },
                  caeInfo: { x: 140, y: 275, visible: true },
                  footer: { x: 10, y: 285, visible: true },
                  qr: { x: 10, y: 240, visible: true }
              }
          };
      });
      return initial;
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_print_templates_v6', JSON.stringify(templates));
  }, [templates]);

  const currentTemplate = templates[selectedType] || templates['FACTURA'];
  const dims = useMemo(() => {
    const base = PAPER_DIMENSIONS[currentTemplate.paperSize as PaperSize] || PAPER_DIMENSIONS['A4'];
    return currentTemplate.orientation === 'HORIZONTAL' ? { w: base.h, h: base.w } : { w: base.w, h: base.h };
  }, [currentTemplate.paperSize, currentTemplate.orientation]);

  // Updated to use Partial<PrintTemplate> for safer updates
  const updateTemplate = (updates: Partial<PrintTemplate>) => {
    setTemplates(prev => ({
        ...prev,
        [selectedType]: { ...prev[selectedType], ...updates }
    }));
  };

  const toggleVisibility = (key: string) => {
    const newPositions = { ...currentTemplate.positions };
    if (newPositions[key]) {
      newPositions[key].visible = !newPositions[key].visible;
      updateTemplate({ positions: newPositions });
    }
  };

  const updatePosition = (key: string, x: number, y: number) => {
      const newPositions = { ...currentTemplate.positions };
      if (newPositions[key]) {
        newPositions[key] = { ...newPositions[key], x, y };
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
      updatePosition(activeElement, newX, newY);
  };

  // Renderizador dinámico de campos para el sidebar según el elemento activo
  const renderElementEditor = () => {
      if (!activeElement) return null;

      switch (activeElement) {
          case 'header':
              return (
                  <div className="space-y-3 animate-fade-in">
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Nombre de Empresa</label>
                          <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold" value={currentTemplate.headerText} onChange={e => updateTemplate({headerText: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Sub-cabecera (Dirección/Fiscal)</label>
                          <textarea className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-[10px] h-20 resize-none" value={currentTemplate.subHeaderText} onChange={e => updateTemplate({subHeaderText: e.target.value})} />
                      </div>
                  </div>
              );
          case 'voucherInfo':
              return (
                  <div className="space-y-3 animate-fade-in">
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Título del Documento</label>
                          <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold" value={currentTemplate.titleText} onChange={e => updateTemplate({titleText: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-black uppercase text-slate-400">Pto. Venta</label>
                            <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs" value={currentTemplate.voucherPointOfSale} onChange={e => updateTemplate({voucherPointOfSale: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-slate-400">Nº Inicial</label>
                            <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs" value={currentTemplate.voucherNumber} onChange={e => updateTemplate({voucherNumber: e.target.value})} />
                          </div>
                      </div>
                  </div>
              );
          case 'docLetter':
              return (
                  <div className="grid grid-cols-2 gap-2 animate-fade-in">
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Letra (A, B, R, P)</label>
                          <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-center text-lg font-black" value={currentTemplate.docLetterText} maxLength={1} onChange={e => updateTemplate({docLetterText: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                          <label className="text-[8px] font-black uppercase text-slate-400">Etiqueta Cod.</label>
                          <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs" value={currentTemplate.docCodeText} onChange={e => updateTemplate({docCodeText: e.target.value})} />
                      </div>
                  </div>
              );
          case 'totals':
              return (
                  <div className="space-y-3 animate-fade-in">
                      <label className="text-[8px] font-black uppercase text-slate-400">Etiqueta de Total</label>
                      <input className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold" value={currentTemplate.totalsLabel} onChange={e => updateTemplate({totalsLabel: e.target.value})} />
                  </div>
              );
          case 'footer':
              return (
                  <div className="space-y-3 animate-fade-in">
                      <label className="text-[8px] font-black uppercase text-slate-400">Texto de Pie de Página</label>
                      <textarea className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-[10px] h-24 resize-none" value={currentTemplate.footerText} onChange={e => updateTemplate({footerText: e.target.value})} />
                  </div>
              );
          default:
              return <p className="text-[10px] text-slate-400 italic">Este elemento no posee campos editables adicionales.</p>;
      }
  };

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden" onMouseUp={() => setIsDragging(false)} onMouseMove={handleMouseMove}>
        
        {/* PANEL DE CONTROL IZQUIERDO */}
        <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col shadow-2xl z-30">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter leading-none">
                        <Printer className="text-indigo-400" size={20}/> Diseño Imprenta
                    </h2>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Personalización Total</p>
                </div>
                <button onClick={() => alert('Diseño guardado localmente.')} className="p-3 bg-white/10 hover:bg-indigo-600 rounded-2xl transition-all shadow-lg"><Save size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-20">
                {/* SELECTOR TIPO */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Documento a editar</label>
                    <select 
                        className="w-full p-2.5 bg-white border rounded-xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                    >
                        {REPORT_LIST.map(r => <option key={r.type} value={r.type}>{r.name}</option>)}
                    </select>
                </div>

                {/* PROPIEDADES DEL ELEMENTO SELECCIONADO */}
                <div className={`p-5 rounded-[2rem] transition-all border ${activeElement ? 'bg-indigo-50 border-indigo-200 shadow-lg' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                    <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <PencilLine size={14}/> {activeElement ? `Editando: ${activeElement.toUpperCase()}` : 'Seleccione un elemento'}
                    </h3>
                    {renderElementEditor()}
                </div>

                {/* TABLA: CONFIGURACIÓN DE COLUMNAS */}
                <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white space-y-4 shadow-xl">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><TableIcon size={14}/> Columnas de Tabla</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <button onClick={() => updateTemplate({showPrices: !currentTemplate.showPrices})} className="flex items-center justify-between p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <span className="text-[9px] font-black uppercase">Precios y Totales</span>
                            {currentTemplate.showPrices ? <ToggleRight className="text-green-400" size={20}/> : <ToggleLeft className="text-slate-600" size={20}/>}
                        </button>
                        <button onClick={() => updateTemplate({showSkus: !currentTemplate.showSkus})} className="flex items-center justify-between p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <span className="text-[9px] font-black uppercase">Código SKU</span>
                            {currentTemplate.showSkus ? <ToggleRight className="text-green-400" size={20}/> : <ToggleLeft className="text-slate-600" size={20}/>}
                        </button>
                        <button onClick={() => updateTemplate({showBrands: !currentTemplate.showBrands})} className="flex items-center justify-between p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <span className="text-[9px] font-black uppercase">Marca de Producto</span>
                            {currentTemplate.showBrands ? <ToggleRight className="text-green-400" size={20}/> : <ToggleLeft className="text-slate-600" size={20}/>}
                        </button>
                        <button onClick={() => updateTemplate({showIvaColumn: !currentTemplate.showIvaColumn})} className="flex items-center justify-between p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <span className="text-[9px] font-black uppercase">Alícuota IVA %</span>
                            {currentTemplate.showIvaColumn ? <ToggleRight className="text-green-400" size={20}/> : <ToggleLeft className="text-slate-600" size={20}/>}
                        </button>
                    </div>
                </div>

                {/* GESTIÓN DE CAPAS (VISIBILIDAD) */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><LayoutGrid size={14}/> Capas del Lienzo</h3>
                    <div className="grid grid-cols-1 gap-1">
                        {Object.keys(currentTemplate.positions).map(key => (
                            <div key={key} className={`flex items-center justify-between p-2 rounded-xl ${activeElement === key ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'}`}>
                                <button onClick={() => setActiveElement(key)} className="flex items-center gap-3 flex-1 text-left">
                                    <GripVertical size={12} className="text-slate-300"/>
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${currentTemplate.positions[key].visible ? 'text-slate-700' : 'text-slate-300 line-through'}`}>{key}</span>
                                </button>
                                <button 
                                    onClick={() => toggleVisibility(key)}
                                    className={`p-1.5 rounded-lg ${currentTemplate.positions[key].visible ? 'text-indigo-600' : 'text-slate-300'}`}>
                                    {currentTemplate.positions[key].visible ? <EyeIcon size={16}/> : <EyeOff size={16}/>}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FORMATO HOJA */}
                <div className="bg-slate-100 p-6 rounded-[2.5rem] space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layout size={14}/> Hoja y Papel</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.keys(PAPER_DIMENSIONS).filter(k => k !== 'CUSTOM').map(size => (
                            <button 
                                key={size}
                                onClick={() => updateTemplate({paperSize: size as PaperSize})}
                                className={`py-2 rounded-xl text-[9px] font-black border transition-all ${currentTemplate.paperSize === size ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>
                                {size.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => updateTemplate({orientation: currentTemplate.orientation === 'VERTICAL' ? 'HORIZONTAL' : 'VERTICAL'})} className="w-full mt-2 py-3 bg-white text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-indigo-100 shadow-sm flex items-center justify-center gap-2">
                        <RotateCcw size={14}/> Cambiar Orientación
                    </button>
                </div>
            </div>
        </div>

        {/* ÁREA DE TRABAJO (LIENZO) */}
        <div className="flex-1 bg-slate-200 flex flex-col items-center p-12 overflow-auto relative scroll-smooth custom-scrollbar">
            <div className="mb-6 bg-slate-800 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-xl shrink-0">
                <span className="text-indigo-400">{selectedType}</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>{dims.w}mm x {dims.h}mm</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>{currentTemplate.orientation}</span>
            </div>
            
            <div 
                ref={paperRef}
                className="bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative flex-shrink-0 border border-slate-300 transition-all duration-500 overflow-hidden"
                style={{ width: `${dims.w}mm`, height: `${dims.h}mm` }}
            >
                {/* GUÍAS DE CORTE VISUALES */}
                <div className="absolute top-[32mm] left-0 w-full h-px bg-slate-100"></div>
                <div className="absolute top-0 left-1/2 w-px h-[32mm] bg-slate-100 -translate-x-1/2"></div>

                {/* LOGO DE EMPRESA (Configuración de Mi Empresa) */}
                {currentTemplate.positions.logo.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'logo')}
                        className={`absolute cursor-move transition-all flex items-center justify-center ${activeElement === 'logo' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''}`}
                        style={{ left: `${currentTemplate.positions.logo.x}mm`, top: `${currentTemplate.positions.logo.y}mm`, width: '40mm', height: '25mm' }}
                    >
                        {companyConfig.logo ? (
                            <img src={companyConfig.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-4">
                                <ImageIcon size={24} className="text-slate-300 mb-1"/>
                                <span className="text-[7px] font-black uppercase text-slate-400">Sin Logo Configurador</span>
                            </div>
                        )}
                    </div>
                )}

                {/* LETRA COMPROBANTE CENTRAL */}
                {currentTemplate.positions.docLetter.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'docLetter')}
                        className={`absolute cursor-move bg-white border-2 border-slate-900 w-12 h-14 flex flex-col items-center justify-center shadow-md ${activeElement === 'docLetter' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.docLetter.x}mm`, top: `${currentTemplate.positions.docLetter.y}mm`, marginLeft: '-6mm' }}
                    >
                        <span className="text-3xl font-black leading-none">{currentTemplate.docLetterText}</span>
                        <span className="text-[6px] font-black uppercase mt-1 tracking-tighter">{currentTemplate.docCodeText}</span>
                    </div>
                )}

                {/* DATOS CABECERA DERECHA (VOUCHER INFO) */}
                {currentTemplate.positions.voucherInfo.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'voucherInfo')}
                        className={`absolute cursor-move w-[65mm] ${activeElement === 'voucherInfo' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.voucherInfo.x}mm`, top: `${currentTemplate.positions.voucherInfo.y}mm` }}
                    >
                        <h2 className="text-xl font-black text-slate-800 uppercase text-center mb-3 tracking-[0.2em]">{currentTemplate.titleText}</h2>
                        <div className="space-y-1.5 text-[9px] font-bold text-slate-600">
                            <p>Nº {currentTemplate.voucherPointOfSale} - {currentTemplate.voucherNumber}</p>
                            <p>Fecha de Emisión: {new Date().toLocaleDateString()}</p>
                            <p>C.U.I.T.: {currentTemplate.voucherCuitEmisor}</p>
                            <p>Ingresos Brutos: {currentTemplate.voucherIIBBEmisor}</p>
                        </div>
                    </div>
                )}

                {/* CABECERA IZQUIERDA (IDENTIDAD) */}
                {currentTemplate.positions.header.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'header')}
                        className={`absolute cursor-move max-w-[85mm] ${activeElement === 'header' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.header.x}mm`, top: `${currentTemplate.positions.header.y}mm` }}
                    >
                        <p className="text-xs font-black uppercase leading-none text-slate-800 tracking-tighter mb-2">{currentTemplate.headerText}</p>
                        <div className="text-[8px] font-bold text-slate-400 uppercase italic whitespace-pre-line leading-relaxed">
                            {currentTemplate.subHeaderText}
                        </div>
                    </div>
                )}

                {/* CLIENTE */}
                {currentTemplate.positions.client.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'client')}
                        className={`absolute cursor-move w-[190mm] border border-slate-300 p-4 grid grid-cols-2 gap-6 rounded-sm ${activeElement === 'client' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.client.x}mm`, top: `${currentTemplate.positions.client.y}mm` }}
                    >
                        <div className="text-[9px] space-y-1.5 font-medium">
                            <p><strong>Sr/es:</strong> CLIENTE DE PRUEBA S.R.L.</p>
                            <p><strong>Dirección:</strong> CALLE EJEMPLO 456 - CORDOBA</p>
                            <p><strong>IVA:</strong> Responsable Inscripto</p>
                        </div>
                        <div className="text-[9px] space-y-1.5 font-medium">
                            <p><strong>CUIT:</strong> 30-00000000-0</p>
                            <p><strong>Cond. Venta:</strong> Cuenta Corriente</p>
                        </div>
                    </div>
                )}

                {/* TABLA DE ITEMS */}
                {currentTemplate.positions.table.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'table')}
                        className={`absolute cursor-move w-[190mm] ${activeElement === 'table' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.table.x}mm`, top: `${currentTemplate.positions.table.y}mm` }}
                    >
                        <table className="w-full text-left border-t border-b border-slate-800">
                            <thead className="text-[9px] font-black uppercase border-b border-slate-300 bg-slate-50">
                                <tr>
                                    {currentTemplate.showSkus && <th className="py-2 px-2">Código</th>}
                                    <th className="py-2">Descripción del Artículo</th>
                                    <th className="py-2 text-center">Cant.</th>
                                    {currentTemplate.showIvaColumn && <th className="py-2 text-center">IVA</th>}
                                    {currentTemplate.showPrices && <th className="py-2 text-right">Unitario</th>}
                                    {currentTemplate.showPrices && <th className="py-2 text-right pr-2">Subtotal</th>}
                                </tr>
                            </thead>
                            <tbody className="text-[9px] font-medium text-slate-700">
                                <tr className="border-b border-slate-100">
                                    {currentTemplate.showSkus && <td className="py-2 px-2 font-mono">SKU-9902</td>}
                                    <td className="py-2 uppercase font-bold">
                                        PINZA UNIVERSAL 8 AISLADA PRO
                                        {currentTemplate.showBrands && <span className="block text-[7px] text-indigo-400">MARCA: STANLEY</span>}
                                    </td>
                                    <td className="py-2 text-center">2,00</td>
                                    {currentTemplate.showIvaColumn && <td className="py-2 text-center">21,0</td>}
                                    {currentTemplate.showPrices && <td className="py-2 text-right">$4.500,00</td>}
                                    {currentTemplate.showPrices && <td className="py-2 text-right font-black pr-2">$9.000,00</td>}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TOTALES */}
                {currentTemplate.positions.totals.visible && currentTemplate.showPrices && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'totals')}
                        className={`absolute cursor-move w-[65mm] border border-slate-900 shadow-sm ${activeElement === 'totals' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.totals.x}mm`, top: `${currentTemplate.positions.totals.y}mm` }}
                    >
                        <div className="p-3 space-y-1 text-[9px] font-bold text-slate-700 bg-white">
                            <div className="flex justify-between"><span>Gravado</span><span>$7.438,01</span></div>
                            <div className="flex justify-between"><span>IVA 21%</span><span>$1.561,99</span></div>
                            <div className="flex justify-between text-base font-black bg-slate-900 text-white p-2 mt-2">
                                <span className="text-[8px] uppercase tracking-widest leading-none pt-1">{currentTemplate.totalsLabel}</span>
                                <span>$9.000,00</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* QR AREA */}
                {currentTemplate.positions.qr.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'qr')}
                        className={`absolute cursor-move flex items-center gap-4 ${activeElement === 'qr' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''}`}
                        style={{ left: `${currentTemplate.positions.qr.x}mm`, top: `${currentTemplate.positions.qr.y}mm` }}
                    >
                        <div className="w-16 h-16 border border-slate-200 p-1.5 bg-white shadow-sm">
                            <QrIcon size="100%" className="opacity-40"/>
                        </div>
                        <div className="max-w-[100mm]">
                            <p className="text-[7px] font-bold italic text-slate-400 leading-tight uppercase tracking-widest">Autorización ARCA - Validez Fiscal Digital mediante QR.</p>
                        </div>
                    </div>
                )}

                {/* PIE DE PAGINA (FOOTER) */}
                {currentTemplate.positions.footer.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'footer')}
                        className={`absolute cursor-move w-[190mm] border-t border-slate-900 pt-3 text-center ${activeElement === 'footer' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.footer.x}mm`, top: `${currentTemplate.positions.footer.y}mm` }}
                    >
                        <p className="text-[7px] font-black uppercase text-slate-400 tracking-[0.4em] whitespace-pre-line leading-relaxed">
                            {currentTemplate.footerText}
                        </p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default PrintSettings;
