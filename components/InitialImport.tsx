
import React, { useState, useRef, useMemo } from 'react';
import { 
    FileUp, FileSpreadsheet, CheckCircle, ArrowRight, 
    RefreshCw, DatabaseZap, Sparkles, Info, X, ChevronRight, Save,
    Link, Settings2, Boxes, Ruler, Percent, DollarSign, Tag, Hash
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
    const [stats, setStats] = useState({ created: 0, updated: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const productFields = [
        { key: 'internalCodes', label: 'CODIGO Propio (SKU)', required: false },
        { key: 'barcodes', label: 'Código de Barras (EAN)', required: false },
        { key: 'providerCodes', label: 'Código PROVEEDOR', required: false },
        { key: 'name', label: 'Nombre / Descripción', required: true },
        { key: 'listCost', label: 'COSTOS LISTA', required: true },
        { key: 'purchaseCurrency', label: 'Moneda Compra (ARS/USD)', required: false },
        { key: 'purchasePackageQuantity', label: 'Cant. por Bulto', required: false },
        { key: 'measureUnitSale', label: 'U. de Venta', required: false },
        { key: 'conversionFactor', label: 'Factor Venta (Multiplicador)', required: false },
        { key: 'brand', label: 'Marca', required: false },
        { key: 'category', label: 'Rubro / Categoría', required: false },
        { key: 'provider', label: 'Proveedor', required: false },
        { key: 'stock', label: 'Stock Total', required: false },
        { key: 'stockPrincipal', label: 'Stock Local / Mostrador', required: false },
        { key: 'stockDeposito', label: 'Stock Depósito', required: false },
        { key: 'stockMinimo', label: 'Stock Mínimo (Alerta)', required: false },
        { key: 'reorderPoint', label: 'Punto de Pedido (Crítico)', required: false },
        { key: 'profitMargin', label: 'Porcentaje Ganancia (%)', required: false },
        { key: 'vatRate', label: 'Tasa (IVA %)', required: false },
        { key: 'disc1', label: 'Descuento 1 (%)', required: false },
        { key: 'disc2', label: 'Descuento 2 (%)', required: false },
        { key: 'disc3', label: 'Descuento 3 (%)', required: false },
    ];

    const parseNumber = (val: any, defaultValue: number): number => {
        if (val === undefined || val === null || val.toString().trim() === '') return defaultValue;
        const cleanVal = val.toString().replace(/[%\$\s]/g, '').replace(',', '.');
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
            productFields.forEach(field => {
                const index = parsedRows[0].findIndex(h => {
                    const header = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const target = field.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const key = field.key.toLowerCase();
                    return header === target || header.includes(target) || header === key;
                });
                if (index !== -1) autoMap[field.key] = index;
            });
            setMapping(autoMap);
            setStep(2);
        };
        reader.readAsText(file);
    };

    const processImport = async () => {
        if (mapping.name === undefined || mapping.listCost === undefined) {
            alert("Mapeo insuficiente: Nombre y Costo son obligatorios.");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        
        const currentProducts = await productDB.getAll();
        const productMap = new Map<string, Product>();
        currentProducts.forEach(p => productMap.set(p.internalCodes[0]?.toString().toUpperCase(), p));

        const CHUNK_SIZE = 5000;
        let index = 0;
        let createdCount = 0;
        let updatedCount = 0;

        const processChunk = async () => {
            const limit = Math.min(index + CHUNK_SIZE, fileRows.length);
            const chunkProducts: Product[] = [];

            for (let i = index; i < limit; i++) {
                const row = fileRows[i];
                let sku = row[mapping.internalCodes]?.toString().toUpperCase();
                const barcode = row[mapping.barcodes]?.toString();
                const providerCode = row[mapping.providerCodes]?.toString();
                
                if (!sku && barcode) sku = barcode;
                if (!sku && providerCode) sku = providerCode;
                if (!sku) continue;

                const existingProduct = productMap.get(sku);
                
                // Procesamiento de Precios y Descuentos
                const listCost = parseNumber(row[mapping.listCost], 0);
                const d1 = mapping.disc1 !== undefined ? parseNumber(row[mapping.disc1], 0) : 0;
                const d2 = mapping.disc2 !== undefined ? parseNumber(row[mapping.disc2], 0) : 0;
                const d3 = mapping.disc3 !== undefined ? parseNumber(row[mapping.disc3], 0) : 0;
                
                const factor = mapping.conversionFactor !== undefined ? parseNumber(row[mapping.conversionFactor], 1) : 1;
                const margin = mapping.profitMargin !== undefined ? parseNumber(row[mapping.profitMargin], 30) : 30;
                const vat = mapping.vatRate !== undefined ? parseNumber(row[mapping.vatRate], 21) : 21;

                // Aplicación de bonificación en cascada
                const costAfterDiscounts = listCost * (1 - d1/100) * (1 - d2/100) * (1 - d3/100);
                const unitCostBase = costAfterDiscounts * factor;
                const priceNeto = unitCostBase * (1 + margin/100);
                const priceFinal = (priceNeto * (1 + vat/100));

                // Procesamiento de Moneda
                const currencyRaw = row[mapping.purchaseCurrency]?.toString().toUpperCase() || 'ARS';
                const purchaseCurrency = currencyRaw.includes('USD') || currencyRaw.includes('DOL') ? 'USD' : 'ARS';

                const productData: Product = {
                    id: existingProduct?.id || `PROD-${sku}-${Date.now()}`,
                    internalCodes: [sku],
                    barcodes: barcode ? [barcode] : (existingProduct?.barcodes || []),
                    providerCodes: providerCode ? [providerCode] : (existingProduct?.providerCodes || []),
                    name: (row[mapping.name] || 'ARTICULO SIN NOMBRE').toUpperCase(),
                    brand: (mapping.brand !== undefined ? row[mapping.brand] : (existingProduct?.brand || 'GENÉRICO')).toUpperCase(),
                    category: (mapping.category !== undefined ? row[mapping.category] : (existingProduct?.category || 'GENERAL')).toUpperCase(),
                    provider: (mapping.provider !== undefined ? row[mapping.provider] : (existingProduct?.provider || '')).toUpperCase(),
                    listCost: listCost,
                    conversionFactor: factor,
                    measureUnitSale: (mapping.measureUnitSale !== undefined ? row[mapping.measureUnitSale] : (existingProduct?.measureUnitSale || 'UNIDAD')).toUpperCase(),
                    measureUnitPurchase: existingProduct?.measureUnitPurchase || 'UNIDAD',
                    discounts: [d1, d2, d3, 0],
                    costAfterDiscounts: parseFloat(costAfterDiscounts.toFixed(4)),
                    profitMargin: margin,
                    vatRate: vat,
                    priceNeto: parseFloat(priceNeto.toFixed(2)),
                    priceFinal: parseFloat(priceFinal.toFixed(2)),
                    stock: mapping.stock !== undefined ? parseNumber(row[mapping.stock], 0) : (existingProduct?.stock || 0),
                    stockPrincipal: mapping.stockPrincipal !== undefined ? parseNumber(row[mapping.stockPrincipal], 0) : (existingProduct?.stockPrincipal || 0),
                    stockDeposito: mapping.stockDeposito !== undefined ? parseNumber(row[mapping.stockDeposito], 0) : (existingProduct?.stockDeposito || 0),
                    stockSucursal: existingProduct?.stockSucursal || 0,
                    stockMinimo: mapping.stockMinimo !== undefined ? parseNumber(row[mapping.stockMinimo], 0) : (existingProduct?.stockMinimo || 0),
                    reorderPoint: mapping.reorderPoint !== undefined ? parseNumber(row[mapping.reorderPoint], 0) : (existingProduct?.reorderPoint || 0),
                    purchaseCurrency: purchaseCurrency,
                    saleCurrency: 'ARS',
                    ecommerce: existingProduct?.ecommerce || { isPublished: false },
                    isCombo: existingProduct?.isCombo || false,
                    comboItems: existingProduct?.comboItems || [],
                    stockDetails: existingProduct?.stockDetails || [],
                    description: existingProduct?.description || '',
                    purchasePackageQuantity: mapping.purchasePackageQuantity !== undefined ? parseNumber(row[mapping.purchasePackageQuantity], 1) : 1,
                    salePackageQuantity: 1,
                    location: existingProduct?.location || ''
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
        <div className="p-4 h-full flex flex-col space-y-4 bg-slate-50 font-sans overflow-hidden">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 shrink-0">
                <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><DatabaseZap size={32}/></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Importador Masivo Pro</h2>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Soporta Descuentos Escalonados, USD y Puntos Críticos</p>
                </div>
                {step === 2 && (
                    <div className="ml-auto flex items-center gap-4">
                        <button onClick={processImport} disabled={isProcessing} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-600 transition-all">
                             {isProcessing ? <RefreshCw className="animate-spin" size={14}/> : <CheckCircle size={14}/>} {isProcessing ? 'Procesando...' : 'Iniciar Carga'}
                        </button>
                    </div>
                )}
            </div>

            {step === 1 && (
                <div className="flex-1 flex items-center justify-center animate-fade-in">
                    <div className="max-w-xl w-full bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm text-center space-y-8">
                        <FileSpreadsheet size={64} className="text-slate-100 mx-auto" />
                        <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">Seleccionar Archivo Maestro</h3>
                        <div className="group border-4 border-dashed border-slate-100 rounded-[3rem] p-16 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                            <FileUp size={48} className="text-slate-200 mx-auto mb-4 group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">CSV / TXT / EXCEL</span>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden animate-fade-in">
                    <div className="lg:col-span-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="flex items-center gap-3 mb-6 border-b pb-4 shrink-0">
                            <Settings2 size={18} className="text-indigo-600"/>
                            <h3 className="text-xs font-black uppercase tracking-widest">Mapear Columnas</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-2">
                            {productFields.map(field => (
                                <div key={field.key} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white transition-all">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${field.required ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{field.label}</label>
                                    </div>
                                    <select 
                                        className="max-w-[150px] p-2 bg-white border rounded-xl text-[10px] font-bold outline-none focus:border-indigo-600 shadow-sm"
                                        value={mapping[field.key] ?? ""}
                                        onChange={e => setMapping({...mapping, [field.key]: e.target.value === "" ? undefined : parseInt(e.target.value)})}
                                    >
                                        <option value="">-- Ignorar --</option>
                                        {headers.map((h, i) => <option key={i} value={i}>{h || `Col ${i + 1}`}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Vista Previa ({fileRows.length.toLocaleString()} filas)</h3>
                            <span className="text-[10px] font-black text-indigo-400">Progreso: {progress}%</span>
                        </div>
                        <div className="overflow-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 z-10 border-b">
                                    <tr>
                                        {headers.map((h, i) => <th key={i} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-r whitespace-nowrap">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fileRows.slice(0, 50).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            {row.map((cell, j) => <td key={j} className="px-4 py-2 text-[10px] font-medium text-slate-500 border-r truncate max-w-[200px]">{cell}</td>)}
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
                        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><CheckCircle size={48}/></div>
                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Importación Exitosa</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Artículos Creados</p>
                                <p className="text-5xl font-black text-indigo-600 tracking-tighter">{stats.created.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Artículos Actualizados</p>
                                <p className="text-5xl font-black text-green-600 tracking-tighter">{stats.updated.toLocaleString()}</p>
                            </div>
                        </div>

                        <button onClick={onComplete} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                            Ir al Catálogo <ArrowRight size={20}/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InitialImport;
