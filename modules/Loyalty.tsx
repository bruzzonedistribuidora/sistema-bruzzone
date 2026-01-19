
import React from 'react';
import { Trophy, Gift, Ticket, UserCheck, Star, Users } from 'lucide-react';

const Loyalty: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Club de Fidelización</h1>
        <p className="text-slate-500">Motiva a tus clientes a volver con puntos y beneficios exclusivos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-8 rounded-3xl text-white shadow-xl">
          <Trophy className="w-12 h-12 mb-4 opacity-80" />
          <h3 className="text-xl font-bold mb-2">Puntos Entregados</h3>
          <p className="text-4xl font-black mb-4">42.580</p>
          <p className="text-sm opacity-80">Canjeables por $42.580 en órdenes de compra.</p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-purple-100 rounded-2xl text-purple-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">156</h3>
            <p className="text-slate-500 text-sm">Clientes Registrados</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-green-100 rounded-2xl text-green-600">
            <Ticket className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">24</h3>
            <p className="text-slate-500 text-sm">Cupones Activos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-orange-500" /> Ofertas de Canje
          </h3>
          <div className="space-y-4">
            {[
              { item: 'Juego de Destornilladores', points: 5000, value: '$5.500' },
              { item: 'Vale por $2000 en Pinturas', points: 1500, value: '$2.000' },
              { item: 'Guantes de Seguridad', points: 800, value: '$1.200' },
            ].map((o, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800">{o.item}</p>
                  <p className="text-xs text-slate-500">Valor real: {o.value}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-orange-600">{o.points} PTS</p>
                  <button className="text-[10px] font-bold uppercase text-slate-400 hover:text-orange-500">Editar</button>
                </div>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-colors">
              + Agregar Nueva Oferta
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-500" /> Cupones y Descuentos
          </h3>
          <div className="space-y-4">
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 border-dashed relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-blue-800 font-black text-xl mb-1">FERRO15OFF</p>
                <p className="text-blue-600 text-sm font-medium">15% Descuento en Herramientas Manuales</p>
                <p className="text-[10px] text-blue-400 mt-4 uppercase font-bold tracking-widest">Vence en 12 días</p>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Ticket className="w-16 h-16" />
              </div>
            </div>
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 border-dashed relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-green-800 font-black text-xl mb-1">BIENVENIDOCLUB</p>
                <p className="text-green-600 text-sm font-medium">Vale de $500 en tu primera compra</p>
                <p className="text-[10px] text-green-400 mt-4 uppercase font-bold tracking-widest">Sin vencimiento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loyalty;