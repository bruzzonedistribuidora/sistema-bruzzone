
import React, { useState, useRef } from 'react';
import { 
  Shield, Layout, Lock, Building2, 
  Camera, Save, Upload, CheckCircle2,
  Globe, Mail, Phone, MapPin, FileText,
  Zap, Server, Key, RefreshCw, AlertCircle,
  Activity, CloudLightning, ShieldCheck,
  ChevronRight, Printer, Maximize2, Scissors,
  Type, LayoutPanelTop, Eye, FileJson,
  DownloadCloud, Archive, Eraser, Loader2, Info,
  Trash2
} from 'lucide-react';
import { CompanyInfo } from '../App';
import { useFirebase } from '../context/FirebaseContext'; // Import useFirebase

interface SettingsProps {
  plan: 'basic' | 'premium' | 'enterprise';
  setPlan: (plan: 'basic' | 'premium' | 'enterprise') => void;
  isAdmin: boolean;
  companyInfo: CompanyInfo;
  setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;
}

type PrintDocType = 'factura' | 'remito' | 'recibo' | 'etiqueta';

const Settings: React.FC<SettingsProps> = ({ plan, setPlan, isAdmin, companyInfo, setCompanyInfo }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'system' | 'company' | 'arca' | 'printing' | 'data'>('company'); // New 'data' tab
  const [isSyncing, setIsSyncing] = useState(false);
  const { exportAllData, deleteAllDocumentsInCollection } = useFirebase(); // Use new Firebase functions
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationPassword, setDeleteConfirmationPassword] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Password for deleting all data (FRONTEND ONLY FOR DEMO)
  const MASTER_DELETE_PASSWORD = "BORRARTODO"; 

  // States para impresión
  const [selectedDoc, setSelectedDoc] = useState<PrintDocType>('factura');
  const [printSettings, setPrintSettings] = useState({
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 10, bottom: 10, left: 15, right: 10 },
    showLogo: true,
    showCuit: true,
    showAddress: true,
    showLegal: true,
    showQr: true,
    copies: 2
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompanyInfo(prev => ({ ...prev, logo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const checked = (e.target as HTMLInputElement).checked;
    
    setCompanyInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArcaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const checked = (e.target as HTMLInputElement).checked;
    
    setCompanyInfo(prev => ({
      ...prev,
      arca: {
        ...prev.arca,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const syncLastInvoice = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('Sincronización con ARCA exitosa. Numeración actualizada.');
    }, 1500);
  };

  // New: Handle Export Data
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const collectionsToExport = [
        'products', 'clients', 'suppliers', 'transactions', 'priceLists', 
        'branches', 'sales', 'purchaseOrders', 'checks', // Add other relevant collections
      ];
      const data = await exportAllData(collectionsToExport);
      
      const filename = `ferrogest_backup_${new Date().toISOString().slice(0, 19).replace(/[:T-]/g, '_')}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Backup de datos generado con éxito.');
    } catch (error) {
      console.error('Error al generar backup:', error);
      alert('Error al generar backup. Consulte la consola para más detalles.');
    } finally {
      setIsExporting(false);
    }
  };

  // New: Handle Delete All Data
  const handleConfirmDeleteAllData = async () => {
    if (deleteConfirmationPassword !== MASTER_DELETE_PASSWORD) {
      alert('Contraseña de seguridad incorrecta.');
      return;
    }

    setIsDeleting(true);
    setShowDeleteConfirmModal(false); // Close confirmation modal
    try {
      const collectionsToDelete = [
        'products', 'clients', 'suppliers', 'transactions', 'priceLists', 
        'branches', 'sales', 'purchaseOrders', 'checks',
      ]; // Exclude 'users' collection to maintain login capabilities

      for (const collectionName of collectionsToDelete) {
        await deleteAllDocumentsInCollection(collectionName);
      }
      alert('Todos los datos han sido eliminados del sistema.');
    } catch (error) {
      console.error('Error al eliminar todos los datos:', error);
      alert('Error al eliminar todos los datos. Consulte la consola para más detalles.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationPassword(''); // Clear password
    }
  };


  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Configuración del Sistema</h1>
          <p className="text-slate-500 font-medium">Gestiona módulos, identidad fiscal, conexión con ARCA e impresión.</p>
        </div>
      </header>

      {/* Internal Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'company' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-5 h-5" /> Empresa
        </button>
        <button
          onClick={() => setActiveTab('arca')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'arca' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CloudLightning className="w-5 h-5" /> Facturación ARCA
        </button>
        <button
          onClick={() => setActiveTab('printing')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'printing' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer className="w-5 h-5" /> Impresión
        </button>
        <button
          onClick={() => setActiveTab('data')} // New tab
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'data' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Archive className="w-5 h-5" /> Datos
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'system' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layout className="w-5 h-5" /> Módulos
        </button>
      </div>

      {activeTab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right duration-500">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Datos Fiscales Básicos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razón Social</label>
                  <input name="name" value={companyInfo.name} onChange={handleInputChange} className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CUIT</label>
                  <input name="cuit" value={companyInfo.cuit} onChange={handleInputChange} className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Condición IVA</label>
                  <select name="ivaCondition" value={companyInfo.ivaCondition} onChange={handleInputChange} className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl outline-none font-bold bg-white">
                    <option>Responsable Inscripto</option>
                    <option>Monotributista</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                  <input name="address" value={companyInfo.address} onChange={handleInputChange} className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl outline-none font-bold" />
                </div>
              </div>
            </section>
          </div>
          <div className="space-y-6">
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Logo Empresa</h3>
              <div className="relative w-40 h-40 mx-auto group">
                {companyInfo.logo ? (
                  <img src={companyInfo.logo} className="w-full h-full rounded-[2rem] object-cover border-4 border-white shadow-xl" alt="Logo" />
                ) : (
                  <div className="w-full h-full rounded-[2rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                    <Camera className="w-10 h-10 mb-2" />
                    <span className="text-[10px] font-bold uppercase">Sin Logo</span>
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 bg-orange-600 text-white rounded-2xl shadow-lg hover:bg-orange-500 transition-all">
                  <Upload className="w-5 h-5" />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'arca' && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                   <Server className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
                   <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                         <div className={`w-3 h-3 rounded-full ${companyInfo.arca.enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                         <span className="text-xs font-black uppercase tracking-widest">WebService ARCA</span>
                      </div>
                      <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">Factura Electrónica</h3>
                      <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                         <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">Certificado:</span>
                            <span className="text-green-400 font-black">VÁLIDO</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">Vencimiento:</span>
                            <span className="text-white font-bold">{new Date(companyInfo.arca.crtValidUntil).toLocaleDateString()}</span>
                         </div>
                      </div>
                   </div>
                </section>
                <button onClick={syncLastInvoice} disabled={isSyncing} className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all active:scale-95">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
                     </div>
                     <div className="text-left">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Sincronizar</p>
                        <p className="text-[10px] text-slate-400 font-bold">Último número AFIP</p>
                     </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              </div>
              <div className="lg:col-span-2">
                <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Punto de Venta</label>
                         <input type="number" name="puntoVenta" value={companyInfo.arca.puntoVenta} onChange={handleArcaChange} className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-black text-xl" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ingresos Brutos</label>
                         <input name="iibb" value={companyInfo.arca.iibb} onChange={handleArcaChange} className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-bold" />
                      </div>
                   </div>
                </section>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'printing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-top duration-500">
          {/* Document Type Selector & Basic Settings */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Scissors className="w-4 h-4 text-purple-600" /> Comprobante a Editar
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(['factura', 'remito', 'recibo', 'etiqueta'] as PrintDocType[]).map((doc) => (
                  <button
                    key={doc}
                    onClick={() => setSelectedDoc(doc)}
                    className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                      selectedDoc === doc ? 'bg-purple-50 border-purple-500 text-purple-600' : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    {doc}
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-purple-600" /> Formato de Hoja
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tamaño de Papel</label>
                  <select 
                    value={printSettings.pageSize}
                    onChange={(e) => setPrintSettings({...printSettings, pageSize: e.target.value})}
                    className="w-full px-5 py-3 border-2 border-slate-100 rounded-xl font-bold bg-white"
                  >
                    <option value="A4">A4 (Oficina)</option>
                    <option value="A5">A5 (Media Hoja)</option>
                    <option value="80mm">Ticket 80mm (Térmica)</option>
                    <option value="58mm">Ticket 58mm (Térmica)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Orientación</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPrintSettings({...printSettings, orientation: 'portrait'})}
                      className={`flex-1 py-3 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${printSettings.orientation === 'portrait' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}
                    >
                      Vertical
                    </button>
                    <button 
                      onClick={() => setPrintSettings({...printSettings, orientation: 'landscape'})}
                      className={`flex-1 py-3 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${printSettings.orientation === 'landscape' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}
                    >
                      Horizontal
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <LayoutPanelTop className="w-4 h-4 text-purple-600" /> Márgenes (mm)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {['top', 'bottom', 'left', 'right'].map((margin) => (
                  <div key={margin} className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest capitalize">{margin}</label>
                    <input 
                      type="number" 
                      value={(printSettings.margins as any)[margin]} 
                      onChange={(e) => setPrintSettings({
                        ...printSettings, 
                        margins: { ...printSettings.margins, [margin]: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-2 border-2 border-slate-50 rounded-lg font-bold text-center" 
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Field Selection & Preview */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Field Toggles */}
              <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                  <Type className="w-6 h-6 text-purple-600" /> Información a Mostrar
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'showLogo', label: 'Logo de Empresa' },
                    { key: 'showCuit', label: 'CUIT y Datos Fiscales' },
                    { key: 'showAddress', label: 'Domicilio Comercial' },
                    { key: 'showLegal', label: 'Leyendas Legales / Pie' },
                    { key: 'showQr', label: 'QR ARCA (Factura E)' },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-600">{field.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(printSettings as any)[field.key]} 
                          onChange={(e) => setPrintSettings({...printSettings, [field.key]: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-100">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Número de Copias</label>
                     <div className="flex items-center gap-4">
                        <input 
                          type="range" min="1" max="5" 
                          value={printSettings.copies} 
                          onChange={(e) => setPrintSettings({...printSettings, copies: parseInt(e.target.value)})}
                          className="flex-1 accent-purple-600" 
                        />
                        <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-black">{printSettings.copies}</span>
                     </div>
                  </div>
                </div>
              </section>

              {/* Visual Preview Placeholder */}
              <section className="bg-slate-100 p-10 rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center relative group min-h-[500px]">
                <div className="absolute top-6 left-6 flex items-center gap-2 text-slate-400">
                   <Eye className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Vista Previa Dinámica</span>
                </div>
                
                {/* Paper Mockup */}
                <div 
                  className={`bg-white shadow-2xl rounded-sm transition-all duration-500 overflow-hidden flex flex-col p-4 ${
                    printSettings.pageSize === 'A4' ? 'w-[210px] h-[297px] scale-[1.5]' :
                    printSettings.pageSize === 'A5' ? 'w-[148px] h-[210px] scale-[1.8]' :
                    'w-[100px] h-[300px] scale-[1.5]'
                  }`}
                  style={{
                    paddingTop: `${printSettings.margins.top / 2}px`,
                    paddingBottom: `${printSettings.margins.bottom / 2}px`,
                    paddingLeft: `${printSettings.margins.left / 2}px`,
                    paddingRight: `${printSettings.margins.right / 2}px`,
                  }}
                >
                  <div className="border-b border-slate-100 pb-2 mb-2 flex justify-between">
                    <div className="space-y-1">
                       {printSettings.showLogo && <div className="w-8 h-8 bg-slate-200 rounded"></div>}
                       {printSettings.showCuit && <div className="w-12 h-1 bg-slate-100 rounded"></div>}
                    </div>
                    <div className="text-[6px] font-black text-slate-300">N° 0005-00001234</div>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                     <div className="w-full h-2 bg-slate-50 rounded"></div>
                     <div className="grid grid-cols-4 gap-1">
                        <div className="h-1 bg-slate-100 rounded"></div>
                        <div className="h-1 bg-slate-100 rounded col-span-2"></div>
                        <div className="h-1 bg-slate-100 rounded text-right"></div>
                     </div>
                     {[1,2,3,4].map(i => (
                       <div key={i} className="flex justify-between py-0.5 border-b border-slate-50 border-dotted">
                          <div className="w-20 h-1 bg-slate-50 rounded"></div>
                          <div className="w-4 h-1 bg-slate-50 rounded"></div>
                       </div>
                     ))}
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-1 items-end">
                     <div className="w-16 h-2 bg-slate-100 rounded"></div>
                     <div className="w-24 h-3 bg-purple-100 rounded"></div>
                     {printSettings.showQr && (
                       <div className="w-8 h-8 bg-slate-900 self-start mt-2 rounded-sm flex items-center justify-center">
                          <div className="w-4 h-4 bg-white/10 rounded-full animate-pulse"></div>
                       </div>
                     )}
                  </div>
                </div>

                <button className="absolute bottom-10 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                   <Printer className="w-4 h-4" /> Imprimir Prueba
                </button>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* New: Data Management Tab */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right duration-500">
          {/* Backup Section */}
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <DownloadCloud className="w-6 h-6 text-green-600" /> Exportar Datos (Backup)
            </h3>
            <p className="text-slate-500 text-sm">Genera un archivo JSON con todos los datos de tu ferretería para guardarlo de forma segura.</p>
            <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 flex items-start gap-4">
              <Info className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-900">Importante:</p>
                <p className="text-xs text-green-700 mt-1">Este backup es un respaldo de datos. Para restaurar, se requeriría una importación manual o un proceso técnico avanzado.</p>
              </div>
            </div>
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-green-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Archive className="w-5 h-5" />}
              {isExporting ? 'Generando Backup...' : 'Generar Backup (JSON)'}
            </button>
          </section>

          {/* Delete All Data Section */}
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <Eraser className="w-6 h-6 text-red-600" /> Borrar Todos los Datos
            </h3>
            <p className="text-slate-500 text-sm">Esta acción es **IRREVERSIBLE**. Eliminará todos los productos, clientes, proveedores, ventas, etc. de tu sistema.</p>
            
            <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">ADVERTENCIA CRÍTICA:</p>
                <p className="text-xs text-red-700 mt-1">No hay marcha atrás. Asegúrate de tener un backup reciente y de entender las consecuencias.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar con Contraseña de Seguridad</label>
              <input
                type="password"
                value={deleteConfirmationPassword}
                onChange={(e) => setDeleteConfirmationPassword(e.target.value)}
                placeholder="Escribe 'BORRARTODO' para habilitar"
                className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-red-600"
                disabled={isDeleting}
              />
            </div>
            <button 
              onClick={() => setShowDeleteConfirmModal(true)}
              disabled={deleteConfirmationPassword !== MASTER_DELETE_PASSWORD || isDeleting}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              {isDeleting ? 'Eliminando Datos...' : 'Borrar Todos los Datos'}
            </button>
          </section>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 text-center">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-200">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-600/10">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">¡ATENCIÓN! Eliminación Irreversible</h2>
                <p className="text-slate-500 font-medium mb-8 px-4">
                  Estás a punto de borrar **TODOS** los datos de tu empresa (productos, clientes, ventas, etc.).
                  Esta acción no se puede deshacer. ¿Estás absolutamente seguro?
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleConfirmDeleteAllData}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-600/20 hover:bg-red-500 transition-all"
                  >
                    SÍ, ENTIENDO Y QUIERO BORRAR TODO
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirmModal(false)}
                    className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-8 animate-in slide-in-from-left duration-500">
          {isAdmin ? (
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Layout className="w-5 h-5 text-orange-500" /> Plan de Suscripción Actual
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'basic', name: 'Basic', price: '$15.000/mes', color: 'bg-slate-50 border-slate-200' },
                  { id: 'premium', name: 'Premium', price: '$25.000/mes', color: 'bg-orange-50 border-orange-200' },
                  { id: 'enterprise', name: 'Enterprise', price: '$45.000/mes', color: 'bg-purple-50 border-purple-200' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id as any)}
                    className={`p-6 rounded-2xl border-2 text-left transition-all group ${
                      plan === p.id 
                        ? 'ring-4 ring-orange-500/20 border-orange-500 ' + p.color 
                        : 'bg-white border-slate-100 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <h4 className="font-bold text-xl text-slate-800">{p.name}</h4>
                    <p className="text-slate-500 mb-4">{p.price}</p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      plan === p.id ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {plan === p.id ? 'Activo' : 'Seleccionar'}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center">
              <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-400">Control Restringido</h3>
              <p className="text-sm text-slate-500">Solo administradores gestionan el plan.</p>
            </section>
          )}
        </div>
      )}
      
      <div className="flex justify-end pt-10">
        <button 
          onClick={() => alert('Configuración guardada')}
          className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95"
        >
          <Save className="w-5 h-5 text-blue-400" /> Guardar Todo
        </button>
      </div>
    </div>
  );
};

export default Settings;