
import React from 'react';
import { LayoutDashboard, PackageSearch, Receipt, Bot, Settings, LogOut, Wrench, ChevronRight, Users, BarChart3, ClipboardList, FileSpreadsheet, Truck, Wallet, Calculator, PieChart, Database, Store, FileUp, ShieldCheck, ShoppingCart, ListOrdered, Printer, Globe, CloudCog, AlertTriangle, FileBarChart2, Tag } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  
  const NavItem = ({ view, label, icon: Icon }: { view: ViewState, label: string, icon: any }) => (
    <button
        onClick={() => onNavigate(view)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group mb-1 ${
            currentView === view 
            ? 'bg-ferre-orange text-white shadow-md' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
        <div className="flex items-center gap-3">
            <Icon size={18} />
            <span className="font-medium text-sm">{label}</span>
        </div>
        {currentView === view && <ChevronRight size={14} />}
    </button>
  );

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-50 overflow-y-auto custom-scrollbar">
      <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="bg-ferre-orange p-1.5 rounded-md">
                <Wrench size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-wide">FerreCloud</span>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-20">
        
        {/* GENERAL */}
        <div>
             <NavItem view={ViewState.DASHBOARD} label="Tablero Principal" icon={LayoutDashboard} />
             <NavItem view={ViewState.REPORTS} label="Informes y Reportes" icon={FileBarChart2} />
        </div>

        {/* MODULO VENTAS */}
        <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                <span className="w-1 h-3 bg-green-500 rounded-full"></span> Ventas
            </div>
            <nav>
                <NavItem view={ViewState.POS} label="Facturación (POS)" icon={Receipt} />
                <NavItem view={ViewState.ONLINE_SALES} label="Ventas Online" icon={Globe} />
                <NavItem view={ViewState.SALES_ORDERS} label="Órdenes de Pedido" icon={ListOrdered} />
                <NavItem view={ViewState.REMITOS} label="Remitos / Cta. Cte." icon={ClipboardList} />
                <NavItem view={ViewState.PRESUPUESTOS} label="Presupuestos" icon={FileSpreadsheet} />
                <NavItem view={ViewState.CLIENTS} label="Clientes" icon={Users} />
            </nav>
        </div>

        {/* MODULO COMPRAS */}
        <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                <span className="w-1 h-3 bg-blue-500 rounded-full"></span> Compras
            </div>
            <nav>
                <NavItem view={ViewState.SHORTAGES} label="Faltantes / Reposición" icon={AlertTriangle} />
                <NavItem view={ViewState.REPLENISHMENT} label="Armado de Pedidos" icon={ShoppingCart} />
                <NavItem view={ViewState.PURCHASES} label="Gestión Compras" icon={Truck} />
                <NavItem view={ViewState.PROVIDERS} label="Proveedores" icon={Users} />
                <NavItem view={ViewState.PRICE_UPDATES} label="Listas y Precios" icon={FileUp} />
            </nav>
        </div>

        {/* MODULO STOCK */}
        <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                <span className="w-1 h-3 bg-purple-500 rounded-full"></span> Inventario
            </div>
            <nav>
                <NavItem view={ViewState.INVENTORY} label="Gestión Artículos" icon={PackageSearch} />
                <NavItem view={ViewState.LABEL_PRINTING} label="Imprimir Etiquetas" icon={Tag} />
                <NavItem view={ViewState.AI_ASSISTANT} label="Asistente IA" icon={Bot} />
            </nav>
        </div>

        {/* MODULO TESORERIA Y CONTABILIDAD */}
        <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                <span className="w-1 h-3 bg-yellow-500 rounded-full"></span> Finanzas
            </div>
            <nav>
                <NavItem view={ViewState.TREASURY} label="Tesoreria (Cajas)" icon={Wallet} />
                <NavItem view={ViewState.ACCOUNTING} label="Contabilidad" icon={Calculator} />
                <NavItem view={ViewState.STATISTICS} label="Estadísticas" icon={PieChart} />
            </nav>
        </div>

        {/* ADMIN */}
         <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Configuración</div>
            <nav>
                 <NavItem view={ViewState.COMPANY_SETTINGS} label="Datos de Empresa" icon={Settings} />
                 <NavItem view={ViewState.AFIP_CONFIG} label="Conexión AFIP" icon={CloudCog} />
                 <NavItem view={ViewState.PRINT_CONFIG} label="Diseño Impresión" icon={Printer} />
                 <NavItem view={ViewState.BRANCHES} label="Sucursales" icon={Store} />
                 <NavItem view={ViewState.USERS} label="Usuarios y Permisos" icon={ShieldCheck} />
                 <NavItem view={ViewState.BACKUP} label="Backup y Sistema" icon={Database} />
            </nav>
        </div>

      </div>

      <div className="mt-auto p-4 bg-slate-950 border-t border-slate-800 shrink-0 sticky bottom-0 z-10">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 transition-colors">
          <LogOut size={18} />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
