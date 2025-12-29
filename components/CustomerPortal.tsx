
import React, { useState, useMemo, useEffect } from 'react';
import { 
    LogOut, FileText, Calendar, DollarSign, TrendingUp, 
    CheckCircle, CreditCard, Banknote, Copy, X, ExternalLink, 
    ChevronRight, Smartphone, Landmark, Check, Eye, Printer, 
    Share2, Mail, MessageCircle, Download, Package, QrCode,
    ArrowLeft, ShieldCheck, Clock, User, AlertTriangle, Info
} from 'lucide-react';
import { Client, CurrentAccountMovement, CompanyConfig, PaymentAccount } from '../types';

interface CustomerPortalProps {
    client: Client;
    onLogout: () => void;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ client, onLogout }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'SELECTION' | 'DETAILS' | 'CONFIRMATION'>('SELECTION');
    const [copyType, setCopyType] = useState<'NONE' | 'ALIAS' | 'CBU'>('NONE');
    const [viewingVoucher, setViewingVoucher] = useState<CurrentAccountMovement | null>(null);

    // --- CARGA DE MOVIMIENTOS REALES ---
    const [allMovements] = useState<CurrentAccountMovement[]>(() => {
        const saved = localStorage.getItem('ferrecloud_movements');
        return saved ? JSON.parse(saved) : [];
    });

    const clientMovements = useMemo(() => {
        return allMovements
            .filter(m => m.clientId === client.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allMovements, client.id]);

    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : {
            name: 'FERRETERIA BRUZZONE S.A.',
            paymentAccounts: [
                { id: 'def-1', type: 'VIRTUAL_WALLET', bankName: 'Mercado Pago', alias: 'ferre.bruzzone.mp', cbu: '', owner: 'Bruzzone SA', active: true },
                { id: 'def-2', type: 'BANK', bankName: 'Banco Galicia', alias: 'bruzzone.galicia', cbu: '0070012345678901234567', owner: 'Bruzzone SA', active: true }
            ]
        } as CompanyConfig;
    }, []);

    const activeAccounts = useMemo(() => 
        companyConfig.paymentAccounts.filter(acc => acc.active), 
    [companyConfig]);

    const handleCopy = (text: string, type: 'ALIAS' | 'CBU') => {
        navigator.clipboard.writeText(text);
        setCopyType(type);
        setTimeout(() => setCopyType('NONE'), 2000);
    };

    return (
        <div className="h-full w-full bg-slate-50 font-sans flex flex-col animate-fade-in overflow-hidden border-l border-gray-200">
            {/* HEADER COMPACTO */}
            <header className="bg-white border-b border-gray-200 px-6 h-16 flex justify-between items-center shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
                        {/* Import check: User is now imported from lucide-react */}
                        <User size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">{client.name}</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Portal de Autogestión</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 text-[10px] font-black uppercase tracking-widest">
                        <ShieldCheck size={12}/> Sesión Segura
                    </div>
                    <button onClick={onLogout} className="text-gray-400 hover:text-red-600 flex items-center gap-2 bg-gray-50 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border border-gray-100 uppercase tracking-widest">
                        <LogOut size={14} /> Salir del Portal
                    </button>
                </div>
            </header>

            {/* CONTENIDO SCROLLABLE */}
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 pb-20">
                    
                    {/* SALDO CARD - REDISEÑADA PARA ESPACIO */}
                    <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-slate-300">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <TrendingUp size={180}/>
                        </div>
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-8">
                            <div className="text-center lg:text-left">
                                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Estado de Cuenta Corriente</p>
                                <div className="flex flex-col">
                                    <span className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                                        ${client.balance.toLocaleString('es-AR')}
                                    </span>
                                    <span className="text-slate-500 text-xs uppercase font-bold tracking-widest mt-2">Saldo Total Adeudado</span>
                                </div>
                                <div className="flex items-center justify-center lg:justify-start gap-3 text-slate-500 text-[10px] font-black uppercase tracking-widest mt-6">
                                    <Clock size={12} /> Última actualización: Hoy {new Date().toLocaleTimeString().slice(0, 5)}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => { setPaymentStatus('SELECTION'); setIsPaymentModalOpen(true); }}
                                    className="w-full bg-green-500 text-white py-5 rounded-[1.5rem] font-black hover:bg-green-400 shadow-xl shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg uppercase tracking-widest">
                                    <CreditCard size={24}/> Informar un Pago
                                </button>
                                <button className="w-full bg-white/10 text-white py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                    <Download size={14}/> Descargar Resumen (PDF)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TABLA DE MOVIMIENTOS - AJUSTADA */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h4 className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 text-[10px]">
                                <FileText size={14} className="text-indigo-600"/> Historial Reciente de Comprobantes
                            </h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
                                    <tr>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Comprobante / Detalle</th>
                                        <th className="px-6 py-4 text-right">Importe</th>
                                        <th className="px-6 py-4 text-center w-24">Ver</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {clientMovements.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
                                                <div className="flex flex-col items-center opacity-20">
                                                    <Package size={48} strokeWidth={1} className="mb-2" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin movimientos registrados</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : clientMovements.map(m => (
                                        <tr key={m.id} className="hover:bg-indigo-50/20 transition-colors group">
                                            <td className="px-6 py-5 text-xs font-bold text-gray-400">{m.date}</td>
                                            <td className="px-6 py-5">
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{m.voucherType}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase truncate max-w-[250px]">{m.description}</p>
                                            </td>
                                            <td className={`px-6 py-5 text-right font-black text-lg tracking-tighter ${m.debit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {m.debit > 0 ? `+$${m.debit.toLocaleString('es-AR')}` : `-$${m.credit.toLocaleString('es-AR')}`}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <button 
                                                    onClick={() => setViewingVoucher(m)}
                                                    className="p-3 bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-md rounded-xl transition-all"
                                                >
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
            </main>

            {/* MODAL: MEDIOS DE PAGO - FIJADO AL VIEWPORT */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-green-500 text-white rounded-xl shadow-lg"><DollarSign size={20}/></div>
                                <h3 className="font-black text-sm uppercase tracking-widest">Información para Pagos</h3>
                            </div>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            {paymentStatus === 'SELECTION' && (
                                <div className="space-y-4">
                                    <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.2em] text-center mb-6">Selecciona una vía de transferencia</p>
                                    <div className="space-y-3">
                                        {activeAccounts.length === 0 ? (
                                            <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                {/* Import check: AlertTriangle is now imported from lucide-react */}
                                                <AlertTriangle size={32} className="mx-auto text-amber-500 mb-2" />
                                                <p className="text-[10px] font-black uppercase text-slate-400">Sin cuentas configuradas</p>
                                            </div>
                                        ) : activeAccounts.map(acc => (
                                            <button 
                                                key={acc.id} 
                                                onClick={() => { setSelectedAccount(acc); setPaymentStatus('DETAILS'); }} 
                                                className="w-full group flex items-center p-5 bg-white border-2 border-gray-100 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left">
                                                <div className="p-3 rounded-xl bg-gray-100 text-gray-400 mr-4 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                                                    {acc.type === 'VIRTUAL_WALLET' ? <Smartphone size={24}/> : <Landmark size={24}/>}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{acc.bankName}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{acc.type === 'BANK' ? 'CBU BANCARIO' : 'ENVÍO ALIAS'}</p>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-all"/>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {paymentStatus === 'DETAILS' && selectedAccount && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white text-center shadow-xl">
                                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Entidad Destino</p>
                                        <h4 className="font-black text-xl uppercase tracking-tighter leading-none mb-1">{selectedAccount.bankName}</h4>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{selectedAccount.owner}</p>
                                    </div>

                                    {selectedAccount.qrImage && (
                                        <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                                            <div className="w-40 h-40 bg-white rounded-xl overflow-hidden shadow-inner flex items-center justify-center p-2">
                                                <img src={selectedAccount.qrImage} alt="QR" className="w-full h-full object-contain" />
                                            </div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Escaneá para pagar</p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-2">Alias de la Cuenta</label>
                                            <div className="flex items-center justify-between bg-white border-2 border-gray-100 p-4 rounded-xl">
                                                <p className="text-xl font-mono font-black text-indigo-600 truncate mr-4">{selectedAccount.alias}</p>
                                                <button 
                                                    onClick={() => handleCopy(selectedAccount.alias, 'ALIAS')} 
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${copyType === 'ALIAS' ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-50 text-indigo-700 hover:bg-slate-100 border'}`}>
                                                    {copyType === 'ALIAS' ? <Check size={12}/> : <Copy size={12}/>}
                                                    {copyType === 'ALIAS' ? 'OK' : 'COPIAR'}
                                                </button>
                                            </div>
                                        </div>

                                        {selectedAccount.cbu && (
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-2">CBU / CVU</label>
                                                <div className="flex items-center justify-between bg-white border-2 border-gray-100 p-4 rounded-xl">
                                                    <p className="text-xs font-mono font-bold text-slate-500 truncate mr-4">{selectedAccount.cbu}</p>
                                                    <button 
                                                        onClick={() => handleCopy(selectedAccount.cbu, 'CBU')} 
                                                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${copyType === 'CBU' ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border'}`}>
                                                        {copyType === 'CBU' ? <Check size={12}/> : <Copy size={12}/>}
                                                        {copyType === 'CBU' ? 'OK' : 'COPIAR'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 space-y-3">
                                        <button onClick={() => setPaymentStatus('CONFIRMATION')} className="w-full bg-indigo-600 text-white py-4 rounded-[1.2rem] font-black text-sm shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest active:scale-95">NOTIFICAR PAGO REALIZADO</button>
                                        <button onClick={() => setPaymentStatus('SELECTION')} className="w-full text-gray-400 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-indigo-600 transition-colors"><ArrowLeft size={12}/> Elegir otro medio</button>
                                    </div>
                                </div>
                            )}

                            {paymentStatus === 'CONFIRMATION' && (
                                <div className="text-center py-10 space-y-6 animate-fade-in">
                                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <CheckCircle size={48}/>
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">¡Recibido!</h4>
                                        <p className="text-gray-500 text-xs font-medium mt-3 max-w-[240px] mx-auto leading-relaxed">Tu aviso de pago está en revisión. Actualizaremos tu saldo apenas validemos la transferencia.</p>
                                    </div>
                                    <button onClick={() => setIsPaymentModalOpen(false)} className="w-full bg-slate-900 text-white py-4 rounded-[1.2rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform text-xs">Aceptar y Volver</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: VER COMPROBANTE DETALLADO - FIJADO AL VIEWPORT */}
            {viewingVoucher && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-lg shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Detalle de Operación</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">• {viewingVoucher.date}</span>
                                </div>
                                <h3 className="text-xl font-black tracking-tighter uppercase leading-none">{viewingVoucher.voucherType}</h3>
                            </div>
                            <button onClick={() => setViewingVoucher(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto Total</p>
                                    <p className={`text-2xl font-black text-slate-800 tracking-tighter ${viewingVoucher.debit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ${(viewingVoucher.debit || viewingVoucher.credit).toLocaleString('es-AR')}
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Estado Fiscal</p>
                                    <div className="flex items-center gap-2 text-green-600 font-black uppercase text-[10px] mt-1">
                                        <CheckCircle size={16}/> Validado ARCA
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    {/* Import check: Info is now imported from lucide-react */}
                                    <Info size={12} className="text-indigo-600"/> Concepto del Movimiento
                                </h4>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                    <p className="text-xs text-slate-600 font-bold uppercase leading-relaxed">{viewingVoucher.description}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                                    <Download size={14}/> PDF COMPLETO
                                </button>
                                <button className="p-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 hover:bg-green-100 transition-all active:scale-90">
                                    <Share2 size={18}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerPortal;
