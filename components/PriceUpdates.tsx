import React, { useState, useEffect } from 'react';
import { FileUp, FileSpreadsheet, ArrowRight, Settings, CheckCircle, AlertTriangle, ChevronRight, Save, LayoutTemplate, Database, X, List, Plus, Trash2, Edit2, Bookmark, BookmarkPlus, RefreshCw, Layers } from 'lucide-react';
import { Provider, PriceList } from '../types';

interface ColumnMapping {
    code: number | null;
    description: number | null;
    cost: number | null;
    ignored: number[];
}

interface MappingTemplate {
    id: string;
    name: string;
    providerId: string;
    mapping: ColumnMapping;
}

interface MockRow {
    cols: string[];
}

const PriceUpdates: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LISTS' | 'MASS_UPDATE'>('LISTS');

  // --- PRICE LISTS STATE ---
  const [priceLists, setPriceLists] = useState<PriceList[]>([
      { id: '1', name: 'Lista Base (Público)', type: 'BASE', active: true },
      { id: '2', name: 'Gremio / Instalador', type: 'CUSTOM', fixedMargin: 25, active: true },
      { id: '3', name: 'Mayorista', type: 'CUSTOM', fixedMargin: 15, active: true },
  ]);
  
  const [newListOpen, setNewListOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null); 
  const [newListName, setNewListName] = useState('');
  const [newListMargin, setNewListMargin] = useState(30);

  // --- MASS UPDATE STATE ---
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('manual');
  const [fileName, setFileName] = useState<string>('');
  
  // Persistence for Templates
  const [templates, setTemplates] = useState<MappingTemplate[]>(() => {
      const saved = localStorage.getItem('ferrecloud_price_templates');
      return saved ? JSON.parse(saved) : [
          { id: 't1', name: 'Formato Estándar HG', providerId: 'P1', mapping: { code: 0, description: 1, cost: 2, ignored: [3] } }
      ];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_price_templates', JSON.stringify(templates));
  }, [templates]);

  // Providers data
  const providers: Provider[] = [
    { id: 'P1', name: 'Herramientas Global SA', cuit: '30-11223344-5', contact: '', balance: 0, defaultDiscounts: [10,5,0] },
    { id: 'P2', name: 'Pinturas del Centro', cuit: '30-55667788-9', contact: '', balance: 0, defaultDiscounts: [25,0,0] },
    { id: 'P3', name: 'Bulonera Industrial', cuit: '30-99887766-1', contact: '', balance: 0, defaultDiscounts: [0,0,0] },
  ];

  // Mapping State
  const [mapping, setMapping] = useState<ColumnMapping>({ code: null, description: null, cost: null, ignored: [] });
  const [rawPreview, setRawPreview] = useState<MockRow[]>([
      { cols: ['TOR-001', 'Tornillo T1 Autoperforante', '150.00', 'UNIDAD'] },
      { cols: ['TAL-022', 'Taladro Percutor 750w', '85000.00', 'UNIDAD'] },
      { cols: ['LIJ-180', 'Lija al agua 180', '450.00', 'HOJA'] },
      { cols: ['DIS-NEW', 'Producto Nuevo Ejemplo', '1200.00', 'UNIDAD'] }
  ]);

  const [stats] = useState({ totalInFile: 1540, matched: 1250, newItems: 290, discontinued: 45 });
  const [impactData] = useState([
      { code: 'TOR-001', desc: 'Tornillo T1 Autoperforante', oldCost: 120, newCost: 150, variation: 25 },
      { code: 'TAL-022', desc: 'Taladro Percutor 750w', oldCost: 82000, newCost: 85000, variation: 3.65 },
      { code: 'LIJ-180', desc: 'Lija al agua 180', oldCost: 450, newCost: 450, variation: 0 },
  ]);

  // Templates linked to selected provider
  const availableTemplates = templates.filter(t => t.providerId === selectedProvider);

  // --- HANDLERS ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setFileName(file.name);
  };

  const handleTemplateChange = (templateId: string) => {
      setSelectedTemplateId(templateId);
      if (templateId === 'manual') {
          setMapping({ code: null, description: null, cost: null, ignored: [] });
      } else {
          const tmpl = templates.find(t => t.id === templateId);
          if (tmpl) setMapping({ ...tmpl.mapping });
      }
  };

  const handleColumnAssign = (colIndex: number, type: 'code' | 'description' | 'cost' | 'ignore') => {
      const newMapping = { ...mapping };
      // Remove index from existing positions
      if (newMapping.code === colIndex) newMapping.code = null;
      if (newMapping.description === colIndex) newMapping.description = null;
      if (newMapping.cost === colIndex) newMapping.cost = null;

      if (type === 'code') newMapping.code = colIndex;
      else if (type === 'description') newMapping.description = colIndex;
      else if (type === 'cost') newMapping.cost = colIndex;
      
      setMapping(newMapping);
  };

  const saveCurrentAsTemplate = () => {
      const name = prompt("Nombre para esta plantilla (ej: Formato Lista Ofertas):");
      if (!name) return;
      const newTmpl: MappingTemplate = {
          id: `tmpl-${Date.now()}`,
          name,
          providerId: selectedProvider,
          mapping: { ...mapping }
      };
      setTemplates([...templates, newTmpl]);
      setSelectedTemplateId(newTmpl.id);
      alert("Plantilla guardada correctamente para este proveedor.");
  };

  const getColType = (index: number) => {
      if (mapping.code === index) return { label: 'CÓDIGO', color: 'bg-blue-600 text-white border-blue-700' };
      if (mapping.description === index) return { label: 'DESCRIPCIÓN', color: 'bg-yellow-500 text-white border-yellow-600' };
      if (mapping.cost === index) return { label: 'COSTO', color: 'bg-green-600 text-white border-green-700' };
      return { label: 'IGNORAR', color: 'bg-gray-100 text-gray-400 border-gray-200' };
  };

  const handleSaveList = () => {
      if (!newListName) return;
      if (editingListId) {
          setPriceLists(prev => prev.map(list => list.id === editingListId ? { ...list, name: newListName, fixedMargin: newListMargin } : list));
      } else {
          setPriceLists([...priceLists, { id: Date.now().toString(), name: newListName, type: 'CUSTOM', fixedMargin: newListMargin, active: true }]);
      }
      setNewListOpen(false);
  };

  // Fix: Added missing saveUpdates function to finalize the mass update process
  const saveUpdates = () => {
      alert("Actualización de costos procesada con éxito.");
      setStep(1);
      setFileName('');
      setSelectedProvider('');
      setMapping({ code: null, description: null, cost: null, ignored: [] });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Gestión de Precios</h2>
          <p className="text-gray-500 text-sm">Administra tus listas de venta y actualiza costos masivamente.</p>
        </div>
        
        <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('LISTS')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'LISTS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                Listas de Precios
            </button>
            <button 
                onClick={() => setActiveTab('MASS_UPDATE')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'MASS_UPDATE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                Importador Excel
            </button>
        </div>
      </div>

      {activeTab === 'LISTS' && (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-fade-in">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <div>
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><List size={20}/> Mis Listas de Precios</h3>
                      <p className="text-sm text-gray-500">Configura márgenes automáticos sobre tus costos de reposición.</p>
                  </div>
                  <button onClick={() => { setEditingListId(null); setNewListName(''); setNewListMargin(30); setNewListOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 shadow-sm transition-all">
                      <Plus size={18}/> Nueva Lista
                  </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {priceLists.map(list => (
                      <div key={list.id} className={`border rounded-2xl p-6 hover:shadow-lg transition-all relative bg-white group ${list.type === 'BASE' ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-start mb-4">
                              <h4 className="font-bold text-lg text-gray-800">{list.name}</h4>
                              <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase ${list.type === 'BASE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{list.type === 'BASE' ? 'Predeterminada' : 'Personalizada'}</span>
                          </div>
                          <div className="mb-6">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Márgen de Ganancia</p>
                              {list.type === 'BASE' ? <div className="text-2xl font-black text-slate-800">Sujeto a Artículo</div> : <div className="text-4xl font-black text-green-600">+{list.fixedMargin}% <span className="text-sm font-normal text-gray-400">s/ Costo</span></div>}
                          </div>
                          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {list.type !== 'BASE' && (
                                  <>
                                    <button onClick={() => { setEditingListId(list.id); setNewListName(list.name); setNewListMargin(list.fixedMargin||0); setNewListOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Edit2 size={18}/></button>
                                    <button onClick={() => setPriceLists(priceLists.filter(l => l.id !== list.id))} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={18}/></button>
                                  </>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'MASS_UPDATE' && (
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-200 bg-slate-900">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map(i => (
                    <React.Fragment key={i}>
                        <div className={`flex flex-col items-center gap-1 transition-all ${step >= i ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === i ? 'bg-ferre-orange text-white ring-4 ring-orange-500/20' : step > i ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                {step > i ? <CheckCircle size={16}/> : i}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{i===1?'Archivo':i===2?'Mapeo':i===3?'Análisis':'Confirmar'}</span>
                        </div>
                        {i < 4 && <div className={`h-1 flex-1 mx-4 rounded-full transition-all ${step > i ? 'bg-green-500' : 'bg-slate-700'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
          </div>

          {step === 1 && (
              <div className="p-12 flex flex-col items-center justify-center h-full space-y-10 animate-fade-in overflow-y-auto">
                  <div className="w-full max-w-lg space-y-6">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                          <div>
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2">1. Seleccionar Proveedor</label>
                              <select 
                                className="w-full p-4 border-2 border-white rounded-xl bg-white focus:ring-2 focus:ring-ferre-orange outline-none shadow-md font-bold text-gray-700"
                                value={selectedProvider}
                                onChange={(e) => { setSelectedProvider(e.target.value); setSelectedTemplateId('manual'); }}
                              >
                                  <option value="">-- Elija el proveedor --</option>
                                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                          </div>

                          {selectedProvider && (
                              <div className="animate-fade-in">
                                  <label className="block text-xs font-black text-gray-400 uppercase mb-2 flex items-center gap-2">
                                      <Bookmark size={12}/> 2. Estructura de Mapeo
                                  </label>
                                  <select 
                                    className="w-full p-3 border border-gray-200 rounded-xl bg-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={selectedTemplateId}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                  >
                                      <option value="manual">Definir manualmente ahora</option>
                                      {availableTemplates.map(t => (
                                          <option key={t.id} value={t.id}>Usar Plantilla: {t.name}</option>
                                      ))}
                                  </select>
                              </div>
                          )}
                      </div>

                      <div className="relative group">
                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">3. Cargar Archivo Excel / CSV</label>
                          <div className={`relative w-full border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all ${fileName ? 'border-green-400 bg-green-50 shadow-inner' : 'border-gray-200 hover:border-ferre-orange bg-slate-50 hover:bg-white group-hover:shadow-xl'}`}>
                              {fileName ? (
                                  <div className="animate-fade-in">
                                    <FileSpreadsheet size={64} className="text-green-600 mx-auto mb-4" />
                                    <p className="font-black text-green-800 text-lg">{fileName}</p>
                                    <button onClick={() => setFileName('')} className="text-xs text-red-500 font-bold hover:underline mt-4 flex items-center gap-1 mx-auto">Cambiar archivo</button>
                                  </div>
                              ) : (
                                  <>
                                    <FileUp size={64} className="text-slate-300 mb-4 group-hover:text-ferre-orange transition-colors" />
                                    <p className="font-black text-slate-400 text-xl">Arrastre el Excel aquí</p>
                                    <p className="text-xs text-slate-300 mt-2 uppercase tracking-widest font-bold">Máximo 140.000 artículos</p>
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                                        onChange={handleFileUpload} 
                                        accept=".xlsx,.xls,.csv"
                                    />
                                  </>
                              )}
                          </div>
                      </div>
                  </div>

                  <button 
                    disabled={!selectedProvider || !fileName}
                    onClick={() => setStep(2)}
                    className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-2xl hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95">
                      Siguiente Paso <ArrowRight size={24}/>
                  </button>
              </div>
          )}

          {step === 2 && (
              <div className="flex flex-col h-full animate-fade-in overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
                      <div>
                          <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-lg"><LayoutTemplate size={20} className="text-indigo-600"/> Mapeo de Columnas</h3>
                          <p className="text-xs text-slate-500 font-medium">Asigne qué contiene cada columna del archivo subido.</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => setMapping({ code: null, description: null, cost: null, ignored: [] })} className="text-xs font-bold text-red-500 px-3 py-2 hover:bg-red-50 rounded-lg">Limpiar Todo</button>
                         <button onClick={saveCurrentAsTemplate} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 hover:bg-indigo-100 transition-all">
                             <BookmarkPlus size={16}/> Guardar Plantilla
                         </button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-auto p-6 bg-slate-100/50">
                      <div className="border border-gray-200 rounded-3xl overflow-hidden shadow-2xl bg-white">
                          <div className="grid grid-cols-4 divide-x divide-gray-100 bg-slate-900 border-b border-slate-800">
                              {[0,1,2,3].map(i => {
                                  const status = getColType(i);
                                  return (
                                      <div key={i} className="p-4 flex flex-col gap-3">
                                          <div className={`text-center text-[10px] font-black py-1.5 px-3 rounded-full border shadow-sm ${status.color}`}>{status.label}</div>
                                          <select 
                                            className="text-xs p-2.5 border-0 rounded-xl w-full bg-slate-800 text-white font-bold outline-none focus:ring-2 focus:ring-ferre-orange" 
                                            onChange={(e) => handleColumnAssign(i, e.target.value as any)} 
                                            value={mapping.code === i ? 'code' : mapping.description === i ? 'description' : mapping.cost === i ? 'cost' : 'ignore'}
                                          >
                                              <option value="ignore">Ignorar</option>
                                              <option value="code">Es CÓDIGO</option>
                                              <option value="description">Es DESCRIPCIÓN</option>
                                              <option value="cost">Es COSTO LISTA</option>
                                          </select>
                                      </div>
                                  );
                              })}
                          </div>
                          {rawPreview.map((row, idx) => (
                              <div key={idx} className="grid grid-cols-4 divide-x divide-gray-50 border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                                  {row.cols.map((col, cIdx) => (
                                      <div key={cIdx} className="p-4 text-xs text-slate-600 font-mono truncate">{col}</div>
                                  ))}
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-white">
                      <button onClick={() => setStep(1)} className="px-8 py-3 rounded-xl text-slate-400 font-bold hover:bg-slate-50">Volver</button>
                      <button onClick={() => setStep(3)} disabled={mapping.code === null || mapping.cost === null} className="bg-slate-900 text-white px-10 py-3 rounded-xl font-black shadow-xl disabled:opacity-20 flex items-center gap-2">
                          Analizar Impacto <ChevronRight size={18}/>
                      </button>
                  </div>
              </div>
          )}

          {step === 3 && (
              <div className="p-12 flex flex-col items-center justify-center h-full space-y-8 animate-fade-in text-center">
                  <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 mb-4 animate-bounce"><RefreshCw size={48}/></div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Resultado del Análisis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center"><p className="text-slate-400 text-[10px] font-black uppercase mb-4 tracking-widest">En Archivo</p><p className="text-6xl font-black text-slate-800">{stats.totalInFile.toLocaleString()}</p></div>
                      <div className="bg-green-50 p-8 rounded-3xl shadow-sm border border-green-100 flex flex-col items-center"><p className="text-green-600 text-[10px] font-black uppercase mb-4 tracking-widest">Coincidencias</p><p className="text-6xl font-black text-green-600">{stats.matched.toLocaleString()}</p></div>
                      <div className="bg-red-50 p-8 rounded-3xl shadow-sm border border-red-100 flex flex-col items-center"><p className="text-red-600 text-[10px] font-black uppercase mb-4 tracking-widest">Nuevos / Error</p><p className="text-6xl font-black text-red-600">{stats.newItems.toLocaleString()}</p></div>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button onClick={() => setStep(2)} className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">Atrás</button>
                    <button onClick={() => setStep(4)} className="bg-ferre-orange text-white px-12 py-4 rounded-2xl font-black shadow-2xl shadow-orange-200 hover:scale-105 transition-all">Previsualizar Cambios</button>
                  </div>
              </div>
          )}

           {step === 4 && (
              <div className="flex flex-col h-full animate-fade-in overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Layers size={24}/></div>
                          <div>
                              <h3 className="font-black text-slate-800 text-xl tracking-tighter uppercase">Previsualización del Impacto</h3>
                              <p className="text-xs text-slate-500">{stats.matched} Productos detectados para actualización de costo.</p>
                          </div>
                      </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                      <table className="w-full text-left">
                          <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-white sticky top-0">
                              <tr><th className="px-8 py-4">Código</th><th className="px-8 py-4">Descripción</th><th className="px-8 py-4 text-right">Anterior</th><th className="px-8 py-4 text-right">Nuevo</th><th className="px-8 py-4 text-center">Variación</th></tr>
                          </thead>
                          <tbody className="divide-y text-sm">
                              {impactData.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-8 py-4 font-mono font-bold text-slate-400">{row.code}</td>
                                      <td className="px-8 py-4 text-slate-800 font-bold">{row.desc}</td>
                                      <td className="px-8 py-4 text-right text-slate-400 font-mono">${row.oldCost.toLocaleString()}</td>
                                      <td className="px-8 py-4 text-right font-black text-slate-900 font-mono text-lg">${row.newCost.toLocaleString()}</td>
                                      <td className="px-8 py-4 text-center">
                                          <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${row.variation > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                              {row.variation > 0 ? '▲' : '▼'} {row.variation}%
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <div className="p-8 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                      <p className="text-xs text-slate-400 font-bold max-w-sm">Al confirmar, el sistema recalculará automáticamente todas las listas de precios vinculadas a estos artículos.</p>
                      <div className="flex gap-3">
                          <button onClick={() => setStep(3)} className="px-8 py-3 rounded-xl font-bold text-slate-400">Cancelar</button>
                          <button onClick={saveUpdates} className="bg-green-600 text-white px-12 py-3 rounded-2xl font-black shadow-2xl shadow-green-200 hover:bg-green-700 hover:scale-105 transition-all">Confirmar Actualización</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
      )}

      {newListOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fade-in overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600"><Settings size={120}/></div>
                  <h3 className="font-black text-2xl text-slate-800 mb-6 tracking-tighter uppercase">{editingListId ? 'Editar Lista' : 'Crear Nueva Lista'}</h3>
                  <div className="space-y-6 relative z-10">
                      <div>
                          <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Nombre Descriptivo</label>
                          <input type="text" className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="Ej: Lista Instaladores Especial" value={newListName} onChange={e => setNewListName(e.target.value)}/>
                      </div>
                      <div>
                          <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Margen sobre costo (%)</label>
                          <div className="flex items-center gap-4">
                              <input type="number" className="flex-1 p-4 border border-gray-200 rounded-2xl font-black text-2xl text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none" value={newListMargin} onChange={e => setNewListMargin(parseFloat(e.target.value))}/>
                              <div className="bg-indigo-50 p-4 rounded-2xl font-black text-indigo-600 text-2xl">%</div>
                          </div>
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-10">
                      <button onClick={() => setNewListOpen(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
                      <button onClick={handleSaveList} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Guardar Cambios</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PriceUpdates;
