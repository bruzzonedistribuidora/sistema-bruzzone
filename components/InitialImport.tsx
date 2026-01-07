
import React, { useState, useRef } from 'react';
import { 
    FileUp, FileSpreadsheet, CheckCircle, ArrowRight, 
    RefreshCw, DatabaseZap, Sparkles, Info, X, ChevronRight, Save
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

    const productFields = [
        { key: 'internalCodes', label: 'CODIGO Propi (SKU)', required: true },
        { key: 'name', label: 'Nombre Artículo', required: true },
        { key: 'listCost', label: 'Costo Lista (Bulto o Unidad)', required: true },
        { key: 'purchasePackageQuantity', label: 'Unidades por Bulto (Pack)', required: false },
        { key: 'brand', label: 'Marca', required: false },
        { key: 'category', label: 'Rubro/Categoría', required: false },
        { key: 'provider', label: 'Proveedor (Nombre)', required: false },
        { key: 'stock', label: 'Stock Actual (Unidades)', required: false },
        { key: 'barcodes', label: 'Código Barras (EAN)', required: false },
        { key: 'providerCodes', label: 'Cód. Proveedor Ref.', required: false },
        { key: 'otrosCodigos1', label: 'Código Adicional 1', required: false },
        { key: 'otrosCodigos2', label: 'Código Adicional 2', required: false },
        { key: 'otrosCodigos3', label: 'Código Adicional 3', required: false },
        { key: 'otrosCodigos4', label: 'Código Adicional 4', required: false },
        { key: 'profitMargin', label: 'Margen Ganancia %', required: false },
        { key: 'coeficienteBonificacionCosto', label: 'Coef. Bonificación', required: false },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length < 1) return;

            const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
            const parsedRows = lines.map(line => line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, '')));
            
            setHeaders(parsedRows[0]);
            setFileRows(parsedRows.slice(1));
            
            const autoMap: Record<string, number> = {};
            productFields.forEach(field => {
                const index = parsedRows[0].findIndex(h => 
                    h.toLowerCase().includes(field.label.toLowerCase()) || 
                    h.toLowerCase().includes(field.key.toLowerCase()) ||
                    (field.key === 'provider' && h.toLowerCase() === 'proveedor') ||
                    (field.key === 'purchasePackageQuantity' && (h.toLowerCase().includes('bulto') || h.toLowerCase().includes('pack')))
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
            alert("Mapeo incompleto de campos obligatorios.");
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
                
                // Cálculo de Fraccionamiento
                const packageQty = mapping.purchasePackageQuantity !== undefined ? (parseFloat(row[mapping.purchasePackageQuantity]?.replace(',', '.')) || 1) : 1;
                const rawCost = parseFloat(row[mapping.listCost]?.replace(',', '.') || '0');
                
                // El costo de lista final es el costo del bulto dividido las unidades
                const unitListCost = rawCost / (packageQty || 1);

                const rawMargin = mapping.profitMargin !== undefined ? parseFloat(row[mapping.profitMargin]?.replace(',', '.') || '30') : 30;
                const coefBonif = mapping.coeficienteBonificacionCosto !== undefined ? parseFloat(row[mapping.coeficienteBonificacionCosto]?.replace(',', '.') || '1') : 1;
                
                const costAfterDiscounts = unitListCost * coefBonif;
                const priceNeto = costAfterDiscounts * (1 + rawMargin / 100);

                chunkProducts.push({
                    id: `prod-${Date.now()}-${i}`,
                    internalCodes: [row[mapping.internalCodes] || 'S/C'],
                    barcodes: mapping.barcodes !== undefined ? [row[mapping.barcodes]] : [],
                    providerCodes: mapping.providerCodes !== undefined ? [row[mapping.providerCodes]] : [],
                    otrosCodigos1: mapping.otrosCodigos1 !== undefined ? row[mapping.otrosCodigos1] : '',
                    otrosCodigos2: mapping.otrosCodigos2 !== undefined ? row[mapping.otrosCodigos2] : '',
                    otrosCodigos3: mapping.otrosCodigos3 !== undefined ? row[mapping.otrosCodigos3] : '',
                    otrosCodigos4: mapping.otrosCodigos4 !== undefined ? row[mapping.otrosCodigos4] : '',
                    name: (row[mapping.name] || 'SIN NOMBRE').toUpperCase(),
                    brand: (mapping.brand !== undefined ? row[mapping.brand] : 'GENÉRICO').toUpperCase(),
                    category: (mapping.category !== undefined ? row[mapping.category] : 'GENERAL').toUpperCase(),
                    provider: (mapping.provider !== undefined ? row[mapping.provider] : 'PROVEEDOR').toUpperCase(),
                    description: '',
                    measureUnitPurchase: 'Unidad',
                    purchaseCurrency: 'ARS',
                    saleCurrency: 'ARS',
                    vatRate: 21,
                    listCost: unitListCost,
                    purchasePackageQuantity: packageQty,
                    coeficienteBonificacionCosto: coefBonif,
                    costAfterDiscounts: costAfterDiscounts,
                    profitMargin: rawMargin,
                    priceNeto: priceNeto,
                    priceFinal: priceNeto * 1.21,
                    stock: mapping.stock !== undefined ? (parseFloat(row[mapping.stock]?.replace(',', '.')) || 0) : 0,
                    reorderPoint: 0,
                    stockDetails: [],
                    location: '',
                    ecommerce: { isPublished: false },
                    isCombo: false, 
                    comboItems: [],
                    discounts: []
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
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Importador Masivo</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Sincronización de catálogo con soporte de fraccionamiento</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {step === 1 && (
                    <div className="h-full flex items-center justify-center animate-fade-in">
                        <div className="max-w-xl w-full bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm text-center space-y-10">
                            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><FileUp size={48}/></div>
                            <div className="group border-4 border-dashed border-slate-100 rounded-[3rem] p-16 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                                <FileSpreadsheet size={64} className="text-slate-200 mx-auto mb-4 group-hover:text-indigo-400" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Subir Archivo de Ferretería (CSV / TXT)</span>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-10">
                        <div className="lg:col-span-5 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                            <h3 className="font-black text-slate-800 uppercase tracking-tight border-b pb-4 flex items-center gap-2"><Sparkles size={16} className="text-indigo-600"/> Mapeo de Columnas</h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-3">
                                {productFields.map(field => (
                                    <div key={field.key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pr-4">{field.label} {field.required && '*'}</label>
                                        <select className="max-w-[180px] p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={mapping[field.key] ?? ""} onChange={e => setMapping({...mapping, [field.key]: e.target.value === "" ? undefined : parseInt(e.target.value)})}>
                                            <option value="">-- Ignorar --</option>
                                            {headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <button onClick={processImport} disabled={isProcessing} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50">
                                {isProcessing ? <RefreshCw className="animate-spin"/> : <CheckCircle size={20}/>}
                                {isProcessing ? `Procesando ${progress}%` : 'Iniciar Sincronización Masiva'}
                            </button>
                        </div>

                        <div className="lg:col-span-7 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[680px]">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                                <h3 className="font-black text-sm uppercase tracking-widest">Vista Previa ({fileRows.length.toLocaleString()} artículos)</h3>
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
                            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">¡Éxito!</h3>
                            <p className="text-slate-500 font-medium px-10">Se han integrado {fileRows.length.toLocaleString()} artículos al maestro local de forma óptima.</p>
                            <button onClick={onComplete} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">Ir al Catálogo Actualizado <ArrowRight size={20}/></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialImport;
