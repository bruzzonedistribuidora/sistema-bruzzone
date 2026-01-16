
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Globe, Search, Star, Percent,
    Eye, Package, Camera, Upload, X, Image as ImageIcon,
    CheckCircle2, TrendingUp, Sparkles, Filter,
    RefreshCw, Tag, ChevronUp, ChevronDown, FolderOpen, 
    ArrowRight, ShoppingBag, Plus, Trash2, Layers, Check,
    DollarSign, Smartphone, ShoppingCart, Globe2, 
    CheckSquare, Square, Zap, Power, List, CloudUpload,
    CloudDownload, ShieldAlert, ExternalLink, Share2, Copy,
    MessageCircle, QrCode, Printer, Mail, Instagram, Facebook
} from 'lucide-react';
import { Product, ViewState, CompanyConfig } from '../types';
import { productDB } from '../services/storageService';

// --- SUBCOMPONENTES AUXILIARES ---

function PlatformBtn({ active, label, color, onClick }: { active?: boolean, label: string, color: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black transition-all border-2 ${active ? `${color} border-white shadow-md scale-110` : 'bg-slate-50 text-slate-300 border-slate-100 hover:border-slate-200'}`}>{label}</button>
    );
}

function BulkPlatformBtn({ onClick, icon: Icon, label, color, textColor }: { onClick: () => void, icon: any, label: string, color: string, textColor: string }) {
    return (
        <button onClick={onClick} className={`${color} ${textColor} px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg`}><Icon size={14}/> {label}</button>
    );
}

function FolderBtn({ active, onClick, icon: Icon, label, count, color }: { active: boolean, onClick: () => void, icon: any, label: string, count: number, color: string }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all group ${active ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]' : 'hover:bg-slate-50 text-slate-500'}`}>
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'} transition-colors`}><Icon size={18}/></div>
                <span className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${active ? 'bg-white/10 border-white/20 text-indigo-300' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>{count.toLocaleString()}</span>
        </button>
    );
}

