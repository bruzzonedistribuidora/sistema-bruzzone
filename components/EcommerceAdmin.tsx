import React from 'react';
// Importamos los tipos desde el archivo central de tipos
import { ViewState, User, Client, InvoiceItem } from '../types';

const EcommerceAdmin: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800">Administración E-commerce</h1>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700">
                    Panel de control para Mercado Libre, Tienda Nube y Web Propia.
                </p>
            </div>
        </div>
    );
};

// Exportación única por defecto
export default EcommerceAdmin;
