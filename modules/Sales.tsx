
import React, { useState } from 'react';
import { 
  Search, Plus, Trash2, ShoppingCart, 
  CreditCard, Wallet, Landmark, FileText, 
  CheckCircle2, X, ChevronRight,
  PackagePlus, Receipt, Tag, Scale,
  AlertCircle, Loader2
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';

interface CartItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  quantity: number | string;
}

const Sales: React.FC = () => {
  const { products, addSale } = useFirebase();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      alert("Sin stock disponible para este artículo");
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id 
        ? { ...item, quantity: Number(item.quantity) + 1 } 
        : item
      ));
    } else {
      setCart([...cart, { ...product, price: product.salePrice, quantity: 1 }]);
    }
  };

  const handleFinishSale = async () => {
    setIsProcessing(true);
    const saleData = {
      items: cart,
      total: cart.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0),
      paymentMethod,
      seller: "Admin PC 01" // Esto vendría del perfil del usuario
    };

    try {
      await addSale(saleData);
      alert("Venta procesada y stock descontado globalmente.");
      setCart([]);
      setShowCheckout(false);
    } catch (e) {
      alert("Error crítico al procesar venta");
    } finally {
      setIsProcessing(false);
    }
  };

  const total = cart.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Terminal de Venta Sincronizada</h1>
          <p className="text-slate-500">Realtime stock activo: {products.length} productos en red.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input 
                type="text" 
                placeholder="Escanea o busca por nombre..." 
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-xl font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="overflow-y-auto max-h-[450px] space-y-3 pr-2 custom-scrollbar">
              {filteredProducts.map(p => (
                <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:border-orange-200 transition-all cursor-pointer group" onClick={() => addToCart(p)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                      <Tag className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{p.name}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Stock: <span className={p.stock < 5 ? 'text-red-500' : 'text-slate-600'}>{p.stock}</span></span>
                        <span className="text-[10px] font-black text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded tracking-widest">{p.brand}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="text-xl font-black text-slate-900">${p.salePrice?.toLocaleString()}</p>
                    <Plus className="w-6 h-6 text-slate-300 group-hover:text-orange-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden max-h-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-600" /> Carrito
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">Cantidad: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">${(Number(item.price) * Number(item.quantity)).toLocaleString()}</p>
                  <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-slate-900 text-white space-y-5">
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-400 font-bold uppercase text-lg tracking-tighter">Total</span>
              <span className="text-3xl font-black text-orange-500">${total.toLocaleString()}</span>
            </div>
            <button 
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              className="w-full py-5 bg-orange-600 text-white rounded-[1.25rem] font-black text-xl shadow-xl hover:bg-orange-500 active:scale-95 transition-all"
            >
              COBRAR FINAL
            </button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-200">
            <h2 className="text-3xl font-black text-slate-900">Total: ${total.toLocaleString()}</h2>
            
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medio de Pago</label>
               <div className="grid grid-cols-2 gap-4">
                  {['cash', 'debit', 'credit', 'account'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-4 px-6 rounded-2xl border-2 font-black uppercase text-sm transition-all ${paymentMethod === m ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      {m === 'cash' ? 'Efectivo' : m === 'debit' ? 'T. Débito' : m === 'credit' ? 'T. Crédito' : 'Cta Cte'}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowCheckout(false)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
              <button 
                disabled={!paymentMethod || isProcessing}
                onClick={handleFinishSale}
                className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3"
              >
                {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : "Confirmar Pago Global"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
