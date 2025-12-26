
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Star, Gift, Sparkles, Smartphone, QrCode, Search, 
    ArrowRight, ShoppingBag, Info, MessageCircle, 
    ChevronRight, CreditCard, Tag, Percent, RefreshCw, X,
    ShieldCheck, ShoppingCart, Plus, Minus, Send, Package, Trash2
} from 'lucide-react';
import { Client, CompanyConfig, Product, InvoiceItem } from '../types';
import { searchVirtualInventory } from '../services/geminiService';

const PublicPortal: React.FC = () => {
    const [dniInput, setDniInput] = useState('');
    const [currentView, setCurrentView] = useState<'LOGIN' | 'DASHBOARD' | 'CATALOG' | 'CART'>('LOGIN');
    const [loggedClient, setLoggedClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // --- ESTADO DEL CARRITO DE PEDIDO ---
    const [cart, setCart] = useState<{product: Partial<Product>, quantity: number}[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Partial<Product>[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- CARGA DE CONFIGURACIÓN ---
    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { fantasyName: 'Ferretería Bruzzone', loyalty: { enabled: true, valuePerPoint: 2 }, whatsappNumber: '5491144556677' };
    }, []);

    const loyaltyEnabled = companyConfig.loyalty?.enabled ?? true;

    const clients: Client[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'), []);

    const offers = [
        { id: 1, title: 'Set Taladro Bosch + Maletín', oldPrice: 95000, newPrice: 79900, image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400', tag: 'DÍA DEL PADRE' },
        { id: 2, title: 'Látex Interior 20L Premium', oldPrice: 42000, newPrice: 34500, image: 'https://images.unsplash.com/photo-1589939705384-5185138a047a?auto=format&fit=crop&q=80&w=400', tag: 'FERRE-SALE' },
    ];

    const handleLogin = () => {
        if (!dniInput) return;
        setIsLoading(true);
        setTimeout(() => {
            const found = clients.find(c => c.cuit.includes(dniInput) || dniInput.includes(c.cuit.replace(/[^0-9]/g, '')));
            if (found) {
                setLoggedClient(found);
                setCurrentView('DASHBOARD');
            } else {
                alert("DNI no encontrado. Regístrate en el mostrador para empezar a sumar puntos.");
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleSearchProducts = async (term: string) => {
        setProductSearch(term);
        if (term.length < 3) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        // Simulamos búsqueda en los 140.000 artículos usando la IA o stock local
        const results = await searchVirtualInventory(term);
        setSearchResults(results);
        setIsSearching(false);
    };

    const addToCart = (product: Partial<Product>) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
        // Feedback visual
        const btn = document.getElementById(`btn-add-${product.id}`);
        if (btn) btn.classList.add('bg-green-500', 'scale-110');
        setTimeout(() => btn?.classList.remove('bg-green-500', 'scale-110'), 500);
    };

    const sendOrderWhatsApp = () => {
        if (cart.length === 0) return;
        let message = `*NUEVO PEDIDO DESDE EL PORTAL*\n`;
        message += `Cliente: ${loggedClient?.name || 'Consumidor Final'}\n`;
        message += `DNI: ${dniInput}\n`;
        message += `--------------------------\n`;
        cart.forEach(item => {
            message += `• ${item.quantity}x ${item.product.name} (Ref: ${item.product.internalCodes?.[0] || 'S/C'})\n`;
        });
        message += `--------------------------\n`;
        message += `_Por favor, confírmenme stock y precio total para retirar._`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
        setCart([]);
        setCurrentView('DASHBOARD');
        alert("Pedido enviado. Nos pondremos en contacto por WhatsApp.");
    };

    if (currentView === 'LOGIN') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
                <div className="w-full max-w-sm space-y-10 animate-fade-in">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20">
                            {loyaltyEnabled ? <Star size={40} className="fill-white"/> : <Package size={40} className="text-white"/>}
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
                            {loyaltyEnabled ? 'Mi Fidelidad' : 'Pedidos Online'}<br/>
                            <span className="text-indigo-500">{companyConfig.fantasyName}</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{loyaltyEnabled ? 'Consulta tus puntos y haz pedidos' : 'Explora nuestro catálogo y pide por WhatsApp'}</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">Ingresa tu DNI / CUIT</label>
                            <input 
                                type="text" 
                                placeholder="Ej: 30123456" 
                                className="w-full p-5 bg-white/10 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-black text-2xl text-center tracking-widest transition-all"
                                value={dniInput}
                                onChange={e => setDniInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            />
                        </div>
                        <button 
                            onClick={handleLogin}
                            disabled={isLoading}
                            className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                            {isLoading ? <RefreshCw className="animate-spin" size={20}/> : <><ArrowRight size={20}/> Ingresar al Portal</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-24">
            {/* MOBILE HEADER */}
            <header className="bg-slate-900 text-white p-6 rounded-b-[3rem] shadow-2xl shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-white uppercase">
                            {loggedClient?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Bienvenido,</p>
                            <h2 className="text-lg font-black uppercase tracking-tight truncate max-w-[150px]">{loggedClient?.name || 'Cliente'}</h2>
                        </div>
                    </div>
                    <button onClick={() => setCurrentView('LOGIN')} className="p-2 bg-white/10 rounded-full"><X size={20}/></button>
                </div>

                {/* AREA DE PUNTOS (SOLO SI ESTÁ ACTIVADO) */}
                {loyaltyEnabled && (
                    <div className="bg-indigo-600 rounded-[2rem] p-6 border border-indigo-400 relative overflow-hidden mb-4">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Sparkles size={80}/></div>
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Tus Ferre-Puntos</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tighter">{loggedClient?.points?.toLocaleString() || 0}</span>
                            <span className="text-sm font-black text-indigo-300 uppercase">PTS</span>
                        </div>
                        <p className="text-[9px] font-black text-green-300 uppercase mt-2">Valen: ${((loggedClient?.points || 0) * (companyConfig.loyalty?.valuePerPoint || 2)).toLocaleString()}</p>
                    </div>
                )}

                {/* BUSCADOR DE PRODUCTOS SIEMPRE VISIBLE */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Busca herramientas, tornillos..." 
                        className="w-full pl-11 p-4 bg-white/10 border border-white/10 rounded-2xl outline-none font-bold text-sm text-white focus:bg-white focus:text-slate-900 transition-all"
                        value={productSearch}
                        onChange={e => handleSearchProducts(e.target.value)}
                        onFocus={() => setCurrentView('CATALOG')}
                    />
                </div>
            </header>

            {/* MAIN CONTENT MOBILE */}
            <main className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
                
                {currentView === 'DASHBOARD' && (
                    <>
                        <section className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Ofertas del Mes</h3>
                                <span className="text-[10px] font-black text-indigo-600 uppercase">Ver Todo</span>
                            </div>
                            
                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                                {offers.map(offer => (
                                    <div key={offer.id} className="min-w-[280px] bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden snap-center">
                                        <div className="h-40 relative">
                                            <img src={offer.image} className="w-full h-full object-cover" alt={offer.title} />
                                            <span className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{offer.tag}</span>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm leading-tight h-10 overflow-hidden">{offer.title}</h4>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 line-through font-bold">${offer.oldPrice.toLocaleString()}</p>
                                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">${offer.newPrice.toLocaleString()}</p>
                                                </div>
                                                <button 
                                                    onClick={() => addToCart({id: `off-${offer.id}`, name: offer.title, priceFinal: offer.newPrice})}
                                                    className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl active:scale-90 transition-transform"><Plus size={20}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute bottom-0 right-0 p-4 opacity-10 pointer-events-none"><MessageCircle size={100}/></div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">¿Necesitas algo más?</h3>
                            <p className="text-indigo-100 text-xs font-medium leading-relaxed mb-6">Consulta stock por WhatsApp o pide presupuesto sin cargo.</p>
                            <button 
                                onClick={() => window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}`, '_blank')}
                                className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                                <MessageCircle size={18} className="fill-indigo-600"/> Chatear con la Ferretería
                            </button>
                        </section>
                    </>
                )}

                {currentView === 'CATALOG' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resultados de búsqueda</h3>
                            <button onClick={() => setCurrentView('DASHBOARD')} className="text-indigo-600 font-black text-[10px] uppercase">Cerrar</button>
                        </div>
                        
                        {isSearching ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                                <RefreshCw className="animate-spin" size={32}/>
                                <p className="text-[10px] font-black uppercase">Buscando en catálogo...</p>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 space-y-2">
                                <Search size={48} className="mx-auto opacity-20"/>
                                <p className="text-xs font-bold uppercase">No encontramos lo que buscas</p>
                                <p className="text-[10px]">Prueba con palabras más simples o chatea con nosotros.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {searchResults.map(p => (
                                    <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center group">
                                        <div className="flex-1 pr-4">
                                            <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{p.name}</h4>
                                            <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">{p.brand || 'Genérico'}</p>
                                        </div>
                                        <button 
                                            id={`btn-add-${p.id}`}
                                            onClick={() => addToCart(p)}
                                            className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                            <Plus size={20}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {currentView === 'CART' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                                <ShoppingCart size={18} className="text-indigo-600"/> Tu Pedido Actual
                            </h3>
                            <button onClick={() => setCurrentView('DASHBOARD')} className="p-2 bg-slate-100 rounded-full"><X size={18}/></button>
                        </div>

                        <div className="space-y-3">
                            {cart.map((item, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 flex justify-between items-center">
                                    <div className="flex-1 mr-4">
                                        <p className="font-black text-slate-800 text-xs uppercase leading-tight mb-1">{item.product.name}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{item.product.brand}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border">
                                            <button onClick={() => setCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: Math.max(1, it.quantity - 1)} : it))} className="p-1 text-slate-400"><Minus size={12}/></button>
                                            <span className="font-black text-xs min-w-[20px] text-center">{item.quantity}</span>
                                            <button onClick={() => setCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: it.quantity + 1} : it))} className="p-1 text-slate-400"><Plus size={12}/></button>
                                        </div>
                                        <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <div className="py-20 text-center text-slate-300 flex flex-col items-center gap-4">
                                    <ShoppingCart size={64} strokeWidth={1} className="opacity-20"/>
                                    <p className="text-xs font-black uppercase tracking-widest">El carrito está vacío</p>
                                    <button onClick={() => setCurrentView('DASHBOARD')} className="text-indigo-600 font-black text-[10px] uppercase underline">Explorar Productos</button>
                                </div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <button 
                                onClick={sendOrderWhatsApp}
                                className="w-full bg-green-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-green-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                <Send size={20}/> Enviar Pedido a WhatsApp
                            </button>
                        )}
                    </div>
                )}
            </main>

            {/* BARRA DE NAVEGACIÓN INFERIOR (TAB BAR) */}
            <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 h-20 flex items-center justify-around px-6 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={() => setCurrentView('DASHBOARD')}
                    className={`flex flex-col items-center gap-1 transition-all ${currentView === 'DASHBOARD' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                    <Smartphone size={24}/>
                    <span className="text-[8px] font-black uppercase tracking-widest">Inicio</span>
                </button>
                <button 
                    onClick={() => setCurrentView('CATALOG')}
                    className={`flex flex-col items-center gap-1 transition-all ${currentView === 'CATALOG' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                    <Search size={24}/>
                    <span className="text-[8px] font-black uppercase tracking-widest">Buscar</span>
                </button>
                <div className="relative -mt-10">
                    <button 
                        onClick={() => setCurrentView('CART')}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${cart.length > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <ShoppingCart size={28}/>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
                {loyaltyEnabled && (
                    <button 
                        onClick={() => setCurrentView('DASHBOARD')} // Los puntos se ven en el home
                        className={`flex flex-col items-center gap-1 transition-all ${currentView === 'DASHBOARD' ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <Star size={24} className={currentView === 'DASHBOARD' ? 'fill-indigo-600' : ''}/>
                        <span className="text-[8px] font-black uppercase tracking-widest">Mis Puntos</span>
                    </button>
                )}
                <button 
                    onClick={() => window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}`, '_blank')}
                    className="flex flex-col items-center gap-1 text-slate-400">
                    <MessageCircle size={24}/>
                    <span className="text-[8px] font-black uppercase tracking-widest">WhatsApp</span>
                </button>
            </nav>
        </div>
    );
};

export default PublicPortal;
