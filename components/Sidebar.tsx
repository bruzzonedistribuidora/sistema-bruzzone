
import React from 'react';
import { 
    LayoutDashboard, Database, Receipt, ClipboardList, 
    FileSpreadsheet, Users, Truck, Wallet, Calculator, 
    TrendingUp, FileBarChart2, HardDrive, Store, Bot, 
    Layers, Zap, Shield, ShoppingCart, Globe, Tag, 
    Settings, Sparkles, ShieldAlert, RotateCcw, ArrowLeftRight, FileUp, ChevronDown, ArrowRight,
    Smartphone, Heart, ShoppingBag, Laptop
} from 'lucide-react';
import { ViewState, User } from '../types';

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

    return (
        <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-ferre-orange">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none">Bruzzone</h1>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cloud System</p>
                    </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs uppercase">
                            {user?.name.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-800 uppercase truncate leading-none mb-1">{user?.name || 'Usuario'}</p>
                            <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">En Línea</span>
                        </div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                <NavItem view={ViewState.DASHBOARD} label="Escritorio" icon={LayoutDashboard} active={activeView === ViewState.DASHBOARD} onClick={() => handleNav(ViewState.DASHBOARD)} />
                
                <NavDropdown id="ventas" label="Ventas" icon={Receipt}>
                    <DropdownItem view={ViewState.POS} label="Punto de Venta" icon={Receipt} active={activeView === ViewState.POS} onClick={() => handleNav(ViewState.POS)} />
                    <DropdownItem view={ViewState.REMITOS} label="Remitos" icon={ClipboardList} active={activeView === ViewState.REMITOS} onClick={() => handleNav(ViewState.REMITOS)} />
                    <DropdownItem view={ViewState.PRESUPUESTOS} label="Presupuestos" icon={FileSpreadsheet} active={activeView === ViewState.PRESUPUESTOS} onClick={() => handleNav(ViewState.PRESUPUESTOS)} />
                    <DropdownItem view={ViewState.CLIENTS} label="Clientes" icon={Users} active={activeView === ViewState.CLIENTS} onClick={() => handleNav(ViewState.CLIENTS)} />
                </NavDropdown>

                <NavDropdown id="inventario" label="Stock" icon={Database}>
                    <DropdownItem view={ViewState.INVENTORY} label="Maestro Artículos" icon={Database} active={activeView === ViewState.INVENTORY} onClick={() => handleNav(ViewState.INVENTORY)} />
                    <DropdownItem view={ViewState.INITIAL_IMPORT} label="Carga Masiva" icon={FileUp} active={activeView === ViewState.INITIAL_IMPORT} onClick={() => handleNav(ViewState.INITIAL_IMPORT)} />
                    <DropdownItem view={ViewState.PRICE_UPDATES} label="Precios" icon={Layers} active={activeView === ViewState.PRICE_UPDATES} onClick={() => handleNav(ViewState.PRICE_UPDATES)} />
                    <DropdownItem view={ViewState.MASS_PRODUCT_UPDATE} label="Cambios Masivos" icon={Zap} active={activeView === ViewState.MASS_PRODUCT_UPDATE} onClick={() => handleNav(ViewState.MASS_PRODUCT_UPDATE)} />
                </NavDropdown>

                <NavItem view={ViewState.PURCHASES} label="Compras" icon={Truck} active={activeView === ViewState.PURCHASES} onClick={() => handleNav(ViewState.PURCHASES)} />
                <NavItem view={ViewState.TREASURY} label="Tesorería" icon={Wallet} active={activeView === ViewState.TREASURY} onClick={() => handleNav(ViewState.TREASURY)} />
                <NavItem view={ViewState.ACCOUNTING} label="Contabilidad" icon={Calculator} active={activeView === ViewState.ACCOUNTING} onClick={() => handleNav(ViewState.ACCOUNTING)} />
                
                <NavDropdown id="presencia" label="Presencia Digital" icon={Globe}>
                    <DropdownItem view={ViewState.ECOMMERCE_ADMIN} label="Gestión E-commerce" icon={Laptop} active={activeView === ViewState.ECOMMERCE_ADMIN} onClick={() => handleNav(ViewState.ECOMMERCE_ADMIN)} />
                    <DropdownItem view={ViewState.SHOP} label="Tienda Online (Publico)" icon={ShoppingBag} active={activeView === ViewState.SHOP} onClick={() => handleNav(ViewState.SHOP)} />
                    <DropdownItem view={ViewState.PUBLIC_PORTAL} label="Portal Fidelidad" icon={Smartphone} active={activeView === ViewState.PUBLIC_PORTAL} onClick={() => handleNav(ViewState.PUBLIC_PORTAL)} />
                    <DropdownItem view={ViewState.MARKETING} label="Promo & Puntos" icon={Heart} active={activeView === ViewState.MARKETING} onClick={() => handleNav(ViewState.MARKETING)} />
                </NavDropdown>

                <NavItem view={ViewState.AI_ASSISTANT} label="FerreBot IA" icon={Bot} active={activeView === ViewState.AI_ASSISTANT} onClick={() => handleNav(ViewState.AI_ASSISTANT)} />
                <NavItem view={ViewState.CONFIG_PANEL} label="Configuración" icon={Settings} active={activeView === ViewState.CONFIG_PANEL} onClick={() => handleNav(ViewState.CONFIG_PANEL)} />
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-indigo-900 rounded-2xl p-4 text-white relative overflow-hidden group cursor-pointer" onClick={() => handleNav(ViewState.SHOP)}>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Globe size={80}/></div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300 mb-1">Acceso Rápido Clientes</p>
                    <h4 className="text-xs font-black uppercase tracking-tighter">Mi Tienda Online</h4>
                    <ArrowRight size={14} className="mt-3 text-indigo-400 group-hover:translate-x-2 transition-transform" />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
