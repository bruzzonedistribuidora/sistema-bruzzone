
import React, { useState, useMemo } from 'react';
import { 
    LogOut, FileText, Calendar, DollarSign, ArrowUpRight, TrendingUp, 
    CheckCircle, CreditCard, Banknote, Copy, X, ExternalLink, 
    ChevronRight, Smartphone, Landmark, Check, Eye, Printer, 
    Share2, Mail, MessageCircle, Download, Package, QrCode
} from 'lucide-react';
import { Client, CurrentAccountMovement, CompanyConfig, PaymentAccount } from '../types';

interface CustomerPortalProps {
    client: Client;
    onLogout: () => void;
}

// Mock de movimientos con ítems para demostración en el portal
const mockMovementsExtended = [
    { 
        id: '1', 
        date: '2023-10-01', 
        voucherType: 'FC A 0001-00004500', 
        description: 'Compra de Materiales Eléctricos', 
        debit: 200000, 
        credit: 0, 
        balance: 200000,
        items: [
            { desc: 'Cable Unipolar 2.5mm (100m)', qty: 2, price: 45000, subtotal: 90000 },
            { desc: 'Caja Térmica 12 bocas', qty: 1, price: 25000, subtotal: 25000 },
            { desc: 'Pack 10 Teclas Punto/Toma', qty: 5, price: 17000, subtotal: 85000 }
        ]
    },
    { 
        id: '2', 
        date: '2023-10-05', 
        voucherType: 'REC X 0001-00000100', 
        description: 'Pago a cuenta - Transferencia', 
        debit: 0, 
        credit: 50000, 
        balance: 150000,
        items: [] 
    },
    { 
        id: '3', 
        date: '2023-10-15', 
        voucherType: 'FC A 0001-00004588', 
        description: 'Herramientas de Mano', 
        debit: 35000, 
        credit: 0, 
        balance: 185000,
        items: [
            { desc: 'Juego Destornilladores Stanley x6', qty: 1, price: 22000, subtotal: 22000 },
            { desc: 'Cinta Métrica 5m Magnética', qty: 1, price: 13000, subtotal: 13000 }
        ]
    },
];

