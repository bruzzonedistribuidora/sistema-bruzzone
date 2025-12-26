
import React from 'react';
import { 
    Settings, Building2, ShieldCheck, Shield, Store, LayoutTemplate, 
    HardDrive, Mail, DollarSign, Globe, Smartphone, Landmark,
    ArrowRight, Calculator, Bell, RefreshCw, FileText, UserCheck, Key
} from 'lucide-react';
import { ViewState } from '../types';

interface ConfigPanelProps {
    onNavigate: (view: ViewState) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ onNavigate }) => {
    const configCards = [
        { 
            id: ViewState.COMPANY_SETTINGS, 
            label: 'Mi Empresa', 
            desc: 'Razón social, logo, datos fiscales y cuentas bancarias.', 
            icon: Building2, 
            color: 'bg-indigo-500' 
        },
        { 
            id: ViewState.AFIP_CONFIG, 
            label: 'Enlace Fiscal ARCA', 
            desc: 'Factura electrónica, puntos de venta y certificados.', 
            icon: ShieldCheck, 
            color: 'bg-blue-600' 
        },
        { 
            id: ViewState.USERS, 
            label: 'Seguridad y Roles', 
            desc: 'Gestión de usuarios y permisos detallados por función.', 
            icon: Shield, 
            color: 'bg-purple-600' 
        },
        { 
            id: ViewState.BRANCHES, 
            label: 'Sucursales', 
            desc: 'Administrar sucursales, depósitos y logística.', 
            icon: Store, 
            color: 'bg-emerald-600' 
        },
        { 
            id: ViewState.PRINT_CONFIG, 
            label: 'Formatos de Impresión', 
            desc: 'Diseñar tickets, facturas A/B y remitos.', 
            icon: LayoutTemplate, 
            color: 'bg-orange-500' 
        },
        { 
            id: ViewState.BACKUP, 
            label: 'Base de Datos', 
            desc: 'Copias de seguridad y restauración del sistema.', 
            icon: HardDrive, 
            color: 'bg-slate-700' 
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-8 bg-slate-50 overflow-y-auto animate-fade-in">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        <Settings size={32} className="text-indigo-600"/> Panel de Control Maestro
                    </h2>
                    <p className="text-gray-400 font-medium mt-2">Configuración global para la gestión de los 140.000 artículos y operación fiscal.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-green-50 px-6 py-2 rounded-2xl border border-green-100 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-black text-green-700 uppercase tracking-widest">SISTEMA ONLINE</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                {configCards.map(card => (
                    <button 
                        key={card.id}
                        onClick={() => onNavigate(card.id)}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all text-left flex flex-col group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                            <card.icon size={120}/>
                        </div>
                        <div className={`p-4 rounded-2xl ${card.color} text-white shadow-lg w-fit mb-6`}>
                            <card.icon size={28}/>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{card.label}</h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8">{card.desc}</p>
                        <div className="mt-auto flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                            Configurar ahora <ArrowRight size={14}/>
                        </div>
                    </button>
                ))}
            </div>

            {/* SECCIÓN TÉCNICA RÁPIDA */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col lg:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Key size={180}/></div>
                <div className="relative z-10 max-w-lg">
                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-4">Mantenimiento de Catálogo</h4>
                    <p className="text-slate-400 text-sm leading-relaxed italic font-medium">Herramientas críticas para el procesamiento masivo de datos. Use con precaución en horarios de poca actividad comercial.</p>
                </div>
                <div className="relative z-10 flex flex-wrap justify-center gap-3">
                    <button onClick={() => onNavigate(ViewState.PRICE_UPDATES)} className="bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Sincronizar Costos</button>
                    <button onClick={() => onNavigate(ViewState.MASS_PRODUCT_UPDATE)} className="bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Modificar Masivo</button>
                    <button onClick={() => onNavigate(ViewState.AI_ASSISTANT)} className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all">Optimizar con IA</button>
                </div>
            </div>
        </div>
    );
};

export default ConfigPanel;
