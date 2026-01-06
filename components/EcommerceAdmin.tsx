
import React, { useState, useMemo, useRef } from 'react';
import { 
    Globe, Search, Star, Percent,
    Eye, EyeOff, Package, Camera, Upload, X, Image as ImageIcon,
    LayoutGrid, List, CheckCircle2, TrendingUp, Sparkles, Filter,
    // Fix: Added missing icon imports
    RefreshCw, Tag
} from 'lucide-react';
import { Product } from '../types';

const EcommerceAdmin: React.FC = () => {
    const [products, setProducts] = useState<Product[]>(() => 
        JSON.parse(localStorage.getItem('ferrecloud_products') || '[]')
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState<'ALL' | 'PUBLISHED' | 'OFFERS' | 'FEATURED'>('ALL');
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const filtered = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (p.internalCodes || []).some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
            if (filterMode === 'PUBLISHED') return matchesSearch && p.ecommerce?.isPublished;
            if (filterMode === 'OFFERS') return matchesSearch && p.ecommerce?.isOffer;
            if (filterMode === 'FEATURED') return matchesSearch && p.ecommerce?.isFeatured;
            return matchesSearch;
        }).sort((a, b) => (b.ecommerce?.isPublished ? 1 : 0) - (a.ecommerce?.isPublished ? 1 : 0));
    }, [products, searchTerm, filterMode]);

    const stats = useMemo(() => ({
        total: products.length,
        published: products.filter(p => p.ecommerce?.isPublished).length,
        offers: products.filter(p => p.ecommerce?.isOffer).length,
        featured: products.filter(p => p.ecommerce?.isFeatured).length
    }), [products]);

    const handleUpdateProduct = (id: string, updates: any) => {
        const newProducts = products.map(p => {
            if (p.id === id) {
                return { ...p, ecommerce: { ...(p.ecommerce || {}), ...updates } };
            }
            return p;
        });
        setProducts(newProducts);
        localStorage.setItem('ferrecloud_products', JSON.stringify(newProducts));
        window.dispatchEvent(new Event('storage'));
    };

    const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            handleUpdateProduct(id, { imageUrl: base64 });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-6 animate-fade-in bg-slate-50 overflow-hidden font-sans">
            {/* CABECERA CON KPIs */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><Globe size={32}/></div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Canal de Venta Online</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Visibilidad de los 140.000 artículos en la web</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    {[
                        { label: 'Publicados', val: stats.published, icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'En Oferta', val: stats.offers, icon: Percent, color: 'text-orange-500', bg: 'bg-orange-50' },
                        { label: 'Destacados', val: stats.featured, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' }
                    ].map(st => (
                        <div key={st.label} className={`${st.bg} ${st.color} px-6 py-4 rounded-[1.8rem] border border-white shadow-sm text-center min-w-[120px]`}>
                            <p className="text-[9px] font-black uppercase mb-1 tracking-widest">{st.label}</p>
                            <p className="text-2xl font-black tracking-tighter">{st.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* FILTROS Y BÚSQUEDA */}
            <div className="flex flex-col lg:flex-row gap-4 bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm shrink-0 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Buscar artículo en el inventario maestro para publicar..." 
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all uppercase"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 rounded-2xl p-1.5 shrink-0 w-full lg:w-auto shadow-inner border border-slate-200">
                    {[
                        { id: 'ALL', label: 'Todos', icon: List },
                        { id: 'PUBLISHED', label: 'En Tienda', icon: Globe },
                        { id: 'OFFERS', label: 'Ofertas', icon: Percent },
                        { id: 'FEATURED', label: 'Portadas', icon: Star }
                    ].map(btn => (
                        <button 
                            key={btn.id}
                            onClick={() => setFilterMode(btn.id as any)} 
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filterMode === btn.id ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-slate-600'}`}>
                            <btn.icon size={14}/> {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* LISTADO DE GESTIÓN */}
            <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="grid grid-cols-1 gap-6 pb-20">
                        {filtered.length === 0 ? (
                            <div className="py-40 text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto"><Package size={40} className="text-slate-200"/></div>
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sin artículos para mostrar</p>
                            </div>
                        ) : filtered.map(p => (
                            <div key={p.id} className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col lg:flex-row items-center gap-8 ${p.ecommerce?.isPublished ? 'border-indigo-100 bg-indigo-50/20 shadow-sm' : 'border-slate-50 bg-white opacity-60 hover:opacity-100'}`}>
                                
                                {/* CARGA DE IMAGEN COMERCIAL */}
                                <div className="shrink-0 relative group">
                                    <input 
                                        type="file" 
                                        ref={el => { fileInputRefs.current[p.id] = el; }}
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(p.id, e)}
                                    />
                                    <div 
                                        onClick={() => fileInputRefs.current[p.id]?.click()}
                                        className={`w-36 h-36 rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${p.ecommerce?.imageUrl ? 'border-white bg-white shadow-xl' : 'border-slate-200 bg-slate-50 hover:border-indigo-400'}`}
                                    >
                                        {p.ecommerce?.imageUrl ? (
                                            <div className="relative w-full h-full">
                                                <img src={p.ecommerce.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                                                    <RefreshCw className="mb-1" size={24}/>
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Cambiar</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Camera className="text-slate-300 mb-2" size={32} strokeWidth={1.5}/>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Subir Foto E-comm</span>
                                            </>
                                        )}
                                    </div>
                                    {p.ecommerce?.imageUrl && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleUpdateProduct(p.id, { imageUrl: null }); }}
                                            className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-xl hover:bg-red-600 transition-colors border-4 border-white"
                                        >
                                            <X size={14}/>
                                        </button>
                                    )}
                                </div>

                                {/* INFO PRINCIPAL */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${p.ecommerce?.isPublished ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                            {p.ecommerce?.isPublished ? 'PUBLICADO EN WEB' : 'MODO BORRADOR'}
                                        </span>
                                        {p.ecommerce?.isOffer && <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Oferta Activa</span>}
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-xl tracking-tight leading-none mb-3 truncate">{p.name || 'SIN NOMBRE'}</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Tag size={12} className="text-slate-300"/>
                                            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-tighter">SKU: {p.internalCodes?.[0] || 'S/C'}</span>
                                        </div>
                                        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid size={12} className="text-slate-300"/>
                                            <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">{p.category || 'General'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* CONTROLES DE PUBLICACIÓN */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full lg:w-auto shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-10">
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tienda</p>
                                        <button 
                                            onClick={() => handleUpdateProduct(p.id, { isPublished: !p.ecommerce?.isPublished })}
                                            className={`w-14 h-14 rounded-2xl transition-all shadow-lg flex items-center justify-center ${p.ecommerce?.isPublished ? 'bg-indigo-600 text-white shadow-indigo-200 scale-110' : 'bg-white border-2 border-slate-100 text-slate-300 hover:border-indigo-400'}`}>
                                            {p.ecommerce?.isPublished ? <CheckCircle2 size={24}/> : <EyeOff size={24}/>}
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Oferta</p>
                                        <button 
                                            onClick={() => handleUpdateProduct(p.id, { isOffer: !p.ecommerce?.isOffer, offerPrice: !p.ecommerce?.isOffer ? (p.priceFinal * 0.9).toFixed(0) : null })}
                                            className={`w-14 h-14 rounded-2xl transition-all shadow-lg flex items-center justify-center ${p.ecommerce?.isOffer ? 'bg-orange-50 text-white shadow-orange-100 scale-110' : 'bg-white border-2 border-slate-100 text-slate-300 hover:border-orange-400'}`}>
                                            <Percent size={24}/>
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Favorito</p>
                                        <button 
                                            onClick={() => handleUpdateProduct(p.id, { isFeatured: !p.ecommerce?.isFeatured })}
                                            className={`w-14 h-14 rounded-2xl transition-all shadow-lg flex items-center justify-center ${p.ecommerce?.isFeatured ? 'bg-yellow-400 text-slate-900 shadow-yellow-100 scale-110' : 'bg-white border-2 border-slate-100 text-slate-300 hover:border-yellow-400'}`}>
                                            <Star size={24} className={p.ecommerce?.isFeatured ? 'fill-slate-900' : ''}/>
                                        </button>
                                    </div>

                                    <div className="flex col-span-2 md:col-span-1 flex-col gap-2 min-w-[150px]">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Online</p>
                                        <div className="relative group">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">$</span>
                                            <input 
                                                type="number" 
                                                className={`w-full pl-7 p-3 rounded-xl text-sm font-black outline-none border-2 transition-all ${p.ecommerce?.isOffer ? 'bg-orange-50 border-orange-200 text-orange-600 focus:bg-white' : 'bg-slate-50 border-slate-100 text-slate-900 focus:bg-white focus:border-indigo-600'}`}
                                                value={p.ecommerce?.isOffer ? (p.ecommerce?.offerPrice || 0) : p.priceFinal}
                                                readOnly={!p.ecommerce?.isOffer}
                                                onChange={e => handleUpdateProduct(p.id, { offerPrice: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EcommerceAdmin;
