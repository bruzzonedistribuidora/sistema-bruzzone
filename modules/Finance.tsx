
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { GoogleGenAI } from "@google/genai"; // Import GoogleGenAI

import { 
  Wallet, PiggyBank, Target, ArrowUpRight, ArrowDownRight, Zap, Calculator, TrendingUp, Landmark,
  Scaling, FileText, Percent, HandCoins, BarChart3, AlertCircle,
  DollarSign, HardHat, Gauge, ShoppingCart, Banknote, ListChecks,
  Brain, Loader2 // Added Brain and Loader2 for AI assistant
} from 'lucide-react';

// Initialize Gemini API outside the component to avoid re-initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const Finance: React.FC = () => {
  const [savingsRate, setSavingsRate] = useState(15); // % de ahorro sugerido
  
  // New state for Break-even Point calculation
  const [fixedCosts, setFixedCosts] = useState(1500000); // Costos Fijos
  const [unitPrice, setUnitPrice] = useState(1000); // Precio de Venta Unitario
  const [unitVariableCost, setUnitVariableCost] = useState(600); // Costo Variable Unitario

  // New state for Income Statement period
  const [incomeStatementPeriod, setIncomeStatementPeriod] = useState('month-current');
  // New state for Comparative Analysis period
  const [comparativePeriod, setComparativePeriod] = useState('month-current');

  // New states for AI Assistant
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const dataVentas = [
    { name: 'Ene', real: 4000, meta: 3800 },
    { name: 'Feb', real: 3000, meta: 3800 },
    { name: 'Mar', real: 5000, meta: 4500 },
    { name: 'Abr', real: 2780, meta: 4500 },
    { name: 'May', real: 1890, meta: 4500 },
    { name: 'Jun', real: 2390, meta: 4500 },
  ];

  const netProfit = 845000;
  const fortnightlyProfit = netProfit / 2;
  const suggestedSavings = fortnightlyProfit * (savingsRate / 100);

  const dataGastos = [
    { name: 'Sueldos', value: 400 },
    { name: 'Impuestos', value: 300 },
    { name: 'Mercadería', value: 300 },
    { name: 'Servicios', value: 200 },
  ];

  const COLORS = ['#f97316', '#64748b', '#3b82f6', '#10b981'];

  // --- Calculations for Break-even Point ---
  const breakEvenPoint = useMemo(() => {
    const contributionMarginPerUnit = unitPrice - unitVariableCost;
    if (contributionMarginPerUnit <= 0) {
      return { units: 0, salesValue: 0, isValid: false };
    }
    const units = fixedCosts / contributionMarginPerUnit;
    const salesValue = units * unitPrice;
    return { units: Math.round(units), salesValue: Math.round(salesValue), isValid: true };
  }, [fixedCosts, unitPrice, unitVariableCost]);

  // --- Mock Data for Income Statement (Estado de Resultados), Expenses, and Purchases ---
  const getFinancialData = (period: string) => {
    // In a real app, this would fetch actual data based on the period
    const revenueFactor = period === 'month-previous' ? 0.9 : (period === 'quarter-previous' ? 2.5 : 1);
    const baseRevenue = 5000000 * revenueFactor;
    const baseCMVC = baseRevenue * 0.60; // 60% Cost of Goods Sold

    const fixedExpenses = {
      rent: 150000,
      salaries: 300000,
      utilities: 50000,
      insurance: 20000,
      depreciation: 10000,
      total: 530000
    };
    fixedExpenses.total = fixedExpenses.rent + fixedExpenses.salaries + fixedExpenses.utilities + fixedExpenses.insurance + fixedExpenses.depreciation;


    const variableExpenses = {
      commissions: baseRevenue * 0.03, // 3% of revenue
      shipping: baseRevenue * 0.02,    // 2% of revenue
      packaging: baseRevenue * 0.01,   // 1% of revenue
      marketing: baseRevenue * 0.02,   // 2% of revenue
      total: 0
    };
    variableExpenses.total = variableExpenses.commissions + variableExpenses.shipping + variableExpenses.packaging + variableExpenses.marketing;

    const operatingExpenses = fixedExpenses.total + variableExpenses.total; // Total Operating Expenses
    const otherIncomeExpenses = baseRevenue * 0.01; // 1%
    const baseTaxes = baseRevenue * 0.02; // 2%

    const grossProfit = baseRevenue - baseCMVC;
    const operatingResult = grossProfit - operatingExpenses;
    const netIncome = operatingResult + otherIncomeExpenses - baseTaxes;

    const totalPurchases = baseCMVC * 1.05; // Purchases slightly higher than CMVC due to inventory build-up or timing

    return {
      revenue: baseRevenue,
      cmvc: baseCMVC,
      grossProfit: grossProfit,
      operatingExpenses: operatingExpenses,
      fixedExpenses: fixedExpenses,
      variableExpenses: variableExpenses,
      operatingResult: operatingResult,
      otherIncomeExpenses: otherIncomeExpenses,
      taxes: netIncome > 0 ? baseTaxes : 0, // Only pay taxes if profitable
      netIncome: netIncome,
      totalPurchases: totalPurchases,
      purchaseBreakdown: [
        { name: 'Mercadería', value: totalPurchases * 0.70 },
        { name: 'Suministros', value: totalPurchases * 0.20 },
        { name: 'Otros', value: totalPurchases * 0.10 },
      ]
    };
  };
  const currentFinancialData = getFinancialData(incomeStatementPeriod);

  // --- Mock Data for Profitability Panel ---
  const profitabilityMetrics = useMemo(() => {
    const { revenue, grossProfit, netIncome } = currentFinancialData;
    return {
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      netMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
      roa: 8.5, // Mock data
      roe: 15.2, // Mock data
    };
  }, [currentFinancialData]);

  // --- Mock Data for Comparative Analysis ---
  const getComparativeData = (period: string) => {
    // This would ideally fetch actual data for two periods
    const currentData = getFinancialData(period);
    const prevPeriodKey = period === 'month-current' ? 'month-previous' : 'quarter-previous'; // Simplified logic for mock
    const previousData = getFinancialData(prevPeriodKey); 

    return {
      current: {
        label: period === 'month-current' ? 'Mes Actual' : (period === 'quarter-current' ? 'Trimestre Actual' : 'Periodo Actual'),
        sales: currentData.revenue,
        grossProfit: currentData.grossProfit,
        netIncome: currentData.netIncome,
        operatingExpenses: currentData.operatingExpenses,
      },
      previous: {
        label: prevPeriodKey === 'month-previous' ? 'Mes Anterior' : (prevPeriodKey === 'quarter-previous' ? 'Trimestre Anterior' : 'Periodo Anterior'),
        sales: previousData.revenue,
        grossProfit: previousData.grossProfit,
        netIncome: previousData.netIncome,
        operatingExpenses: previousData.operatingExpenses,
      }
    };
  };
  const comparativeAnalysisData = getComparativeData(comparativePeriod);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? Infinity : 0; // Handle division by zero
    const change = ((current - previous) / previous) * 100;
    return isNaN(change) ? 0 : change;
  };

  // Handle AI Consultation
  const handleAiConsult = async () => {
    if (!aiPrompt.trim()) {
      setAiResponse('Por favor, ingresa una pregunta.');
      return;
    }
    setIsAiLoading(true);
    setAiResponse('');

    // Prepare financial context for the AI
    const financialContext = `
    Contexto Financiero de la Empresa (FerroGest):
    - Mes actual: ${incomeStatementPeriod === 'month-current' ? 'Mayo 2024' : 'N/A'}
    - Punto de Equilibrio:
      - Unidades: ${breakEvenPoint.units.toLocaleString()}
      - Ventas ($): $${breakEvenPoint.salesValue.toLocaleString()}
      - Costos Fijos: $${fixedCosts.toLocaleString()}
      - Precio Venta Unitario: $${unitPrice.toLocaleString()}
      - Costo Variable Unitario: $${unitVariableCost.toLocaleString()}
    - Resumen de Ingresos (Periodo Actual):
      - Total Ingresos por Ventas: $${currentFinancialData.revenue.toLocaleString()}
      - Ganancia Bruta (CMVC): $${currentFinancialData.grossProfit.toLocaleString()}
    - Resumen de Compras (Periodo Actual):
      - Total Compras: $${currentFinancialData.totalPurchases.toLocaleString()}
    - Estado de Resultados (Periodo Actual):
      - Ingresos por Ventas: $${currentFinancialData.revenue.toLocaleString()}
      - Costo de Mercadería Vendida (CMVC): $${currentFinancialData.cmvc.toLocaleString()}
      - Ganancia Bruta: $${currentFinancialData.grossProfit.toLocaleString()}
      - Gastos Operativos (Fijos + Variables): $${currentFinancialData.operatingExpenses.toLocaleString()}
      - Resultado Operativo (EBIT): $${currentFinancialData.operatingResult.toLocaleString()}
      - Otros Ingresos/Egresos: $${currentFinancialData.otherIncomeExpenses.toLocaleString()}
      - Impuestos (Estimado): $${currentFinancialData.taxes.toLocaleString()}
      - Utilidad Neta del Período: $${currentFinancialData.netIncome.toLocaleString()}
    - Métricas de Rentabilidad:
      - Margen Bruto: ${profitabilityMetrics.grossMargin.toFixed(2)}%
      - Margen Neto: ${profitabilityMetrics.netMargin.toFixed(2)}%
      - ROA: ${profitabilityMetrics.roa.toFixed(2)}%
      - ROE: ${profitabilityMetrics.roe.toFixed(2)}%
    - Ahorro Sugerido (Quincenal): $${suggestedSavings.toLocaleString()}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview", // Use a pro model for complex analysis
        contents: aiPrompt, // Pass user's prompt directly as `contents`
        config: {
          systemInstruction: `Eres un asesor financiero profesional para una ferretería llamada FerroGest. Tu objetivo es proporcionar consejos financieros perspicaces y accionables basados en los datos proporcionados. Sé conciso, claro y enfócate en recomendaciones prácticas. Responde en español y utiliza el contexto financiero que se te proporciona para fundamentar tus respuestas. Si la pregunta requiere más información de la que tienes, indícalo. Aquí hay un resumen de los datos financieros actuales de la empresa:\n${financialContext}\n\nTu tarea es responder a la siguiente pregunta del usuario:`,
        },
      });
      setAiResponse(response.text || 'No se pudo generar una respuesta.');
    } catch (error) {
      console.error("Error al consultar a la IA:", error);
      setAiResponse('Lo siento, hubo un error al conectar con el asistente de IA. Por favor, verifica tu clave API y tu conexión.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const promptSuggestions = [
    "¿Debo reponer inventario de forma agresiva este mes?",
    "¿Cómo puedo mejorar el margen de ganancia neta?",
    "¿Qué impacto tiene el costo variable unitario en mi punto de equilibrio?",
    "Analiza mis gastos fijos y variables y dame una recomendación.",
    "¿Qué tipo de productos debo priorizar para la venta?"
  ];


  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inteligencia Financiera</h1>
          <p className="text-slate-500">Rentabilidad, flujo de caja y proyección de ahorro.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-slate-200 px-6 py-2.5 rounded-xl flex items-center gap-4 shadow-sm">
             <div className="text-right">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Bancos</p>
               <p className="text-sm font-black text-blue-600">$1.450.200</p>
             </div>
             <div className="h-8 w-px bg-slate-100"></div>
             <div className="text-right">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Caja</p>
               <p className="text-sm font-black text-orange-600">$245.300</p>
             </div>
          </div>
        </div>
      </header>

      {/* Widget de Ahorro / Inversión Quincenal (Existing) */}
      <section className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-600 rounded-[1.5rem] shadow-xl shadow-orange-600/30">
                    <PiggyBank className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Fondo de Reserva</h3>
                    <p className="text-slate-400 text-sm font-medium">Planificación de ahorro e inversión quincenal.</p>
                  </div>
               </div>
               
               <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-300">Tasa de Ahorro Sugerida:</span>
                     <span className="px-4 py-1 bg-orange-600 rounded-full font-black text-sm">{savingsRate}%</span>
                  </div>
                  <input 
                    type="range" min="5" max="50" step="5"
                    value={savingsRate}
                    onChange={(e) => setSavingsRate(parseInt(e.target.value))}
                    className="w-full accent-orange-600" 
                  />
                  <p className="text-[10px] text-slate-500 font-medium italic">
                    Calculado sobre la rentabilidad neta real de los últimos 15 días operacionales.
                  </p>
               </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white rounded-[2.5rem] p-8 text-slate-900 shadow-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Utilidad Neta (15 días)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black">${fortnightlyProfit.toLocaleString()}</span>
                    <span className="text-green-500 font-bold text-xs">+8.2%</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Salud: Óptima</span>
                     </div>
                     <button className="text-[10px] font-black text-orange-600 uppercase hover:underline">Ver Detalle</button>
                  </div>
               </div>

               <div className="bg-orange-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-600/20 relative group">
                  <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest mb-2">Destino: Ahorro/Inversión</p>
                  <span className="text-4xl font-black">${suggestedSavings.toLocaleString()}</span>
                  <p className="text-xs font-medium text-orange-100 mt-2 opacity-80 leading-relaxed">
                    Sugerencia de retiro de dividendos para reinversión en mercadería o reserva de capital.
                  </p>
                  <button className="mt-6 w-full py-3 bg-white text-orange-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    Programar Transferencia
                  </button>
               </div>
            </div>
         </div>
         <Landmark className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 -rotate-12" />
      </section>

      {/* Punto de Equilibrio */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <Scaling className="w-6 h-6 text-blue-600" /> Análisis de Punto de Equilibrio
        </h3>
        <p className="text-slate-500 text-sm">Calcula cuántas unidades necesitas vender para cubrir tus costos.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costos Fijos Totales ($)</label>
            <input 
              type="number" 
              value={fixedCosts}
              onChange={e => setFixedCosts(Number(e.target.value) || 0)}
              className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio de Venta Unitario ($)</label>
            <input 
              type="number" 
              value={unitPrice}
              onChange={e => setUnitPrice(Number(e.target.value) || 0)}
              className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Variable Unitario ($)</label>
            <input 
              type="number" 
              value={unitVariableCost}
              onChange={e => setUnitVariableCost(Number(e.target.value) || 0)}
              className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
            />
          </div>
        </div>

        {!breakEvenPoint.isValid && unitPrice <= unitVariableCost && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-700">El precio de venta unitario debe ser mayor al costo variable unitario.</p>
          </div>
        )}

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resultados</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
              <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Punto de Equilibrio (Unidades)</p>
              <p className="text-3xl font-black text-blue-900">
                {breakEvenPoint.isValid ? breakEvenPoint.units.toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 text-center">
              <p className="text-[9px] font-black text-orange-600 uppercase mb-1">Punto de Equilibrio (Ventas $)</p>
              <p className="text-3xl font-black text-orange-900">
                {breakEvenPoint.isValid ? `$${breakEvenPoint.salesValue.toLocaleString()}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Ingresos Overview */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <Banknote className="w-6 h-6 text-green-600" /> Resumen de Ingresos
          </h3>
          <select 
            value={incomeStatementPeriod}
            onChange={(e) => setIncomeStatementPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white"
          >
            <option value="month-current">Mes Actual</option>
            <option value="month-previous">Mes Anterior</option>
            <option value="quarter-previous">Último Trimestre</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <p className="text-[10px] font-black text-green-600 uppercase mb-1">Total Ingresos por Ventas</p>
            <p className="text-3xl font-black text-green-900">${currentFinancialData.revenue.toLocaleString()}</p>
            <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +{calculatePercentageChange(currentFinancialData.revenue, getFinancialData('month-previous').revenue).toFixed(2)}% vs {incomeStatementPeriod === 'month-current' ? 'mes anterior' : 'periodo anterior'}
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Ganancia Bruta (CMVC)</p>
            <p className="text-3xl font-black text-blue-900">${currentFinancialData.grossProfit.toLocaleString()}</p>
            <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +{calculatePercentageChange(currentFinancialData.grossProfit, getFinancialData('month-previous').grossProfit).toFixed(2)}% vs {incomeStatementPeriod === 'month-current' ? 'mes anterior' : 'periodo anterior'}
            </p>
          </div>
        </div>
      </section>
      
      {/* NEW: Análisis Detallado de Gastos */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <Gauge className="w-6 h-6 text-red-600" /> Análisis Detallado de Gastos
        </h3>
        <p className="text-slate-500 text-sm">Desglose de costos fijos y variables para el periodo seleccionado.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gastos Fijos */}
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Costos Fijos</h4>
                <p className="text-xs text-slate-500">Gastos constantes, independientemente del volumen de ventas.</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-600">Alquileres</span>
                <span className="font-bold text-slate-800">${currentFinancialData.fixedExpenses.rent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-600">Salarios Base</span>
                <span className="font-bold text-slate-800">${currentFinancialData.fixedExpenses.salaries.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-600">Servicios Fijos</span>
                <span className="font-bold text-slate-800">${currentFinancialData.fixedExpenses.utilities.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-600">Seguros</span>
                <span className="font-bold text-slate-800">${currentFinancialData.fixedExpenses.insurance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-600">Depreciación</span>
                <span className="font-bold text-slate-800">${currentFinancialData.fixedExpenses.depreciation.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 font-black bg-red-50/50 rounded-lg -mx-2 px-2 mt-2">
                <span className="text-red-700 text-lg">Total Fijos</span>
                <span className="text-red-700 text-lg">${currentFinancialData.fixedExpenses.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Gastos Variables */}
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Costos Variables</h4>
                <p className="text-xs text-slate-500">Gastos que fluctúan con el nivel de actividad o ventas.</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-600">Comisiones por Venta</span>
                <span className="font-bold text-slate-800">${currentFinancialData.variableExpenses.commissions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-600">Costos de Envío</span>
                <span className="font-bold text-slate-800">${currentFinancialData.variableExpenses.shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-600">Materiales de Empaque</span>
                <span className="font-bold text-slate-800">${currentFinancialData.variableExpenses.packaging.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-600">Publicidad y Marketing</span>
                <span className="font-bold text-slate-800">${currentFinancialData.variableExpenses.marketing.toLocaleString()}</span>
              </div>
               {/* Add empty div to align with fixed expenses list length */}
              <div className="py-2"></div> 
              <div className="flex justify-between py-3 font-black bg-blue-50/50 rounded-lg -mx-2 px-2 mt-2">
                <span className="text-blue-700 text-lg">Total Variables</span>
                <span className="text-blue-700 text-lg">${currentFinancialData.variableExpenses.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Resumen de Compras */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-purple-600" /> Resumen de Compras
          </h3>
          <select 
            value={incomeStatementPeriod} // Using same period selector for consistency
            onChange={(e) => setIncomeStatementPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white"
          >
            <option value="month-current">Mes Actual</option>
            <option value="month-previous">Mes Anterior</option>
            <option value="quarter-previous">Último Trimestre</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
            <p className="text-[10px] font-black text-purple-600 uppercase mb-1">Total Compras del Período</p>
            <p className="text-3xl font-black text-purple-900">${currentFinancialData.totalPurchases.toLocaleString()}</p>
            <p className="text-xs text-purple-700 mt-2 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> -{calculatePercentageChange(currentFinancialData.totalPurchases, getFinancialData('month-previous').totalPurchases).toFixed(2)}% vs {incomeStatementPeriod === 'month-current' ? 'mes anterior' : 'periodo anterior'}
            </p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Distribución por Tipo de Compra</p>
            <div className="space-y-2 mt-2">
              {currentFinancialData.purchaseBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="font-bold text-slate-700">{item.name}</span>
                  <span className="font-black text-slate-900">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEW: AI Assistant Section */}
      <section className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
        <Brain className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 -rotate-12" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-orange-600 rounded-[1.5rem] shadow-xl shadow-orange-600/30">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">ASISTENTE IA - ANÁLISIS FINANCIERO PROFESIONAL</h3>
            <p className="text-slate-400 text-sm font-medium">Obtén consejos estratégicos y análisis detallados en tiempo real.</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <textarea
            className="w-full h-32 p-5 bg-white/10 border border-white/20 rounded-2xl text-white font-medium placeholder-slate-400 focus:ring-2 focus:ring-orange-500 outline-none resize-none custom-scrollbar"
            placeholder="Pregúntale a la IA sobre tu negocio... Ej: ¿Debería invertir en más inventario ahora? ¿Cómo optimizo mis costos?"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          ></textarea>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            <button
              onClick={handleAiConsult}
              disabled={isAiLoading}
              className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Brain className="w-6 h-6" />}
              {isAiLoading ? 'Pensando...' : 'Consultar a la IA'}
            </button>
            <div className="flex-1 flex flex-wrap justify-center md:justify-end gap-2">
              {promptSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setAiPrompt(suggestion)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/20 transition-all whitespace-nowrap"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {aiResponse && (
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in duration-300 custom-scrollbar max-h-60">
              {aiResponse}
            </div>
          )}
        </div>
      </section>

      {/* Estado de Resultados Económico (Income Statement) - Existing, now using currentFinancialData */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <FileText className="w-6 h-6 text-orange-600" /> Estado de Resultados Económico
          </h3>
          <select 
            value={incomeStatementPeriod}
            onChange={(e) => setIncomeStatementPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white"
          >
            <option value="month-current">Mes Actual</option>
            <option value="month-previous">Mes Anterior</option>
            <option value="quarter-previous">Último Trimestre</option>
          </select>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex justify-between items-center py-3">
            <span className="font-bold text-slate-800 text-lg">Ingresos por Ventas</span>
            <span className="font-black text-slate-900 text-lg">${currentFinancialData.revenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-slate-600 font-medium ml-4">(-) Costo de Mercadería Vendida (CMVC)</span>
            <span className="text-slate-600 font-medium">-${currentFinancialData.cmvc.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 font-black bg-slate-50/50 rounded-lg -mx-2 px-2">
            <span className="text-green-700 text-xl">Ganancia Bruta</span>
            <span className="text-green-700 text-xl">${currentFinancialData.grossProfit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-slate-600 font-medium ml-4">(-) Gastos Operativos (Fijos + Variables)</span>
            <span className="text-slate-600 font-medium">-${currentFinancialData.operatingExpenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 font-bold">
            <span className="text-slate-800 text-lg">Resultado Operativo (EBIT)</span>
            <span className="text-slate-900 text-lg">${currentFinancialData.operatingResult.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-slate-600 font-medium ml-4">(+/-) Otros Ingresos/Egresos</span>
            <span className="text-slate-600 font-medium">${currentFinancialData.otherIncomeExpenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-slate-600 font-medium ml-4">(-) Impuestos (Estimado)</span>
            <span className="text-slate-600 font-medium">-${currentFinancialData.taxes.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-3 font-black bg-orange-50/50 rounded-lg -mx-2 px-2">
            <span className="text-orange-700 text-2xl">Utilidad Neta del Período</span>
            <span className="text-orange-700 text-2xl">${currentFinancialData.netIncome.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* Panel de Rentabilidad */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="p-3 bg-green-100 text-green-600 rounded-2xl w-fit mb-4">
            <Percent className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Margen Bruto</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{profitabilityMetrics.grossMargin.toFixed(2)}%</h3>
          <p className="text-xs text-slate-500">Sobre ingresos por ventas.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl w-fit mb-4">
            <Target className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Margen Neto</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{profitabilityMetrics.netMargin.toFixed(2)}%</h3>
          <p className="text-xs text-slate-500">Utilidad final después de todos los costos.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl w-fit mb-4">
            <HandCoins className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">ROA (Retorno Activos)</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{profitabilityMetrics.roa.toFixed(2)}%</h3>
          <p className="text-xs text-slate-500">Eficiencia en el uso de los activos.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl w-fit mb-4">
            <LineChart width={24} height={24} data={[{uv:10,pv:20}]}>
              <Line type="monotone" dataKey="uv" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">ROE (Retorno Patrimonio)</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{profitabilityMetrics.roe.toFixed(2)}%</h3>
          <p className="text-xs text-slate-500">Rentabilidad para los accionistas.</p>
        </div>
      </section>

      {/* Análisis Comparativo */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-600" /> Análisis Comparativo de Períodos
          </h3>
          <select 
            value={comparativePeriod}
            onChange={(e) => setComparativePeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white"
          >
            <option value="month-current">Mes Actual vs Anterior</option>
            <option value="quarter-current">Trimestre Actual vs Anterior</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Métrica</th>
                <th className="px-6 py-4 text-right">{comparativeAnalysisData.previous.label}</th>
                <th className="px-6 py-4 text-right">{comparativeAnalysisData.current.label}</th>
                <th className="px-6 py-4 text-right">Variación (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { label: 'Ventas Totales', key: 'sales' },
                { label: 'Ganancia Bruta', key: 'grossProfit' },
                { label: 'Utilidad Neta', key: 'netIncome' },
                { label: 'Gastos Operativos', key: 'operatingExpenses' },
              ].map((metric) => {
                const prevValue = (comparativeAnalysisData.previous as any)[metric.key] || 0;
                const currValue = (comparativeAnalysisData.current as any)[metric.key] || 0;
                const change = calculatePercentageChange(currValue, prevValue);
                const isPositive = change >= 0;
                const isExpense = metric.key === 'operatingExpenses';

                return (
                  <tr key={metric.key} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">{metric.label}</td>
                    <td className="px-6 py-4 text-right text-slate-600">${prevValue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">${currValue.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-right font-black text-sm ${
                      isExpense 
                        ? (isPositive ? 'text-red-600' : 'text-green-600') 
                        : (isPositive ? 'text-green-600' : 'text-red-600')
                    }`}>
                      {change.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>


      {/* Existing Widgets (repositioned for better flow) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-green-100 rounded-2xl">
            <Target className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Margen Neto Real</p>
            <h3 className="text-3xl font-bold text-slate-800">22.4%</h3>
            <p className="text-xs text-green-600 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +2.1% vs mes anterior
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-blue-100 rounded-2xl text-blue-600">
            <Calculator className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Punto de Equilibrio</p>
            <h3 className="text-3xl font-bold text-slate-800">$2.8M</h3>
            <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-2">
               <div className="bg-blue-500 h-full rounded-full" style={{width: '70%'}}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-orange-100 rounded-2xl">
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Efectivo Disponible</p>
            <h3 className="text-3xl font-bold text-slate-800">$845.000</h3>
            <p className="text-xs text-orange-600 font-bold">Total consolidado cajas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Ventas vs Meta Proyectada</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataVentas}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="real" fill="#f97316" radius={[4, 4, 0, 0]} name="Venta Real" />
                <Bar dataKey="meta" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución de Egresos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataGastos}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataGastos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
    