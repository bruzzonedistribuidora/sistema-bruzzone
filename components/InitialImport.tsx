
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

    const productFields = [
        { key: 'internalCodes', label: 'Código SKU / Interno', required: true },
        { key: 'name', label: 'Descripción Comercial', required: true },
        { key: 'listCost', label: 'Costo Bruto (Lista)', required: true },
        { key: 'brand', label: 'Marca', required: false },
        { key: 'category', label: 'Categoría', required: false },
        { key: 'stock', label: 'Stock Inicial', required: false },
        { key: 'barcodes', label: 'Código Barras (EAN)', required: false },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length < 2) { alert("Archivo inválido."); return; }

            const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
            const parsedRows = lines.map(line => line.split(separator).map(cell => cell.trim()));
            
            setHeaders(parsedRows[0]);
            setFileRows(parsedRows.slice(1));
            setStep(2);
        };
        reader.readAsText(file);
    };

    const processImport = async () => {
        if (!mapping.internalCodes || !mapping.name || !mapping.listCost) {
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
                const cost = parseFloat(row[mapping.listCost]?.replace(',', '.') || '0');
                const priceNeto = cost * 1.30; 

                chunkProducts.push({
                    id: `prod-${Date.now()}-${i}`,
                    internalCodes: [row[mapping.internalCodes] || 'S/C'],
                    barcodes: mapping.barcodes !== undefined ? [row[mapping.barcodes]] : [],
                    providerCodes: [],
                    name: (row[mapping.name] || 'SIN NOMBRE').toUpperCase(),
                    brand: (mapping.brand !== undefined ? row[mapping.brand] : 'GENÉRICO').toUpperCase(),
                    category: (mapping.category !== undefined ? row[mapping.category] : 'GENERAL').toUpperCase(),
                    provider: 'IMPORTACIÓN MASIVA',
                    description: '',
                    measureUnitSale: 'Unidad',
                    measureUnitPurchase: 'Unidad',
                    conversionFactor: 1,
                    purchaseCurrency: 'ARS',
                    saleCurrency: 'ARS',
                    vatRate: 21,
                    listCost: cost,
                    discounts: [0, 0, 0, 0],
                    costAfterDiscounts: cost,
                    profitMargin: 30,
                    priceNeto: priceNeto,
                    priceFinal: priceNeto * 1.21,
                    stock: mapping.stock !== undefined ? (parseFloat(row[mapping.stock]) || 0) : 0,
                    stockDetails: [],
                    minStock: 5, desiredStock: 10, reorderPoint: 3, location: '',
                    ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false },
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
        <div className="p-8 max-w-6xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 font-sans">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex justify-between items-center shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><DatabaseZap size={32}/></div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Motor de Ingesta Masiva</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Carga acelerada de catálogo de alta densidad</p>
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
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Subir listado (CSV/TXT)</span>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                        <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                            <h3 className="font-black text-slate-800 uppercase tracking-tight border-b pb-4 flex items-center gap-2"><Sparkles size={16} className="text-indigo-600"/> Mapeo de Atributos</h3>
                            <div className="space-y-4">
                                {productFields.map(field => (
                                    <div key={field.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">{field.label} {field.required && '*'}</label>
                                        <select className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-600" value={mapping[field.key] ?? ""} onChange={e => setMapping({...mapping, [field.key]: parseInt(e.target.value)})}>
                                            <option value="">-- Ignorar --</option>
                                            {headers.map((h, i) => <option key={i} value={i}>{h || `Col ${i + 1}`}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <button onClick={processImport} disabled={isProcessing} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3">
                                {isProcessing ? <RefreshCw className="animate-spin"/> : <Save size={20}/>}
                                {isProcessing ? `Procesando ${progress}%` : 'Iniciar Carga Masiva'}
                            </button>
                        </div>

                        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                                <h3 className="font-black text-sm uppercase tracking-widest">Vista Previa de Origen</h3>
                                <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase">{fileRows.length.toLocaleString()} Filas</span>
                            </div>
                            <div className="overflow-x-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            {headers.map((h, i) => <th key={i} className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-r">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {fileRows.slice(0, 15).map((row, i) => (
                                            <tr key={i}>
                                                {row.map((cell, j) => <td key={j} className="px-6 py-4 text-[10px] font-medium text-slate-500 border-r truncate max-w-[150px]">{cell}</td>)}
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
                            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">¡Éxito Absoluto!</h3>
                            <p className="text-slate-500 font-medium px-10">Se han integrado {fileRows.length.toLocaleString()} artículos al sistema Cloud de Ferretería Bruzzone.</p>
                            <button onClick={onComplete} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">Ir al Catálogo Maestro <ArrowRight size={20}/></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialImport;
