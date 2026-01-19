
import React, { useState } from 'react';
import { 
  Warehouse as WarehouseIcon, Search, Package, 
  ArrowLeftRight, AlertTriangle, Plus, 
  Filter, MoreHorizontal, ChevronRight, 
  X, CheckCircle2, TrendingUp, History,
  Edit3, Truck, Box
} from 'lucide-react';

interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stockTotal: number;
  stockByBranch: { [branchId: string]: number };
  minStock: number;
}

const Warehouse: React.FC = () => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [search, setSearch] = useState('');
  
  const [stockItems] = useState<StockItem[]>([
    { 
      id: '1', sku: 'MART-001', name: 'Martillo Stanley 20oz', category: 'Herramientas', 
      stockTotal: 45, stockByBranch: { '1': 30, '2': 10, '3': 5 }, minStock: 10 
    },
    { 
      id: '2', sku: 'CEM-AVE', name: 'Cemento Avellaneda 50kg', category: 'Construcción', 
      stockTotal: 8, stockByBranch: { '1': 5, '2': 0, '3': 3 }, minStock: 20 
    },
    { 
      id: '3', sku: 'TAL-650', name: 'Taladro Bosch GSB 650', category: 'Máquinas', 
      stockTotal: 12, stockByBranch: { '1': 8, '2': 4, '3': 0 }, minStock: 5 
    },
    { 
      id: '4', sku: 'CAB-001', name: 'Cable Unipolar 2.5mm', category: 'Electricidad', 
      stockTotal: 1500, stockByBranch: { '1': 1000, '2': 200, '3': 300 }, minStock: 500 
    },
  ]);

  const branches = [
    { id: '1', name: 'Depósito Central' },
    { id: '2', name: 'Sucursal Norte' },
    { id: '3', name: 'Sucursal Oeste' },
  ];

  const filteredStock = stockItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Depósito e Inventario</h1>
          <p className="text-slate-500">Controla el stock físico y gestiona transferencias entre ubicaciones.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowTransferModal(true)}
            className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeftRight className="w-5 h-5 text-orange-600" /> Transferir Stock
          </button>
          <button className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-600/20">
            <Plus className="w-5 h-5" /> Ajuste Manual
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Total Artículos</p>
            <h3 className="text-2xl font-black text-slate-800">{stockItems.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Bajo Stock</p>
            <h3 className="text-2xl font-black text-orange-600">{stockItems.filter(i => i.stockTotal <= i.minStock).length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">En Tránsito</p>
            <h3 className="text-2xl font-black text-green-600">4</h3>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex items-center gap-4 text-white">
          <div className="p-3 bg-white/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Valorizado Total</p>
            <h3 className="text-xl font-black">$4.8M</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por SKU o descripción..." 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-white shadow-sm bg-white transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            <button className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Descargar Reporte</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Artículo / SKU</th>
                <th className="px-6 py-4">Categoría</th>
                {branches.map(b => (
                  <th key={b.id} className="px-6 py-4 text-center">{b.name}</th>
                ))}
                <th className="px-6 py-4 text-right">Stock Total</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.stockTotal <= item.minStock ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider">{item.category}</span>
                  </td>
                  {branches.map(b => (
                    <td key={b.id} className="px-6 py-4 text-center">
                      <span className={`font-black ${item.stockByBranch[b.id] === 0 ? 'text-slate-200' : 'text-slate-700'}`}>
                        {item.stockByBranch[b.id] || 0}
                      </span>
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-lg font-black ${item.stockTotal <= item.minStock ? 'text-orange-600' : 'text-slate-900'}`}>
                        {item.stockTotal}
                      </span>
                      {item.stockTotal <= item.minStock && (
                        <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest -mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Reponer
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Historial">
                        <History className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Editar Stock">
                        <Edit3 className="w-4 h-4" />
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
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-orange-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Transferencia de Stock</h2>
                  <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest mt-1">Movimiento de mercadería entre depósitos</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-orange-700 rounded-xl transition-all text-white/70 hover:text-white">
                <X className="w-7 h-7" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Producto a Mover</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input className="w-full pl-9 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" placeholder="Buscar por SKU o nombre..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 relative">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origen</label>
                  <select className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800 bg-slate-50 shadow-sm">
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 z-10 p-2 bg-orange-600 text-white rounded-full border-4 border-white shadow-xl">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destino</label>
                  <select className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800 bg-slate-50 shadow-sm">
                    <option value="">Seleccione Destino</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad</label>
                  <input type="number" placeholder="0" className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-2xl text-slate-900 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridad</label>
                  <select className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800 bg-slate-50 shadow-sm">
                    <option>Normal</option>
                    <option>Urgente (Envío hoy)</option>
                    <option>Planificado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setShowTransferModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
              <button className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest">
                Confirmar Envío <Truck className="w-5 h-5 text-orange-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouse;
