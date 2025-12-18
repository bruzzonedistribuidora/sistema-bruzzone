
import React, { useState, useMemo } from 'react';
import { Calculator, FileText, BookOpen, PieChart, CreditCard, Landmark, Plus, Search, Calendar, ChevronRight, Download, Upload, TrendingUp, Target, Activity, DollarSign, ArrowUpRight, ArrowDownRight, Filter, Settings } from 'lucide-react';
import { JournalEntry } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line, ComposedChart, ReferenceLine } from 'recharts';

const Accounting: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'IMPUESTOS' | 'LIBROS' | 'ASIENTOS' | 'RESULTADOS' | 'EQUILIBRIO' | 'CASHFLOW' | 'RENTABILIDAD'>('IMPUESTOS');
  const [citiPeriod, setCitiPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [entries, setEntries] = useState<JournalEntry[]>([
      { id: 'AS-001', date: '2023-10-01', concept: 'Apertura de Caja', debit: 100000, credit: 100000, details: [] },
      { id: 'AS-002', date: '2023-10-02', concept: 'Ventas del Día', debit: 54000, credit: 54000, details: [] },
  ]);

  // --- STATE FOR BREAK-EVEN POINT ---
  const [beFixedCosts, setBeFixedCosts] = useState(1500000);
  const [beAvgTicket, setBeAvgTicket] = useState(15000);
  const [beVarCostPerc, setBeVarCostPerc] = useState(60); // 60% variable cost

  // --- MOCK DATA GENERATORS ---
  const generateCashFlowData = () => [
      { name: 'Sem 1', ingresos: 450000, egresos: 320000, neto: 130000 },
      { name: 'Sem 2', ingresos: 520000, egresos: 480000, neto: 40000 },
      { name: 'Sem 3', ingresos: 480000, egresos: 250000, neto: 230000 },
      { name: 'Sem 4', ingresos: 610000, egresos: 300000, neto: 310000 },
  ];

  const generateProfitabilityData = () => [
      { name: 'Ene', margenBruto: 35, margenNeto: 12 },
      { name: 'Feb', margenBruto: 34, margenNeto: 11 },
      { name: 'Mar', margenBruto: 38, margenNeto: 15 },
      { name: 'Abr', margenBruto: 36, margenNeto: 14 },
      { name: 'May', margenBruto: 40, margenNeto: 18 },
      { name: 'Jun', margenBruto: 42, margenNeto: 20 },
  ];

  const calculateBreakEvenData = useMemo(() => {
      const data = [];
      const contributionMargin = beAvgTicket * (1 - beVarCostPerc / 100);
      const breakEvenUnits = beFixedCosts / contributionMargin;
      
      // Generate points around break even
      const steps = 10;
      const maxUnits = breakEvenUnits * 2;
      
      for(let i=0; i<=steps; i++) {
          const units = Math.round((maxUnits / steps) * i);
          const revenue = units * beAvgTicket;
          const totalCost = beFixedCosts + (units * beAvgTicket * (beVarCostPerc / 100));
          data.push({
              units,
              revenue,
              totalCost,
              profit: revenue - totalCost
          });
      }
      return { data, breakEvenUnits, breakEvenRevenue: breakEvenUnits * beAvgTicket };
  }, [beFixedCosts, beAvgTicket, beVarCostPerc]);


  const handleDownloadCiti = (type: 'CBTE' | 'ALICUOTAS') => {
      alert(`Archivo ${type} generado correctamente para importar en AFIP.`);
  };

  return (
    <div className="flex h-full bg-gray-100">
      {/* Sidebar Local */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
          <div className="p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Calculator size={20} className="text-ferre-orange"/> Contabilidad</h2>
          </div>
          <nav className="p-4 space-y-1">
              <div className="text-xs font-bold text-gray-400 uppercase mb-2 mt-2 px-3">Gestión Fiscal</div>
              <button onClick={() => setActiveSection('IMPUESTOS')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${activeSection === 'IMPUESTOS' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3"><Landmark size={18}/> Impuestos y Tasas</div>
                  {activeSection === 'IMPUESTOS' && <ChevronRight size={14}/>}
              </button>
              <button onClick={() => setActiveSection('LIBROS')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${activeSection === 'LIBROS' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3"><BookOpen size={18}/> Libros Contables</div>
                  {activeSection === 'LIBROS' && <ChevronRight size={14}/>}
              </button>
              <button onClick={() => setActiveSection('ASIENTOS')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${activeSection === 'ASIENTOS' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3"><FileText size={18}/> Asientos Manuales</div>
                  {activeSection === 'ASIENTOS' && <ChevronRight size={14}/>}
              </button>

              <div className="text-xs font-bold text-gray-400 uppercase mb-2 mt-6 px-3">Análisis Financiero</div>
              <button onClick={() => setActiveSection('RESULTADOS')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${activeSection === 'RESULTADOS' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3"><FileText size={18}/> Estado de Resultados</div>
                  {activeSection === 'RESULTADOS' && <ChevronRight size={14}/>}
              </button>
              <button onClick={() => setActiveSection('CASHFLOW')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${activeSection === 'CASHFLOW' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3"><Activity size={18}/> Flujo de Caja</div>
                  {activeSection === 'CASHFLOW' && <ChevronRight size={14}/>}
              </button>
              <button onClick={() => setActiveSection('EQUILIBRIO')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${activeSection === 'EQUILIBRIO' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3"><Target size={18}/> Punto de Equilibrio</div>
                  {activeSection === 'EQUILIBRIO' && <ChevronRight size={14}/>}
              </button>
              <button onClick={() => setActiveSection('RENTABILIDAD')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${activeSection === 'RENTABILIDAD' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3"><TrendingUp size={18}/> Panel Rentabilidad</div>
                  {activeSection === 'RENTABILIDAD' && <ChevronRight size={14}/>}
              </button>
          </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-auto">
          {activeSection === 'IMPUESTOS' && (
              <div className="space-y-6 animate-fade-in">
                  <h3 className="text-2xl font-bold text-gray-800">Liquidación de Impuestos</h3>
                  <div className="grid grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h4 className="font-bold text-gray-700 mb-2">IVA Ventas / Compras</h4>
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                              <div className="flex justify-between"><span>Débito Fiscal:</span> <span className="font-bold text-red-500">$1,200,000</span></div>
                              <div className="flex justify-between"><span>Crédito Fiscal:</span> <span className="font-bold text-green-500">$950,000</span></div>
                              <div className="border-t pt-2 flex justify-between font-bold text-gray-800"><span>A Pagar:</span> <span>$250,000</span></div>
                          </div>
                          <button className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">Generar Libro IVA Digital</button>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h4 className="font-bold text-gray-700 mb-2">Ingresos Brutos (IIBB)</h4>
                          <p className="text-sm text-gray-500 mb-4">Cálculo automático s/jurisdicción.</p>
                          <div className="text-3xl font-bold text-gray-800 mb-4">$54,320</div>
                          <button className="w-full border border-gray-300 text-gray-700 py-2 rounded text-sm hover:bg-gray-50">Ver Retenciones Sufridas</button>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h4 className="font-bold text-gray-700 mb-2">Tasa Municipal</h4>
                          <p className="text-sm text-gray-500 mb-4">Declaración jurada mensual.</p>
                          <div className="text-3xl font-bold text-gray-800 mb-4">$12,100</div>
                          <button className="w-full border border-gray-300 text-gray-700 py-2 rounded text-sm hover:bg-gray-50">Imprimir DDJJ</button>
                      </div>
                  </div>

                  {/* CITI VENTAS EXPORT SECTION */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-start gap-4">
                          <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                              <FileText size={24} />
                          </div>
                          <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-800">Exportación CITI Ventas / Libro IVA Digital</h4>
                              <p className="text-sm text-gray-500 mb-4">Generación de archivos TXT para importación en aplicativo AFIP o sistemas contables (Holistor, Bejerman, etc).</p>
                              
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 flex items-center gap-4">
                                  <div className="flex-1">
                                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Periodo Fiscal</label>
                                      <input 
                                        type="month" 
                                        value={citiPeriod} 
                                        onChange={(e) => setCitiPeriod(e.target.value)}
                                        className="border border-gray-300 rounded p-2 text-sm w-full bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                                      />
                                  </div>
                                  <div className="flex items-end gap-3">
                                      <button 
                                        onClick={() => handleDownloadCiti('CBTE')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors text-sm font-medium">
                                          <Download size={16}/> Comprobantes (Ventas)
                                      </button>
                                      <button 
                                        onClick={() => handleDownloadCiti('ALICUOTAS')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors text-sm font-medium">
                                          <Download size={16}/> Alícuotas (Ventas)
                                      </button>
                                  </div>
                              </div>
                              <p className="text-xs text-gray-400 italic">
                                  * El sistema genera los archivos respetando el diseño de registro de AFIP (Rg. 3685).
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeSection === 'ASIENTOS' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold text-gray-800">Libro Diario / Asientos</h3>
                      <button className="bg-ferre-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 text-sm font-medium">
                          <Plus size={16} /> Nuevo Asiento Manual
                      </button>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                              <tr>
                                  <th className="px-6 py-3">Fecha</th>
                                  <th className="px-6 py-3">Concepto</th>
                                  <th className="px-6 py-3 text-right">Debe</th>
                                  <th className="px-6 py-3 text-right">Haber</th>
                                  <th className="px-6 py-3 text-center"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {entries.map(entry => (
                                  <tr key={entry.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{entry.date}</td>
                                      <td className="px-6 py-4 font-bold text-gray-800">{entry.concept}</td>
                                      <td className="px-6 py-4 text-right font-mono text-gray-800">${entry.debit.toLocaleString('es-AR')}</td>
                                      <td className="px-6 py-4 text-right font-mono text-gray-800">${entry.credit.toLocaleString('es-AR')}</td>
                                      <td className="px-6 py-4 text-center">
                                          <button className="text-blue-600 text-xs font-bold hover:underline">Ver Detalle</button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeSection === 'LIBROS' && (
               <div className="space-y-6 animate-fade-in">
                  <h3 className="text-2xl font-bold text-gray-800">Libros Contables</h3>
                  <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md cursor-pointer">
                          <BookOpen size={32} className="text-blue-600 mb-4"/>
                          <h4 className="font-bold text-lg">Libro Mayor</h4>
                          <p className="text-sm text-gray-500 mt-2">Consulta de saldos por cuenta contable.</p>
                      </div>
                       <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md cursor-pointer">
                          <FileText size={32} className="text-green-600 mb-4"/>
                          <h4 className="font-bold text-lg">Plan de Cuentas</h4>
                          <p className="text-sm text-gray-500 mt-2">Configuración de jerarquía de cuentas (Activo, Pasivo, etc).</p>
                      </div>
                  </div>
               </div>
          )}

          {/* --- ESTADO DE RESULTADOS (P&L) --- */}
          {activeSection === 'RESULTADOS' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold text-gray-800">Estado de Resultados (P&L)</h3>
                      <div className="flex items-center gap-2">
                          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"><Calendar size={16}/> Este Mes</button>
                          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"><Filter size={16}/> Filtros</button>
                      </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-6 border-b border-gray-100 flex justify-between">
                          <span className="font-bold text-lg text-gray-700">Ingresos Operativos</span>
                          <span className="font-bold text-lg text-gray-900">$15,450,000</span>
                      </div>
                      <div className="bg-slate-50 p-4 border-b border-gray-100 pl-8 text-sm">
                          <div className="flex justify-between py-1"><span>Ventas Brutas</span> <span>$18,200,000</span></div>
                          <div className="flex justify-between py-1 text-red-500"><span>Notas de Crédito / Devoluciones</span> <span>-$2,750,000</span></div>
                      </div>

                      <div className="p-6 border-b border-gray-100 flex justify-between bg-red-50/30">
                          <span className="font-bold text-lg text-red-700">Costo de Ventas (CMV)</span>
                          <span className="font-bold text-lg text-red-700">-$9,200,000</span>
                      </div>

                      <div className="p-6 border-b border-gray-100 flex justify-between bg-blue-50/50">
                          <span className="font-bold text-xl text-blue-800">Utilidad Bruta</span>
                          <span className="font-bold text-xl text-blue-800">$6,250,000</span>
                      </div>

                      <div className="p-6 border-b border-gray-100">
                          <div className="flex justify-between font-bold text-gray-700 mb-2">
                              <span>Gastos Operativos</span>
                              <span>-$2,150,000</span>
                          </div>
                          <div className="pl-4 text-sm text-gray-600 space-y-1">
                              <div className="flex justify-between"><span>Sueldos y Cargas Sociales</span> <span>-$1,200,000</span></div>
                              <div className="flex justify-between"><span>Alquileres</span> <span>-$350,000</span></div>
                              <div className="flex justify-between"><span>Servicios (Luz, Agua, Internet)</span> <span>-$150,000</span></div>
                              <div className="flex justify-between"><span>Marketing y Publicidad</span> <span>-$450,000</span></div>
                          </div>
                      </div>

                      <div className="p-6 border-b border-gray-100 flex justify-between bg-gray-50">
                          <span className="font-bold text-gray-700">Resultado Operativo (EBITDA)</span>
                          <span className="font-bold text-gray-900">$4,100,000</span>
                      </div>

                      <div className="p-6 border-b border-gray-100 text-sm">
                          <div className="flex justify-between text-gray-600"><span>Amortizaciones</span> <span>-$100,000</span></div>
                          <div className="flex justify-between text-gray-600"><span>Intereses Financieros</span> <span>-$50,000</span></div>
                          <div className="flex justify-between text-gray-600"><span>Impuesto a las Ganancias (Est.)</span> <span>-$1,185,000</span></div>
                      </div>

                      <div className="p-6 bg-green-50 flex justify-between items-center">
                          <div>
                              <span className="font-bold text-2xl text-green-800">Resultado Neto</span>
                              <p className="text-xs text-green-600 font-bold uppercase mt-1">Utilidad del Ejercicio</p>
                          </div>
                          <span className="font-bold text-3xl text-green-700">$2,765,000</span>
                      </div>
                  </div>
               </div>
          )}

          {/* --- PUNTO DE EQUILIBRIO --- */}
          {activeSection === 'EQUILIBRIO' && (
              <div className="space-y-6 animate-fade-in h-full flex flex-col">
                  <h3 className="text-2xl font-bold text-gray-800">Análisis de Punto de Equilibrio</h3>
                  
                  <div className="flex gap-6 h-full">
                      {/* Controls */}
                      <div className="w-1/3 space-y-6">
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Settings size={18}/> Variables</h4>
                              
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costos Fijos Totales ($)</label>
                                      <input 
                                        type="number" 
                                        className="w-full p-2 border border-gray-300 rounded font-bold text-gray-700" 
                                        value={beFixedCosts}
                                        onChange={(e) => setBeFixedCosts(Number(e.target.value))}
                                      />
                                      <p className="text-[10px] text-gray-400 mt-1">Alquiler, Sueldos fijos, Servicios.</p>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ticket Promedio ($)</label>
                                      <input 
                                        type="number" 
                                        className="w-full p-2 border border-gray-300 rounded font-bold text-gray-700" 
                                        value={beAvgTicket}
                                        onChange={(e) => setBeAvgTicket(Number(e.target.value))}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Variable Promedio (%)</label>
                                      <div className="flex items-center gap-2">
                                          <input 
                                            type="range" 
                                            min="0" max="100" 
                                            className="flex-1"
                                            value={beVarCostPerc}
                                            onChange={(e) => setBeVarCostPerc(Number(e.target.value))}
                                          />
                                          <span className="font-bold w-12 text-right">{beVarCostPerc}%</span>
                                      </div>
                                      <p className="text-[10px] text-gray-400 mt-1">Costo de mercadería vendida sobre precio.</p>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
                              <h4 className="font-bold text-blue-100 uppercase text-xs mb-2">Punto de Equilibrio</h4>
                              <div className="text-4xl font-bold mb-1">{Math.ceil(calculateBreakEvenData.breakEvenUnits).toLocaleString()} <span className="text-xl font-normal">unidades</span></div>
                              <div className="text-blue-200 text-sm mb-4">Debes vender para no perder dinero.</div>
                              
                              <div className="border-t border-blue-500 pt-4 mt-2">
                                  <div className="flex justify-between items-center">
                                      <span className="text-blue-100 text-sm">Facturación Necesaria</span>
                                      <span className="font-bold text-xl">${calculateBreakEvenData.breakEvenRevenue.toLocaleString('es-AR', {maximumFractionDigits: 0})}</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Chart */}
                      <div className="w-2/3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                          <h4 className="font-bold text-gray-700 mb-4">Proyección de Utilidad</h4>
                          <div className="flex-1 min-h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={calculateBreakEvenData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="units" label={{ value: 'Unidades Vendidas', position: 'insideBottomRight', offset: -10 }} />
                                      <YAxis tickFormatter={(val) => `$${val/1000}k`} />
                                      <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                                      <Legend />
                                      <ReferenceLine x={calculateBreakEvenData.breakEvenUnits} stroke="red" strokeDasharray="3 3" label="Equilibrio" />
                                      <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Ingresos" strokeWidth={2} dot={false} />
                                      <Line type="monotone" dataKey="totalCost" stroke="#ef4444" name="Costos Totales" strokeWidth={2} dot={false} />
                                  </LineChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* --- CASH FLOW --- */}
          {activeSection === 'CASHFLOW' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold text-gray-800">Estado de Flujo de Caja</h3>
                      <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                          <Download size={16}/> Exportar Reporte
                      </button>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ArrowUpRight size={20}/></div>
                              <span className="text-sm font-bold text-gray-500 uppercase">Ingresos Operativos</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-800">$2,060,000</p>
                          <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><TrendingUp size={12}/> +12% vs mes anterior</p>
                      </div>
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-red-100 text-red-600 rounded-lg"><ArrowDownRight size={20}/></div>
                              <span className="text-sm font-bold text-gray-500 uppercase">Egresos Operativos</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-800">$1,350,000</p>
                          <p className="text-xs text-red-600 flex items-center gap-1 mt-1"><TrendingUp size={12}/> +5% vs mes anterior</p>
                      </div>
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Activity size={20}/></div>
                              <span className="text-sm font-bold text-gray-500 uppercase">Flujo Neto del Periodo</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">$710,000</p>
                          <p className="text-xs text-gray-400 mt-1">Disponibilidad generada</p>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
                      <h4 className="font-bold text-gray-700 mb-4">Evolución Semanal</h4>
                      <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={generateCashFlowData()} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid stroke="#f5f5f5" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="ingresos" barSize={20} fill="#10b981" name="Ingresos" />
                              <Bar dataKey="egresos" barSize={20} fill="#ef4444" name="Egresos" />
                              <Line type="monotone" dataKey="neto" stroke="#3b82f6" name="Flujo Neto" strokeWidth={3} />
                          </ComposedChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          )}

          {/* --- PANEL RENTABILIDAD --- */}
          {activeSection === 'RENTABILIDAD' && (
              <div className="space-y-6 animate-fade-in">
                  <h3 className="text-2xl font-bold text-gray-800">Panel de Rentabilidad y KPIs</h3>
                  
                  <div className="grid grid-cols-4 gap-6">
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-2">Margen Bruto</p>
                          <div className="flex items-end gap-2">
                              <span className="text-3xl font-bold text-gray-800">38.5%</span>
                              <span className="text-xs text-green-600 font-bold mb-1">+2%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: '38.5%' }}></div>
                          </div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-2">Margen Neto</p>
                          <div className="flex items-end gap-2">
                              <span className="text-3xl font-bold text-gray-800">15.2%</span>
                              <span className="text-xs text-green-600 font-bold mb-1">+0.5%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                              <div className="bg-green-500 h-full rounded-full" style={{ width: '15.2%' }}></div>
                          </div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-2">ROI (Retorno Inversión)</p>
                          <div className="flex items-end gap-2">
                              <span className="text-3xl font-bold text-gray-800">22%</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Anualizado estimado</p>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-2">EBITDA</p>
                          <div className="flex items-end gap-2">
                              <span className="text-3xl font-bold text-gray-800">$4.1M</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Utilidad antes de intereses e impuestos</p>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-96">
                      <h4 className="font-bold text-gray-700 mb-4">Tendencia de Márgenes (Últimos 6 meses)</h4>
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={generateProfitabilityData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorMb" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorMn" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <XAxis dataKey="name" />
                              <YAxis unit="%" />
                              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                              <Tooltip />
                              <Legend />
                              <Area type="monotone" dataKey="margenBruto" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMb)" name="Margen Bruto %" />
                              <Area type="monotone" dataKey="margenNeto" stroke="#10b981" fillOpacity={1} fill="url(#colorMn)" name="Margen Neto %" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default Accounting;
