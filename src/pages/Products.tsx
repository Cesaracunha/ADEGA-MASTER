import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Product } from '../types';

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    barcode: '',
    stock: 0,
    price: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateProduct({ ...formData, id: editingId });
      setEditingId(null);
    } else {
      addProduct(formData);
      setIsAdding(false);
    }
    setFormData({ name: '', category: '', barcode: '', stock: 0, price: 0 });
  };

  const handleEdit = (p: Product) => {
    setFormData({
      name: p.name,
      category: p.category,
      barcode: p.barcode,
      stock: p.stock,
      price: p.price
    });
    setEditingId(p.id);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Base de Produtos</h2>
          <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-widest">Controle de Estoque e Precificação</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', category: '', barcode: '', stock: 0, price: 0 }); }}
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded font-black text-[10px] uppercase tracking-widest shadow-md transition-colors"
        >
          + Novo Produto
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{editingId ? 'Editar Produto' : 'Cadastrar Produto'}</h3>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1 lg:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nome / Descrição</label>
              <input 
                type="text" required
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-bold text-sm bg-slate-50"
                placeholder="Ex: Cerveja Heineken 330ml"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
              <input 
                type="text"
                list="category-list"
                required
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value.toUpperCase()})}
                className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-bold text-sm bg-slate-50 uppercase text-slate-600"
                placeholder="Selecione ou digite..."
              />
              <datalist id="category-list">
                {Array.from(new Set(['CERVEJAS', 'VINHOS', 'DESTILADOS', 'REFRIGERANTES', 'SUCOS', 'SNACKS', 'OUTROS', ...products.map(p => p.category)])).filter(Boolean).map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Código de Barras</label>
              <input 
                type="text" required
                value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})}
                className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-mono text-sm bg-slate-50"
                placeholder="Escaneie ou digite"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Preço (R$)</label>
              <input 
                type="number" step="0.01" min="0" required
                value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-black text-sm text-emerald-700 bg-emerald-50 text-right border-emerald-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Estoque Inicial</label>
              <input 
                type="number" min="0" required
                value={formData.stock || ''} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-bold text-sm bg-slate-50 text-right"
              />
            </div>
            
            <div className="lg:col-span-2 flex items-end justify-end gap-2">
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-emerald-600 text-white rounded font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-colors"
              >
                {editingId ? 'Atualizar Registro' : 'Salvar Novo Produto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
           <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Catálogo Completo</h3>
           <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded">{products.length} Itens</span>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3">Nome / Detalhes</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Cód. Barras</th>
                <th className="p-3 text-right">Preço</th>
                <th className="p-3 text-right">Est.</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{product.name}</div>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-1 rounded text-slate-600">{product.category}</span>
                  </td>
                  <td className="p-3 text-[10px] text-slate-400 font-mono">
                    {product.barcode || 'Sem código'}
                  </td>
                  <td className="p-3 text-right font-black text-emerald-700">
                    R$ {product.price.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <span className={`font-black px-2 py-0.5 rounded text-xs ${product.stock <= 5 ? 'bg-red-100 text-red-700' : 'text-slate-600'}`}>
                      {product.stock} un
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEdit(product)} className="text-[10px] text-amber-600 font-black uppercase tracking-widest hover:underline z-10 relative">Editar</button>
                    <button onClick={() => deleteProduct(product.id)} className="text-[10px] text-red-600 font-black uppercase tracking-widest hover:underline z-10 relative">Excluir</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    Nenhum produto cadastrado no sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
