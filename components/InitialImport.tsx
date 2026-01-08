
import React, { useState, useRef, useMemo } from 'react';
import { 
    FileUp, FileSpreadsheet, CheckCircle, ArrowRight, 
    RefreshCw, DatabaseZap, Sparkles, Info, X, ChevronRight, Save,
    Link, Settings2, Boxes, Ruler, Percent, DollarSign
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
    const [matchKey, setMatchKey] = useState<string>('internalCodes'); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ created: 0, updated: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const productFields = [
        { key: 'internalCodes', label: 'CODIGO Propio (SKU)', required: true },
        { key: 'name', label: 'Nombre Artículo', required: true },
        { key: 'listCost', label: 'Costo Lista (Bulto o Unidad)', required: true },
        { key: 'purchasePackageQuantity', label: 'Unidades por Bulto (Pack)', required: false },
        { key: 'purchaseCurrency', label: 'Moneda Compra (ARS/USD)', required: false },
        { key: 'saleCurrency', label: 'Moneda Venta (ARS/USD)', required: false },
        { key: 'disc1', label: 'Bonificación 1 (%)', required: false },
        { key: 'disc2', label: 'Bonificación 2 (%)', required: false },
        { key: 'disc3', label: 'Bonificación 3 (%)', required: false },
        { key: 'coeficienteBonificacionCosto', label: 'Coef. Bonif. Directo', required: false },
        { key: 'profitMargin', label: 'Margen Ganancia %', required: false },
        { key: 'vatRate', label: 'Alícuota IVA %', required: false },
        { key: 'stockPrincipal', label: 'Stock en Mostrador (Principal)', required: false },
        { key: 'stockDeposito', label: 'Stock en Depósito', required: false },
        { key: 'stockSucursal', label: 'Stock en Sucursal', required: false },
        { key: 'stockMaximo', label: 'Stock Deseado (Máximo)', required: false },
        { key: 'reorderPoint', label: 'Punto de Pedido', required: false },
        { key: 'brand', label: 'Marca', required: false },
        { key: 'category', label: 'Rubro/Categoría', required: false },
        { key: 'provider', label: 'Proveedor (Nombre)', required: false },
        { key: 'barcodes', label: 'Código de Barras (EAN)', required: false },
        { key: 'providerCodes', label: 'Cód. Proveedor Ref.', required: false },
    ];

    const matchKeyOptions = [
        { value: 'internalCodes', label: 'Código Propio (SKU)' },
        { value: 'barcodes', label: 'Código de Barras (EAN)' },
        { value: 'providerCodes', label: 'Código de Proveedor' },
    ];

    const parseNumber = (val: any, defaultValue: number): number => {
        if (val === undefined || val === null || val.toString().trim() === '') return defaultValue;
        const cleanVal = val.toString().replace(/[%\$\s]/g, '').replace(',', '.');
        const parsed = parseFloat(cleanVal);
        return isNaN(parsed) ? defaultValue : parsed;
    };

    const parseCurrency = (val: string | undefined, defaultValue: string): string => {
        if (!val) return defaultValue;
        const v = val.toUpperCase().trim();
        if (v.includes('USD') || v.includes('DOLAR') || v.includes('U$S')) return 'USD';
        if (v.includes('ARS') || v.includes('ARG') || v.includes('PESO') || v === '$') return 'ARS';
        return defaultValue;
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
            productFields.forEach(field => {
                const index = parsedRows[0].findIndex(h => {
                    const header = h.toLowerCase();
                    return header === field.label.toLowerCase() ||
                           header === field.key.toLowerCase() ||
                           header.includes(field.label.toLowerCase()) ||
                           (field.key === 'purchaseCurrency' && (header.includes('moneda c') || header.includes('divisa c'))) ||
                           (field.key === 'vatRate' && (header === 'iva' || header === 'tasa iva' || header === 'alicuota')) ||
                           (field.key === 'disc1' && (header.includes('bonif 1') || header.includes('desc 1'))) ||
                           (field.key === 'disc2' && (header.includes('bonif 2') || header.includes('desc 2'))) ||
                           (field.key === 'disc3' && (header.includes('bonif 3') || header.includes('desc 3'))) ||
                           (field.key === 'stockPrincipal' && (header.includes('stock p') || header.includes('stock most'))) ||
                           (field.key === 'stockDeposito' && (header.includes('stock d') || header.includes('stock dep'))) ||
                           (field.key === 'stockSucursal' && (header.includes('stock s') || header.includes('stock suc')))
                });
                if (index !== -1) autoMap[field.key] = index;
            });
            setMapping(autoMap);
            setStep(2);
        };
        reader.readAsText(file);
    };

    const processImport = async () => {
        if (mapping.internalCodes === undefined || mapping.name === undefined || mapping.listCost === undefined) {
            alert("Mapeo incompleto: SKU, Nombre y Costo son obligatorios.");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        
        const currentProducts = await productDB.getAll();
        const productMap = new Map<string, Product>();
        
        currentProducts.forEach(p => {
            let keyVal = '';
            if (matchKey === 'internalCodes') keyVal = p.internalCodes[0];
            else if (matchKey === 'barcodes') keyVal = p.barcodes[0];
            else if (matchKey === 'providerCodes') keyVal = p.providerCodes[0];
            
            if (keyVal) productMap.set(keyVal.toString().toUpperCase(), p);
        });

        const CHUNK_SIZE = 5000;
        let index = 0;
        let createdCount = 0;
        let updatedCount = 0;

        const processChunk = async () => {
            const limit = Math.min(index + CHUNK_SIZE, fileRows.length);
            const chunkProducts: Product[] = [];

            for (let i = index; i < limit; i++) {
                const row = fileRows[i];
                const keyInFile = row[mapping[matchKey]]?.toString().toUpperCase();
                const existingProduct = keyInFile ? productMap.get(keyInFile) : null;

                const packageQty = mapping.purchasePackageQuantity !== undefined 
                    ? parseNumber(row[mapping.purchasePackageQuantity], 1) 
                    : 1;
                
                const rawCost = parseNumber(row[mapping.listCost], 0);
                const unitListCost = rawCost / (packageQty || 1);

                const purchaseCurrency = mapping.purchaseCurrency !== undefined
                    ? parseCurrency(row[mapping.purchaseCurrency], 'ARS')
                    : (existingProduct?.purchaseCurrency || 'ARS');

                const saleCurrency = mapping.saleCurrency !== undefined
                    ? parseCurrency(row[mapping.saleCurrency], 'ARS')
                    : (existingProduct?.saleCurrency || 'ARS');

                // Lógica de 3 descuentos
                const d1 = mapping.disc1 !== undefined ? parseNumber(row[mapping.disc1], 0) : 0;
                const d2 = mapping.disc2 !== undefined ? parseNumber(row[mapping.disc2], 0) : 0;
                const d3 = mapping.disc3 !== undefined ? parseNumber(row[mapping.disc3], 0) : 0;

                let coefBonif = (1 - d1/100) * (1 - d2/100) * (1 - d3/100);
                
                // Si no se mapearon descuentos pero sí un coeficiente directo
                if (mapping.disc1 === undefined && mapping.disc2 === undefined && mapping.disc3 === undefined && mapping.coeficienteBonificacionCosto !== undefined) {
                    coefBonif = parseNumber(row[mapping.coeficienteBonificacionCosto], 1);
                }
                
                const rawMargin = mapping.profitMargin !== undefined 
                    ? parseNumber(row[mapping.profitMargin], 30) 
                    : (existingProduct?.profitMargin ?? 30);
                
                const vatRate = mapping.vatRate !== undefined 
                    ? parseNumber(row[mapping.vatRate], 21) 
                    : (existingProduct?.vatRate ?? 21);
                
                const costAfterDiscounts = unitListCost * coefBonif;
                const priceNeto = costAfterDiscounts * (1 + rawMargin / 100);

                // Stocks desglosados
                const sP = mapping.stockPrincipal !== undefined ? parseNumber(row[mapping.stockPrincipal], 0) : (existingProduct?.stockPrincipal || 0);
                const sD = mapping.stockDeposito !== undefined ? parseNumber(row[mapping.stockDeposito], 0) : (existingProduct?.stockDeposito || 0);
                const sS = mapping.stockSucursal !== undefined ? parseNumber(row[mapping.stockSucursal], 0) : (existingProduct?.stockSucursal || 0);

                const productData: Product = {
                    id: existingProduct?.id || `prod-${Date.now()}-${i}`,
                    internalCodes: mapping.internalCodes !== undefined ? [row[mapping.internalCodes] || 'S/C'] : (existingProduct?.internalCodes || ['S/C']),
                    barcodes: mapping.barcodes !== undefined ? [row[mapping.barcodes]] : (existingProduct?.barcodes || []),
                    providerCodes: mapping.providerCodes !== undefined ? [row[mapping.providerCodes]] : (existingProduct?.providerCodes || []),
                    name: (row[mapping.name] || existingProduct?.name || 'SIN NOMBRE').toUpperCase(),
                    brand: (mapping.brand !== undefined ? row[mapping.brand] : (existingProduct?.brand || 'GENÉRICO')).toUpperCase(),
                    category: (mapping.category !== undefined ? row[mapping.category] : (existingProduct?.category || 'GENERAL')).toUpperCase(),
                    provider: (mapping.provider !== undefined ? row[mapping.provider] : (existingProduct?.provider || 'PROVEEDOR')).toUpperCase(),
                    description: existingProduct?.description || '',
                    measureUnitPurchase: existingProduct?.measureUnitPurchase || 'Unidad',
                    purchaseCurrency: purchaseCurrency,
                    saleCurrency: saleCurrency,
                    vatRate: vatRate,
                    listCost: unitListCost,
                    purchasePackageQuantity: packageQty,
                    coeficienteBonificacionCosto: parseFloat(coefBonif.toFixed(5)),
                    costAfterDiscounts: parseFloat(costAfterDiscounts.toFixed(2)),
                    profitMargin: rawMargin,
                    priceNeto: parseFloat(priceNeto.toFixed(2)),
                    priceFinal: parseFloat((priceNeto * (1 + vatRate/100)).toFixed(2)),
                    stockPrincipal: sP,
                    stockDeposito: sD,
                    stockSucursal: sS,
                    stock: sP + sD + sS,
                    stockMaximo: mapping.stockMaximo !== undefined ? parseNumber(row[mapping.stockMaximo], 0) : (existingProduct?.stockMaximo || 0),
                    reorderPoint: mapping.reorderPoint !== undefined ? parseNumber(row[mapping.reorderPoint], 0) : (existingProduct?.reorderPoint || 0),
                    stockDetails: existingProduct?.stockDetails || [],
                    location: existingProduct?.location || '',
                    ecommerce: existingProduct?.ecommerce || { isPublished: false },
                    isCombo: existingProduct?.isCombo || false, 
                    comboItems: existingProduct?.comboItems || [],
                    discounts: [d1, d2, d3, 0]
                };

                if (existingProduct) updatedCount++;
                else createdCount++;

                chunkProducts.push(productData);
            }

            await productDB.saveBulk(chunkProducts);
            index = limit;
            setProgress(Math.round((index / fileRows.length) * 100));

            if (index < fileRows.length) {
                setTimeout(processChunk, 1);
            } else {
                setStats({ created: createdCount, updated: updatedCount });
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
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Sincronizador Maestro</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestión de Catálogo Inteligente (+140.000 artículos)</p>
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
                        <div className="lg:col-span-5 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                            <div className="space-y-4">
                                <h3 className="font-black text-slate-800 uppercase tracking-tight border-b pb-4 flex items-center gap-2"><Link size={16} className="text-indigo-600"/> Criterio de Sincronización</h3>
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Clave Única de Vinculación</label>
                                    <select 
                                        className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={matchKey}
                                        onChange={e => setMatchKey(e.target.value)}
                                    >
                                        {matchKeyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-black text-slate-800 uppercase tracking-tight border-b pb-4 flex items-center gap-2"><Sparkles size={16} className="text-indigo-600"/> Mapeo de Atributos</h3>
                                <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar pr-3">
                                    {productFields.map(field => (
                                        <div key={field.key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group">
                                            <div className="flex items-center gap-2">
                                                {field.key.startsWith('disc') ? <Percent size={12} className="text-orange-400"/> : null}
                                                {field.key.includes('Currency') ? <DollarSign size={12} className="text-green-500"/> : null}
                                                {field.key === 'vatRate' ? <div className="w-3 h-3 bg-blue-500 rounded-full"/> : null}
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{field.label} {field.required && '*'}</label>
                                            </div>
                                            <select className="max-w-[160px] p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={mapping[field.key] ?? ""} onChange={e => setMapping({...mapping, [field.key]: e.target.value === "" ? undefined : parseInt(e.target.value)})}>
                                                <option value="">-- Ignorar --</option>
                                                {headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <button onClick={processImport} disabled={isProcessing} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50">
                                {isProcessing ? <RefreshCw className="animate-spin"/> : <CheckCircle size={20}/>}
                                {isProcessing ? `Sincronizando ${progress}%` : 'Ejecutar Sincronización Inteligente'}
                            </button>
                        </div>

                        <div className="lg:col-span-7 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                                <h3 className="font-black text-sm uppercase tracking-widest">Vista Previa de Archivo ({fileRows.length.toLocaleString()} filas)</h3>
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
                        <div className="max-w-2xl w-full bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm text-center space-y-8">
                            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><CheckCircle size={48}/></div>
                            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Proceso Finalizado</h3>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Artículos Nuevos</p>
                                    <p className="text-5xl font-black text-indigo-600 tracking-tighter">{stats.created.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Artículos Actualizados</p>
                                    <p className="text-5xl font-black text-green-600 tracking-tighter">{stats.updated.toLocaleString()}</p>
                                </div>
                            </div>

                            <p className="text-slate-500 font-medium px-10 italic">Se han procesado un total de {(stats.created + stats.updated).toLocaleString()} registros de forma exitosa.</p>
                            
                            <button onClick={onComplete} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">Ir al Catálogo Actualizado <ArrowRight size={20}/></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialImport;
