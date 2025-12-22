
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
    <div className="p-6 space-y-4 animate-fade-in max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Wallet size={18} /></div>
          </div>
          <h3 className="text-gray-400 text-[9px] font-black uppercase tracking-wider">Caja Efectivo</h3>
          <p className="text-xl font-black text-slate-800 mt-1">${treasury.cashTotal.toLocaleString('es-AR')}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Scroll size={18} /></div>
          </div>
          <h3 className="text-gray-400 text-[9px] font-black uppercase tracking-wider">Cheques</h3>
          <p className="text-xl font-black text-slate-800 mt-1">${(treasury.checksPhysical + treasury.checksElectronic).toLocaleString('es-AR')}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-l-orange-500">
          <h3 className="text-gray-400 text-[9px] font-black uppercase tracking-wider">Saldo Clientes</h3>
          <p className="text-xl font-black text-orange-600 mt-1">${treasury.clientDebt.toLocaleString('es-AR')}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-l-red-500">
          <h3 className="text-gray-400 text-[9px] font-black uppercase tracking-wider">Deuda Proveedores</h3>
          <p className="text-xl font-black text-red-600 mt-1">${treasury.providerDebt.toLocaleString('es-AR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 opacity-60">
                      <Package size={14}/>
                      <span className="text-[8px] font-black uppercase tracking-widest">Patrimonio Neto</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase">Valorización Stock</h3>
                  <p className="text-3xl font-black mt-1 text-white tracking-tighter">${treasury.stockValue.toLocaleString('es-AR')}</p>
              </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-[10px]">
                    <DollarSign className="text-ferre-orange" size={14}/> Distribución de Fondos
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {treasury.registers.map((reg, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="text-[8px] text-gray-400 font-black uppercase mb-1">{reg.name}</p>
                          <p className="text-sm font-black text-slate-700">${reg.amount.toLocaleString('es-AR')}</p>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis hide />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="ventas" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                    <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase">Referencia</th>
                    <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase">Entidad</th>
                    <th className="px-6 py-3 text-right text-[9px] font-black text-gray-400 uppercase">Monto</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
                {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3 font-mono font-bold text-slate-400">{sale.id}</td>
                        <td className="px-6 py-3 font-black text-slate-700 uppercase">{sale.client}</td>
                        <td className="px-6 py-3 text-right font-black text-slate-900">${sale.amount.toLocaleString('es-AR')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
