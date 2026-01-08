
import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Database, Receipt, ClipboardList, 
    FileSpreadsheet, Users, Truck, Wallet, Calculator, 
    TrendingUp, FileBarChart2, HardDrive, Store, Bot, 
    Layers, Zap, Shield, ShoppingCart, Globe, Tag, 
    Settings, Sparkles, ShieldAlert, RotateCcw, ArrowLeftRight, FileUp, ChevronDown, ArrowRight,
    Smartphone, Heart, ShoppingBag, Laptop, Cloud, CloudOff, Building2,
    LayoutGrid, ShoppingCart as OrderIcon, AlertTriangle, PackagePlus, BarChart3
} from 'lucide-react';
import { ViewState, User, CloudSyncStatus, CompanyConfig } from '../types';

interface SidebarProps {
    activeView: ViewState;
    onNavigate: (view: ViewState) => void;
    user: User | null;
}

const NavItem: React.FC<{ view: ViewState, label: string, icon: any, active: boolean, onClick: () => void }> = ({ label, icon: Icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
            active 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
        }`}
    >
        <Icon size={18} className={active ? 'text-white' : 'group-hover:text-indigo-600'} />
        <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
);

const NavDropdown: React.FC<{ id: string, label: string, icon: any, children: React.ReactNode }> = ({ label, icon: Icon, children }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className="space-y-1">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <Icon size={18} className="group-hover:text-indigo-600" />
                    <span className="text-xs font-black uppercase tracking-widest">{label}</span>
                </div>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="pl-4 space-y-1">{children}</div>}
        </div>
    );
};

const DropdownItem: React.FC<{ view: ViewState, label: string, icon: any, onClick: () => void, active: boolean }> = ({ label, icon: Icon, onClick, active }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
    >
        <Icon size={14} />
        {label}
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, user }) => {
    const handleNav = (view: ViewState) => onNavigate(view);
    const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('OFFLINE');
    const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);

    const loadConfig = () => {
        const savedSync = JSON.parse(localStorage.getItem('ferrecloud_sync_config') || '{"enabled": false}');
        const savedCompany = JSON.parse(localStorage.getItem('company_config') || '{}');
        setSyncStatus(savedSync.enabled ? 'ONLINE' : 'OFFLINE');
        setCompanyConfig(savedCompany);
    };

    useEffect(() => {
        loadConfig();
        window.addEventListener('company_config_updated', loadConfig);
        window.addEventListener('storage', loadConfig);
        return () => {
            window.removeEventListener('company_config_updated', loadConfig);
            window.removeEventListener('storage', loadConfig);
        };
    }, []);

    const renderHeader = () => {
        const mode = companyConfig?.headerDisplayMode || 'BOTH';
        const hasLogo = !!companyConfig?.logo;
        const name = companyConfig?.fantasyName || 'Bruzzone';

        return (
            <div className="flex flex-col gap-4 mb-6">
                {(mode === 'LOGO' || (mode === 'BOTH' && hasLogo)) && (
                    <div className="flex items-center justify-center">
                        {hasLogo ? (
                            <img 
                                src={companyConfig!.logo!} 
                                alt="Logo" 
                                className="max-h-16 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105"
                            />
                        ) : (
                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-ferre-orange shadow-lg">
                                <Zap size={32} fill="currentColor" />
                            </div>
                        )}
                    </div>
                )}
                
                {(mode === 'NAME' || mode === 'BOTH') && (
                    <div className={mode === 'BOTH' ? 'text-center' : 'flex items-center gap-3'}>
                        {mode === 'NAME' && !hasLogo && (
                             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-ferre-orange shrink-0">
                                <Building2 size={20} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none truncate">
                                {name}
                            </h1>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cloud System</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-slate-100">
                {renderHeader()}
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs uppercase">
                            {user?.name.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-slate-800 uppercase truncate leading-none mb-1">{user?.name || 'Usuario'}</p>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{syncStatus}</span>
                            </div>
                        </div>
                        <button onClick={() => handleNav(ViewState.CLOUD_HUB)} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
                            <Cloud size={14}/>
                        </button>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                <NavItem view={ViewState.DASHBOARD} label="Escritorio" icon={LayoutDashboard} active={activeView === ViewState.DASHBOARD} onClick={() => handleNav(ViewState.DASHBOARD)} />
                <NavItem view={ViewState.ANALYTICS} label="Dashboard" icon={BarChart3} active={activeView === ViewState.ANALYTICS} onClick={() => handleNav(ViewState.ANALYTICS)} />
                
                <NavDropdown id="ventas" label="Ventas" icon={Receipt}>
                    <DropdownItem view={ViewState.POS} label="Punto de Venta" icon={Receipt} active={activeView === ViewState.POS} onClick={() => handleNav(ViewState.POS)} />
                    <DropdownItem view={ViewState.REMITOS} label="Remitos" icon={ClipboardList} active={activeView === ViewState.REMITOS} onClick={() => handleNav(ViewState.REMITOS)} />
                    <DropdownItem view={ViewState.PRESUPUESTOS} label="Presupuestos" icon={FileSpreadsheet} active={activeView === ViewState.PRESUPUESTOS} onClick={() => handleNav(ViewState.PRESUPUESTOS)} />
                    <DropdownItem view={ViewState.CLIENTS} label="Clientes" icon={Users} active={activeView === ViewState.CLIENTS} onClick={() => handleNav(ViewState.CLIENTS)} />
                </NavDropdown>

                <NavDropdown id="inventario" label="Stock" icon={Database}>
                    <DropdownItem view={ViewState.INVENTORY} label="Maestro Artículos" icon={Database} active={activeView === ViewState.INVENTORY} onClick={() => handleNav(ViewState.INVENTORY)} />
                    <DropdownItem view={ViewState.SHORTAGES} label="Faltantes" icon={AlertTriangle} active={activeView === ViewState.SHORTAGES} onClick={() => handleNav(ViewState.SHORTAGES)} />
                    <DropdownItem view={ViewState.REPLENISHMENT} label="Armar Pedido" icon={PackagePlus} active={activeView === ViewState.REPLENISHMENT} onClick={() => handleNav(ViewState.REPLENISHMENT)} />
                    <DropdownItem view={ViewState.INITIAL_IMPORT} label="Carga Masiva" icon={FileUp} active={activeView === ViewState.INITIAL_IMPORT} onClick={() => handleNav(ViewState.INITIAL_IMPORT)} />
                    <DropdownItem view={ViewState.PRICE_UPDATES} label="Precios & Listas" icon={Layers} active={activeView === ViewState.PRICE_UPDATES} onClick={() => handleNav(ViewState.PRICE_UPDATES)} />
                    <DropdownItem view={ViewState.MASS_PRODUCT_UPDATE} label="Cambios Masivos" icon={Zap} active={activeView === ViewState.MASS_PRODUCT_UPDATE} onClick={() => handleNav(ViewState.MASS_PRODUCT_UPDATE)} />
                </NavDropdown>

                <NavItem view={ViewState.PURCHASES} label="Compras" icon={Truck} active={activeView === ViewState.PURCHASES} onClick={() => handleNav(ViewState.PURCHASES)} />
                <NavItem view={ViewState.TREASURY} label="Tesorería" icon={Wallet} active={activeView === ViewState.TREASURY} onClick={() => handleNav(ViewState.TREASURY)} />
                
                <NavDropdown id="presencia" label="Digital" icon={Globe}>
                    <DropdownItem view={ViewState.ONLINE_SALES} label="Pedidos Online" icon={OrderIcon} active={activeView === ViewState.ONLINE_SALES} onClick={() => handleNav(ViewState.ONLINE_SALES)} />
                    <DropdownItem view={ViewState.ECOMMERCE_ADMIN} label="Catálogo Web" icon={Laptop} active={activeView === ViewState.ECOMMERCE_ADMIN} onClick={() => handleNav(ViewState.ECOMMERCE_ADMIN)} />
                    <DropdownItem view={ViewState.PUBLIC_PORTAL} label="Portal Fidelidad" icon={Smartphone} active={activeView === ViewState.PUBLIC_PORTAL} onClick={() => handleNav(ViewState.PUBLIC_PORTAL)} />
                </NavDropdown>

                <NavItem view={ViewState.AI_ASSISTANT} label="FerreBot IA" icon={Bot} active={activeView === ViewState.AI_ASSISTANT} onClick={() => handleNav(ViewState.AI_ASSISTANT)} />
                
                <div className="pt-4 mt-4 border-t border-slate-100">
                    <NavItem view={ViewState.CLOUD_HUB} label="Nube Central" icon={Cloud} active={activeView === ViewState.CLOUD_HUB} onClick={() => handleNav(ViewState.CLOUD_HUB)} />
                    <NavItem view={ViewState.CONFIG_PANEL} label="Configuración" icon={Settings} active={activeView === ViewState.CONFIG_PANEL} onClick={() => handleNav(ViewState.CONFIG_PANEL)} />
                </div>
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-indigo-900 rounded-2xl p-4 text-white relative overflow-hidden group cursor-pointer" onClick={() => handleNav(ViewState.SHOP)}>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Globe size={80}/></div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300 mb-1">Tu Sucursal Online</p>
                    <h4 className="text-xs font-black uppercase tracking-tighter">Venta Web Propia</h4>
                    <ArrowRight size={14} className="mt-3 text-indigo-400 group-hover:translate-x-2 transition-transform" />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
