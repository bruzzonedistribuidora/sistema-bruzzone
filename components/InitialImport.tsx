
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

    // Mapeo exhaustivo según imagen proporcionada
    const productFields = [
        { key: 'internalCodes', label: 'CÓDIGO Propi (Interno)', required: true },
        { key: 'name', label: 'Nombre (Descripción)', required: true },
        { key: 'listCost', label: 'Costo (Precio de Lista)', required: true },
        { key: 'brand', label: 'Marca', required: false },
        { key: 'category', label: 'Rubro / Categoría', required: false },
        { key: 'stock', label: 'Stock Actual', required: false },
        { key: 'barcodes', label: 'Código de Barras', required: false },
        { key: 'providerCodes', label: 'Cod PROV (Proveedor)', required: false },
        { key: 'provider', label: 'Proveedor', required: false },
        { key: 'profitMargin', label: 'Ganancia (%)', required: false },
        { key: 'coeficienteBonificacionCosto', label: 'Coeficiente Bonif. Costo', required: false },
        { key: 'porcentajesBonificacion', label: 'Porcentajes Bonificación', required: false },
        { key: 'stockMinimo', label: 'Stock Mínimo', required: false },
        { key: 'stockMaximo', label: 'Stock Máximo', required: false },
        { key: 'reorderPoint', label: 'Punto pedido', required: false },
        { key: 'monedaCompra', label: 'Moneda Compra', required: false },
        { key: 'monedaVenta', label: 'Moneda Venta', required: false },
        { key: 'tasa', label: 'Tasa / Impuesto', required: false },
        { key: 'otrosCodigos1', label: 'Otros Códigos 1', required: false },
        { key: 'otrosCodigos2', label: 'Otros Códigos 2', required: false },
        { key: 'otrosCodigos3', label: 'Otros Códigos 3', required: false },
        { key: 'alicuotaImpuestoInterno', label: 'Alícuota Imp. Interno', required: false },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length < 2) { alert("El archivo no tiene suficientes filas."); return; }

            const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
            const parsedRows = lines.map(line => line.split(separator).map(cell => cell.trim()));
            
            setHeaders(parsedRows[0]);
            setFileRows(parsedRows.slice(1));
            setStep(2);
        };
        reader.readAsText(file);
    };

    const processImport = async () => {
        if (mapping.internalCodes === undefined || mapping.name === undefined || mapping.listCost === undefined) {
            alert("Mapeo incompleto de campos obligatorios (Código, Nombre, Costo).");
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
                    measureUnitSale: 'Unidad',
                    measureUnitPurchase: (mapping.monedaCompra !== undefined ? row[mapping.monedaCompra] : 'Unidad').toUpperCase(),
                    conversionFactor: 1,
                    purchaseCurrency: (mapping.monedaCompra !== undefined ? row[mapping.monedaCompra] : 'ARS').toUpperCase(),
                    saleCurrency: (mapping.monedaVenta !== undefined ? row[mapping.monedaVenta] : 'ARS').toUpperCase(),
                    vatRate: 21,
                    listCost: rawCost,
                    coeficienteBonificacionCosto: coefBonif,
                    discounts: [],
                    costAfterDiscounts: costAfterDiscounts,
                    profitMargin: rawMargin,
                    priceNeto: priceNeto,
                    priceFinal: priceNeto * 1.21,
                    stock: mapping.stock !== undefined ? (parseFloat(row[mapping.stock]) || 0) : 0,
                    stockMinimo: mapping.stockMinimo !== undefined ? parseFloat(row[mapping.stockMinimo]) : 0,
                    stockMaximo: mapping.stockMaximo !== undefined ? parseFloat(row[mapping.stockMaximo]) : 0,
                    reorderPoint: mapping.reorderPoint !== undefined ? parseFloat(row[mapping.reorderPoint]) : 0,
                    stockDetails: [],
                    location: '',
                    tasa: mapping.tasa !== undefined ? parseFloat(row[mapping.tasa]) : 0,
                    alicuotaImpuestoInterno: mapping.alicuotaImpuestoInterno !== undefined ? parseFloat(row[mapping.alicuotaImpuestoInterno]) : 0,
                    ecommerce: { isPublished: false },
                    isCombo: false, comboItems: []
                });
            }

            await productDB.saveBulk(chunkProducts);
            index = limit;
            setProgress(Math.round((index / fileRows.length) * 100));

            if (index < fileRows.length) {
                setTimeout(processChunk, 10);
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
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Importador de Alta Capacidad</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Carga masiva adaptada a Ficheros de Ferretería</p>
                    </div>
                </div>
                {step > 1 && (
                    <button onClick={() => setStep(1)} className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"><RefreshCw size={20}/></button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {step === 1 && (
                    <div className="h-full flex items-center justify-center animate-fade-in">
                        <div className="max-w-xl w-full bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm text-center space-y-10">
                            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><FileUp size={48}/></div>
                            <div className="group border-4 border-dashed border-slate-100 rounded-[3rem] p-16 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                                <FileSpreadsheet size={64} className="text-slate-200 mx-auto mb-4 group-hover:text-indigo-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Subir Listado de Artículos</span>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-10">
                        <div className="lg:col-span-5 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                            <h3 className="font-black text-slate-800 uppercase tracking-tight border-b pb-4 flex items-center gap-2"><Sparkles size={16} className="text-indigo-600"/> Mapeo de Columnas</h3>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {productFields.map(field => (
                                    <div key={field.key} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pr-4">{field.label} {field.required && '*'}</label>
                                        <select className="flex-1 max-w-[200px] p-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-600" value={mapping[field.key] ?? ""} onChange={e => setMapping({...mapping, [field.key]: e.target.value === "" ? undefined : parseInt(e.target.value)})}>
                                            <option value="">-- No Importar --</option>
                                            {headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <button onClick={processImport} disabled={isProcessing} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95">
                                {isProcessing ? <RefreshCw className="animate-spin"/> : <CheckCircle size={20}/>}
                                {isProcessing ? `Procesando ${progress}%` : 'Sincronizar Catálogo'}
                            </button>
                        </div>

                        <div className="lg:col-span-7 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                                <h3 className="font-black text-sm uppercase tracking-widest">Previsualización del Archivo</h3>
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
                                        {fileRows.slice(0, 30).map((row, i) => (
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
                            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">¡Importación Exitosa!</h3>
                            <p className="text-slate-500 font-medium px-10">Se han integrado {fileRows.length.toLocaleString()} artículos con éxito. El sistema ya puede leer y procesar todos los códigos y bonificaciones.</p>
                            <button onClick={onComplete} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">Ver Maestro de Artículos <ArrowRight size={20}/></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialImport;
