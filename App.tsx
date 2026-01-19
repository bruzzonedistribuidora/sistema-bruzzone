
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './modules/Dashboard';
import Clients from './modules/Clients';
import Suppliers from './modules/Suppliers';
// Fix: Changed from default import to named import to match the updated export in Cashier.tsx
import { Cashier } from './modules/Cashier';
// Fix: Changed from default import to named import as indicated by the error "Module has no default export".
import { Remitos } from './modules/Remitos';
import Purchases from './modules/Purchases';
import Sales from './modules/Sales';
import PriceUpdate from './modules/PriceUpdate';
import Loyalty from './modules/Loyalty';
import Ecommerce from './modules/Ecommerce';
import Reports from './modules/Reports';
import Settings from './modules/Settings';
import Finance from './modules/Finance';
import UsersModule from './modules/Users';
import Branches from './modules/Branches';
import Warehouse from './modules/Warehouse';
import Inventory from './modules/Inventory';
import BulkImport from './modules/BulkImport';
import PurchaseOrders from './modules/PurchaseOrders';
import Balances from './modules/Balances';
import StockAdjustment from './modules/StockAdjustment'; // New import
import BulkModification from './modules/BulkModification'; // New import
import LoginScreen from './LoginScreen'; // Import the new LoginScreen (path is already correct here)
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Role, AndreaniConfig } from './types'; // Import Role type and AndreaniConfig

export interface ArcaConfig {
  enabled: boolean;
  environment: 'testing' | 'production';
  puntoVenta: number;
  concepto: 'productos' | 'servicios' | 'ambos';
  iibb: string;
  activityStart: string;
  crtValidUntil: string;
  lastInvoiceA: number;
  lastInvoiceB: number;
}

export interface CompanyInfo {
  name: string;
  logo: string | null;
  showLogoInSidebar: boolean;
  cuit: string;
  address: string;
  ivaCondition: string;
  phone: string;
  email: string;
  arca: ArcaConfig;
  andreani: AndreaniConfig; // New: Andreani configuration
}

// Define CurrentUser type explicitly as it's now managed at App level
interface CurrentUser {
  name: string;
  role: Role; // Use the Role type
  isCreator: boolean;
}

const AppContent: React.FC<{ currentUser: CurrentUser; onLogout: () => void }> = ({ currentUser, onLogout }) => { // Pass currentUser and onLogout as prop
  const [activeTab, setActiveTab] = useState('dashboard');
  const [plan, setPlan] = useState<'basic' | 'premium' | 'enterprise'>('enterprise');
  const { error } = useFirebase();
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'FerroGest',
    logo: null,
    showLogoInSidebar: false,
    cuit: '30-12345678-9',
    address: 'Av. Principal 123, Ciudad',
    ivaCondition: 'Responsable Inscripto',
    phone: '+54 11 1234-5678',
    email: 'contacto@ferrogest.com',
    arca: {
      enabled: true,
      environment: 'testing',
      puntoVenta: 5,
      concepto: 'productos',
      iibb: '30-12345678-9',
      activityStart: '2020-01-15',
      crtValidUntil: '2025-12-31',
      lastInvoiceA: 1245,
      lastInvoiceB: 5678
    },
    andreani: { // Initial Andreani config
      enabled: false,
      clientId: '',
      clientSecret: '',
      accountNumber: '',
      branchCode: '',
      connected: false,
      nickname: undefined,
    }
  });

  // modules depend on currentUser.role, so if currentUser is passed, it needs to be updated.
  // For simplicity, let's assume currentUser is just for sidebar/settings display for now.
  // If module access should vary by role, more logic would be needed here.

  const modules = useMemo(() => [
    { id: 'dashboard', component: <Dashboard /> },
    { id: 'sales', component: <Sales /> },
    { id: 'remitos', component: <Remitos /> },
    { id: 'inventory', component: <Inventory /> },
    { id: 'stock-adjustment', component: <StockAdjustment /> }, // New module
    { id: 'bulk-modification', component: <BulkModification /> }, // New module
    { id: 'warehouse', component: <Warehouse /> },
    { id: 'branches', component: <Branches /> },
    { id: 'clients', component: <Clients onNavigate={setActiveTab} /> },
    { id: 'suppliers', component: <Suppliers /> },
    { id: 'balances', component: <Balances /> },
    { id: 'purchase-orders', component: <PurchaseOrders /> },
    { id: 'cashier', component: <Cashier /> },
    { id: 'purchases', component: <Purchases /> },
    { id: 'prices', component: <PriceUpdate /> },
    { id: 'bulk-import', component: <BulkImport /> },
    { id: 'loyalty', component: <Loyalty /> },
    { id: 'ecommerce', component: <Ecommerce 
        companyInfo={companyInfo} 
        setCompanyInfo={setCompanyInfo} 
      /> 
    }, // Pass companyInfo and setCompanyInfo
    { id: 'reports', component: <Reports /> },
    { id: 'finance', component: <Finance /> },
    { id: 'users', component: <UsersModule /> },
    { id: 'settings', component: <Settings 
        plan={plan} 
        setPlan={setPlan} 
        isAdmin={currentUser.role === 'admin'} // Use currentUser prop
        companyInfo={companyInfo}
        setCompanyInfo={setCompanyInfo}
      /> 
    },
  ], [plan, companyInfo, currentUser.role]); // Add currentUser.role to dependencies

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        companyInfo={companyInfo}
        currentUser={currentUser} // Pass currentUser to Sidebar
        onLogout={onLogout} // Pass onLogout to Sidebar
      />
      <main className="flex-1 h-screen overflow-y-auto p-8 relative">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top duration-300">
               <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20">
                 <AlertCircle className="w-6 h-6" />
               </div>
               <div className="flex-1">
                 <p className="text-red-900 font-black uppercase text-xs tracking-widest">Error de Sincronización Nube</p>
                 <p className="text-red-700 text-sm font-medium">{error}</p>
               </div>
               <button 
                 onClick={() => window.location.reload()}
                 className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs uppercase hover:bg-red-50 transition-all flex items-center gap-2"
               >
                 <RefreshCw className="w-4 h-4" /> Reintentar
               </button>
            </div>
          )}
          
          {/* Renderizado persistente: Todos los módulos están montados pero solo uno es visible */}
          {modules.map((m) => (
            <div key={m.id} className={activeTab === m.id ? 'block' : 'hidden'}>
              {m.component}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const handleLoginSuccess = (role: Role, name: string) => { // Use Role type
    setCurrentUser({
      name: name,
      role: role,
      isCreator: role === 'admin' // Simple logic for isCreator
    });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  if (!isLoggedIn || !currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <FirebaseProvider>
      <AppContent currentUser={currentUser} onLogout={handleLogout} />
    </FirebaseProvider>
  );
};

export default App;
    