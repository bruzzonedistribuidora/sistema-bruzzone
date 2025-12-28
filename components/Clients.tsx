import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    User, Plus, Search, FileText, Globe, X, Copy, MessageCircle, Key, 
    ExternalLink, History, Eye, ChevronRight, ShoppingBag, Receipt, 
    Printer, Mail, DollarSign, ArrowDownLeft, CheckCircle, Wallet, 
    CreditCard, Package, Info, CheckSquare, Square, ArrowRight, Scroll, Smartphone, Landmark, UserPlus, Loader2, Zap, Save,
    ShieldCheck, Link, Share2, Edit, Trash2, FileSpreadsheet, LayoutTemplate, ChevronLeft, MapPin, Users, Send, Download, AlertTriangle, Building,
    Calendar, Shield, Star, Gift, Sparkles, RefreshCw, Pencil, ArrowLeft,
    UserCheck, Phone, QrCode, Banknote, FileCheck, FileUp, Columns, Table as TableIcon
} from 'lucide-react';
import { Client, CurrentAccountMovement, CompanyConfig } from '../types';
import { fetchCompanyByCuit } from '../services/geminiService';

const Clients: React.FC<ClientsProps> = ({ initialClientId, onOpenPortal }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para el Asistente de Importación
  const [isImportMappingOpen, setIsImportMappingOpen] = useState(false);
  const [importRows, setImportRows] = useState<string[][]>([]);
  const [importMapping, setImportMapping] = useState<Record<string, number>>({});

  const [clients, setClients] = useState<Client[]>(() => {
      const saved = localStorage.getItem('ferrecloud_clients');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Constructora del Norte', cuit: '30-12345678-9', phone: '11-4455-6677', address: 'Av. Libertador 1200', balance: 540000, limit: 1000000, points: 12500, portalEnabled: true, portalHash: 'C-D-N-2024' },
        { id: '2', name: 'Juan Perez', cuit: '20-11223344-5', phone: '11-2233-4455', address: 'Calle Falsa 123', balance: 15000, limit: 50000, points: 450, portalEnabled: false }
      ];
  });

  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : { 
        loyalty: { enabled: true, valuePerPoint: 2, minPointsToRedeem: 500 },
        paymentMethods: ['EFECTIVO', 'MERCADO_PAGO', 'TRANSFERENCIA', 'CHEQUE', 'E-CHEQ']
    };
  }, []);

  const [movements, setMovements] = useState<CurrentAccountMovement[]>(() => {
      const saved = localStorage.getItem('ferrecloud_movements');
      return saved ? JSON.parse(saved) : [];
  });

  const [clientForm, setClientForm] = useState<Partial<Client>>({
      id: '', name: '', cuit: '', phone: '', balance: 0, limit: 100000, points: 0, address: '', email: '', portalEnabled: true
  });

  const [receiptForm, setReceiptForm] = useState({
      amount: 0,
      method: companyConfig.paymentMethods?.[0] || 'EFECTIVO',
      notes: ''
  });

  useEffect(() => {
      if (initialClientId) {
          const c = clients.find(cl => cl.id === initialClientId);
          if (c) {
              setSelectedClient(c);
              setIsHistoryOpen(true);
          }
      }
  }, [initialClientId, clients]);

  useEffect(() => { 
      localStorage.setItem('ferrecloud_clients', JSON.stringify(clients)); 
  }, [clients]);

  useEffect(() => {
      localStorage.setItem('ferrecloud_movements', JSON.stringify(movements));
  }, [movements]);

  const handleStartImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
        
        if (lines.length > 0) {
            // Detección inteligente de separador (coma o punto y coma)
            const firstLine = lines[0];
            const commas = (firstLine.match(/,/g) || []).length;
            const semicolons = (firstLine.match(/;/g) || []).length;
            const separator = semicolons > commas ? ';' : ',';

            const rows = lines.map(line => line.split(separator).map(cell => cell.trim()));
            
            setImportRows(rows);
            setImportMapping({}); // Limpiar mapeo anterior
            setIsImportMappingOpen(true);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = () => {
      if (importMapping.name === undefined || importMapping.cuit === undefined) {
          alert("Debes mapear al menos el Nombre y el CUIT.");
          return;
      }

      const currentCuits = new Set(clients.map(c => c.cuit.replace(/[^0-9]/g, '')));
      const newClients: Client[] = [];

      // Empezamos desde la fila 0 (asumiendo que si hay cabecera el usuario la ignorará visualmente o la procesará)
      // Idealmente, si la primera fila es cabecera, podríamos saltarla, pero el usuario decide el mapeo.
      importRows.forEach((row, index) => {
          const name = row[importMapping.name];
          const cuit = row[importMapping.cuit];
          
          // Saltar filas vacías o que no tengan los datos mínimos requeridos en las columnas mapeadas
          if (!name || !cuit || name.toLowerCase() === 'nombre' || name.toLowerCase() === 'razon social') return;

          const cleanCuit = cuit.replace(/[^0-9]/g, '');
          if (!currentCuits.has(cleanCuit)) {
              newClients.push({
                  id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                  name: name.toUpperCase(),
                  cuit: cuit,
                  phone: importMapping.phone !== undefined ? row[importMapping.phone] : '',
                  address: importMapping.address !== undefined ? row[importMapping.address] : '',
                  email: importMapping.email !== undefined ? row[importMapping.email] : '',
                  limit: importMapping.limit !== undefined ? (parseFloat(row[importMapping.limit].replace(',', '.')) || 100000) : 100000,
                  balance: 0,
                  points: 0,
                  portalEnabled: true,
                  portalHash: `p-${Math.random().toString(36).substr(2, 6)}`
              });
              currentCuits.add(cleanCuit);
          }
      });

      if (newClients.length === 0) {
          alert("No se encontraron clientes nuevos para importar. Verifique si los CUIT ya existen.");
          return;
      }

      setClients([...newClients, ...clients]);
      setIsImportMappingOpen(false);
      setImportRows([]);
      setImportMapping({});
      alert(`Importación finalizada. Se procesaron ${newClients.length} clientes nuevos.`);
  };

  const handleSearchCuit = async () => {
      if (!clientForm.cuit || clientForm.cuit.length < 8) return;
      setIsSearchingCuit(true);
      try {
          const data = await fetchCompanyByCuit(clientForm.cuit);
          if (data) setClientForm(prev => ({ ...prev, name: data.name || data.razonSocial, address: data.address || data.domicilio || '' }));
      } catch (err) { console.error(err); } finally { setIsSearchingCuit(false); }
  };

  const handleSaveClient = () => {
      if (!clientForm.name || !clientForm.cuit) {
          alert("Nombre y CUIT son obligatorios");
          return;
      }
      setClients(prev => {
          if (isEditing && clientForm.id) {
              return prev.map(c => c.id === clientForm.id ? { ...c, ...clientForm } as Client : c);
          } else {
              return [{...clientForm as Client, id: Date.now().toString(), balance: 0, points: 0, portalHash: `p-${Math.random().toString(36).substr(2, 5)}`}, ...prev];
          }
      });
      setIsNewClientModalOpen(false);
  };

  const handleRegisterReceipt = () => {
    if (!selectedClient || receiptForm.amount <= 0) {
        alert("Ingrese un monto válido para el recibo.");
        return;
    }

    const newBalance = selectedClient.balance - receiptForm.amount;
    const newMovement: CurrentAccountMovement = {
        id: `REC-${Date.now().toString().slice(-6)}`,
        clientId: selectedClient.id,
        date: new Date().toLocaleDateString(),
        voucherType: 'RECIBO DE PAGO',
        description: `Cobranza vía ${receiptForm.method}. ${receiptForm.notes}`,
        debit: 0,
        credit: receiptForm.amount,
        balance: newBalance
    };

    setMovements([newMovement, ...movements]);
    setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, balance: newBalance } : c));
    setSelectedClient({ ...selectedClient, balance: newBalance });
    setIsReceiptModalOpen(false);
    setReceiptForm({ amount: 0, method: companyConfig.paymentMethods?.[0] || 'EFECTIVO', notes: '' });
    alert("Recibo registrado con éxito. El saldo del cliente ha sido actualizado.");
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cuit.includes(searchTerm));
  }, [clients, searchTerm]);

  const selectedMovements = useMemo(() => {
      if (!selectedClient) return [];
      return movements.filter(m => m.clientId === selectedClient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, selectedClient]);

  // Lista de campos disponibles para mapear
  const CLIENT_FIELDS = [
      { key: 'name', label: 'Nombre / Razón Social', required: true },
      { key: 'cuit', label: 'CUIT / DNI', required: true },
      { key: 'phone', label: 'Teléfono', required: false },
      { key: 'address', label: 'Dirección', required: false },
      { key: 'email', label: 'Email', required: false },
      { key: 'limit', label: 'Límite de Crédito', required: false }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-fade-in bg-slate-50 overflow-hidden">
        <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleStartImport} />
        
        {/* CABECERA PRINCIPAL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm gap-4 shrink-0">
            <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                    <Users className="text-indigo-600"/> Gestión de Clientes
                </h2>
                <div className="relative mt-4 w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o CUIT..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-500 transition-all uppercase" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-indigo-50 text-indigo-600 px-6 py-3.5 rounded-2xl flex items-center gap-3 font-black border border-indigo-100 hover:bg-indigo-100 transition-all uppercase text-xs tracking-widest active:scale-95">
                    <FileUp size={20} /> Importación Inteligente
                </button>
                <button 
                    onClick={() => { setIsEditing(false); setClientForm({name: '', cuit: '', phone: '', address: '', limit: 100000, points: 0, portalEnabled: true}); setIsNewClientModalOpen(true); }} 
                    className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest active:scale-95">
                    <Plus size={20} /> Registrar Nuevo
                </button>
            </div>
        </div>

        {/* TABLA DE CLIENTES */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-[10px] text-slate-300 uppercase font-black tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="px-8 py-5">Razón Social / CUIT</th>
                            <th className="px-8 py-5 text-right">Saldo Actual</th>
                            <th className="px-8 py-5 text-right">Límite</th>
                            <th className="px-8 py-5 text-center">Acciones de Cuenta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredClients.map(client => (
                            <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 uppercase text-lg">{client.name.charAt(0)}</div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1.5">{client.name}</div>
                                            <div className="text-[10px] text-gray-400 font-mono font-bold tracking-tighter">{client.cuit}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className={`px-8 py-5 text-right font-black text-lg tracking-tighter ${client.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ${client.balance.toLocaleString('es-AR')}
                                </td>
                                <td className="px-8 py-5 text-right font-black text-slate-400 text-xs">
                                    ${client.limit.toLocaleString('es-AR')}
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => { setSelectedClient(client); setIsReceiptModalOpen(true); }} 
                                            className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-90"
                                            title="Cobrar Ahora (Recibo)"
                                        >
                                            <Banknote size={18}/>
                                        </button>
                                        <button 
                                            onClick={() => { setSelectedClient(client); setIsHistoryOpen(true); }} 
                                            className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-md active:scale-90"
                                            title="Ver Cuenta Corriente"
                                        >
                                            <History size={18}/>
                                        </button>
                                        <button 
                                            onClick={() => { setIsEditing(true); setClientForm(client); setIsNewClientModalOpen(true); }} 
                                            className="p-3 bg-slate-100 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                                            title="Editar Ficha"
                                        >
                                            <Pencil size={18}/>
                                        </button>
                                        <button 
                                            onClick={() => onOpenPortal?.(client)}
                                            className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all active:scale-90"
                                            title="Simular Portal Cliente"
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
        </div>

        {/* MODAL: ASISTENTE DE IMPORTACIÓN (MAPEO) */}
        {isImportMappingOpen && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl shadow-lg"><Columns size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Mapeo de Importación</h3>
                                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Asigne las columnas de su archivo a los campos del sistema</p>
                            </div>
                        </div>
                        <button onClick={() => setIsImportMappingOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/30">
                        {importRows[0]?.length === 1 && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800">
                                <AlertTriangle size={20} className="shrink-0" />
                                <p className="text-xs font-bold">Solo se detectó una columna. Asegúrese de que el archivo CSV esté separado por comas o puntos y comas.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {CLIENT_FIELDS.map(field => (
                                <div key={field.key} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${field.required ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            {field.label} {field.required && '*'}
                                        </label>
                                        {importMapping[field.key] !== undefined && <CheckCircle size={14} className="text-green-500" />}
                                    </div>
                                    <select 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={importMapping[field.key] ?? ""}
                                        onChange={e => {
                                            const val = e.target.value === "" ? undefined : parseInt(e.target.value);
                                            setImportMapping({ ...importMapping, [field.key]: val as any });
                                        }}
                                    >
                                        <option value="">-- No importar --</option>
                                        {importRows[0]?.map((col, idx) => (
                                            <option key={idx} value={idx}>Columna {idx + 1} ({col.slice(0, 20)}...)</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* PREVISUALIZACIÓN DE DATOS */}
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
                                <TableIcon size={14} className="text-indigo-400"/>
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Vista previa del archivo (Primeras 5 filas)</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            {importRows[0]?.map((_, idx) => (
                                                <th key={idx} className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase text-center border-r last:border-0">Col {idx + 1}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-[10px]">
                                        {importRows.slice(0, 5).map((row, rIdx) => (
                                            <tr key={rIdx}>
                                                {row.map((cell, cIdx) => (
                                                    <td key={cIdx} className="px-4 py-2 text-slate-600 font-medium truncate max-w-[150px] border-r last:border-0">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
                        <button onClick={() => setIsImportMappingOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                        <button 
                            onClick={confirmImport}
                            className="bg-indigo-600 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center gap-3"
                        >
                            <Save size={18}/> Procesar e Importar Clientes
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ... (rest of the modals like history, receipts, etc stay the same) */}
        {isHistoryOpen && selectedClient && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setIsHistoryOpen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><ChevronLeft size={24}/></button>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{selectedClient.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Resumen de Cuenta Corriente Histórico</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-10">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Saldo Adeudado</p>
                                <h4 className="text-4xl font-black tracking-tighter">${selectedClient.balance.toLocaleString('es-AR')}</h4>
                            </div>
                            <button 
                                onClick={() => setIsReceiptModalOpen(true)}
                                className="bg-green-600 text-white px-8 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-green-500/20 hover:bg-green-700 transition-all active:scale-95"
                            >
                                <Receipt size={24}/> Registrar Cobro
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
                        <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                                    <tr>
                                        <th className="px-8 py-4">Fecha</th>
                                        <th className="px-8 py-4">Comprobante</th>
                                        <th className="px-8 py-4 text-right">Débito (+)</th>
                                        <th className="px-8 py-4 text-right">Crédito (-)</th>
                                        <th className="px-8 py-4 text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-[11px]">
                                    {selectedMovements.length === 0 ? (
                                        <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest">Sin movimientos registrados</td></tr>
                                    ) : selectedMovements.map(m => (
                                        <tr key={m.id} className="hover:bg-indigo-50/10 transition-colors group">
                                            <td className="px-8 py-5 font-bold text-gray-400">{m.date}</td>
                                            <td className="px-8 py-5 font-black text-slate-700 uppercase">{m.voucherType} <span className="block text-[8px] text-gray-400 font-normal">{m.description}</span></td>
                                            <td className="px-8 py-5 text-right font-black text-red-500">{m.debit > 0 ? `$${m.debit.toLocaleString('es-AR')}` : '-'}</td>
                                            <td className="px-8 py-5 text-right font-black text-green-600">{m.credit > 0 ? `$${m.credit.toLocaleString('es-AR')}` : '-'}</td>
                                            <td className="px-8 py-5 text-right font-black text-slate-900 bg-slate-50/50 group-hover:bg-indigo-50 transition-colors">${m.balance.toLocaleString('es-AR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="p-8 border-t border-gray-100 flex justify-between items-center shrink-0 bg-white">
                        <button className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest"><Download size={16}/> Descargar Resumen (PDF)</button>
                        <button onClick={() => setIsHistoryOpen(false)} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all">Cerrar Historial</button>
                    </div>
                </div>
            </div>
        )}

        {isReceiptModalOpen && selectedClient && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                    <div className="p-8 bg-green-600 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl"><Banknote size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Emisión de Recibo</h3>
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">Imputación a Cuenta Corriente</p>
                            </div>
                        </div>
                        <button onClick={() => setIsReceiptModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                    </div>
                    <div className="p-10 space-y-8 bg-slate-50/50">
                        <div className="text-center mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                            <h4 className="text-xl font-black text-slate-800 uppercase">{selectedClient.name}</h4>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Importe Recibido ($)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-6 bg-white border-2 border-transparent rounded-[2rem] focus:border-green-600 outline-none font-black text-5xl text-center text-green-700 shadow-sm" 
                                    value={receiptForm.amount || ''} 
                                    onChange={e => setReceiptForm({...receiptForm, amount: parseFloat(e.target.value) || 0})}
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Modalidad de Pago</label>
                                    <select 
                                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-green-500"
                                        value={receiptForm.method}
                                        onChange={e => setReceiptForm({...receiptForm, method: e.target.value})}
                                    >
                                        {companyConfig.paymentMethods?.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Notas / Concepto</label>
                                    <textarea 
                                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-500 h-24 resize-none uppercase text-xs"
                                        placeholder="Ej: Pago total factura pendiente..."
                                        value={receiptForm.notes}
                                        onChange={e => setReceiptForm({...receiptForm, notes: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleRegisterReceipt}
                            className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            <FileCheck size={24}/> Generar Comprobante de Cobro
                        </button>
                    </div>
                </div>
            </div>
        )}

        {isNewClientModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20"><UserCheck size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{isEditing ? 'Editar Ficha Cliente' : 'Alta de Nuevo Cliente'}</h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Configuración Comercial y Fiscal</p>
                            </div>
                        </div>
                        <button onClick={() => setIsNewClientModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/30 custom-scrollbar">
                        {/* SECCIÓN 1: IDENTIFICACIÓN */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2 ml-1">1. Identidad Fiscal</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">CUIT / DNI</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 p-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-black text-slate-800 tracking-widest transition-all" 
                                            placeholder="30-..."
                                            value={clientForm.cuit} 
                                            onChange={e => setClientForm({...clientForm, cuit: e.target.value})} 
                                        />
                                        <button 
                                            onClick={handleSearchCuit} 
                                            className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                            disabled={isSearchingCuit}
                                        >
                                            {isSearchingCuit ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20}/>}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Razón Social</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-black text-slate-800 uppercase transition-all" 
                                        placeholder="Nombre del cliente..."
                                        value={clientForm.name} 
                                        onChange={e => setClientForm({...clientForm, name: e.target.value.toUpperCase()})} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: CONTACTO */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2 ml-1">2. Localización y Contacto</h4>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Dirección Completa</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all uppercase" 
                                        placeholder="Calle, Número, Localidad..."
                                        value={clientForm.address} 
                                        onChange={e => setClientForm({...clientForm, address: e.target.value})} 
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Teléfono de Contacto</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                            <input 
                                                type="text" 
                                                className="w-full pl-12 p-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all" 
                                                placeholder="+54 9..."
                                                value={clientForm.phone} 
                                                onChange={e => setClientForm({...clientForm, phone: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Correo Electrónico</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                            <input 
                                                type="email" 
                                                className="w-full pl-12 p-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all" 
                                                placeholder="email@servidor.com"
                                                value={clientForm.email} 
                                                onChange={e => setClientForm({...clientForm, email: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: CUENTA CORRIENTE */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2 ml-1">3. Límites y Crédito</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Límite de Cupo ($)</label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-600 transition-colors" size={20}/>
                                        <input 
                                            type="number" 
                                            className="w-full pl-12 p-4 bg-white border-2 border-transparent focus:border-green-600 rounded-2xl outline-none font-black text-2xl text-slate-800 transition-all shadow-sm" 
                                            value={clientForm.limit} 
                                            onChange={e => setClientForm({...clientForm, limit: parseFloat(e.target.value) || 0})} 
                                        />
                                    </div>
                                </div>
                                <div className="p-6 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div onClick={() => setClientForm({...clientForm, portalEnabled: !clientForm.portalEnabled})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${clientForm.portalEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${clientForm.portalEnabled ? 'right-1' : 'left-1'}`}></div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Portal QR Activo</p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase">Autogestión por DNI</p>
                                        </div>
                                    </div>
                                    <QrCode size={24} className="text-slate-200"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white border-t border-gray-100 flex justify-end gap-4 shrink-0">
                        <button onClick={() => setIsNewClientModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
                        <button onClick={handleSaveClient} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3">
                            <Save size={18}/> {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

interface ClientsProps {
    initialClientId?: string;
    onOpenPortal?: (client: Client) => void;
}

export default Clients;
