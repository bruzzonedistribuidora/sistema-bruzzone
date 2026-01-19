
import React, { useState } from 'react';
import {
  Globe, ShoppingCart, Layout, Eye, Settings,
  Share2, MousePointer2, Plus, Search, Image as ImageIcon,
  CheckCircle2, X, ArrowUpRight, ShoppingBag, Users,
  Star, Tag, ExternalLink, Camera, Save, Trash2,
  ChevronRight, Laptop, Smartphone, Monitor, Menu, Heart,
  Truck, RefreshCcw, User, Lock, Mail, UserPlus,
  Zap, Package, AlertTriangle, CloudIcon, Link2, Key, Loader2,
  Plug, Send, MapPin
} from 'lucide-react';
import { CompanyInfo } from '../App'; // Import CompanyInfo
import { AndreaniConfig } from '../types'; // Import AndreaniConfig

type EcommerceTab = 'dashboard' | 'catalogo' | 'pedidos' | 'diseno' | 'mercadolibre' | 'envios';

interface EcommerceProps {
  companyInfo: CompanyInfo;
  setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;
}

const Ecommerce: React.FC<EcommerceProps> = ({ companyInfo, setCompanyInfo }) => { // Receive companyInfo and setCompanyInfo
  const [activeTab, setActiveTab] = useState<EcommerceTab>('dashboard');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [showCustomerAuth, setShowCustomerAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [customerSession, setCustomerSession] = useState<{name: string} | null>(null);
  const [searchInventory, setSearchInventory] = useState('');
  const [isSyncingML, setIsSyncingML] = useState(false);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false); // New state for Andreani shipment

  // MercadoLibre Configuration States (now derived from companyInfo and local states for form inputs)
  const [mlClientId, setMlClientId] = useState(companyInfo.arca.iibb); // Using iibb as a mock default
  const [mlClientSecret, setMlClientSecret] = useState('**********'); // Placeholder for sensitive data
  const [mlUserId, setMlUserId] = useState<string | null>(companyInfo.andreani.nickname ? 'ML-USER-ID' : null); // Mock based on andreani nickname
  const [mlNickname, setMlNickname] = useState<string | null>(companyInfo.andreani.nickname || null); // Mock based on andreani nickname
  const [mlAutoSyncStock, setMlAutoSyncStock] = useState(true);
  const [mlAutoSyncPrices, setMlAutoSyncPrices] = useState(true);
  const [isConnectingML, setIsConnectingML] = useState(false);

  // Andreani Configuration States (now derived from companyInfo and local states for form inputs)
  const [andreaniClientId, setAndreaniClientId] = useState(companyInfo.andreani.clientId);
  const [andreaniClientSecret, setAndreaniClientSecret] = useState(companyInfo.andreani.clientSecret);
  const [andreaniAccountNumber, setAndreaniAccountNumber] = useState(companyInfo.andreani.accountNumber);
  const [andreaniBranchCode, setAndreaniBranchCode] = useState(companyInfo.andreani.branchCode);
  const [isConnectingAndreani, setIsConnectingAndreani] = useState(false);
  
  const MERCADOLIBRE_REDIRECT_URI = "https://ferrogest.app/ml-callback"; // Static Redirect URI

  // Mock de productos ya en la tienda
  const [storeProducts, setStoreProducts] = useState([
    { id: '1', name: 'Taladro Bosch GSB 650', price: 18500, stock: 4, visits: 450, status: 'publicado', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=150', mlStatus: 'sync' },
    { id: '2', name: 'Martillo Stanley 20oz', price: 5500, stock: 15, visits: 120, status: 'borrador', img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&q=80&w=150', mlStatus: 'none' },
    { id: '3', name: 'Pintura Latex Alba 20L', price: 35000, stock: 10, visits: 85, status: 'publicado', img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=150', mlStatus: 'sync' },
  ]);

  const inventoryItems = [
    { id: '10', sku: 'PIN-001', name: 'Pincel N°10 Cerda Blanca', brand: 'Alba', price: 1200, stock: 45 },
    { id: '11', sku: 'DIS-045', name: 'Disco de Corte 4.5"', brand: 'Stanley', price: 850, stock: 120 },
    { id: '12', sku: 'LIJ-080', name: 'Lija de Agua 80', brand: 'Sia Abrasivos', price: 45, stock: 500 },
  ];

  const mockOnlineOrders = [
    { id: 'WEB-001', date: '2024-05-28', client: 'Ana Gomez', total: 18500, status: 'pendiente', address: 'Calle 123, CABA' },
    { id: 'WEB-002', date: '2024-05-27', client: 'Roberto Martinez', total: 5500, status: 'pendiente', address: 'Av. Siempre Viva 742, Córdoba' },
  ];

  const handleViewStore = () => {
    setShowPublicPreview(true);
  };

  const handleMLSync = () => {
    setIsSyncingML(true);
    setTimeout(() => {
      setIsSyncingML(false);
      alert('Sincronización con MercadoLibre completada: 2 artículos actualizados, 0 errores.');
    }, 2000);
  };

  const handleConnectMercadoLibre = async () => {
    if (!mlClientId || !mlClientSecret) {
      alert('Por favor, ingrese el Client ID y Client Secret de MercadoLibre.');
      return;
    }

    setIsConnectingML(true);
    try {
      // Simulate OAuth flow initiation
      alert('Iniciando conexión con MercadoLibre. Serás redirigido para autorizar la aplicación.');
      // In a real app, you would redirect the user to MercadoLibre's OAuth endpoint:
      // window.location.href = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${mlClientId}&redirect_uri=${MERCADOLIBRE_REDIRECT_URI}`;
      
      // Simulate successful callback after authorization
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate async operation
      
      const updatedCompanyInfo = {
        ...companyInfo,
        andreani: { // Using Andreani config to store ML mock connection for now, could be separate
          ...companyInfo.andreani,
          connected: true, // For ML mock connection, could be separate ML specific status
          nickname: 'MercadoLibreUser', // Mock ML nickname
        }
      };
      setCompanyInfo(updatedCompanyInfo);
      setMlUserId('ML-USER-12345678');
      setMlNickname('FerreteriaNorteML');
      alert('¡Conexión con MercadoLibre establecida con éxito!');
    } catch (error) {
      console.error('Error al conectar con MercadoLibre:', error);
      alert('No se pudo establecer la conexión con MercadoLibre. Verifique sus credenciales.');
    } finally {
      setIsConnectingML(false);
    }
  };

  const handleSaveMlSettings = () => {
    // In a real application, these settings would be saved to Firebase Firestore or a backend.
    alert('Configuración de MercadoLibre guardada. Client ID: ' + mlClientId + ', Auto-Sync Stock: ' + mlAutoSyncStock);
    // You might also want to update the companyInfo context or similar for persistence.
  };

  // Andreani Handlers
  const handleConnectAndreani = async () => {
    if (!andreaniClientId || !andreaniClientSecret || !andreaniAccountNumber || !andreaniBranchCode) {
      alert('Por favor, complete todos los campos de credenciales de Andreani.');
      return;
    }

    setIsConnectingAndreani(true);
    try {
      // Simulate API call to Andreani for connection/token generation
      await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate async operation

      const updatedAndreaniConfig: AndreaniConfig = {
        enabled: true,
        clientId: andreaniClientId,
        clientSecret: andreaniClientSecret,
        accountNumber: andreaniAccountNumber,
        branchCode: andreaniBranchCode,
        connected: true,
        nickname: 'AndreaniFERRO' // Mock nickname
      };

      setCompanyInfo(prev => ({
        ...prev,
        andreani: updatedAndreaniConfig
      }));
      alert('¡Conexión con Andreani establecida con éxito!');
    } catch (error) {
      console.error('Error al conectar con Andreani:', error);
      alert('No se pudo establecer la conexión con Andreani. Verifique sus credenciales.');
    } finally {
      setIsConnectingAndreani(false);
    }
  };

  const handleSaveAndreaniSettings = () => {
    const updatedAndreaniConfig: AndreaniConfig = {
      ...companyInfo.andreani, // Keep current connected status
      clientId: andreaniClientId,
      clientSecret: andreaniClientSecret,
      accountNumber: andreaniAccountNumber,
      branchCode: andreaniBranchCode,
      enabled: true, // Assume enabled when saving settings
    };

    setCompanyInfo(prev => ({
      ...prev,
      andreani: updatedAndreaniConfig
    }));
    alert('Configuración de Andreani guardada.');
  };

  const handleCreateAndreaniShipment = async (orderId: string) => {
    if (!companyInfo.andreani.connected) {
      alert('Andreani no está conectado. Por favor, configure la conexión primero.');
      return;
    }
    setIsCreatingShipment(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert(`Envío Andreani creado para el pedido ${orderId}. Se generó la etiqueta de envío.`);
      // In a real app, this would integrate with Andreani's API to create a shipment
    } catch (error) {
      console.error('Error al crear envío Andreani:', error);
      alert('Hubo un error al crear el envío Andreani. Intente de nuevo.');
    } finally {
      setIsCreatingShipment(false);
    }
  };


  const addToStore = (item: any) => {
    setStoreProducts([...storeProducts, {
      ...item,
      visits: 0,
      status: 'publicado',
      img: 'https://images.unsplash.com/photo-1581147036324-c17da42e2602?auto=format&fit=crop&q=80&w=150',
      mlStatus: 'none'
    }]);
    setShowProductPicker(false);
  };

  const renderCustomerAuthModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-8 text-center space-y-2">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {authMode === 'login' ? <User className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {authMode === 'login' ? '¡Hola de nuevo!' : 'Crea tu cuenta'}
          </h3>
          <p className="text-slate-500 text-sm">Ingresa a Ferretería Norte para comprar.</p>
        </div>

        <div className="px-8 pb-8 space-y-4">
          {authMode === 'register' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" placeholder="Tu nombre..." />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" placeholder="email@ejemplo.com" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" placeholder="••••••••" />
            </div>
          </div>

          <button 
            onClick={() => {
              setCustomerSession({ name: 'Cliente Demo' });
              setShowCustomerAuth(false);
            }}
            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all mt-4"
          >
            {authMode === 'login' ? 'Iniciar Sesión' : 'Registrarme ahora'}
          </button>
          <p className="text-center text-xs font-bold text-slate-400 pt-4">
            {authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya eres cliente?'}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-orange-600 ml-1 hover:underline"
            >
              {authMode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>
        <button onClick={() => setShowCustomerAuth(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderPublicPreview = () => (
    <div className="fixed inset-0 bg-white z-[200] overflow-y-auto animate-in fade-in duration-300 flex flex-col">
      {showCustomerAuth && renderCustomerAuthModal()}
      <div className="bg-slate-100 p-3 flex justify-between items-center border-b sticky top-0 z-50">
        <div className="flex gap-1.5 ml-4"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-yellow-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
        <div className="bg-white border rounded-full px-8 py-1.5 text-xs text-slate-500 font-bold flex items-center gap-2 shadow-sm"><Globe className="w-3 h-3" /> https://ferreteria-norte.tiendafort.com</div>
        <button onClick={() => setShowPublicPreview(false)} className="mr-4 p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all flex items-center gap-2 px-4 py-2 font-black text-[10px] uppercase tracking-widest shadow-lg"><X className="w-4 h-4" /> Salir de vista previa</button>
      </div>
      <div className="max-w-6xl mx-auto w-full flex-1 pb-20">
        <header className="p-8 flex justify-between items-center bg-white border-b">
          <div className="flex items-center gap-3"><div className="p-2 bg-orange-500 rounded-lg text-white"><ShoppingBag className="w-6 h-6" /></div><span className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Ferretería Norte</span></div>
          <nav className="hidden md:flex gap-8 font-bold text-slate-500 uppercase text-xs tracking-widest"><a href="#" className="text-orange-600 border-b-2 border-orange-500 pb-1">Inicio</a><a href="#" className="hover:text-orange-500 transition-colors">Productos</a><a href="#" className="hover:text-orange-500 transition-colors">Contacto</a></nav>
          <div className="flex items-center gap-6">
            <button onClick={() => customerSession ? setCustomerSession(null) : setShowCustomerAuth(true)} className="flex items-center gap-2 font-bold text-slate-700 hover:text-orange-600 transition-colors">{customerSession ? (<div className="flex items-center gap-2"><div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200"><User className="w-4 h-4" /></div><span className="text-xs uppercase tracking-widest hidden lg:block">{customerSession.name}</span></div>) : (<div className="flex items-center gap-2"><User className="w-5 h-5" /><span className="text-xs uppercase tracking-widest hidden lg:block">Ingresar</span></div>)}</button>
            <button className="relative"><ShoppingCart className="w-6 h-6 text-slate-700" /><span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">0</span></button>
          </div>
        </header>
        <section className="px-8 mt-8"><div className="w-full h-[400px] bg-slate-900 rounded-[2.5rem] relative overflow-hidden flex items-center p-16 group"><div className="relative z-10 space-y-6 max-w-lg"><span className="bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">Oferta de Lanzamiento</span><h1 className="text-5xl font-black text-white leading-tight">Equipá tu taller con lo mejor</h1><p className="text-slate-400 text-lg font-medium leading-relaxed">Envíos gratis en compras superiores a $50.000. Pagá en 3 cuotas sin interés.</p><button className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95">Ver Ofertas</button></div><img src="https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" alt="Banner" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent"></div></div></section>
        <section className="px-8 mt-12 overflow-x-auto"><div className="flex gap-4">{['Herramientas Eléctricas', 'Pinturas', 'Bulonería', 'Electricidad', 'Jardín'].map(c => (<button key={c} className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl whitespace-nowrap text-xs font-black text-slate-500 uppercase tracking-widest hover:border-orange-500 hover:border-orange-600 transition-all shadow-sm">{c}</button>))}</div></section>
        <section className="px-8 mt-16 space-y-8"><div className="flex justify-between items-end"><h2 className="text-3xl font-black text-slate-800 tracking-tight">Productos Destacados</h2><button className="text-orange-600 font-black text-sm uppercase tracking-widest flex items-center gap-1 hover:underline">Ver todo <ChevronRight className="w-4 h-4" /></button></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{storeProducts.filter(p => p.status === 'publicado').map(p => (<div key={p.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 group hover:shadow-2xl transition-all duration-300"><div className="aspect-square relative overflow-hidden bg-slate-50"><img src={p.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} /></div><div className="p-6 space-y-3"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ferretería Norte</p><h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2 min-h-[3rem]">{p.name}</h3><div className="pt-2 flex justify-between items-center"><p className="text-2xl font-black text-slate-900">${p.price.toLocaleString()}</p><button className="p-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all shadow-lg active:scale-90"><Plus className="w-5 h-5" /></button></div></div></div>))}</div></section>
        <footer className="mt-32 border-t pt-20 px-8 text-center space-y-8"><div className="flex items-center justify-center gap-3"><div className="p-2 bg-slate-800 rounded-lg text-white"><ShoppingBag className="w-6 h-6" /></div><span className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Ferretería Norte</span></div><p className="text-slate-400 text-xs font-medium">© 2025 FerroGest Ecommerce. Todos los derechos reservados.</p></footer>
      </div>
    </div>
  );

  const renderMLTab = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      {/* MercadoLibre Status Card */}
      <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-yellow-400 rounded-3xl shadow-xl shadow-yellow-400/20">
            <Zap className="w-10 h-10 text-slate-900 fill-slate-900" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">MercadoLibre Sync</h3>
            <p className="text-slate-600 font-bold text-sm">Estado de conexión: <span className="text-green-600 uppercase tracking-widest ml-1">{mlUserId ? 'Vínculo Activo' : 'No Conectado'}</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleMLSync}
            disabled={isSyncingML || !mlUserId} // Disable if not connected
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
          >
            {isSyncingML ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
            Sincronizar Stock y Precios
          </button>
        </div>
      </div>

      {/* MercadoLibre Configuration Section */}
      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500 text-white rounded-2xl shadow-lg shadow-yellow-500/20">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Configuración de API & Sincronización</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client ID</label>
            <input 
              type="text" 
              value={mlClientId}
              onChange={(e) => setMlClientId(e.target.value)}
              placeholder="Ingrese su Client ID de MercadoLibre" 
              className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Secret</label>
            <input 
              type="password" // Use password type for security
              value={mlClientSecret}
              onChange={(e) => setMlClientSecret(e.target.value)}
              placeholder="Ingrese su Client Secret" 
              className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Redirect URI (Pre-configurada)</label>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-600 font-medium text-sm">
            <Link2 className="w-4 h-4 text-slate-400" />
            <span className="flex-1 truncate">{MERCADOLIBRE_REDIRECT_URI}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(MERCADOLIBRE_REDIRECT_URI)} 
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100"
              title="Copiar al portapapeles"
            >
              Copiar
            </button>
          </div>
          <p className="text-[10px] text-slate-400 italic mt-1">Debe registrar esta URI en su aplicación de desarrollador de MercadoLibre.</p>
        </div>
        
        <div className="flex justify-center pt-4">
          <button 
            onClick={handleConnectMercadoLibre}
            disabled={isConnectingML || !mlClientId || !mlClientSecret}
            className="bg-yellow-500 text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-yellow-400 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isConnectingML ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudIcon className="w-5 h-5" />}
            {isConnectingML ? 'Conectando...' : 'Conectar con MercadoLibre'}
          </button>
        </div>

        {mlUserId && (
          <div className="pt-8 border-t border-slate-100 space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Cuenta Vinculada
            </h4>
            <div className="grid grid-cols-2 gap-6 bg-green-50 rounded-2xl p-6 border border-green-100">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">User ID</p>
                <p className="font-bold text-green-900">{mlUserId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Nickname</p>
                <p className="font-bold text-green-900">{mlNickname}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" /> Opciones de Sincronización Automática
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">Auto-Sincronizar Stock</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={mlAutoSyncStock} 
                      onChange={(e) => setMlAutoSyncStock(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">Auto-Sincronizar Precios</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={mlAutoSyncPrices} 
                      onChange={(e) => setMlAutoSyncPrices(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSaveMlSettings}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-yellow-500" /> Guardar Configuración
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Publicaciones Activas</p>
          <h4 className="text-3xl font-black text-slate-800">452</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendientes de Subida</p>
          <h4 className="text-3xl font-black text-yellow-600">12</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preguntas sin Responder</p>
          <h4 className="text-3xl font-black text-red-500">3</h4>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white">
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">Reputación</p>
          <div className="flex gap-1 mt-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-2 flex-1 bg-green-500 rounded-full"></div>)}
          </div>
          <p className="text-[10px] font-bold mt-2 text-green-400 uppercase tracking-widest">MercadoLíder Platinum</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-500" /> Gestor de Publicaciones
          </h4>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold" placeholder="Buscar por SKU o Título..." />
          </div>
        </div>
        <table className="w-full text-left">
           <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                 <th className="px-8 py-5">Artículo Local</th>
                 <th className="px-8 py-5">Sincro ML</th>
                 <th className="px-8 py-5 text-right">Precio ML</th>
                 <th className="px-8 py-5 text-center">Stock Sincro.</th>
                 <th className="px-8 py-5 text-center">Visitas ML</th> {/* Added Visitas ML column */}
                 <th className="px-8 py-5 text-center">Acciones</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {storeProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                         <img src={p.img} className="w-10 h-10 rounded-xl object-cover border" alt={p.name} />
                         <div>
                            <p className="font-bold text-slate-800 text-xs">{p.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SKU: ART-{p.id}00</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-4">
                      {p.mlStatus === 'sync' ? (
                        <div className="flex items-center gap-2 text-green-600 font-black text-[9px] uppercase tracking-widest">
                           <CheckCircle2 className="w-3.5 h-3.5" /> Sincronizado
                        </div>
                      ) : (
                        <button className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-yellow-200 transition-all">
                           <CloudIcon className="w-3.5 h-3.5" /> Publicar en ML
                        </button>
                      )}
                   </td>
                   <td className="px-8 py-4 text-right font-black text-slate-900 text-sm">
                      ${(p.price * 1.15).toLocaleString()}
                      <span className="block text-[8px] text-slate-400 font-bold">+15% Comisiones</span>
                   </td>
                   <td className="px-8 py-4 text-center font-black text-slate-700 text-sm">{p.stock}</td>
                   <td className="px-8 py-4 text-center font-bold text-slate-500 text-xs">{p.visits}</td> {/* Display visits */}
                   <td className="px-8 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-slate-300 hover:text-yellow-600 transition-all"><ExternalLink className="w-4 h-4" /></button>
                        <button className="p-2 text-slate-300 hover:text-slate-600 transition-all"><Settings className="w-4 h-4" /></button>
                      </div>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );

  const renderEnviosTab = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Integración de Envíos Andreani</h3>
        </div>

        {/* Andreani Status Card */}
        <div className={`p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 ${companyInfo.andreani.connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-3xl shadow-xl ${companyInfo.andreani.connected ? 'bg-green-400 text-slate-900 shadow-green-400/20' : 'bg-red-400 text-white shadow-red-400/20'}`}>
              <Plug className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Andreani</h3>
              <p className={`font-bold text-sm ${companyInfo.andreani.connected ? 'text-green-600' : 'text-red-600'}`}>Estado de conexión: <span className="uppercase tracking-widest ml-1">{companyInfo.andreani.connected ? `Activo (${companyInfo.andreani.nickname || 'Usuario Andreani'})` : 'No Conectado'}</span></p>
            </div>
          </div>
          {companyInfo.andreani.connected && (
            <button 
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3"
            >
              <RefreshCcw className="w-5 h-5" /> Verificar Conexión
            </button>
          )}
        </div>

        {/* Andreani Configuration Form */}
        <div className="pt-8 border-t border-slate-100 space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" /> Credenciales de Acceso
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client ID</label>
              <input 
                type="text" 
                value={andreaniClientId}
                onChange={(e) => setAndreaniClientId(e.target.value)}
                placeholder="Ingrese su Client ID de Andreani" 
                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Secret</label>
              <input 
                type="password" // Use password type for security
                value={andreaniClientSecret}
                onChange={(e) => setAndreaniClientSecret(e.target.value)}
                placeholder="Ingrese su Client Secret" 
                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Cuenta Andreani</label>
              <input 
                type="text" 
                value={andreaniAccountNumber}
                onChange={(e) => setAndreaniAccountNumber(e.target.value)}
                placeholder="Ej: 123456789" 
                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Sucursal de Despacho</label>
              <input 
                type="text" 
                value={andreaniBranchCode}
                onChange={(e) => setAndreaniBranchCode(e.target.value)}
                placeholder="Ej: CABA001" 
                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-center gap-4">
          <button 
            onClick={handleConnectAndreani}
            disabled={isConnectingAndreani || !andreaniClientId || !andreaniClientSecret || !andreaniAccountNumber || !andreaniBranchCode}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isConnectingAndreani ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plug className="w-5 h-5" />}
            {isConnectingAndreani ? 'Conectando...' : 'Conectar con Andreani'}
          </button>
          <button 
            onClick={handleSaveAndreaniSettings}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3"
          >
            <Save className="w-4 h-4 text-blue-500" /> Guardar Configuración
          </button>
        </div>
      </section>
    </div>
  );

  const renderPedidosTab = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-600" /> Pedidos Online Pendientes
          </h4>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold" placeholder="Buscar pedido..." />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">Pedido #</th>
              <th className="px-8 py-5">Cliente</th>
              <th className="px-8 py-5">Fecha</th>
              <th className="px-8 py-5 text-right">Total</th>
              <th className="px-8 py-5 text-center">Estado</th>
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockOnlineOrders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-4">
                  <p className="font-bold text-slate-800 text-sm">{order.id}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    <MapPin className="inline w-3 h-3 mr-1" /> {order.address}
                  </p>
                </td>
                <td className="px-8 py-4">
                  <p className="font-bold text-slate-800 text-sm">{order.client}</p>
                </td>
                <td className="px-8 py-4 text-sm font-medium text-slate-600">{order.date}</td>
                <td className="px-8 py-4 text-right font-black text-slate-900 text-sm">${order.total.toLocaleString()}</td>
                <td className="px-8 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    order.status === 'pendiente' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-8 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      className="p-2 text-slate-300 hover:text-blue-600 transition-all"
                      title="Ver Detalle"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    {companyInfo.andreani.connected ? (
                      <button
                        onClick={() => handleCreateAndreaniShipment(order.id)}
                        disabled={isCreatingShipment}
                        className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                        title="Crear Envío Andreani"
                      >
                        {isCreatingShipment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    ) : (
                      <button 
                        disabled 
                        className="p-2 text-slate-300 disabled:opacity-50" 
                        title="Andreani no conectado"
                      >
                        <Truck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );


  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><ShoppingBag className="w-6 h-6" /></div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+14%</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Online (Mes)</p>
          <h3 className="text-2xl font-black text-slate-800">$840.500</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Users className="w-6 h-6" /></div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+5%</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitas Únicas</p>
          <h3 className="text-2xl font-black text-slate-800">12.480</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl"><MousePointer2 className="w-6 h-6" /></div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Estable</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conv. Checkout</p>
          <h3 className="text-2xl font-black text-slate-800">3.2%</h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 relative z-10">Estado del Dominio</p>
          <h3 className="text-lg font-bold relative z-10">ferreteria-norte.com</h3>
          <div className="flex items-center gap-2 mt-4 relative z-10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">SSL Activo</span>
          </div>
          <Globe className="absolute -bottom-6 -right-6 w-24 h-24 text-white/5 rotate-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 rounded-[3rem] p-10 flex flex-col items-center justify-center gap-8 border border-slate-200">
           <div className="flex gap-4">
             <button className="p-3 bg-white shadow-sm rounded-xl text-orange-600"><Monitor className="w-5 h-5" /></button>
             <button className="p-3 bg-slate-200 shadow-sm rounded-xl text-slate-500"><Laptop className="w-5 h-5" /></button>
             <button className="p-3 bg-slate-200 shadow-sm rounded-xl text-slate-500"><Smartphone className="w-5 h-5" /></button>
           </div>
           <div onClick={handleViewStore} className="w-full aspect-video bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 group relative cursor-pointer">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                 <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400"></div><div className="w-2 h-2 rounded-full bg-yellow-400"></div><div className="w-2 h-2 rounded-full bg-green-400"></div></div>
                 <div className="bg-white border rounded-lg px-4 py-0.5 text-[9px] text-slate-400 font-bold">https://ferreteria-norte.com</div>
                 <div className="w-4"></div>
              </div>
              <div className="p-8 space-y-6">
                 <div className="w-full h-32 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-300 font-black text-xl uppercase tracking-widest">Banner Oferta</div>
                 <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => (<div key={i} className="aspect-square bg-slate-50 rounded-xl"></div>))}</div>
              </div>
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"><Eye className="w-4 h-4" /> Previsualizar Tienda</button>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Acciones Rápidas</h4>
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setActiveTab('diseno')} className="p-8 bg-white border border-slate-100 rounded-[2rem] text-center space-y-4 hover:shadow-xl transition-all group">
                 <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl mx-auto group-hover:scale-110 transition-transform"><Camera className="w-6 h-6" /></div>
                 <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Subir Banners</p>
              </button>
              <button onClick={() => setActiveTab('mercadolibre')} className="p-8 bg-yellow-50 border border-yellow-200 rounded-[2rem] text-center space-y-4 hover:shadow-xl transition-all group">
                 <div className="p-4 bg-yellow-400 text-slate-900 rounded-2xl mx-auto group-hover:scale-110 transition-transform"><Zap className="w-6 h-6 fill-current" /></div>
                 <p className="text-xs font-black text-slate-800 uppercase tracking-widest">MercadoLibre</p>
              </button>
              <button onClick={() => setActiveTab('envios')} className="p-8 bg-blue-50 border border-blue-200 rounded-[2rem] text-center space-y-4 hover:shadow-xl transition-all group">
                 <div className="p-4 bg-blue-400 text-white rounded-2xl mx-auto group-hover:scale-110 transition-transform"><Truck className="w-6 h-6" /></div>
                 <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Gestión de Envíos</p>
              </button>
              <button onClick={handleViewStore} className="p-8 bg-white border border-slate-100 rounded-[2rem] text-center space-y-4 hover:shadow-xl transition-all group">
                 <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl mx-auto group-hover:scale-110 transition-transform"><ExternalLink className="w-6 h-6" /></div>
                 <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Ver mi Sitio</p>
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {showPublicPreview && renderPublicPreview()}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-[1.5rem] shadow-xl"><Globe className="w-6 h-6" /></div>
          <div><h1 className="text-2xl font-bold text-slate-800 tracking-tight">Multi-Channel Management</h1><p className="text-slate-500 text-sm">Vende en tu propia tienda y MercadoLibre sincronizado.</p></div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleViewStore} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"><Eye className="w-4 h-4" /> Ver Tienda</button>
           <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">Publicar Cambios</button>
        </div>
      </header>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Laptop },
          { id: 'catalogo', label: 'Catálogo Web', icon: Tag },
          { id: 'mercadolibre', label: 'MercadoLibre', icon: Zap },
          { id: 'pedidos', label: 'Pedidos Online', icon: ShoppingBag },
          { id: 'envios', label: 'Envíos & Integraciones', icon: Truck }, // New tab
          { id: 'diseno', label: 'Personalización UI', icon: Layout },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as EcommerceTab)} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>
        ))}
      </div>

      <div className="py-2">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'catalogo' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center">
               <div className="relative w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="Buscar en tienda..." /></div>
               <button onClick={() => setShowProductPicker(true)} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95 transition-all"><Plus className="w-4 h-4" /> Agregar desde Inventario</button>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b"><tr><th className="px-8 py-5">Producto Web</th><th className="px-8 py-5">Estado</th><th className="px-8 py-5 text-center">Stock</th><th className="px-8 py-5 text-right">Precio Web</th><th className="px-8 py-5 text-center">Visitas</th><th className="px-8 py-5 text-center">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{storeProducts.map(p => (<tr key={p.id} className="hover:bg-slate-50/50 transition-colors"><td className="px-8 py-4"><div className="flex items-center gap-4"><img src={p.img} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm" /><div className="font-bold text-slate-800 text-sm">{p.name}</div></div></td><td className="px-8 py-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'publicado' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{p.status}</span></td><td className="px-8 py-4 text-center text-sm font-black text-slate-700">{p.stock}</td><td className="px-8 py-4 text-right font-black text-slate-900">${p.price.toLocaleString()}</td><td className="px-8 py-4 text-center font-bold text-slate-500 text-xs">{p.visits}</td><td className="px-8 py-4 text-center"><div className="flex items-center justify-center gap-2"><button className="p-2 text-slate-300 hover:text-orange-600 transition-all"><Settings className="w-4 h-4" /></button><button className="p-2 text-slate-300 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button></div></td></tr>))}</tbody></table></div>
          </div>
        )}
        {activeTab === 'mercadolibre' && renderMLTab()}
        {activeTab === 'pedidos' && renderPedidosTab()} {/* Render the new Pedidos tab */}
        {activeTab === 'envios' && renderEnviosTab()} {/* Render the new Envíos tab */}
        {activeTab === 'diseno' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8"><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Layout className="w-6 h-6 text-orange-600" /> Configuración de Diseño</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-12"><div className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color Principal</label><div className="flex gap-4"><input type="color" defaultValue="#f97316" className="w-12 h-12 rounded-xl border-none p-0 cursor-pointer" /><input className="flex-1 px-5 py-3 border border-slate-200 rounded-xl font-bold uppercase" defaultValue="#F97316" /></div></div><div className="space-y-4 pt-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opciones de Cabecera</p><div className="grid grid-cols-1 gap-2"><label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group hover:border-orange-500 transition-all"><span className="text-xs font-bold text-slate-700">Mostrar buscador prominente</span><input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-orange-600" /></label><label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group hover:border-orange-500 transition-all"><span className="text-xs font-bold text-slate-700">Habilitar Portal de Clientes</span><input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-orange-600" /></label></div></div></div><div className="bg-slate-100 rounded-[2.5rem] p-8 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4"><Monitor className="w-12 h-12 text-slate-300" /><p className="text-sm font-bold text-slate-400">Los cambios se aplican globalmente al publicar.</p><button onClick={handleViewStore} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">Abrir Previsualizador</button></div></div></div>
        )}
      </div>

      {/* Modal: PRODUCT PICKER FROM INVENTORY */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4"><div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Plus className="w-6 h-6" /></div><div><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Vincular a Tienda</h2><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Busca productos en tu inventario para publicar</p></div></div>
              <button onClick={() => setShowProductPicker(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Busca por SKU, nombre o marca..." className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-slate-50/50 shadow-sm" value={searchInventory} onChange={(e) => setSearchInventory(e.target.value)} autoFocus /></div>
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {inventoryItems.map(item => (
                  <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group" onClick={() => addToStore(item)}>
                    <div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-orange-500 transition-colors"><Tag className="w-5 h-5" /></div><div><p className="font-bold text-slate-800 text-sm">{item.name}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.sku} • {item.brand}</p></div></div>
                    <div className="flex items-center gap-4 text-right"><div><p className="text-sm font-black text-slate-900">${item.price.toLocaleString()}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stock: {item.stock}</p></div><div className="p-2 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm"><Plus className="w-5 h-5" /></div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4"><div className="flex items-center gap-3 text-slate-400 flex-1"><ImageIcon className="w-5 h-5" /><p className="text-[10px] font-bold leading-tight">Al vincular, se tomarán los datos de stock y precio automáticamente.</p></div><button onClick={() => setShowProductPicker(false)} className="py-4 px-8 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest">Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ecommerce;