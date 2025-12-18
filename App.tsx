
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Remitos from './components/Remitos';
import Presupuestos from './components/Presupuestos';
import Assistant from './components/Assistant';
import Treasury from './components/Treasury';
import Purchases from './components/Purchases';
import Clients from './components/Clients';
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
import CustomerPortal from './components/CustomerPortal';
import Reports from './components/Reports';
import LabelPrinting from './components/LabelPrinting';
import { ViewState, ReplenishmentItem, Client } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(() => {
      const saved = localStorage.getItem('ferrecloud_current_view');
      return (saved as ViewState) || ViewState.DASHBOARD;
  });
  
  const [activeBranchName, setActiveBranchName] = useState('Sucursal Central');
  const [incomingReplenishmentItems, setIncomingReplenishmentItems] = useState<ReplenishmentItem[]>([]);
  const [portalClient, setPortalClient] = useState<Client | null>(null);

  // Guardar la vista actual para que al recargar el usuario no se pierda
  useEffect(() => {
      localStorage.setItem('ferrecloud_current_view', currentView);
  }, [currentView]);

  const handleSwitchBranch = () => {
      const branches = ['Sucursal Central', 'Sucursal Norte', 'Depósito General'];
      const currentIndex = branches.indexOf(activeBranchName);
      setActiveBranchName(branches[(currentIndex + 1) % branches.length]);
  };

  const handleGenerateReplenishment = (items: ReplenishmentItem[]) => {
      setIncomingReplenishmentItems(items);
      setCurrentView(ViewState.REPLENISHMENT);
  };

  const renderView = () => {
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
      case ViewState.CLIENTS: return <Clients onOpenPortal={(c) => { setPortalClient(c); setCurrentView(ViewState.CUSTOMER_PORTAL); }} />;
      case ViewState.ACCOUNTING: return <Accounting />;
      case ViewState.STATISTICS: return <Statistics />;
      case ViewState.REPORTS: return <Reports />;
      case ViewState.BACKUP: return <Backup />;
      case ViewState.BRANCHES: return <Branches />;
      case ViewState.USERS: return <UsersComponent />;
      case ViewState.AI_ASSISTANT: return <Assistant />;
      case ViewState.REPLENISHMENT: return <Replenishment initialItems={incomingReplenishmentItems} onItemsConsumed={() => setIncomingReplenishmentItems([])} />;
      case ViewState.SHORTAGES: return <Shortages onGenerateOrders={handleGenerateReplenishment} />;
      case ViewState.PRINT_CONFIG: return <PrintSettings />;
      case ViewState.LABEL_PRINTING: return <LabelPrinting />;
      case ViewState.COMPANY_SETTINGS: return <CompanySettings />;
      case ViewState.AFIP_CONFIG: return <AfipConfig />;
      case ViewState.CUSTOMER_PORTAL: 
        return portalClient ? <CustomerPortal client={portalClient} onLogout={() => { setPortalClient(null); setCurrentView(ViewState.CLIENTS); }} /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {currentView !== ViewState.CUSTOMER_PORTAL && (
          <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      )}
      
      <div className={`flex-1 ${currentView !== ViewState.CUSTOMER_PORTAL ? 'ml-64' : ''} flex flex-col h-screen overflow-hidden`}>
        {currentView !== ViewState.CUSTOMER_PORTAL && (
            <TopBar 
                currentView={currentView} 
                activeBranchName={activeBranchName}
                onSwitchBranch={handleSwitchBranch}
                onNavigate={setCurrentView}
            />
        )}
        <main className="flex-1 overflow-auto bg-gray-50/50">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
