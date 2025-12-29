
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Star, Gift, Sparkles, Smartphone, QrCode, Search, 
    ArrowRight, ShoppingBag, Info, MessageCircle, 
    ChevronRight, CreditCard, Tag, Percent, RefreshCw, X,
    ShieldCheck, ShoppingCart, Plus, Minus, Send, Package, Trash2,
    Ticket, CheckCircle, ArrowLeft, User
} from 'lucide-react';
import { Client, CompanyConfig, Product, InvoiceItem, Coupon } from '../types';
import { searchVirtualInventory } from '../services/geminiService';

const PublicPortal: React.FC = () => {
    const [dniInput, setDniInput] = useState('');
    const [currentView, setCurrentView] = useState<'LOGIN' | 'DASHBOARD' | 'CATALOG' | 'CART' | 'REDEEM'>('LOGIN');
    const [loggedClient, setLoggedClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // --- ESTADO DEL CARRITO DE PEDIDO ---
    const [cart, setCart] = useState<{product: Partial<Product>, quantity: number}[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Partial<Product>[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- ESTADO DE CANJE ---
    const [redeemedCoupon, setRedeemedCoupon] = useState<string | null>(null);

    // --- CARGA DE CONFIGURACIÓN ---
    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { fantasyName: 'Ferretería Bruzzone', loyalty: { enabled: true, valuePerPoint: 2, minPointsToRedeem: 500 }, whatsappNumber: '5491144556677' };
    }, []);

    const loyaltyEnabled = companyConfig.loyalty?.enabled ?? true;
    const minToRedeem = companyConfig.loyalty?.minPointsToRedeem ?? 500;

    const clients: Client[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'), []);

    const offers = [
        { id: 1, title: 'Set Taladro Bosch + Maletín', oldPrice: 95000, newPrice: 79900, image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400', tag: 'DÍA DEL PADRE' },
        { id: 2, title: 'Látex Interior 20L Premium', oldPrice: 42000, newPrice: 34500, image: 'https://images.unsplash.com/photo-1589939705384-5185138a047a?auto=format&fit=crop&q=80&w=400', tag: 'FERRE-SALE' },
    ];

    const handleLogin = () => {
        if (!dniInput) return;
        setIsLoading(true);
        setTimeout(() => {
            // Buscamos coincidencia parcial o total de DNI en CUIT
            const found = clients.find(c => {
                const cleanDni = dniInput.replace(/[^0-9]/g, '');
                const cleanCuit = c.cuit.replace(/[^0-9]/g, '');
                return cleanCuit.includes(cleanDni) || cleanDni === cleanCuit;
            });

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

    const handleRedeemPoints = () => {
        if (!loggedClient || (loggedClient.points || 0) < minToRedeem) return;
        
        setIsLoading(true);
        setTimeout(() => {
            // Generar código aleatorio de cupón
            const code = `CANJE-${Math.random().toString(36).substring(7).toUpperCase()}`;
            setRedeemedCoupon(code);
            
            // Simular descuento de puntos en la base local
            const updatedPoints = loggedClient.points - minToRedeem;
            const allClients = JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]');
            const newClients = allClients.map((c: any) => c.id === loggedClient.id ? {...c, points: updatedPoints} : c);
            localStorage.setItem('ferrecloud_clients', JSON.stringify(newClients));
            
            setLoggedClient({...loggedClient, points: updatedPoints});
            setIsLoading(false);
            setCurrentView('REDEEM');
        }, 1500);
    };

    if (currentView === 'LOGIN') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full"></div>

                <div className="w-full max-w-sm space-y-10 animate-fade-in relative z-10">
                    <div className="text-center space-y-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30 rotate-3">
                            <Star size={48} className="fill-white text-white drop-shadow-lg"/>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
                                Mi Cuenta<br/>
                                <span className="text-indigo-500">{companyConfig.fantasyName}</span>
                            </h1>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Ingresá con tu DNI para ver tus puntos</p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-xl space-y-8 shadow-2xl">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-2 block">DNI del Cliente</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                                <input 
                                    type="text" 
                                    placeholder="Nº de Documento" 
                                    className="w-full pl-12 p-5 bg-white/10 border-2 border-transparent rounded-2xl focus:bg-white focus:text-slate-900 focus:border-indigo-500 outline-none font-black text-2xl text-center tracking-widest transition-all placeholder:text-slate-600"
                                    value={dniInput}
                                    onChange={e => setDniInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleLogin}
                            disabled={isLoading || !dniInput}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30">
                            {isLoading ? <RefreshCw className="animate-spin" size={20}/> : <><ArrowRight size={20}/> Acceder ahora</>}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">¿Aún no eres cliente? Regístrate en el mostrador</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-24 overflow-hidden">
            {/* MOBILE HEADER */}
            <header className="bg-slate-900 text-white p-6 rounded-b-[3.5rem] shadow-2xl shrink-0 transition-all">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white uppercase shadow-lg shadow-indigo-500/20 text-xl">
                            {loggedClient?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Hola,</p>
                            <h2 className="text-lg font-black uppercase tracking-tight truncate max-w-[180px]">{loggedClient?.name || 'Cliente'}</h2>
                        </div>
                    </div>
                    <button onClick={() => { setLoggedClient(null); setCurrentView('LOGIN'); }} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"><X size={20}/></button>
                </div>

                {/* AREA DE PUNTOS */}
                {loyaltyEnabled && (
                    <div 
                        onClick={() => setCurrentView('REDEEM')}
                        className="bg-indigo-600 rounded-[2.5rem] p-8 border border-indigo-400 relative overflow-hidden mb-6 group cursor-pointer active:scale-[0.98] transition-transform">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform"><Sparkles size={120}/></div>
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                             <Star size={14} className="fill-indigo-200"/> Mis Puntos Acumulados
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black tracking-tighter">{loggedClient?.points?.toLocaleString() || 0}</span>
                            <span className="text-lg font-black text-indigo-300 uppercase">PTS</span>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <p className="text-[10px] font-black text-green-300 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">Equivalen a: ${((loggedClient?.points || 0) * (companyConfig.loyalty?.valuePerPoint || 2)).toLocaleString()}</p>
                            <div className="flex items-center gap-1 text-[10px] font-black text-white uppercase">
                                Canjear <ChevronRight size={14}/>
                            </div>
                        </div>
                    </div>
                )}

                {/* BUSCADOR DE PRODUCTOS */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Busca herramientas, stock, etc..." 
                        className="w-full pl-12 p-4 bg-white/10 border border-white/5 rounded-2xl outline-none font-bold text-sm text-white focus:bg-white focus:text-slate-900 transition-all placeholder:text-slate-500"
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
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Ofertas Exclusivas</h3>
                                <span className="text-[10px] font-black text-indigo-600 uppercase">Ver Todo</span>
                            </div>
                            
                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                                {offers.map(offer => (
                                    <div key={offer.id} className="min-w-[280px] bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden snap-center">
                                        <div className="h-44 relative">
                                            <img src={offer.image} className="w-full h-full object-cover" alt={offer.title} />
                                            <span className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">{offer.tag}</span>
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
                                                    className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-transform"><Plus size={20}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-indigo-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute bottom-0 right-0 p-4 opacity-10 pointer-events-none"><MessageCircle size={120}/></div>
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">¿Necesitás algo más?</h3>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-8">Escribinos por WhatsApp para consultar stock o pedir un presupuesto a medida.</p>
                            <button 
                                onClick={() => window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}`, '_blank')}
                                className="w-full bg-white text-indigo-600 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-50 active:scale-95 transition-all">
                                <MessageCircle size={20} className="fill-indigo-600"/> Abrir chat de WhatsApp
                            </button>
                        </section>
                    </>
                )}

                {currentView === 'REDEEM' && (
                    <div className="space-y-8 animate-fade-in pb-10">
                        <div className="flex items-center gap-2">
                             <button onClick={() => setCurrentView('DASHBOARD')} className="p-2 bg-white rounded-xl border border-slate-200"><ArrowLeft size={20}/></button>
                             <h3 className="text-xl font-black uppercase tracking-tight">Canje de Puntos</h3>
                        </div>

                        {!redeemedCoupon ? (
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm text-center space-y-8">
                                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto border border-amber-100">
                                    <Gift size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">¡Canjeá tus puntos!</h4>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">Presentá el código de canje en el mostrador para obtener tu beneficio.</p>
                                </div>
                                
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Costo del Canje</p>
                                        <p className="text-xl font-black text-indigo-600">{minToRedeem} Puntos</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Beneficio</p>
                                        <p className="text-xl font-black text-green-600">${(minToRedeem * (companyConfig.loyalty?.valuePerPoint || 2)).toLocaleString()} OFF</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleRedeemPoints}
                                    disabled={isLoading || (loggedClient?.points || 0) < minToRedeem}
                                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl disabled:opacity-20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                    {isLoading ? <RefreshCw className="animate-spin" size={24}/> : <><Ticket size={24}/> GENERAR MI CUPÓN</>}
                                </button>
                                
                                {(loggedClient?.points || 0) < minToRedeem && (
                                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Te faltan {minToRedeem - (loggedClient?.points || 0)} puntos para canjear</p>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-600 shadow-2xl text-center space-y-8 animate-fade-in relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 bg-indigo-600 text-white rounded-bl-3xl font-black text-xs uppercase tracking-widest shadow-lg">CUPÓN ACTIVO</div>
                                <div className="space-y-4">
                                    <CheckCircle size={64} className="text-green-500 mx-auto" />
                                    <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">¡Cupón Generado!</h4>
                                    <p className="text-sm text-slate-500 font-medium px-4">Mostrá este código o hacé una captura para presentar en el mostrador de {companyConfig.fantasyName}.</p>
                                </div>
                                <div className="bg-indigo-50 p-8 rounded-[2rem] border-2 border-dashed border-indigo-200">
                                    <p className="text-4xl font-mono font-black text-indigo-600 tracking-widest">{redeemedCoupon}</p>
                                </div>
                                <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-2xl text-amber-700 border border-amber-100">
                                    <Info size={16} className="shrink-0" />
                                    <p className="text-[10px] font-bold uppercase leading-tight text-left">Válido por 24hs. Solo un uso por cliente. Se aplicará sobre el total de tu compra.</p>
                                </div>
                                <button onClick={() => setCurrentView('DASHBOARD')} className="text-indigo-600 font-black text-xs uppercase tracking-widest underline">Volver al Inicio</button>
                            </div>
                        )}
                    </div>
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
                                <p className="text-[10px] font-black uppercase tracking-widest">Buscando en catálogo...</p>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 space-y-2">
                                <Search size={48} className="mx-auto opacity-20"/>
                                <p className="text-xs font-bold uppercase">No encontramos lo que buscás</p>
                                <p className="text-[10px]">Probá con otras palabras o chateanos por WhatsApp.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {searchResults.map(p => (
                                    <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 flex justify-between items-center group active:bg-indigo-50 transition-colors">
                                        <div className="flex-1 pr-4">
                                            <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight leading-tight mb-1">{p.name}</h4>
                                            <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">{p.brand || 'Genérico'}</p>
                                        </div>
                                        <button 
                                            id={`btn-add-${p.id}`}
                                            onClick={() => addToCart(p)}
                                            className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90">
                                            <Plus size={24}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {currentView === 'CART' && (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                                <ShoppingCart size={24} className="text-indigo-600"/> Tu Pedido
                            </h3>
                            <button onClick={() => setCurrentView('DASHBOARD')} className="p-3 bg-white rounded-2xl border shadow-sm"><X size={20}/></button>
                        </div>

                        <div className="space-y-4">
                            {cart.map((item, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 flex justify-between items-center shadow-sm">
                                    <div className="flex-1 mr-4">
                                        <p className="font-black text-slate-800 text-sm uppercase leading-tight mb-1">{item.product.name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.product.brand}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border">
                                            <button onClick={() => setCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: Math.max(1, it.quantity - 1)} : it))} className="p-1.5 text-slate-400"><Minus size={14}/></button>
                                            <span className="font-black text-sm min-w-[24px] text-center">{item.quantity}</span>
                                            <button onClick={() => setCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: it.quantity + 1} : it))} className="p-1.5 text-slate-400"><Plus size={14}/></button>
                                        </div>
                                        <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <div className="py-24 text-center text-slate-300 flex flex-col items-center gap-6">
                                    <ShoppingCart size={80} strokeWidth={1} className="opacity-10"/>
                                    <div className="space-y-2">
                                        <p className="text-sm font-black uppercase tracking-widest">El carrito está vacío</p>
                                        <p className="text-xs text-slate-400">Agregá productos para enviarnos tu pedido.</p>
                                    </div>
                                    <button onClick={() => setCurrentView('DASHBOARD')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Explorar Productos</button>
                                </div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-inner">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items en Pedido</p>
                                    <p className="text-xl font-black text-slate-800">{cart.reduce((a,c) => a + c.quantity, 0)}</p>
                                </div>
                                <button 
                                    onClick={sendOrderWhatsApp}
                                    className="w-full bg-green-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-green-500/20 flex items-center justify-center gap-4 active:scale-95 transition-all">
                                    <Send size={24}/> ENVIAR PEDIDO POR WHATSAPP
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* BARRA DE NAVEGACIÓN INFERIOR (TAB BAR) */}
            <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-200 h-24 flex items-center justify-around px-6 z-[100] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] rounded-t-[3.5rem]">
                <button 
                    onClick={() => setCurrentView('DASHBOARD')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'DASHBOARD' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                    <Smartphone size={28}/>
                    <span className="text-[8px] font-black uppercase tracking-widest">Inicio</span>
                </button>
                <button 
                    onClick={() => setCurrentView('CATALOG')}
                    className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'CATALOG' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                    <Search size={28}/>
                    <span className="text-[8px] font-black uppercase tracking-widest">Buscar</span>
                </button>
                <div className="relative -mt-14">
                    <button 
                        onClick={() => setCurrentView('CART')}
                        className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 ${cart.length > 0 ? 'bg-indigo-600 text-white rotate-6' : 'bg-slate-200 text-slate-400'}`}>
                        <ShoppingCart size={32}/>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-4 border-white animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
                {loyaltyEnabled && (
                    <button 
                        onClick={() => setCurrentView('REDEEM')}
                        className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'REDEEM' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                        <Star size={28} className={currentView === 'REDEEM' ? 'fill-indigo-600' : ''}/>
                        <span className="text-[8px] font-black uppercase tracking-widest">Canjes</span>
                    </button>
                )}
                <button 
                    onClick={() => window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}`, '_blank')}
                    className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-green-500 transition-colors">
                    <MessageCircle size={28}/>
                    <span className="text-[8px] font-black uppercase tracking-widest">WhatsApp</span>
                </button>
            </nav>
        </div>
    );
};

export default PublicPortal;
