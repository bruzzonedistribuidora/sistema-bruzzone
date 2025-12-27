
import React, { useState, useEffect } from 'react';
import { Search, DollarSign, MessageCircle, Mail, History, ExternalLink, Filter, Download, AlertCircle, TrendingUp, Users, CheckCircle, ChevronRight, Phone, Link2 } from 'lucide-react';
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

    const sendEmailReminder = (client: Client) => {
        alert(`Simulando envío de correo a ${client.email} con el link al portal de pagos.`);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 animate-fade-in">
            {/* CABECERA Y RESUMEN */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Gestión de Cobranzas</h2>
                    <p className="text-gray-500 text-sm font-medium">Control de créditos otorgados y portal de pagos automático.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border-2 border-gray-100 text-gray-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 shadow-sm transition-all">
                        <Download size={16}/> EXPORTAR LISTADO
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 border-l-8 border-l-red-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total a Cobrar</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">${totalDebt.toLocaleString('es-AR')}</h3>
                    <div className="flex items-center gap-1 text-xs text-red-500 mt-4 font-bold">
                        <TrendingUp size={14}/> +5% vs mes anterior
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Clientes Deudores</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{clientsWithDebt.length}</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase">Cuentas con saldo activo</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ticket de Deuda</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">${(totalDebt / (clientsWithDebt.length || 1)).toLocaleString('es-AR', {maximumFractionDigits: 0})}</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase">Promedio por cliente</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 border-l-8 border-l-green-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cobrado (Hoy)</p>
                    <h3 className="text-4xl font-black text-green-600 tracking-tighter leading-none">$124,500</h3>
                    <div className="flex items-center gap-1 text-xs text-green-500 mt-4 font-bold uppercase tracking-wider">
                        <CheckCircle size={14}/> Meta diaria: 85%
                    </div>
                </div>
            </div>

            {/* FILTERS AND SEARCH */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o CUIT..." 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-ferre-orange transition-all font-bold text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-xl">
                    <button 
                        onClick={() => setFilterType('ALL_DEBT')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all tracking-widest ${filterType === 'ALL_DEBT' ? 'bg-white text-slate-800 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                        Todos
                    </button>
                    <button 
                        onClick={() => setFilterType('HIGH_DEBT')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all tracking-widest ${filterType === 'HIGH_DEBT' ? 'bg-white text-red-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                        Morosos {'>'} $100k
                    </button>
                </div>
            </div>

            {/* MAIN TABLE */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / Cuenta Corriente</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Crédito</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Saldo Deudor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones Cobranza</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredClients.map(client => (
                                <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-lg">
                                                {client.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-800 text-base uppercase tracking-tight leading-none mb-1">{client.name}</p>
                                                <p className="text-xs text-gray-400 font-mono font-bold">{client.cuit}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-600 font-bold">${client.limit.toLocaleString('es-AR')}</span>
                                            <div className="w-32 bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${client.balance > client.limit ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (client.balance / client.limit) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <p className="text-2xl font-black text-red-600 tracking-tighter leading-none mb-1">${client.balance.toLocaleString('es-AR')}</p>
                                        {client.balance > client.limit && (
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 justify-end">
                                                <AlertCircle size={10}/> Excedido
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => sendPaymentLink(client)}
                                                className="p-3 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm" title="Copiar Link de Pago">
                                                <Link2 size={20}/>
                                            </button>
                                            <button 
                                                onClick={() => sendWhatsAppReminder(client)}
                                                className="p-3 text-green-600 bg-green-50 hover:bg-green-600 hover:text-white rounded-2xl transition-all shadow-sm" title="Reclamar Deuda WhatsApp">
                                                <MessageCircle size={20}/>
                                            </button>
                                            <button 
                                                onClick={() => sendEmailReminder(client)}
                                                className="p-3 text-gray-400 bg-gray-50 hover:bg-slate-800 hover:text-white rounded-2xl transition-all shadow-sm" title="Enviar Resumen">
                                                <Mail size={20}/>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button 
                                            onClick={() => onNavigateToHistory?.(client)}
                                            className="p-3 bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-2xl transition-all ml-auto flex items-center gap-2 group/btn"
                                            title="Ver Cuenta Corriente">
                                            <History size={20} className="group-hover/btn:scale-110 transition-transform"/>
                                            <ChevronRight size={20}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* FOOTER TOTALS */}
                <div className="bg-slate-900 text-white p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Monto Exigible Seleccionado</p>
                        <h4 className="text-4xl font-black tracking-tighter leading-none">${filteredClients.reduce((acc, c) => acc + c.balance, 0).toLocaleString('es-AR')}</h4>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                            <History size={18} className="inline mr-2"/> Auditoría Cobros
                        </button>
                        <button className="bg-ferre-orange hover:bg-orange-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-900/40 transition-all flex items-center gap-2">
                            <DollarSign size={20}/> COBRO MASIVO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientBalances;
