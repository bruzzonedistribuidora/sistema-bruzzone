
import React, { useState } from 'react';
import { 
  Users, Truck, Search, Phone, Mail, 
  MessageSquare, ChevronRight, TrendingDown, 
  TrendingUp, ArrowRight, Download, Calendar,
  AlertCircle, CheckCircle2, DollarSign, ExternalLink,
  Receipt, FileText, ArrowLeft, Printer, Share2,
  Plus, CreditCard, Wallet, Landmark, X, Save,
  History, Eye
} from 'lucide-react';

type DocumentType = 'RECIBO' | 'ORDEN_PAGO';

const Balances: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers'>('clients');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showDocModal, setShowDocModal] = useState<{ show: boolean, type: DocumentType | null }>({ show: false, type: null });

  const clients = [
    { id: '1', name: 'Juan Perez', cuit: '20-33445566-7', balance: -45200, lastMovement: '2024-05-15', phone: '5491122334455', email: 'juan@gmail.com', daysOverdue: 12 },
    { id: '2', name: 'Constructora del Norte', cuit: '30-11223344-9', balance: -128000, lastMovement: '2024-05-10', phone: '5491166778899', email: 'info@cdn.com', daysOverdue: 25 },
    { id: '3', name: 'Ferretería San Carlos', cuit: '30-55667788-2', balance: -12500, lastMovement: '2024-05-20', phone: '5491144556677', email: 'ventas@sancarlos.com', daysOverdue: 2 },
    { id: '4', name: 'Ricardo Gomez', cuit: '20-11223311-4', balance: 5000, lastMovement: '2024-05-18', phone: '5491133221144', email: 'rg@mail.com', daysOverdue: 0 },
  ];

  const suppliers = [
    { id: 's1', name: 'Sinteplast S.A.', cuit: '30-50001234-5', balance: -150200, lastPurchase: '2024-05-02', dueDate: '2024-05-30', phone: '5491122334455' },
    { id: 's2', name: 'Ferrum S.A.', cuit: '30-11223344-2', balance: -45000, lastPurchase: '2024-05-15', dueDate: '2024-06-05', phone: '5491122334455' },
    { id: 's3', name: 'Bosch Argentina', cuit: '30-66778899-1', balance: 0, lastPurchase: '2024-04-20', dueDate: '-', phone: '5491122334455' },
  ];

  const mockComprobantes = [
    { id: 'FC-0001-4829', date: '2024-05-15', type: 'Factura A', amount: -45000, status: 'Pendiente' },
    { id: 'RE-0001-1203', date: '2024-05-10', type: 'Recibo', amount: 15000, status: 'Applied' },
    { id: 'FC-0001-4700', date: '2024-05-05', type: 'Factura B', amount: -15200, status: 'Vencido' },
    { id: 'NC-0001-0052', date: '2024-05-01', type: 'Nota de Crédito', amount: 2500, status: 'Applied' },
  ];

  // Fix: Added missing sendWhatsApp function
  const sendWhatsApp = (client: any) => {
    const message = encodeURIComponent(`Hola ${client.name}, te contactamos de FerroGest por tu cuenta corriente. Tu saldo deudor es de $${Math.abs(client.balance).toLocaleString()}. Por favor contáctanos para coordinar el pago. Gracias.`);
    window.open(`https://wa.me/${client.phone}?text=${message}`, '_blank');
  };

  const filteredClients = clients.filter(c => 
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.cuit.includes(search)) &&
    (activeTab === 'clients' ? c.balance < 0 : true)
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || s.cuit.includes(search)
  );

  const totalClientDebt = clients.filter(c => c.balance < 0).reduce((acc, c) => acc + Math.abs(c.balance), 0);
  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + Math.abs(s.balance), 0);

  const handleOpenRecibo = (comp: any) => {
    alert(`Visualizando Comprobante: ${comp.id}`);
  };

  const closeModals = () => {
    setSelectedClient(null);
    setSelectedSupplier(null);
  };

  // UI para Formulario de Recibo / Orden de Pago
  const renderDocumentForm = () => {
    const isRecibo = showDocModal.type === 'RECIBO';
    const target = isRecibo ? selectedClient : selectedSupplier;

    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          <div className={`p-8 border-b flex justify-between items-center text-white ${isRecibo ? 'bg-orange-600' : 'bg-slate-900'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{isRecibo ? 'Nuevo Recibo de Cobro' : 'Nueva Orden de Pago'}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{target.name} • {target.cuit}</p>
              </div>
            </div>
            <button onClick={() => setShowDocModal({ show: false, type: null })} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-10 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importe del Pago ($)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className={`w-full px-6 py-5 border-2 rounded-2xl focus:ring-2 outline-none font-black text-3xl text-center shadow-inner ${isRecibo ? 'border-orange-100 focus:ring-orange-500 text-orange-600' : 'border-slate-100 focus:ring-slate-500 text-slate-800'}`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha del Movimiento</label>
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-5 py-5 border border-slate-200 rounded-2xl font-bold bg-slate-50 outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Forma de {isRecibo ? 'Cobro' : 'Pago'}</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cash', label: 'Efectivo', icon: Wallet },
                  { id: 'transfer', label: 'Transferencia', icon: Landmark },
                  { id: 'check', label: 'Cheque', icon: FileText },
                ].map(method => (
                  <button key={method.id} className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:border-orange-500 hover:bg-orange-50 transition-all group">
                    <method.icon className="w-5 h-5 text-slate-400 group-hover:text-orange-600" />
                    <span className="text-[10px] font-black uppercase text-slate-600">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones / Referencia</label>
              <textarea 
                placeholder="Ej: Pago de factura FC-4829, entrega a cuenta..."
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm h-24 resize-none"
              />
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t flex gap-4">
            <button 
              onClick={() => setShowDocModal({ show: false, type: null })}
              className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                alert(`${isRecibo ? 'Recibo' : 'Orden de Pago'} generada con éxito.`);
                setShowDocModal({ show: false, type: null });
              }}
              className={`flex-[1.5] py-4 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 uppercase text-xs tracking-widest transition-all active:scale-95 ${isRecibo ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'}`}
            >
              Confirmar Operación <Save className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Vista Detallada (Común para Cliente o Proveedor)
  if (selectedClient || selectedSupplier) {
    const isClient = !!selectedClient;
    const item = isClient ? selectedClient : selectedSupplier;

    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
        {showDocModal.show && renderDocumentForm()}
        
        <header className="flex justify-between items-center">
          <button 
            onClick={closeModals}
            className="flex items-center gap-2 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" /> Volver al Listado
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDocModal({ show: true, type: isClient ? 'RECIBO' : 'ORDEN_PAGO' })}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95 ${isClient ? 'bg-orange-600 text-white shadow-orange-600/20' : 'bg-slate-900 text-white shadow-slate-900/20'}`}
            >
              <Plus className="w-4 h-4" /> {isClient ? 'Emitir Recibo' : 'Nueva Orden de Pago'}
            </button>
            <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
              <Printer className="w-5 h-5" /> Imprimir Resumen
            </button>
          </div>
        </header>

        <div className={`rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl ${isClient ? 'bg-slate-900' : 'bg-slate-800'}`}>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-3xl font-black ${isClient ? 'bg-orange-600' : 'bg-blue-600'}`}>
                {item.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">{item.name}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">{item.cuit}</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">
                {isClient ? 'Saldo Total Deudor' : 'Saldo Total Acreedor'}
              </p>
              <h3 className="text-5xl font-black text-white">${Math.abs(item.balance).toLocaleString()}</h3>
            </div>
          </div>
          <DollarSign className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <History className={`w-5 h-5 ${isClient ? 'text-orange-600' : 'text-blue-600'}`} /> Historial de Movimientos
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-5">Fecha</th>
                  <th className="px-8 py-5">Tipo / N° Comprobante</th>
                  <th className="px-8 py-5">Estado</th>
                  <th className="px-8 py-5 text-right">Importe</th>
                  <th className="px-8 py-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockComprobantes.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-8 py-6 text-sm font-bold text-slate-600">{new Date(comp.date).toLocaleDateString()}</td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-800 text-sm tracking-tight">{comp.id}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{comp.type}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        comp.status === 'Pendiente' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                        comp.status === 'Vencido' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {comp.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`text-lg font-black ${comp.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${Math.abs(comp.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenRecibo(comp)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 hover:bg-orange-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                        >
                          <Eye className="w-4 h-4" /> Ver {comp.type.includes('Recibo') || comp.type.includes('Pago') ? 'Detalle' : 'Comprobante'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Saldos y Cuentas</h1>
          <p className="text-slate-500">Control de deudores, acreedores y herramientas de cobranza.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-5 h-5" /> Exportar Listado
          </button>
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-lg transition-all">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Deuda de Clientes (En la calle)</p>
            <h3 className="text-3xl font-black text-slate-800">${totalClientDebt.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-lg transition-all">
          <div className="p-4 bg-red-100 text-red-600 rounded-2xl">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Deuda a Proveedores</p>
            <h3 className="text-3xl font-black text-slate-800">${totalSupplierDebt.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white flex items-center gap-6">
          <div className="p-4 bg-white/10 rounded-2xl">
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Saldo Neto Consolidado</p>
            <h3 className="text-3xl font-black text-orange-500">${(totalClientDebt - totalSupplierDebt).toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'clients' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" /> Deudores (Clientes)
          <span className="ml-1 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px]">{clients.filter(c => c.balance < 0).length}</span>
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'suppliers' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-5 h-5" /> Acreedores (Proveedores)
          <span className="ml-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{suppliers.filter(s => s.balance < 0).length}</span>
        </button>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Buscar ${activeTab === 'clients' ? 'cliente' : 'proveedor'}...`}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'clients' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-5">Cliente / CUIT</th>
                  <th className="px-8 py-5">Antigüedad Mora</th>
                  <th className="px-8 py-5">Último Movimiento</th>
                  <th className="px-8 py-5 text-right">Saldo Deudor</th>
                  <th className="px-8 py-5 text-center">Herramientas de Cobranza</th>
                  <th className="px-8 py-5 text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedClient(client)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 border border-slate-200 uppercase">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{client.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{client.cuit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {client.balance < 0 ? (
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            client.daysOverdue > 20 ? 'bg-red-100 text-red-600 border border-red-200' : 
                            client.daysOverdue > 10 ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                            'bg-blue-100 text-blue-600 border border-blue-200'
                          }`}>
                            {client.daysOverdue} Días en Mora
                          </span>
                        </div>
                      ) : (
                        <span className="text-green-500 font-bold text-xs uppercase">Al día</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                      {new Date(client.lastMovement).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`text-lg font-black ${client.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${Math.abs(client.balance).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); sendWhatsApp(client); }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl border border-green-200 hover:bg-green-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                        >
                          <MessageSquare className="w-4 h-4" /> WhatsApp
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <button className="p-2 text-slate-300 group-hover:text-orange-600 transition-all rounded-lg group-hover:bg-white shadow-sm">
                         <ChevronRight className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-5">Proveedor / CUIT</th>
                  <th className="px-8 py-5">Próximo Vencimiento</th>
                  <th className="px-8 py-5">Última Compra</th>
                  <th className="px-8 py-5 text-right">Saldo Acreedor</th>
                  <th className="px-8 py-5 text-center">Estado</th>
                  <th className="px-8 py-5 text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedSupplier(supplier)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold uppercase">
                          {supplier.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{supplier.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{supplier.cuit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-700">
                      {supplier.dueDate !== '-' ? (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Calendar className="w-4 h-4" /> {supplier.dueDate}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                      {new Date(supplier.lastPurchase).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`text-lg font-black ${supplier.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${Math.abs(supplier.balance).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        supplier.balance < 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                      }`}>
                        {supplier.balance < 0 ? 'Deuda Pendiente' : 'Al día'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <button className="p-2 text-slate-300 group-hover:text-blue-600 transition-all rounded-lg group-hover:bg-white shadow-sm">
                         <ChevronRight className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Balances;
