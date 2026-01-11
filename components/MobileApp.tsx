
import React, { useState, useEffect } from 'react';
import { 
    Search, ShoppingCart, Package, Truck, 
    Bell, Plus, ChevronRight, X, Trash2, 
    CheckCircle, Smartphone, Home, 
    History, User, LogOut, Zap, AlertTriangle, 
    ClipboardList, RefreshCw, CloudDownload,
    Network, Wifi
} from 'lucide-react';
import { Product, InvoiceItem } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';
import { syncService } from '../services/syncService';

const MobileApp: React.FC<{ user: any, onLogout: () => void }> = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'HOME' | 'STOCK' | 'SALES' | 'SHORTAGES'>('HOME');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [cart, setCart] = useState<InvoiceItem[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Estado de sincronización
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [needsInitialSync, setNeedsInitialSync] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            const stats = await productDB.getStats();
            if (stats.count === 0 && syncService.getVaultId()) {
                setNeedsInitialSync(true);
            }
        };
        checkStatus();

        const handleProgress = (e: any) => setSyncProgress(e.detail.progress);
        window.addEventListener('ferrecloud_sync_progress', handleProgress);
        return () => window.removeEventListener('ferrecloud_sync_progress', handleProgress);
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            if (searchTerm.length > 2) {
                const results = await productDB.search(searchTerm);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        };
        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleInitialSync = async () => {
        setIsSyncing(true);
        const success = await syncService.syncFromRemote();
        setIsSyncing(false);
        if (success) {
            setNeedsInitialSync(false);
            alert("✅ Sistema listo para usar con 140k artículos.");
        } else {
            alert("❌ No se pudo conectar con la nube. Revisa tu ID de Bóveda.");
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const exists = prev.find(i => i.product.id === product.id);
            if (exists) {
                return prev.map(i => i.product.id === product.id ? 
                    { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice } : i);
            }
            return [...prev, { product, quantity: 1, appliedPrice: product.priceFinal, subtotal: product.priceFinal }];
        });
    };

    const cartTotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col font-sans text-slate-900 safe-area-inset overflow-hidden">
            
            {/* TOP BAR CON PULSO DE RED */}
            <header className="bg-slate-900 text-white px-5 h-16 flex items-center justify-between shrink-0 shadow-lg z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <h1 className="font-black text-sm uppercase tracking-tighter">FerreCloud</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                        <div className={`w-1.5 h-1.5 rounded-full ${syncService.getVaultId() ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">CLOUD</span>
                    </div>
                    <button onClick={() => setIsMenuOpen(true)}>
                        <User size={24} className="text-slate-400" />
                    </button>
                </div>
            </header>

            {/* MODAL DE PRIMERA SINCRONIZACIÓN */}
            {needsInitialSync && (
                <div className="fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center p-6 text-center text-white">
                    <div className="space-y-8 animate-fade-in max-w-xs">
                        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/30">
                            <CloudDownload size={48}/>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Dispositivo Nuevo</h2>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Hemos detectado que este celular no tiene la base de datos de artículos. Pulsa abajo para descargarla de tu nube.
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Tu ID de Bóveda:</p>
                            <p className="text-lg font-black tracking-widest">{syncService.getVaultId()}</p>
                        </div>
                        <button 
                            onClick={handleInitialSync}
                            disabled={isSyncing}
                            className="w-full bg-white text-slate-900 py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-3">
                            {isSyncing ? <RefreshCw className="animate-spin" size={20}/> : <Wifi size={20}/>}
                            {isSyncing ? `DESCARGANDO ${syncProgress}%` : 'VINCULAR AHORA'}
                        </button>
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto pb-24 custom-scrollbar">
                {activeTab === 'HOME' && (
                    <div className="p-5 space-y-6 animate-fade-in">
                        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12"><Smartphone size={120}/></div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ferretería Sincronizada</p>
                            <h2 className="text-2xl font-black mt-1">Modo Móvil Activo</h2>
                            <div className="mt-6 flex gap-2">
                                <button onClick={() => setActiveTab('STOCK')} className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col items-center gap-1">
                                    <Search size={16}/>
                                    <span className="text-[8px] font-black uppercase">Buscar</span>
                                </button>
                                <button onClick={() => setActiveTab('SALES')} className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col items-center gap-1">
                                    <ShoppingCart size={16}/>
                                    <span className="text-[8px] font-black uppercase">Vender</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setActiveTab('STOCK')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-all">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Package size={24}/></div>
                                <span className="text-[10px] font-black uppercase text-slate-500">Catálogo</span>
                            </button>
                            <button onClick={() => setActiveTab('SHORTAGES')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-all">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><AlertTriangle size={24}/></div>
                                <span className="text-[10px] font-black uppercase text-slate-500">Faltantes</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'STOCK' && (
                    <div className="p-5 space-y-4 animate-fade-in">
                        <div className="sticky top-0 z-20 bg-slate-50 pb-2">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar en el local..."
                                    className="w-full pl-12 pr-10 py-4 bg-white border-2 border-transparent rounded-2xl shadow-sm font-bold text-sm outline-none focus:border-indigo-500 transition-all uppercase"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            {searchResults.map(p => (
                                <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-black uppercase text-xs text-slate-800 leading-tight">{p.name}</h4>
                                            <p className="text-[9px] font-mono font-bold text-indigo-500 mt-1 uppercase">{p.internalCodes[0]}</p>
                                        </div>
                                        <p className="text-lg font-black text-slate-900">${p.priceFinal.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${p.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            Stock: {p.stock}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => addToCart(p)} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-90 transition-transform">
                                                <Plus size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'SALES' && (
                    <div className="p-5 space-y-6 animate-fade-in">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                            <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                <ShoppingCart size={16} className="text-indigo-600"/> Carrito Móvil
                            </h3>
                            <div className="space-y-3 min-h-[100px]">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase truncate max-w-[150px]">{item.product.name}</p>
                                            <p className="text-[9px] text-indigo-500 font-bold">{item.quantity} x ${item.appliedPrice.toLocaleString()}</p>
                                        </div>
                                        <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-300 p-2"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                                {cart.length === 0 && (
                                    <p className="text-center py-10 text-xs text-slate-300 uppercase font-black tracking-widest">El carrito está vacío</p>
                                )}
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                <p className="text-3xl font-black text-slate-900">${cartTotal.toLocaleString()}</p>
                            </div>
                            <button disabled={cart.length === 0} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
                                ENVIAR A CAJA
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <nav className="fixed bottom-0 left-0 w-full h-20 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
                <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center gap-1 ${activeTab === 'HOME' ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <Home size={24}/>
                    <span className="text-[8px] font-black uppercase">Inicio</span>
                </button>
                <button onClick={() => setActiveTab('STOCK')} className={`flex flex-col items-center gap-1 ${activeTab === 'STOCK' ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <Search size={24}/>
                    <span className="text-[8px] font-black uppercase">Stock</span>
                </button>
                <button onClick={() => setActiveTab('SALES')} className={`flex flex-col items-center gap-1 ${activeTab === 'SALES' ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <ShoppingCart size={24}/>
                    <span className="text-[8px] font-black uppercase">Venta</span>
                </button>
                <button onClick={() => setIsMenuOpen(true)} className="flex flex-col items-center gap-1 text-slate-400">
                    <User size={24}/>
                    <span className="text-[8px] font-black uppercase">Perfil</span>
                </button>
            </nav>

            {isMenuOpen && (
                <div className="fixed inset-0 z-[300] bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
                    <div className="absolute top-0 right-0 h-full w-[80%] bg-white p-8 flex flex-col rounded-l-[3rem] animate-slide-in-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="font-black uppercase text-xl">Menú Móvil</h3>
                            <button onClick={() => setIsMenuOpen(false)}><X size={28}/></button>
                        </div>
                        <div className="space-y-4">
                            <button onClick={() => { syncService.syncFromRemote(); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-xs uppercase transition-all">
                                <RefreshCw size={18}/> Forzar Sincronización
                            </button>
                            <button onClick={onLogout} className="w-full flex items-center gap-4 p-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase transition-all">
                                <LogOut size={18}/> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileApp;