function QuickBadge({ active, onClick, label, icon: Icon, color }: { active?: boolean, onClick: () => void, label: string, icon: any, color: 'indigo' | 'orange' | 'yellow' }) {
    const colors = {
        indigo: active ? 'bg-indigo-600 text-white border-indigo-400' : 'text-slate-300 border-slate-100',
        orange: active ? 'bg-orange-500 text-white border-orange-400' : 'text-slate-300 border-slate-100',
        yellow: active ? 'bg-yellow-400 text-slate-900 border-yellow-500' : 'text-slate-300 border-slate-100'
    };
    return (
        <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[8px] uppercase tracking-widest transition-all ${colors[color]} hover:border-slate-300`}>
            <Icon size={10} className={active && color === 'yellow' ? 'fill-slate-900' : ''}/> {label} {active && <Check size={8} strokeWidth={4}/>}
        </button>
    );
}

type EcommerceFolder = 'ALL' | 'PUBLISHED' | 'OFFERS' | 'FEATURED';

const EcommerceAdmin: React.FC<{ onNavigate?: (view: ViewState) => void }> = ({ onNavigate }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [activeFolder, setActiveFolder] = useState<EcommerceFolder>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [isApplying, setIsApplying] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { fantasyName: 'Ferretería' };
    }, []);

    const loadProducts = async () => {
        setIsApplying(true);
        const all = await productDB.getAll();
        setProducts(all);
        setTimeout(() => setIsApplying(false), 500);
    };

    useEffect(() => {
        loadProducts();
        window.addEventListener('ferrecloud_products_updated', loadProducts);
        return () => window.removeEventListener('ferrecloud_products_updated', loadProducts);
    }, []);

    const stats = useMemo(() => ({
        total: products.length,
        published: products.filter(p => p.ecommerce?.isPublished).length,
        offers: products.filter(p => p.ecommerce?.isOffer).length,
        featured: products.filter(p => p.ecommerce?.isFeatured).length
    }), [products]);

    const filteredAndSorted = useMemo(() => {
        let items = products.filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (p.internalCodes || []).some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (activeFolder === 'PUBLISHED') return matchesSearch && p.ecommerce?.isPublished;
            if (activeFolder === 'OFFERS') return matchesSearch && p.ecommerce?.isOffer;
            if (activeFolder === 'FEATURED') return matchesSearch && p.ecommerce?.isFeatured;
            return matchesSearch;
        });

        items.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortConfig.key) {
                case 'name':
                    aValue = (a.name || '').toLowerCase();
                    bValue = (b.name || '').toLowerCase();
                    break;
                case 'price':
                    aValue = a.priceFinal || 0;
                    bValue = b.priceFinal || 0;
                    break;
                case 'stock':
                    aValue = a.stock || 0;
                    bValue = b.stock || 0;
                    break;
                default:
                    aValue = ''; bValue = '';
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return items.slice(0, 150); 
    }, [products, searchTerm, activeFolder, sortConfig]);

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredAndSorted.length && filteredAndSorted.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAndSorted.map(p => p.id)));
        }
    };

    const toggleSelectOne = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleUpdateProduct = async (id: string, updates: any) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        
        const updated = { 
            ...product, 
            ecommerce: { ...(product.ecommerce || {}), ...updates } 
        };
        
        if (updates.mercadoLibre || updates.tiendaNube || updates.webPropia) {
            updated.ecommerce.isPublished = true;
        }

        await productDB.save(updated);
        setProducts(prev => prev.map(p => p.id === id ? updated : p));
    };

    const handleBulkPlatformUpdate = async (platform: 'mercadoLibre' | 'tiendaNube' | 'webPropia' | 'ALL', value: boolean) => {
        if (selectedIds.size === 0) return;

        if (value) {
            const meliConfig = JSON.parse(localStorage.getItem('sync_meli') || '{}');
            if (platform === 'mercadoLibre' || platform === 'ALL') {
                if (meliConfig.status !== 'CONNECTED') {
                    alert("❌ Error: Mercado Libre no está autenticado.");
                    return;
                }
            }
        }

        setIsApplying(true);
        const updatedProducts = products.filter(p => selectedIds.has(p.id)).map(p => {
            const ecom = { ...(p.ecommerce || {}) };
            if (platform === 'ALL') {
                ecom.mercadoLibre = value; ecom.tiendaNube = value; ecom.webPropia = value; ecom.isPublished = value;
            } else {
                ecom[platform] = value;
                if (value) ecom.isPublished = true;
            }
            return { ...p, ecommerce: ecom };
        });

        await productDB.saveBulk(updatedProducts);
        await loadProducts();
        setIsApplying(false);
        setSelectedIds(new Set());
    };

    const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            await handleUpdateProduct(id, { imageUrl: base64 });
        };
        reader.readAsDataURL(file);
    };

    const openStore = () => {
        if (onNavigate) {
            onNavigate(ViewState.SHOP);
        } else {
            window.open(window.location.origin + '/shop', '_blank');
        }
    };

    const storeLink = window.location.origin + '/shop';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(storeLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsApp = () => {
        const businessName = companyConfig.fantasyName || 'nuestra ferretería';
        const msg = `¡Hola! 👋 Te invito a conocer nuestra tienda online de ${businessName}. Podés ver todo nuestro catálogo y hacer tu pedido desde acá: ${storeLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="flex h-full bg-slate-100 font-sans overflow-hidden animate-fade-in relative">
            
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Globe className="text-indigo-400" size={24}/> Catálogo Web
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Administrador de Visibilidad</p>
                </div>

                <div className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-4">Filtrar por Carpeta</p>
                    
                    <FolderBtn active={activeFolder === 'ALL'} onClick={() => {setActiveFolder('ALL'); setSelectedIds(new Set());}} icon={List} label="Todo el Catálogo" count={stats.total} color="text-slate-500" />
                    <FolderBtn active={activeFolder === 'PUBLISHED'} onClick={() => {setActiveFolder('PUBLISHED'); setSelectedIds(new Set());}} icon={Globe} label="Escaparate Web" count={stats.published} color="text-indigo-600" />
                    <FolderBtn active={activeFolder === 'OFFERS'} onClick={() => {setActiveFolder('OFFERS'); setSelectedIds(new Set());}} icon={Percent} label="Carpeta de Ofertas" count={stats.offers} color="text-orange-500" />
                    <FolderBtn active={activeFolder === 'FEATURED'} onClick={() => {setActiveFolder('FEATURED'); setSelectedIds(new Set());}} icon={Star} label="Carpeta Destacados" count={stats.featured} color="text-yellow-500" />
                
                    <div className="pt-8 space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">Canales de Venta</p>
                        <button 
                            onClick={openStore}
                            className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm">
                            <ShoppingBag size={18}/> Ver mi Tienda Online
                        </button>
                        <button 
                            onClick={() => setIsShareModalOpen(true)}
                            className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm border border-emerald-100">
                            <Share2 size={18}/> Compartir con Clientes
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <button onClick={loadProducts} disabled={isApplying} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-50">
                        {isApplying ? <RefreshCw className="animate-spin" size={14}/> : <CloudDownload size={14}/>} 
                        {isApplying ? 'Sincronizando...' : 'Refrescar Datos'}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
                <div className="p-6 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="relative flex-1 group w-full max-w-xl">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                        <input 
                            type="text" 
                            placeholder="Buscar artículos por nombre o SKU..." 
                            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 shadow-inner transition-all uppercase"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden p-6 pb-24">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-5 w-10 text-center">
                                            <button onClick={toggleSelectAll}>
                                                {selectedIds.size === filteredAndSorted.length && filteredAndSorted.length > 0 ? <CheckSquare size={18} className="text-indigo-400"/> : <Square size={18} className="text-slate-500"/>}
                                            </button>
                                        </th>
                                        <th className="px-4 py-5">Visual</th>
                                        <th className="px-4 py-5">Nombre / SKU</th>
                                        <th className="px-4 py-5 text-right">Precio Actual</th>
                                        <th className="px-4 py-5 text-center">Publicar en Canal</th>
                                        <th className="px-8 py-5 text-center">Destacar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAndSorted.map(p => (
                                        <tr key={p.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(p.id) ? 'bg-indigo-50/50' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => toggleSelectOne(p.id)}>
                                                    {selectedIds.has(p.id) ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18} className="text-slate-200"/>}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4">
                                                <input type="file" ref={el => { fileInputRefs.current[p.id] = el; }} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(p.id, e)} />
                                                <div 
                                                    onClick={() => fileInputRefs.current[p.id]?.click()}
                                                    className={`w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${p.ecommerce?.imageUrl ? 'border-white bg-white shadow-sm' : 'border-slate-200 bg-slate-50'}`}
                                                >
                                                    {p.ecommerce?.imageUrl ? (
                                                        <img src={p.ecommerce.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                                                    ) : (
                                                        <Camera className="text-slate-300" size={18}/>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <h4 className="font-black text-slate-800 uppercase text-xs truncate max-w-[280px]">{p.name}</h4>
                                                <p className="text-[9px] font-mono font-bold text-indigo-500 uppercase bg-indigo-50 w-fit px-1.5 py-0.5 rounded mt-1">SKU: {p.internalCodes[0]}</p>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <p className="text-sm font-black text-slate-900 tracking-tighter">${p.priceFinal.toLocaleString()}</p>
                                                {p.ecommerce?.isOffer && <span className="text-[8px] text-orange-500 font-black uppercase">OFERTA ACTIVA</span>}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <PlatformBtn active={p.ecommerce?.mercadoLibre} label="M" color="bg-[#FFF159] text-gray-800" onClick={() => handleUpdateProduct(p.id, { mercadoLibre: !p.ecommerce?.mercadoLibre })} />
                                                    <PlatformBtn active={p.ecommerce?.tiendaNube} label="N" color="bg-[#00AEEF] text-white" onClick={() => handleUpdateProduct(p.id, { tiendaNube: !p.ecommerce?.tiendaNube })} />
                                                    <PlatformBtn active={p.ecommerce?.webPropia} label="W" color="bg-indigo-600 text-white" onClick={() => handleUpdateProduct(p.id, { webPropia: !p.ecommerce?.webPropia })} />
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <QuickBadge active={p.ecommerce?.isOffer} onClick={() => handleUpdateProduct(p.id, { isOffer: !p.ecommerce?.isOffer })} label="Ofe" icon={Percent} color="orange" />
                                                    <QuickBadge active={p.ecommerce?.isFeatured} onClick={() => handleUpdateProduct(p.id, { isFeatured: !p.ecommerce?.isFeatured })} label="Top" icon={Star} color="yellow" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {selectedIds.size > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl bg-slate-900 rounded-[2.5rem] shadow-2xl p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in z-[250]">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse">
                            <CheckSquare size={24}/>
                        </div>
                        <div>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Sincronización Masiva</p>
                            <h4 className="text-white font-black text-lg leading-none">{selectedIds.size} ítems listos</h4>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                        <button onClick={() => handleBulkPlatformUpdate('ALL', true)} disabled={isApplying} className="bg-indigo-50 text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-400 transition-all active:scale-95 shadow-xl shadow-indigo-500/20">
                            {isApplying ? <RefreshCw className="animate-spin" size={16}/> : <CloudUpload size={16}/>}
                            Sincronizar Canales
                        </button>
                        
                        <div className="h-10 w-px bg-white/10 mx-2 hidden md:block"></div>

                        <BulkPlatformBtn onClick={() => handleBulkPlatformUpdate('mercadoLibre', true)} icon={ShoppingCart} label="M. Libre" color="bg-[#FFF159]" textColor="text-gray-800" />
                        <BulkPlatformBtn onClick={() => handleBulkPlatformUpdate('tiendaNube', true)} icon={Globe2} label="T. Nube" color="bg-[#00AEEF]" textColor="text-white" />
                        <BulkPlatformBtn onClick={() => handleBulkPlatformUpdate('webPropia', true)} icon={Globe} label="Mi Web" color="bg-indigo-600" textColor="text-white" />

                        <button onClick={() => handleBulkPlatformUpdate('ALL', false)} className="bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Despublicar</button>
                    </div>

                    <button onClick={() => setSelectedIds(new Set())} className="p-3 text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
                </div>
            )}

            {/* MODAL DE COMPARTIR TIENDA (NUEVO) */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg"><Share2 size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-widest leading-none">Compartir Mi Tienda</h3>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Marketing de Venta Directa</p>
                                </div>
                            </div>
                            <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                        </div>
                        
                        <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar bg-slate-50/50">
                            <div className="text-center space-y-4">
                                <p className="text-sm text-slate-500 font-medium italic">Enviá este link a tus clientes para que compren online:</p>
                                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-between gap-4 shadow-inner group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left ml-1">URL de la Tienda</p>
                                        <p className="text-lg font-mono font-black text-indigo-600 truncate">{storeLink}</p>
                                    </div>
                                    <button 
                                        onClick={handleCopyLink}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all shadow-md ${copied ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                                        {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
                                    <div className="p-4 bg-green-50 text-green-600 rounded-[2rem]"><MessageCircle size={32}/></div>
                                    <div>
                                        <h4 className="font-black uppercase text-sm tracking-tight">Difusión WhatsApp</h4>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">Enviar invitación pre-armada</p>
                                    </div>
                                    <button 
                                        onClick={handleShareWhatsApp}
                                        className="w-full bg-green-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all active:scale-95">
                                        Abrir WhatsApp
                                    </button>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[2rem] group relative">
                                        <QrCode size={32}/>
                                    </div>
                                    <div>
                                        <h4 className="font-black uppercase text-sm tracking-tight">QR para Mostrador</h4>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">Imprimir para el local</p>
                                    </div>
                                    <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                                        <Printer size={14}/> Imprimir QR
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-500"/> Compartir en Redes Sociales
                                </h4>
                                <div className="flex gap-4">
                                    <button className="p-4 bg-white border border-slate-200 rounded-2xl text-pink-600 hover:bg-pink-50 transition-all flex-1 flex flex-col items-center gap-1">
                                        <Instagram size={20}/>
                                        <span className="text-[8px] font-black">STORY</span>
                                    </button>
                                    <button className="p-4 bg-white border border-slate-200 rounded-2xl text-blue-600 hover:bg-blue-50 transition-all flex-1 flex flex-col items-center gap-1">
                                        <Facebook size={20}/>
                                        <span className="text-[8px] font-black">POST</span>
                                    </button>
                                    <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all flex-1 flex flex-col items-center gap-1">
                                        <Mail size={20}/>
                                        <span className="text-[8px] font-black">EMAIL</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-white border-t border-slate-100 flex justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bruzzone Online Store • Venta Directa Cloud</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EcommerceAdmin;
