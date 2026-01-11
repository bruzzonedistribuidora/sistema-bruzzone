
import React, { useState, useRef } from 'react';
import { 
    FileUp, FileSpreadsheet, CheckCircle, ArrowRight, 
    RefreshCw, Boxes, Info, X, Settings2, Database,
    Search, AlertTriangle, Save, Table as TableIcon,
    Download
} from 'lucide-react';
import { Product } from '../types';
import { productDB } from '../services/storageService';

interface MassStockUpdateProps {
    onComplete: () => void;
}

const MassStockUpdate: React.FC<MassStockUpdateProps> = ({ onComplete }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fileRows, setFileRows] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, number>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ updated: 0, notFound: 0, total: 0 });
    const [updateMode, setUpdateMode] = useState<'OVERWRITE' | 'SUM'>('OVERWRITE');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const stockFields = [
        { key: 'identifier', label: 'Identificador (SKU / Barras / Nombre)', required: true },
        { key: 'stockPrincipal', label: 'Stock Local / Mostrador', required: false },
        { key: 'stockDeposito', label: 'Stock Depósito', required: false },
        { key: 'stockSucursal', label: 'Stock Sucursal', required: false },
    ];

    const parseNumber = (val: any, defaultValue: number): number => {
        if (val === undefined || val === null || val.toString().trim() === '') return defaultValue;
        const cleanVal = val.toString().replace(/[\s]/g, '').replace(',', '.');
        const parsed = parseFloat(cleanVal);
        return isNaN(parsed) ? defaultValue : parsed;
    };

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
            stockFields.forEach(field => {
                const index = parsedRows[0].findIndex(h => {
                    const header = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const target = field.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const key = field.key.toLowerCase();
                    return header === target || header.includes(target) || header.includes(key);
                });
                if (index !== -1) autoMap[field.key] = index;
            });
            setMapping(autoMap);
            setStep(2);
        };
        reader.readAsText(file);
    };

    const processStockUpdate = async () => {
        if (mapping.identifier === undefined) {
            alert("Debe seleccionar la columna del Identificador (SKU, Barras o Nombre).");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        
        const allProducts = await productDB.getAll();
        
        const skuMap = new Map<string, Product>();
        const barcodeMap = new Map<string, Product>();
        const nameMap = new Map<string, Product>();

        allProducts.forEach(p => {
            if (p.internalCodes && p.internalCodes[0]) skuMap.set(p.internalCodes[0].toUpperCase(), p);
            if (p.barcodes) p.barcodes.forEach(b => barcodeMap.set(b.toUpperCase(), p));
            if (p.name) nameMap.set(p.name.toUpperCase(), p);
        });

        const CHUNK_SIZE = 5000;
        let index = 0;
        let updatedCount = 0;
        let notFoundCount = 0;

        const processChunk = async () => {
            const limit = Math.min(index + CHUNK_SIZE, fileRows.length);
            const chunkToUpdate: Product[] = [];

            for (let i = index; i < limit; i++) {
                const row = fileRows[i];
                const idValue = row[mapping.identifier]?.toString().toUpperCase();
                if (!idValue) continue;

                let product = skuMap.get(idValue) || barcodeMap.get(idValue) || nameMap.get(idValue);

                if (product) {
                    const updatedProduct = { ...product };
                    
                    const excelLocal = mapping.stockPrincipal !== undefined ? parseNumber(row[mapping.stockPrincipal], -1) : -1;
                    const excelDepo = mapping.stockDeposito !== undefined ? parseNumber(row[mapping.stockDeposito], -1) : -1;
                    const excelSuc = mapping.stockSucursal !== undefined ? parseNumber(row[mapping.stockSucursal], -1) : -1;

                    if (excelLocal !== -1) {
                        updatedProduct.stockPrincipal = updateMode === 'OVERWRITE' ? excelLocal : (updatedProduct.stockPrincipal || 0) + excelLocal;
                    }
                    if (excelDepo !== -1) {
                        updatedProduct.stockDeposito = updateMode === 'OVERWRITE' ? excelDepo : (updatedProduct.stockDeposito || 0) + excelDepo;
                    }
                    if (excelSuc !== -1) {
                        updatedProduct.stockSucursal = updateMode === 'OVERWRITE' ? excelSuc : (updatedProduct.stockSucursal || 0) + excelSuc;
                    }

                    updatedProduct.stock = (updatedProduct.stockPrincipal || 0) + (updatedProduct.stockDeposito || 0) + (updatedProduct.stockSucursal || 0);
                    
                    chunkToUpdate.push(updatedProduct);
                    updatedCount++;
                } else {
                    notFoundCount++;
                }
            }

            if (chunkToUpdate.length > 0) {
                await productDB.saveBulk(chunkToUpdate);
            }

            index = limit;
            setProgress(Math.round((index / fileRows.length) * 100));

            if (index < fileRows.length) {
                setTimeout(processChunk, 1);
            } else {
                setStats({ updated: updatedCount, notFound: notFoundCount, total: fileRows.length });
                setIsProcessing(false);
                setStep(3);
            }
        };

        processChunk();
    };

    const downloadTemplate = () => {
        const headersStr = "Identificador;Stock Local;Stock Deposito;Stock Sucursal\n";
        const rowsStr = "SKU-001;10;50;0\n7791234567890;5;20;2\nARTICULO EJEMPLO;0;10;0";
        const blob = new Blob([headersStr + rowsStr], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_stock.csv';
        a.click();
    };

    return (
        <div className="p-4 h-full flex flex-col space-y-4 bg-slate-100 font-sans overflow-hidden">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 shrink-0">
                <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl"><Boxes size={32}/></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Actualizador de Stock Masivo</h2>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Corrección de Existencias (CSV / EXCEL)</p>
                </div>
                {step === 2 && (
                    <div className="ml-auto flex items-center gap-4">
                        <div className="flex bg-slate-100 p-1 rounded-xl border">
                            <button 
                                onClick={() => setUpdateMode('OVERWRITE')}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${updateMode === 'OVERWRITE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                                Reemplazar
                            </button>
                            <button 
                                onClick={() => setUpdateMode('SUM')}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${updateMode === 'SUM' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                                Sumar
                            </button>
                        </div>
                        <button onClick={processStockUpdate} disabled={isProcessing} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50">
                             {isProcessing ? <RefreshCw className="animate-spin" size={14}/> : <CheckCircle size={14}/>} {isProcessing ? `Procesando ${progress}%` : 'Ejecutar Cambios'}
                        </button>
                    </div>
                )}
                {step === 1 && (
                    <button onClick={downloadTemplate} className="ml-auto text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
                        <Download size={14}/> Descargar Plantilla
                    </button>
                )}
            </div>

            {step === 1 && (
                <div className="flex-1 flex items-center justify-center animate-fade-in">
                    <div className="max-w-xl w-full bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm text-center space-y-8">
                        <FileSpreadsheet size={64} className="text-slate-100 mx-auto" />
                        <div className="space-y-2">
                            <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">Sincronizar Stock</h3>
                            <p className="text-xs text-slate-400 font-medium">Sube tu archivo para actualizar existencias masivamente</p>
                        </div>
                        
                        <div className="group border-4 border-dashed border-slate-100 rounded-[3rem] p-16 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                            <FileUp size={48} className="text-slate-200 mx-auto mb-4 group-hover:text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600">Click para seleccionar archivo</span>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden animate-fade-in">
                    <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="flex items-center gap-3 mb-6 border-b pb-4 shrink-0">
                            <Settings2 size={18} className="text-emerald-600"/>
                            <h3 className="text-xs font-black uppercase tracking-widest">Asignar Columnas</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-3">
                            {stockFields.map(field => (
                                <div key={field.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2 group hover:bg-white transition-all">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${field.required ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                                    </div>
                                    <select 
                                        className="w-full p-3 bg-white border rounded-xl text-[10px] font-bold outline-none focus:border-emerald-600 shadow-sm"
                                        value={mapping[field.key] ?? ""}
                                        onChange={e => setMapping({...mapping, [field.key]: e.target.value === "" ? undefined : parseInt(e.target.value)})}
                                    >
                                        <option value="">-- No incluir --</option>
                                        {headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><TableIcon size={14}/> Previsualización ({fileRows.length.toLocaleString()} filas)</h3>
                            <span className="text-[10px] font-black text-emerald-400">Listo</span>
                        </div>
                        <div className="overflow-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 z-10 border-b">
                                    <tr>
                                        {headers.map((h, i) => (
                                            <th key={i} className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest border-r whitespace-nowrap ${Object.values(mapping).includes(i) ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}>
                                                {h || `Col ${i+1}`}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fileRows.slice(0, 100).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            {row.map((cell, j) => <td key={j} className={`px-4 py-2 text-[10px] font-medium border-r truncate max-w-[200px] ${Object.values(mapping).includes(j) ? 'bg-emerald-50/30 text-emerald-700 font-bold' : 'text-slate-500'}`}>{cell}</td>)}
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
                    <div className="max-w-2xl w-full bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm text-center space-y-10">
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><CheckCircle size={48}/></div>
                        <div className="space-y-2">
                            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Stock Sincronizado</h3>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Resumen del proceso</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Sincronizados</p>
                                <p className="text-5xl font-black text-emerald-600 tracking-tighter">{stats.updated.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">No Encontrados</p>
                                <p className="text-5xl font-black text-red-400 tracking-tighter">{stats.notFound.toLocaleString()}</p>
                            </div>
                        </div>

                        <button onClick={onComplete} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                            Ir al Inventario Maestro <ArrowRight size={20}/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MassStockUpdate;
