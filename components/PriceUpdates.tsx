
import React, { useState } from 'react';
import { FileUp, FileSpreadsheet, ArrowRight, Settings, CheckCircle, AlertTriangle, ChevronRight, Save, LayoutTemplate, Database, X, List, Plus, Trash2, Edit2 } from 'lucide-react';
import { Provider, PriceList } from '../types';

interface ColumnMapping {
    code: number | null;
    description: number | null;
    cost: number | null;
    ignored: number[];
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
  
  // List Form State
  const [newListOpen, setNewListOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null); // Track ID for editing
  const [newListName, setNewListName] = useState('');
  const [newListMargin, setNewListMargin] = useState(30);

  // --- MASS UPDATE STATE ---
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  
  // Mock Data for Providers
  const providers: Provider[] = [
    { id: 'P1', name: 'Herramientas Global SA', cuit: '30-11223344-5', contact: '', balance: 0, defaultDiscounts: [10,5,0] },
    { id: 'P2', name: 'Pinturas del Centro', cuit: '30-55667788-9', contact: '', balance: 0, defaultDiscounts: [25,0,0] },
    { id: 'P3', name: 'Bulonera Industrial', cuit: '30-99887766-1', contact: '', balance: 0, defaultDiscounts: [0,0,0] },
  ];

  // State for Mapping Template
  const [mapping, setMapping] = useState<ColumnMapping>({ code: 0, description: 1, cost: 2, ignored: [] });
  const [rawPreview, setRawPreview] = useState<MockRow[]>([
      { cols: ['TOR-001', 'Tornillo T1 Autoperforante', '150.00', 'UNIDAD'] },
      { cols: ['TAL-022', 'Taladro Percutor 750w', '85000.00', 'UNIDAD'] },
      { cols: ['LIJ-180', 'Lija al agua 180', '450.00', 'HOJA'] },
      { cols: ['DIS-NEW', 'Producto Nuevo Ejemplo', '1200.00', 'UNIDAD'] }
  ]);

  // Stats State
  const [stats, setStats] = useState({
      totalInFile: 1540,
      matched: 1250,
      newItems: 290,
      discontinued: 45 // Items in DB but not in File
  });

  // Impact Preview Data
  const [impactData, setImpactData] = useState([
      { code: 'TOR-001', desc: 'Tornillo T1 Autoperforante', oldCost: 120, newCost: 150, variation: 25 },
      { code: 'TAL-022', desc: 'Taladro Percutor 750w', oldCost: 82000, newCost: 85000, variation: 3.65 },
      { code: 'LIJ-180', desc: 'Lija al agua 180', oldCost: 450, newCost: 450, variation: 0 },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setFileName(file.name);
          // Simulate loading...
      }
  };

  const handleColumnAssign = (colIndex: number, type: 'code' | 'description' | 'cost' | 'ignore') => {
      const newMapping = { ...mapping };
      // Clear previous assignment if exists
      if (newMapping.code === colIndex) newMapping.code = null;
      if (newMapping.description === colIndex) newMapping.description = null;
      if (newMapping.cost === colIndex) newMapping.cost = null;

      if (type === 'code') newMapping.code = colIndex;
      if (type === 'description') newMapping.description = colIndex;
      if (type === 'cost') newMapping.cost = colIndex;
      
      setMapping(newMapping);
  };

