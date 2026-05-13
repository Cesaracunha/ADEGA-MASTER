import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Vale, Product, CartItem } from '../types';
import { format } from 'date-fns';
import { CheckCircle2, CircleDashed, Search, Edit2, Trash2, X, Plus, Minus } from 'lucide-react';

export default function Vales() {
  const { vales, addVale, payVale, updateVale, deleteVale, products } = useStore();
  const [filter, setFilter] = useState<'Todas' | 'Pendente' | 'Pago'>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVale, setEditingVale] = useState<Vale | null>(null);

  const [isAddingVale, setIsAddingVale] = useState(false);
  const [newValeCustomer, setNewValeCustomer] = useState('');
  const [newValeStatus, setNewValeStatus] = useState<'Pendente'|'Pago'>('Pendente');
  const [newValeCart, setNewValeCart] = useState<CartItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
    p.barcode.includes(productSearchTerm.toLowerCase())
  );

  const addToCart = (product: Product, isEditMode: boolean) => {
    const setCart = isEditMode ? 
      (fn: any) => setEditingVale(prev => prev ? { ...prev, items: fn(prev.items || []), total: fn(prev.items || []).reduce((acc: number, item: CartItem) => acc + item.subtotal, 0) } : prev) 
      : setNewValeCart;
    
    setCart((prev: CartItem[]) => {
      const items = prev || [];
      const existing = items.find(item => item.product.id === product.id);
      if (existing) {
        return items.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.price } 
            : item
        );
      }
      return [...items, { id: crypto.randomUUID(), product, quantity: 1, subtotal: product.price }];
    });
  };

  const updateCartQuantity = (id: string, delta: number, isEditMode: boolean) => {
    const setCart = isEditMode ? 
      (fn: any) => setEditingVale(prev => prev ? { ...prev, items: fn(prev.items || []), total: fn(prev.items || []).reduce((acc: number, item: CartItem) => acc + item.subtotal, 0) } : prev) 
      : setNewValeCart;

    setCart((prev: CartItem[]) => {
      const items = prev || [];
      return items.map(item => {
        if (item.id === id) {
          const newQ = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQ, subtotal: newQ * item.product.price };
        }
        return item;
      });
    });
  };

  const removeFromCart = (id: string, isEditMode: boolean) => {
    const setCart = isEditMode ? 
      (fn: any) => setEditingVale(prev => prev ? { ...prev, items: fn(prev.items || []), total: fn(prev.items || []).reduce((acc: number, item: CartItem) => acc + item.subtotal, 0) } : prev) 
      : setNewValeCart;
      
    setCart((prev: CartItem[]) => (prev || []).filter(item => item.id !== id));
  };

  const filteredVales = vales.filter(v => {
    const matchesStatus = filter === 'Todas' || v.status === filter;
    const matchesSearch = v.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVale) {
      updateVale(editingVale);
      setEditingVale(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja realmente excluir este vale? Os produtos voltarão ao estoque.")) {
      deleteVale(id);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValeCustomer || newValeCart.length === 0) {
      alert('Adicione pelo menos um produto e informe o cliente.');
      return;
    }

    const total = newValeCart.reduce((acc, item) => acc + item.subtotal, 0);

    addVale({
      customerName: newValeCustomer,
      date: new Date().toISOString(),
      items: newValeCart,
      total: total,
      status: newValeStatus
    });

    setIsAddingVale(false);
    setNewValeCustomer('');
    setNewValeStatus('Pendente');
    setNewValeCart([]);
    setProductSearchTerm('');
  };

  return (
    <div className="flex flex-col gap-4 h-full relative">
      <div className="flex justify-between items-end mb-2 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gestão de Vales</h2>
          <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-widest">Controle de Fiados e Cobranças</p>
        </div>
        <button 
          onClick={() => setIsAddingVale(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-black text-[10px] uppercase tracking-widest shadow-md transition-colors"
        >
          + Lançar Vale
        </button>
      </div>

      {/* Top Bar: Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-3 shrink-0 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          {['Todas', 'Pendente', 'Pago'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-black tracking-widest transition-colors border ${
                filter === status 
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm font-bold border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
          {filteredVales.slice().reverse().map(vale => (
            <div key={vale.id} className="bg-white text-left p-4 rounded-xl flex flex-col justify-between min-h-[12rem] border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              {/* Status Ribbon */}
              <div className={`absolute top-0 right-0 w-16 h-16 ${vale.status === 'Pago' ? 'bg-emerald-500' : 'bg-amber-500'} 
                             translate-x-8 -translate-y-8 rotate-45`}></div>
              
              {/* Overlay Controls */}
              <div className="absolute top-2 right-2 flex gap-1 z-20">
                <button 
                  onClick={() => setEditingVale(vale)} 
                  className="bg-white/90 p-1.5 rounded shadow text-slate-400 hover:text-amber-600 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(vale.id)} 
                  className="bg-white/90 p-1.5 rounded shadow text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2 pr-12">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {format(new Date(vale.date), "dd/MM/yyyy HH:mm")}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${vale.status === 'Pago' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {vale.status}
                  </span>
                </div>
                
                <h3 className="font-black text-slate-800 text-lg leading-tight mb-1 truncate">{vale.customerName}</h3>
                
                <div className="text-[10px] text-slate-500 font-medium mb-auto min-h-[2.5rem] line-clamp-2 leading-tight">
                  {(vale.items || []).map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                </div>

                <div className="flex justify-between items-end mt-4 pt-2 border-t border-slate-100">
                   <div className="text-2xl font-black text-amber-900 border-b-2 border-amber-900/10">R$ {vale.total.toFixed(2)}</div>
                   {vale.status === 'Pendente' && (
                     <button
                       onClick={() => {
                        if(window.confirm(`Confirmar o recebimento de R$ ${vale.total.toFixed(2)} de ${vale.customerName}?`)) {
                          payVale(vale.id);
                        }
                       }}
                       className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-black py-2 px-3 rounded shadow hover:shadow-md transition-all flex items-center gap-1 opacity-90 group-hover:opacity-100"
                     >
                       <CheckCircle2 size={14} /> Quitar
                     </button>
                   )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredVales.length === 0 && (
             <div className="col-span-full py-16 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Nenhum vale encontrado
             </div>
          )}
        </div>
      </div>

      {/* Modal Edição */}
      {editingVale && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Editar Vale</h3>
              <button 
                onClick={() => {
                  setEditingVale(null);
                  setProductSearchTerm('');
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex flex-col md:flex-row gap-4 overflow-y-auto">
              
              {/* Esquerda: Cliente e Produtos */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Cliente</label>
                  <input 
                    type="text" 
                    required
                    value={editingVale.customerName}
                    onChange={e => setEditingVale({...editingVale, customerName: e.target.value})}
                    className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-bold text-sm bg-amber-50 text-amber-900"
                  />
                </div>

                <div className="flex flex-col gap-1 flex-1 min-h-[300px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Adicionar Produto</label>
                  <div className="relative mb-2 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou código..." 
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50 space-y-2">
                    {filteredProducts.slice(0, 10).map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addToCart(product, true)}
                        className="w-full text-left p-2 bg-white border border-slate-200 rounded hover:border-amber-400 flex justify-between items-center group"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{product.name}</p>
                          <p className="text-[10px] text-slate-500">Estoque: {product.stock} un</p>
                        </div>
                        <div className="text-sm font-black text-emerald-700">
                          R$ {product.price.toFixed(2)}
                        </div>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="text-center py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum produto encontrado</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Direita: Carrinho */}
              <div className="flex-1 lg:w-80 flex flex-col bg-slate-50 border border-slate-200 rounded-lg p-3 shrink-0">
                <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-3 border-b border-slate-200 pb-2">
                  Itens do Vale
                </h4>
                
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  {!(editingVale.items) || editingVale.items.length === 0 ? (
                    <div className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Carrinho vazio
                    </div>
                  ) : (
                    editingVale.items.map(item => (
                      <div key={item.id} className="bg-white p-2 rounded border border-slate-200 flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-800 leading-tight">{item.product.name}</span>
                          <button onClick={() => removeFromCart(item.id, true)} className="text-slate-400 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2 bg-slate-100 rounded p-0.5 border border-slate-200">
                            <button onClick={() => updateCartQuantity(item.id, -1, true)} className="p-1 hover:bg-white rounded text-slate-600">
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-black min-w-[1.5rem] text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, 1, true)} className="p-1 hover:bg-white rounded text-slate-600">
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="text-sm font-black text-emerald-700">
                            R$ {item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-white p-3 rounded border border-amber-200 mt-auto">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-slate-600 uppercase">Subtotal</span>
                     <span className="text-xl font-black text-amber-600">
                       R$ {editingVale.total.toFixed(2)}
                     </span>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Status do Lançamento</label>
                    <div className="flex bg-slate-100 p-1 rounded">
                       <button
                         type="button"
                         onClick={() => setEditingVale({...editingVale, status: 'Pendente'})}
                         className={`flex-1 py-1.5 text-xs font-black uppercase rounded ${editingVale.status === 'Pendente' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'}`}
                       >
                         Pendente (Fiado)
                       </button>
                       <button
                         type="button"
                         onClick={() => setEditingVale({...editingVale, status: 'Pago'})}
                         className={`flex-1 py-1.5 text-xs font-black uppercase rounded ${editingVale.status === 'Pago' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}
                       >
                         Pago (Baixa)
                       </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingVale(null);
                    setProductSearchTerm('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleEditSubmit}
                  className="px-6 py-2 bg-amber-600 text-white rounded font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-amber-700 transition-colors"
                >
                  Salvar Alterações
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lançar Vale */}
      {isAddingVale && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Registro de Vale</h3>
              <button 
                onClick={() => {
                  setIsAddingVale(false);
                  setNewValeCart([]);
                  setProductSearchTerm('');
                  setNewValeCustomer('');
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex flex-col md:flex-row gap-4 overflow-y-auto">
              
              {/* Esquerda: Cliente e Produtos */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Cliente</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: João Silva"
                    value={newValeCustomer}
                    onChange={e => setNewValeCustomer(e.target.value)}
                    className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-bold text-sm bg-amber-50 text-amber-900"
                  />
                </div>

                <div className="flex flex-col gap-1 flex-1 min-h-[300px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Adicionar Produto</label>
                  <div className="relative mb-2 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou código..." 
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50 space-y-2">
                    {filteredProducts.slice(0, 10).map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addToCart(product, false)}
                        className="w-full text-left p-2 bg-white border border-slate-200 rounded hover:border-amber-400 flex justify-between items-center group"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{product.name}</p>
                          <p className="text-[10px] text-slate-500">Estoque: {product.stock} un</p>
                        </div>
                        <div className="text-sm font-black text-emerald-700">
                          R$ {product.price.toFixed(2)}
                        </div>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="text-center py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum produto encontrado</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Direita: Carrinho */}
              <div className="flex-1 lg:w-80 flex flex-col bg-slate-50 border border-slate-200 rounded-lg p-3 shrink-0">
                <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-3 border-b border-slate-200 pb-2">
                  Itens do Vale
                </h4>
                
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  {newValeCart.length === 0 ? (
                    <div className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Carrinho vazio
                    </div>
                  ) : (
                    newValeCart.map(item => (
                      <div key={item.id} className="bg-white p-2 rounded border border-slate-200 flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-800 leading-tight">{item.product.name}</span>
                          <button onClick={() => removeFromCart(item.id, false)} className="text-slate-400 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2 bg-slate-100 rounded p-0.5 border border-slate-200">
                            <button onClick={() => updateCartQuantity(item.id, -1, false)} className="p-1 hover:bg-white rounded text-slate-600">
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-black min-w-[1.5rem] text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, 1, false)} className="p-1 hover:bg-white rounded text-slate-600">
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="text-sm font-black text-emerald-700">
                            R$ {item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-white p-3 rounded border border-amber-200 mt-auto">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-slate-600 uppercase">Subtotal</span>
                     <span className="text-xl font-black text-amber-600">
                       R$ {newValeCart.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)}
                     </span>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Status do Lançamento</label>
                    <div className="flex bg-slate-100 p-1 rounded">
                       <button
                         type="button"
                         onClick={() => setNewValeStatus('Pendente')}
                         className={`flex-1 py-1.5 text-xs font-black uppercase rounded ${newValeStatus === 'Pendente' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'}`}
                       >
                         Pendente (Fiado)
                       </button>
                       <button
                         type="button"
                         onClick={() => setNewValeStatus('Pago')}
                         className={`flex-1 py-1.5 text-xs font-black uppercase rounded ${newValeStatus === 'Pago' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}
                       >
                         Pago (Baixa)
                       </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddingVale(false);
                    setNewValeCart([]);
                    setProductSearchTerm('');
                    setNewValeCustomer('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddSubmit}
                  className="px-6 py-2 bg-amber-600 text-white rounded font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-amber-700 transition-colors"
                >
                  Confirmar Lançamento
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
