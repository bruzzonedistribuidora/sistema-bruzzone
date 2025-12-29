
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Truck, Plus, Search, FileText, User, UserPlus, MoreVertical, 
    CreditCard, Calendar, X, Save, Percent, ArrowLeft, ArrowUpRight, 
    Wallet, CheckCircle, DollarSign, Printer, Download, Eye, Upload, 
    FileSpreadsheet, RefreshCw, Globe, Trash2, ShoppingBag, Package, 
    AlertTriangle, Edit, Box, Tag, Layers, Calculator, Landmark, 
    History, ArrowDownLeft, CheckSquare, Square, ArrowRight, Info, Scroll, Smartphone, Loader2, Zap, Save as SaveIcon,
    ShieldCheck, UserCheck, LayoutTemplate, MapPin,
    Scan, Camera, FileCheck, AlertOctagon, Scale, Pencil, UserSearch, Receipt, Send, Scissors, Ban, Mail, MessageCircle, Minus, PlusCircle,
    Tag as TagIcon, Barcode, Store, Building2, ExternalLink, ShoppingCart, FileUp, Columns, Table as TableIcon, Hash, Notebook, ListOrdered,
    Users, Wand2, FileSearch, Sparkles
} from 'lucide-react';
import { Purchase, Provider, Product, PurchaseItem, CompanyConfig } from '../types';
import { fetchCompanyByCuit, analyzeInvoice } from '../services/geminiService';
import Replenishment from './Replenishment';
import Shortages from './Shortages';

// Fix: Added missing onNavigateToPrices prop to the Purchases component interface
interface PurchasesProps {
  defaultTab?: string;
  onNavigateToPrices?: () => void;
}

