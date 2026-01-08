
import React, { useState } from 'react';
import { 
    ShieldCheck, Lock, Unlock, Zap, Globe, 
    Bot, CreditCard, Calendar, User, Save,
    RefreshCw, AlertTriangle, Key, Activity,
    Database, Receipt, Truck, Calculator,
    Smartphone, Star, Users, DollarSign, Wallet,
    ClipboardList, FileText, BarChart3, Cloud
} from 'lucide-react';
import { SystemLicense, ViewState } from '../types';

const INITIAL_LICENSE: SystemLicense = {
    status: 'ACTIVE',
    expiryDate: '2025-12-31',
    clientName: 'FERRETERÍA BRUZZONE',
    planName: 'CLOUD ELITE UNLIMITED',
    creatorKey: 'DEV-ROOT-9922',
    enabledModules: {
        [ViewState.AI_ASSISTANT]: true,
        [ViewState.ONLINE_SALES]: true,
        [ViewState.ECOMMERCE_ADMIN]: true,
        [ViewState.ACCOUNTING]: true,
        [ViewState.MARKETING]: true,
        [ViewState.CLOUD_HUB]: true,
        [ViewState.AFIP_CONFIG]: true,
        [ViewState.SHOP]: true,
        [ViewState.POS]: true,
        [ViewState.INVENTORY]: true,
        [ViewState.TREASURY]: true,
        [ViewState.CLIENT_BALANCES]: true,
        [ViewState.PROVIDER_BALANCES]: true,
    }
};

const LicenseManager: React.FC = () => {
    const [license, setLicense] = useState<SystemLicense>(() => {
        const saved = localStorage.getItem('ferrecloud_license');
        return saved ? JSON.parse(saved) : INITIAL_LICENSE;
    });

    const [isSaving, setIsSaving] = useState(false);

    const toggleModule = (module: ViewState) => {
        setLicense(prev => ({
            ...prev,
            enabledModules: {
                ...prev.enabledModules,
                [module]: !prev.enabledModules[module]
            }
        }));
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            localStorage.setItem('ferrecloud_license', JSON.stringify(license));
            setIsSaving(false);
            window.dispatchEvent(new Event('license_updated'));
            alert("✅ Configuración de Licencia actualizada correctamente.");
        }, 1000);
    };

    const moduleCategories = [
        { 
            label: 'Ventas y Clientes', 
            modules: [
                { id: ViewState.POS, label: 'Punto de Venta (POS)', icon: Receipt },
                { id: ViewState.CLIENT_BALANCES, label: 'Saldos de Clientes', icon: DollarSign },
                { id: ViewState.REMITOS, label: 'Gestión de Remitos', icon: ClipboardList },
                { id: ViewState.PRESUPUESTOS, label: 'Presupuestos', icon: FileText }
            ]
        },
        { 
            label: 'Stock y Proveedores', 
            modules: [
                { id: ViewState.INVENTORY, label: 'Maestro de Artículos', icon: Database },
                { id: ViewState.PROVIDER_BALANCES, label: 'Saldos Proveedores', icon: Truck },
                { id: ViewState.STOCK_ADJUSTMENT, label: 'Ajustes de Stock', icon: Activity },
                { id: ViewState.REPLENISHMENT, label: 'Reposición Automática', icon: Zap }
            ]
        },
        { 
            label: 'Finanzas e IA', 
            modules: [
                { id: ViewState.ACCOUNTING, label: 'Contabilidad Pro', icon: Calculator },
                { id: ViewState.TREASURY, label: 'Cajas y Valores', icon: Wallet },
                { id: ViewState.AI_ASSISTANT, label: 'Asistente IA FerreBot', icon: Bot },
                { id: ViewState.ANALYTICS, label: 'Dashboard Analítico', icon: BarChart3 }
            ]
        },
        { 
            label: 'Ecosistema Cloud', 
            modules: [
                { id: ViewState.SHOP, label: 'Tienda Online Propia', icon: Globe },
                { id: ViewState.ONLINE_SALES, label: 'Hub ML / TiendaNube', icon: Smartphone },
                { id: ViewState.MARKETING, label: 'Puntos y Fidelidad', icon: Star },
                { id: ViewState.CLOUD_HUB, label: 'Sincronización Cloud', icon: Cloud }
            ]
        }
    ];

    return (
        <div className="p-8 h-full flex flex-col space-y-8 bg-slate-950 text-white overflow-hidden font-sans">
            <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl shrink-0">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-600/20">
                        <Key size={32}/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Consola Maestra de Licencias</h2>
                        <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">Control de Activación para Clientes</p>
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-white text-slate-950 px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-100 transition-all flex items-center gap-3">
                    {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
                    {isSaving ? 'Guardando...' : 'Aplicar Configuración'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 space-y-8">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">Status de Suscripción</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">Vencimiento Global</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl font-black text-white outline-none focus:ring-2 focus:ring-indigo-600"
                                        value={license.expiryDate}
                                        onChange={e => setLicense({...license, expiryDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">Estado del Sistema</label>
                                    <select 
                                        className={`w-full p-4 border border-white/5 rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-600 ${license.status === 'LOCKED' ? 'bg-red-900/20 text-red-500' : 'bg-white/5 text-green-400'}`}
                                        value={license.status}
                                        onChange={e => setLicense({...license, status: e.target.value as any})}
                                    >
                                        <option value="ACTIVE" className="bg-slate-900 text-green-400">ACTIVO / NORMAL</option>
                                        <option value="LOCKED" className="bg-slate-900 text-red-500">BLOQUEADO POR IMPAGO</option>
                                        <option value="TRIAL" className="bg-slate-900 text-yellow-400">PERÍODO DE PRUEBA</option>
                                        <option value="EXPIRED" className="bg-slate-900 text-red-400">LICENCIA VENCIDA</option>
                                    </select>
                                </div>
                                <div className="p-6 bg-amber-600/10 rounded-2xl border border-amber-500/20 flex items-start gap-4">
                                    <AlertTriangle className="text-amber-400 shrink-0" size={20}/>
                                    <p className="text-[10px] text-amber-300 font-medium leading-relaxed uppercase">
                                        Si bloqueas el sistema, todos los usuarios del local (incluyendo ADMIN) perderán acceso total a la operatividad.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {moduleCategories.map(cat => (
                            <div key={cat.label} className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] border-b border-white/5 pb-4">{cat.label}</h3>
                                <div className="space-y-2">
                                    {cat.modules.map(mod => (
                                        <div 
                                            key={mod.id} 
                                            onClick={() => toggleModule(mod.id as ViewState)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group ${license.enabledModules[mod.id] ? 'bg-white/5 border-indigo-600' : 'bg-transparent border-white/5 opacity-40 hover:opacity-100'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${license.enabledModules[mod.id] ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400'}`}>
                                                    <mod.icon size={18}/>
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-tight">{mod.label}</span>
                                            </div>
                                            <div className={`w-10 h-5 rounded-full relative transition-all ${license.enabledModules[mod.id] ? 'bg-green-500' : 'bg-slate-700'}`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${license.enabledModules[mod.id] ? 'right-1' : 'left-1'}`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LicenseManager;
