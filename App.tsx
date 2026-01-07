
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Clients from './components/Clients';
import Treasury from './components/Treasury';
import Purchases from './components/Purchases';
import ConfigPanel from './components/ConfigPanel';
import MassProductUpdate from './components/MassProductUpdate';
import PriceUpdates from './components/PriceUpdates';
import EcommerceAdmin from './components/EcommerceAdmin';
import PublicPortal from './components/PublicPortal';
import Shop from './components/Shop';
import Assistant from './components/Assistant';
import Login from './components/Login';
import InitialImport from './components/InitialImport';
import CloudHub from './components/CloudHub';
import CompanySettings from './components/CompanySettings';
import AfipConfig from './components/AfipConfig';
import UsersComponent from './components/Users';
import Branches from './components/Branches';
import PrintSettings from './components/PrintSettings';
import Backup from './components/Backup';
import Accounting from './components/Accounting';
import Statistics from './components/Statistics';
import Reports from './components/Reports';
import Marketing from './components/Marketing';
import PriceAudit from './components/PriceAudit';
import DailyMovements from './components/DailyMovements';
import Employees from './components/Employees';
import StockTransfers from './components/StockTransfers';
import { ViewState, User } from './types';
import SalesManagement from './components/SalesManagement';
import Replenishment from './components/Replenishment';
import Shortages from './components/Shortages';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);

    // Public portals handle their own layouts
    if (view === ViewState.PUBLIC_PORTAL) return <PublicPortal />;
    if (view === ViewState.SHOP) return <Shop />;

    if (!user) {
        return <Login onLogin={setUser} />;
    }

    const renderView = () => {
        switch (view) {
            case ViewState.DASHBOARD: return <Dashboard onNavigate={setView} />;
            case ViewState.INVENTORY: return <Inventory />;
            case ViewState.POS: return <SalesManagement initialTab="POS" onCartUsed={() => {}} />;
            case ViewState.REMITOS: return <SalesManagement initialTab="REMITOS" onCartUsed={() => {}} />;
            case ViewState.PRESUPUESTOS: return <SalesManagement initialTab="BUDGETS" onCartUsed={() => {}} />;
            case ViewState.SALES_ORDERS: return <SalesManagement initialTab="ORDERS" onCartUsed={() => {}} />;
            case ViewState.CREDIT_NOTES: return <SalesManagement initialTab="CREDIT_NOTES" onCartUsed={() => {}} />;
            case ViewState.CLIENTS: return <Clients />;
            case ViewState.TREASURY: return <Treasury />;
            case ViewState.PURCHASES: return <Purchases />;
            case ViewState.MASS_PRODUCT_UPDATE: return <MassProductUpdate />;
            case ViewState.PRICE_UPDATES: return <PriceUpdates />;
            // Fix: Corrected mapping for EcommerceAdmin view
            case ViewState.ECOMMERCE_ADMIN: return <EcommerceAdmin />;
            case ViewState.INITIAL_IMPORT: return <InitialImport onComplete={() => setView(ViewState.INVENTORY)} />;
            case ViewState.CLOUD_HUB: return <CloudHub />;
            case ViewState.AI_ASSISTANT: return <Assistant />;
            case ViewState.CONFIG_PANEL: return <ConfigPanel onNavigate={setView} />;
            case ViewState.COMPANY_SETTINGS: return <CompanySettings />;
            case ViewState.AFIP_CONFIG: return <AfipConfig />;
            case ViewState.USERS: return <UsersComponent />;
            case ViewState.BRANCHES: return <Branches />;
            case ViewState.PRINT_CONFIG: return <PrintSettings />;
            case ViewState.BACKUP: return <Backup />;
            case ViewState.ACCOUNTING: return <Accounting />;
            case ViewState.STATISTICS: return <Statistics />;
            case ViewState.REPORTS: return <Reports />;
            case ViewState.MARKETING: return <Marketing />;
            case ViewState.PRICE_AUDIT: return <PriceAudit />;
            case ViewState.DAILY_MOVEMENTS: return <DailyMovements />;
            case ViewState.EMPLOYEES: return <Employees />;
            case ViewState.STOCK_TRANSFERS: return <StockTransfers />;
            case ViewState.REPLENISHMENT: return <Replenishment />;
            case ViewState.SHORTAGES: return <Shortages />;
            default: return <Dashboard onNavigate={setView} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            <Sidebar activeView={view} onNavigate={setView} user={user} />
            <div className="flex-1 h-full overflow-hidden">
                {renderView()}
            </div>
        </div>
    );
};

export default App;