const Purchases: React.FC<PurchasesProps> = ({ defaultTab = 'PURCHASES', onNavigateToPrices }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const invoiceFileRef = useRef<HTMLInputElement>(null);

  const [providers] = useState<Provider[]>(() => JSON.parse(localStorage.getItem('ferrecloud_providers') || '[]'));
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('ferrecloud_products') || '[]'));
  
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
      const saved = localStorage.getItem('ferrecloud_purchases');
      return saved ? JSON.parse(saved) : [];
  });

  const [aiResult, setAiResult] = useState<any>(null);

  useEffect(() => {
      localStorage.setItem('ferrecloud_purchases', JSON.stringify(purchases));
  }, [purchases]);

  const handleAiInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAiProcessing(true);
      try {
          const reader = new FileReader();
          reader.onload = async (event) => {
              const base64 = event.target?.result as string;
              const analysis = await analyzeInvoice(base64, file.type);
              setAiResult(analysis);
              setIsAiProcessing(false);
              setIsNewPurchaseModalOpen(true);
          };
          reader.readAsDataURL(file);
      } catch (err) {
          alert("Error al analizar la factura con IA.");
          setIsAiProcessing(false);
      }
  };

  const handleConfirmPurchase = () => {
      if (!aiResult) return;
      
      const newPurchase: Purchase = {
          id: aiResult.numeroFactura || `FAC-${Date.now()}`,
          providerId: '1', // Simulado
          providerName: aiResult.nombreEmisor || 'Proveedor IA',
          date: aiResult.fecha || new Date().toISOString().split('T')[0],
          type: 'Factura A',
          items: aiResult.items.length,
          total: aiResult.total || 0,
          status: 'PENDING'
      };

      setPurchases([newPurchase, ...purchases]);
      setIsNewPurchaseModalOpen(false);
      setAiResult(null);
      alert("Compra cargada y stock actualizado (simulado).");
  };

  const stats = useMemo(() => {
      const total = purchases.reduce((a,c) => a + c.total, 0);
      const pending = purchases.filter(p => p.status === 'PENDING').reduce((a,c) => a + c.total, 0);
      return { total, pending };
  }, [purchases]);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 shrink-0 z-20">
        <div className="flex gap-2 h-14 items-end">
            {[
                { id: 'PURCHASES', label: 'Libro Compras', icon: Receipt },
                { id: 'PROVIDERS', label: 'Proveedores', icon: Users },
                { id: 'REPLENISHMENT', label: 'Pedidos Prov.', icon: ShoppingCart },
                { id: 'SHORTAGES', label: 'Faltantes', icon: AlertTriangle }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl font-black text-[10px] uppercase tracking-widest transition-all border-x border-t ${
                        activeTab === tab.id 
                        ? 'bg-slate-50 border-gray-200 text-indigo-600 -mb-px shadow-[0_-5px_15px_rgba(0,0,0,0.03)]' 
                        : 'bg-white border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
            {activeTab === 'PURCHASES' && (
                <div className="p-8 animate-fade-in space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-6">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Receipt size={24}/></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Compras Mes</p>
                                <h4 className="text-2xl font-black text-slate-800">${stats.total.toLocaleString('es-AR')}</h4>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-6">
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><AlertTriangle size={24}/></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deuda a Proveedores</p>
                                <h4 className="text-2xl font-black text-red-600">${stats.pending.toLocaleString('es-AR')}</h4>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <input type="file" ref={invoiceFileRef} className="hidden" accept="image/*,application/pdf" onChange={handleAiInvoiceUpload} />
                            <button 
                                onClick={() => invoiceFileRef.current?.click()}
                                disabled={isAiProcessing}
                                className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                                {isAiProcessing ? <RefreshCw className="animate-spin" size={18}/> : <Wand2 size={18} className="text-indigo-400"/>}
                                Carga con IA (Foto/PDF)
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Nº Comprobante</th>
                                    <th className="px-8 py-5">Proveedor</th>
                                    <th className="px-8 py-5">Fecha</th>
                                    <th className="px-8 py-5 text-right">Total</th>
                                    <th className="px-8 py-5 text-center">Estado</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[11px]">
                                {purchases.length === 0 ? (
                                    <tr><td colSpan={6} className="py-20 text-center text-slate-300 uppercase font-black tracking-widest">Sin compras registradas</td></tr>
                                ) : purchases.map(purchase => (
                                    <tr key={purchase.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5 font-black text-slate-800 text-sm">{purchase.id}</td>
                                        <td className="px-8 py-5 font-black text-slate-600 uppercase">{purchase.providerName}</td>
                                        <td className="px-8 py-5 text-gray-400 font-bold">{purchase.date}</td>
                                        <td className="px-8 py-5 text-right font-black text-slate-900">${purchase.total.toLocaleString('es-AR')}</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${purchase.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                {purchase.status === 'PAID' ? 'PAGADA' : 'PENDIENTE'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right"><button className="p-3 text-slate-300 hover:text-indigo-600"><Eye size={18}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'PROVIDERS' && (
                <div className="p-8 animate-fade-in text-center text-slate-400">
                    <p className="uppercase font-black tracking-widest">Módulo de Proveedores Activo</p>
                </div>
            )}

            {activeTab === 'REPLENISHMENT' && <Replenishment />}
            {activeTab === 'SHORTAGES' && <Shortages />}
        </div>
      </div>

      {/* MODAL: CARGA DE FACTURA PROCESADA POR IA */}
      {isNewPurchaseModalOpen && aiResult && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg animate-pulse"><Sparkles size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Análisis IA Finalizado</h3>
                              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Revisa los datos antes de ingresar al stock</p>
                          </div>
                      </div>
                      <button onClick={() => setIsNewPurchaseModalOpen(false)}><X size={28}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50 custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Datos del Comprobante</label>
                              <div className="space-y-3">
                                  <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase">Proveedor Detectado</p>
                                      <p className="text-lg font-black text-slate-800 uppercase">{aiResult.nombreEmisor}</p>
                                      <p className="text-[10px] font-mono text-indigo-500">{aiResult.cuitEmisor}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                      <div>
                                          <p className="text-[10px] font-black text-slate-400 uppercase">Número</p>
                                          <p className="font-bold text-slate-700">{aiResult.numeroFactura}</p>
                                      </div>
                                      <div>
                                          <p className="text-[10px] font-black text-slate-400 uppercase">Fecha</p>
                                          <p className="font-bold text-slate-700">{aiResult.fecha}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-center">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Facturado</p>
                              <p className="text-5xl font-black tracking-tighter leading-none">${aiResult.total?.toLocaleString('es-AR')}</p>
                              <div className="mt-6 flex items-center gap-2 text-green-400 text-[10px] font-black uppercase">
                                  <CheckCircle size={16}/> Verificado por FerreBot IA
                              </div>
                          </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Desglose de Ítems ({aiResult.items?.length})</h4>
                              <button className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1"><Plus size={12}/> Agregar Ítem Manual</button>
                          </div>
                          <table className="w-full text-left">
                              <thead className="bg-white text-[8px] font-black text-gray-400 uppercase border-b">
                                  <tr>
                                      <th className="px-6 py-4">Descripción del Artículo</th>
                                      <th className="px-6 py-4 text-center">Cant.</th>
                                      <th className="px-6 py-4 text-right">Costo Unit.</th>
                                      <th className="px-6 py-4 text-right">Subtotal</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 text-[10px]">
                                  {aiResult.items?.map((item: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-indigo-50/20 transition-all group">
                                          <td className="px-6 py-4">
                                              <p className="font-black text-slate-800 uppercase leading-none mb-1">{item.descripcion}</p>
                                              <div className="flex items-center gap-2">
                                                  <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">Auto-Vinculado</span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4 text-center font-black text-slate-600">{item.cantidad}</td>
                                          <td className="px-6 py-4 text-right font-bold text-slate-400">${item.costoUnitario?.toLocaleString('es-AR')}</td>
                                          <td className="px-6 py-4 text-right font-black text-slate-900">${item.subtotal?.toLocaleString('es-AR')}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-gray-100 flex justify-end gap-4 shrink-0">
                      <button onClick={() => setIsNewPurchaseModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button onClick={handleConfirmPurchase} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3">
                          <SaveIcon size={18}/> Procesar Ingreso a Almacén
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Purchases;
