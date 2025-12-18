
import React, { useState } from 'react';
import { 
    BarChart3, Calendar, Download, TrendingUp, TrendingDown, 
    DollarSign, FileText, ShoppingBag, Truck, ArrowUpRight, 
    ArrowDownLeft, Filter, Search, Eye
} from 'lucide-react';
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

type ReportMode = 'SALES' | 'PURCHASES';
type ReportPeriod = 'DAILY' | 'MONTHLY';

const Reports: React.FC = () => {
    const [mode, setMode] = useState<ReportMode>('SALES');
    const [period, setPeriod] = useState<ReportPeriod>('DAILY');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // --- MOCK DATA ---
    
    // Mock Data for Charts
    const salesDailyData = [
        { name: '08:00', total: 12000 }, { name: '10:00', total: 45000 },
        { name: '12:00', total: 32000 }, { name: '14:00', total: 18000 },
        { name: '16:00', total: 56000 }, { name: '18:00', total: 72000 },
    ];

    const salesMonthlyData = [
        { name: '01/10', total: 150000 }, { name: '05/10', total: 230000 },
        { name: '10/10', total: 180000 }, { name: '15/10', total: 320000 },
        { name: '20/10', total: 290000 }, { name: '25/10', total: 410000 },
    ];

    const purchasesDailyData = [
        { name: '09:00', total: 85000 }, { name: '11:00', total: 12000 },
        { name: '13:00', total: 0 }, { name: '15:00', total: 45000 },
    ];

    const purchasesMonthlyData = [
        { name: '02/10', total: 500000 }, { name: '08/10', total: 120000 },
        { name: '12/10', total: 50000 }, { name: '18/10', total: 890000 },
        { name: '24/10', total: 150000 },
    ];

    // Mock Data for Detailed Table
    const salesDetails = [
        { id: 'FC-0001-00000023', time: '18:30', entity: 'Juan Perez', type: 'FACTURA B', items: 3, total: 25000, status: 'COBRADO' },
        { id: 'REM-0001-000044', time: '16:15', entity: 'Constructora Norte', type: 'REMITO X', items: 15, total: 150000, status: 'PENDIENTE' },
        { id: 'FC-0001-00000022', time: '14:20', entity: 'Consumidor Final', type: 'TICKET FISCAL', items: 1, total: 4500, status: 'COBRADO' },
        { id: 'NC-0001-00000005', time: '12:10', entity: 'Juan Perez', type: 'NOTA CREDITO', items: 1, total: -2500, status: 'DEVUELTO' },
        { id: 'REM-0001-000043', time: '10:05', entity: 'Arq. Lopez', type: 'REMITO R', items: 8, total: 89000, status: 'PENDIENTE' },
    ];

    const purchasesDetails = [
        { id: 'FC-A-0005-2233', time: '15:45', entity: 'Herramientas Global SA', type: 'FACTURA A', items: 50, total: 450000, status: 'PAGADO' },
        { id: 'FC-C-0002-1122', time: '09:15', entity: 'Fletes Rápidos', type: 'FACTURA C', items: 1, total: 15000, status: 'PAGADO' },
        { id: 'REM-PROV-5544', time: '11:30', entity: 'Pinturas del Centro', type: 'REMITO PROV.', items: 20, total: 0, status: 'RECEPCIÓN' },
    ];

    // --- RENDER HELPERS ---

    const getChartData = () => {
        if (mode === 'SALES') return period === 'DAILY' ? salesDailyData : salesMonthlyData;
        return period === 'DAILY' ? purchasesDailyData : purchasesMonthlyData;
    };

    const getTableData = () => {
        return mode === 'SALES' ? salesDetails : purchasesDetails;
    };

    const getThemeColor = () => mode === 'SALES' ? 'text-indigo-600' : 'text-orange-600';
    const getBgColor = () => mode === 'SALES' ? 'bg-indigo-600' : 'bg-orange-600';
    const getLightBgColor = () => mode === 'SALES' ? 'bg-indigo-50' : 'bg-orange-50';
    
    // KPI Data logic
    const totalAmount = getTableData().reduce((acc, curr) => acc + (curr.type === 'REMITO PROV.' ? 0 : curr.total), 0);
    const countDocs = getTableData().length;
    const countRemitos = getTableData().filter(i => i.type.includes('REMITO')).length;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
            
            {/* HEADER & CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BarChart3 className="text-gray-600" /> Informes y Reportes
                    </h2>
                    <p className="text-gray-500 text-sm">Análisis detallado de movimientos.</p>
                </div>

                <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => setMode('SALES')}
                        className={`px-6 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${mode === 'SALES' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <TrendingUp size={16}/> Ventas
                    </button>
                    <button 
                        onClick={() => setMode('PURCHASES')}
                        className={`px-6 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${mode === 'PURCHASES' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <TrendingDown size={16}/> Compras
                    </button>
                </div>
            </div>

            {/* FILTERS BAR */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button 
                            onClick={() => setPeriod('DAILY')}
                            className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${period === 'DAILY' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                            Diario
                        </button>
                        <button 
                            onClick={() => setPeriod('MONTHLY')}
                            className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${period === 'MONTHLY' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                            Mensual
                        </button>
                    </div>
                    
                    <div className="h-8 w-px bg-gray-300 mx-2"></div>

                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                        <Calendar size={16} className="text-gray-500"/>
                        <input 
                            type={period === 'DAILY' ? 'date' : 'month'} 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="text-sm font-medium text-gray-700 outline-none bg-transparent"
                        />
                    </div>
                </div>

                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                    <Download size={16}/> Exportar Excel
                </button>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total {mode === 'SALES' ? 'Facturado' : 'Gastado'}</p>
                        <h3 className={`text-3xl font-bold ${getThemeColor()}`}>${totalAmount.toLocaleString('es-AR')}</h3>
                    </div>
                    <div className={`p-4 rounded-full ${getLightBgColor()} ${getThemeColor()}`}>
                        <DollarSign size={24}/>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Operaciones</p>
                        <h3 className="text-3xl font-bold text-gray-800">{countDocs}</h3>
                        <p className="text-xs text-gray-400 mt-1">Comprobantes emitidos</p>
                    </div>
                    <div className={`p-4 rounded-full bg-gray-100 text-gray-600`}>
                        <FileText size={24}/>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Remitos {mode === 'SALES' ? 'Emitidos' : 'Recibidos'}</p>
                        <h3 className="text-3xl font-bold text-gray-800">{countRemitos}</h3>
                        <p className="text-xs text-gray-400 mt-1">Movimiento de mercadería</p>
                    </div>
                    <div className={`p-4 rounded-full bg-blue-50 text-blue-600`}>
                        <Truck size={24}/>
                    </div>
                </div>
            </div>

            {/* CHART SECTION */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    {mode === 'SALES' ? <TrendingUp size={18} className="text-green-500"/> : <TrendingDown size={18} className="text-red-500"/>}
                    Evolución {period === 'DAILY' ? 'Diaria' : 'Mensual'}
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={mode === 'SALES' ? '#4f46e5' : '#ea580c'} stopOpacity={0.1}/>
                                <stop offset="95%" stopColor={mode === 'SALES' ? '#4f46e5' : '#ea580c'} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Total']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="total" 
                            stroke={mode === 'SALES' ? '#4f46e5' : '#ea580c'} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorGradient)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* DETAIL TABLE SECTION */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 text-sm">Detalle de Operaciones</h3>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14}/>
                        <input type="text" placeholder="Buscar..." className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-indigo-500 w-48"/>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white sticky top-0 z-10 text-xs text-gray-500 uppercase border-b border-gray-200 shadow-sm">
                            <tr>
                                <th className="px-6 py-3">Hora</th>
                                <th className="px-6 py-3">Comprobante</th>
                                <th className="px-6 py-3">{mode === 'SALES' ? 'Cliente' : 'Proveedor'}</th>
                                <th className="px-6 py-3">Tipo Doc.</th>
                                <th className="px-6 py-3 text-center">Items</th>
                                <th className="px-6 py-3 text-right">Total</th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {getTableData().map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-500">{row.time}</td>
                                    <td className="px-6 py-3 font-mono text-xs font-bold text-gray-700">{row.id}</td>
                                    <td className="px-6 py-3 font-medium text-gray-800">{row.entity}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                            row.type.includes('REMITO') ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            row.type.includes('NOTA CREDITO') ? 'bg-red-50 text-red-700 border-red-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                            {row.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center text-gray-600">{row.items}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${row.total < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                        {row.total === 0 ? '-' : `$${row.total.toLocaleString('es-AR')}`}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`text-[10px] font-bold ${
                                            row.status === 'PENDIENTE' ? 'text-orange-500' : 'text-green-600'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <button className="text-gray-400 hover:text-indigo-600">
                                            <Eye size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default Reports;
