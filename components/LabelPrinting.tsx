
import React, { useState, useRef } from 'react';
import { Tag, Search, Plus, Trash2, Printer, Move, LayoutGrid, X, CheckSquare, Square, MousePointer2 } from 'lucide-react';
import { Product } from '../types';

interface LabelElementPosition {
    x: number;
    y: number;
    visible: boolean;
    fontSize: number;
}

interface LabelTemplate {
    width: number; // mm
    height: number; // mm
    elements: {
        name: LabelElementPosition;
        price: LabelElementPosition;
        sku: LabelElementPosition;
        barcode: LabelElementPosition;
    };
}

interface ProductToPrint {
    product: Product;
    quantity: number;
}

// Mock Data for Search
const createMockProduct = (id: string, internalCode: string, name: string, price: number): Product => ({
  id, internalCode, barcodes: [internalCode], providerCodes: [],
  name, brand: 'Generico', provider: 'Proveedor', category: 'General', description: '',
  measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
  vatRate: 21, listCost: price * 0.6, discounts: [0, 0, 0, 0], costAfterDiscounts: price * 0.6, profitMargin: 40,
  priceNeto: price / 1.21, priceFinal: price, stock: 100, stockDetails: [], minStock: 10, desiredStock: 20, reorderPoint: 5,
  location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
});

const mockProducts: Product[] = [
    createMockProduct('1', 'TOR-001', 'Tornillo T1 Autoperforante', 150),
    createMockProduct('2', 'TAL-022', 'Taladro Percutor 750w', 85000),
    createMockProduct('3', 'LIJ-180', 'Lija al Agua 180', 450),
    createMockProduct('4', 'PINT-20L', 'Látex Interior 20L', 45000),
    createMockProduct('5', 'ADH-999', 'Adhesivo Industrial', 3500),
];

// Extracted LabelPreview Component
const LabelPreview: React.FC<{ product: Product, template: LabelTemplate, scale?: number, showGrid?: boolean }> = ({ product, template, scale = 1, showGrid = false }) => {
    // Assume 96 DPI for screen -> 1mm approx 3.78px. 
    // For print consistency, we usually use mm units directly in CSS if printing, but for React preview we might need pixels.
    // Let's use mm for the style to be closer to print reality.
    
    return (
        <div 
            className={`relative bg-white overflow-hidden ${showGrid ? 'border border-gray-300' : 'border border-gray-100 shadow-sm'}`}
            style={{ 
                width: `${template.width}mm`, 
                height: `${template.height}mm`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
            }}
        >
            {template.elements.name.visible && (
                <div 
                    className="absolute leading-none font-bold text-gray-800 whitespace-nowrap overflow-hidden"
                    style={{ 
                        left: `${template.elements.name.x}mm`, 
                        top: `${template.elements.name.y}mm`,
                        fontSize: `${template.elements.name.fontSize}pt`
                    }}
                >
                    {product.name}
                </div>
            )}
            {template.elements.sku.visible && (
                <div 
                    className="absolute leading-none text-gray-500 font-mono"
                    style={{ 
                        left: `${template.elements.sku.x}mm`, 
                        top: `${template.elements.sku.y}mm`,
                        fontSize: `${template.elements.sku.fontSize}pt`
                    }}
                >
                    {product.internalCode}
                </div>
            )}
            {template.elements.price.visible && (
                <div 
                    className="absolute leading-none font-bold text-black"
                    style={{ 
                        left: `${template.elements.price.x}mm`, 
                        top: `${template.elements.price.y}mm`,
                        fontSize: `${template.elements.price.fontSize}pt`
                    }}
                >
                    ${product.priceFinal.toLocaleString('es-AR')}
                </div>
            )}
            {template.elements.barcode.visible && (
                <div 
                    className="absolute flex flex-col items-center justify-center"
                    style={{ 
                        left: `${template.elements.barcode.x}mm`, 
                        top: `${template.elements.barcode.y}mm`,
                        width: '30mm',
                        height: '10mm',
                        // Simulate barcode visual
                        backgroundImage: 'repeating-linear-gradient(90deg, black 0, black 1px, transparent 1px, transparent 3px)',
                    }}
                >
                </div>
            )}
        </div>
    );
};

