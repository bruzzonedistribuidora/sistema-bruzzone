
import React, { useState, useRef } from 'react';
import { 
    FileUp, FileSpreadsheet, CheckCircle, ArrowRight, 
    X, AlertTriangle, RefreshCw, Layers, Table as TableIcon,
    Database, Settings2, Info, ChevronRight, Save, Trash2
} from 'lucide-react';
import { Product } from '../types';

interface InitialImportProps {
    onComplete: () => void;
}

const InitialImport: React.FC<InitialImportProps> = ({ onComplete }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fileRows, setFileRows] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, number>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Campos del producto que el usuario puede mapear
    const productFields = [
        { key: 'internalCodes', label: 'Código SKU / Interno', required: true },
        { key: 'barcodes', label: 'Código de Barras (EAN)', required: false },
        { key: 'providerCodes', label: 'Código de Proveedor', required: false },
        { key: 'name', label: 'Descripción Comercial', required: true },
        { key: 'brand', label: 'Marca', required: false },
        { key: 'category', label: 'Categoría', required: false },
        { key: 'provider', label: 'Proveedor', required: false },
        { key: 'listCost', label: 'Costo (Lista)', required: true },
        { key: 'discount1', label: 'Bonificación 1 (%)', required: false },
        { key: 'discount2', label: 'Bonificación 2 (%)', required: false },
        { key: 'discount3', label: 'Bonificación 3 (%)', required: false },
        { key: 'purchaseCurrency', label: 'Moneda de Compra (ARS/USD)', required: false },
        { key: 'profitMargin', label: 'Margen de Utilidad (%)', required: false },
        { key: 'vatRate', label: 'Alícuota IVA (%)', required: false },
        { key: 'measureUnitPurchase', label: 'Unidad Medida Compra', required: false },
        { key: 'measureUnitSale', label: 'Unidad Medida Venta', required: false },
        { key: 'stock', label: 'Stock Inicial', required: false },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
            
            if (lines.length === 0) {
                alert("El archivo parece estar vacío.");
                return;
            }

            // Detectar separador (coma, punto y coma o tabulación)
            const firstLine = lines[0];
            const separators = [';', ',', '\t'];
            const separator = separators.reduce((prev, curr) => 
                (firstLine.split(curr).length > firstLine.split(prev).length) ? curr : prev
            );

            const parsedRows = lines.map(line => line.split(separator).map(cell => cell.trim()));
            setHeaders(parsedRows[0]);
            setFileRows(parsedRows.slice(1));
            setStep(2);
        };
        reader.readAsText(file);
    };

    const handleMappingChange = (fieldKey: string, columnIndex: number) => {
        setMapping(prev => ({ ...prev, [fieldKey]: columnIndex }));
    };

    const processImport = () => {
        // Validar campos requeridos
        const missingFields = productFields
            .filter(f => f.required && mapping[f.key] === undefined)
            .map(f => f.label);

        if (missingFields.length > 0) {
            alert(`Debes mapear los siguientes campos obligatorios: ${missingFields.join(', ')}`);
            return;
        }

        setIsProcessing(true);

        // Simulamos procesamiento masivo
        setTimeout(() => {
            try {
                const existingProducts: Product[] = JSON.parse(localStorage.getItem('ferrecloud_products') || '[]');
                
                const newProducts: Product[] = fileRows.map((row, idx) => {
                    const cost = parseFloat(row[mapping.listCost]?.replace(',', '.') || '0');
                    const d1 = mapping.discount1 !== undefined ? parseFloat(row[mapping.discount1]?.replace(',', '.') || '0') : 0;
                    const d2 = mapping.discount2 !== undefined ? parseFloat(row[mapping.discount2]?.replace(',', '.') || '0') : 0;
                    const d3 = mapping.discount3 !== undefined ? parseFloat(row[mapping.discount3]?.replace(',', '.') || '0') : 0;
                    
                    const margin = mapping.profitMargin !== undefined ? parseFloat(row[mapping.profitMargin]?.replace(',', '.') || '30') : 30;
                    const vat = mapping.vatRate !== undefined ? parseFloat(row[mapping.vatRate]?.replace(',', '.') || '21') : 21;
                    
                    // Calcular costo con descuentos aplicados en cascada
                    let costAfterDiscounts = cost;
                    [d1, d2, d3].forEach(d => {
                        if (d > 0) costAfterDiscounts *= (1 - d / 100);
                    });

                    const priceNeto = costAfterDiscounts * (1 + margin / 100);
                    const priceFinal = priceNeto * (1 + vat / 100);

                    return {
                        id: `prod-${Date.now()}-${idx}`,
                        internalCodes: [row[mapping.internalCodes] || 'S/C'],
                        barcodes: mapping.barcodes !== undefined ? [row[mapping.barcodes]] : [],
                        providerCodes: mapping.providerCodes !== undefined ? [row[mapping.providerCodes]] : [],
                        name: (row[mapping.name] || 'PRODUCTO SIN NOMBRE').toUpperCase(),
                        brand: (mapping.brand !== undefined ? row[mapping.brand] : 'GENÉRICO').toUpperCase(),
                        category: (mapping.category !== undefined ? row[mapping.category] : 'GENERAL').toUpperCase(),
                        provider: (mapping.provider !== undefined ? row[mapping.provider] : 'PROVEEDOR GRAL').toUpperCase(),
                        description: '',
                        measureUnitSale: mapping.measureUnitSale !== undefined ? row[mapping.measureUnitSale] : 'Unidad',
                        measureUnitPurchase: mapping.measureUnitPurchase !== undefined ? row[mapping.measureUnitPurchase] : 'Unidad',
                        conversionFactor: 1,
                        purchaseCurrency: mapping.purchaseCurrency !== undefined ? (row[mapping.purchaseCurrency].toUpperCase().includes('USD') ? 'USD' : 'ARS') : 'ARS',
                        saleCurrency: 'ARS',
                        vatRate: vat,
                        listCost: cost,
                        discounts: [d1, d2, d3, 0],
                        costAfterDiscounts: parseFloat(costAfterDiscounts.toFixed(2)),
                        profitMargin: margin,
                        priceNeto: parseFloat(priceNeto.toFixed(2)),
                        priceFinal: parseFloat(priceFinal.toFixed(2)),
                        stock: mapping.stock !== undefined ? (parseFloat(row[mapping.stock]) || 0) : 0,
                        stockDetails: [],
                        minStock: 5,
                        desiredStock: 10,
                        reorderPoint: 3,
                        location: '',
                        ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false },
                        isCombo: false,
                        comboItems: []
                    };
                });

                const totalCatalog = [...existingProducts, ...newProducts];
                localStorage.setItem('ferrecloud_products', JSON.stringify(totalCatalog));
                
                setIsProcessing(false);
                setStep(3);
            } catch (err) {
                console.error(err);
                alert("Error procesando los datos. Verifique que los formatos numéricos sean correctos.");
                setIsProcessing(false);
            }
        }, 1500);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            {/* CABECERA WIZARD */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                        <FileSpreadsheet size={32}/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Importador de Catálogo</h2>
                        <div className="flex gap-4 mt-3">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === s ? 'bg-indigo-600 text-white shadow-lg' : s < step ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {s < step ? <CheckCircle size={14}/> : s}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${step === s ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {s === 1 ? 'Subida' : s === 2 ? 'Mapeo' : 'Finalizado'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {step === 2 && (
                    <button 
                        onClick={processImport}
                        disabled={isProcessing}
                        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50">
                        {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
                        {isProcessing ? 'Procesando catálogo...' : 'Iniciar Importación'}
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* PASO 1: SUBIDA */}
                {step === 1 && (
                    <div className="h-full flex items-center justify-center animate-fade-in">
                        <div className="max-w-xl w-full bg-white p-12 rounded-[3.5rem] border border-gray-200 shadow-sm text-center space-y-8">
                            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                                <FileUp size={48}/>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Preparar Artículos</h3>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed px-10">Carga tu archivo Excel (guardado como .csv o .txt) para poblar el catálogo de tu ferretería.</p>
                            </div>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="group border-4 border-dashed border-slate-100 rounded-[3rem] p-16 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer relative"
                            >
                                <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                                <div className="flex flex-col items-center gap-4">
                                    <FileSpreadsheet size={64} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Click para seleccionar archivo</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PASO 2: MAPEO */}
                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-10">
                        {/* Columna de Mapeo */}
                        <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-gray-200 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b pb-4">
                                <Settings2 className="text-indigo-600" size={20}/>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Asignación de Columnas</h3>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Indica a qué campo del sistema corresponde cada columna de tu archivo Excel.</p>
                            
                            <div className="space-y-4">
                                {productFields.map(field => (
                                    <div key={field.key} className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <label className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                                            {mapping[field.key] !== undefined && <CheckCircle size={12} className="text-green-500"/>}
                                        </label>
                                        <select 
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={mapping[field.key] ?? ""}
                                            onChange={e => handleMappingChange(field.key, parseInt(e.target.value))}
                                        >
                                            <option value="">-- Ignorar / No está --</option>
                                            {headers.map((h, i) => (
                                                <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Columna de Previsualización */}
                        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <TableIcon size={20} className="text-indigo-400"/>
                                    <h3 className="text-sm font-black uppercase tracking-widest">Vista Previa de Datos</h3>
                                </div>
                                <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full uppercase">{fileRows.length} registros detectados</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            {headers.map((h, i) => (
                                                <th key={i} className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-r last:border-0">{h || `Columna ${i+1}`}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {fileRows.slice(0, 10).map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                {row.map((cell, j) => (
                                                    <td key={j} className="px-6 py-3.5 text-[10px] font-medium text-slate-500 border-r last:border-0 whitespace-nowrap overflow-hidden max-w-[150px] truncate">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-6 bg-slate-50 border-t flex items-center gap-4">
                                <Info size={20} className="text-indigo-500 shrink-0"/>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">Mostrando las primeras 10 filas de ejemplo. Asegúrate de que las columnas coincidan con el mapeo de la izquierda.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* PASO 3: FINALIZADO */}
                {step === 3 && (
                    <div className="h-full flex items-center justify-center animate-fade-in">
                        <div className="max-w-xl w-full bg-white p-12 rounded-[3.5rem] border border-gray-200 shadow-sm text-center space-y-10">
                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                                <CheckCircle size={48}/>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">¡Importación Exitosa!</h3>
                                <p className="text-sm text-slate-400 font-medium px-10 leading-relaxed">Se han procesado {fileRows.length} artículos correctamente. Ya están disponibles en tu inventario maestro para la venta.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nuevos SKUs</p>
                                    <p className="text-2xl font-black text-slate-800">{fileRows.length}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                                    <p className="text-xs font-black text-green-600 uppercase tracking-widest">En Línea</p>
                                </div>
                            </div>
                            <button 
                                onClick={onComplete}
                                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                                Ir al Inventario <ChevronRight size={24}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitialImport;
