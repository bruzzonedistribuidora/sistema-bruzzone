
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
    Printer, Save, Layout, FileText, Type, Image as ImageIcon, 
    AlignLeft, GripVertical, CheckSquare, Square, LayoutGrid, Maximize, 
    Ruler, Move, MousePointer2, RefreshCw, ChevronRight, Search, Tags,
    ArrowUp, ArrowDown, EyeOff, Eye, Hash, Calendar, Table as TableIcon,
    Scissors, QrCode as QrIcon, AlignCenter, TextCursorInput, MonitorSmartphone,
    RotateCcw, Maximize2, Settings2, Trash2, Eye as EyeIcon
} from 'lucide-react';
import { PrintTemplate, DocumentType, PaperSize, Position, CompanyConfig, TableColumnConfig } from '../types';

const REPORT_LIST: { type: DocumentType, name: string, size: PaperSize, cat: string }[] = [
    { type: 'FACTURA', name: 'Factura de Venta (Modelo A/B)', size: 'A4', cat: 'COMPROBANTES' },
    { type: 'REMITO', name: 'Remito de Entrega (Modelo R)', size: 'A4', cat: 'COMPROBANTES' },
    { type: 'PRESUPUESTO', name: 'Presupuesto Comercial', size: 'A4', cat: 'COMPROBANTES' },
    { type: 'CLI_RESUMEN_CUENTA', name: 'Resumen de Cuenta Corriente', size: 'A4', cat: 'CLIENTES' },
    { type: 'PROD_BARRAS', name: 'Etiquetas de Estantería', size: 'ROLLO_62MM', cat: 'PRODUCTOS' },
];

