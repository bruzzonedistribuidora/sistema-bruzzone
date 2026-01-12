
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Printer, Trash2, Plus, Minus, X, 
    Barcode, Tag, Settings2, Package, RefreshCw, 
    List
} from 'lucide-react';
import { Product, CompanyConfig } from '../types';
import { productDB } from '../services/storageService';

// Component for massive barcode and price label printing
const LabelPrinting: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [printQueue, setPrintQueue] = useState<{product: Product, quantity: number}[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [labelConfig, setLabelConfig] = useState({
        showPrice: true,
        showBarcode: true,
        showBrand: true,
        columns: 3
    });

    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { fantasyName: 'Ferretería Bruzzone' };
    }, []);

    // Perform product search on term change
    useEffect(() => {
        const performSearch = async () => {
            if (searchTerm.length > 2) {
                setIsSearching(true);
                const results = await productDB.search(searchTerm);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        };
        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const addToQueue = (product: Product) => {
        setPrintQueue(prev => {
            const exists = prev.find(item => item.product.id === product.id);
            if (exists) return prev;
            return [...prev, { product, quantity: 1 }];
        });
        setSearchTerm('');
    };

    const updateQty = (id: string, qty: number) => {
        setPrintQueue(prev => prev.map(item => 
            item.product.id === id ? { ...item, quantity: Math.max(1, qty) } : item
        ));
    };

    const removeFromQueue = (id: string) => {
        setPrintQueue(prev => prev.filter(item => item.product.id !== id));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden font-sans">
            {/* Header section with print button */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 print:hidden">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl">
                        <Tag size={32}/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Impresión de Etiquetas</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Generación de códigos de barras y precios para góndola</p>
                    </div>
                </div>
                <button 
                    onClick={handlePrint}
                    disabled={printQueue.length === 0}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-20 flex items-center gap-3"
                >
                    <Printer size={20}/> Imprimir Lote
                </button>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Search and configuration panel */}
                <div className="lg:col-span-4 flex flex-col space-y-6 print:hidden">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Search size={14}/> Buscar Artículos
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                            <input 
                                type="text" 
                                placeholder="Nombre o SKU..."
                                className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        {searchResults.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1 border-t pt-4">
                                {searchResults.map(p => (
                                    <button 
                                        key={p.id} 
                                        onClick={() => addToQueue(p)}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/50 flex justify-between items-center transition-all"
                                    >
                                        <div className="text-left">
                                            <p className="font-black text-slate-800 text-[10px] uppercase truncate leading-none mb-1">{p.name}</p>
                                            <div className="flex gap-2 text-[8px] font-bold uppercase">
                                                <span className="text-gray-400">{p.internalCodes[0]}</span>
                                                <span className="text-indigo-600">{p.brand || 'GENÉRICO'}</span>
                                            </div>
                                        </div>
                                        <Plus size={16} className="text-indigo-400"/>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Settings2 size={14}/> Configuración Visual
                        </h3>
                        <div className="space-y-4">
                            <ConfigToggle 
                                label="Mostrar Precios" 
                                active={labelConfig.showPrice} 
                                onClick={() => setLabelConfig({...labelConfig, showPrice: !labelConfig.showPrice})} 
                            />
                            <ConfigToggle 
                                label="Mostrar Códigos" 
                                active={labelConfig.showBarcode} 
                                onClick={() => setLabelConfig({...labelConfig, showBarcode: !labelConfig.showBarcode})} 
                            />
                            <ConfigToggle 
                                label="Mostrar Marcas" 
                                active={labelConfig.showBrand} 
                                onClick={() => setLabelConfig({...labelConfig, showBrand: !labelConfig.showBrand})} 
                            />
                            <div className="pt-4 border-t">
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-3">Columnas por Fila</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => setLabelConfig({...labelConfig, columns: num})}
                                            className={`py-2 rounded-xl text-[10px] font-black border transition-all ${labelConfig.columns === num ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print preview and queue management area */}
                <div className="lg:col-span-8 flex flex-col space-y-6 overflow-hidden">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden print:border-none print:shadow-none">
                        <div className="p-6 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center shrink-0 print:hidden">
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-indigo-400"/> Cola de Impresión
                            </h3>
                            <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">{printQueue.length} PRODUCTOS</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30 print:p-0 print:overflow-visible print:bg-white">
                            {printQueue.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 print:hidden">
                                    <Barcode size={80} strokeWidth={1} className="mb-4"/>
                                    <p className="font-black uppercase tracking-widest text-[10px]">Agregue artículos para imprimir etiquetas</p>
                                </div>
                            ) : (
                                <div 
                                    className="grid gap-4 print:gap-2"
                                    style={{ 
                                        gridTemplateColumns: `repeat(${labelConfig.columns}, minmax(0, 1fr))` 
                                    }}
                                >
                                    {printQueue.map((item, idx) => (
                                        Array.from({ length: item.quantity }).map((_, qIdx) => (
                                            <div 
                                                key={`${item.product.id}-${qIdx}`}
                                                className="bg-white border border-slate-300 p-4 rounded-xl flex flex-col items-center text-center space-y-2 break-inside-avoid shadow-sm print:shadow-none print:border-slate-800"
                                            >
                                                <p className="text-[8px] font-black uppercase text-slate-400 leading-none">{companyConfig.fantasyName}</p>
                                                <h4 className="font-black uppercase text-[10px] leading-tight line-clamp-2 h-6">{item.product.name}</h4>
                                                {labelConfig.showBrand && (
                                                    <p className="text-[7px] font-bold text-indigo-500 uppercase">{item.product.brand}</p>
                                                )}
                                                
                                                <div className="py-2 border-y border-slate-100 w-full flex flex-col items-center gap-1">
                                                    {labelConfig.showPrice && (
                                                        <p className="text-xl font-black text-slate-900 tracking-tighter">${item.product.priceFinal.toLocaleString()}</p>
                                                    )}
                                                    {labelConfig.showBarcode && (
                                                        <>
                                                            <div className="w-full h-8 bg-slate-100 flex items-center justify-center rounded print:border print:border-slate-200">
                                                                <Barcode size={32} className="opacity-40" />
                                                            </div>
                                                            <p className="text-[7px] font-mono font-bold tracking-widest">{item.product.internalCodes[0]}</p>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {/* Hidden controls when printing */}
                                                <div className="flex items-center gap-2 pt-1 print:hidden">
                                                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><Minus size={10}/></button>
                                                    <span className="text-[10px] font-black w-4">{item.quantity}</span>
                                                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><Plus size={10}/></button>
                                                    <button onClick={() => removeFromQueue(item.product.id)} className="p-1 text-red-300 hover:text-red-500 ml-1"><Trash2 size={12}/></button>
                                                </div>
                                            </div>
                                        ))
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print\\:hidden { display: none !important; }
                    .lg\\:col-span-8, .lg\\:col-span-8 * { visibility: visible; }
                    .lg\\:col-span-8 {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto;
                    }
                    @page { margin: 1cm; }
                }
            `}</style>
        </div>
    );
};

// UI component for configuration toggles
const ConfigToggle: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${active ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-slate-50 bg-white text-slate-400'}`}
    >
        <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
        <div className={`w-10 h-5 rounded-full relative transition-all ${active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'right-1' : 'left-1'}`}></div>
        </div>
    </button>
);

export default LabelPrinting;
