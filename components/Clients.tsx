
import React, { useState, useEffect, useMemo } from 'react';
import { 
    User, Plus, Search, FileText, Globe, X, Copy, MessageCircle, Key, 
    ExternalLink, History, Eye, ChevronRight, ShoppingBag, Receipt, 
    Printer, Mail, DollarSign, ArrowDownLeft, CheckCircle, Wallet, 
    CreditCard, Package, Info, CheckSquare, Square, ArrowRight, Scroll, Smartphone, Landmark, UserPlus, Loader2, Zap, Save,
    // Added missing MapPin import
    ShieldCheck, Link, Share2, Edit, Trash2, FileSpreadsheet, LayoutTemplate, ChevronLeft, MapPin
} from 'lucide-react';
import { Client, CurrentAccountMovement, Check, TreasuryMovement, CompanyConfig, PaymentAccount } from '../types';
import { fetchCompanyByCuit } from '../services/geminiService';

interface ClientsProps {
    initialClientId?: string;
    onOpenPortal?: (client: Client) => void;
}

const Clients: React.FC<ClientsProps> = ({ initialClientId, onOpenPortal }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState<CurrentAccountMovement | null>(null);

  // --- ESTADOS IMPORTACIÓN EXCEL ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [importMapping, setImportMapping] = useState<Record<string, number>>({});
  const [importFileName, setImportFileName] = useState('');
  const [mockImportData, setMockImportData] = useState<string[][]>([
      ['CUIT', 'NOMBRE', 'DIRECCION', 'TELEFONO', 'LIMITE'],
      ['20-33445566-7', 'CONSTRUCCIONES S.A.', 'AV SIEMPRE VIVA 123', '11-2233-4455', '500000'],
      ['27-88990011-2', 'FERRETERIA CENTRAL', 'CALLE 10 445', '11-5566-7788', '200000'],
      ['20-11111111-5', 'JUAN GOMEZ', 'RUTA 8 KM 22', '11-9988-7766', '100000']
  ]);

  // --- DATOS: CONFIGURACIÓN DE EMPRESA ---
  const [companyConfig] = useState<CompanyConfig>(() => {
      const saved = localStorage.getItem('company_config');
      return saved ? JSON.parse(saved) : { paymentAccounts: [] };
  });

  // --- DATOS: CLIENTES ---
  const [clients, setClients] = useState<Client[]>(() => {
      const saved = localStorage.getItem('ferrecloud_clients');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Constructora del Norte', cuit: '30-12345678-9', phone: '11-4455-6677', address: 'Av. Libertador 1200', balance: 540000, limit: 1000000, portalEnabled: true, portalHash: 'C-D-N-2024' },
        { id: '2', name: 'Juan Perez', cuit: '20-11223344-5', phone: '11-2233-4455', address: 'Calle Falsa 123', balance: 15000, limit: 50000, portalEnabled: false },
      ];
  });

  const [movements] = useState<CurrentAccountMovement[]>(() => {
      const saved = localStorage.getItem('ferrecloud_movements');
      return saved ? JSON.parse(saved) : [];
  });

  // Efecto sincronización local
  useEffect(() => {
    localStorage.setItem('ferrecloud_clients', JSON.stringify(clients));
  }, [clients]);

  const [clientForm, setClientForm] = useState<Partial<Client>>({
      id: '', name: '', cuit: '', phone: '', balance: 0, limit: 100000, address: ''
  });

  const clientMovements = useMemo(() => {
      return movements
        .filter(m => m.clientId === selectedClient?.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, selectedClient]);

  const handleSearchCuit = async () => {
      if (!clientForm.cuit || clientForm.cuit.length < 8) {
          alert("Por favor ingrese un CUIT o DNI válido.");
          return;
      }
      setIsSearchingCuit(true);
      try {
          const data = await fetchCompanyByCuit(clientForm.cuit);
          if (data && data.name) {
              setClientForm(prev => ({
                  ...prev,
                  name: data.name,
                  address: data.address || '',
                  phone: data.phone || ''
              }));
          }
      } catch (err) { console.error(err); } finally { setIsSearchingCuit(false); }
  };

  const handleSaveClient = () => {
      if (!clientForm.name || !clientForm.cuit) return;
      setClients(prev => {
          if (isEditing && clientForm.id) {
              return prev.map(c => c.id === clientForm.id ? { ...c, ...clientForm } as Client : c);
          } else {
              return [{...clientForm as Client, id: Date.now().toString(), balance: 0}, ...prev];
          }
      });
      setIsNewClientModalOpen(false);
  };

  const handleTogglePortal = (clientId: string) => {
      setClients(prev => prev.map(c => {
          if (c.id === clientId) {
              const hash = c.portalHash || `portal-${Math.random().toString(36).substring(7)}`;
              return { ...c, portalEnabled: !c.portalEnabled, portalHash: hash };
          }
          return c;
      }));
  };

  // --- HANDLERS IMPORTACIÓN ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          setImportFileName(e.target.files[0].name);
          setImportStep(2);
      }
  };

  const executeImport = () => {
      const fieldKeys = ['cuit', 'name', 'address', 'phone', 'limit'];
      const newClients: Client[] = mockImportData.slice(1).map(row => {
          const client: any = { id: Math.random().toString(), balance: 0, portalEnabled: false };
          fieldKeys.forEach(key => {
              if (importMapping[key] !== undefined) {
                  client[key] = key === 'limit' ? parseFloat(row[importMapping[key]]) || 0 : row[importMapping[key]];
              }
          });
          return client as Client;
      });

      setClients([...newClients, ...clients]);
      setIsImportModalOpen(false);
      setImportStep(1);
      setImportMapping({});
      alert(`Se importaron ${newClients.length} clientes correctamente.`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Directorio de Clientes</h2>
                <p className="text-gray-500 text-sm font-medium italic">Gestión de créditos, cobranzas y portal de autogestión.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-2xl flex items-center gap-2 font-black hover:bg-slate-50 transition-all uppercase text-xs tracking-widest shadow-sm">
                    <FileSpreadsheet size={18} /> Importar Excel
                </button>
                <button 
                    onClick={() => { setIsEditing(false); setClientForm({name: '', cuit: '', phone: '', address: '', limit: 100000}); setIsNewClientModalOpen(true); }}
                    className="bg-ferre-orange text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-xl shadow-orange-900/10 hover:bg-orange-600 transition-all uppercase text-xs tracking-widest">
                    <Plus size={18} /> Nuevo Cliente
                </button>
            </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest border-b border-gray-100">
                    <tr>
                        <th className="px-8 py-5">Razón Social / CUIT</th>
                        <th className="px-8 py-5 text-center">Estado Portal</th>
                        <th className="px-8 py-5 text-right">Saldo Actual</th>
                        <th className="px-8 py-5 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {clients.map(client => (
                        <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-lg">
                                        {client.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 text-base uppercase tracking-tight leading-none mb-1">{client.name}</div>
                                        <div className="text-xs text-gray-400 font-mono font-bold italic">{client.cuit}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${client.portalEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                    {client.portalEnabled ? 'CONECTADO' : 'SIN ACCESO'}
                                </span>
                            </td>
                            <td className={`px-8 py-5 text-right font-black text-lg tracking-tighter ${client.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${client.balance?.toLocaleString('es-AR')}
                            </td>
                            <td className="px-8 py-5 text-center">
                                <div className="flex justify-center gap-2">
                                    <button 
                                        onClick={() => { setSelectedClient(client); setIsHistoryOpen(true); }}
                                        className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-md"
                                    >
                                        <History size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedClient(client); setIsPortalModalOpen(true); }}
                                        className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                                    >
                                        <Globe size={18}/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* MODAL: IMPORTACIÓN EXCEL */}
        {isImportModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-8 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500 text-white rounded-2xl">
                                <FileSpreadsheet size={24}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Importar Clientes desde Excel</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Carga Masiva de Base de Datos</p>
                            </div>
                        </div>
                        <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10">
                        {importStep === 1 ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                <div className="w-full max-w-md border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center hover:border-indigo-200 transition-all group relative">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} accept=".xlsx,.xls,.csv" />
                                    <div className="p-6 bg-slate-50 rounded-full text-slate-300 group-hover:text-indigo-500 transition-colors mb-4">
                                        <FileSpreadsheet size={64}/>
                                    </div>
                                    <p className="text-xl font-black text-slate-800 uppercase tracking-tighter">Arrastra tu archivo Excel</p>
                                    <p className="text-sm text-slate-400 mt-2 font-medium">O haz clic para buscar en tu ordenador</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3 max-w-md">
                                    <Info className="text-blue-500 shrink-0" size={20}/>
                                    <p className="text-[10px] text-blue-800 font-bold uppercase leading-relaxed">Asegúrese de que el archivo tenga una fila de encabezados para facilitar el mapeo de columnas.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10 animate-fade-in">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-green-600"><CheckCircle size={18}/></div>
                                        <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{importFileName}</p>
                                    </div>
                                    <button onClick={() => setImportStep(1)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Cambiar Archivo</button>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LayoutTemplate size={16}/> Mapeo de Columnas</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { key: 'cuit', label: 'CUIT / DNI', icon: FileText },
                                            { key: 'name', label: 'Razón Social / Nombre', icon: User },
                                            { key: 'address', label: 'Dirección Comercial', icon: MapPin },
                                            { key: 'phone', label: 'Teléfono de Contacto', icon: Smartphone },
                                            { key: 'limit', label: 'Límite de Crédito', icon: DollarSign },
                                        ].map(field => (
                                            <div key={field.key} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all">
                                                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <field.icon size={20}/>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{field.label}</p>
                                                    <select 
                                                        className="w-full bg-slate-100 border-none rounded-lg text-xs font-bold p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                                        value={importMapping[field.key] ?? ''}
                                                        onChange={(e) => setImportMapping({...importMapping, [field.key]: parseInt(e.target.value)})}
                                                    >
                                                        <option value="">-- No importar --</option>
                                                        {mockImportData[0].map((header, idx) => (
                                                            <option key={idx} value={idx}>Columna: {header}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Previsualización de los primeros 3 registros</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-[11px]">
                                            <thead className="text-slate-500 border-b border-white/10">
                                                <tr>
                                                    {mockImportData[0].map((h, i) => <th key={i} className="pb-3 px-2">{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {mockImportData.slice(1, 4).map((row, idx) => (
                                                    <tr key={idx} className="text-slate-300">
                                                        {row.map((cell, i) => <td key={i} className="py-3 px-2 font-medium">{cell}</td>)}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                        <button onClick={() => setIsImportModalOpen(false)} className="px-8 py-3 font-black text-xs text-gray-400 hover:text-gray-600 uppercase tracking-widest">Cancelar</button>
                        {importStep === 2 && (
                            <button 
                                onClick={executeImport}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-3">
                                <CheckCircle size={18}/> Confirmar Importación
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: ALTA/EDICIÓN CLIENTE (Existente) */}
        {isNewClientModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-ferre-orange text-white rounded-2xl shadow-lg">
                                <UserPlus size={24}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{isEditing ? 'Actualización de Perfil' : 'Alta en Base de Datos'}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsNewClientModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="relative">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">CUIT / DNI (Identificación Fiscal)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-gray-700" 
                                    placeholder="30-xxxxxxxx-x"
                                    value={clientForm.cuit || ''} 
                                    onChange={e => setClientForm({...clientForm, cuit: e.target.value})} 
                                />
                                <button 
                                    onClick={handleSearchCuit}
                                    disabled={isSearchingCuit}
                                    className="bg-indigo-600 text-white px-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 min-w-[56px]">
                                    {isSearchingCuit ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Nombre / Razón Social</label>
                            <input type="text" className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-gray-700 uppercase" value={clientForm.name || ''} onChange={e => setClientForm({...clientForm, name: e.target.value})} />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Dirección Comercial</label>
                            <input type="text" className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-gray-700 uppercase" value={clientForm.address || ''} onChange={e => setClientForm({...clientForm, address: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Teléfono</label>
                                <input type="text" className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-gray-700" value={clientForm.phone || ''} onChange={e => setClientForm({...clientForm, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 tracking-widest">Límite de Crédito ($)</label>
                                <input type="number" className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-bold text-gray-700" value={clientForm.limit || 100000} onChange={e => setClientForm({...clientForm, limit: parseFloat(e.target.value) || 0})} />
                            </div>
                        </div>
                        
                        <button onClick={handleSaveClient} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all mt-4 active:scale-95 flex items-center justify-center gap-2">
                           <Save size={16}/> {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: CONFIGURACIÓN PORTAL CLIENTE (Existente) */}
        {isPortalModalOpen && selectedClient && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg">
                                <Globe size={24}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Portal de Cliente</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acceso Externo</p>
                            </div>
                        </div>
                        <button onClick={() => setIsPortalModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Habilitar Portal</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Permitir que el cliente vea su saldo</p>
                            </div>
                            <div 
                                onClick={() => handleTogglePortal(selectedClient.id)}
                                className={`w-14 h-8 rounded-full relative transition-all cursor-pointer ${selectedClient.portalEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${selectedClient.portalEnabled ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </div>

                        {selectedClient.portalEnabled && (
                            <div className="space-y-4 animate-fade-in">
                                <button 
                                    onClick={() => onOpenPortal?.(selectedClient)}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                    <ExternalLink size={16}/> Acceder al Portal (Vista Previa)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: CUENTA CORRIENTE (Existente) */}
        {isHistoryOpen && selectedClient && (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
                <div className="bg-white h-full w-full max-w-5xl shadow-2xl flex flex-col animate-slide-in-right">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center font-black text-2xl uppercase">
                                {selectedClient.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-2xl uppercase tracking-tighter">{selectedClient.name}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Cuenta Corriente</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedClient.cuit}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => { setIsHistoryOpen(false); setViewingVoucher(null); }} className="p-3 hover:bg-white/10 rounded-2xl">
                                <X size={28}/>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
                        <div className="p-8 grid grid-cols-3 gap-6 bg-white border-b border-gray-100 shadow-sm">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Adeudado</p>
                                <p className="text-4xl font-black text-red-600 tracking-tighter">${selectedClient.balance?.toLocaleString('es-AR')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Clients;