  const getColType = (index: number) => {
      if (mapping.code === index) return { label: 'CÓDIGO', color: 'bg-blue-100 text-blue-700 border-blue-300' };
      if (mapping.description === index) return { label: 'DESCRIPCIÓN', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
      if (mapping.cost === index) return { label: 'COSTO', color: 'bg-green-100 text-green-700 border-green-300' };
      return { label: 'IGNORAR', color: 'bg-gray-100 text-gray-400 border-gray-200' };
  };

  const saveUpdates = () => {
      alert("Precios actualizados correctamente. Se ha generado un historial de cambios.");
      setStep(1);
      setFileName('');
      setSelectedProvider('');
  };

  // --- LIST ACTIONS ---

  const openCreateModal = () => {
      setEditingListId(null);
      setNewListName('');
      setNewListMargin(30);
      setNewListOpen(true);
  };

  const openEditModal = (list: PriceList) => {
      setEditingListId(list.id);
      setNewListName(list.name);
      setNewListMargin(list.fixedMargin || 0);
      setNewListOpen(true);
  };

  const handleSaveList = () => {
      if (!newListName) return;

      if (editingListId) {
          // Update existing list
          setPriceLists(prev => prev.map(list => 
              list.id === editingListId 
              ? { ...list, name: newListName, fixedMargin: newListMargin }
              : list
          ));
      } else {
          // Create new list
          setPriceLists([...priceLists, { 
              id: Date.now().toString(), 
              name: newListName, 
              type: 'CUSTOM', 
              fixedMargin: newListMargin, 
              active: true 
          }]);
      }
      
      setNewListOpen(false);
      setNewListName('');
      setNewListMargin(30);
      setEditingListId(null);
  };

  const handleDeleteList = (id: string) => {
      const listToDelete = priceLists.find(l => l.id === id);
      if (!listToDelete) return;

      if (listToDelete.type === 'BASE') {
          alert("No se puede eliminar la Lista Base.");
          return;
      }

      if (confirm(`¿Estás seguro de eliminar la lista "${listToDelete.name}"?`)) {
          setPriceLists(priceLists.filter(l => l.id !== id));
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Precios</h2>
          <p className="text-gray-500 text-sm">Administra tus listas de venta y actualiza costos masivamente.</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('LISTS')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'LISTS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                Listas de Precios
            </button>
            <button 
                onClick={() => setActiveTab('MASS_UPDATE')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'MASS_UPDATE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                Actualización Masiva (Excel)
            </button>
        </div>
      </div>

      {/* --- PRICE LISTS TAB --- */}
      {activeTab === 'LISTS' && (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-fade-in">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <div>
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><List size={20}/> Mis Listas de Precios</h3>
                      <p className="text-sm text-gray-500">Configura diferentes márgenes de ganancia para distintos tipos de clientes.</p>
                  </div>
                  <button 
                    onClick={openCreateModal}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 shadow-sm">
                      <Plus size={18}/> Nueva Lista
                  </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {priceLists.map(list => (
                      <div key={list.id} className={`border rounded-xl p-6 hover:shadow-md transition-shadow relative bg-white group ${list.type === 'BASE' ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-start mb-4">
                              <h4 className="font-bold text-lg text-gray-800">{list.name}</h4>
                              {list.type === 'BASE' ? (
                                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">BASE</span>
                              ) : (
                                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold">CUSTOM</span>
                              )}
                          </div>
                          
                          <div className="mb-6">
                              <p className="text-sm text-gray-500 mb-1">Estrategia de Precio</p>
                              {list.type === 'BASE' ? (
                                  <div className="text-2xl font-bold text-gray-700">Variable</div>
                              ) : (
                                  <div className="text-3xl font-bold text-green-600">+{list.fixedMargin}% <span className="text-sm font-normal text-gray-400">sobre Costo</span></div>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                  {list.type === 'BASE' 
                                    ? 'Utiliza el margen individual definido en cada producto.' 
                                    : 'Aplica un margen fijo sobre el costo real del producto.'}
                              </p>
                          </div>

                          <div className="border-t border-gray-100 pt-4 flex justify-end gap-2">
                              {list.type === 'BASE' ? (
                                  <span className="text-xs text-gray-400 italic py-2">Lista predeterminada del sistema</span>
                              ) : (
                                  <>
                                    <button 
                                        onClick={() => openEditModal(list)} 
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Editar Lista"
                                    >
                                        <Edit2 size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteList(list.id)} 
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Eliminar Lista"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                  </>
                              )}
                          </div>
                      </div>
                  ))}
              </div>

              {/* Create/Edit List Modal */}
              {newListOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                          <h3 className="font-bold text-lg mb-4">{editingListId ? 'Editar Lista de Precios' : 'Crear Nueva Lista de Precios'}</h3>
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de la Lista</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                                    placeholder="Ej: Mayorista, Gremio..."
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Margen de Ganancia (%)</label>
                                  <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-lg" 
                                        value={newListMargin}
                                        onChange={(e) => setNewListMargin(parseFloat(e.target.value))}
                                      />
                                      <span className="text-gray-500 font-bold">%</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Este porcentaje se sumará al costo del producto para calcular el precio de venta en esta lista.</p>
                              </div>
                          </div>
                          <div className="flex justify-end gap-3 mt-6">
                              <button onClick={() => setNewListOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                              <button onClick={handleSaveList} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">
                                  {editingListId ? 'Guardar Cambios' : 'Crear Lista'}
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* --- MASS UPDATE TAB --- */}
      {activeTab === 'MASS_UPDATE' && (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-fade-in">
          
          <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between relative">
                <div className={`flex flex-col items-center gap-2 bg-white px-4 py-2 rounded border ${step >= 1 ? 'border-ferre-orange' : 'border-gray-200'}`}>
                    <span className="text-xs font-bold text-gray-600">1. Carga</span>
                </div>
                <div className="h-px bg-gray-300 flex-1 mx-2"></div>
                <div className={`flex flex-col items-center gap-2 bg-white px-4 py-2 rounded border ${step >= 2 ? 'border-ferre-orange' : 'border-gray-200'}`}>
                    <span className="text-xs font-bold text-gray-600">2. Mapeo</span>
                </div>
                <div className="h-px bg-gray-300 flex-1 mx-2"></div>
                <div className={`flex flex-col items-center gap-2 bg-white px-4 py-2 rounded border ${step >= 3 ? 'border-ferre-orange' : 'border-gray-200'}`}>
                    <span className="text-xs font-bold text-gray-600">3. Análisis</span>
                </div>
                <div className="h-px bg-gray-300 flex-1 mx-2"></div>
                <div className={`flex flex-col items-center gap-2 bg-white px-4 py-2 rounded border ${step >= 4 ? 'border-ferre-orange' : 'border-gray-200'}`}>
                    <span className="text-xs font-bold text-gray-600">4. Confirmar</span>
                </div>
            </div>
          </div>

          {/* STEP 1: UPLOAD */}
          {step === 1 && (
              <div className="p-12 flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
                  <div className="w-full max-w-md space-y-4">
                      <label className="block text-sm font-bold text-gray-700">Seleccionar Proveedor</label>
                      <select 
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-ferre-orange outline-none"
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                      >
                          <option value="">-- Elegir Proveedor --</option>
                          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>

                  <div className={`w-full max-w-md border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${fileName ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-ferre-orange bg-gray-50'}`}>
                      {fileName ? (
                          <>
                            <FileSpreadsheet size={48} className="text-green-600 mb-4" />
                            <p className="font-bold text-green-800">{fileName}</p>
                            <button onClick={() => setFileName('')} className="text-xs text-red-500 hover:underline mt-2">Eliminar y cambiar</button>
                          </>
                      ) : (
                          <>
                            <FileUp size={48} className="text-gray-400 mb-4" />
                            <p className="font-bold text-gray-600">Arrastra tu archivo Excel aquí</p>
                            <p className="text-sm text-gray-400 mt-1">o haz click para buscar (.xlsx, .csv)</p>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                          </>
                      )}
                  </div>

                  <button 
                    disabled={!selectedProvider || !fileName}
                    onClick={() => setStep(2)}
                    className="bg-ferre-orange text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      Siguiente Paso <ArrowRight size={20}/>
                  </button>
              </div>
          )}

          {/* STEP 2: TEMPLATE MAPPING */}
          {step === 2 && (
              <div className="flex flex-col h-full animate-fade-in">
                  <div className="p-6 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-gray-800 flex items-center gap-2"><LayoutTemplate size={20}/> Configurar Plantilla de Importación</h3>
                          <p className="text-sm text-gray-500">Indica qué representa cada columna del archivo Excel.</p>
                      </div>
                      <button className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1">
                          <Settings size={14}/> Guardar configuración para este proveedor
                      </button>
                  </div>

                  <div className="flex-1 overflow-auto p-6">
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                          <div className="grid grid-cols-4 divide-x divide-gray-300 bg-gray-100 border-b border-gray-300">
                              {[0,1,2,3].map(i => {
                                  const status = getColType(i);
                                  return (
                                      <div key={i} className="p-2 flex flex-col gap-2">
                                          <div className={`text-center text-xs font-bold py-1 px-2 rounded border ${status.color}`}>
                                              {status.label}
                                          </div>
                                          <select 
                                            className="text-xs p-1 border rounded w-full"
                                            onChange={(e) => handleColumnAssign(i, e.target.value as any)}
                                            defaultValue="ignore"
                                          >
                                              <option value="ignore">Ignorar Columna</option>
                                              <option value="code">Es CÓDIGO</option>
                                              <option value="description">Es DESCRIPCIÓN</option>
                                              <option value="cost">Es COSTO</option>
                                          </select>
                                      </div>
                                  );
                              })}
                          </div>
                          {/* Preview Rows */}
                          {rawPreview.map((row, idx) => (
                              <div key={idx} className="grid grid-cols-4 divide-x divide-gray-200 border-b border-gray-100 hover:bg-gray-50">
                                  {row.cols.map((col, cIdx) => (
                                      <div key={cIdx} className="p-3 text-sm text-gray-700 font-mono truncate">
                                          {col}
                                      </div>
                                  ))}
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white">
                      <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600">Atrás</button>
                      <button 
                        onClick={() => setStep(3)}
                        disabled={mapping.code === null || mapping.cost === null}
                        className="bg-ferre-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50">
                        Analizar Archivo
                      </button>
                  </div>
              </div>
          )}

          {/* STEP 3: STATISTICS */}
          {step === 3 && (
              <div className="p-12 flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
                  <h3 className="text-2xl font-bold text-gray-800">Resultado del Análisis</h3>
                  
                  <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
                      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
                          <div className="text-gray-500 text-sm font-bold uppercase mb-2">Artículos en Archivo</div>
                          <div className="text-4xl font-bold text-gray-800">{stats.totalInFile}</div>
                          <p className="text-xs text-gray-400 mt-2">Total de filas leídas</p>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500">
                          <div className="text-gray-500 text-sm font-bold uppercase mb-2">Vinculados (En Sistema)</div>
                          <div className="text-4xl font-bold text-green-600">{stats.matched}</div>
                          <p className="text-xs text-gray-400 mt-2">Productos que actualizarán precio</p>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-red-500">
                          <div className="text-gray-500 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                              <AlertTriangle size={16}/> Discontinuados
                          </div>
                          <div className="text-4xl font-bold text-red-600">{stats.discontinued}</div>
                          <p className="text-xs text-gray-400 mt-2">En sistema pero NO en archivo</p>
                      </div>
                  </div>

                  <div className="w-full max-w-4xl bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-4 items-start">
                      <AlertTriangle className="text-yellow-600 shrink-0 mt-1" />
                      <div>
                          <h4 className="font-bold text-yellow-800">Atención: Productos Discontinuados</h4>
                          <p className="text-sm text-yellow-700">Se detectaron {stats.discontinued} artículos que pertenecen a este proveedor en tu sistema, pero no figuran en la lista nueva. Puedes optar por marcarlos como "Inactivos" o mantenerlos.</p>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600">Atrás</button>
                      <button 
                        onClick={() => setStep(4)}
                        className="bg-ferre-orange text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-orange-600 flex items-center gap-2">
                        Ver Vista Previa <ArrowRight size={20}/>
                      </button>
                  </div>
              </div>
          )}

           {/* STEP 4: PREVIEW & COMMIT */}
           {step === 4 && (
              <div className="flex flex-col h-full animate-fade-in">
                  <div className="p-6 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Database size={20}/> Vista Previa de Impacto</h3>
                          <p className="text-sm text-gray-500">Revisa los cambios de costos antes de confirmar.</p>
                      </div>
                      <div className="text-right">
                          <div className="text-xs font-bold text-gray-500 uppercase">Total a actualizar</div>
                          <div className="text-xl font-bold text-ferre-orange">{stats.matched} Artículos</div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-auto p-6">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-white sticky top-0 z-10 shadow-sm text-xs text-gray-500 uppercase">
                              <tr>
                                  <th className="px-4 py-3 border-b">Código</th>
                                  <th className="px-4 py-3 border-b">Descripción</th>
                                  <th className="px-4 py-3 border-b text-right">Costo Anterior</th>
                                  <th className="px-4 py-3 border-b text-right">Costo Nuevo</th>
                                  <th className="px-4 py-3 border-b text-center">Variación %</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                              {impactData.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 font-mono text-gray-600">{row.code}</td>
                                      <td className="px-4 py-3 text-gray-800">{row.desc}</td>
                                      <td className="px-4 py-3 text-right text-gray-500">${row.oldCost.toLocaleString('es-AR')}</td>
                                      <td className="px-4 py-3 text-right font-bold text-gray-800">${row.newCost.toLocaleString('es-AR')}</td>
                                      <td className="px-4 py-3 text-center">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                                              row.variation > 0 ? 'bg-red-100 text-red-700' : 
                                              row.variation < 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                          }`}>
                                              {row.variation > 0 ? '+' : ''}{row.variation}%
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                              {/* Filler rows for demo */}
                              {Array.from({length: 10}).map((_, i) => (
                                   <tr key={`fill-${i}`} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 font-mono text-gray-600">COD-GEN-{i}</td>
                                      <td className="px-4 py-3 text-gray-800">Artículo Genérico Ejemplo {i}</td>
                                      <td className="px-4 py-3 text-right text-gray-500">$1,000.00</td>
                                      <td className="px-4 py-3 text-right font-bold text-gray-800">$1,100.00</td>
                                      <td className="px-4 py-3 text-center">
                                          <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">+10%</span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white">
                      <button onClick={() => setStep(3)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600">Atrás</button>
                      <button 
                        onClick={saveUpdates}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 flex items-center gap-2">
                        <Save size={20}/> Confirmar y Actualizar Precios
                      </button>
                  </div>
              </div>
          )}
      </div>
      )}
    </div>
  );
};

export default PriceUpdates;
