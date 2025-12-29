import React, { useState, useEffect } from 'react';
import { 
    Receipt, ListOrdered, RotateCcw, ClipboardList, FileSpreadsheet, 
    ShoppingCart, CreditCard, ChevronRight, LayoutDashboard 
} from 'lucide-react';
import POS from './POS';
import SalesOrders from './SalesOrders';
import CreditNotes from './CreditNotes';
import Remitos from './Remitos';
import Presupuestos from './Presupuestos';
import { InvoiceItem } from '../types';

interface SalesManagementProps {
    initialTab?: 'POS' | 'ORDERS' | 'CREDIT_NOTES' | 'REMITOS' | 'BUDGETS';
    itemsToBill?: InvoiceItem[] | null;
    itemsToRemito?: InvoiceItem[] | null;
    itemsToBudget?: InvoiceItem[] | null;
    onCartUsed: () => void;
}

const SalesManagement: React.FC<SalesManagementProps> = ({ 
    initialTab = 'POS', 
    itemsToBill, 
    itemsToRemito, 
    itemsToBudget,
    onCartUsed 
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const tabs = [
        { id: 'POS', label: 'Caja (POS)', icon: Receipt },
        { id: 'ORDERS', label: 'Pedidos', icon: ListOrdered },
        { id: 'CREDIT_NOTES', label: 'Notas Crédito', icon: RotateCcw },
        { id: 'REMITOS', label: 'Remitos/Cta Cte', icon: ClipboardList },
        { id: 'BUDGETS', label: 'Presupuestos', icon: FileSpreadsheet },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Barra de Pestañas Superior */}
            <div className="bg-white border-b border-gray-200 px-6 shrink-0 z-20">
                <div className="flex gap-2 h-14 items-end">
                    {tabs.map(tab => (
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

            {/* Contenedor de Submódulos */}
            <div className="flex-1 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    {activeTab === 'POS' && (
                        <POS 
                            initialCart={itemsToBill || undefined} 
                            onCartUsed={onCartUsed}
                        />
                    )}
                    {activeTab === 'ORDERS' && <SalesOrders />}
                    {activeTab === 'CREDIT_NOTES' && <CreditNotes />}
                    {activeTab === 'REMITOS' && (
                        <Remitos 
                            initialItems={itemsToRemito || undefined}
                            onItemsConsumed={onCartUsed}
                        />
                    )}
                    {activeTab === 'BUDGETS' && (
                        <Presupuestos 
                            initialItems={itemsToBudget || undefined}
                            onItemsConsumed={onCartUsed}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesManagement;
