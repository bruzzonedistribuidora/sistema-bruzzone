import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, ShoppingCart, Truck, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const Statistics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VENTAS' | 'COMPRAS' | 'CLIENTES' | 'PRODUCTOS'>('VENTAS');

  const dataSales = [
      { name: 'Ene', total: 4000 }, { name: 'Feb', total: 3000 }, { name: 'Mar', total: 2000 },
      { name: 'Abr', total: 2780 }, { name: 'May', total: 1890 }, { name: 'Jun', total: 2390 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Centro de Estadísticas</h2>
          <p className="text-gray-500 text-sm">Análisis de datos para la toma de decisiones.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
           <button onClick={() => setActiveTab('VENTAS')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'VENTAS' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Ventas</button>
           <button onClick={() => setActiveTab('COMPRAS')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'COMPRAS' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Compras</button>
           <button onClick={() => setActiveTab('CLIENTES')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'CLIENTES' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Clientes</button>
           <button onClick={() => setActiveTab('PRODUCTOS')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PRODUCTOS' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Productos</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Facturación Anual</h4>
              <p className="text-2xl font-bold text-gray-800 mt-1">$45.2M</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Ticket Promedio</h4>
              <p className="text-2xl font-bold text-gray-800 mt-1">$15,400</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Margen Global</h4>
              <p className="text-2xl font-bold text-green-600 mt-1">32.5%</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Artículos Activos</h4>
              <p className="text-2xl font-bold text-blue-600 mt-1">14,200</p>
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp size={20}/> 
              {activeTab === 'VENTAS' ? 'Evolución de Ventas' : activeTab === 'COMPRAS' ? 'Evolución de Compras' : 'Actividad'}
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataSales} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#4f46e5" fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
      </div>

      {activeTab === 'PRODUCTOS' && (
          <div className="grid grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                   <h4 className="font-bold text-gray-800 mb-4">Top 5 Más Vendidos</h4>
                   <ul className="space-y-3">
                       {[1,2,3,4,5].map(i => (
                           <li key={i} className="flex justify-between border-b border-gray-100 pb-2">
                               <span className="text-gray-600 text-sm">Producto Ejemplo #{i}</span>
                               <span className="font-bold text-gray-800 text-sm">{100 - i*10} un.</span>
                           </li>
                       ))}
                   </ul>
               </div>
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                   <h4 className="font-bold text-gray-800 mb-4">Top 5 Mayor Ganancia</h4>
                   <ul className="space-y-3">
                       {[1,2,3,4,5].map(i => (
                           <li key={i} className="flex justify-between border-b border-gray-100 pb-2">
                               <span className="text-gray-600 text-sm">Herramienta Pro #{i}</span>
                               <span className="font-bold text-green-600 text-sm">${(50000 - i*5000).toLocaleString('es-AR')}</span>
                           </li>
                       ))}
                   </ul>
               </div>
          </div>
      )}
    </div>
  );
};

export default Statistics;
