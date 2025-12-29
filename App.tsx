
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, ShoppingCart, ShoppingBag, X, Plus, Minus, 
    ArrowRight, MessageCircle, Star, ShieldCheck, Truck, 
    ChevronRight, LayoutGrid, List, Filter, Info, Phone,
    Zap, Tag, Globe, Sparkles, Instagram, Facebook, 
    Clock, MapPin, CheckCircle, Package, ArrowLeft,
    CreditCard, ExternalLink, Calculator, Trash2
} from 'lucide-react';
import { Product, SalesOrder, InvoiceItem, CompanyConfig, Brand, Category } from '../types';
import { searchVirtualInventory } from '../services/geminiService';

const Shop: React.FC = () => {
    // --- ESTADO TIENDA ---
    const [view, setView] = useState<'HOME' | 'CATALOG' | 'PRODUCT' | 'CART' | 'CHECKOUT' | 'SUCCESS'>('HOME');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
    const [selectedBrand, setSelectedBrand] = useState<string>('TODAS');
    const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
    
    // --- DATOS DEL SISTEMA MAESTRO ---
    const [products] = useState<Product[]>(() => JSON.parse(localStorage.getItem('ferrecloud_products') || '[]'));
    const [brands] = useState<Brand[]>(() => JSON.parse(localStorage.getItem('ferrecloud_brands') || '[]'));
    const [categories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('ferrecloud_categories') || '[]'));
    const [companyConfig] = useState<CompanyConfig>(() => JSON.parse(localStorage.getItem('company_config') || '{}'));

    // --- LÓGICA DE CARRITO ---
    const addToCart = (product: Product, qty: number = 1) => {
        setCart(prev => {
            const exists = prev.find(item => item.product.id === product.id);
            if (exists) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
            }
            return [...prev, { product, quantity: qty }];
        });
    };

    const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.product.id !== productId));
    
    const updateCartQty = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const cartTotal = useMemo(() => cart.reduce((acc, curr) => acc + (curr.product.priceFinal * curr.quantity), 0), [cart]);

    // --- FILTRADO DE CATALOGO ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.internalCodes[0].toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
            const matchBrand = selectedBrand === 'TODAS' || p.brand === selectedBrand;
            return matchSearch && matchCat && matchBrand;
        });
    }, [products, searchTerm, selectedCategory, selectedBrand]);

    // --- FINALIZAR PEDIDO ---
    const handleCheckout = (formData: any) => {
        const orderId = `WEB-${Math.floor(Math.random() * 10000)}`;
        const items: InvoiceItem[] = cart.map(i => ({
            product: i.product,
            quantity: i.quantity,
            appliedPrice: i.product.priceFinal,
            subtotal: i.product.priceFinal * i.quantity
        }));

        const newOrder: SalesOrder = {
            id: orderId,
            clientName: formData.name.toUpperCase(),
            date: new Date().toLocaleDateString(),
            priority: 'NORMAL',
            status: 'PENDING',
            items: items,
            notes: `PEDIDO WEB - TEL: ${formData.phone} - ENTREGA: ${formData.address}`,
            total: cartTotal
        };

        const savedOrders = JSON.parse(localStorage.getItem('ferrecloud_sales_orders') || '[]');
        localStorage.setItem('ferrecloud_sales_orders', JSON.stringify([newOrder, ...savedOrders]));

        const waMsg = `*NUEVO PEDIDO WEB #${orderId}*\n\nCliente: ${formData.name}\nTotal: $${cartTotal.toLocaleString()}\n\n*Items:*\n${cart.map(i => `- ${i.quantity}x ${i.product.name}`).join('\n')}`;
        window.open(`https://wa.me/${companyConfig.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`, '_blank');

        setCart([]);
        setView('SUCCESS');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
            
            <nav className="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-[100] px-6 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <div onClick={() => setView('HOME')} className="flex items-center gap-3 cursor-pointer group">
                        <div className="p-2 bg-slate-900 rounded-xl text-white group-hover:bg-indigo-600 transition-colors">
                            <Sparkles size={20}/>
                        </div>
                        <h1 className="font-black text-lg tracking-tighter uppercase leading-none">
                            {companyConfig.fantasyName || 'FerreCloud'}<br/>
                            <span className="text-[10px] text-indigo-600 tracking-widest">Tienda Oficial</span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('CART')} className="relative p-3 bg-slate-50 rounded-2xl text-slate-900 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95">
                        <ShoppingBag size={20}/>
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

            <main className="pt-16 min-h-screen">
                {view === 'HOME' && (
                    <div className="animate-fade-in">
                        <section className="relative h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                            <div className="max-w-3xl space-y-8">
                                <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase">
                                    Potencia tu<br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Proyecto</span>
                                </h2>
                                <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">Más de 140,000 artículos con stock inmediato.</p>
                                <button onClick={() => setView('CATALOG')} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3 mx-auto">
                                    Ver Catálogo Completo <ArrowRight size={18}/>
                                </button>
                            </div>
                        </section>
                    </div>
                )}

                {view === 'CATALOG' && (
                    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in flex flex-col md:flex-row gap-10">
                        <aside className="w-full md:w-64 space-y-10 shrink-0">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorías</h4>
                            <div className="flex flex-col gap-2">
                                {['TODOS', ...categories.map(c => c.name)].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setSelectedCategory(c)}
                                        className={`text-left px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedCategory === c ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-50 hover:bg-slate-100'}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <div className="flex-1 space-y-8">
                            <div className="relative w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                <input 
                                    type="text" 
                                    placeholder="Busca por nombre o SKU..." 
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                                {filteredProducts.map(p => (
                                    <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col h-[450px] group">
                                        <div className="h-64 bg-slate-50 flex items-center justify-center p-10">
                                            <Package size={64} className="text-slate-200 group-hover:scale-110 transition-transform"/>
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-tight mb-1">{p.name}</h4>
                                            <div className="mt-auto flex justify-between items-center">
                                                <p className="text-2xl font-black text-slate-900">${p.priceFinal.toLocaleString('es-AR')}</p>
                                                <button onClick={() => addToCart(p)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all">
                                                    <Plus size={20}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'CART' && (
                    <div className="max-w-3xl mx-auto px-6 py-12 animate-fade-in space-y-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('CATALOG')} className="p-3 bg-slate-100 rounded-2xl"><ArrowLeft size={20}/></button>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Tu Carrito</h2>
                        </div>

                        <div className="space-y-4">
                            {cart.length === 0 ? (
                                <p className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">El carrito está vacío</p>
                            ) : (
                                <>
                                    {cart.map(item => (
                                        <div key={item.product.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-6">
                                                <Package size={24} className="text-slate-200"/>
                                                <div>
                                                    <h4 className="font-black text-slate-800 uppercase text-sm">{item.product.name}</h4>
                                                    <p className="text-sm font-black text-indigo-600">${item.product.priceFinal.toLocaleString('es-AR')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl">
                                                    <button onClick={() => updateCartQty(item.product.id, -1)}><Minus size={14}/></button>
                                                    <span className="font-black text-xs">{item.quantity}</span>
                                                    <button onClick={() => updateCartQty(item.product.id, 1)}><Plus size={14}/></button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.product.id)} className="text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
                                        <div className="flex justify-between items-baseline border-t border-white/10 pt-6">
                                            <span className="text-sm font-black uppercase tracking-widest">Total Final</span>
                                            <span className="text-4xl font-black tracking-tighter">${cartTotal.toLocaleString('es-AR')}</span>
                                        </div>
                                        <button onClick={() => setView('CHECKOUT')} className="w-full mt-10 bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest">INICIAR PEDIDO</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {view === 'CHECKOUT' && (
                    <div className="max-w-xl mx-auto px-6 py-12 animate-fade-in space-y-10">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Datos de Entrega</h2>
                        <form 
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleCheckout(Object.fromEntries(formData));
                            }}
                            className="space-y-6">
                            <input name="name" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold" placeholder="Tu Nombre Completo" />
                            <input name="phone" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold" placeholder="WhatsApp" />
                            <input name="address" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold" placeholder="Dirección de Envío" />
                            <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">ENVIAR PEDIDO POR WHATSAPP</button>
                        </form>
                    </div>
                )}

                {view === 'SUCCESS' && (
                    <div className="max-w-xl mx-auto px-6 py-20 text-center animate-fade-in space-y-8">
                        <CheckCircle size={64} className="text-green-500 mx-auto"/>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">¡Pedido Enviado!</h2>
                        <p className="text-slate-500 font-medium">Te contactaremos a la brevedad para coordinar el pago y la entrega.</p>
                        <button onClick={() => setView('HOME')} className="text-indigo-600 font-black uppercase tracking-widest underline">Volver al Inicio</button>
                    </div>
                )}
            </main>
            
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default Shop;
