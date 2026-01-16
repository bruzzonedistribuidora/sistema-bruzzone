import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Database, Receipt, ClipboardList, 
    FileSpreadsheet, Users, Truck, Wallet, Calculator, 
    TrendingUp, Bot, Layers, Globe, Tag, 
    Settings, ChevronDown, LogOut, Laptop2, Network,
    Boxes as BoxesIcon, Tags, UserSearch, ListOrdered,
    AlertTriangle, PackagePlus, BarChart3, ArrowLeftRight,
    FileText, Landmark, Cloud, Wifi
} from 'lucide-react';
import { ViewState, User, CloudSyncStatus, CompanyConfig, SystemLicense } from '../types';

interface SidebarProps {
    activeView: ViewState;
    onNavigate: (view: ViewState) => void;
    user: User | null;
    onLogout: () => void;
}

const CategoryHeader: React.FC<{ label: string, color: string }> = ({ label, color }) => (
    <div className="flex items-center gap-3 px-4 py-4 mt-2">
        <div className={`w-1 h-4 rounded-full ${color}`}></div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
        <ChevronDown size={12} className="ml-auto text-slate-600" />
    </div>
);

const NavItem: React.FC<{ view: ViewState, label: string, icon: any, active: boolean, onClick: () => void }> = ({ label, icon: Icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-150 group ${
            active 
            ? 'bg-slate-800/50 text-white border-r-4 border-indigo-500' 
            : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
        }`}
    >
        <Icon size={18} className={`${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span className="text-[12px] font-bold tracking-tight">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, user, onLogout }) => {
    const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('OFFLINE');
    const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
    const [license, setLicense] = useState<SystemLicense | null>(null);

    const loadConfig = () => {
        const savedSync = localStorage.getItem('ferrecloud_vault_id');
        const savedCompany = JSON.parse(localStorage.getItem('company_config') || '{}');
        const savedLicense = JSON.parse(localStorage.getItem('ferrecloud_license') || 'null');
        setSyncStatus(savedSync ? 'ONLINE' : 'OFFLINE');
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

    const isModuleEnabled = (view: ViewState) => {
        if (user?.roleId === 'creator') return true;
        if (!license) return true;
        if (license.status === 'LOCKED') return false;
        return license.enabledModules[view] !== false;
    };

    return (
        <div className="w-64 bg-[#0b1120] h-full flex flex-col shrink-0 overflow-y-auto custom-scrollbar border-r border-slate-800/50 shadow-2xl">
            {/* PERFIL Y LOGO */}
            <div className="p-6 border-b border-slate-800/50 bg-[#0f172a]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm uppercase shadow-lg">
                        {companyConfig?.logo ? (
                             <img src={companyConfig.logo} alt="L" className="w-full h-full object-contain rounded-xl p-1" />
                        ) : (
                            user?.name.charAt(0) || 'B'
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[13px] font-black text-slate-100 uppercase tracking-tighter truncate leading-none">
                            {companyConfig?.fantasyName || 'Bruzzone Cloud'}
                        </h1>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                            {syncStatus}
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 flex flex-col py-2">
                <NavItem view={ViewState.REPORTS} label="Informes y Reportes" icon={FileText} active={activeView === ViewState.REPORTS} onClick={() => onNavigate(ViewState.REPORTS)} />
                
                {/* SECCIÓN VENTAS */}
                <CategoryHeader label="Ventas" color="bg-green-500" />
                {isModuleEnabled(ViewState.POS) && 
                    <NavItem view={ViewState.POS} label="Facturación (POS)" icon={Receipt} active={activeView === ViewState.POS} onClick={() => onNavigate(ViewState.POS)} />}
                {isModuleEnabled(ViewState.ONLINE_SALES) && 
                    <NavItem view={ViewState.ONLINE_SALES} label="Ventas Online" icon={Globe} active={activeView === ViewState.ONLINE_SALES} onClick={() => onNavigate(ViewState.ONLINE_SALES)} />}
                {isModuleEnabled(ViewState.REMITOS) && 
                    <NavItem view={ViewState.REMITOS} label="Remitos / Cta. Cte." icon={ClipboardList} active={activeView === ViewState.REMITOS} onClick={() => onNavigate(ViewState.REMITOS)} />}
                {isModuleEnabled(ViewState.CLIENT_BALANCES) && 
                    <NavItem view={ViewState.CLIENT_BALANCES} label="Saldos de Clientes" icon={Landmark} active={activeView === ViewState.CLIENT_BALANCES} onClick={() => onNavigate(ViewState.CLIENT_BALANCES)} />}
                {isModuleEnabled(ViewState.PRESUPUESTOS) && 
                    <NavItem view={ViewState.PRESUPUESTOS} label="Presupuestos" icon={FileText} active={activeView === ViewState.PRESUPUESTOS} onClick={() => onNavigate(ViewState.PRESUPUESTOS)} />}
                <NavItem view={ViewState.CLIENTS} label="Clientes" icon={Users} active={activeView === ViewState.CLIENTS} onClick={() => onNavigate(ViewState.CLIENTS)} />

                {/* SECCIÓN COMPRAS */}
                <CategoryHeader label="Compras" color="bg-blue-500" />
                {isModuleEnabled(ViewState.SHORTAGES) && 
                    <NavItem view={ViewState.SHORTAGES} label="Faltantes / Reposición" icon={AlertTriangle} active={activeView === ViewState.SHORTAGES} onClick={() => onNavigate(ViewState.SHORTAGES)} />}
                {isModuleEnabled(ViewState.REPLENISHMENT) && 
                    <NavItem view={ViewState.REPLENISHMENT} label="Armado de Pedidos" icon={PackagePlus} active={activeView === ViewState.REPLENISHMENT} onClick={() => onNavigate(ViewState.REPLENISHMENT)} />}
                {isModuleEnabled(ViewState.PURCHASES) && 
                    <NavItem view={ViewState.PURCHASES} label="Gestión Compras" icon={Truck} active={activeView === ViewState.PURCHASES} onClick={() => onNavigate(ViewState.PURCHASES)} />}
                {isModuleEnabled(ViewState.PROVIDERS) && 
                    <NavItem view={ViewState.PROVIDERS} label="Proveedores" icon={UserSearch} active={activeView === ViewState.PROVIDERS} onClick={() => onNavigate(ViewState.PROVIDERS)} />}
                {isModuleEnabled(ViewState.PRICE_LISTS) && 
                    <NavItem view={ViewState.PRICE_LISTS} label="Listas y Precios" icon={Tags} active={activeView === ViewState.PRICE_LISTS} onClick={() => onNavigate(ViewState.PRICE_LISTS)} />}

                {/* SECCIÓN INVENTARIO */}
                <CategoryHeader label="Inventario" color="bg-purple-500" />
                {isModuleEnabled(ViewState.INVENTORY) && 
                    <NavItem view={ViewState.INVENTORY} label="Gestión Artículos" icon={BoxesIcon} active={activeView === ViewState.INVENTORY} onClick={() => onNavigate(ViewState.INVENTORY)} />}
                {isModuleEnabled(ViewState.MASS_PRODUCT_UPDATE) && 
                    <NavItem view={ViewState.MASS_PRODUCT_UPDATE} label="Modificaciones Masivas" icon={Layers} active={activeView === ViewState.MASS_PRODUCT_UPDATE} onClick={() => onNavigate(ViewState.MASS_PRODUCT_UPDATE)} />}
                {isModuleEnabled(ViewState.STOCK_TRANSFERS) && 
                    <NavItem view={ViewState.STOCK_TRANSFERS} label="Movimientos Stock" icon={ArrowLeftRight} active={activeView === ViewState.STOCK_TRANSFERS} onClick={() => onNavigate(ViewState.STOCK_TRANSFERS)} />}

                {/* SECCIÓN SISTEMA */}
                <CategoryHeader label="Sistema" color="bg-slate-400" />
                {isModuleEnabled(ViewState.CLOUD_HUB) && 
                    <NavItem view={ViewState.CLOUD_HUB} label="Sincronización Cloud" icon={Network} active={activeView === ViewState.CLOUD_HUB} onClick={() => onNavigate(ViewState.CLOUD_HUB)} />}
                <NavItem view={ViewState.CONFIG_PANEL} label="Ajustes Sistema" icon={Settings} active={activeView === ViewState.CONFIG_PANEL} onClick={() => onNavigate(ViewState.CONFIG_PANEL)} />

                <div className="mt-8 mb-10 px-4 space-y-1 border-t border-slate-800/50 pt-4">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 px-6 py-3 text-red-400 hover:bg-red-500/10 transition-all rounded-xl text-[12px] font-bold mt-4"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
