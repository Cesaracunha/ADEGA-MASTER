import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Sale, Vale, InventoryLog } from '../types';
import { useAuth } from './AuthContext';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface StoreContextData {
  products: Product[];
  sales: Sale[];
  vales: Vale[];
  inventoryLogs: InventoryLog[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id'>) => Promise<Sale | undefined>;
  updateSaleStatus: (id: string, status: Sale['status']) => Promise<void>;
  addVale: (vale: Omit<Vale, 'id'>) => Promise<Vale | undefined>;
  updateVale: (vale: Vale) => Promise<void>;
  deleteVale: (id: string) => Promise<void>;
  payVale: (id: string) => Promise<void>;
  addInventoryLog: (log: Omit<InventoryLog, 'id' | 'date'>) => Promise<void>;
}

const StoreContext = createContext<StoreContextData>({} as StoreContextData);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      setProducts([]);
      setSales([]);
      setVales([]);
      setInventoryLogs([]);
      return;
    }

    const uid = currentUser.uid;
    const productsPath = `users/${uid}/products`;
    const salesPath = `users/${uid}/sales`;
    const valesPath = `users/${uid}/vales`;
    const logsPath = `users/${uid}/inventoryLogs`;

    const unsubProducts = onSnapshot(collection(db, productsPath), (snapshot) => {
      setProducts(snapshot.docs.map(doc => doc.data() as Product));
    }, (error) => handleFirestoreError(error, OperationType.LIST, productsPath));
    
    const unsubSales = onSnapshot(collection(db, salesPath), (snapshot) => {
      setSales(snapshot.docs.map(doc => doc.data() as Sale));
    }, (error) => handleFirestoreError(error, OperationType.LIST, salesPath));

    const unsubVales = onSnapshot(collection(db, valesPath), (snapshot) => {
      setVales(snapshot.docs.map(doc => doc.data() as Vale));
    }, (error) => handleFirestoreError(error, OperationType.LIST, valesPath));

    const unsubLogs = onSnapshot(collection(db, logsPath), (snapshot) => {
      setInventoryLogs(snapshot.docs.map(doc => doc.data() as InventoryLog));
    }, (error) => handleFirestoreError(error, OperationType.LIST, logsPath));

    return () => {
      unsubProducts();
      unsubSales();
      unsubVales();
      unsubLogs();
    };
  }, [currentUser, loading]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const id = crypto.randomUUID();
    const newProduct = { ...product, id };
    const path = `users/${uid}/products/${id}`;
    try {
      await setDoc(doc(db, 'users', uid, 'products', id), newProduct);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const path = `users/${uid}/products/${updatedProduct.id}`;
    try {
      await setDoc(doc(db, 'users', uid, 'products', updatedProduct.id), updatedProduct);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const path = `users/${uid}/products/${id}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const addSale = async (sale: Omit<Sale, 'id'>) => {
    if (!currentUser) return undefined;
    const uid = currentUser.uid;
    const id = crypto.randomUUID();
    const newSale = { ...sale, id };
    const path = `users/${uid}/sales/${id}`;
    
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid, 'sales', id), newSale);
      
      if (newSale.status === 'Concluída') {
        newSale.items.forEach(item => {
          const currentProduct = products.find(p => p.id === item.product.id);
          if (currentProduct) {
             const productRef = doc(db, 'users', uid, 'products', item.product.id);
             batch.update(productRef, { stock: currentProduct.stock - item.quantity });
          }
        });
      }
      await batch.commit();
      return newSale as Sale;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return undefined;
  };

  const updateSaleStatus = async (id: string, status: Sale['status']) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const sale = sales.find(s => s.id === id);
    if (!sale) return;

    const path = `users/${uid}/sales/${id}`;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', uid, 'sales', id), { status });
      
      if (sale.status !== 'Concluída' && status === 'Concluída') {
        sale.items.forEach(item => {
          const currentProduct = products.find(p => p.id === item.product.id);
          if (currentProduct) {
            const productRef = doc(db, 'users', uid, 'products', item.product.id);
            batch.update(productRef, { stock: currentProduct.stock - item.quantity });
          }
        });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const addVale = async (vale: Omit<Vale, 'id'>) => {
    if (!currentUser) return undefined;
    const uid = currentUser.uid;
    const id = crypto.randomUUID();
    const newVale = { ...vale, id };
    const path = `users/${uid}/vales/${id}`;

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid, 'vales', id), newVale);
      
      newVale.items.forEach(item => {
        const currentProduct = products.find(p => p.id === item.product.id);
        if (currentProduct) {
          const productRef = doc(db, 'users', uid, 'products', item.product.id);
          batch.update(productRef, { stock: currentProduct.stock - item.quantity });
        }
      });
      await batch.commit();
      return newVale as Vale;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return undefined;
  };

  const updateVale = async (updatedVale: Vale) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const path = `users/${uid}/vales/${updatedVale.id}`;
    try {
      await setDoc(doc(db, 'users', uid, 'vales', updatedVale.id), updatedVale);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteVale = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const vale = vales.find(v => v.id === id);
    if (!vale) return;

    const path = `users/${uid}/vales/${id}`;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', uid, 'vales', id));
      
      if (vale.items) {
        vale.items.forEach(item => {
          const currentProduct = products.find(p => p.id === item.product.id);
          if (currentProduct) {
            const productRef = doc(db, 'users', uid, 'products', item.product.id);
            batch.update(productRef, { stock: currentProduct.stock + item.quantity });
          }
        });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const payVale = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const path = `users/${uid}/vales/${id}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'vales', id), { status: 'Pago' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const addInventoryLog = async (log: Omit<InventoryLog, 'id' | 'date'>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const id = crypto.randomUUID();
    const newLog: InventoryLog = { ...log, id, date: new Date().toISOString() };
    const path = `users/${uid}/inventoryLogs/${id}`;
    
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid, 'inventoryLogs', id), newLog);
      
      const currentProduct = products.find(p => p.id === log.productId);
      if (currentProduct) {
        const newStock = log.type === 'Entrada' ? currentProduct.stock + log.quantity : log.type === 'Saída' ? currentProduct.stock - log.quantity : log.quantity;
        const productRef = doc(db, 'users', uid, 'products', log.productId);
        batch.update(productRef, { stock: newStock });
      }
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  return (
    <StoreContext.Provider value={{
      products, sales, vales, inventoryLogs,
      addProduct, updateProduct, deleteProduct,
      addSale, updateSaleStatus,
      addVale, updateVale, deleteVale, payVale,
      addInventoryLog
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
