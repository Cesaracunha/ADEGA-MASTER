import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { InventoryLog } from '../types';
import { format } from 'date-fns';

export default function Inventory() {
  const { products, inventoryLogs, addInventoryLog } = useStore();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [type, setType] = useState<'Entrada' | 'Saída' | 'Ajuste'>('Entrada');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    addInventoryLog({
      productId: product.id,
      productName: product.name,
      type,
      quantity,
      reason
    });

    setSelectedProductId('');
    setQuantity(0);
    setReason('');
    setType('Entrada');
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-between items-end mb-2 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Inventário</h2>
          <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-widest">Controle de entradas, saídas e ajustes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 lg:col-span-4 h-fit">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Novo Lançamento</h3>
          </div>
          <form onSubmit={handleLogSubmit} className="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Produto / Item</label>
              <select 
                required
                value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}
                className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-bold text-sm bg-slate-50 text-slate-700"
              >
                <option value="">Selecione um produto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Atual: {p.stock} un)</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Movimentação</label>
                <select 
                  value={type} onChange={e => setType(e.target.value as any)}
                  className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-bold text-sm bg-slate-50 text-slate-700"
                >
                  <option value="Entrada">Entrada</option>
                  <option value="Saída">Saída</option>
                  <option value="Ajuste">Ajuste / Cego</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Quantidade</label>
                <input 
                  type="number" min="0" required
                  value={quantity || ''} onChange={e => setQuantity(parseInt(e.target.value))}
                  className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-black text-sm bg-slate-50 text-right"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Justificativa / Motivo</label>
              <input 
                type="text"
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Ex: Quebra, Compra NF 123..."
                className="p-2 border border-slate-300 rounded focus:ring-1 focus:ring-red-500 font-bold text-sm bg-slate-50"
              />
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded font-black text-[10px] uppercase tracking-widest shadow-md transition-colors mt-2">
              Registrar Movimentação
            </button>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 lg:col-span-8 flex flex-col overflow-hidden h-full">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
             <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Registros de Modificação</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Produto Base</th>
                  <th className="p-3 text-center">Ação</th>
                  <th className="p-3 text-right">Qtd</th>
                  <th className="p-3">Histórico/Motivo</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {inventoryLogs.slice().reverse().map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-[10px] text-slate-600 font-bold uppercase tracking-widest">{format(new Date(log.date), "dd/MM HH:mm")}</td>
                    <td className="p-3 font-bold text-slate-800">{log.productName}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                        log.type === 'Entrada' ? 'bg-emerald-100 text-emerald-800' :
                        log.type === 'Saída' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-slate-700">{log.quantity}</td>
                    <td className="p-3 text-[10px] font-bold text-slate-500">{log.reason || '-'}</td>
                  </tr>
                ))}
                {inventoryLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      Nenhuma movimentação registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
