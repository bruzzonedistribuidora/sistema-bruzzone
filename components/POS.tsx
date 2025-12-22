import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Remitos from './components/Remitos';
import Presupuestos from './components/Presupuestos';
import Treasury from './components/Treasury';
import Purchases from './components/Purchases';
import Clients from './components/Clients';
import ClientBalances from './components/ClientBalances';
import Accounting from './components/Accounting';
import Statistics from './components/Statistics';
import Backup from './components/Backup';
import Branches from './components/Branches';
import UsersComponent from './components/Users';
import PriceUpdates from './components/PriceUpdates';
import Replenishment from './components/Replenishment';
import Shortages from './components/Shortages';
import SalesOrders from './components/SalesOrders';
import PrintSettings from './components/PrintSettings';
import CompanySettings from './components/CompanySettings';
import OnlineSales from './components/OnlineSales';
import AfipConfig from './components/AfipConfig';
import Reports from './components/Reports';
import LabelPrinting from './components/LabelPrinting';
import DailyMovements from './components/DailyMovements';
import Employees from './components/Employees';
import Login from './components/Login';
import CustomerPortal from './components/CustomerPortal';
import { ViewState, User, Role, Client } from './types';

// Comentamos el componente que falta para que el build funcione
// import StockTransfers from './components/StockTransfers';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [activeBranchName, setActiveBranchName] = useState('Sucursal Central');
  const [targetClientId, setTargetClientId] = useState<string | undefined>(undefined);
  const [portalPreviewClient, setPortalPreviewClient] = useState<Client | null>(null);

  const getRoles = (): Role[] => {
    const saved = localStorage.getItem('ferrecloud_roles');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return [
      { id: 'admin', name: 'Administrador Total', color: 'bg-purple-100 text-purple-800', permissions: ['ALL'] },
      { id: 'seller', name: 'Vendedor', color: 'bg-green-100 text-green-800', permissions: ['DASHBOARD_VIEW', 'POS_ACCESS', 'CLIENTS_VIEW', 'STOCK_VIEW', 'REMITOS_VIEW'] }
    ];
  };

  const hasPermission = (permission: string): boolean => {
    if (!loggedInUser) return false;
    if (loggedInUser.id === '1' || loggedInUser.roleId === 'admin') return true;
    const roles = getRoles();
    const userRole = roles.find(r => r.id === loggedInUser.roleId);
    if (!userRole) return false;
    return userRole.permissions.includes('ALL') || userRole.permissions.includes(permission);
  };

  useEffect(() => {
    const savedSession = localStorage.getItem('ferrecloud_session');
    if (savedSession) {
        setLoggedInUser(JSON.parse(savedSession));
    } else {
        setCurrentView(ViewState.LOGIN);
    }
  }, []);

  const handleLogin = (user: User) => {
    setLoggedInUser(user);
    localStorage.setItem('ferrecloud_session', JSON.stringify(user));
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setPortalPreviewClient(null);
    localStorage.removeItem('ferrecloud_session');
    setCurrentView(ViewState.LOGIN);
  };

  const handleSwitchBranch = () => {
      if (activeBranchName === 'Sucursal Central') setActiveBranchName('Sucursal Norte');
      else if (activeBranchName === 'Sucursal Norte') setActiveBranchName('Depósito General');
      else setActiveBranchName('Sucursal Central');
  };

  const viewPermissions: Partial<Record<ViewState, string>> = {
    [ViewState.DASHBOARD]: 'DASHBOARD_VIEW',
    [ViewState.INVENTORY]: 'STOCK_VIEW',
    [ViewState.POS]: 'POS_ACCESS',
    [ViewState.SALES_ORDERS]: 'POS_ACCESS',
    [ViewState.ONLINE_SALES]: 'POS_ACCESS',
    [ViewState.REMITOS]: 'REMITOS_VIEW',
    [ViewState.CLIENT_BALANCES]: 'CLIENTS_VIEW',
    [ViewState.CLIENTS]: 'CLIENTS_VIEW',
    [ViewState.PRESUPUESTOS]: 'POS_ACCESS',
    [ViewState.SHORTAGES]: 'STOCK_VIEW',
    [ViewState.REPLENISHMENT]: 'PURCHASES_VIEW',
    [ViewState.PURCHASES]: 'PURCHASES_VIEW',
    [ViewState.PROVIDERS]: 'PURCHASES_VIEW',
    [ViewState.PRICE_UPDATES]: 'STOCK_EDIT',
    [ViewState.TREASURY]: 'TREASURY_VIEW',
    [ViewState.DAILY_MOVEMENTS]: 'TREASURY_VIEW',
    [ViewState.ACCOUNTING]: 'ACCOUNTING_VIEW',
    [ViewState.EMPLOYEES]: 'TREASURY_EDIT',
    [ViewState.STATISTICS]: 'ACCOUNTING_VIEW',
    [ViewState.REPORTS]: 'ACCOUNTING_VIEW',
    [ViewState.USERS]: 'CONFIG_ACCESS',
    [ViewState.COMPANY_SETTINGS]: 'CONFIG_ACCESS',
    [ViewState.AFIP_CONFIG]: 'CONFIG_ACCESS',
    [ViewState.BRANCHES]: 'CONFIG_ACCESS',
    [ViewState.BACKUP]: 'CONFIG_ACCESS',
    [ViewState.PRINT_CONFIG]: 'CONFIG_ACCESS',
  };

  const renderView = () => {
    if (!loggedInUser) return <Login onLogin={handleLogin} />;

    if (currentView === ViewState.CUSTOMER_PORTAL && portalPreviewClient) {
        return <CustomerPortal client={portalPreviewClient} onLogout={() => setCurrentView(ViewState.CLIENTS)} />;
    }

    const requiredPermission = viewPermissions[currentView];
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-10 text-center">
                <div className="bg-red-50 p-12 rounded-[3rem] border border-red-100 max-w-lg shadow-2xl shadow-red-900/5">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <Lock size={40}/>
                    </div>
                    <h3 className="text-2xl font-black text-red-800 uppercase tracking-tighter mb-3">Acceso Restringido</h3>
                    <p className="text-red-700 text-sm font-bold mb-10 leading-relaxed uppercase tracking-wide">
                        Hola {loggedInUser.name}, tu rol actual no tiene permisos.
                    </p>
                    <button 
                        onClick={() => setCurrentView(ViewState.DASHBOARD)}
                        className="w-full bg-red-600 text-white py-4 rounded-2xl font-black">
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    switch (currentView) {
      case ViewState.DASHBOARD: return <Dashboard />;
      case ViewState.INVENTORY: return <Inventory />;
      case ViewState.POS: return <POS />;
      case ViewState.SALES_ORDERS: return <SalesOrders />;
      case ViewState.ONLINE_SALES: return <OnlineSales />;
      case ViewState.REMITOS: return <Remitos />;
      case ViewState.PRESUPUESTOS: return <Presupuestos />;
      case ViewState.TREASURY: return <Treasury />;
      case ViewState.PURCHASES: return <Purchases defaultTab="PURCHASES" />;
      case ViewState.PROVIDERS: return <Purchases defaultTab="PROVIDERS" />;
      case ViewState.PRICE_UPDATES: return <PriceUpdates />;
      case ViewState.CLIENTS: return (
        <Clients 
            initialClientId={targetClientId} 
            onOpenPortal={(client) => {
                setPortalPreviewClient(client);
                setCurrentView(ViewState.CUSTOMER_PORTAL);
            }}
        />
      );
      case ViewState.CLIENT_BALANCES: return (
        <ClientBalances 
            onNavigateToHistory={(client) => {
                setTargetClientId(client.id);
                setCurrentView(ViewState.CLIENTS);
            }} 
        />
      );
      case ViewState.ACCOUNTING: return <Accounting />;
      case ViewState.STATISTICS: return <Statistics />;
      case ViewState.REPORTS: return <Reports />;
      case ViewState.BACKUP: return <Backup />;
      case ViewState.BRANCHES: return <Branches />;
      case ViewState.USERS: return <UsersComponent />;
      case ViewState.REPLENISHMENT: return <Replenishment />;
      case ViewState.SHORTAGES: return <Shortages />;
      case ViewState.PRINT_CONFIG: return <PrintSettings />;
      case ViewState.LABEL_PRINTING: return <LabelPrinting />;
      case ViewState.COMPANY_SETTINGS: return <CompanySettings />;
      case ViewState.AFIP_CONFIG: return <AfipConfig />;
      case ViewState.DAILY_MOVEMENTS: return <DailyMovements />;
      case ViewState.EMPLOYEES: return <Employees />;
      default: return <Dashboard />;
    }
  };

  if (currentView === ViewState.LOGIN || !loggedInUser) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <Sidebar 
        currentView={currentView} 
        onNavigate={(view) => {
            setTargetClientId(undefined);
            setCurrentView(view);
        }} 
        user={loggedInUser} 
        onLogout={handleLogout} 
      />
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <TopBar 
            currentView={currentView} 
            activeBranchName={activeBranchName}
            onSwitchBranch={handleSwitchBranch}
            onNavigate={setCurrentView}
            user={loggedInUser}
        />
        <main className="flex-1 overflow-auto bg-gray-50/50">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
