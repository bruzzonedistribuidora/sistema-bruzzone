
import React, { useMemo, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, MoreHorizontal, FileText, ShoppingBag, Users, Wallet, Scroll, Smartphone, Package, Truck, CreditCard, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Client, Provider } from '../types';

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
  // --- DINAMIZACIÓN TOTAL DE DATOS FINANCIEROS ---
  
  // 1. Calcular Saldo de Clientes sumando la base de datos real
  const clientDebtTotal = useMemo(() => {
    const saved = localStorage.getItem('ferrecloud_clients');
    if (!saved) return 889000; // Valor por defecto si no hay base cargada aún
    try {
        const clients: Client[] = JSON.parse(saved);
        return clients.reduce((acc, curr) => acc + (curr.balance || 0), 0);
    } catch (e) {
        return 0;
    }
  }, []);

  // 2. Calcular Saldo de Proveedores sumando la base de datos real
  const providerDebtTotal = useMemo(() => {
      const saved = localStorage.getItem('ferrecloud_providers');
      if (!saved) return 200000; // 150k + 50k de los mocks iniciales
      try {
          const providers: Provider[] = JSON.parse(saved);
          return providers.reduce((acc, curr) => acc + (curr.balance || 0), 0);
      } catch (e) {
          return 0;
      }
  }, []);

  // 3. Calcular Valor de Stock (Simulado sobre el listado de productos)
  const stockValueTotal = useMemo(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      if (!saved) return 15430000;
      try {
          const products = JSON.parse(saved);
          return products.reduce((acc: number, curr: any) => acc + ((curr.stock || 0) * (curr.listCost || 0)), 0);
      } catch (e) {
          return 0;
      }
  }, []);

  // Consolidado de Tesorería
  const treasury = {
      cashTotal: 211200,
      registers: [
          { name: 'Caja Central', amount: 154200 },
          { name: 'Caja Mostrador 1', amount: 45000 },
          { name: 'Caja Chica', amount: 12000 },
      ],
      checksPhysical: 125000, 
      checksElectronic: 45000, 
      clientDebt: clientDebtTotal, 
      providerDebt: providerDebtTotal, 
      stockValue: stockValueTotal
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* --- TOP ROW: FINANCIAL KPIs (REAL TIME) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CAJA ACTUAL */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Wallet size={24} />
            </div>
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1 uppercase tracking-widest">
              <Activity size={10} className="animate-pulse"/> Disponible
            </span>
          </div>
          <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Caja Efectivo Total</h3>
          <p className="text-2xl font-black text-slate-800 mt-1 tracking-tighter">${treasury.cashTotal.toLocaleString('es-AR')}</p>
        </div>

        {/* CHEQUES EN CARTERA */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Scroll size={24} />
            </div>
            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1 uppercase tracking-widest">
              Valores
            </span>
          </div>
          <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Cheques en Cartera</h3>
          <p className="text-2xl font-black text-slate-800 mt-1 tracking-tighter">${(treasury.checksPhysical + treasury.checksElectronic).toLocaleString('es-AR')}</p>
        </div>

        {/* SALDO CLIENTES (SINCRONIZADO CON MODULO) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-orange-100 hover:shadow-xl transition-all group bg-gradient-to-br from-white to-orange-50/20">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:rotate-12 transition-transform">
              <Users size={24} />
            </div>
            <span className="text-orange-600 bg-orange-100 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 uppercase tracking-widest">
               Sincronizado
            </span>
          </div>
          <h3 className="text-orange-900/40 text-[10px] font-black uppercase tracking-wider">Total a Cobrar (Clientes)</h3>
          <p className="text-3xl font-black text-orange-600 mt-1 tracking-tighter animate-fade-in">${treasury.clientDebt.toLocaleString('es-AR')}</p>
          <p className="text-[9px] font-bold text-orange-400 uppercase mt-2">Calculado desde Cuentas Corrientes</p>
        </div>

        {/* SALDO PROVEEDORES (SINCRONIZADO CON MODULO) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-red-50 hover:shadow-xl transition-all group bg-gradient-to-br from-white to-red-50/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:-rotate-12 transition-transform">
              <Truck size={24} />
            </div>
            <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1 uppercase tracking-widest">
               Deuda
            </span>
          </div>
          <h3 className="text-red-900/40 text-[10px] font-black uppercase tracking-wider">Total a Pagar (Proveedores)</h3>
          <p className="text-2xl font-black text-red-600 mt-1 tracking-tighter animate-fade-in">${treasury.providerDebt.toLocaleString('es-AR')}</p>
          <p className="text-[9px] font-bold text-red-300 uppercase mt-2">Basado en facturas de compra</p>
        </div>
      </div>

      {/* --- STOCK & TREASURY BREAKDOWN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-[2.5rem] shadow-lg p-10 text-white flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Package size={180} />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 opacity-60">
                      <Package size={18}/>
                      <span className="text-[10px] font-black uppercase tracking-widest">Patrimonio Neto</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-400 uppercase tracking-tight">Valorización de Stock</h3>
                  <p className="text-5xl font-black mt-2 text-white tracking-tighter animate-fade-in">${treasury.stockValue.toLocaleString('es-AR')}</p>
              </div>
              <div className="mt-10 pt-8 border-t border-slate-800 relative z-10 space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Capacidad Operativa</span>
                      <span className="text-white">142.400 Artículos</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Valor de Venta Proyectado</span>
                      <span className="text-green-400 font-black">${(treasury.stockValue * 1.38).toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
                  </div>
              </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-200 p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter text-sm">
                    <DollarSign className="text-ferre-orange" size={20}/> Distribución de Fondos
                </h3>
                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-widest">Global ARS</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {treasury.registers.map((reg, idx) => (
                      <div key={idx} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 hover:border-ferre-orange/30 hover:bg-white transition-all group">
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1 group-hover:text-ferre-orange">{reg.name}</p>
                          <p className="text-xl font-black text-slate-700 tracking-tighter">${reg.amount.toLocaleString('es-AR')}</p>
                      </div>
                  ))}
                  <div className="bg-blue-50/30 p-6 rounded-[2rem] border border-blue-100 hover:bg-blue-50 transition-all">
                      <div className="flex items-center gap-2 mb-1">
                          <Scroll size={14} className="text-blue-600"/>
                          <p className="text-[9px] text-blue-700 font-black uppercase tracking-widest">Físicos</p>
                      </div>
                      <p className="text-xl font-black text-slate-800 tracking-tighter">${treasury.checksPhysical.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100 hover:bg-indigo-50 transition-all">
                      <div className="flex items-center gap-2 mb-1">
                          <Smartphone size={14} className="text-indigo-600"/>
                          <p className="text-[9px] text-indigo-700 font-black uppercase tracking-widest">E-Cheqs</p>
                      </div>
                      <p className="text-xl font-black text-slate-800 tracking-tighter">${treasury.checksElectronic.toLocaleString('es-AR')}</p>
                  </div>
              </div>
          </div>
      </div>

      {/* --- CHART ROW --- */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                        <TrendingUp size={24} className="text-ferre-orange"/> Performance Comercial
                    </h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Facturación total por periodo semanal</p>
                </div>
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <button className="px-4 py-1.5 rounded-lg bg-white shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-800">Mensual</button>
                    <button className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400">Anual</button>
                </div>
            </div>
            <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#cbd5e1" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold', padding: '12px' }}
                    itemStyle={{ color: '#fb923c' }}
                    formatter={(val: number) => [`$${val.toLocaleString('es-AR')}`, 'Ventas Brutas']}
                />
                <Area type="monotone" dataKey="ventas" stroke="#f97316" strokeWidth={5} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>

      {/* --- RECENT TRANSACTIONS --- */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm flex items-center gap-2">
                <Activity size={18} className="text-ferre-orange"/> Monitor de Actividad Reciente
            </h3>
            <button className="text-[10px] text-slate-500 font-black uppercase tracking-widest hover:bg-slate-200 bg-slate-100 px-4 py-2 rounded-full transition-colors">Historial Completo</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                        <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Referencia</th>
                        <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Entidad / Cliente</th>
                        <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                        <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto Neto</th>
                        <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiempo</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-10 py-6 whitespace-nowrap text-xs font-mono font-bold text-slate-400">{sale.id}</td>
                            <td className="px-10 py-6 whitespace-nowrap text-sm text-slate-700 font-black uppercase tracking-tighter leading-none">{sale.client}</td>
                            <td className="px-10 py-6 whitespace-nowrap">
                                <span className={`px-4 py-1.5 inline-flex text-[9px] leading-none font-black rounded-full uppercase tracking-widest border ${
                                    sale.status === 'Completado' ? 'bg-green-50 text-green-700 border-green-100' : 
                                    sale.status === 'Pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                                    'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                    {sale.status}
                                </span>
                            </td>
                            <td className="px-10 py-6 whitespace-nowrap text-lg text-slate-900 text-right font-black tracking-tighter">
                                ${sale.amount.toLocaleString('es-AR')}
                            </td>
                            <td className="px-10 py-6 whitespace-nowrap text-[10px] text-gray-400 text-right font-bold uppercase tracking-widest">{sale.date}</td>
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
