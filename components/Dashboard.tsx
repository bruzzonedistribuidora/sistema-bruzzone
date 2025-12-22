
import React, { useMemo, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, MoreHorizontal, FileText, ShoppingBag, Users, Wallet, Scroll, Smartphone, Package, Truck, CreditCard, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Client, Provider } from '../types';

const salesData = [
  { name: 'S1', ventas: 420000 },
  { name: 'S2', ventas: 380000 },
  { name: 'S3', ventas: 510000 },
  { name: 'S4', ventas: 640000 },
];

const recentSales = [
    { id: '#FC-001', client: 'Constructora Del Norte', amount: 154000, status: 'Completado', date: '10m' },
    { id: '#FC-002', client: 'Juan Pérez (Final)', amount: 12500, status: 'Completado', date: '25m' },
    { id: '#FC-003', client: 'Mantenimiento Sur SRL', amount: 89000, status: 'Pendiente', date: '40m' },
];

const Dashboard: React.FC = () => {
  const clientDebtTotal = useMemo(() => {
    const saved = localStorage.getItem('ferrecloud_clients');
    if (!saved) return 889000;
    try {
        const clients: Client[] = JSON.parse(saved);
        return clients.reduce((acc, curr) => acc + (curr.balance || 0), 0);
    } catch (e) { return 0; }
  }, []);

  const providerDebtTotal = useMemo(() => {
      const saved = localStorage.getItem('ferrecloud_providers');
      if (!saved) return 200000;
      try {
          const providers: Provider[] = JSON.parse(saved);
          return providers.reduce((acc, curr) => acc + (curr.balance || 0), 0);
      } catch (e) { return 0; }
  }, []);

  const stockValueTotal = useMemo(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      if (!saved) return 15430000;
      try {
          const products = JSON.parse(saved);
          return products.reduce((acc: number, curr: any) => acc + ((curr.stock || 0) * (curr.listCost || 0)), 0);
      } catch (e) { return 0; }
  }, []);

  const treasury = {
      cashTotal: 211200,
      registers: [
          { name: 'Caja Central', amount: 154200 },
          { name: 'Mostrador 1', amount: 45000 },
          { name: 'Caja Chica', amount: 12000 },
      ],
      checksPhysical: 125000, 
      checksElectronic: 45000, 
      clientDebt: clientDebtTotal, 
      providerDebt: providerDebtTotal, 
      stockValue: stockValueTotal
  };

  return (
    <div className="p-4 space-y-3 animate-fade-in max-w-7xl mx-auto">
      {/* KPI Cards más compactas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-400 text-[9px] font-black uppercase tracking-wider mb-1">Caja Efectivo</h3>
          <p className="text-lg font-black text-slate-800">${treasury.cashTotal.toLocaleString('es-AR')}</p>
          <div className="w-full bg-green-50 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-green-500 h-full w-[65%]"></div></div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-400 text-[9px] font-black uppercase tracking-wider mb-1">Cheques en Cartera</h3>
          <p className="text-lg font-black text-slate-800">${(treasury.checksPhysical + treasury.checksElectronic).toLocaleString('es-AR')}</p>
          <div className="w-full bg-blue-50 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full w-[40%]"></div></div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-2 border-l-orange-500">
          <h3 className="text-gray-400 text-[9px] font-black uppercase tracking-wider mb-1">Saldo Clientes</h3>
          <p className="text-lg font-black text-orange-600">${treasury.clientDebt.toLocaleString('es-AR')}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border-l-2 border-l-red-500">
          <h3 className="text-gray-400 text-[9px] font-black uppercase tracking-wider mb-1">Deuda Proveedores</h3>
          <p className="text-lg font-black text-red-600">${treasury.providerDebt.toLocaleString('es-AR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-slate-900 rounded-lg shadow-lg p-5 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Valor de Activos</span>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mt-1">Valorización Stock</h3>
                  <p className="text-2xl font-black mt-1 text-white tracking-tighter">${treasury.stockValue.toLocaleString('es-AR')}</p>
              </div>
              <Activity size={40} className="absolute bottom-[-10px] right-[-10px] opacity-10 text-white" />
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-[10px] mb-4">
                  <DollarSign className="text-slate-400" size={12}/> Distribución de Fondos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {treasury.registers.map((reg, idx) => (
                      <div key={idx} className="bg-gray-50 p-2.5 rounded border border-gray-100 flex justify-between items-center">
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{reg.name}</p>
                          <p className="text-xs font-black text-slate-700">${reg.amount.toLocaleString('es-AR')}</p>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Ventas Ultima Semana</h3>
            <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05}/>
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis hide />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip contentStyle={{ borderRadius: '4px', fontSize: '10px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="ventas" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                    <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase">Referencia</th>
                    <th className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase">Entidad / Cliente</th>
                    <th className="px-4 py-2 text-right text-[9px] font-black text-gray-400 uppercase">Monto Final</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px]">
                {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-400">{sale.id}</td>
                        <td className="px-4 py-2.5 font-black text-slate-700 uppercase tracking-tight">{sale.client}</td>
                        <td className="px-4 py-2.5 text-right font-black text-slate-900">${sale.amount.toLocaleString('es-AR')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
