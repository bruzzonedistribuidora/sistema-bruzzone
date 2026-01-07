import React, { useMemo } from 'react';
import { Transaction, FinancialSummary } from '../types';
import { formatCurrency } from '../utils/finance';
import { FileText, TrendingDown, TrendingUp, DollarSign, PieChart, Activity } from 'lucide-react';

interface ReportsProps {
  transactions: Transaction[];
  summary: FinancialSummary;
}

const Reports: React.FC<ReportsProps> = ({ transactions, summary }) => {
  // P&L Calculation Logic
  const pnl = useMemo(() => {
    let grossRevenue = 0;
    let cogs = 0;
    let operatingExpenses: Record<string, number> = {};
    let taxes = 0;

    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      
      // Handle Income
      if (t.type === 'INCOME') {
        const gross = t.grossAmount ? Number(t.grossAmount) : amount;
        const retention = t.retention ? Number(t.retention) : 0;
        grossRevenue += gross;
        taxes += retention; // Retentions are treated as tax payments
      } 
      // Handle Purchases (Direct Costs)
      else if (t.type === 'PURCHASE') {
        cogs += amount;
      } 
      // Handle Expenses
      else if (t.type === 'EXPENSE') {
        const cat = t.category || 'Otros';
        const desc = t.description.toLowerCase();

        // Intelligent Classification
        if (
            cat === 'Impuestos' || 
            desc.includes('impuesto') || 
            desc.includes('afip') || 
            desc.includes('iibb') ||
            desc.includes('iva')
        ) {
          taxes += amount;
        } 
        else if (cat === 'Insumos' || desc.includes('mercaderia') || desc.includes('costo')) {
          cogs += amount;
        }
        else {
          // Group Operating Expenses
          if (!operatingExpenses[cat]) operatingExpenses[cat] = 0;
          operatingExpenses[cat] += amount;
        }
      }
    });

    const grossProfit = grossRevenue - cogs;
    const totalOperatingExpenses = Object.values(operatingExpenses).reduce((a, b) => a + b, 0);
    const ebitda = grossProfit - totalOperatingExpenses;
    const netIncome = ebitda - taxes;

    // Sort expenses by amount desc
    const sortedExpenses = Object.entries(operatingExpenses).sort(([,a], [,b]) => b - a);

    return {
      grossRevenue,
      cogs,
      grossProfit,
      sortedExpenses,
      totalOperatingExpenses,
      ebitda,
      taxes,
      netIncome
    };
  }, [transactions]);

  // Monthly Cash Flow Data
  const monthlyData = useMemo(() => {
    const data: Record<string, any> = {};
    transactions.forEach(t => {
        const month = t.date.slice(0, 7);
        if (!data[month]) data[month] = { month, income: 0, expense: 0, balance: 0 };
        
        if (t.type === 'INCOME') data[month].income += (Number(t.amount) || 0);
        else if (t.type === 'EXPENSE' || t.type === 'PURCHASE') data[month].expense += (Number(t.amount) || 0);
    });
    
    Object.values(data).forEach(d => d.balance = d.income - d.expense);
    return Object.values(data).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const capital = 1000000; // Base ficticia para ROI
  const roi = pnl.netIncome > 0 ? (pnl.netIncome / capital) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Reportes Financieros</h2>
                <p className="text-gray-500 text-sm">Estado de situación y rentabilidad</p>
            </div>
            <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">
                PRO VERSION
            </div>
        </div>

        {/* --- ESTADO DE RESULTADOS (P&L) --- */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none">
            <div className="bg-slate-900 px-6 py-5 border-b border-slate-800 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-indigo-400" />
                    <div>
                        <h3 className="font-bold text-lg">Estado de Resultados (P&L)</h3>
                        <p className="text-xs text-slate-400">Informe de Rentabilidad Acumulada</p>
                    </div>
                </div>
                <span className="text-sm font-mono bg-slate-800 px-3 py-1 rounded border border-slate-700">
                    {new Date().toLocaleDateString()}
                </span>
            </div>
            
            <div className="p-8">
                {/* Ingresos */}
                <div className="flex justify-between items-center mb-1 group">
                    <span className="text-gray-700 font-medium group-hover:text-indigo-600 transition-colors">Ingresos Brutos por Ventas</span>
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(pnl.grossRevenue)}</span>
                </div>
                
                {/* CMV */}
                <div className="flex justify-between items-center mb-4 text-sm text-red-500 hover:bg-red-50 p-1 rounded transition-colors -mx-1 px-1">
                    <span className="pl-4 flex items-center gap-2">
                        <span className="w-1 h-1 bg-red-400 rounded-full"></span> (-) Costo de Ventas (CMV)
                    </span>
                    <span>{formatCurrency(pnl.cogs)}</span>
                </div>

                <div className="border-t border-gray-200 my-3"></div>

                {/* Utilidad Bruta */}
                <div className="flex justify-between items-center mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-bold text-gray-800">(=) Utilidad Bruta</span>
                    <span className="font-bold text-gray-900">{formatCurrency(pnl.grossProfit)}</span>
                </div>

                {/* Gastos Operativos */}
                <div className="mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Gastos Operativos</p>
                    {pnl.sortedExpenses.map(([cat, amount]) => (
                        <div key={cat} className="flex justify-between items-center mb-2 text-sm text-gray-600 hover:bg-gray-50 p-1 rounded -mx-1 px-1">
                            <span className="pl-4">{cat}</span>
                            <span>{formatCurrency(amount)}</span>
                        </div>
                    ))}
                    {pnl.sortedExpenses.length === 0 && <p className="text-sm text-gray-400 pl-4 italic">Sin gastos operativos registrados</p>}
                </div>

                <div className="flex justify-between items-center mb-4 text-sm font-medium text-red-600 border-t border-dashed border-gray-200 pt-2">
                    <span className="pl-4">Total Gastos Operativos</span>
                    <span>{formatCurrency(pnl.totalOperatingExpenses)}</span>
                </div>

                <div className="border-t border-gray-200 my-3"></div>

                {/* EBITDA */}
                 <div className="flex justify-between items-center mb-4 px-2">
                    <span className="font-bold text-gray-700">(=) EBITDA (Resultado Operativo)</span>
                    <span className={`font-bold ${pnl.ebitda >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatCurrency(pnl.ebitda)}</span>
                </div>

                {/* Impuestos */}
                 <div className="flex justify-between items-center mb-6 text-sm text-red-500 bg-red-50/50 p-2 rounded">
                    <span className="pl-2">(-) Impuestos y Retenciones</span>
                    <span>{formatCurrency(pnl.taxes)}</span>
                </div>

                <div className="border-t-2 border-slate-800 my-2"></div>

                {/* Utilidad Neta */}
                <div className={`flex justify-between items-center py-4 px-6 -mx-2 rounded-lg mt-2 shadow-sm ${pnl.netIncome >= 0 ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                    <div>
                        <span className="font-bold text-xl">(=) Utilidad Neta</span>
                        <p className="text-xs opacity-80 font-normal mt-0.5">Resultado final de bolsillo</p>
                    </div>
                    <span className="font-bold text-3xl">{formatCurrency(pnl.netIncome)}</span>
                </div>
            </div>
        </div>

        {/* --- Break Even Analysis --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Punto de Equilibrio
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 text-sm">Costos Fijos Totales</span>
                        <span className="font-bold text-gray-800">{formatCurrency(summary.fixedCosts)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 text-sm">Margen Contribución</span>
                        <span className="font-bold text-blue-600">{((summary.grossMargin / summary.totalIncome) * 100 || 0).toFixed(1)}%</span>
                    </div>
                    
                    <div className="relative pt-6">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Ventas Actuales</span>
                            <span>Meta Equilibrio</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className={`h-2.5 rounded-full ${summary.totalIncome >= summary.breakEvenPoint ? 'bg-green-500' : 'bg-orange-500'}`} 
                                style={{ width: `${Math.min((summary.totalIncome / (summary.breakEvenPoint || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-right text-xs mt-1 font-bold text-indigo-700">{formatCurrency(summary.breakEvenPoint)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" /> Cash Flow
                    </h3>
                    <span className="text-xs bg-white border px-2 py-0.5 rounded text-gray-500">Últimos meses</span>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">Mes</th>
                                <th className="px-4 py-2 text-xs font-bold text-gray-400 uppercase text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monthlyData.map((d) => (
                                <tr key={d.month} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-mono text-gray-600">{d.month}</td>
                                    <td className={`px-4 py-2 text-right font-bold ${d.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {formatCurrency(d.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* --- Rentability Indicators --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Margen Neto</p>
                    <h4 className="text-2xl font-bold text-gray-800 mt-2">{pnl.netIncome > 0 && pnl.grossRevenue > 0 ? ((pnl.netIncome/pnl.grossRevenue)*100).toFixed(1) : '0.0'}%</h4>
                </div>
                <div className="w-full bg-gray-100 h-1.5 mt-4 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(((pnl.netIncome/pnl.grossRevenue)*100), 100)}%` }}></div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Eficiencia de Gastos</p>
                    <h4 className="text-2xl font-bold text-gray-800 mt-2">{pnl.grossRevenue > 0 ? ((pnl.totalOperatingExpenses/pnl.grossRevenue)*100).toFixed(1) : '0.0'}%</h4>
                </div>
                <p className="text-xs text-gray-400 mt-2">del ingreso se va en operativa</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Impuestos / Ventas</p>
                    <h4 className="text-2xl font-bold text-gray-800 mt-2">{pnl.grossRevenue > 0 ? ((pnl.taxes/pnl.grossRevenue)*100).toFixed(1) : '0.0'}%</h4>
                </div>
                <p className="text-xs text-gray-400 mt-2">presión tributaria efectiva</p>
            </div>
        </div>
    </div>
  );
};

export default Reports;