const LabelPrinting: React.FC = () => {
    const [viewMode, setViewMode] = useState<'DESIGN' | 'PREVIEW_SHEET'>('DESIGN');
    
    // Selection State
    const [searchTerm, setSearchTerm] = useState('');
    const [printQueue, setPrintQueue] = useState<ProductToPrint[]>([]);
    
    // Template State
    const [labelConfig, setLabelConfig] = useState<LabelTemplate>({
        width: 50, // mm
        height: 25, // mm
        elements: {
            name: { x: 2, y: 2, visible: true, fontSize: 10 },
            price: { x: 2, y: 12, visible: true, fontSize: 16 },
            sku: { x: 30, y: 2, visible: true, fontSize: 8 },
            barcode: { x: 2, y: 18, visible: true, fontSize: 20 }, // Simulated height for barcode
        }
    });

    // Dragging State
    const [activeElement, setActiveElement] = useState<keyof LabelTemplate['elements'] | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    // --- HANDLERS: SELECTION ---
    const addToQueue = (product: Product) => {
        setPrintQueue(prev => {
            const exists = prev.find(p => p.product.id === product.id);
            if (exists) {
                return prev.map(p => p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, qty: number) => {
        if (qty < 1) return;
        setPrintQueue(prev => prev.map(p => p.product.id === id ? { ...p, quantity: qty } : p));
    };

    const removeFromQueue = (id: string) => {
        setPrintQueue(prev => prev.filter(p => p.product.id !== id));
    };

    const filteredProducts = mockProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.internalCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- HANDLERS: DESIGNER ---
    const handleMouseDown = (e: React.MouseEvent, key: keyof LabelTemplate['elements']) => {
        e.stopPropagation();
        setActiveElement(key);
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !activeElement || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const xPx = e.clientX - rect.left;
        const yPx = e.clientY - rect.top;

        // Convert px to mm (approximation: 1mm ~ 3.78px, but depends on screen. 
        // Better logic: calculate ratio based on rendered width vs defined mm width)
        const pxPerMmX = rect.width / labelConfig.width;
        const pxPerMmY = rect.height / labelConfig.height;

        const xMm = Math.round(xPx / pxPerMmX);
        const yMm = Math.round(yPx / pxPerMmY);

        setLabelConfig(prev => ({
            ...prev,
            elements: {
                ...prev.elements,
                [activeElement]: { ...prev.elements[activeElement], x: xMm, y: yMm }
            }
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const toggleVisibility = (key: keyof LabelTemplate['elements']) => {
        setLabelConfig(prev => ({
            ...prev,
            elements: {
                ...prev.elements,
                [key]: { ...prev.elements[key], visible: !prev.elements[key].visible }
            }
        }));
    };

    const changeFontSize = (key: keyof LabelTemplate['elements'], size: number) => {
        setLabelConfig(prev => ({
            ...prev,
            elements: {
                ...prev.elements,
                [key]: { ...prev.elements[key], fontSize: size }
            }
        }));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex h-full flex-col bg-gray-100 overflow-hidden relative">
            
            {/* --- SCREEN ONLY HEADER --- */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Tag size={24} className="text-ferre-orange"/> Impresión de Etiquetas</h2>
                    <p className="text-sm text-gray-500">Diseña e imprime etiquetas de góndola o productos.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setViewMode('DESIGN')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${viewMode === 'DESIGN' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
                        <Move size={16}/> Diseñador
                    </button>
                    <button 
                        onClick={() => setViewMode('PREVIEW_SHEET')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${viewMode === 'PREVIEW_SHEET' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
                        <LayoutGrid size={16}/> Plancha de Impresión
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT (SCREEN) --- */}
            <div className="flex-1 flex overflow-hidden print:hidden">
                
                {/* LEFT PANEL: SELECTION & CONFIG */}
                <div className="w-1/3 min-w-[350px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto z-10">
                    
                    {/* 1. Product Selection */}
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Search size={16}/> Selección de Productos
                        </h3>
                        <div className="relative mb-3">
                            <input 
                                type="text" 
                                placeholder="Buscar producto..." 
                                className="w-full pl-8 pr-3 py-2 border rounded text-sm outline-none focus:border-ferre-orange"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14}/>
                        </div>
                        {searchTerm && (
                            <div className="max-h-40 overflow-y-auto border rounded mb-3 bg-gray-50">
                                {filteredProducts.map(p => (
                                    <button key={p.id} onClick={() => addToQueue(p)} className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 border-b last:border-0 flex justify-between">
                                        <span className="font-bold text-gray-700 truncate">{p.name}</span>
                                        <span className="text-gray-500 font-mono">{p.internalCode}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                            {printQueue.length === 0 && <p className="text-xs text-gray-400 text-center py-4 italic">No hay productos seleccionados.</p>}
                            {printQueue.map(item => (
                                <div key={item.product.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                                    <div className="flex-1 overflow-hidden mr-2">
                                        <div className="text-xs font-bold text-gray-800 truncate">{item.product.name}</div>
                                        <div className="text-[10px] text-gray-500">{item.product.internalCode}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            className="w-10 text-center p-1 border rounded text-xs" 
                                            value={item.quantity} 
                                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                                        />
                                        <button onClick={() => removeFromQueue(item.product.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Label Configuration */}
                    <div className="p-6">
                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Tag size={16}/> Configuración de Etiqueta
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Ancho (mm)</label>
                                <input type="number" className="w-full p-2 border rounded text-sm" value={labelConfig.width} onChange={e => setLabelConfig({...labelConfig, width: parseFloat(e.target.value)||0})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Alto (mm)</label>
                                <input type="number" className="w-full p-2 border rounded text-sm" value={labelConfig.height} onChange={e => setLabelConfig({...labelConfig, height: parseFloat(e.target.value)||0})} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {(Object.keys(labelConfig.elements) as Array<keyof LabelTemplate['elements']>).map(key => (
                                <div key={key} className="flex items-center justify-between bg-white border rounded p-2">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toggleVisibility(key)} className="text-gray-500 hover:text-blue-600">
                                            {labelConfig.elements[key].visible ? <CheckSquare size={16}/> : <Square size={16}/>}
                                        </button>
                                        <span className="text-xs font-bold uppercase text-gray-700">{key === 'name' ? 'Nombre' : key === 'price' ? 'Precio' : key === 'barcode' ? 'Cod. Barras' : 'SKU'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-gray-400">Tam.</span>
                                        <input 
                                            type="number" 
                                            className="w-12 text-xs border rounded p-1 text-center"
                                            value={labelConfig.elements[key].fontSize}
                                            onChange={(e) => changeFontSize(key, parseFloat(e.target.value)||0)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: PREVIEW / DESIGNER */}
                <div className="flex-1 bg-gray-200 flex flex-col items-center justify-center p-8 overflow-auto relative">
                    
                    {/* DESIGNER VIEW */}
                    {viewMode === 'DESIGN' && (
                        <div className="flex flex-col items-center">
                            <div className="mb-4 text-gray-500 text-sm font-bold flex items-center gap-2">
                                <MousePointer2 size={16}/> Arrastra los elementos para posicionarlos
                            </div>
                            
                            {/* Canvas Wrapper */}
                            <div 
                                ref={canvasRef}
                                className="bg-white shadow-2xl relative cursor-crosshair overflow-hidden"
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                style={{ 
                                    width: `${labelConfig.width}mm`, 
                                    height: `${labelConfig.height}mm`,
                                    // Scale up for better visibility while editing (e.g. 3x)
                                    transform: 'scale(3)', 
                                    transformOrigin: 'top center',
                                    marginTop: '50px',
                                    marginBottom: '150px' // Space for scaled element
                                }}
                            >
                                {/* Grid Lines for Guide */}
                                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ddd 1px, transparent 1px)', backgroundSize: '2mm 2mm' }}></div>

                                {(Object.keys(labelConfig.elements) as Array<keyof LabelTemplate['elements']>).map(key => {
                                    const el = labelConfig.elements[key];
                                    if (!el.visible) return null;
                                    
                                    // Content Mock
                                    let content: React.ReactNode = "";
                                    if (key === 'name') content = "Producto Ejemplo";
                                    if (key === 'price') content = "$12.500";
                                    if (key === 'sku') content = "COD-001";
                                    if (key === 'barcode') content = <div className="w-full h-full bg-black/20 flex items-center justify-center text-[4px]">||| || |||</div>;

                                    return (
                                        <div
                                            key={key}
                                            onMouseDown={(e) => handleMouseDown(e, key)}
                                            className={`absolute cursor-move border ${activeElement === key ? 'border-blue-500 bg-blue-50/50 z-20' : 'border-transparent hover:border-gray-300'}`}
                                            style={{
                                                left: `${el.x}mm`,
                                                top: `${el.y}mm`,
                                                fontSize: `${el.fontSize}pt`,
                                                lineHeight: 1,
                                                whiteSpace: 'nowrap',
                                                userSelect: 'none',
                                                width: key === 'barcode' ? '30mm' : 'auto',
                                                height: key === 'barcode' ? '10mm' : 'auto'
                                            }}
                                        >
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* SHEET PREVIEW */}
                    {viewMode === 'PREVIEW_SHEET' && (
                        <div className="w-full h-full overflow-auto flex flex-col items-center">
                            <div className="bg-white shadow-lg p-8 min-h-[297mm] min-w-[210mm] flex flex-wrap content-start gap-1">
                                {printQueue.length === 0 && <p className="w-full text-center text-gray-400 mt-20">Agrega productos a la cola para ver la plancha.</p>}
                                {printQueue.map((item, i) => (
                                    Array.from({ length: item.quantity }).map((_, j) => (
                                        <LabelPreview key={`${i}-${j}`} product={item.product} template={labelConfig} showGrid={true}/>
                                    ))
                                ))}
                            </div>
                            
                            <div className="fixed bottom-8 right-8">
                                <button 
                                    onClick={handlePrint}
                                    disabled={printQueue.length === 0}
                                    className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-slate-800 flex items-center gap-3 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed">
                                    <Printer size={24}/> Imprimir Etiquetas
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- PRINTABLE AREA (HIDDEN ON SCREEN) --- */}
            <div className="hidden print:block absolute top-0 left-0 bg-white w-full h-full z-50">
                <div className="flex flex-wrap content-start gap-1 p-0 m-0">
                    {printQueue.map((item, i) => (
                        Array.from({ length: item.quantity }).map((_, j) => (
                            <LabelPreview key={`${i}-${j}`} product={item.product} template={labelConfig} />
                        ))
                    ))}
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; }
                    body { margin: 0; }
                }
            `}</style>
        </div>
    );
};

export default LabelPrinting;
