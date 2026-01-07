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
    width: number;
    height: number;
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

const createMockProduct = (id: string, internalCode: string, name: string, price: number): Product => ({
  id, internalCodes: [internalCode], barcodes: [internalCode], providerCodes: [],
  name, brand: 'Generico', provider: 'Proveedor', category: 'General', description: '',
  measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
  vatRate: 21, listCost: price * 0.6, discounts: [0, 0, 0, 0], costAfterDiscounts: price * 0.6, profitMargin: 40,
  priceNeto: price / 1.21, priceFinal: price, stock: 100, stockDetails: [], 
  stockMinimo: 10, stockMaximo: 20, reorderPoint: 5,
  location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false },
  isCombo: false,
  comboItems: []
});

const mockProducts: Product[] = [
    createMockProduct('1', 'TOR-001', 'Tornillo T1 Autoperforante', 150),
    createMockProduct('2', 'TAL-022', 'Taladro Percutor 750w', 85000),
    createMockProduct('3', 'LIJ-180', 'Lija al Agua 180', 450),
    createMockProduct('4', 'PINT-20L', 'Látex Interior 20L', 45000),
];

const LabelPreview: React.FC<{ product: Product, template: LabelTemplate, scale?: number, showGrid?: boolean }> = ({ product, template, scale = 1, showGrid = false }) => {
    return (
        <div className={`relative bg-white overflow-hidden ${showGrid ? 'border border-gray-300' : 'border border-gray-100 shadow-sm'}`} style={{ width: `${template.width}mm`, height: `${template.height}mm`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            {template.elements.name.visible && (
                <div className="absolute leading-none font-bold text-gray-800 whitespace-nowrap" style={{ left: `${template.elements.name.x}mm`, top: `${template.elements.name.y}mm`, fontSize: `${template.elements.name.fontSize}pt` }}>{product.name}</div>
            )}
            {template.elements.sku.visible && (
                <div className="absolute leading-none text-gray-500 font-mono" style={{ left: `${template.elements.sku.x}mm`, top: `${template.elements.sku.y}mm`, fontSize: `${template.elements.sku.fontSize}pt` }}>{product.internalCodes[0]}</div>
            )}
            {template.elements.price.visible && (
                <div className="absolute leading-none font-bold text-black" style={{ left: `${template.elements.price.x}mm`, top: `${template.elements.price.y}mm`, fontSize: `${template.elements.price.fontSize}pt` }}>${product.priceFinal.toLocaleString('es-AR')}</div>
            )}
            {template.elements.barcode.visible && (
                <div className="absolute" style={{ left: `${template.elements.barcode.x}mm`, top: `${template.elements.barcode.y}mm`, width: '30mm', height: '10mm', backgroundImage: 'repeating-linear-gradient(90deg, black 0, black 1px, transparent 1px, transparent 3px)' }}></div>
            )}
        </div>
    );
};

const LabelPrinting: React.FC = () => {
    const [viewMode, setViewMode] = useState<'DESIGN' | 'PREVIEW_SHEET'>('DESIGN');
    const [searchTerm, setSearchTerm] = useState('');
    const [printQueue, setPrintQueue] = useState<ProductToPrint[]>([]);
    const [labelConfig, setLabelConfig] = useState<LabelTemplate>({
        width: 50, height: 25,
        elements: {
            name: { x: 2, y: 2, visible: true, fontSize: 10 },
            price: { x: 2, y: 12, visible: true, fontSize: 16 },
            sku: { x: 30, y: 2, visible: true, fontSize: 8 },
            barcode: { x: 2, y: 18, visible: true, fontSize: 20 },
        }
    });

    const [activeElement, setActiveElement] = useState<keyof LabelTemplate['elements'] | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    const addToQueue = (product: Product) => {
        setPrintQueue(prev => {
            const exists = prev.find(p => p.product.id === product.id);
            if (exists) return prev.map(p => p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromQueue = (id: string) => setPrintQueue(prev => prev.filter(p => p.product.id !== id));

    const filteredProducts = mockProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.internalCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())));

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !activeElement || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const pxPerMmX = rect.width / labelConfig.width;
        const pxPerMmY = rect.height / labelConfig.height;
        const xMm = Math.round((e.clientX - rect.left) / pxPerMmX);
        const yMm = Math.round((e.clientY - rect.top) / pxPerMmY);
        setLabelConfig(prev => ({ ...prev, elements: { ...prev.elements, [activeElement]: { ...prev.elements[activeElement], x: xMm, y: yMm } } }));
    };

    return (
        <div className="flex h-full flex-col bg-gray-100 overflow-hidden relative">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center print:hidden">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Tag size={24} className="text-ferre-orange"/> Etiquetas</h2>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('DESIGN')} className={`px-4 py-2 rounded-lg font-bold text-sm ${viewMode === 'DESIGN' ? 'bg-slate-800 text-white' : 'bg-white'}`}>Diseñador</button>
                    <button onClick={() => setViewMode('PREVIEW_SHEET')} className={`px-4 py-2 rounded-lg font-bold text-sm ${viewMode === 'PREVIEW_SHEET' ? 'bg-slate-800 text-white' : 'bg-white'}`}>Plancha</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden print:hidden">
                <div className="w-1/3 min-w-[350px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto p-6 space-y-6">
                    <input type="text" placeholder="Buscar producto..." className="w-full p-2 border rounded text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    {searchTerm && (
                        <div className="border rounded bg-gray-50 max-h-40 overflow-auto">
                            {filteredProducts.map(p => (
                                <button key={p.id} onClick={() => addToQueue(p)} className="w-full text-left px-3 py-2 text-xs border-b hover:bg-orange-50 flex justify-between uppercase">
                                    <span className="font-bold truncate">{p.name}</span>
                                    <span className="font-mono text-gray-400">{p.internalCodes[0]}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="space-y-2">
                        {printQueue.map(item => (
                            <div key={item.product.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                                <span className="text-xs font-bold uppercase truncate flex-1">{item.product.name}</span>
                                <div className="flex items-center gap-2 ml-2">
                                    <input type="number" className="w-12 text-center p-1 border rounded text-xs" value={item.quantity} onChange={e => setPrintQueue(printQueue.map(q => q.product.id === item.product.id ? {...q, quantity: parseInt(e.target.value)||1} : q))}/>
                                    <button onClick={() => removeFromQueue(item.product.id)}><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-gray-200 flex flex-col items-center justify-center p-8 overflow-auto">
                    <div ref={canvasRef} onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(false)} className="bg-white shadow-2xl relative cursor-crosshair" style={{ width: `${labelConfig.width}mm`, height: `${labelConfig.height}mm`, transform: 'scale(3)', transformOrigin: 'center' }}>
                         {(Object.keys(labelConfig.elements) as Array<keyof LabelTemplate['elements']>).map(key => {
                            const el = labelConfig.elements[key];
                            if (!el.visible) return null;
                            return (
                                <div key={key} onMouseDown={e => { setActiveElement(key); setIsDragging(true); }} className={`absolute cursor-move select-none ${activeElement === key ? 'ring-1 ring-blue-500' : ''}`} style={{ left: `${el.x}mm`, top: `${el.y}mm`, fontSize: `${el.fontSize}pt`, whiteSpace: 'nowrap' }}>
                                    {key === 'name' ? 'Ejemplo' : key === 'price' ? '$0.00' : key === 'sku' ? 'SKU' : '||||||'}
                                </div>
                            );
                         })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabelPrinting;
