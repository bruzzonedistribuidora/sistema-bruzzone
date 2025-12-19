
import React, { useState } from 'react';
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
import LabelPrinting from './components/LabelPrinting'; // Import LabelPrinting
import { ViewState, ReplenishmentItem, Client } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // State for active branch management (Global for the app session)
  const [activeBranchName, setActiveBranchName] = useState('Sucursal Central');

  // State to pass data from Shortages to Replenishment
  const [incomingReplenishmentItems, setIncomingReplenishmentItems] = useState<ReplenishmentItem[]>([]);

  // State for Customer Portal simulation
  const [portalClient, setPortalClient] = useState<Client | null>(null);

  const handleSwitchBranch = () => {
      if (activeBranchName === 'Sucursal Central') setActiveBranchName('Sucursal Norte');
      else if (activeBranchName === 'Sucursal Norte') setActiveBranchName('Depósito General');
      else setActiveBranchName('Sucursal Central');
  };

  const handleGenerateReplenishment = (items: ReplenishmentItem[]) => {
      setIncomingReplenishmentItems(items);
      setCurrentView(ViewState.REPLENISHMENT);
  };

  const handleOpenCustomerPortal = (client: Client) => {
      setPortalClient(client);
      setCurrentView(ViewState.CUSTOMER_PORTAL);
  };

  const handleLogoutPortal = () => {
      setPortalClient(null);
      setCurrentView(ViewState.CLIENTS);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.INVENTORY:
        return <Inventory />;
      case ViewState.POS:
        return <POS />;
      case ViewState.SALES_ORDERS:
        return <SalesOrders />;
      case ViewState.ONLINE_SALES:
        return <OnlineSales />;
      case ViewState.REMITOS:
        return <Remitos />;
      case ViewState.PRESUPUESTOS:
        return <Presupuestos />;
      case ViewState.TREASURY:
        return <Treasury />;
      case ViewState.PURCHASES:
        return <Purchases defaultTab="PURCHASES" />;
      case ViewState.PROVIDERS:
        return <Purchases defaultTab="PROVIDERS" />;
      case ViewState.PRICE_UPDATES:
        return <PriceUpdates />;
      case ViewState.CLIENTS:
        return <Clients onOpenPortal={handleOpenCustomerPortal} />;
      case ViewState.ACCOUNTING:
        return <Accounting />;
      case ViewState.STATISTICS:
        return <Statistics />;
      case ViewState.REPORTS:
        return <Reports />;
      case ViewState.BACKUP:
        return <Backup />;
      case ViewState.BRANCHES:
        return <Branches />;
      case ViewState.USERS:
        return <UsersComponent />;
      case ViewState.AI_ASSISTANT:
        return <Assistant />;
      case ViewState.REPLENISHMENT:
        return <Replenishment 
                  initialItems={incomingReplenishmentItems} 
                  onItemsConsumed={() => setIncomingReplenishmentItems([])}
               />;
      case ViewState.SHORTAGES:
        return <Shortages onGenerateOrders={handleGenerateReplenishment} />;
      case ViewState.PRINT_CONFIG:
        return <PrintSettings />;
      case ViewState.LABEL_PRINTING: // Render LabelPrinting
        return <LabelPrinting />;
      case ViewState.COMPANY_SETTINGS:
        return <CompanySettings />;
      case ViewState.AFIP_CONFIG:
        return <AfipConfig />;
      default:
        return <Dashboard />;
    }
  };

  // Special Layout for Customer Portal (No Sidebar/TopBar)
  if (currentView === ViewState.CUSTOMER_PORTAL && portalClient) {
      return <CustomerPortal client={portalClient} onLogout={handleLogoutPortal} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <TopBar 
            currentView={currentView} 
            activeBranchName={activeBranchName}
            onSwitchBranch={handleSwitchBranch}
            onNavigate={setCurrentView}
        />
        <main className="flex-1 overflow-auto bg-gray-50/50">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
