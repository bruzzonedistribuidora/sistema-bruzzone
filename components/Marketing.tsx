
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Tag, Star, Send, Users, Sparkles, Plus, X, Save, 
    Gift, Calendar, Ticket, Megaphone, CheckCircle, 
    Smartphone, Mail, MessageCircle, TrendingUp, Info,
    Percent, DollarSign, ArrowRight, ShieldCheck, Clock,
    Trash2, Edit, MousePointer2, Zap, LayoutGrid, RefreshCw, QrCode, Printer,
    Copy, ExternalLink, Globe, Smartphone as MobileIcon, ListOrdered, Share2, Eye,
    ShoppingBag, Link, Instagram, Facebook
} from 'lucide-react';
import { Coupon, LoyaltyConfig, MarketingCampaign, Client, CompanyConfig } from '../types';

type MarketingTab = 'LOYALTY' | 'COUPONS' | 'CAMPAIGNS' | 'PUBLIC_PORTAL';

const Marketing: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MarketingTab>('LOYALTY');

    const [loyalty, setLoyalty] = useState<LoyaltyConfig>(() => {
        const saved = localStorage.getItem('company_config');
        if (saved) {
            const config: CompanyConfig = JSON.parse(saved);
            return config.loyalty || { enabled: true, pointsPerPeso: 0.01, minPointsToRedeem: 500, valuePerPoint: 2 };
        }
        return { enabled: true, pointsPerPeso: 0.01, minPointsToRedeem: 500, valuePerPoint: 2 };
    });

    const [coupons, setCoupons] = useState<Coupon[]>(() => {
        const saved = localStorage.getItem('ferrecloud_coupons');
        return saved ? JSON.parse(saved) : [
            { id: '1', code: 'BIENVENIDA', description: 'Promo primer ingreso portal', discountType: 'PERCENT', value: 10, validUntil: '2024-12-31', usedCount: 45, active: true }
        ];
    });

    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => {
        const saved = localStorage.getItem('ferrecloud_campaigns');
        return saved ? JSON.parse(saved) : [
            { id: 'c1', name: 'Ofertas Primavera', targetSegment: 'ALL', channel: 'WHATSAPP', message: '¡No te pierdas los descuentos de temporada!', sentDate: '2023-09-21', reach: 1200 }
        ];
    });

    const [clients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));

    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
        code: '', description: '', discountType: 'PERCENT', value: 0, active: true, usedCount: 0, validUntil: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const saved = localStorage.getItem('company_config');
        const config: CompanyConfig = saved ? JSON.parse(saved) : { name: '', paymentAccounts: [] };
        config.loyalty = loyalty;
        localStorage.setItem('company_config', JSON.stringify(config));
        window.dispatchEvent(new Event('company_config_updated'));
    }, [loyalty]);

    useEffect(() => localStorage.setItem('ferrecloud_coupons', JSON.stringify(coupons)), [coupons]);

    const handleSaveCoupon = () => {
        if (!couponForm.code || !couponForm.value) return;
        const newCoupon = { ...couponForm, id: couponForm.id || Date.now().toString() } as Coupon;
        setCoupons(prev => couponForm.id ? prev.map(c => c.id === couponForm.id ? newCoupon : c) : [newCoupon, ...prev]);
        setIsCouponModalOpen(false);
    };

    const portalLink = `${window.location.origin}/portal/fidelidad`;

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-fade-in bg-slate-50 overflow-hidden">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-slate-900 text-indigo-400 rounded-3xl shadow-xl"><Sparkles size={32}/></div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Marketing & Fidelidad</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Crecimiento y Retención de Clientes</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
                    <button onClick={() => setActiveTab('LOYALTY')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'LOYALTY' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Puntos</button>
                    <button onClick={() => setActiveTab('COUPONS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'COUPONS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Cupones</button>
                    <button onClick={() => setActiveTab('CAMPAIGNS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'CAMPAIGNS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>Difusión</button>
                    <button onClick={() => setActiveTab('PUBLIC_PORTAL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'PUBLIC_PORTAL' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}>Canales Web</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {activeTab === 'LOYALTY' && (
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Configuración del Club Bruzzone</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Acumulación automática de puntos en cada venta</p>
                            </div>
                            <div onClick={() => setLoyalty({...loyalty, enabled: !loyalty.enabled})} className={`w-14 h-7 rounded-full relative cursor-pointer transition-all ${loyalty.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${loyalty.enabled ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={14}/> Coeficiente de Suma</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-black text-slate-700 uppercase">Por cada $1 de compra</p>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="0.01" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-indigo-600 text-2xl shadow-inner outline-none focus:border-indigo-500" value={loyalty.pointsPerPeso} onChange={e => setLoyalty({...loyalty, pointsPerPeso: parseFloat(e.target.value) || 0})} />
                                            <span className="font-black text-slate-400 uppercase text-xs">Puntos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><DollarSign size={14}/> Valor de Canje</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-black text-slate-700 uppercase">Cada 1 Punto equivale a</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-black text-green-500">$</span>
                                            <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-green-600 text-2xl shadow-inner outline-none focus:border-green-500" value={loyalty.valuePerPoint} onChange={e => setLoyalty({...loyalty, valuePerPoint: parseFloat(e.target.value) || 0})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Star size={120}/></div>
                            <div className="relative z-10">
                                <h4 className="text-2xl font-black uppercase tracking-tighter">Mínimo de Canje</h4>
                                <p className="text-indigo-300 text-xs font-bold uppercase mt-1">Los clientes podrán generar cupones desde esta base</p>
                            </div>
                            <div className="relative z-10 flex items-center gap-3">
                                <input type="number" className="w-32 p-4 bg-white/10 border border-white/20 rounded-2xl font-black text-3xl text-center outline-none focus:bg-white/20" value={loyalty.minPointsToRedeem} onChange={e => setLoyalty({...loyalty, minPointsToRedeem: parseInt(e.target.value) || 0})} />
                                <span className="text-xl font-black uppercase">PTS</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'COUPONS' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestor de Descuentos</h3>
                            <button onClick={() => { setCouponForm({code: '', description: '', discountType: 'PERCENT', value: 0, active: true, usedCount: 0, validUntil: new Date().toISOString().split('T')[0]}); setIsCouponModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                                <Plus size={16}/> Crear Cupón
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {coupons.map(c => (
                                <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-xl group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 bg-indigo-600 text-white rounded-bl-3xl font-black text-xs uppercase shadow-lg z-10">
                                        {c.discountType === 'PERCENT' ? `${c.value}%` : `$${c.value}`} OFF
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 uppercase font-mono">{c.code}</h4>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-6">{c.description}</p>
                                    <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center text-slate-400 text-[10px] font-black uppercase">
                                        <div className="flex flex-col">
                                            <span>Validez: {c.validUntil}</span>
                                            <span className="text-indigo-400">Canjes: {c.usedCount}</span>
                                        </div>
                                        <button onClick={() => setCoupons(coupons.filter(x => x.id !== c.id))} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'PUBLIC_PORTAL' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in pb-20">
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 flex flex-col h-full">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl"><Smartphone size={28}/></div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Portal Fidelidad</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">App web para tus clientes</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed italic">Comparte este link con tus clientes para que consulten sus puntos acumulados y canjeen cupones desde su celular ingresando su DNI.</p>
                            <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 border border-slate-100">
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block ml-2">Enlace de acceso rápido</label>
                                <div className="bg-white p-4 rounded-2xl border flex items-center gap-3 shadow-inner">
                                    <Globe size={18} className="text-slate-300"/>
                                    <span className="text-[11px] font-mono truncate flex-1 text-indigo-600 font-bold">{portalLink}</span>
                                    <button onClick={() => { navigator.clipboard.writeText(portalLink); alert('Enlace Copiado'); }} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all"><Copy size={16}/></button>
                                </div>
                            </div>
                            <div className="mt-auto pt-8 border-t border-slate-50 flex gap-4">
                                <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                                    <QrCode size={18}/> Descargar QR Mostrador
                                </button>
                                <button className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-all" title="Vista Previa"><Eye size={20}/></button>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-8 flex flex-col relative overflow-hidden shadow-2xl h-full">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><ShoppingBag size={240}/></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-900/50"><Globe size={28}/></div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Tu Tienda Online Cloud</h3>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Venta Directa 24/7</p>
                                </div>
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block ml-2">Publicación en Redes</label>
                                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex items-center gap-3 shadow-inner">
                                        <Link size={18} className="text-slate-600"/>
                                        <span className="text-[11px] font-mono truncate flex-1 text-indigo-300">{window.location.origin}/shop</span>
                                        <button className="p-2.5 bg-white text-slate-900 rounded-xl hover:bg-indigo-400 transition-all"><Copy size={16}/></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="bg-gradient-to-br from-pink-600 to-purple-600 p-6 rounded-[2rem] flex flex-col items-center gap-3 shadow-lg hover:scale-105 transition-all">
                                        <Instagram size={32}/>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Link en Bio</span>
                                    </button>
                                    <button className="bg-blue-600 p-6 rounded-[2rem] flex flex-col items-center gap-3 shadow-lg hover:scale-105 transition-all">
                                        <Facebook size={32}/>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Botón FB</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL: CUPONES */}
            {isCouponModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Nuevo Cupón de Descuento</h3>
                            <button onClick={() => setIsCouponModalOpen(false)}><X size={28}/></button>
                        </div>
                        <div className="p-10 space-y-6 bg-slate-50/50">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Código del Cupón (Ej: PRIMERA-COMPRA)</label>
                                    <input type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-indigo-600 outline-none uppercase shadow-sm focus:border-indigo-500 transition-all" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Tipo</label>
                                        <select className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-xs uppercase outline-none shadow-sm" value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value as any})}>
                                            <option value="PERCENT">Porcentaje (%)</option>
                                            <option value="FIXED">Monto Fijo ($)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Valor</label>
                                        <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-slate-800 outline-none shadow-sm" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: parseFloat(e.target.value) || 0})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Fecha Vencimiento</label>
                                    <input type="date" className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold outline-none shadow-sm" value={couponForm.validUntil} onChange={e => setCouponForm({...couponForm, validUntil: e.target.value})} />
                                </div>
                            </div>
                            <button onClick={handleSaveCoupon} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95">
                                <Save size={18}/> Activar Cupón Pro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketing;
