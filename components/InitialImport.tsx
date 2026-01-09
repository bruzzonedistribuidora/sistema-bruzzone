
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
    const [matchKey, setMatchKey] = useState<string>('internalCodes'); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ created: 0, updated: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Listado exhaustivo basado en el fichero real de la ferretería
    const productFields = [
        { key: 'internalCodes', label: 'CODIGO Propio (SKU)', required: true },
        { key: 'name', label: 'Nombre / Descripción', required: true },
        { key: 'listCost', label: 'COSTOS LISTA (Bulto/Unidad)', required: true },
        { key: 'purchasePackageQuantity', label: 'Cant. por Bulto', required: false },
        { key: 'brand', label: 'Marca', required: false },
        { key: 'category', label: 'Rubro / Categoría', required: false },
        { key: 'provider', label: 'Proveedor', required: false },
        { key: 'stock', label: 'Stock Total', required: false },
        { key: 'stockPrincipal', label: 'Stock Local / Mostrador', required: false },
        { key: 'stockDeposito', label: 'Stock Depósito', required: false },
        { key: 'stockSucursal', label: 'Stock Sucursal', required: false },
        { key: 'stockMinimo', label: 'Stock Mínimo', required: false },
        { key: 'stockMaximo', label: 'Stock Máximo', required: false },
        { key: 'reorderPoint', label: 'Punto Pedido', required: false },
        { key: 'profitMargin', label: 'Porcentaje Ganancia (%)', required: false },
        { key: 'vatRate', label: 'Tasa (IVA %)', required: false },
        { key: 'tasa', label: 'Tasa (Imp. Internos / Percep)', required: false },
        { key: 'disc1', label: 'Descuento 1 (%)', required: false },
        { key: 'disc2', label: 'Descuento 2 (%)', required: false },
        { key: 'disc3', label: 'Descuento 3 (%)', required: false },
        { key: 'measureUnitPurchase', label: '1DeMedidaCompra', required: false },
        { key: 'monedaCompra', label: 'Moneda Compra (ARS/USD)', required: false },
        { key: 'monedaVenta', label: 'Moneda Venta (ARS/USD)', required: false },
        { key: 'barcodes', label: 'Código de Barras (EAN)', required: false },
        { key: 'providerCodes', label: 'Cod PROV (Ref Proveedor)', required: false },
        { key: 'otrosCodigos1', label: 'Otros Codigos 1', required: false },
        { key: 'otrosCodigos2', label: 'Otros Codigos 2', required: false },
        { key: 'otrosCodigos3', label: 'Otros Codigos 3', required: false },
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
            
            // Auto-mapeo inteligente por nombre de columna
            const autoMap: Record<string, number> = {};
            productFields.forEach(field => {
                const index = parsedRows[0].findIndex(h => {
                    const header = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const target = field.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    return header === target || header.includes(target) || header === field.key.toLowerCase();
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
            alert("Mapeo insuficiente: CODIGO, Nombre y Costo son obligatorios.");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        
        const currentProducts = await productDB.getAll();
        const productMap = new Map<string, Product>();
        currentProducts.forEach(p => productMap.set(p.internalCodes[0].toString().toUpperCase(), p));

        const CHUNK_SIZE = 4000;
        let index = 0;
        let createdCount = 0;
        let updatedCount = 0;

        const processChunk = async () => {
            const limit = Math.min(index + CHUNK_SIZE, fileRows.length);
            const chunkProducts: Product[] = [];

            for (let i = index; i < limit; i++) {
                const row = fileRows[i];
                const sku = row[mapping.internalCodes]?.toString().toUpperCase();
                if (!sku) continue;

                const existingProduct = productMap.get(sku);

                // Lógica de Precios y Descuentos
                const listCost = parseNumber(row[mapping.listCost], 0);
                const packQty = mapping.purchasePackageQuantity !== undefined ? parseNumber(row[mapping.purchasePackageQuantity], 1) : 1;
                const d1 = mapping.disc1 !== undefined ? parseNumber(row[mapping.disc1], 0) : 0;
                const d2 = mapping.disc2 !== undefined ? parseNumber(row[mapping.disc2], 0) : 0;
                const d3 = mapping.disc3 !== undefined ? parseNumber(row[mapping.disc3], 0) : 0;
                const margin = mapping.profitMargin !== undefined ? parseNumber(row[mapping.profitMargin], 30) : 30;
                const vat = mapping.vatRate !== undefined ? parseNumber(row[mapping.vatRate], 21) : 21;
                const extraTax = mapping.tasa !== undefined ? parseNumber(row[mapping.tasa], 0) : 0;

                const coef = (1 - d1/100) * (1 - d2/100) * (1 - d3/100);
                const costAfterDiscounts = listCost * coef;
                const priceNeto = costAfterDiscounts * (1 + margin/100);
                // El PVP Final incluye IVA + Tasa extra si existe
                const priceFinal = (priceNeto * (1 + vat/100)) + extraTax;

                const productData: Product = {
                    id: existingProduct?.id || `PROD-${Date.now()}-${i}`,
                    internalCodes: [sku],
                    barcodes: mapping.barcodes !== undefined ? [row[mapping.barcodes]] : (existingProduct?.barcodes || []),
                    providerCodes: mapping.providerCodes !== undefined ? [row[mapping.providerCodes]] : (existingProduct?.providerCodes || []),
                    otrosCodigos1: mapping.otrosCodigos1 !== undefined ? row[mapping.otrosCodigos1] : existingProduct?.otrosCodigos1,
                    otrosCodigos2: mapping.otrosCodigos2 !== undefined ? row[mapping.otrosCodigos2] : existingProduct?.otrosCodigos2,
                    otrosCodigos3: mapping.otrosCodigos3 !== undefined ? row[mapping.otrosCodigos3] : existingProduct?.otrosCodigos3,
                    name: (row[mapping.name] || 'ARTICULO SIN NOMBRE').toUpperCase(),
                    brand: (mapping.brand !== undefined ? row[mapping.brand] : (existingProduct?.brand || 'GENÉRICO')).toUpperCase(),
                    category: (mapping.category !== undefined ? row[mapping.category] : (existingProduct?.category || 'GENERAL')).toUpperCase(),
                    provider: (mapping.provider !== undefined ? row[mapping.provider] : (existingProduct?.provider || '')).toUpperCase(),
                    description: existingProduct?.description || '',
                    listCost: listCost,
                    purchasePackageQuantity: packQty,
                    discounts: [d1, d2, d3, 0],
                    costAfterDiscounts: parseFloat(costAfterDiscounts.toFixed(4)),
                    profitMargin: margin,
                    vatRate: vat,
                    tasa: extraTax,
                    priceNeto: parseFloat(priceNeto.toFixed(2)),
                    priceFinal: parseFloat(priceFinal.toFixed(2)),
                    stockPrincipal: mapping.stockPrincipal !== undefined ? parseNumber(row[mapping.stockPrincipal], 0) : (existingProduct?.stockPrincipal || 0),
                    stockDeposito: mapping.stockDeposito !== undefined ? parseNumber(row[mapping.stockDeposito], 0) : (existingProduct?.stockDeposito || 0),
                    stockSucursal: mapping.stockSucursal !== undefined ? parseNumber(row[mapping.stockSucursal], 0) : (existingProduct?.stockSucursal || 0),
                    stock: mapping.stock !== undefined ? parseNumber(row[mapping.stock], 0) : (existingProduct?.stock || 0),
                    stockMinimo: mapping.stockMinimo !== undefined ? parseNumber(row[mapping.stockMinimo], 0) : (existingProduct?.stockMinimo || 0),
                    stockMaximo: mapping.stockMaximo !== undefined ? parseNumber(row[mapping.stockMaximo], 0) : (existingProduct?.stockMaximo || 0),
                    reorderPoint: mapping.reorderPoint !== undefined ? parseNumber(row[mapping.reorderPoint], 0) : (existingProduct?.reorderPoint || 0),
                    measureUnitPurchase: (mapping.measureUnitPurchase !== undefined ? row[mapping.measureUnitPurchase] : (existingProduct?.measureUnitPurchase || 'UNIDAD')).toUpperCase(),
                    purchaseCurrency: (mapping.monedaCompra !== undefined ? row[mapping.monedaCompra] : (existingProduct?.purchaseCurrency || 'ARS')).toUpperCase(),
                    saleCurrency: (mapping.monedaVenta !== undefined ? row[mapping.monedaVenta] : (existingProduct?.saleCurrency || 'ARS')).toUpperCase(),
                    location: existingProduct?.location || '',
                    ecommerce: existingProduct?.ecommerce || { isPublished: false },
                    isCombo: existingProduct?.isCombo || false,
                    comboItems: existingProduct?.comboItems || [],
                    stockDetails: existingProduct?.stockDetails || []
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
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Sincronización de Base de Datos</h2>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Procesador de Ficheros Pro (+140k registros)</p>
                </div>
                {step === 2 && (
                    <div className="ml-auto flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Criterio:</p>
                            <select className="bg-slate-50 border rounded-lg p-1 text-[10px] font-black uppercase" value={matchKey} onChange={e => setMatchKey(e.target.value)}>
                                <option value="internalCodes">Por CODIGO Propio</option>
                                <option value="barcodes">Por Cod. de Barras</option>
                            </select>
                        </div>
                        <button onClick={processImport} disabled={isProcessing} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-600 transition-all">
                             {isProcessing ? <RefreshCw className="animate-spin" size={14}/> : <CheckCircle size={14}/>} {isProcessing ? 'Sincronizando...' : 'Iniciar Carga'}
                        </button>
                    </div>
                )}
            </div>

            {step === 1 && (
                <div className="flex-1 flex items-center justify-center animate-fade-in">
                    <div className="max-w-xl w-full bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm text-center space-y-8">
                        <FileSpreadsheet size={64} className="text-slate-100 mx-auto" />
                        <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">Carga de Fichero Maestro</h3>
                        <div className="group border-4 border-dashed border-slate-100 rounded-[3rem] p-16 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                            <FileUp size={48} className="text-slate-200 mx-auto mb-4 group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Seleccionar CSV / TXT</span>
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Formatos admitidos: Separado por ";" o Tabulación</p>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden animate-fade-in">
                    <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="flex items-center gap-3 mb-6 border-b pb-4 shrink-0">
                            <Settings2 size={18} className="text-indigo-600"/>
                            <h3 className="text-xs font-black uppercase tracking-widest">Configurar Mapeo de Columnas</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-2">
                            {productFields.map(field => (
                                <div key={field.key} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white transition-all">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${field.required ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{field.label}</label>
                                    </div>
                                    <select 
                                        className="max-w-[180px] p-2 bg-white border-2 border-transparent rounded-xl text-[10px] font-bold outline-none focus:border-indigo-600 shadow-sm"
                                        value={mapping[field.key] ?? ""}
                                        onChange={e => setMapping({...mapping, [field.key]: e.target.value === "" ? undefined : parseInt(e.target.value)})}
                                    >
                                        <option value="">-- Ignorar --</option>
                                        {headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                        {isProcessing && (
                            <div className="mt-6 space-y-2 shrink-0">
                                <div className="flex justify-between text-[10px] font-black uppercase text-indigo-600">
                                    <span>Progreso General</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 transition-all duration-500 shadow-lg" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Vista Previa de Origen ({fileRows.length.toLocaleString()} filas)</h3>
                        </div>
                        <div className="overflow-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 z-10 border-b">
                                    <tr>
                                        {headers.map((h, i) => <th key={i} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-r whitespace-nowrap">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fileRows.slice(0, 30).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            {row.map((cell, j) => <td key={j} className="px-4 py-2 text-[10px] font-medium text-slate-500 border-r truncate max-w-[150px]">{cell}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {fileRows.length > 30 && (
                                <div className="p-4 text-center text-slate-300 font-bold uppercase text-[9px] italic border-t">... y {(fileRows.length - 30).toLocaleString()} filas más ...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="h-full flex items-center justify-center animate-fade-in">
                    <div className="max-w-2xl w-full bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm text-center space-y-10">
                        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><CheckCircle size={48}/></div>
                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Sincronización Completa</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Items Nuevos</p>
                                <p className="text-5xl font-black text-indigo-600 tracking-tighter">{stats.created.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Items Actualizados</p>
                                <p className="text-5xl font-black text-green-600 tracking-tighter">{stats.updated.toLocaleString()}</p>
                            </div>
                        </div>

                        <button onClick={onComplete} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                            Explorar Catálogo <ArrowRight size={20}/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InitialImport;
