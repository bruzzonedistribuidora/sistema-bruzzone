
import React, { useState, useEffect, useMemo } from 'react';
// Added missing icon imports from lucide-react to fix "Cannot find name" errors
import { 
    Search, ShoppingCart, Package, Truck, Users, 
    Menu, Bell, Plus, Filter, ChevronRight, 
    ArrowLeft, Send, Trash2, CheckCircle, 
    Smartphone, Camera, Barcode, Home, 
    History, MoreHorizontal, User, LogOut,
    Zap, AlertTriangle, FileText, ClipboardList,
    X, Settings, ShieldCheck, Info
} from 'lucide-react';
import { Product, ViewState, Client, InvoiceItem, ReplenishmentItem } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';

const MobileApp: React.FC<{ user: any, onLogout: () => void }> = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'HOME' | 'STOCK' | 'SALES' | 'SHORTAGES'>('HOME');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [cart, setCart] = useState<InvoiceItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // --- CARGA DE DATOS ---
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

    const addToCart = (product: Product) => {
        setCart(prev => {
            const exists = prev.find(i => i.product.id === product.id);
            if (exists) {
                return prev.map(i => i.product.id === product.id ? 
                    { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice } : i);
            }
            return [...prev, { product, quantity: 1, appliedPrice: product.priceFinal, subtotal: product.priceFinal }];
        });
        alert(`Añadido: ${product.name}`);
    };

    const handleMarkShortage = (product: Product) => {
        if (addToReplenishmentQueue(product)) {
            alert("Añadido a lista de faltantes");
        }
    };

    const cartTotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col font-sans text-slate-900 safe-area-inset">
            
            {/* TOP BAR */}
            <header className="bg-slate-900 text-white px-5 h-16 flex items-center justify-between shrink-0 shadow-lg z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <h1 className="font-black text-sm uppercase tracking-tighter">FerreCloud <span className="text-indigo-400">Mobile</span></h1>
                </div>
                <div className="flex items-center gap-4">
                    <button className="relative">
                        <Bell size={20} />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    <button onClick={() => setIsMenuOpen(true)}>
                        <User size={24} className="text-slate-400" />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto pb-24 custom-scrollbar">
                
                {activeTab === 'HOME' && (
                    <div className="p-5 space-y-6 animate-fade-in">
                        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12"><Smartphone size={120}/></div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Hola, {user.name}</p>
                            <h2 className="text-2xl font-black mt-1">¿Qué vamos a vender hoy?</h2>
                            <div className="mt-6 flex gap-2">
                                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                    <p className="text-[8px] font-black uppercase">Ventas Hoy</p>
                                    <p className="text-lg font-black">$12.450</p>
                                </div>
                                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                    <p className="text-[8px] font-black uppercase">Visitas</p>
                                    <p className="text-lg font-black">8 Clientes</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <QuickActionBtn 
                                icon={Package} 
                                label="Consultar Stock" 
                                color="bg-white text-indigo-600" 
                                onClick={() => setActiveTab('STOCK')} 
                            />
                            <QuickActionBtn 
                                icon={ShoppingCart} 
                                label="Nueva Venta" 
                                color="bg-white text-emerald-600" 
                                onClick={() => setActiveTab('SALES')} 
                            />
                            <QuickActionBtn 
                                icon={AlertTriangle} 
                                label="Faltantes" 
                                color="bg-white text-orange-500" 
                                onClick={() => setActiveTab('SHORTAGES')} 
                            />
                            <QuickActionBtn 
                                icon={ClipboardList} 
                                label="Remitos" 
                                color="bg-white text-blue-500" 
                                onClick={() => {}} 
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Actividad Reciente</h3>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><History size={16}/></div>
                                        <div>
                                            <p className="text-xs font-black uppercase">Venta Mostrador #992{i}</p>
                                            <p className="text-[9px] text-slate-400 font-bold">Hace 10 min</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-sm">$4.500</p>
                                </div>
                            ))}
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
                                    placeholder="Buscar en 140.000 artículos..."
                                    className="w-full pl-12 pr-10 py-4 bg-white border-2 border-transparent rounded-2xl shadow-sm font-bold text-sm outline-none focus:border-indigo-500 transition-all uppercase"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <X size={18}/>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {searchResults.map(p => (
                                <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-black uppercase text-xs text-slate-800 leading-tight">{p.name}</h4>
                                            <p className="text-[9px] font-mono font-bold text-indigo-500 mt-1 uppercase">{p.internalCodes[0]} • {p.brand}</p>
                                        </div>
                                        <p className="text-lg font-black text-slate-900 tracking-tighter">${p.priceFinal.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${p.stock > 5 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                Stock: {p.stock}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleMarkShortage(p)}
                                                className="p-2.5 bg-orange-50 text-orange-600 rounded-xl border border-orange-100 active:scale-90 transition-transform">
                                                <AlertTriangle size={16}/>
                                            </button>
                                            <button 
                                                onClick={() => addToCart(p)}
                                                className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-90 transition-transform">
                                                <Plus size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {searchTerm.length > 2 && searchResults.length === 0 && (
                                <div className="text-center py-20 opacity-30">
                                    <Search size={48} className="mx-auto mb-2" />
                                    <p className="text-xs font-black uppercase">Sin resultados</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'SALES' && (
                    <div className="p-5 space-y-6 animate-fade-in">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                    <ShoppingCart size={16} className="text-indigo-600"/> Carrito Actual
                                </h3>
                                <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full font-black uppercase">{cart.length} ítems</span>
                            </div>

                            <div className="space-y-3 min-h-[100px]">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase truncate max-w-[150px]">{item.product.name}</p>
                                            <p className="text-[9px] text-indigo-500 font-bold">{item.quantity} x ${item.appliedPrice.toLocaleString()}</p>
                                        </div>
                                        {/* Fix: Corrected trash button handler to properly remove items from cart */}
                                        <button 
                                            onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-red-300 p-2"><Trash2 size={16}/>
                                        </button>
                                    </div>
                                ))}
                                {cart.length === 0 && (
                                    <p className="text-center py-10 text-xs text-slate-300 uppercase font-black tracking-widest">El carrito está vacío</p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimado</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter">${cartTotal.toLocaleString()}</p>
                            </div>

                            <button 
                                disabled={cart.length === 0}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-3">
                                <CheckCircle size={18}/> Finalizar y Enviar
                            </button>
                        </div>
                        
                        <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><Barcode size={24}/></div>
                            <div className="flex-1">
                                <h4 className="font-black text-xs uppercase text-indigo-900">Modo Escaneo</h4>
                                <p className="text-[10px] text-indigo-400 font-medium">Usa la cámara para cargar items</p>
                            </div>
                            <ChevronRight className="text-indigo-300" />
                        </div>
                    </div>
                )}

                {activeTab === 'SHORTAGES' && (
                    <div className="p-5 space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-lg font-black uppercase tracking-tighter">Lista de Faltantes</h3>
                            <button className="text-[10px] font-black text-indigo-600 uppercase border-b-2 border-indigo-600">Ver Historial</button>
                        </div>
                        
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"><AlertTriangle size={18}/></div>
                                        <div>
                                            <p className="text-xs font-black uppercase leading-tight">Artículo Crítico {i}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Proveedor: Ferretería Central</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-red-300"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-6 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10"><Truck size={80}/></div>
                             <h4 className="text-lg font-black uppercase tracking-tighter">Orden Consolidada</h4>
                             <p className="text-slate-400 text-xs font-medium leading-relaxed">Genera órdenes de compra para tus proveedores basadas en los faltantes reportados hoy.</p>
                             <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Enviar a Compras</button>
                        </div>
                    </div>
                )}

            </main>

            {/* TAB BAR (NAV) */}
            <nav className="fixed bottom-0 left-0 w-full h-20 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
                <TabItem active={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} icon={Home} label="Inicio" />
                <TabItem active={activeTab === 'STOCK'} onClick={() => setActiveTab('STOCK')} icon={Package} label="Stock" />
                <div className="relative -mt-10">
                    <button 
                        onClick={() => setActiveTab('SALES')}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${activeTab === 'SALES' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                        <Plus size={32} />
                    </button>
                </div>
                <TabItem active={activeTab === 'SHORTAGES'} onClick={() => setActiveTab('SHORTAGES')} icon={Truck} label="Pedidos" />
                <TabItem active={isMenuOpen} onClick={() => setIsMenuOpen(true)} icon={Menu} label="Más" />
            </nav>

            {/* SIDE DRAWER (PERFIL / CONFIG) */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[300] animate-fade-in">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute top-0 right-0 h-full w-[80%] bg-white shadow-2xl flex flex-col p-8 rounded-l-[3rem] animate-slide-in-right">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="font-black uppercase text-xl tracking-tighter">Mi Perfil</h3>
                            {/* Correctly imported X icon from lucide-react */}
                            <button onClick={() => setIsMenuOpen(false)}><X size={28}/></button>
                        </div>

                        <div className="space-y-2 mb-10">
                            <div className="w-20 h-20 bg-indigo-100 rounded-[1.8rem] flex items-center justify-center text-indigo-600 font-black text-3xl mb-4">
                                {user.name.charAt(0)}
                            </div>
                            <h4 className="font-black text-xl text-slate-800 uppercase leading-none">{user.name}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user.roleId}</p>
                        </div>

                        <div className="flex-1 space-y-2">
                             <MenuLink icon={User} label="Datos Personales" />
                             {/* Correctly imported Settings, ShieldCheck, and Info icons from lucide-react */}
                             <MenuLink icon={Settings} label="Configuración App" />
                             <MenuLink icon={ShieldCheck} label="Seguridad" />
                             <MenuLink icon={Info} label="Ayuda Técnica" />
                        </div>

                        <button 
                            onClick={onLogout}
                            className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 mt-auto">
                            <LogOut size={18}/> Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---

const TabItem: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

const QuickActionBtn: React.FC<{ icon: any, label: string, color: string, onClick: () => void }> = ({ icon: Icon, label, color, onClick }) => (
    <button 
        onClick={onClick}
        className={`${color} p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-all`}>
        <div className="p-3 rounded-2xl bg-slate-50">
            <Icon size={24}/>
        </div>
        <span className="text-[10px] font-black uppercase tracking-tight text-center">{label}</span>
    </button>
);

const MenuLink: React.FC<{ icon: any, label: string }> = ({ icon: Icon, label }) => (
    <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
        <div className="text-slate-400"><Icon size={20}/></div>
        <span className="text-xs font-black uppercase tracking-widest text-slate-600">{label}</span>
        <ChevronRight size={14} className="ml-auto text-slate-300"/>
    </button>
);

export default MobileApp;