const BRUZZONE_COLUMNS: TableColumnConfig[] = [
    { id: 'code', label: 'Codigo', visible: true, width: 15 },
    { id: 'desc', label: 'Descripcion', visible: true, width: 45 },
    { id: 'unitPrice', label: 'Importe', visible: true, width: 10 },
    { id: 'qty', label: 'Cant', visible: true, width: 10 },
    { id: 'subtotal', label: 'Total', visible: true, width: 20 },
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

  const [templates, setTemplates] = useState<Record<string, any>>(() => {
      const saved = localStorage.getItem('ferrecloud_print_templates_v4');
      if (saved) return JSON.parse(saved);

      const initial: Record<string, any> = {};
      REPORT_LIST.forEach(report => {
          initial[report.type] = {
              id: report.type,
              name: report.name,
              paperSize: report.size,
              orientation: 'VERTICAL',
              titleText: 'FACTURA',
              docLetterText: 'A',
              docCodeText: 'Codigo 1',
              headerText: companyConfig.fantasyName || 'FERRETERIA BRUZZONE',
              subHeaderText: `Dr. Carlos Rocha 128 (2686)\nALEJANDRO ROCA - CORDOBA\nResponsable Inscripto`,
              footerText: 'Impreso por LIDER GESTION - WYNGES SISTEMAS - WWW.WYNGES.COM',
              totalsLabel: 'TOTAL COMPROBANTE',
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
      localStorage.setItem('ferrecloud_print_templates_v4', JSON.stringify(templates));
  }, [templates]);

  const currentTemplate = templates[selectedType] || templates['FACTURA'];
  const dims = useMemo(() => {
    const base = PAPER_DIMENSIONS[currentTemplate.paperSize as PaperSize] || PAPER_DIMENSIONS['A4'];
    return currentTemplate.orientation === 'HORIZONTAL' ? { w: base.h, h: base.w } : { w: base.w, h: base.h };
  }, [currentTemplate.paperSize, currentTemplate.orientation]);

  const updateTemplate = (updates: any) => {
    setTemplates(prev => ({
        ...prev,
        [selectedType]: { ...prev[selectedType], ...updates }
    }));
  };

  const toggleVisibility = (key: string) => {
    const newPositions = { ...currentTemplate.positions };
    newPositions[key].visible = !newPositions[key].visible;
    updateTemplate({ positions: newPositions });
  };

  const updatePosition = (key: string, x: number, y: number) => {
      const newPositions = { ...currentTemplate.positions };
      newPositions[key] = { ...newPositions[key], x, y };
      updateTemplate({ positions: newPositions });
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

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden" onMouseUp={() => setIsDragging(false)} onMouseMove={handleMouseMove}>
        
        {/* PANEL DE CONTROL IZQUIERDO */}
        <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col shadow-2xl z-30">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter leading-none">
                        <Printer className="text-indigo-400" size={20}/> Diseño Imprenta
                    </h2>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Adaptación Bruzzone v4.0</p>
                </div>
                <button onClick={() => alert('Diseño guardado.')} className="p-3 bg-white/10 hover:bg-indigo-600 rounded-2xl transition-all shadow-lg"><Save size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-20">
                {/* SELECTOR TIPO */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Comprobante a editar</label>
                    <select 
                        className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                    >
                        {REPORT_LIST.map(r => <option key={r.type} value={r.type}>{r.name}</option>)}
                    </select>
                </div>

                {/* VISIBILIDAD DE CAPAS */}
                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-200 space-y-4">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><LayoutGrid size={14}/> Visibilidad de Capas</h3>
                    <div className="grid grid-cols-1 gap-1.5">
                        {Object.keys(currentTemplate.positions).map(key => (
                            <div key={key} className={`flex items-center justify-between p-2 rounded-xl transition-all ${activeElement === key ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-white'}`}>
                                <button onClick={() => setActiveElement(key)} className="flex items-center gap-3 flex-1 text-left">
                                    <div className={`p-1.5 rounded-lg ${currentTemplate.positions[key].visible ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-300'}`}>
                                        <GripVertical size={12}/>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${currentTemplate.positions[key].visible ? 'text-slate-700' : 'text-slate-300 line-through'}`}>{key.replace(/([A-Z])/g, ' $1')}</span>
                                </button>
                                <button 
                                    onClick={() => toggleVisibility(key)}
                                    className={`p-2 rounded-lg transition-all ${currentTemplate.positions[key].visible ? 'text-indigo-600 hover:bg-indigo-100' : 'text-slate-300 hover:bg-slate-100'}`}>
                                    {currentTemplate.positions[key].visible ? <EyeIcon size={16}/> : <EyeOff size={16}/>}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TEXTOS DINÁMICOS */}
                <div className="bg-indigo-50 p-5 rounded-[2rem] border border-indigo-100 space-y-5 shadow-inner">
                    <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><TextCursorInput size={14}/> Contenido Editorial</h3>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Título</label>
                                <input className="w-full p-2.5 bg-white border border-indigo-100 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500" value={currentTemplate.titleText} onChange={e => updateTemplate({titleText: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Letra Caja</label>
                                <input className="w-full p-2.5 bg-white border border-indigo-100 rounded-xl text-center text-lg font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500" value={currentTemplate.docLetterText} maxLength={1} onChange={e => updateTemplate({docLetterText: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Sub-Título Emisor</label>
                            <textarea className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-[10px] font-bold outline-none h-16 resize-none" value={currentTemplate.subHeaderText} onChange={e => updateTemplate({subHeaderText: e.target.value})} />
                        </div>

                        <div>
                            <label className="block text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Texto Pie de Página</label>
                            <textarea className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-[10px] font-bold outline-none h-16 resize-none" value={currentTemplate.footerText} onChange={e => updateTemplate({footerText: e.target.value})} />
                        </div>

                        <div>
                            <label className="block text-[8px] font-black text-indigo-300 uppercase mb-1 ml-1">Etiqueta Totales</label>
                            <input className="w-full p-2.5 bg-white border border-indigo-100 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500" value={currentTemplate.totalsLabel} onChange={e => updateTemplate({totalsLabel: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* FORMATO HOJA */}
                <div className="bg-slate-900 p-5 rounded-[2rem] text-white space-y-4 shadow-xl">
                    <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Layout size={14}/> Medidas de Salida</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.keys(PAPER_DIMENSIONS).filter(k => k !== 'CUSTOM').map(size => (
                            <button 
                                key={size}
                                onClick={() => updateTemplate({paperSize: size})}
                                className={`py-2 rounded-xl text-[9px] font-black border transition-all ${currentTemplate.paperSize === size ? 'bg-white text-slate-900 border-white shadow-lg' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}>
                                {size.replace('_', ' ')}
                            </button>
                        ))}
                        <button onClick={() => updateTemplate({orientation: currentTemplate.orientation === 'VERTICAL' ? 'HORIZONTAL' : 'VERTICAL'})} className="col-span-2 mt-2 py-3 bg-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                            <RotateCcw size={14}/> Cambiar a {currentTemplate.orientation === 'VERTICAL' ? 'Apaisado' : 'Vertical'}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* ÁREA DE TRABAJO (LIENZO) */}
        <div className="flex-1 bg-slate-200 flex flex-col items-center p-12 overflow-auto relative scroll-smooth custom-scrollbar">
            <div className="mb-6 bg-slate-800 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-xl">
                <span>{selectedType}</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>{dims.w}mm x {dims.h}mm</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span className="text-indigo-400">{currentTemplate.orientation}</span>
            </div>
            
            <div 
                ref={paperRef}
                className="bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative flex-shrink-0 border border-slate-300 transition-all duration-500 overflow-hidden"
                style={{ width: `${dims.w}mm`, height: `${dims.h}mm` }}
            >
                {/* LÍNEAS DE CORTE ESTILO BRUZZONE */}
                <div className="absolute top-[32mm] left-0 w-full h-px bg-slate-200"></div>
                <div className="absolute top-0 left-1/2 w-px h-[32mm] bg-slate-200 -translate-x-1/2"></div>

                {/* LOGO */}
                {currentTemplate.positions.logo.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'logo')}
                        className={`absolute cursor-move transition-shadow ${activeElement === 'logo' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''}`}
                        style={{ left: `${currentTemplate.positions.logo.x}mm`, top: `${currentTemplate.positions.logo.y}mm` }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-14 h-14 bg-slate-900 text-white flex items-center justify-center font-black text-2xl rounded-lg shadow-lg">FB</div>
                            <div>
                                <h1 className="font-black text-base tracking-tighter leading-none">{currentTemplate.headerText.split(' ')[0]}</h1>
                                <h1 className="font-black text-base tracking-tighter leading-none">{currentTemplate.headerText.split(' ')[1]}</h1>
                            </div>
                        </div>
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

                {/* DATOS CABECERA DERECHA */}
                {currentTemplate.positions.voucherInfo.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'voucherInfo')}
                        className={`absolute cursor-move w-[65mm] ${activeElement === 'voucherInfo' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.voucherInfo.x}mm`, top: `${currentTemplate.positions.voucherInfo.y}mm` }}
                    >
                        <h2 className="text-2xl font-black text-slate-800 uppercase text-center mb-3 tracking-[0.2em]">{currentTemplate.titleText}</h2>
                        <div className="space-y-1.5 text-[9px] font-bold text-slate-600">
                            <p>Nº 00004 - 00001900</p>
                            <p>Fecha: {new Date().toLocaleDateString()}</p>
                            <p>C.U.I.T.: 20-30800287-0</p>
                            <p>Ingresos Brutos: 0284537947</p>
                        </div>
                    </div>
                )}

                {/* SUB CABECERA */}
                {currentTemplate.positions.header.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'header')}
                        className={`absolute cursor-move max-w-[85mm] ${activeElement === 'header' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.header.x}mm`, top: `${currentTemplate.positions.header.y}mm` }}
                    >
                        <p className="text-[10px] font-black uppercase leading-none text-slate-800">SERASSIO MAURICIO</p>
                        <div className="text-[8px] font-bold text-slate-400 uppercase mt-2 whitespace-pre-line leading-relaxed italic">
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
                            <p><strong>Razón Social:</strong> DELFINO EDUARDO LUIS</p>
                            <p><strong>Domicilio:</strong> RIVADAVIA 789 8º PISO - CAPITAL</p>
                            <p><strong>Sit. Tributaria:</strong> Responsable Inscripto</p>
                        </div>
                        <div className="text-[9px] space-y-1.5 font-medium">
                            <p><strong>Nro Cliente:</strong> 109</p>
                            <p><strong>C.U.I.T.:</strong> 20-10765691-0</p>
                            <p className="pt-2"><strong>Forma de Pago:</strong> Cuenta Corriente</p>
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
                        <table className="w-full text-left border-t border-b border-slate-900">
                            <thead className="text-[9px] font-black uppercase border-b border-slate-300 bg-slate-50">
                                <tr>
                                    <th className="py-2 px-2">Codigo</th>
                                    <th className="py-2">Descripcion</th>
                                    <th className="py-2 text-right">Unitario</th>
                                    <th className="py-2 text-center">Cant</th>
                                    <th className="py-2 text-center">IVA %</th>
                                    <th className="py-2 text-right pr-2">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-[9px] font-medium text-slate-700">
                                <tr className="border-b border-slate-100">
                                    <td className="py-2 px-2 font-mono">241706</td>
                                    <td className="py-2 uppercase font-bold">MANGUERA COMB C/T 8 mm 150LB CAM</td>
                                    <td className="py-2 text-right">$7.101,00</td>
                                    <td className="py-2 text-center">5,00</td>
                                    <td className="py-2 text-center">21,0</td>
                                    <td className="py-2 text-right font-black pr-2">$35.505,00</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <td className="py-2 px-2 font-mono">316442</td>
                                    <td className="py-2 uppercase font-bold">ABRAZADERA FLEJE 9mm x 22mm</td>
                                    <td className="py-2 text-right">$831,08</td>
                                    <td className="py-2 text-center">5,00</td>
                                    <td className="py-2 text-center">21,0</td>
                                    <td className="py-2 text-right font-black pr-2">$4.155,39</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PIE DE PAGINA */}
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

                {/* TOTALES */}
                {currentTemplate.positions.totals.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'totals')}
                        className={`absolute cursor-move w-[65mm] border border-slate-900 shadow-sm ${activeElement === 'totals' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.totals.x}mm`, top: `${currentTemplate.positions.totals.y}mm` }}
                    >
                        <div className="p-3 space-y-1 text-[9px] font-bold text-slate-700">
                            <div className="flex justify-between"><span>Subtotal</span><span>$39.660,39</span></div>
                            <div className="flex justify-between"><span>IVA %21,0</span><span>$8.328,68</span></div>
                            <div className="flex justify-between"><span>IVA %10,5</span><span>$0,00</span></div>
                            <div className="flex justify-between text-base font-black bg-slate-900 text-white p-1.5 mt-2">
                                <span className="text-[8px] uppercase tracking-widest">{currentTemplate.totalsLabel}</span>
                                <span>$47.989,07</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* CAE INFO */}
                {currentTemplate.positions.caeInfo.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'caeInfo')}
                        className={`absolute cursor-move text-[9px] font-black uppercase text-right leading-relaxed ${activeElement === 'caeInfo' ? 'ring-2 ring-indigo-500' : ''}`}
                        style={{ left: `${currentTemplate.positions.caeInfo.x}mm`, top: `${currentTemplate.positions.caeInfo.y}mm` }}
                    >
                        <p>C.A.E.: 75520332507227</p>
                        <p className="text-slate-400">Vencimiento C.A.E.: 05/01/2026</p>
                    </div>
                )}

                {/* QR AREA */}
                {currentTemplate.positions.qr.visible && (
                    <div 
                        onMouseDown={(e) => handleMouseDown(e, 'qr')}
                        className={`absolute cursor-move flex items-center gap-4 ${activeElement === 'qr' ? 'ring-2 ring-indigo-500 bg-indigo-50/10' : ''}`}
                        style={{ left: `${currentTemplate.positions.qr.x}mm`, top: `${currentTemplate.positions.qr.y}mm` }}
                    >
                        <div className="w-16 h-16 border border-slate-200 p-1.5 bg-white shadow-sm">
                            <QrIcon size="100%" className="opacity-40"/>
                        </div>
                        <div className="max-w-[100mm]">
                            <p className="text-[7px] font-bold italic text-slate-400 leading-tight uppercase tracking-widest">Comprobante autorizado por ARCA (AFIP).<br/>Validación mediante Código QR obligatoria.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default PrintSettings;
