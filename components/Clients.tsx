
import React, { useState, useEffect, useMemo } from 'react';
import { 
    User, Plus, Search, FileText, Globe, X, Copy, MessageCircle, Key, 
    ExternalLink, History, Eye, ChevronRight, ShoppingBag, Receipt, 
    Printer, Mail, DollarSign, ArrowDownLeft, CheckCircle, Wallet, 
    CreditCard, Package, Info, CheckSquare, Square, ArrowRight, Scroll, Smartphone, Landmark, UserPlus, Loader2, Zap, Save,
    ShieldCheck, Link, Share2, Edit, Trash2
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

  // --- DATOS: CONFIGURACIÓN DE EMPRESA (Para medios de pago) ---
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(() => {
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

  const [movements, setMovements] = useState<CurrentAccountMovement[]>(() => {
      const saved = localStorage.getItem('ferrecloud_movements');
      return saved ? JSON.parse(saved) : [];
  });

  const [checks, setChecks] = useState<Check[]>(() => {
      const saved = localStorage.getItem('ferrecloud_checks');
      return saved ? JSON.parse(saved) : [];
  });

  // Efecto sincronización local
  useEffect(() => {
    localStorage.setItem('ferrecloud_clients', JSON.stringify(clients));
    localStorage.setItem('ferrecloud_movements', JSON.stringify(movements));
    localStorage.setItem('ferrecloud_checks', JSON.stringify(checks));
  }, [clients, movements, checks]);

  const [clientForm, setClientForm] = useState<Partial<Client>>({
      id: '', name: '', cuit: '', phone: '', balance: 0, limit: 100000, address: ''
  });

  const [receiptForm, setReceiptForm] = useState({
      amount: '',
      method: 'EFECTIVO' as string, 
      note: '',
      selectedVouchers: [] as string[]
  });

  const [checkData, setCheckData] = useState({
      bank: '',
      number: '',
      paymentDate: new Date().toISOString().split('T')[0],
      issuerCuit: ''
  });

  useEffect(() => {
    if (initialClientId) {
        const client = clients.find(c => c.id === initialClientId);
        if (client) {
            setSelectedClient(client);
            setIsHistoryOpen(true);
        }
    }
  }, [initialClientId, clients]);

  const clientMovements = useMemo(() => {
      return movements
        .filter(m => m.clientId === selectedClient?.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, selectedClient]);

  const pendingVouchers = useMemo(() => {
      return clientMovements.filter(m => m.debit > 0);
  }, [clientMovements]);

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
          } else {
              alert("La IA no pudo autocompletar este CUIT. Por favor, ingrese los datos manualmente.");
          }
      } catch (err) {
          console.error(err);
          alert("Error de conexión al buscar el CUIT.");
      } finally {
          setIsSearchingCuit(false);
      }
  };

  const handleOpenAddModal = () => {
      setIsEditing(false);
      setClientForm({ id: '', name: '', cuit: '', phone: '', balance: 0, limit: 100000, address: '' });
      setIsNewClientModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
      setIsEditing(true);
      setClientForm({ ...client });
      setIsNewClientModalOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      if (client.balance > 0) {
          alert("No se puede eliminar un cliente con saldo pendiente. Primero debe saldar su cuenta corriente.");
          return;
      }

      if (confirm(`¿Está seguro que desea eliminar al cliente "${client.name}"? Esta acción no se puede deshacer.`)) {
          setClients(prev => prev.filter(c => c.id !== clientId));
      }
  };

  const handleSaveClient = () => {
      if (!clientForm.name || !clientForm.cuit) {
          alert("Nombre y CUIT son campos obligatorios.");
          return;
      }

      setClients(prev => {
          if (isEditing && clientForm.id) {
              return prev.map(c => c.id === clientForm.id ? { ...c, ...clientForm } as Client : c);
          } else {
              const newClient: Client = {
                  ...clientForm as Client,
                  id: Date.now().toString(),
                  portalEnabled: false,
                  balance: clientForm.balance || 0,
                  limit: clientForm.limit || 100000
              };
              return [newClient, ...prev];
          }
      });

      setIsNewClientModalOpen(false);
      setClientForm({ id: '', name: '', cuit: '', phone: '', balance: 0, limit: 100000, address: '' });
  };

  const handleAddReceipt = () => {
      if (!selectedClient || !receiptForm.amount) return;

      const amount = parseFloat(receiptForm.amount);
      const newBalance = selectedClient.balance - amount;
      const receiptId = `REC-${Date.now().toString().slice(-6)}`;
      
      const isAdvance = receiptForm.selectedVouchers.length === 0;
      const descPrefix = isAdvance ? 'ADELANTO A CUENTA' : `PAGO CANCELACIÓN (${receiptForm.selectedVouchers.join(', ')})`;

      let methodLabel = receiptForm.method;
      const customAccount = companyConfig.paymentAccounts.find(a => a.id === receiptForm.method);
      if (customAccount) {
          methodLabel = `${customAccount.bankName} (${customAccount.alias})`;
      }

      if (receiptForm.method === 'CHEQUE' || receiptForm.method === 'ECHEQ') {
          if (!checkData.bank || !checkData.number) {
              alert("Por favor complete los datos del cheque.");
              return;
          }
          const newCheck: Check = {
              id: `CH-${Date.now()}`,
              type: receiptForm.method === 'CHEQUE' ? 'FISICO' : 'ECHEQ',
              bank: checkData.bank,
              number: checkData.number,
              amount: amount,
              paymentDate: checkData.paymentDate,
              entryDate: new Date().toISOString().split('T')[0],
              status: 'CARTERA',
              origin: selectedClient.name,
              issuerCuit: checkData.issuerCuit
          };
          setChecks([newCheck, ...checks]);
      }

      const newMovement: CurrentAccountMovement = {
          id: receiptId,
          date: new Date().toISOString().split('T')[0],
          voucherType: 'RECIBO',
          description: `${descPrefix} - ${methodLabel}${receiptForm.note ? ': ' + receiptForm.note : ''}`,
          debit: 0,
          credit: amount,
          balance: newBalance,
          clientId: selectedClient.id
      };
      setMovements([newMovement, ...movements]);

      const tMovementsRaw = localStorage.getItem('ferrecloud_treasury_movements');
      const tMovements: TreasuryMovement[] = tMovementsRaw ? JSON.parse(tMovementsRaw) : [];
      
      let treasuryMethod: TreasuryMovement['paymentMethod'] = 'TRANSFERENCIA';
      if (receiptForm.method === 'EFECTIVO') treasuryMethod = 'EFECTIVO';
      else if (receiptForm.method === 'CHEQUE') treasuryMethod = 'CHEQUE';
      else if (receiptForm.method === 'ECHEQ') treasuryMethod = 'ECHEQ';
      else if (customAccount?.type === 'VIRTUAL_WALLET') treasuryMethod = 'MERCADO_PAGO';

      const newTMovement: TreasuryMovement = {
          id: `T-${receiptId}`,
          date: new Date().toLocaleString(),
          type: 'INCOME',
          subtype: 'COBRO_CTACTE',
          paymentMethod: treasuryMethod,
          amount: amount,
          description: `Cobranza Cliente: ${selectedClient.name} (${receiptId}) - Vía ${methodLabel}`,
          cashRegisterId: '1' 
      };
      localStorage.setItem('ferrecloud_treasury_movements', JSON.stringify([newTMovement, ...tMovements]));

      if (receiptForm.method === 'EFECTIVO') {
          const registersRaw = localStorage.getItem('ferrecloud_registers');
          if (registersRaw) {
              const regs = JSON.parse(registersRaw);
              const updatedRegs = regs.map((r: any) => r.id === '1' ? { ...r, balance: r.balance + amount } : r);
              localStorage.setItem('ferrecloud_registers', JSON.stringify(updatedRegs));
          }
      }

      const updatedClient = { ...selectedClient, balance: newBalance };
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      setSelectedClient(updatedClient);
      
      setIsReceiptModalOpen(false);
      setReceiptForm({ amount: '', method: 'EFECTIVO', note: '', selectedVouchers: [] });
      setCheckData({ bank: '', number: '', paymentDate: new Date().toISOString().split('T')[0], issuerCuit: '' });
  };

  const handleTogglePortal = (clientId: string) => {
      setClients(prev => prev.map(c => {
          if (c.id === clientId) {
              const isEnabling = !c.portalEnabled;
              return { 
                  ...c, 
                  portalEnabled: isEnabling,
                  portalHash: isEnabling ? (c.portalHash || `portal-${Math.random().toString(36).substring(7)}`) : c.portalHash
              };
          }
          return c;
      }));
      if (selectedClient?.id === clientId) {
          const updated = clients.find(c => c.id === clientId);
          if (updated) setSelectedClient({
                ...updated,
                portalEnabled: !updated.portalEnabled,
                portalHash: !updated.portalEnabled ? (updated.portalHash || `portal-${Math.random().toString(36).substring(7)}`) : updated.portalHash
          });
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Directorio de Clientes</h2>
                <p className="text-gray-500 text-sm font-medium italic">Gestión de créditos, cobranzas y portal de autogestión.</p>
            </div>
            <button 
                onClick={handleOpenAddModal}
                className="bg-ferre-orange text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black shadow-xl shadow-orange-900/10 hover:bg-orange-600 transition-all uppercase text-xs tracking-widest">
                <Plus size={18} /> Nuevo Cliente
            </button>
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
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-lg group-hover:scale-105 transition-transform">
                                        {client.name.charAt(0)}
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
                                ${client.balance.toLocaleString('es-AR')}
                            </td>
                            <td className="px-8 py-5 text-center">
                                <div className="flex justify-center gap-2">
                                    <button 
                                        onClick={() => { setSelectedClient(client); setIsHistoryOpen(true); }}
                                        className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-md group-hover:scale-105"
                                        title="Ver Cuenta Corriente"
                                    >
                                        <History size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => handleOpenEditModal(client)}
                                        className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                                        title="Editar Cliente"
                                    >
                                        <Edit size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedClient(client); setIsPortalModalOpen(true); }}
                                        className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                                        title="Configurar Portal"
                                    >
                                        <Globe size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClient(client.id)}
                                        className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-red-100 opacity-0 group-hover:opacity-100"
                                        title="Eliminar Cliente"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* MODAL: ALTA/EDICIÓN CLIENTE */}
        {isNewClientModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-ferre-orange text-white rounded-2xl shadow-lg shadow-orange-200">
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
                            <p className="text-[9px] text-indigo-500 font-bold mt-1 uppercase tracking-tighter flex items-center gap-1">
                                <Zap size={10}/> Buscar datos automáticamente con IA
                            </p>
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

        {/* MODAL: CUENTA CORRIENTE (History View) */}
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
                            <button 
                                onClick={() => setIsReceiptModalOpen(true)}
                                className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all">
                                <DollarSign size={18}/> REGISTRAR COBRO
                            </button>
                            <button onClick={() => { setIsHistoryOpen(false); setViewingVoucher(null); }} className="p-3 hover:bg-white/10 rounded-2xl">
                                <X size={28}/>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
                        <div className="p-8 grid grid-cols-3 gap-6 bg-white border-b border-gray-100 shadow-sm">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Adeudado</p>
                                <p className="text-4xl font-black text-red-600 tracking-tighter">${selectedClient.balance.toLocaleString('es-AR')}</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Límite de Crédito</p>
                                <p className="text-4xl font-black text-slate-800 tracking-tighter">${selectedClient.limit.toLocaleString('es-AR')}</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Crédito Disponible</p>
                                <p className="text-4xl font-black text-green-600 tracking-tighter">${(selectedClient.limit - selectedClient.balance).toLocaleString('es-AR')}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 relative">
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Fecha / ID</th>
                                            <th className="px-6 py-4">Concepto / Comprobante</th>
                                            <th className="px-6 py-4 text-right">Debe (+)</th>
                                            <th className="px-6 py-4 text-right text-green-400">Haber (-)</th>
                                            <th className="px-6 py-4 text-right text-white">Saldo</th>
                                            <th className="px-6 py-4 text-center">Ver</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm">
                                        {clientMovements.map(m => (
                                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-slate-700">{m.date}</div>
                                                    <div className="text-[10px] font-mono font-black text-slate-400 uppercase">{m.id}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${m.credit > 0 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {m.credit > 0 ? <ArrowDownLeft size={16}/> : <Receipt size={16}/>}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-800 uppercase text-xs tracking-tight">{m.voucherType}</div>
                                                            <div className="text-[11px] text-gray-400 font-medium">{m.description}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-bold text-red-500">{m.debit > 0 ? `$${m.debit.toLocaleString('es-AR')}` : '-'}</td>
                                                <td className="px-6 py-5 text-right font-bold text-green-600">{m.credit > 0 ? `$${m.credit.toLocaleString('es-AR')}` : '-'}</td>
                                                <td className="px-6 py-5 text-right font-black text-slate-900">${m.balance.toLocaleString('es-AR')}</td>
                                                <td className="px-6 py-5 text-center">
                                                    <button onClick={() => setViewingVoucher(m)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm">
                                                        <Eye size={20}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
