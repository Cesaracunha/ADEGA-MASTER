import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { CartItem, Product, PaymentMethod, Sale } from '../types';
import { ShoppingCart, Search, X, Plus, Minus, CreditCard, Banknote, Landmark, Smartphone, Printer } from 'lucide-react';
import { printReceipt } from '../lib/printUtils';

export default function POS() {
  const { products, addSale, addVale } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'Fiado' | ''>('');
  const [customerName, setCustomerName] = useState(''); // for fiado
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount for barcode scanner readiness
  useEffect(() => {
    searchInputRef.current?.focus();
  }, [checkoutStep]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;
    
    // Look for exact barcode match first
    let productMatch = products.find(p => p.barcode === searchTerm);
    
    // If no exact barcode match, look for exact name match
    if (!productMatch) {
      productMatch = products.find(p => p.name.toLowerCase() === searchTerm.toLowerCase());
    }

    // If still no exact match, but filtering leaves exactly 1 product, use that
    if (!productMatch) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.barcode.includes(searchTerm)
      );
      if (filtered.length === 1) {
        productMatch = filtered[0];
      }
    }
    
    if (productMatch) {
      addToCart(productMatch);
      setSearchTerm('');
    } else {
      // It might be a manual search, just keep the term and let the user click below
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.price } 
            : item
        );
      }
      return [...prev, { id: crypto.randomUUID(), product, quantity: 1, subtotal: product.price }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ, subtotal: newQ * item.product.price };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const discountAmount = (discount / 100) * cartTotal;
  const finalTotal = Math.max(0, cartTotal - discountAmount);
  const change = Math.max(0, amountPaid - finalTotal);

  const handleCompleteSale = async () => {
    if (paymentMethod === 'Fiado') {
      if (!customerName) {
        alert("Preencha o nome do cliente para o Vale/Fiado.");
        return;
      }
      await addVale({
        customerName,
        date: new Date().toISOString(),
        items: cart,
        total: finalTotal,
        status: 'Pendente'
      });
      setLastSale(null); // Vales could have a print function later, but skipping now
      setCheckoutStep('success');
    } else {
      const sale = await addSale({
        date: new Date().toISOString(),
        items: cart,
        total: cartTotal,
        discount: discountAmount,
        finalTotal,
        paymentMethod: paymentMethod as PaymentMethod,
        amountPaid: paymentMethod === 'Dinheiro' ? amountPaid : finalTotal,
        change: paymentMethod === 'Dinheiro' ? change : 0,
        status: 'Concluída'
      });
      if (sale) {
        setLastSale(sale);
        printReceipt(sale); // Auto print on success
      }
      setCheckoutStep('success');
    }
  };

  const resetPOS = () => {
    setCart([]);
    setDiscount(0);
    setAmountPaid(0);
    setPaymentMethod('');
    setCustomerName('');
    setSearchTerm('');
    setLastSale(null);
    setCheckoutStep('cart');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm)
  );

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 h-full">
      
      {/* Left Area: Product Selection */}
      <div className="flex-1 lg:col-span-8 flex flex-col gap-4 overflow-hidden lg:h-full">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-none">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase absolute left-3 top-2 pointer-events-none">Barcode / Manual</label>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  if (val) {
                    const exactBarcodeProduct = products.find(p => p.barcode === val);
                    if (exactBarcodeProduct) {
                      addToCart(exactBarcodeProduct);
                      setSearchTerm('');
                    }
                  }
                }}
                placeholder="Escaneie o código ou digite o nome..."
                className="w-full pt-6 pb-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-medium text-slate-800"
              />
            </div>
          </form>
        </div>

        {searchTerm.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-auto p-4 content-start">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`text-left rounded-lg border transition-all h-28 relative overflow-hidden group shadow-sm ${
                    product.stock <= 0 
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed' 
                    : 'border-slate-300 hover:border-red-400 hover:shadow-md'
                  }`}
                >
                  {/* Adega Background Image */}
                  <div 
                    className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: 'url("https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&q=80&w=400")',
                    }}
                  />
                  {/* Gradient overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/40 z-0 group-hover:via-white/70 transition-colors duration-300"></div>

                  <div className="relative z-10 flex flex-col justify-between h-full w-full p-3">
                    <div className="flex justify-between items-start mb-1 w-full gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-800 text-white rounded uppercase shadow-sm truncate">
                        {product.category}
                      </span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap ${product.stock <= 0 ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-700'}`}>
                        {product.stock} un
                      </span>
                    </div>
                    
                    <div className="mt-auto">
                      <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
                        {product.name}
                      </h4>
                      <div className="text-lg font-black text-emerald-700 mt-0.5 drop-shadow-sm">
                        R$ {product.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden relative">
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center opacity-90"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&q=80&w=1200")',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 to-transparent z-10"></div>
            <div className="relative z-20 h-full flex flex-col items-center justify-end p-8 pb-12 pointer-events-none text-white text-center">
              <h2 className="text-3xl font-black uppercase tracking-widest drop-shadow-md">Modo Caixa</h2>
              <p className="text-sm font-bold opacity-90 drop-shadow-md uppercase tracking-widest">Escaneie ou busque produtos para adicionar à venda</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Area: Cart & Checkout */}
      <aside className="h-[45vh] min-h-[300px] lg:h-full lg:col-span-4 flex flex-col gap-4 overflow-hidden">
        
        {checkoutStep === 'cart' && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-red-950 flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-700 text-xs uppercase">Itens da Venda Atual</h3>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">{cart.length} Itens</span>
            </div>

            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-3">Qtd.</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {cart.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 relative group">
                      <td className="p-3 font-bold text-slate-700 w-16">
                        <div className="flex items-center gap-1 bg-slate-100 rounded px-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-500 hover:text-red-500 font-black">-</button>
                          <span className="mx-1">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-500 hover:text-emerald-500 font-black">+</button>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-800 leading-tight">
                        {item.product.name}
                        <div className="text-[10px] text-slate-400">R$ {item.product.price.toFixed(2)} und</div>
                      </td>
                      <td className="p-3 text-right font-black text-slate-800">
                        R$ {item.subtotal.toFixed(2)}
                        <button onClick={() => removeFromCart(item.id)} className="block w-full text-[10px] text-red-400 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100">Remover</button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-10 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Carrinho vazio</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col gap-3">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Subtotal Estimado</span>
                <span className="text-lg font-black text-slate-800">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Desconto Especial (%)</label>
                <input 
                  type="number" min="0" max="100" step="1"
                  value={discount || ''}
                  onChange={e => {
                    let val = parseFloat(e.target.value) || 0;
                    if (val > 100) val = 100;
                    if (val < 0) val = 0;
                    setDiscount(val);
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-right font-black text-red-600 text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="bg-red-950 text-white rounded-xl p-4 flex justify-between items-center shadow-inner mt-1">
                <span className="text-xs font-bold uppercase opacity-80">Total a Pagar</span>
                <span className="text-3xl font-black">R$ {finalTotal.toFixed(2)}</span>
              </div>
              
              <button 
                onClick={() => setCheckoutStep('payment')}
                disabled={cart.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-lg transition-all shadow-md uppercase tracking-wide mt-2"
              >
                Prosseguir Coleta
              </button>
            </div>
          </div>
        )}

        {checkoutStep === 'payment' && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-red-950 flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
              <button onClick={() => setCheckoutStep('cart')} className="text-slate-500 hover:text-red-600 p-1 bg-slate-200 rounded">
                <X size={16} />
              </button>
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest">Finalização</h3>
            </div>
            
            <div className="p-4 flex-1 overflow-auto flex flex-col gap-4">
              <div className="bg-slate-100 p-4 rounded-xl text-center border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Valor Cobrado</span>
                <div className="text-4xl font-black text-red-950 mt-1">R$ {finalTotal.toFixed(2)}</div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase">
                  {[
                    { id: 'Dinheiro', cls: 'bg-slate-200 text-slate-800 border-slate-300' },
                    { id: 'PIX', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                    { id: 'Cartão de Crédito', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
                    { id: 'Cartão de Débito', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
                    { id: 'Fiado', cls: 'bg-amber-100 text-amber-800 border-amber-300 col-span-2' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setPaymentMethod(m.id as PaymentMethod | 'Fiado');
                        if (m.id !== 'Dinheiro') setAmountPaid(finalTotal);
                      }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === m.id ? 'border-red-600 bg-red-50 text-red-800 shadow-md transform scale-[1.02]' : m.cls + ' hover:brightness-95 hover:border-slate-400'
                      }`}
                    >
                      {m.id}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Dinheiro' && (
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-600 font-black uppercase">Recebido:</span>
                    <input
                      type="number" min={finalTotal} step="0.01"
                      value={amountPaid || ''}
                      onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                      className="w-24 text-right bg-white font-black border border-slate-300 rounded p-1 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  {amountPaid >= finalTotal && (
                    <div className="flex justify-between items-center p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 font-black uppercase tracking-widest">TROCO ESPERADO:</span>
                      <span className="text-xl font-black text-emerald-900">R$ {change.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'Fiado' && (
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                  <span className="text-[10px] text-amber-800 font-black uppercase">Atribuição de Vale</span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-sm font-bold placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Nome completo do Cliente"
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0">
              <button 
                onClick={handleCompleteSale}
                disabled={!paymentMethod || (paymentMethod === 'Dinheiro' && amountPaid < finalTotal) || (paymentMethod === 'Fiado' && !customerName)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-lg transition-all shadow-lg uppercase tracking-wide"
              >
                Concluir Transação
              </button>
            </div>
          </div>
        )}

        {checkoutStep === 'success' && (
          <div className="bg-emerald-50 rounded-xl shadow-lg border-2 border-emerald-600 flex flex-col h-full overflow-hidden text-center justify-center p-6 gap-4">
            <div className="w-20 h-20 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-black text-emerald-900 uppercase">
              {paymentMethod === 'Fiado' ? 'Vale Aberto!' : 'Venda Concluída!'}
            </h2>
            <p className="text-emerald-700 text-sm font-bold">Estoque atualizado nos registros.</p>
            
            <div className="flex flex-col gap-2 mt-6">
              {lastSale && (
                <button
                  onClick={() => printReceipt(lastSale)}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Imprimir Cupom Novamente
                </button>
              )}
              <button 
                onClick={resetPOS}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg"
              >
                Iniciar Nova Venda
              </button>
            </div>
          </div>
        )}
      </aside>

    </div>
  );
}