const CustomerPortal: React.FC<CustomerPortalProps> = ({ client, onLogout }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'SELECTION' | 'DETAILS' | 'CONFIRMATION'>('SELECTION');
    const [copyType, setCopyType] = useState<'NONE' | 'ALIAS' | 'CBU'>('NONE');
    const [viewingVoucher, setViewingVoucher] = useState<any | null>(null);

    // --- MEJORA: Configuración con fallbacks automáticos para asegurar visualización ---
    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        if (saved) return JSON.parse(saved);
        
        // Cuentas por defecto si el administrador no configuró nada aún
        return {
            name: 'FERRETERIA BRUZZONE S.A.',
            paymentAccounts: [
                { id: 'def-1', type: 'VIRTUAL_WALLET', bankName: 'Mercado Pago', alias: 'ferre.bruzzone.mp', cbu: '', owner: 'Bruzzone SA', active: true },
                { id: 'def-2', type: 'BANK', bankName: 'Banco Galicia', alias: 'bruzzone.galicia', cbu: '0070012345678901234567', owner: 'Bruzzone SA', active: true }
            ]
        } as CompanyConfig;
    }, []);

    // Solo mostrar las cuentas activas
    const activeAccounts = useMemo(() => 
        companyConfig.paymentAccounts.filter(acc => acc.active), 
    [companyConfig]);

    const handleCopy = (text: string, type: 'ALIAS' | 'CBU') => {
        navigator.clipboard.writeText(text);
        setCopyType(type);
        setTimeout(() => setCopyType('NONE'), 2000);
    };

    const handlePrint = () => { window.print(); };

    const shareByWhatsApp = (voucher: any) => {
        const text = `Hola! Soy ${client.name}. Te comparto el detalle de mi comprobante ${voucher.voucherType} por un total de $${(voucher.debit || voucher.credit).toLocaleString('es-AR')}.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col animate-fade-in relative">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 px-4 md:px-8 h-20 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-2 rounded-xl text-white font-black text-lg">FB</div>
                    <div>
                        <h1 className="text-lg font-black text-gray-800 tracking-tighter uppercase leading-none">{companyConfig.name || 'Ferretería Bruzzone'}</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Portal de Autogestión</p>
                    </div>
                </div>
                <button onClick={onLogout} className="text-gray-400 hover:text-red-600 flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-gray-100">
                    <LogOut size={16} /> SALIR
                </button>
            </header>

            <main className="flex-1 max-w-5xl mx-auto px-4 md:px-8 py-8 w-full space-y-8">
                <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-slate-200">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <TrendingUp size={240}/>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Estado de Cuenta: {client.name}</p>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-4">
                                <span className="text-slate-500 block text-2xl uppercase font-bold tracking-normal mb-1">Saldo a Pagar</span>
                                ${client.balance.toLocaleString('es-AR')}
                            </h2>
                            <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                                <Calendar size={16}/> Sincronizado en tiempo real
                            </div>
                        </div>
                        <button 
                            onClick={() => { setPaymentStatus('SELECTION'); setIsPaymentModalOpen(true); }}
                            className="w-full md:w-auto bg-green-500 text-white px-10 py-5 rounded-3xl font-black hover:bg-green-400 shadow-xl shadow-green-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-xl uppercase tracking-tighter">
                            <DollarSign size={28}/> PAGAR SALDO
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h4 className="font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
                            <FileText className="text-ferre-orange"/> Historial de Facturas y Pagos
                        </h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">Comprobante</th>
                                    <th className="px-8 py-4">Descripción</th>
                                    <th className="px-8 py-4 text-right">Monto</th>
                                    <th className="px-8 py-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {mockMovementsExtended.map(m => (
                                    <tr key={m.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-gray-800 uppercase">{m.voucherType}</p>
                                            <p className="text-xs text-gray-400 font-bold mt-1">{m.date}</p>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-gray-600 font-medium">{m.description}</td>
                                        <td className={`px-8 py-6 text-right font-black text-lg ${m.debit > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {m.debit > 0 ? `+ $${m.debit.toLocaleString('es-AR')}` : `- $${m.credit.toLocaleString('es-AR')}`}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button 
                                                onClick={() => setViewingVoucher(m)}
                                                className="p-3 bg-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm group-hover:scale-110"
                                            >
                                                <Eye size={20}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* PAYMENT MODAL (Corregido para mostrar cuentas siempre) */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-auto max-h-[90vh]">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-500 text-white rounded-2xl shadow-lg"><DollarSign size={24}/></div>
                                <h3 className="font-black text-2xl text-gray-800 uppercase tracking-tighter">Medios de Pago</h3>
                            </div>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={28}/></button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            {paymentStatus === 'SELECTION' && (
                                <div className="space-y-4">
                                    <div className="text-center mb-8">
                                        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Información de Transferencia</p>
                                    </div>
                                    <div className="space-y-3">
                                        {activeAccounts.length > 0 ? activeAccounts.map(acc => (
                                            <button 
                                                key={acc.id} 
                                                onClick={() => { setSelectedAccount(acc); setPaymentStatus('DETAILS'); }} 
                                                className="w-full group flex items-center p-6 bg-white border-2 border-gray-100 rounded-[2rem] hover:border-green-400 hover:bg-green-50 transition-all text-left shadow-sm hover:shadow-md">
                                                <div className="p-4 rounded-2xl bg-gray-50 text-gray-400 mr-5 group-hover:bg-white group-hover:text-green-600 transition-colors">
                                                    {acc.type === 'VIRTUAL_WALLET' ? <Smartphone size={32}/> : <Landmark size={32}/>}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-gray-800 text-lg uppercase tracking-tight leading-none mb-1">{acc.bankName}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{acc.type === 'BANK' ? 'Cuenta Bancaria' : 'Billetera Digital'}</p>
                                                </div>
                                                <ChevronRight size={24} className="text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all"/>
                                            </button>
                                        )) : (
                                            <div className="py-10 text-center text-gray-400">
                                                <p className="font-bold">No hay medios de pago disponibles en este momento.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {paymentStatus === 'DETAILS' && selectedAccount && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white text-center shadow-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destinatario</p>
                                        <h4 className="font-black text-2xl uppercase tracking-tighter">{selectedAccount.bankName}</h4>
                                        <p className="text-xs text-indigo-400 font-black mt-1 uppercase">{selectedAccount.owner}</p>
                                    </div>

                                    {/* QR Code Section */}
                                    {selectedAccount.qrImage && (
                                        <div className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Escaneá para pagar</p>
                                            <div className="w-48 h-48 bg-gray-50 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center p-2">
                                                <img src={selectedAccount.qrImage} alt="QR de Pago" className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase">
                                                <QrCode size={14}/> Código QR Disponible
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Alias de la Cuenta</label>
                                            <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl group">
                                                <p className="text-2xl font-mono font-black text-blue-700 truncate mr-4">{selectedAccount.alias}</p>
                                                <button 
                                                    onClick={() => handleCopy(selectedAccount.alias, 'ALIAS')} 
                                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${copyType === 'ALIAS' ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-blue-700 shadow-sm hover:bg-blue-50 border border-blue-100'}`}>
                                                    {copyType === 'ALIAS' ? <Check size={14}/> : <Copy size={14}/>}
                                                    {copyType === 'ALIAS' ? 'COPIADO' : 'COPIAR'}
                                                </button>
                                            </div>
                                        </div>

                                        {selectedAccount.cbu && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">CBU / CVU</label>
                                                <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl group">
                                                    <p className="text-sm font-mono font-bold text-gray-600 truncate mr-4">{selectedAccount.cbu}</p>
                                                    <button 
                                                        onClick={() => handleCopy(selectedAccount.cbu, 'CBU')} 
                                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${copyType === 'CBU' ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-200'}`}>
                                                        {copyType === 'CBU' ? <Check size={14}/> : <Copy size={14}/>}
                                                        {copyType === 'CBU' ? 'COPIADO' : 'COPIAR'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 space-y-3">
                                        <button onClick={() => setPaymentStatus('CONFIRMATION')} className="w-full bg-green-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-green-200 hover:bg-green-500 transition-all uppercase tracking-tighter">NOTIFICAR TRANSFERENCIA REALIZADA</button>
                                        <button onClick={() => setPaymentStatus('SELECTION')} className="w-full text-gray-400 text-xs font-black uppercase tracking-widest py-2 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"><ChevronRight size={14} className="rotate-180"/> Volver a las opciones</button>
                                    </div>
                                </div>
                            )}

                            {paymentStatus === 'CONFIRMATION' && (
                                <div className="text-center py-10 space-y-6 animate-fade-in">
                                    <div className="w-28 h-28 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <CheckCircle size={64}/>
                                    </div>
                                    <div>
                                        <h4 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">¡Aviso Recibido!</h4>
                                        <p className="text-gray-500 font-medium mt-2 max-w-xs mx-auto leading-relaxed">Tu pago ha sido notificado. El saldo se actualizará automáticamente una vez que administración confirme la recepción del dinero.</p>
                                    </div>
                                    <button onClick={() => setIsPaymentModalOpen(false)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">Cerrar y volver al portal</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* VOUCHER DETAIL MODAL */}
            {viewingVoucher && (
                <div className="fixed inset-0 z-[120] flex items-center justify-end bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col animate-slide-in-right">
                        <div className="p-8 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-ferre-orange">Detalle de Comprobante</span>
                                    <span className="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{viewingVoucher.date}</span>
                                </div>
                                <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">{viewingVoucher.voucherType}</h3>
                            </div>
                            <button onClick={() => setViewingVoucher(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                                <X size={28}/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto Total</p>
                                    <p className={`text-3xl font-black tracking-tighter ${viewingVoucher.debit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ${(viewingVoucher.debit || viewingVoucher.credit).toLocaleString('es-AR')}
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estado</p>
                                    <div className="flex items-center gap-2 text-green-600 font-black uppercase text-sm mt-1">
                                        <CheckCircle size={18}/> Registrado
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Package size={16} className="text-ferre-orange"/> Artículos
                                </h4>
                                
                                {viewingVoucher.items && viewingVoucher.items.length > 0 ? (
                                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-4">Descripción</th>
                                                    <th className="px-6 py-4 text-center">Cant.</th>
                                                    <th className="px-6 py-4 text-right">Unitario</th>
                                                    <th className="px-6 py-4 text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 text-sm">
                                                {viewingVoucher.items.map((item: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-700">{item.desc}</td>
                                                        <td className="px-6 py-4 text-center font-black text-gray-500">{item.qty}</td>
                                                        <td className="px-6 py-4 text-right font-medium text-gray-400">${item.price.toLocaleString('es-AR')}</td>
                                                        <td className="px-6 py-4 text-right font-black text-slate-900">${item.subtotal.toLocaleString('es-AR')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                        <FileText size={40} className="mx-auto text-gray-300 mb-2 opacity-30"/>
                                        <p className="text-gray-400 font-bold text-sm">Este comprobante no contiene un desglose de ítems.</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Opciones</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => shareByWhatsApp(viewingVoucher)} className="flex items-center justify-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 font-black text-xs uppercase tracking-widest hover:bg-green-100 transition-all shadow-sm">
                                        <MessageCircle size={18}/> WhatsApp
                                    </button>
                                    <button onClick={handlePrint} className="flex items-center justify-center gap-3 p-4 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm">
                                        <Printer size={18}/> Imprimir
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setViewingVoucher(null)} className="px-8 py-3 bg-white border border-gray-300 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:text-gray-800 hover:border-gray-800 transition-all">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerPortal;
