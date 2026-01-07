
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Star, Gift, Sparkles, Smartphone, QrCode, Search, 
    ArrowRight, ShoppingBag, Info, MessageCircle, 
    ChevronRight, CreditCard, Tag, Percent, RefreshCw, X,
    ShieldCheck, ShoppingCart, Plus, Minus, Send, Package, Trash2,
    Ticket, CheckCircle, ArrowLeft, User, Cloud, Zap
} from 'lucide-react';
import { Client, CompanyConfig, Product, InvoiceItem, Coupon } from '../types';
import { searchVirtualInventory } from '../services/geminiService';

// --- COMPONENTE INTERNO: TARJETA DE PRODUCTO ---
const ProductCard: React.FC<{ product: Partial<Product>, onAdd: (p: Partial<Product>, qty: number) => void, dark?: boolean }> = ({ product, onAdd, dark }) => {
    const isOffer = product.ecommerce?.isOffer;
    const priceFinal = product.priceFinal || 0;
    const finalPrice = isOffer ? (product.ecommerce?.offerPrice || priceFinal) : priceFinal;

    return (
        <div className={`rounded-[2.5rem] border transition-all overflow-hidden flex flex-col group h-[450px] ${dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-100 shadow-sm hover:shadow-2xl'}`}>
            <div className={`h-56 flex items-center justify-center relative overflow-hidden ${dark ? 'bg-white/5' : 'bg-slate-50'}`}>
                {isOffer && (
                    <span className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg z-10 animate-pulse">OFERTA</span>
                )}
                
                {product.ecommerce?.imageUrl ? (
                    <img 
                        src={product.ecommerce.imageUrl} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        alt={product.name} 
                    />
                ) : (
                    <Package size={80} className={`transition-transform duration-500 group-hover:scale-125 ${dark ? 'text-white/10' : 'text-slate-200'}`} strokeWidth={1} />
                )}
            </div>
            <div className="p-8 flex-1 flex flex-col">
                <h4 className={`font-black uppercase tracking-tight text-lg leading-tight h-12 overflow-hidden mb-2 ${dark ? 'text-white' : 'text-slate-800'}`}>{product.name}</h4>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-6">{product.brand || 'Genérico'}</p>
                <div className="mt-auto flex justify-between items-end">
                    <div>
                        {isOffer && (
                            <p className="text-[10px] text-slate-400 line-through font-bold mb-1">${priceFinal.toLocaleString('es-AR')}</p>
                        )}
                        <p className={`text-2xl font-black tracking-tighter leading-none ${isOffer ? 'text-orange-500' : (dark ? 'text-white' : 'text-slate-900')}`}>
                            ${finalPrice.toLocaleString('es-AR')}
                        </p>
                    </div>
                    <button 
                        onClick={() => onAdd(product, 1)}
                        className={`p-4 rounded-2xl shadow-xl transition-all active:scale-90 ${dark ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                        <Plus size={20}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const PublicPortal: React.FC = () => {
    const [dniInput, setDniInput] = useState('');
    const [currentView, setCurrentView] = useState<'LOGIN' | 'DASHBOARD' | 'CATALOG' | 'CART' | 'REDEEM'>('LOGIN');
    const [loggedClient, setLoggedClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [cart, setCart] = useState<{product: Partial<Product>, quantity: number}[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Partial<Product>[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [redeemedCoupon, setRedeemedCoupon] = useState<string | null>(null);

    const [clients, setClients] = useState<Client[]>(() => 
        JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]')
    );

    const offers = useMemo(() => [
        { id: 'off-1', name: 'Kit de Herramientas Pro', brand: 'Stanley', priceFinal: 45000, ecommerce: { isOffer: true, offerPrice: 32000, imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=500' } },
        { id: 'off-2', name: 'Taladro Percutor 750W', brand: 'Bosch', priceFinal: 85000, ecommerce: { isOffer: true, offerPrice: 68000, imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=500' } },
        { id: 'off-3', name: 'Set de Destornilladores', brand: 'Tramontina', priceFinal: 12000, ecommerce: { isOffer: true, offerPrice: 9500, imageUrl: 'https://images.unsplash.com/photo-1530124560676-41bc128c39d4?auto=format&fit=crop&q=80&w=500' } },
    ], []);

    useEffect(() => {
        const syncClients = () => {
            setClients(JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));
        };
        window.addEventListener('storage', syncClients);
        window.addEventListener('company_config_updated', syncClients);
        return () => {
            window.removeEventListener('storage', syncClients);
            window.removeEventListener('company_config_updated', syncClients);
        };
    }, []);

    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { fantasyName: 'Ferretería Bruzzone', loyalty: { enabled: true, valuePerPoint: 2, minPointsToRedeem: 500 }, whatsappNumber: '5491144556677' };
    }, []);

    const loyaltyEnabled = companyConfig.loyalty?.enabled ?? true;
    const minToRedeem = companyConfig.loyalty?.minPointsToRedeem ?? 500;

    const handleCloudSync = () => {
        setIsLoading(true);
        setTimeout(() => {
            // Fix: Added missing required properties to demo clients to match Client interface.
            const demoClients: Client[] = [
                { 
                    id: 'demo-1', 
                    name: 'CLIENTE PRUEBA', 
                    cuit: '30000287', 
                    dni: '30000287', 
                    balance: 0, 
                    limit: 50000, 
                    points: 1250, 
                    phone: '1122334455', 
                    address: 'Calle 123',
                    isCurrentAccountActive: true,
                    isLimitEnabled: false,
                    useAdvance: false,
                    authorizedContacts: []
                },
                { 
                    id: 'demo-2', 
                    name: 'JUAN PEREZ', 
                    cuit: '20123456789', 
                    dni: '12345678', 
                    balance: 0, 
                    limit: 10000, 
                    points: 450, 
                    phone: '1199887766', 
                    address: 'Av Siempre Viva 742',
                    isCurrentAccountActive: true,
                    isLimitEnabled: false,
                    useAdvance: false,
                    authorizedContacts: []
                }
            ];
            
            const existing = JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]');
            const combined = [...existing];
            
            demoClients.forEach(dc => {
                if (!combined.some(c => (c.dni === dc.dni || c.cuit === dc.cuit))) {
                    combined.push(dc);
                }
            });

            localStorage.setItem('ferrecloud_clients', JSON.stringify(combined));
            setClients(combined);
            setIsLoading(false);
            alert("✅ Sincronización con la nube exitosa. Prueba ingresar con el DNI: 30000287");
        }, 1200);
    };

    const handleLogin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const cleanDni = (dniInput || '').toString().replace(/\D/g, '').trim();
        if (!cleanDni) return;

        setIsLoading(true);
        setTimeout(() => {
            const found = clients.find(c => {
                const clientCuit = (c.cuit || '').toString().replace(/\D/g, '');
                const clientDni = (c.dni || '').toString().replace(/\D/g, '');
                return clientCuit === cleanDni || clientDni === cleanDni;
            });

            if (found) {
                setLoggedClient(found);
                setCurrentView('DASHBOARD');
            } else {
                alert("❌ DNI no encontrado.\n\nSi no eres cliente aún, regístrate en el mostrador. Si eres cliente habitual, pulsa 'Sincronizar con Nube' para descargar tus datos.");
            }
            setIsLoading(false);
        }, 800);
    };

    const handleSearchProducts = async (term: string) => {
        setProductSearch(term);
        if (term.length < 3) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const results = await searchVirtualInventory(term);
            const localProducts: Product[] = JSON.parse(localStorage.getItem('ferrecloud_products') || '[]');
            const enriched = results.map(r => {
                const local = localProducts.find(lp => lp.internalCodes.includes(r.internalCodes?.[0] || ''));
                return local ? { ...r, ecommerce: local.ecommerce } : r;
            });
            setSearchResults(enriched);
        } catch (err) {
            console.error("Error en búsqueda:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const addToCart = (product: Partial<Product>) => {
        setCart(prev => {
            const exists = prev.find(item => item.product.id === product.id);
            if (exists) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
        alert(`${product.name} agregado al carrito`);
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
        message += `_Por favor, confírmenme stock y precio total._`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
        setCart([]);
        setCurrentView('DASHBOARD');
    };

    const handleRedeemPoints = () => {
        if (!loggedClient || (loggedClient.points || 0) < minToRedeem) return;
        setIsLoading(true);
        setTimeout(() => {
            const code = `CANJE-${Math.random().toString(36).substring(7).toUpperCase()}`;
            setRedeemedCoupon(code);
            const updatedPoints = (loggedClient.points || 0) - minToRedeem;
            
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
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full"></div>

                <div className="w-full max-w-sm space-y-10 animate-fade-in relative z-10">
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.8rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30 rotate-3">
                            <Star size={40} className="fill-white text-white drop-shadow-lg"/>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                                Mi Cuenta<br/>
                                <span className="text-indigo-500">{companyConfig.fantasyName || 'Bruzzone'}</span>
                            </h1>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ingresá con tu DNI para ver tus puntos</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl space-y-6 shadow-2xl">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-2 block text-center">Nº de Documento</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                <input 
                                    type="tel" 
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder="Solo números" 
                                    className="w-full pl-12 p-4 bg-white/10 border-2 border-transparent rounded-2xl focus:bg-white focus:text-slate-900 focus:border-indigo-500 outline-none font-black text-xl text-center tracking-widest transition-all placeholder:text-slate-600 placeholder:text-xs"
                                    value={dniInput}
                                    onChange={e => setDniInput(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button 
                                type="submit"
                                disabled={isLoading || !dniInput.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-50 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30">
                                {isLoading ? <RefreshCw className="animate-spin" size={18}/> : <><ArrowRight size={18}/> Acceder</>}
                            </button>
                            
                            <button 
                                type="button"
                                onClick={handleCloudSync}
                                className="w-full bg-white/5 border border-white/10 text-slate-400 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                                <Cloud size={14}/> Sincronizar con Nube (Modo Demo)
                            </button>
                        </div>
                    </form>

                    <div className="text-center">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">¿Dudas? Chatea con nosotros en el mostrador</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-24 overflow-hidden">
            <header className="bg-slate-900 text-white p-6 rounded-b-[3.5rem] shadow-2xl shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white uppercase shadow-lg shadow-indigo-500/20 text-lg">
                            {loggedClient?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Hola,</p>
                            <h2 className="text-base font-black uppercase tracking-tight truncate max-w-[150px]">{loggedClient?.name || 'Cliente'}</h2>
                        </div>
                    </div>
                    <button onClick={() => { setLoggedClient(null); setCurrentView('LOGIN'); setDniInput(''); }} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><X size={18}/></button>
                </div>

                {loyaltyEnabled && (
                    <div 
                        onClick={() => setCurrentView('REDEEM')}
                        className="bg-indigo-600 rounded-[2rem] p-6 border border-indigo-400 relative overflow-hidden mb-6 group cursor-pointer active:scale-[0.98] transition-transform">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform"><Sparkles size={100}/></div>
                        <p className="text-[9px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                             <Star size={12} className="fill-indigo-200"/> Mis Puntos
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tighter">{loggedClient?.points?.toLocaleString() || 0}</span>
                            <span className="text-sm font-black text-indigo-300 uppercase">PTS</span>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <p className="text-[9px] font-black text-green-300 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg border border-white/10">Valen: ${((loggedClient?.points || 0) * (companyConfig.loyalty?.valuePerPoint || 2)).toLocaleString()}</p>
                            <div className="flex items-center gap-1 text-[9px] font-black text-white uppercase">
                                Canjear <ChevronRight size={12}/>
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Busca herramientas, stock, etc..." 
                        className="w-full pl-11 p-3.5 bg-white/10 border border-white/5 rounded-2xl outline-none font-bold text-xs text-white focus:bg-white focus:text-slate-900 transition-all placeholder:text-slate-500"
                        value={productSearch}
                        onChange={e => handleSearchProducts(e.target.value)}
                        onFocus={() => setCurrentView('CATALOG')}
                    />
                </div>
            </header>

            <main className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
                {currentView === 'DASHBOARD' && (
                    <>
                        <section className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ofertas Exclusivas</h3>
                                <button onClick={() => setCurrentView('CATALOG')} className="text-[10px] font-black text-indigo-600 uppercase">Ver Todo</button>
                            </div>
                            
                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                                {offers.map(offer => (
                                    <div key={offer.id} className="min-w-[250px] bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden snap-center">
                                        <div className="h-40 relative">
                                            <img src={offer.ecommerce.imageUrl} className="w-full h-full object-cover" alt={offer.name} />
                                            <span className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">OFERTA</span>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <h4 className="font-black text-slate-800 uppercase tracking-tight text-xs leading-tight h-8 overflow-hidden">{offer.name}</h4>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[9px] text-slate-400 line-through font-bold mb-0.5">${offer.priceFinal.toLocaleString()}</p>
                                                    <p className="text-xl font-black text-slate-900 tracking-tighter">${offer.ecommerce.offerPrice?.toLocaleString()}</p>
                                                </div>
                                                <button 
                                                    onClick={() => addToCart(offer)}
                                                    className="bg-indigo-600 text-white p-3 rounded-xl shadow-xl active:scale-90 transition-transform"><Plus size={18}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute bottom-0 right-0 p-4 opacity-10 pointer-events-none"><MessageCircle size={100}/></div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">¿Necesitás algo más?</h3>
                            <p className="text-indigo-100 text-xs font-medium leading-relaxed mb-6">Consúltanos stock o precios por WhatsApp directamente.</p>
                            <button 
                                onClick={() => window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}`, '_blank')}
                                className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-50 active:scale-95 transition-all">
                                <MessageCircle size={18} className="fill-indigo-600"/> Abrir WhatsApp
                            </button>
                        </section>
                    </>
                )}

                {currentView === 'REDEEM' && (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="flex items-center gap-2">
                             <button onClick={() => setCurrentView('DASHBOARD')} className="p-2 bg-white rounded-xl border border-slate-200"><ArrowLeft size={18}/></button>
                             <h3 className="text-lg font-black uppercase tracking-tight">Canje de Puntos</h3>
                        </div>

                        {!redeemedCoupon ? (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center space-y-6">
                                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
                                    <Gift size={32} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">¡Canjeá tus puntos!</h4>
                                    <p className="text-xs text-slate-400 font-medium px-4">Genera un cupón y preséntalo en el mostrador.</p>
                                </div>
                                
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <div className="text-left">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Costo</p>
                                        <p className="text-lg font-black text-indigo-600">{minToRedeem} Pts</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Beneficio</p>
                                        <p className="text-lg font-black text-green-600">${(minToRedeem * (companyConfig.loyalty?.valuePerPoint || 2)).toLocaleString()} OFF</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleRedeemPoints}
                                    disabled={isLoading || (loggedClient?.points || 0) < minToRedeem}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                    {isLoading ? <RefreshCw className="animate-spin" size={20}/> : <><Ticket size={20}/> GENERAR CUPÓN</>}
                                </button>
                                
                                {(loggedClient?.points || 0) < minToRedeem && (
                                    <p className="text-red-500 text-[9px] font-black uppercase tracking-widest">Te faltan {minToRedeem - (loggedClient?.points || 0)} pts</p>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-600 shadow-2xl text-center space-y-8 animate-fade-in relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 bg-indigo-600 text-white rounded-bl-2xl font-black text-[8px] uppercase tracking-widest shadow-lg">CUPÓN ACTIVO</div>
                                <div className="space-y-2">
                                    <CheckCircle size={48} className="text-green-500 mx-auto" />
                                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">¡Listo para usar!</h4>
                                    <p className="text-xs text-slate-500 font-medium px-4">Mostrá este código en caja.</p>
                                </div>
                                <div className="bg-indigo-50 p-6 rounded-2xl border-2 border-dashed border-indigo-200">
                                    <p className="text-3xl font-mono font-black text-indigo-600 tracking-widest">{redeemedCoupon}</p>
                                </div>
                                <button onClick={() => {setRedeemedCoupon(null); setCurrentView('DASHBOARD');}} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest underline">Volver al Inicio</button>
                            </div>
                        )}
                    </div>
                )}

                {currentView === 'CATALOG' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultados</h3>
                            <button onClick={() => setCurrentView('DASHBOARD')} className="text-indigo-600 font-black text-[10px] uppercase">Cerrar</button>
                        </div>
                        
                        {isSearching ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-3">
                                <RefreshCw className="animate-spin" size={24}/>
                                <p className="text-[9px] font-black uppercase tracking-widest">Buscando...</p>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 space-y-2">
                                <Search size={32} className="mx-auto opacity-20"/>
                                <p className="text-[10px] font-black uppercase">Sin resultados</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 pb-10">
                                {searchResults.map(p => (
                                    <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-slate-200 flex justify-between items-center active:bg-indigo-50 transition-colors shadow-sm">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border">
                                                {p.ecommerce?.imageUrl ? (
                                                    <img src={p.ecommerce.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                                                ) : (
                                                    <Package size={20} className="text-slate-300"/>
                                                )}
                                            </div>
                                            <div className="flex-1 pr-2 min-w-0">
                                                <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight leading-tight mb-1 truncate">{p.name}</h4>
                                                <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">${p.priceFinal?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => addToCart(p)}
                                            className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90">
                                            <Plus size={20}/>
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
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                                <ShoppingCart size={22} className="text-indigo-600"/> Tu Pedido
                            </h3>
                            <button onClick={() => setCurrentView('DASHBOARD')} className="p-2 bg-white rounded-xl border shadow-sm"><X size={18}/></button>
                        </div>

                        <div className="space-y-3">
                            {cart.map((item, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-[2.5rem] border border-slate-200 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border">
                                            {item.product.ecommerce?.imageUrl ? (
                                                <img src={item.product.ecommerce.imageUrl} className="w-full h-full object-cover" alt={item.product.name} />
                                            ) : (
                                                <Package size={18} className="text-slate-300"/>
                                            )}
                                        </div>
                                        <div className="flex-1 mr-2 min-w-0">
                                            <p className="font-black text-slate-800 text-xs uppercase truncate mb-0.5">{item.product.name}</p>
                                            <p className="text-[9px] text-indigo-600 font-black">${(item.product.ecommerce?.isOffer ? item.product.ecommerce.offerPrice : item.product.priceFinal)?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border">
                                            <button onClick={() => setCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: Math.max(1, it.quantity - 1)} : it))} className="p-1 text-slate-400"><Minus size={12}/></button>
                                            <span className="font-black text-xs min-w-[20px] text-center">{item.quantity}</span>
                                            <button onClick={() => setCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: it.quantity + 1} : it))} className="p-1 text-slate-400"><Plus size={12}/></button>
                                        </div>
                                        <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-red-300 p-2"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <div className="py-20 text-center text-slate-300 flex flex-col items-center gap-4">
                                    <ShoppingCart size={64} strokeWidth={1} className="opacity-10"/>
                                    <p className="text-[10px] font-black uppercase tracking-widest">El carrito está vacío</p>
                                </div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="pt-4">
                                <button 
                                    onClick={sendOrderWhatsApp}
                                    className="w-full bg-green-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-3 active:scale-95">
                                    <Send size={20}/> ENVIAR POR WHATSAPP
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-200 h-20 flex items-center justify-around px-6 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
                <button 
                    onClick={() => setCurrentView('DASHBOARD')}
                    className={`flex flex-col items-center gap-1 transition-all ${currentView === 'DASHBOARD' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                    <Smartphone size={24}/>
                    <span className="text-[7px] font-black uppercase tracking-widest">Inicio</span>
                </button>
                <button 
                    onClick={() => setCurrentView('CATALOG')}
                    className={`flex flex-col items-center gap-1 transition-all ${currentView === 'CATALOG' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                    <Search size={24}/>
                    <span className="text-[7px] font-black uppercase tracking-widest">Buscar</span>
                </button>
                <div className="relative -mt-10">
                    <button 
                        onClick={() => setCurrentView('CART')}
                        className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 ${cart.length > 0 ? 'bg-indigo-600 text-white rotate-3' : 'bg-slate-200 text-slate-400'}`}>
                        <ShoppingCart size={24}/>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
                {loyaltyEnabled && (
                    <button 
                        onClick={() => setCurrentView('REDEEM')}
                        className={`flex flex-col items-center gap-1 transition-all ${currentView === 'REDEEM' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                        <Star size={24} className={currentView === 'REDEEM' ? 'fill-indigo-600' : ''}/>
                        <span className="text-[7px] font-black uppercase tracking-widest">Canjes</span>
                    </button>
                )}
                <button 
                    onClick={() => window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}`, '_blank')}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-green-500 transition-colors">
                    <MessageCircle size={24}/>
                    <span className="text-[7px] font-black uppercase tracking-widest">Chat</span>
                </button>
            </nav>
        </div>
    );
};

export default PublicPortal;
