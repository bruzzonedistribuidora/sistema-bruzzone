
import React, { useState, useRef } from 'react';
import { 
    FileUp, FileSpreadsheet, CheckCircle, ArrowRight, 
    X, AlertTriangle, RefreshCw, Layers, Table as TableIcon,
    Database, Settings2, Info, ChevronRight, Save, Trash2,
    DatabaseZap, Sparkles
} from 'lucide-react';
import { Product } from '../types';
import { productDB } from '../services/storageService';

interface InitialImportProps {
    onComplete: () => void;
}

const InitialImport: React.FC<InitialImportProps> = ({ onComplete }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fileRows, setFileRows] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, number>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mapeo exhaustivo según imagen proporcionada (exact names)
    const productFields = [
        { key: 'internalCodes', label: 'CODIGO Propi', required: true },
        { key: 'name', label: 'Nombre', required: true },
        { key: 'listCost', label: 'Costo', required: true },
        { key: 'brand', label: 'Marca', required: false },
        { key: 'category', label: 'Rubro', required: false },
        { key: 'stock', label: 'Stock', required: false },
        { key: 'barcodes', label: 'Codigo de Barras', required: false },
        { key: 'providerCodes', label: 'Cod PROV', required: false },
        { key: 'provider', label: 'Proveedor', required: false },
        { key: 'profitMargin', label: 'ganancia', required: false },
        { key: 'coeficienteBonificacionCosto', label: 'CoeficienteBonificacionCosto', required: false },
        { key: 'porcentajesBonificacionCosto', label: 'PorcentajesBonificacionCosto', required: false },
        { key: 'porcentajesBonificacion', label: 'PorcentajesBonificacion', required: false },
        { key: 'stockMinimo', label: 'StockMinimo', required: false },
        { key: 'stockMaximo', label: 'StockMaximo', required: false },
        { key: 'reorderPoint', label: 'Punto pedido', required: false },
        { key: 'measureUnitPurchase', label: 'UnidadDeMedidaCompra', required: false },
        { key: 'purchaseCurrency', label: 'MonedaCompra', required: false },
        { key: 'saleCurrency', label: 'MonedaVenta', required: false },
        { key: 'tasa', label: 'Tasa', required: false },
        { key: 'listItemTasa', label: 'ListItemTasa', required: false },
        { key: 'alicuotaImpuestoInterno', label: 'AlicuotaImpuestoInterno', required: false },
        { key: 'otrosCodigos1', label: 'OtrosCodigos1', required: false },
        { key: 'otrosCodigos2', label: 'OtrosCodigos2', required: false },
        { key: 'otrosCodigos3', label: 'OtrosCodigos3', required: false },
        { key: 'precioCostoSinBonificar', label: 'PrecioCostoSinBonificar', required: false },
        { key: 'precioConTasaBonificadoView', label: 'PrecioConTasaBonificadoView', required: false },
        { key: 'porcentajeGanancia1View', label: 'PorcentajeGanancia1View', required: false },
        { key: 'porcentajeGanancia2View', label: 'PorcentajeGanancia2View', required: false },
        { key: 'usaPorcentaje', label: 'UsaPorcentaje', required: false },
        { key: 'listaCodigo', label: 'ListaCodigo', required: false },
        { key: 'detalleOtrosCostos', label: 'DetalleOtrosCostos', required: false }
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length < 1) { alert("El archivo está vacío."); return; }

            const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
            const parsedRows = lines.map(line => line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, '')));
            
            setHeaders(parsedRows[0]);
            setFileRows(parsedRows.slice(1));
            
            // Auto-mapping inteligente por nombre exacto
            const autoMap: Record<string, number> = {};
            productFields.forEach(field => {
                const index = parsedRows[0].findIndex(h => 
                    h.toLowerCase() === field.label.toLowerCase() || 
                    h.toLowerCase() === field.key.toLowerCase()
                );
                if (index !== -1) autoMap[field.key] = index;
            });
            setMapping(autoMap);
            setStep(2);
        };
        reader.readAsText(file);
    };

    const processImport = async () => {
        if (mapping.internalCodes === undefined || mapping.name === undefined || mapping.listCost === undefined) {
            alert("Falta mapear campos obligatorios: CODIGO Propi, Nombre, Costo.");
            return;
        }

        setIsProcessing(true);
        setProgress(0);

        const CHUNK_SIZE = 5000;
        let index = 0;

        const processChunk = async () => {
            const limit = Math.min(index + CHUNK_SIZE, fileRows.length);
            const chunkProducts: Product[] = [];

            for (let i = index; i < limit; i++) {
                const row = fileRows[i];
                const rawCost = parseFloat(row[mapping.listCost]?.replace(',', '.') || '0');
                const rawMargin = mapping.profitMargin !== undefined ? parseFloat(row[mapping.profitMargin]?.replace(',', '.') || '30') : 30;
                const coefBonif = mapping.coeficienteBonificacionCosto !== undefined ? parseFloat(row[mapping.coeficienteBonificacionCosto]?.replace(',', '.') || '1') : 1;
                
                const costAfterDiscounts = rawCost * coefBonif;
                const priceNeto = costAfterDiscounts * (1 + rawMargin / 100);
                const vatRate = 21;

                chunkProducts.push({
                    id: `prod-${Date.now()}-${i}`,
                    internalCodes: [row[mapping.internalCodes] || 'S/C'],
                    barcodes: mapping.barcodes !== undefined ? [row[mapping.barcodes]] : [],
                    providerCodes: mapping.providerCodes !== undefined ? [row[mapping.providerCodes]] : [],
                    otrosCodigos1: mapping.otrosCodigos1 !== undefined ? row[mapping.otrosCodigos1] : '',
                    otrosCodigos2: mapping.otrosCodigos2 !== undefined ? row[mapping.otrosCodigos2] : '',
                    otrosCodigos3: mapping.otrosCodigos3 !== undefined ? row[mapping.otrosCodigos3] : '',
                    name: (row[mapping.name] || 'SIN NOMBRE').toUpperCase(),
                    brand: (mapping.brand !== undefined ? row[mapping.brand] : 'GENÉRICO').toUpperCase(),
                    category: (mapping.category !== undefined ? row[mapping.category] : 'GENERAL').toUpperCase(),
                    provider: (mapping.provider !== undefined ? row[mapping.provider] : 'PROVEEDOR').toUpperCase(),
                    description: '',
                    measureUnitPurchase: (mapping.measureUnitPurchase !== undefined ? row[mapping.measureUnitPurchase] : 'Unidad').toUpperCase(),
                    purchaseCurrency: (mapping.purchaseCurrency !== undefined ? row[mapping.purchaseCurrency] : 'ARS').toUpperCase(),
                    saleCurrency: (mapping.saleCurrency !== undefined ? row[mapping.saleCurrency] : 'ARS').toUpperCase(),
                    vatRate: vatRate,
                    listCost: rawCost,
                    precioCostoSinBonificar: mapping.precioCostoSinBonificar !== undefined ? parseFloat(row[mapping.precioCostoSinBonificar]) : rawCost,
                    coeficienteBonificacionCosto: coefBonif,
                    porcentajesBonificacionCosto: mapping.porcentajesBonificacionCosto !== undefined ? row[mapping.porcentajesBonificacionCosto] : '',
                    porcentajesBonificacion: mapping.porcentajesBonificacion !== undefined ? row[mapping.porcentajesBonificacion] : '',
                    costAfterDiscounts: costAfterDiscounts,
                    profitMargin: rawMargin,
                    porcentajeGanancia1View: mapping.porcentajeGanancia1View !== undefined ? parseFloat(row[mapping.porcentajeGanancia1View]) : undefined,
                    porcentajeGanancia2View: mapping.porcentajeGanancia2View !== undefined ? parseFloat(row[mapping.porcentajeGanancia2View]) : undefined,
                    precioConTasaBonificadoView: mapping.precioConTasaBonificadoView !== undefined ? parseFloat(row[mapping.precioConTasaBonificadoView]) : undefined,
                    priceNeto: priceNeto,
                    priceFinal: priceNeto * (1 + vatRate / 100),
                    stock: mapping.stock !== undefined ? (parseFloat(row[mapping.stock]?.replace(',', '.')) || 0) : 0,
                    stockMinimo: mapping.stockMinimo !== undefined ? parseFloat(row[mapping.stockMinimo]) : 0,
                    stockMaximo: mapping.stockMaximo !== undefined ? parseFloat(row[mapping.stockMaximo]) : 0,
                    reorderPoint: mapping.reorderPoint !== undefined ? parseFloat(row[mapping.reorderPoint]) : 0,
                    stockDetails: [],
                    location: '',
                    tasa: mapping.tasa !== undefined ? parseFloat(row[mapping.tasa]) : 0,
                    listItemTasa: mapping.listItemTasa !== undefined ? parseFloat(row[mapping.listItemTasa]) : 0,
                    alicuotaImpuestoInterno: mapping.alicuotaImpuestoInterno !== undefined ? parseFloat(row[mapping.alicuotaImpuestoInterno]) : 0,
                    usaPorcentaje: mapping.usaPorcentaje !== undefined ? row[mapping.usaPorcentaje]?.toLowerCase() === 'true' : true,
                    listaCodigo: mapping.listaCodigo !== undefined ? row[mapping.listaCodigo] : '',
                    detalleOtrosCostos: mapping.detalleOtrosCostos !== undefined ? row[mapping.detalleOtrosCostos] : '',
                    ecommerce: { isPublished: false },
                    isCombo: false, comboItems: []
                });
            }

            await productDB.saveBulk(chunkProducts);
            index = limit;
            setProgress(Math.round((index / fileRows.length) * 100));

            if (index < fileRows.length) {
                setTimeout(processChunk, 1);
            } else {
                setIsProcessing(false);
                setStep(3);
            }
        };

        processChunk();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 font-sans overflow-hidden">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex justify-between items-center shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><DatabaseZap size={32}/></div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Importador Maestro</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Carga optimizada para +140.000 artículos</p>
                    </div>
                </div>
                {step > 1 && (
                    <button onClick={() => setStep(1)} className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"><RefreshCw size={20}/></button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {step === 1 && (
                    <div className="h-full flex items-center justify-center animate-fade-in">
                        <div className="max-w-xl w-full bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm text-center space-y-10">
                            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><FileUp size={48}/></div>
                            <div className="group border-4 border-dashed border-slate-100 rounded-[3rem] p-16 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                                <FileSpreadsheet size={64} className="text-slate-200 mx-auto mb-4 group-hover:text-indigo-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Seleccionar CSV de Ferretería</span>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
                                <Info size={18} className="text-amber-600 shrink-0"/>
                                <p className="text-[10px] text-amber-700 font-bold uppercase text-left">El sistema mapeará automáticamente columnas como "CODIGO Propi", "Costo" y "Tasa".</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-10">
                        <div className="lg:col-span-5 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                            <h3 className="font-black text-slate-800 uppercase tracking-tight border-b pb-4 flex items-center gap-2"><Sparkles size={16} className="text-indigo-600"/> Mapeo Técnico</h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-3">
                                {productFields.map(field => (
                                    <div key={field.key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pr-4">{field.label} {field.required && '*'}</label>
                                        <select className="max-w-[180px] p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={mapping[field.key] ?? ""} onChange={e => setMapping({...mapping, [field.key]: e.target.value === "" ? undefined : parseInt(e.target.value)})}>
                                            <option value="">-- No Importar --</option>
                                            {headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <button onClick={processImport} disabled={isProcessing} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50">
                                {isProcessing ? <RefreshCw className="animate-spin"/> : <CheckCircle size={20}/>}
                                {isProcessing ? `Procesando ${progress}%` : 'Sincronizar Maestro'}
                            </button>
                        </div>

                        <div className="lg:col-span-7 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[680px]">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                                <h3 className="font-black text-sm uppercase tracking-widest">Vista Previa de Excel</h3>
                                <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase">{fileRows.length.toLocaleString()} Filas</span>
                            </div>
                            <div className="overflow-x-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b sticky top-0 z-10">
                                        <tr>
                                            {headers.map((h, i) => <th key={i} className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-r whitespace-nowrap">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {fileRows.slice(0, 50).map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                {row.map((cell, j) => <td key={j} className="px-6 py-3 text-[10px] font-medium text-slate-500 border-r truncate max-w-[200px]">{cell}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="h-full flex items-center justify-center animate-fade-in">
                        <div className="max-w-xl w-full bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm text-center space-y-8">
                            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><CheckCircle size={48}/></div>
                            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">¡Listo!</h3>
                            <p className="text-slate-500 font-medium px-10">Se han procesado {fileRows.length.toLocaleString()} artículos. Todas las bonificaciones y tasas han sido integradas.</p>
                            <button onClick={onComplete} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">Ver Maestro Actualizado <ArrowRight size={20}/></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialImport;
