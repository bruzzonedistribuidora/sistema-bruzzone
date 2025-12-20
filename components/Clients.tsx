import React, { useState, useEffect } from 'react';
import { User, Plus, Search, Phone, MapPin, FileText, ArrowLeft, ArrowDownLeft, CheckCircle, Wallet, X, DollarSign, Printer, Download, Upload, FileSpreadsheet, Globe, Save, RefreshCw, Key, Mail, Lock, ExternalLink, MessageCircle, Info, Copy, Share2 } from 'lucide-react';
import { Client, CurrentAccountMovement, ViewState } from '../types';

interface ClientsProps {
    onOpenPortal?: (client: Client) => void;
}

const Clients: React.FC<ClientsProps> = ({ onOpenPortal }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'ACCOUNT'>('LIST');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Portal Management Modal
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [portalClient, setPortalClient] = useState<Client | null>(null);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);

  // Client Form Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientFormData, setClientFormData] = useState<Client>({
      id: '', name: '', cuit: '', phone: '', address: '', balance: 0, limit: 0, portalEnabled: false, email: ''
  });

  const defaultClients: Client[] = [
    { id: '1', name: 'Constructora del Norte', cuit: '30-12345678-9', phone: '11-4455-6677', address: 'Av. Libertador 1200', balance: 540000, limit: 1000000, portalEnabled: true, email: 'admin@cdnorte.com', portalHash: 'C-D-N-2024' },
    { id: '2', name: 'Juan Perez', cuit: '20-11223344-5', phone: '11-9988-7766', address: 'Calle 123, Local 4', balance: 0, limit: 200000, portalEnabled: false, email: 'juan@gmail.com' },
    { id: '3', name: 'Estudio Arquitectura López', cuit: '30-99887766-1', phone: '11-2233-4455', address: 'San Martin 400', balance: 12500, limit: 500000, portalEnabled: true, email: 'arq.lopez@estudio.com', portalHash: 'ARQ-L-2024' },
  ];

  const [clients, setClients] = useState<Client[]>(() => {
      const saved = localStorage.getItem('ferrecloud_clients');
      return saved ? JSON.parse(saved) : defaultClients;
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_clients', JSON.stringify(clients));
  }, [clients]);

  // --- PORTAL MANAGEMENT HANDLERS ---
  const handleOpenPortalManager = (client: Client) => {
      setPortalClient(client);
      setIsPortalModalOpen(true);
  };

  const handleTogglePortal = () => {
      if (!portalClient) return;
      const newStatus = !portalClient.portalEnabled;
      const newHash = newStatus && !portalClient.portalHash ? `portal-${Math.random().toString(36).substring(7)}` : portalClient.portalHash;
      const updatedClient = { ...portalClient, portalEnabled: newStatus, portalHash: newHash };
      setPortalClient(updatedClient);
      setClients(prev => prev.map(c => c.id === portalClient.id ? updatedClient : c));
  };

  const copyPortalLink = () => {
      if (!portalClient?.portalHash) return;
      const link = `${window.location.origin}/portal/${portalClient.portalHash}`;
      navigator.clipboard.writeText(link);
      setCopyLinkSuccess(true);
      setTimeout(() => setCopyLinkSuccess(false), 2000);
  };

  const shareByWhatsApp = () => {
      if (!portalClient?.portalHash) return;
      const link = `${window.location.origin}/portal/${portalClient.portalHash}`;
      const message = `Hola ${portalClient.name}! Te enviamos el acceso a tu portal de cliente de Ferretería Bruzzone para que puedas ver tus facturas y realizar pagos: ${link}`;
      window.open(`https://wa.me/${portalClient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleOpenAccount = (client: Client) => {
      setSelectedClient(client);
      setViewMode('ACCOUNT');
  };

  const handleOpenClientModal = (client?: Client) => {
      if (client) setClientFormData(client);
      else setClientFormData({ id: Date.now().toString(), name: '', cuit: '', phone: '', address: '', balance: 0, limit: 0, email: '' });
      setIsClientModalOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
       
      {viewMode === 'LIST' && (
          <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Directorio de Clientes</h2>
                    <p className="text-gray-500 text-sm">Gestiona cuentas corrientes y accesos al portal.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleOpenClientModal()} className="bg-ferre-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm text-sm font-medium">
                        <Plus size={16} /> Nuevo Cliente
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4 text-center">Portal</th>
                                <th className="px-6 py-4 text-right">Saldo Deudor</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clients.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                                                {client.name.substring(0,2)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{client.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{client.cuit}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2"><MessageCircle size={14} className="text-green-500"/> {client.phone || 'Sin tel'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {client.portalEnabled ? (
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Activo</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Inactivo</span>
                                        )}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${client.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ${client.balance.toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleOpenAccount(client)} className="text-gray-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50" title="Ver Cuenta">
                                                <FileText size={18}/>
                                            </button>
                                            <button onClick={() => handleOpenPortalManager(client)} className={`p-2 rounded transition-colors ${client.portalEnabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 hover:text-green-600'}`} title="Gestionar Portal">
                                                <Key size={18}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </>
      )}

      {/* PORTAL MANAGER MODAL */}
      {isPortalModalOpen && portalClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-gray-200 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2"><Globe size={18}/> Portal del Cliente</h3>
                      <button onClick={() => setIsPortalModalOpen(false)}><X/></button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border text-xl font-bold text-slate-400">
                                {portalClient.name.substring(0,1)}
                          </div>
                          <div>
                              <p className="font-bold text-gray-800">{portalClient.name}</p>
                              <p className="text-xs text-gray-500">{portalClient.email || 'Sin correo asignado'}</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-gray-700">Estado del Portal</span>
                              <button 
                                onClick={handleTogglePortal}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${portalClient.portalEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {portalClient.portalEnabled ? 'HABILITADO' : 'HABILITAR'}
                              </button>
                          </div>

                          {portalClient.portalEnabled && (
                              <div className="space-y-4 animate-fade-in">
                                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Link de acceso seguro</p>
                                      <div className="flex items-center gap-2">
                                          <input 
                                            readOnly 
                                            className="flex-1 bg-white border border-gray-200 rounded p-1.5 text-xs font-mono text-gray-500 outline-none"
                                            value={`${window.location.origin}/portal/${portalClient.portalHash}`}
                                          />
                                          <button onClick={copyPortalLink} className={`p-2 rounded border shadow-sm transition-colors ${copyLinkSuccess ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-400 hover:text-blue-600'}`}>
                                            <Copy size={16}/>
                                          </button>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                      <button 
                                        onClick={shareByWhatsApp}
                                        className="bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-md">
                                          <MessageCircle size={18}/> WhatsApp
                                      </button>
                                      <button 
                                        onClick={() => onOpenPortal?.(portalClient)}
                                        className="bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 shadow-md">
                                          <ExternalLink size={18}/> Ver Portal
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Account view logic omitted for space, keep as per provided code... */}
    </div>
  );
};

export default Clients;