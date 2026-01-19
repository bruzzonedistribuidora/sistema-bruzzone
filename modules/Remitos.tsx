
import React, { useState } from 'react';
import { 
  Search, ClipboardList, Filter, MoreHorizontal, 
  Eye, Printer, FileCheck, Truck, X, 
  ChevronRight, Calendar, User, Package,
  CheckSquare, Square, CreditCard, Receipt,
  CheckCircle2, AlertCircle, Wallet, Landmark,
  Edit3, Trash2, Info, Save, Trash, PlusCircle,
  Loader2
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext'; 
import { Product } from '../types';

interface RemitoItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

interface Remito {
  id: string;
  date: string;
  client: string;
  itemsCount: number;
  itemsList: RemitoItem[];
  total: number;
  status: 'pendiente' | 'entregado' | 'cancelado';
}

const Remitos: React.FC = () => {
  const { products, addSale } = useFirebase(); // Use Firebase context to get products and addSale
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals visibility
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Active selection
  const [activeRemito, setActiveRemito] = useState<Remito | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [docType, setDocType] = useState('invoice');

  // Additional Sale Entry (No Arca / Venta Directa)
  const [extraAmount, setExtraAmount] = useState<number>(0);
  const [extraDescription, setExtraDescription] = useState<string>('');

  const [mockRemitos, setMockRemitos] = useState<Remito[]>([
    { 
      id: 'R-0001', 
      date: '2024-05-20', 
      client: 'Juan Perez', 
      itemsCount: 5, 
      itemsList: [
        { sku: 'MART-001', name: 'Martillo Stanley 20oz', quantity: 2, price: 5500 },
        { sku: 'CAB-001', name: 'Cable Unipolar 2.5mm', quantity: 3, price: 500 }
      ],
      total: 12500, 
      status: 'pendiente' 
    },
    { 
      id: 'R-0002', 
      date: '2024-05-21', 
      client: 'Constructora del Norte', 
      itemsCount: 12, 
      itemsList: [
        { sku: 'TAL-650', name: 'Taladro Bosch GSB 650', quantity: 1, price: 18500 },
        { sku: 'CEM-AVE', name: 'Cemento Avellaneda 50kg', quantity: 10, price: 4200 }
      ],
      total: 85400, 
      status: 'pendiente' 
    },
    { 
      id: 'R-0003', 
      date: '2024-05-21', 
      client: 'Juan Perez', 
      itemsCount: 2, 
      itemsList: [
        { sku: 'TOR-HEX', name: 'Tornillo Hexagonal 2"', quantity: 2, price: 2250 }
      ],
      total: 4500, 
      status: 'pendiente' 
    },
    { 
      id: 'R-0004', 
      date: '2024-05-22', 
      client: 'Ferretería Central', 
      itemsCount: 8, 
      itemsList: [
        { sku: 'CAB-001', name: 'Cable Unipolar 2.5mm', quantity: 8, price: 4012.5 }
      ],
      total: 32100, 
      status: 'pendiente' 
    },
    { 
      id: 'R-0005', 
      date: '2024-05-23', 
      client: 'Juan Perez', 
      itemsCount: 3, 
      itemsList: [
        { sku: 'MART-001', name: 'Martillo Stanley 20oz', quantity: 1, price: 7800 }
      ],
      total: 7800, 
      status: 'entregado' 
    },
  ]);

  const [isProcessingBilling, setIsProcessingBilling] = useState(false); // New state for billing loading

  const filteredRemitos = mockRemitos.filter(r => {
    const matchesSearch = r.client.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'todos' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredRemitos.length && filteredRemitos.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRemitos.map(r => r.id));
    }
  };

  const handleDelete = () => {
    if (activeRemito) {
      setMockRemitos(prev => prev.filter(r => r.id !== activeRemito.id));
      setShowDeleteConfirm(false);
      setActiveRemito(null);
      alert('Remito eliminado correctamente.');
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'entregado': return 'bg-green-100 text-green-700 border-green-200';
      case 'pendiente': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'cancelado': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const selectedRemitosData = mockRemitos.filter(r => selectedIds.includes(r.id));
  const selectedRemitosTotal = selectedRemitosData.reduce((acc, curr) => acc + curr.total, 0);
  const finalTotal = (activeRemito ? activeRemito.total : selectedRemitosTotal) + extraAmount;
  
  const clientsInSelection = Array.from(new Set(selectedRemitosData.map(r => r.client)));
  const isSingleClient = clientsInSelection.length === 1;

  const resetExtraEntry = () => {
    setExtraAmount(0);
    setExtraDescription('');
  };

  const handleConfirmInvoice = async () => {
    if (!paymentMethod || !docType) {
      alert("Por favor, selecciona un medio de pago y un tipo de comprobante.");
      return;
    }
    
    setIsProcessingBilling(true);

    try {
      const remitosToInvoice = activeRemito ? [activeRemito] : selectedRemitosData;
      let allItems: any[] = [];
      let totalAmount = 0;

      remitosToInvoice.forEach(remito => {
        remito.itemsList.forEach(item => {
          // Find the actual product from the database context to get its ID
          const productInDb = products.find(p => p.sku === item.sku && p.name === item.name);
          if (productInDb) {
            // Check if item already exists in allItems to sum quantities
            const existingItem = allItems.find(i => i.id === productInDb.id);
            if (existingItem) {
              existingItem.quantity += item.quantity;
            } else {
              allItems.push({
                id: productInDb.id,
                sku: item.sku,
                name: item.name,
                brand: productInDb.brand, // Get brand from DB product
                price: item.price,
                quantity: item.quantity,
              });
            }
          } else {
            console.warn(`Product not found in database for SKU: ${item.sku}`);
            // Add as a generic item if not found in products list, without a Firebase ID
            allItems.push({ ...item, id: `mock-${item.sku}` });
          }
        });
        totalAmount += remito.total;
      });

      // Add extra item if present
      if (extraAmount > 0 && extraDescription.trim()) {
        allItems.push({
          id: `extra-${Date.now()}`, // Unique ID for extra item
          sku: 'SERV-001', // Generic SKU for services/extra
          name: extraDescription.trim(),
          brand: 'N/A',
          price: extraAmount,
          quantity: 1,
        });
        totalAmount += extraAmount;
      }
      
      const saleData = {
        client: activeRemito?.client || clientsInSelection[0],
        items: allItems,
        total: totalAmount,
        paymentMethod: paymentMethod,
        docType: docType,
        remitoIds: remitosToInvoice.map(r => r.id),
        // Add other relevant sale info like seller, branch, etc.
      };

      await addSale(saleData);

      // Update the status of processed mock remitos
      setMockRemitos(prevRemitos => 
        prevRemitos.map(remito => 
          remitosToInvoice.some(r => r.id === remito.id) ? { ...remito, status: 'entregado' } : remito
        )
      );

      alert(`¡Comprobante (${docType.toUpperCase()}) generado exitosamente! Total: $${totalAmount.toLocaleString()}${extraAmount > 0 ? ' (Incluye venta directa)' : ''}`);
      setSelectedIds([]);
      setShowBillingModal(false);
      resetExtraEntry();
      setActiveRemito(null); // Clear active remito after invoicing
    } catch (error) {
      console.error('Error al facturar remito(s):', error);
      alert('Hubo un error al generar el comprobante. Verifique la consola.');
    } finally {
      setIsProcessingBilling(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Remitos</h1>
          <p className="text-slate-500">Administra, edita o elimina remitos de entrega de mercadería.</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Printer className="w-5 h-5" /> Imprimir Listado
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Remitos Pendientes</p>
            <h3 className="text-2xl font-bold text-slate-800">{mockRemitos.filter(r => r.status === 'pendiente').length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Facturación Lista</p>
            <h3 className="text-2xl font-bold text-slate-800">145</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Saldo a Facturar</p>
            <h3 className="text-2xl font-bold text-slate-800">$134.400</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar remito o cliente..." 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-sm">
              {['todos', 'pendiente', 'entregado'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                    filter === f ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <button onClick={toggleAll} className="p-1 rounded hover:bg-slate-200 transition-colors">
                    {selectedIds.length === filteredRemitos.length && filteredRemitos.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-orange-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">Remito N°</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Items</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Monto</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRemitos.map((r) => (
                <tr 
                  key={r.id} 
                  className={`hover:bg-slate-50 transition-colors group cursor-pointer ${selectedIds.includes(r.id) ? 'bg-orange-50/50' : ''}`}
                >
                  <td className="px-6 py-4 text-center" onClick={() => toggleSelection(r.id)}>
                    <button className="p-1">
                      {selectedIds.includes(r.id) ? (
                        <CheckSquare className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-200" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900" onClick={() => { setActiveRemito(r); resetExtraEntry(); setShowViewModal(true); }}>{r.id}</td>
                  <td className="px-6 py-4" onClick={() => { setActiveRemito(r); resetExtraEntry(); setShowViewModal(true); }}>
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(r.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4" onClick={() => { setActiveRemito(r); resetExtraEntry(); setShowViewModal(true); }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                        {r.client.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">{r.client}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center" onClick={() => { setActiveRemito(r); resetExtraEntry(); setShowViewModal(true); }}>
                    <span className="px-2 py-0.5 bg-white text-slate-600 rounded text-xs font-bold border border-slate-200">
                      {r.itemsCount} art.
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={() => { setActiveRemito(r); resetExtraEntry(); setShowViewModal(true); }}>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={() => { setActiveRemito(r); resetExtraEntry(); setShowViewModal(true); }}>
                    <span className="font-black text-slate-900">${r.total.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setActiveRemito(r); resetExtraEntry(); setShowViewModal(true); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="Ver Detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setActiveRemito(r); setShowEditModal(true); }}
                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" 
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setActiveRemito(r); setShowDeleteConfirm(true); }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button className="group-hover:hidden text-slate-300">
                      <MoreHorizontal className="w-5 h-5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRemitos.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-slate-200" />
            </div>
            <div>
              <p className="text-slate-800 font-bold">No se encontraron remitos</p>
              <p className="text-slate-400 text-sm">Prueba ajustando los filtros de búsqueda.</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar for Selection */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom duration-300 z-40 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-lg font-black shadow-lg shadow-orange-600/20">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seleccionados</p>
              <p className="text-sm font-bold">Total Remitos: <span className="text-orange-500 font-black">${selectedRemitosTotal.toLocaleString()}</span></p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800"></div>

          <div className="flex items-center gap-3">
            {!isSingleClient && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-900/30 px-3 py-1.5 rounded-xl border border-red-800/50">
                <AlertCircle className="w-4 h-4" /> Diferentes Clientes
              </div>
            )}
            <button 
              disabled={!isSingleClient}
              onClick={() => { setActiveRemito(null); resetExtraEntry(); setShowBillingModal(true); }}
              className="bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:grayscale transition-all text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95"
            >
              <FileCheck className="w-5 h-5" /> FACTURAR SELECCIÓN
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white transition-colors text-sm font-bold"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {showViewModal && activeRemito && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Remito {activeRemito.id}</h2>
                  <p className="text-slate-500 text-sm font-medium">Comprobante de Entrega de Mercadería</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Cliente</p>
                  <p className="text-lg font-bold text-slate-800">{activeRemito.client}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fecha Emisión</p>
                  <p className="text-lg font-bold text-slate-800">{new Date(activeRemito.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">Artículo</th>
                      <th className="px-6 py-3 text-center">Cant.</th>
                      <th className="px-6 py-3 text-right">Unitario</th>
                      <th className="px-6 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeRemito.itemsList.map((item, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-slate-600">${item.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">${(item.quantity * item.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/50">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-bold text-slate-500 uppercase tracking-widest">Total Valorizado</td>
                      <td className="px-6 py-4 text-right text-xl font-black text-blue-600">${activeRemito.total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="bg-orange-50 p-6 rounded-[1.5rem] border border-orange-100 flex items-start gap-4">
                <Info className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-900">Estado: {activeRemito.status.toUpperCase()}</p>
                  <p className="text-xs text-orange-700 mt-1">Este documento respalda la entrega física. No posee validez fiscal hasta ser facturado.</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setShowViewModal(false)}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-white transition-all"
              >
                Cerrar
              </button>
              <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                <Printer className="w-5 h-5" /> Imprimir
              </button>
              <button 
                onClick={() => { setShowViewModal(false); resetExtraEntry(); setShowBillingModal(true); }}
                className="flex-[1.5] py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2"
              >
                <FileCheck className="w-5 h-5" /> Facturar Remito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Remito */}
      {showEditModal && activeRemito && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-orange-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Editar Remito {activeRemito.id}</h2>
                  <p className="text-orange-600 text-sm font-medium">Modifica cantidades o datos del comprobante</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cliente</label>
                  <input 
                    defaultValue={activeRemito.client}
                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha Emisión</label>
                  <input 
                    type="date"
                    defaultValue={activeRemito.date}
                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Artículos en Remito</h3>
                <div className="space-y-3">
                  {activeRemito.itemsList.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{item.sku}</p>
                      </div>
                      <div className="w-24">
                        <input 
                          type="number" 
                          defaultValue={item.quantity} 
                          className="w-full px-3 py-2 border rounded-xl text-center font-black focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      <div className="text-right w-24">
                        <p className="text-xs font-bold text-slate-900">${(item.quantity * item.price).toLocaleString()}</p>
                      </div>
                      <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold hover:bg-slate-50 transition-all">
                    + Agregar Artículo al Remito
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-white transition-all"
              >
                Descartar Cambios
              </button>
              <button 
                onClick={() => { alert('¡Remito actualizado!'); setShowEditModal(false); }}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> GUARDAR CAMBIOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteConfirm && activeRemito && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 text-center">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-600/10">
              <Trash2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">¿Eliminar Remito?</h2>
            <p className="text-slate-500 font-medium mb-8 px-4">
              Estás por eliminar el remito <span className="font-bold text-red-600">{activeRemito.id}</span>. Esta acción es irreversible y afectará el seguimiento de stock.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDelete}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-600/20 hover:bg-red-500 transition-all"
              >
                SÍ, ELIMINAR AHORA
              </button>
              <button 
                onClick={() => { setShowDeleteConfirm(false); setActiveRemito(null); }}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Billing (Individual or Bulk) */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  {activeRemito ? 'Facturación de Remito' : 'Facturación Unificada'}
                </h2>
                <p className="text-slate-500 mt-1">
                  Cliente: <span className="font-bold text-orange-600">{activeRemito ? activeRemito.client : clientsInSelection[0]}</span>
                </p>
              </div>
              <button onClick={() => setShowBillingModal(false)} className="p-3 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl transition-all text-slate-400">
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Selected Remitos Summary */}
              {!activeRemito && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" /> Detalle de Remitos ({selectedIds.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedRemitosData.map(r => (
                      <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-800">{r.id}</span>
                          <span className="text-xs text-slate-400 font-bold">{new Date(r.date).toLocaleDateString()}</span>
                        </div>
                        <span className="font-bold text-slate-900">${r.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADDITIONAL SALE ENTRY (Venta Directa / No Arca) */}
              <div className="space-y-4 p-6 bg-orange-50/50 rounded-[2rem] border-2 border-dashed border-orange-200">
                <h3 className="text-xs font-black text-orange-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Agregar Item Adicional (Venta Directa)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Concepto / Descripción</label>
                    <input 
                      type="text"
                      placeholder="Ej: Servicio Flete, Ajuste, etc."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium bg-white shadow-sm"
                      value={extraDescription}
                      onChange={(e) => setExtraDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Monto Adicional ($)</label>
                    <input 
                      type="number"
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-black bg-white shadow-sm text-orange-600"
                      value={extraAmount || ''}
                      onChange={(e) => setExtraAmount(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
                 {extraAmount > 0 && extraDescription.trim() && (
                    <div className="flex justify-between items-center bg-orange-100 p-3 rounded-xl border border-orange-200">
                        <span className="text-xs font-medium text-orange-800">{extraDescription}</span>
                        <span className="font-bold text-orange-900">${extraAmount.toLocaleString()}</span>
                    </div>
                 )}
              </div>

              {/* Payment Method & Document Type */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Forma de Pago y Comprobante
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medio de Pago</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white shadow-sm"
                    >
                      <option value="">Selecciona...</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta_debito">Tarjeta de Débito</option>
                      <option value="tarjeta_credito">Tarjeta de Crédito</option>
                      <option value="transferencia">Transferencia Bancaria</option>
                      <option value="cuenta_corriente">Cuenta Corriente</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Comprobante</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white shadow-sm"
                    >
                      <option value="invoice">Factura (AFIP)</option>
                      <option value="remito">Remito (Interno)</option>
                      <option value="ticket">Ticket (Consumidor Final)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Final Total */}
              <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xl font-black text-slate-800 uppercase tracking-tight">TOTAL FINAL</span>
                <span className="text-5xl font-black text-orange-600">${finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                onClick={() => setShowBillingModal(false)}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>
              <button
                disabled={!paymentMethod || !docType || isProcessingBilling}
                onClick={handleConfirmInvoice}
                className="flex-[1.5] py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingBilling ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
                {isProcessingBilling ? 'Procesando...' : 'GENERAR COMPROBANTE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fix: Changed from default export to named export
export { Remitos };
    