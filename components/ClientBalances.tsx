
import React, { useState, useEffect } from 'react';
import { 
    Search, DollarSign, MessageCircle, Mail, History, Filter, 
    Download, AlertCircle, TrendingUp, Users, CheckCircle, 
    ChevronRight, Phone, Link2, ArrowUpRight, LayoutList, 
    PieChart, UserCheck, UserX
} from 'lucide-react';
import { Client } from '../types';

interface ClientBalancesProps {
    onNavigateToHistory?: (client: Client) => void;
}

const ClientBalances: React.FC<ClientBalancesProps> = ({ onNavigateToHistory }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<Client[]>(() => {
        const saved = localStorage.getItem('ferrecloud_clients');
        return saved ? JSON.parse(saved) : [
            { id: '1', name: 'Constructora del Norte', cuit: '30-12345678-9', phone: '+5491144556677', balance: 540000, limit: 1000000, email: 'admin@constructora.com', portalHash: 'C-D-N-2024' },
            { id: '2', name: 'Juan Perez', cuit: '20-11223344-5', phone: '+5491122334455', balance: 15000, limit: 50000, email: 'juanperez@gmail.com', portalHash: 'portal-jp44' },
            { id: '3', name: 'Mantenimiento Sur SRL', cuit: '30-55667788-2', phone: '+5491133445566', balance: 89000, limit: 200000, email: 'pagos@mantenimiento.com', portalHash: 'portal-ms55' },
            { id: '4', name: 'Arq. Lopez', cuit: '20-22334455-1', phone: '+5491199887766', balance: 245000, limit: 500000, email: 'lopez.arq@estudio.com', portalHash: 'portal-arq88' },
        ];
    });

    const [filterType, setFilterType] = useState<'ALL_DEBT' | 'HIGH_DEBT'>('ALL_DEBT');

    // Filter logic
    const clientsWithDebt = clients.filter(c => c.balance > 0);
    
    const filteredClients = clientsWithDebt.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cuit.includes(searchTerm);
        if (filterType === 'HIGH_DEBT') return matchesSearch && c.balance > 100000;
        return matchesSearch;
    }).sort((a, b) => b.balance - a.balance);

    const totalDebt = clientsWithDebt.reduce((acc, curr) => acc + curr.balance, 0);

    const sendWhatsAppReminder = (client: Client) => {
        const portalLink = `${window.location.origin}/portal/${client.portalHash || 'default'}`;
        const message = `Hola ${client.name}, te contactamos de Ferretería Bruzzone para informarte que tu saldo pendiente es de $${client.balance.toLocaleString('es-AR')}. Podes ver el detalle y los medios de pago aquí: ${portalLink}`;
        window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const sendPaymentLink = (client: Client) => {
        const link = `${window.location.origin}/portal/${client.portalHash || 'default'}`;
        navigator.clipboard.writeText(link);
        alert(`Link de pago copiado para ${client.name}. Ya puedes pegarlo en WhatsApp o Email.`);
    };

    return (
        <div className="flex h-full bg-slate-50 animate-fade-in overflow-hidden">
            
            {/* PANEL LATERAL DE FILTROS Y RESUMEN */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-100 bg-slate-900 text-white">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <DollarSign className="text-green-400"/> Saldos
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monitor de Cobranzas</p>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Resumen de Deuda */}
                    <div className="space-y-4">
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Deuda Exigible</p>
                            <h3 className="text-2xl font-black text-red-600 tracking-tighter">${totalDebt.toLocaleString('es-AR')}</h3>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cuentas con Saldo</p>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{clientsWithDebt.length} <span className="text-sm font-normal text-slate-400">Clientes</span></h3>
                        </div>
                    </div>

                    {/* Buscador Integrado en Lateral */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Buscar Cliente</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                            <input 
                                type="text" 
                                placeholder="Nombre o CUIT..." 
                                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filtros Rápidos */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Filtrar por Nivel</label>
                        <div className="grid grid-cols-1 gap-2">
                            <button 
                                onClick={() => setFilterType('ALL_DEBT')}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all font-bold text-xs uppercase ${filterType === 'ALL_DEBT' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-50 text-gray-400 hover:bg-gray-50'}`}>
                                <LayoutList size={16}/> Todos los Saldos
                            </button>
                            <button 
                                onClick={() => setFilterType('HIGH_DEBT')}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all font-bold text-xs uppercase ${filterType === 'HIGH_DEBT' ? 'border-red-600 bg-red-50 text-red-700 shadow-sm' : 'border-gray-50 text-gray-400 hover:bg-gray-50'}`}>
                                <AlertCircle size={16}/> Críticos (+ $100k)
                            </button>
                        </div>
                    </div>

                    {/* Acciones Globales */}
                    <div className="pt-6 border-t border-gray-100 space-y-3">
                        <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                            <Download size={14}/> Descargar Reporte
                        </button>
                    </div>
                </div>
                
                <div className="p-6 bg-slate-50 border-t border-gray-100">
                    <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                        <CheckCircle size={16}/> Cobro Masivo
                    </button>
                </div>
            </aside>

            {/* AREA PRINCIPAL: LISTADO EXPANDIDO */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Listado de Cuentas Corrientes</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Mostrando {filteredClients.length} de {clientsWithDebt.length} clientes con deuda</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100 text-green-700">
                            <p className="text-[10px] font-black uppercase leading-none mb-1">Recaudado Hoy</p>
                            <p className="text-lg font-black tracking-tighter">$124,500</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr className="border-b border-gray-100">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identificación Cliente</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Límite / Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Saldo Deudor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Gestión Rápida</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredClients.map(client => {
                                const usagePerc = Math.min(100, (client.balance / client.limit) * 100);
                                const isExceeded = client.balance > client.limit;

                                return (
                                    <tr key={client.id} className="hover:bg-indigo-50/20 transition-all group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white text-sm group-hover:scale-110 transition-transform">
                                                    {client.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{client.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">{client.cuit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-slate-400">Cupo: ${client.limit.toLocaleString()}</span>
                                                    <span className={isExceeded ? 'text-red-500' : 'text-slate-600'}>{usagePerc.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-40 bg-gray-100 h-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${isExceeded ? 'bg-red-500' : usagePerc > 80 ? 'bg-orange-400' : 'bg-blue-500'}`} 
                                                        style={{ width: `${usagePerc}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <p className={`text-xl font-black tracking-tighter leading-none mb-1 ${isExceeded ? 'text-red-600' : 'text-slate-800'}`}>
                                                    ${client.balance.toLocaleString('es-AR')}
                                                </p>
                                                {isExceeded && (
                                                    <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-widest border border-red-200">
                                                        Límite Superado
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => sendPaymentLink(client)}
                                                    className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100" 
                                                    title="Copiar Link de Pago">
                                                    <Link2 size={16}/>
                                                </button>
                                                <button 
                                                    onClick={() => sendWhatsAppReminder(client)}
                                                    className="p-2.5 text-green-600 bg-green-50 hover:bg-green-600 hover:text-white rounded-xl transition-all border border-green-100" 
                                                    title="Enviar Recordatorio WhatsApp">
                                                    <MessageCircle size={16}/>
                                                </button>
                                                <button 
                                                    className="p-2.5 text-slate-400 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl transition-all border border-slate-100" 
                                                    title="Enviar Resumen por Email">
                                                    <Mail size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => onNavigateToHistory?.(client)}
                                                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                Auditar <ChevronRight size={14}/>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredClients.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center text-slate-300">
                                        <Search size={64} strokeWidth={1} className="mx-auto mb-4 opacity-20"/>
                                        <p className="text-xl font-black uppercase tracking-tighter">Sin coincidencias</p>
                                        <p className="text-sm">Ajusta los filtros o el término de búsqueda.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default ClientBalances;
