
import React, { useState } from 'react';
import { LogOut, FileText, Calendar, DollarSign, Download, Printer, Search, ArrowDownLeft, ArrowUpRight, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Client, CurrentAccountMovement } from '../types';

interface CustomerPortalProps {
    client: Client;
    onLogout: () => void;
}

// Mock Data specific for the portal view
const mockMovements: CurrentAccountMovement[] = [
    { id: '1', date: '2023-10-01', voucherType: 'FC A 0001-00004500', description: 'Compra de Materiales', debit: 200000, credit: 0, balance: 200000 },
    { id: '2', date: '2023-10-05', voucherType: 'REC X 0001-00000100', description: 'Pago a cuenta', debit: 0, credit: 50000, balance: 150000 },
    { id: '3', date: '2023-10-10', voucherType: 'FC A 0001-00004522', description: 'Compra Herramientas', debit: 390000, credit: 0, balance: 540000 },
];

const CustomerPortal: React.FC<CustomerPortalProps> = ({ client, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INVOICES' | 'PAYMENTS' | 'ACCOUNT'>('DASHBOARD');

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* Top Bar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-600 p-2 rounded-lg">
                            <TrendingUp className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Portal de Clientes</h1>
                            <p className="text-xs text-gray-500">Bienvenido, {client.name}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm font-medium transition-colors">
                        <LogOut size={18} /> Salir
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="md:col-span-1 space-y-2">
                        <button 
                            onClick={() => setActiveTab('DASHBOARD')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'DASHBOARD' ? 'bg-green-50 text-green-700 border border-green-200 font-bold' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
                            <TrendingUp size={18}/> Resumen de Cuenta
                        </button>
                        <button 
                            onClick={() => setActiveTab('INVOICES')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'INVOICES' ? 'bg-green-50 text-green-700 border border-green-200 font-bold' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
                            <FileText size={18}/> Mis Compras
                        </button>
                        <button 
                            onClick={() => setActiveTab('PAYMENTS')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'PAYMENTS' ? 'bg-green-50 text-green-700 border border-green-200 font-bold' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
                            <DollarSign size={18}/> Pagos Realizados
                        </button>
                        <button 
                            onClick={() => setActiveTab('ACCOUNT')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'ACCOUNT' ? 'bg-green-50 text-green-700 border border-green-200 font-bold' : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}>
                            <Calendar size={18}/> Cuenta Corriente
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="md:col-span-3">
                        
                        {/* DASHBOARD VIEW */}
                        {activeTab === 'DASHBOARD' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500">
                                        <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Saldo Actual</h3>
                                        <p className={`text-4xl font-bold ${client.balance > 0 ? 'text-gray-800' : 'text-green-600'}`}>
                                            ${client.balance.toLocaleString('es-AR')}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-2">Al día de la fecha</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
                                        <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Disponible para Compras</h3>
                                        <p className="text-4xl font-bold text-gray-800">
                                            ${(client.limit - client.balance).toLocaleString('es-AR')}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-2">Límite asignado: ${client.limit.toLocaleString('es-AR')}</p>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-4">
                                    <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                                        <AlertCircle size={24}/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-yellow-800 text-lg">Facturas Pendientes</h4>
                                        <p className="text-yellow-700 text-sm mt-1 mb-3">Tienes comprobantes próximos a vencer. Regulariza tu situación para mantener tu cuenta activa.</p>
                                        <button 
                                            onClick={() => setActiveTab('INVOICES')}
                                            className="text-xs font-bold bg-white border border-yellow-300 text-yellow-800 px-4 py-2 rounded hover:bg-yellow-100 transition-colors">
                                            Ver Pendientes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* INVOICES VIEW (Compras) */}
                        {activeTab === 'INVOICES' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 text-lg">Mis Compras</h3>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
                                        <input type="text" placeholder="Buscar comprobante..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none"/>
                                    </div>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4">Comprobante</th>
                                            <th className="px-6 py-4 text-center">Vencimiento</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                            <th className="px-6 py-4 text-center">Opciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mockMovements.filter(m => m.debit > 0).map(m => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-600">{m.date}</td>
                                                <td className="px-6 py-4 font-bold text-gray-800 text-sm">{m.voucherType}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">30/10/2023</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">${m.debit.toLocaleString('es-AR')}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button className="text-gray-400 hover:text-green-600 p-1" title="Descargar PDF">
                                                            <Download size={18}/>
                                                        </button>
                                                        <button className="text-gray-400 hover:text-gray-600 p-1" title="Imprimir">
                                                            <Printer size={18}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* PAYMENTS VIEW (Pagos) */}
                        {activeTab === 'PAYMENTS' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="font-bold text-gray-800 text-lg">Pagos Realizados</h3>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4">Recibo N°</th>
                                            <th className="px-6 py-4">Concepto</th>
                                            <th className="px-6 py-4 text-right">Monto</th>
                                            <th className="px-6 py-4 text-center">Opciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mockMovements.filter(m => m.credit > 0).map(m => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-600">{m.date}</td>
                                                <td className="px-6 py-4 font-bold text-gray-800 text-sm">{m.voucherType}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{m.description}</td>
                                                <td className="px-6 py-4 text-right font-bold text-green-600">${m.credit.toLocaleString('es-AR')}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button className="text-gray-400 hover:text-green-600 p-1" title="Descargar">
                                                            <Download size={18}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ACCOUNT VIEW (Cta Cte) */}
                        {activeTab === 'ACCOUNT' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 text-lg">Movimientos de Cuenta</h3>
                                    <button className="text-sm font-bold text-green-600 border border-green-200 px-3 py-1.5 rounded hover:bg-green-50 flex items-center gap-2">
                                        <Printer size={16}/> Imprimir Resumen
                                    </button>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4">Comprobante</th>
                                            <th className="px-6 py-4">Detalle</th>
                                            <th className="px-6 py-4 text-right">Debe</th>
                                            <th className="px-6 py-4 text-right">Haber</th>
                                            <th className="px-6 py-4 text-right">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mockMovements.map(m => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-600">{m.date}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-800">{m.voucherType}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{m.description}</td>
                                                <td className="px-6 py-4 text-right text-sm">{m.debit > 0 ? `$${m.debit.toLocaleString('es-AR')}` : '-'}</td>
                                                <td className="px-6 py-4 text-right text-sm">{m.credit > 0 ? `$${m.credit.toLocaleString('es-AR')}` : '-'}</td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">${m.balance.toLocaleString('es-AR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
};

export default CustomerPortal;
