import React, { useState } from 'react';
import { Search, Plus, Phone, Mail, FileText, CreditCard, ExternalLink, ChevronRight, X, Trash2, UserPlus, Save, LayoutGrid, DollarSign, AlertCircle, Loader2, Gift, Star } from 'lucide-react';
import { Client } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { fetchArcaDataByCuit } from '../lib/arcaService'; // Import the ARCA service

interface ClientsProps {
  onNavigate?: (tab: string) => void;
}

const Clients: React.FC<ClientsProps> = ({ onNavigate }) => {
  const { clients, priceLists, addClient, updateClient, deleteClient } = useFirebase(); // Use Firebase context
  const [showModal, setShowModal] = useState(false);
  
  // Changed cuitSearch to be part of newClientData for direct form binding
  const [activeClientModalTab, setActiveClientModalTab] = useState('general');
  
  const [activeClient, setActiveClient] = useState<Client | null>(null); // State for client being edited/viewed
  const [newClientData, setNewClientData] = useState<Partial<Client>>({ // State for new/edited client form
    name: '',
    cuit: '',
    whatsapp: '',
    email: '',
    specialDiscount: 0,
    priceListId: '',
    authorizedPersons: [],
    balance: 0,
    accumulatedPoints: 0, // New: Default to 0
    pointsEnabled: false, // New: Default to false
  });
  const [newAuthorizedPerson, setNewAuthorizedPerson] = useState('');
  const [isCuitLoading, setIsCuitLoading] = useState(false);

  // Set default price list to base or first available when priceLists loads
  React.useEffect(() => {
    if (priceLists.length > 0 && !newClientData.priceListId) {
      setNewClientData(prev => ({
        ...prev,
        priceListId: priceLists.find(pl => pl.isBase)?.id || priceLists[0].id || ''
      }));
    }
  }, [priceLists, newClientData.priceListId]);


  const handleCuitLookup = async () => {
    if (!newClientData.cuit) {
      alert('Por favor, ingrese un CUIT/DNI para buscar.');
      return;
    }
    setIsCuitLoading(true);
    try {
      const arcaData = await fetchArcaDataByCuit(newClientData.cuit, 'client');
      setNewClientData(prev => ({
        ...prev,
        name: arcaData.name,
        email: arcaData.email,
        whatsapp: arcaData.phone, // Assuming phone can be used as whatsapp
        priceListId: priceLists.find(pl => pl.isBase)?.id || priceLists[0]?.id || '',
      }));
      alert('Datos de ARCA encontrados y cargados.');
    } catch (error: any) {
      alert(`Error al buscar CUIT en ARCA: ${error.message}`);
      console.error("ARCA CUIT Lookup Error:", error);
    } finally {
      setIsCuitLoading(false);
    }
  };

  const handleAddAuthorizedPerson = () => {
    if (newAuthorizedPerson.trim()) {
      setNewClientData(prev => ({
        ...prev,
        authorizedPersons: [...(prev.authorizedPersons || []), newAuthorizedPerson.trim()]
      }));
      setNewAuthorizedPerson('');
    }
  };

  const handleRemoveAuthorizedPerson = (personToRemove: string) => {
    setNewClientData(prev => ({
      ...prev,
      authorizedPersons: (prev.authorizedPersons || []).filter(person => person !== personToRemove)
    }));
  };

  const handleSaveClient = async () => {
    if (!newClientData.name || !newClientData.cuit) {
      alert("El nombre y CUIT son obligatorios.");
      return;
    }
    
    try {
      if (activeClient?.id) {
        await updateClient(activeClient.id, newClientData);
        alert('Cliente actualizado con éxito!');
      } else {
        // Fix: Added type assertion to ensure newClientData has required properties 'name' and 'cuit'
        // before passing to addClient, as validated by the check above.
        await addClient(newClientData as Client);
        alert('Cliente creado con éxito!');
      }
      setShowModal(false);
      setActiveClient(null);
      setNewClientData({ // Reset form
        name: '', cuit: '', whatsapp: '', email: '', specialDiscount: 0, priceListId: priceLists.find(pl => pl.isBase)?.id || priceLists[0]?.id || '', authorizedPersons: [], balance: 0,
        accumulatedPoints: 0, // Reset new field
        pointsEnabled: false, // Reset new field
      });
      setNewAuthorizedPerson('');
    } catch (error) {
      alert('Error al guardar el cliente.');
      console.error(error);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este cliente? Esta acción es irreversible.')) {
      try {
        await deleteClient(id);
        alert('Cliente eliminado con éxito.');
      } catch (error) {
        alert('Error al eliminar el cliente.');
        console.error(error);
      }
    }
  };

  const openClientModal = (client: Client | null) => {
    setActiveClient(client);
    if (client) {
      setNewClientData(client);
    } else {
      setNewClientData({
        name: '', 
        cuit: '', 
        whatsapp: '', 
        email: '', 
        specialDiscount: 0, 
        priceListId: priceLists.find(pl => pl.isBase)?.id || priceLists[0]?.id || '', 
        authorizedPersons: [], 
        balance: 0,
        accumulatedPoints: 0, // Set default for new client
        pointsEnabled: false, // Set default for new client
      });
    }
    setNewAuthorizedPerson('');
    setActiveClientModalTab('general');
    setShowModal(true);
  };

  const goToBalances = () => {
    if (onNavigate) {
      setShowModal(false); // Close the modal before navigating
      onNavigate('balances');
      // Ideally, you'd also pass the client ID to 'balances' to filter the view.
      // e.g., onNavigate('balances', { clientId: activeClient?.id });
    }
  };

  const getPriceListName = (priceListId: string | undefined) => {
    return priceListId ? (priceLists.find(pl => pl.id === priceListId)?.name || 'N/A') : 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Clientes</h1>
          <p className="text-slate-500">Administra tu base de clientes y sus cuentas corrientes.</p>
        </div>
        <button 
          onClick={() => openClientModal(null)}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
        >
          <Plus className="w-5 h-5" /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, CUIT o email..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-gray-50 transition-all">Filtros</button>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">Cliente / CUIT</th>
              <th className="px-8 py-5">Contacto</th>
              <th className="px-8 py-5">Cuenta Corriente</th>
              <th className="px-8 py-5">Puntos Acumulados</th> {/* New Column */}
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-6">
                  <p className="font-bold text-slate-800">{client.name}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{client.cuit}</p>
                </td>
                <td className="px-8 py-6 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <Mail className="w-4 h-4 text-slate-300" /> {client.email}
                  </div>
                  {client.whatsapp && (
                    <button className="flex items-center gap-2 text-[10px] font-black text-green-600 uppercase tracking-widest hover:text-green-700">
                      <Phone className="w-4 h-4" /> Enviar WhatsApp
                    </button>
                  )}
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${client.balance < 0 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                    {client.balance < 0 ? `DEBE $${Math.abs(client.balance).toLocaleString()}` : `SALDO $${client.balance.toLocaleString()}`}
                  </span>
                </td>
                <td className="px-8 py-6"> {/* New: Puntos Acumulados Column */}
                  {client.pointsEnabled ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-orange-600">{client.accumulatedPoints || 0}</span>
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[8px] font-black uppercase tracking-widest">Activo</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                       <span className="text-lg font-black text-slate-300">{client.accumulatedPoints || 0}</span>
                       <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[8px] font-black uppercase tracking-widest">Inactivo</span>
                    </div>
                  )}
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={goToBalances}
                      className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm border border-orange-100"
                      title="Ir a Cuenta Corriente"
                    >
                      <CreditCard className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => openClientModal(client)}
                      className="p-2.5 text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                      title="Editar Cliente"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Eliminar Cliente"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h2 className="text-2xl font-black uppercase tracking-tight">{activeClient ? 'Editar Cliente' : 'Alta de Cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex h-[550px]">
              <div className="w-1/4 bg-slate-50 border-r border-slate-100 p-6 space-y-2">
                {[
                  { id: 'general', label: 'Datos Generales' }, 
                  { id: 'prices', label: 'Lista de Precios' }, 
                  { id: 'authorized', label: 'Autorizados' }, 
                  { id: 'account', label: 'Cuenta Corriente' },
                  { id: 'loyalty', label: 'Fidelización', icon: Gift } // New Tab
                ].map((m) => (
                  <button 
                    key={m.id} 
                    onClick={() => setActiveClientModalTab(m.id)}
                    className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeClientModalTab === m.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                  >
                    {m.icon && <m.icon className="w-4 h-4 inline-block mr-2" />} {/* Render icon if available */}
                    {m.label}
                  </button>
                ))}
              </div>
              
              <div className="flex-1 p-10 overflow-y-auto space-y-8">
                {activeClientModalTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CUIT / DNI</label>
                        <div className="flex gap-2">
                          <input 
                            value={newClientData.cuit || ''} 
                            onChange={e => setNewClientData({...newClientData, cuit: e.target.value})}
                            placeholder="20-XXXXXXXX-X" 
                            className="flex-1 px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                          />
                          <button 
                            onClick={handleCuitLookup} 
                            disabled={isCuitLoading}
                            className="bg-slate-800 text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                          >
                            {isCuitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razón Social / Nombre</label>
                        <input 
                          value={newClientData.name || ''}
                          onChange={e => setNewClientData({...newClientData, name: e.target.value})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Principal</label>
                        <input 
                          type="email" 
                          value={newClientData.email || ''}
                          onChange={e => setNewClientData({...newClientData, email: e.target.value})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contacto</label>
                        <input 
                          value={newClientData.whatsapp || ''}
                          onChange={e => setNewClientData({...newClientData, whatsapp: e.target.value})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descuento Especial (%)</label>
                        <input 
                          type="number" 
                          value={newClientData.specialDiscount || 0}
                          onChange={e => setNewClientData({...newClientData, specialDiscount: Number(e.target.value)})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-600" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lista de Precios</label>
                        <select 
                          value={newClientData.priceListId || ''}
                          onChange={e => setNewClientData({...newClientData, priceListId: e.target.value})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold bg-white"
                        >
                          {priceLists.map(pl => (
                            <option key={pl.id} value={pl.id}>{pl.name}</option>
                          ))}
                          {priceLists.length === 0 && <option value="" disabled>Cargando listas...</option>}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeClientModalTab === 'prices' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-orange-600" /> Lista de Precios Asignada
                    </h3>
                    <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100 flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <LayoutGrid className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-orange-900">{getPriceListName(newClientData.priceListId)}</p>
                        <p className="text-xs text-orange-700 font-medium">Descuento Especial: <span className="font-bold">{newClientData.specialDiscount || 0}%</span></p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-4 border-t">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cambiar Lista de Precios</label>
                      <select 
                        value={newClientData.priceListId || ''}
                        onChange={e => setNewClientData({...newClientData, priceListId: e.target.value})}
                        className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold bg-white"
                      >
                        {priceLists.map(pl => (
                          <option key={pl.id} value={pl.id}>{pl.name}</option>
                        ))}
                        {priceLists.length === 0 && <option value="" disabled>Cargando listas...</option>}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modificar Descuento Especial (%)</label>
                      <input 
                        type="number" 
                        value={newClientData.specialDiscount || 0}
                        onChange={e => setNewClientData({...newClientData, specialDiscount: Number(e.target.value)})}
                        className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-600" 
                      />
                    </div>

                  </div>
                )}

                {activeClientModalTab === 'authorized' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-orange-600" /> Personas Autorizadas
                    </h3>
                    <p className="text-slate-500 text-sm">Gestiona quién puede realizar compras o retirar mercadería en nombre de este cliente.</p>

                    <div className="flex gap-3">
                      <input 
                        placeholder="Nombre completo del autorizado..." 
                        className="flex-1 px-5 py-3 border border-slate-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-orange-500" 
                        value={newAuthorizedPerson}
                        onChange={e => setNewAuthorizedPerson(e.target.value)}
                        onKeyPress={e => { if (e.key === 'Enter') handleAddAuthorizedPerson(); }}
                      />
                      <button 
                        onClick={handleAddAuthorizedPerson}
                        className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                      >
                        Añadir
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(newClientData.authorizedPersons || []).length > 0 ? (
                        (newClientData.authorizedPersons || []).map((person, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="font-bold text-slate-800">{person}</span>
                            <button 
                              onClick={() => handleRemoveAuthorizedPerson(person)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar autorizado"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 font-medium">
                          No hay personas autorizadas.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeClientModalTab === 'account' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-orange-600" /> Cuenta Corriente
                    </h3>
                    <p className="text-slate-500 text-sm">Consulta el estado de cuenta y los movimientos de saldos de este cliente.</p>

                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex justify-between items-center relative overflow-hidden shadow-xl">
                      <div className="relative z-10 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Actual</p>
                        <p className="text-4xl font-black text-orange-500">${(newClientData.balance || 0).toLocaleString()}</p>
                        {(newClientData.balance || 0) < 0 && (
                          <span className="text-[10px] font-black uppercase text-red-400 tracking-widest bg-red-900/30 px-3 py-1 rounded-full border border-red-800/50 flex items-center gap-2 w-fit">
                            <AlertCircle className="w-3 h-3" /> DEBE
                          </span>
                        )}
                      </div>
                      <DollarSign className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
                    </div>

                    <div className="pt-6 border-t flex justify-center">
                      <button 
                        onClick={goToBalances}
                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2"
                      >
                        <ExternalLink className="w-5 h-5" /> Ver Detalle de Cuenta
                      </button>
                    </div>
                  </div>
                )}

                {/* New: Loyalty Tab */}
                {activeClientModalTab === 'loyalty' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Gift className="w-4 h-4 text-orange-600" /> Programa de Fidelización
                    </h3>
                    <p className="text-slate-500 text-sm">Activa el sistema de puntos para este cliente y gestiona sus puntos acumulados.</p>

                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newClientData.pointsEnabled || false}
                          onChange={(e) => setNewClientData({...newClientData, pointsEnabled: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-800 uppercase">Habilitar Puntos de Fidelización</p>
                        <p className="text-xs text-slate-500 mt-1">Si está activo, este cliente acumulará puntos con cada compra según las reglas del programa.</p>
                      </div>
                    </div>

                    {newClientData.pointsEnabled && (
                      <div className="pt-6 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                          <Star className="w-4 h-4 text-orange-600" /> Puntos Actuales
                        </h4>
                        <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 text-center">
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Puntos Acumulados</p>
                          <p className="text-5xl font-black text-orange-900">{newClientData.accumulatedPoints || 0}</p>
                          <p className="text-xs text-orange-700 font-medium mt-2">Valor estimado: ${((newClientData.accumulatedPoints || 0) * 1).toLocaleString()} </p> {/* Assuming 1 point = $1 for mock */}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ajustar Puntos Manualmente</label>
                          <input 
                            type="number" 
                            value={newClientData.accumulatedPoints || 0}
                            onChange={e => setNewClientData({...newClientData, accumulatedPoints: Number(e.target.value) || 0})}
                            className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-600 text-center text-xl" 
                          />
                          <p className="text-[10px] text-slate-400 italic">Modifica el total de puntos del cliente directamente.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex justify-end gap-4">
              <button onClick={() => setShowModal(false)} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
              <button 
                onClick={handleSaveClient}
                className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {activeClient ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;