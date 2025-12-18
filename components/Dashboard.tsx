
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, MoreHorizontal, FileText, ShoppingBag, Users, Wallet, Scroll, Smartphone, Package, Truck, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardStats } from '../types';

const salesData = [
  { name: 'Sem 1', ventas: 420000 },
  { name: 'Sem 2', ventas: 380000 },
  { name: 'Sem 3', ventas: 510000 },
  { name: 'Sem 4', ventas: 640000 },
];

const recentSales = [
    { id: '#FC-2024-001', client: 'Constructora Del Norte', amount: 154000, status: 'Completado', date: 'Hace 10 min' },
    { id: '#FC-2024-002', client: 'Juan Pérez (Final)', amount: 12500, status: 'Completado', date: 'Hace 25 min' },
    { id: '#FC-2024-003', client: 'Mantenimiento Sur SRL', amount: 89000, status: 'Pendiente', date: 'Hace 40 min' },
    { id: '#FC-2024-004', client: 'Consumidor Final', amount: 3500, status: 'Completado', date: 'Hace 1 hora' },
    { id: '#FC-2024-005', client: 'Arq. López', amount: 245000, status: 'Enviado', date: 'Hace 2 horas' },
];

const Dashboard: React.FC = () => {
  // Mock Financial Data
  const treasury = {
      cashTotal: 211200,
      registers: [
          { name: 'Caja Central', amount: 154200 },
          { name: 'Caja Mostrador 1', amount: 45000 },
          { name: 'Caja Chica', amount: 12000 },
      ],
      checksPhysical: 125000, // Cheques
      checksElectronic: 45000, // ECheqs
      clientDebt: 540000, // Saldo Clientes
      providerDebt: 320000, // Saldo Proveedores
      stockValue: 15430000 // Stock Valorizado
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* --- TOP ROW: FINANCIAL KPIs --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CAJA ACTUAL */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Wallet size={24} />
            </div>
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <ArrowUpRight size={12} /> Activo
            </span>
          </div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Caja Actual (Total)</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">${treasury.cashTotal.toLocaleString('es-AR')}</p>
        </div>

        {/* CHEQUES EN CARTERA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Scroll size={24} />
            </div>
            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              Cartera
            </span>
          </div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Cheques + ECheqs</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">${(treasury.checksPhysical + treasury.checksElectronic).toLocaleString('es-AR')}</p>
        </div>

        {/* SALDO CLIENTES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <Users size={24} />
            </div>
            <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
               A Cobrar
            </span>
          </div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Saldo Clientes</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">${treasury.clientDebt.toLocaleString('es-AR')}</p>
        </div>

        {/* SALDO PROVEEDORES */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <Truck size={24} />
            </div>
            <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
               A Pagar
            </span>
          </div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Saldo Proveedores</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">${treasury.providerDebt.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* --- SECOND ROW: STOCK & TREASURY BREAKDOWN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* STOCK VALORIZADO */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Package size={120} />
              </div>
              <div>
                  <div className="flex items-center gap-2 mb-2 opacity-80">
                      <Package size={20}/>
                      <span className="text-sm font-bold uppercase tracking-wider">Inventario</span>
                  </div>
                  <h3 className="text-lg font-medium text-slate-300">Stock Valorizado</h3>
                  <p className="text-4xl font-bold mt-2 text-white">${treasury.stockValue.toLocaleString('es-AR')}</p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Artículos en Sistema</span>
                      <span className="font-bold">14,200</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                      <span className="text-slate-400">Rotación Mensual Est.</span>
                      <span className="font-bold text-green-400">12.5%</span>
                  </div>
              </div>
          </div>

          {/* TREASURY BREAKDOWN GRID */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="text-ferre-orange" size={20}/> Desglose de Disponibilidades
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Cajas Individuales */}
                  {treasury.registers.map((reg, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">{reg.name}</p>
                          <p className="font-bold text-gray-800">${reg.amount.toLocaleString('es-AR')}</p>
                      </div>
                  ))}
                  
                  {/* Cheques Físicos */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                          <Scroll size={14} className="text-blue-600"/>
                          <p className="text-xs text-blue-700 font-bold uppercase">Cheques Físicos</p>
                      </div>
                      <p className="font-bold text-gray-800">${treasury.checksPhysical.toLocaleString('es-AR')}</p>
                  </div>

                  {/* E-Cheqs */}
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                          <Smartphone size={14} className="text-indigo-600"/>
                          <p className="text-xs text-indigo-700 font-bold uppercase">E-Cheqs</p>
                      </div>
                      <p className="font-bold text-gray-800">${treasury.checksElectronic.toLocaleString('es-AR')}</p>
                  </div>
              </div>
          </div>
      </div>

      {/* --- CHART ROW --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp size={20} className="text-ferre-orange"/> Ventas por Períodos
                    </h3>
                    <p className="text-sm text-gray-500">Evolución de facturación mensual</p>
                </div>
            </div>
            <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(val: number) => [`$${val.toLocaleString('es-AR')}`, 'Ventas']}
                />
                <Area type="monotone" dataKey="ventas" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>

      {/* --- RECENT TRANSACTIONS (Kept for context) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Últimos Movimientos</h3>
            <button className="text-sm text-ferre-orange font-medium hover:text-orange-700">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Transacción</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{sale.client}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    sale.status === 'Completado' ? 'bg-green-100 text-green-800' : 
                                    sale.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    {sale.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                                ${sale.amount.toLocaleString('es-AR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{sale.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
