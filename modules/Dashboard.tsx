
import React from 'react';
import { 
  Users, TrendingUp, Package, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, DollarSign 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';

const data = [
  { name: 'Lun', ventas: 4000, compras: 2400 },
  { name: 'Mar', ventas: 3000, compras: 1398 },
  { name: 'Mie', ventas: 2000, compras: 9800 },
  { name: 'Jue', ventas: 2780, compras: 3908 },
  { name: 'Vie', ventas: 1890, compras: 4800 },
  { name: 'Sab', ventas: 2390, compras: 3800 },
  { name: 'Dom', ventas: 3490, compras: 4300 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de Control</h1>
          <p className="text-slate-500">Bienvenido de nuevo al sistema de gestión.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium shadow-sm hover:bg-gray-50">Hoy</button>
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium shadow-sm hover:bg-gray-50">Últimos 7 días</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ventas Totales', value: '$1.284.500', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100', trend: '+12.5%' },
          { label: 'Nuevos Clientes', value: '48', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+5.2%' },
          { label: 'Stock Crítico', value: '12 Items', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', trend: '-2' },
          { label: 'Caja del Día', value: '$245.300', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100', trend: '+8.1%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Flujo de Caja (Ventas vs Compras)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="ventas" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                <Area type="monotone" dataKey="compras" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Alertas Recientes</h3>
          <div className="space-y-4">
            {[
              { type: 'stock', msg: 'Stock bajo: Cemento Avellaneda (5 bolsas)', time: 'Hace 10 min' },
              { type: 'cheque', msg: 'Cheque por vencer: Banco Galicia #4829', time: 'Hace 1 hora' },
              { type: 'deuda', msg: 'Cliente Moroso: Ferretería Juan (Saldo $45k)', time: 'Hace 3 horas' },
              { type: 'price', msg: 'Lista de Precios: Sinteplast actualizó +15%', time: 'Ayer' },
            ].map((alert, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`p-2 rounded-lg ${alert.type === 'stock' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  {alert.type === 'stock' ? <Package className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{alert.msg}</p>
                  <p className="text-xs text-slate-500">{alert.time}</p>
                </div>
                <button className="text-xs font-bold text-orange-600 hover:underline">Ver</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;