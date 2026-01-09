
import React, { useState, useEffect, useMemo } from 'react';
import { 
    LayoutDashboard, Database, Receipt, ClipboardList, 
    FileSpreadsheet, Users, Truck, Wallet, Calculator, 
    TrendingUp, FileBarChart2, HardDrive, Store, Bot, 
    Layers, Zap, Shield, ShoppingCart, Globe, Tag, 
    Settings, Sparkles, ShieldAlert, RotateCcw, ArrowLeftRight, FileUp, ChevronDown, ArrowRight,
    Smartphone, Heart, ShoppingBag, Laptop, Cloud, CloudOff, Building2,
    LayoutGrid, ShoppingCart as OrderIcon, AlertTriangle, PackagePlus, BarChart3,
    Scale, Activity, Settings2, DollarSign, Key, LogOut, Laptop2
} from 'lucide-react';
import { ViewState, User, CloudSyncStatus, CompanyConfig, SystemLicense } from '../types';

interface SidebarProps {
    activeView: ViewState;
    onNavigate: (view: ViewState) => void;
    user: User | null;
    onLogout: () => void;
}

const NavItem: React.FC<{ view: ViewState, label: string, icon: any, active: boolean, onClick: () => void }> = ({ label, icon: Icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
            active 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
        }`}
    >
        <Icon size={16} className={active ? 'text-white' : 'group-hover:text-indigo-600'} />
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </button>
);

const NavDropdown: React.FC<{ id: string, label: string, icon: any, children: React.ReactNode }> = ({ label, icon: Icon, children }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className="space-y-0.5">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all group"
            >
                <div className="flex items-center gap-2.5">
                    <Icon size={16} className="group-hover:text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                </div>
                <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="pl-3 space-y-0.5 border-l border-slate-100 ml-5">{children}</div>}
        </div>
    );
};

const DropdownItem: React.FC<{ view: ViewState, label: string, icon: any, onClick: () => void, active: boolean }> = ({ label, icon: Icon, onClick, active }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
    >
        <Icon size={12} />
        {label}
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, user, onLogout }) => {
    const handleNav = (view: ViewState) => onNavigate(view);
    const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('OFFLINE');
    const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
    const [license, setLicense] = useState<SystemLicense | null>(null);

    const loadConfig = () => {
        const savedSync = JSON.parse(localStorage.getItem('ferrecloud_sync_config') || '{"enabled": false}');
        const savedCompany = JSON.parse(localStorage.getItem('company_config') || '{}');
        const savedLicense = JSON.parse(localStorage.getItem('ferrecloud_license') || 'null');
        setSyncStatus(savedSync.enabled ? 'ONLINE' : 'OFFLINE');
        setCompanyConfig(savedCompany);
        setLicense(savedLicense);
    };

    useEffect(() => {
        loadConfig();
        window.addEventListener('company_config_updated', loadConfig);
        window.addEventListener('license_updated', loadConfig);
        window.addEventListener('storage', loadConfig);
        return () => {
            window.removeEventListener('company_config_updated', loadConfig);
            window.removeEventListener('license_updated', loadConfig);
            window.removeEventListener('storage', loadConfig);
        };
    }, []);

    const isCreator = user?.roleId === 'creator';

    const isModuleEnabled = (view: ViewState) => {
        if (isCreator) return true;
        if (!license) return true;
        if (license.status === 'LOCKED') return false;
        return license.enabledModules[view] !== false;
    };

    const renderHeader = () => {
        const mode = companyConfig?.headerDisplayMode || 'BOTH';
        const hasLogo = !!companyConfig?.logo;
        const name = companyConfig?.fantasyName || 'Bruzzone';

        return (
            <div className="flex flex-col gap-2 mb-4">
                {(mode === 'LOGO' || (mode === 'BOTH' && hasLogo)) && (
                    <div className="flex items-center justify-center">
                        {hasLogo ? (
                            <img 
                                src={companyConfig!.logo!} 
                                alt="Logo" 
                                className="max-h-12 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-ferre-orange shadow-lg">
                                <Zap size={24} fill="currentColor" />
                            </div>
                        )}
                    </div>
                )}
                
                {(mode === 'NAME' || mode === 'BOTH') && (
                    <div className={mode === 'BOTH' ? 'text-center' : 'flex items-center gap-2'}>
                        <div className="min-w-0">
                            <h1 className="text-[11px] font-black text-slate-900 uppercase tracking-tighter leading-none truncate">
                                {name}
                            </h1>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-52 bg-white border-r border-slate-200 h-full flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b border-slate-100">
                {renderHeader()}
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[10px] uppercase shrink-0">
                            {user?.name.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black text-slate-800 uppercase truncate leading-none">{user?.name || 'Usuario'}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <div className={`w-1 h-1 rounded-full ${syncStatus === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                <span className="text-[7px] font-bold text-slate-400 uppercase">{syncStatus}</span>
                            </div>
                        </div>
                        <button onClick={onLogout} className="text-slate-300 hover:text-red-500 p-1">
                            <LogOut size={12}/>
                        </button>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-0.5">
                <NavItem view={ViewState.DASHBOARD} label="Escritorio" icon={LayoutDashboard} active={activeView === ViewState.DASHBOARD} onClick={() => handleNav(ViewState.DASHBOARD)} />
                <NavItem view={ViewState.ANALYTICS} label="Dashboard" icon={BarChart3} active={activeView === ViewState.ANALYTICS} onClick={() => handleNav(ViewState.ANALYTICS)} />
                
                <NavDropdown id="ventas" label="Ventas" icon={Receipt}>
                    {isModuleEnabled(ViewState.POS) && <DropdownItem view={ViewState.POS} label="POS" icon={Receipt} active={activeView === ViewState.POS} onClick={() => handleNav(ViewState.POS)} />}
                    {isModuleEnabled(ViewState.CLIENT_BALANCES) && <DropdownItem view={ViewState.CLIENT_BALANCES} label="Saldos" icon={DollarSign} active={activeView === ViewState.CLIENT_BALANCES} onClick={() => handleNav(ViewState.CLIENT_BALANCES)} />}
                    {isModuleEnabled(ViewState.REMITOS) && <DropdownItem view={ViewState.REMITOS} label="Remitos" icon={ClipboardList} active={activeView === ViewState.REMITOS} onClick={() => handleNav(ViewState.REMITOS)} />}
                    {isModuleEnabled(ViewState.PRESUPUESTOS) && <DropdownItem view={ViewState.PRESUPUESTOS} label="Presupuestos" icon={FileSpreadsheet} active={activeView === ViewState.PRESUPUESTOS} onClick={() => handleNav(ViewState.PRESUPUESTOS)} />}
                    <DropdownItem view={ViewState.CLIENTS} label="Clientes" icon={Users} active={activeView === ViewState.CLIENTS} onClick={() => handleNav(ViewState.CLIENTS)} />
                </NavDropdown>

                <NavDropdown id="digital" label="E-Commerce" icon={Globe}>
                    {isModuleEnabled(ViewState.ECOMMERCE_ADMIN) && <DropdownItem view={ViewState.ECOMMERCE_ADMIN} label="Gestión Web" icon={Laptop2} active={activeView === ViewState.ECOMMERCE_ADMIN} onClick={() => handleNav(ViewState.ECOMMERCE_ADMIN)} />}
                    {isModuleEnabled(ViewState.ONLINE_SALES) && <DropdownItem view={ViewState.ONLINE_SALES} label="Hub Canales" icon={OrderIcon} active={activeView === ViewState.ONLINE_SALES} onClick={() => handleNav(ViewState.ONLINE_SALES)} />}
                    {isModuleEnabled(ViewState.MARKETING) && <DropdownItem view={ViewState.MARKETING} label="Fidelización" icon={Tag} active={activeView === ViewState.MARKETING} onClick={() => handleNav(ViewState.MARKETING)} />}
                </NavDropdown>

                <NavDropdown id="inventario" label="Stock" icon={Database}>
                    {isModuleEnabled(ViewState.INVENTORY) && <DropdownItem view={ViewState.INVENTORY} label="Maestro" icon={Database} active={activeView === ViewState.INVENTORY} onClick={() => handleNav(ViewState.INVENTORY)} />}
                    {isModuleEnabled(ViewState.STOCK_ADJUSTMENT) && <DropdownItem view={ViewState.STOCK_ADJUSTMENT} label="Ajustes" icon={Settings2} active={activeView === ViewState.STOCK_ADJUSTMENT} onClick={() => handleNav(ViewState.STOCK_ADJUSTMENT)} />}
                    {isModuleEnabled(ViewState.REPLENISHMENT) && <DropdownItem view={ViewState.REPLENISHMENT} label="Pedido" icon={PackagePlus} active={activeView === ViewState.REPLENISHMENT} onClick={() => handleNav(ViewState.REPLENISHMENT)} />}
                    {isModuleEnabled(ViewState.PRICE_UPDATES) && <DropdownItem view={ViewState.PRICE_UPDATES} label="Precios" icon={Layers} active={activeView === ViewState.PRICE_UPDATES} onClick={() => handleNav(ViewState.PRICE_UPDATES)} />}
                </NavDropdown>

                <NavItem view={ViewState.PURCHASES} label="Compras" icon={Truck} active={activeView === ViewState.PURCHASES} onClick={() => handleNav(ViewState.PURCHASES)} />
                
                <NavDropdown id="finanzas" label="Finanzas" icon={Calculator}>
                    {isModuleEnabled(ViewState.ACCOUNTING) && <DropdownItem view={ViewState.ACCOUNTING} label="Conta Pro" icon={TrendingUp} active={activeView === ViewState.ACCOUNTING} onClick={() => handleNav(ViewState.ACCOUNTING)} />}
                    {isModuleEnabled(ViewState.TREASURY) && <DropdownItem view={ViewState.TREASURY} label="Cajas" icon={Wallet} active={activeView === ViewState.TREASURY} onClick={() => handleNav(ViewState.TREASURY)} />}
                    <DropdownItem view={ViewState.DAILY_MOVEMENTS} label="Gastos" icon={Activity} active={activeView === ViewState.DAILY_MOVEMENTS} onClick={() => handleNav(ViewState.DAILY_MOVEMENTS)} />
                </NavDropdown>
                
                <div className="pt-2 mt-2 border-t border-slate-100">
                    <NavItem view={ViewState.CONFIG_PANEL} label="Configuración" icon={Settings} active={activeView === ViewState.CONFIG_PANEL} onClick={() => handleNav(ViewState.CONFIG_PANEL)} />
                </div>
            </nav>

            <div className="p-3 mt-auto">
                <div className="bg-indigo-900 rounded-xl p-3 text-white relative overflow-hidden group cursor-pointer" onClick={() => handleNav(ViewState.SHOP)}>
                    <p className="text-[7px] font-black uppercase text-indigo-300">Sucursal Online</p>
                    <h4 className="text-[9px] font-black uppercase">Web Propia</h4>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
