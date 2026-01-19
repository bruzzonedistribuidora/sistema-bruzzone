
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  doc,
  serverTimestamp,
  deleteDoc,
  getDocs // Import getDocs for one-time fetch
} from 'firebase/firestore';
import { Product, Client, Supplier, Transaction, PriceList, Branch } from '../types';

interface FirebaseContextType {
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  transactions: Transaction[];
  priceLists: PriceList[];
  branches: Branch[]; // Added
  loading: boolean;
  error: string | null;
  addProduct: (p: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  addSale: (saleData: any) => Promise<void>;
  addClient: (c: Omit<Client, 'id' | 'balance' | 'authorizedPersons'> & { balance?: number, accumulatedPoints?: number, pointsEnabled?: boolean, authorizedPersons?: string[] }) => Promise<void>;
  updateClient: (id: string, c: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addSupplier: (s: Omit<Supplier, 'id' | 'balance'> & { balance?: number }) => Promise<void>;
  updateSupplier: (id: string, s: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addPriceList: (pl: Omit<PriceList, 'id'>) => Promise<void>;
  updatePriceList: (id: string, pl: Partial<PriceList>) => Promise<void>;
  deletePriceList: (id: string) => Promise<void>;
  addBranch: (b: Omit<Branch, 'id' | 'dailySales' | 'staffCount' | 'status'> & {dailySales?: number, staffCount?: number, status?: 'online' | 'offline'}) => Promise<void>; // Added
  updateBranch: (id: string, b: Partial<Branch>) => Promise<void>; // Added
  deleteBranch: (id: string) => Promise<void>; // Added
  exportAllData: (collectionNames: string[]) => Promise<Record<string, any[]>>; // New: Export all data
  deleteAllDocumentsInCollection: (collectionName: string) => Promise<void>; // New: Delete all documents in a collection
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// Helper to convert Firestore Timestamps to JS Dates recursively
const convertFirestoreTimestampsToDates = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // Check if it's a Firestore Timestamp object directly
  // Firestore's Timestamp objects have a `toDate` method
  if (data.toDate && typeof data.toDate === 'function') {
    return data.toDate();
  }

  // If it's an array, map over its elements
  if (Array.isArray(data)) {
    return data.map(item => convertFirestoreTimestampsToDates(item));
  }

  // If it's a plain object, iterate over its properties
  const newData: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      newData[key] = convertFirestoreTimestampsToDates(data[key]);
    }
  }
  return newData;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); // Added branches state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);

    // Manejador de errores común para los snapshots
    const handleError = (err: any) => {
      console.error("Firestore Sync Error:", err);
      if (err.code === 'permission-denied') {
        setError("Error de permisos en Firebase. Asegúrate de configurar las 'Rules' en tu Firebase Console a modo público o autenticado.");
      } else {
        setError("Error de conexión con la base de datos.");
      }
      setLoading(false);
    };

    // Helper to process snapshot data
    const processSnapshot = (snapshot: any) => {
      const list: any[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        const processedData = convertFirestoreTimestampsToDates(data);
        list.push({ id: doc.id, ...processedData });
      });
      return list;
    };

    // Escuchar Productos
    const qProducts = query(collection(db, "products"));
    const unsubProducts = onSnapshot(qProducts, 
      (snap) => {
        setProducts(processSnapshot(snap));
        setLoading(false);
      },
      handleError
    );

    // Escuchar Clientes
    const qClients = query(collection(db, "clients"));
    const unsubClients = onSnapshot(qClients, 
      (snap) => {
        setClients(processSnapshot(snap));
      },
      handleError
    );

    // Escuchar Proveedores
    const qSuppliers = query(collection(db, "suppliers"));
    const unsubSuppliers = onSnapshot(qSuppliers, 
      (snap) => {
        setSuppliers(processSnapshot(snap));
      },
      handleError
    );

    // Escuchar Movimientos de Caja
    const qTrans = query(collection(db, "transactions"));
    const unsubTrans = onSnapshot(qTrans, 
      (snap) => {
        setTransactions(processSnapshot(snap));
      },
      handleError
    );

    // Escuchar Listas de Precios
    const qPriceLists = query(collection(db, "priceLists"));
    const unsubPriceLists = onSnapshot(qPriceLists, 
      (snap) => {
        setPriceLists(processSnapshot(snap));
      },
      handleError
    );

    // Escuchar Sucursales
    const qBranches = query(collection(db, "branches"));
    const unsubBranches = onSnapshot(qBranches, 
      (snap) => {
        setBranches(processSnapshot(snap));
      },
      handleError
    );

    return () => {
      unsubProducts();
      unsubClients();
      unsubSuppliers();
      unsubTrans();
      unsubPriceLists();
      unsubBranches(); // Added cleanup for branches
    };
  }, []);

  const addProduct = async (p: Omit<Product, 'id'>) => {
    try {
      await addDoc(collection(db, "products"), { ...p, createdAt: serverTimestamp() });
    } catch (err) {
      console.error("Error al añadir producto:", err);
      throw err;
    }
  };

  const updateProduct = async (id: string, p: Partial<Product>) => {
    try {
      const ref = doc(db, "products", id);
      await updateDoc(ref, p);
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      throw err;
    }
  };

  const addClient = async (c: Omit<Client, 'id' | 'balance' | 'authorizedPersons'> & { balance?: number, accumulatedPoints?: number, pointsEnabled?: boolean, authorizedPersons?: string[] }) => {
    try {
      await addDoc(collection(db, "clients"), { 
        ...c, 
        createdAt: serverTimestamp(), 
        balance: c.balance || 0, 
        authorizedPersons: c.authorizedPersons || [],
        accumulatedPoints: c.accumulatedPoints || 0, // Ensure default for new field
        pointsEnabled: c.pointsEnabled || false, // Ensure default for new field
      });
    } catch (err) {
      console.error("Error al añadir cliente:", err);
      throw err;
    }
  };

  const updateClient = async (id: string, c: Partial<Client>) => {
    try {
      const ref = doc(db, "clients", id);
      await updateDoc(ref, c);
    } catch (err) {
      console.error("Error al actualizar cliente:", err);
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const ref = doc(db, "clients", id);
      await deleteDoc(ref);
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      throw err;
    }
  };

  const addSupplier = async (s: Omit<Supplier, 'id' | 'balance'> & { balance?: number }) => {
    try {
      await addDoc(collection(db, "suppliers"), { ...s, createdAt: serverTimestamp(), balance: s.balance || 0, discounts: s.discounts || [] });
    } catch (err) {
      console.error("Error al añadir proveedor:", err);
      throw err;
    }
  };

  const updateSupplier = async (id: string, s: Partial<Supplier>) => {
    try {
      const ref = doc(db, "suppliers", id);
      await updateDoc(ref, s);
    } catch (err) {
      console.error("Error al actualizar proveedor:", err);
      throw err;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const ref = doc(db, "suppliers", id);
      await deleteDoc(ref);
    } catch (err) {
      console.error("Error al eliminar proveedor:", err);
      throw err;
    }
  };

  const addPriceList = async (pl: Omit<PriceList, 'id'>) => {
    try {
      await addDoc(collection(db, "priceLists"), { ...pl, createdAt: serverTimestamp() });
    } catch (err) {
      console.error("Error al añadir lista de precios:", err);
      throw err;
    }
  };

  const updatePriceList = async (id: string, pl: Partial<PriceList>) => {
    try {
      const ref = doc(db, "priceLists", id);
      await updateDoc(ref, pl);
    } catch (err) {
      console.error("Error al actualizar lista de precios:", err);
      throw err;
    }
  };

  const deletePriceList = async (id: string) => {
    try {
      const ref = doc(db, "priceLists", id);
      await deleteDoc(ref);
    } catch (err) {
      console.error("Error al eliminar lista de precios:", err);
      throw err;
    }
  };

  const addBranch = async (b: Omit<Branch, 'id' | 'dailySales' | 'staffCount' | 'status'> & {dailySales?: number, staffCount?: number, status?: 'online' | 'offline'}) => {
    try {
      await addDoc(collection(db, "branches"), { 
        ...b, 
        createdAt: serverTimestamp(), 
        dailySales: b.dailySales || 0, 
        staffCount: b.staffCount || 0,
        status: b.status || 'offline'
      });
    } catch (err) {
      console.error("Error al añadir sucursal:", err);
      throw err;
    }
  };

  const updateBranch = async (id: string, b: Partial<Branch>) => {
    try {
      const ref = doc(db, "branches", id);
      await updateDoc(ref, b);
    } catch (err) {
      console.error("Error al actualizar sucursal:", err);
      throw err;
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      const ref = doc(db, "branches", id);
      await deleteDoc(ref);
    } catch (err) {
      console.error("Error al eliminar sucursal:", err);
      throw err;
    }
  };

  const addSale = async (saleData: any) => {
    try {
      // For `sales` collection, `date` is a Timestamp, so it will be converted on read.
      await addDoc(collection(db, "sales"), { ...saleData, date: serverTimestamp() });
      
      // For `transactions` collection, `date` is already a string, no Timestamp conversion needed.
      await addDoc(collection(db, "transactions"), {
        amount: saleData.total,
        type: 'ingreso',
        method: saleData.paymentMethod,
        description: `Venta Online/Mostrador - Items: ${saleData.items.length}`,
        date: new Date().toISOString()
      });

      for (const item of saleData.items) {
        const productRef = doc(db, "products", item.id);
        const currentProduct = products.find(p => p.id === item.id);
        if (currentProduct) {
          await updateDoc(productRef, {
            stock: Number(currentProduct.stock) - Number(item.quantity)
          });
        }
      }
    } catch (err) {
      console.error("Error en proceso de venta:", err);
      throw err;
    }
  };

  // New: Function to export all data from specified collections
  const exportAllData = async (collectionNames: string[]): Promise<Record<string, any[]>> => {
    const exportedData: Record<string, any[]> = {};
    try {
      for (const collectionName of collectionNames) {
        const q = query(collection(db, collectionName));
        const querySnapshot = await getDocs(q);
        exportedData[collectionName] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...convertFirestoreTimestampsToDates(data) // Convert timestamps for exported data too
          };
        });
      }
      return exportedData;
    } catch (err) {
      console.error("Error al exportar datos:", err);
      setError("Error al exportar datos. Verifique los permisos.");
      throw err;
    }
  };

  // New: Function to delete all documents in a specified collection
  const deleteAllDocumentsInCollection = async (collectionName: string) => {
    try {
      const q = query(collection(db, collectionName));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`Todos los documentos en la colección '${collectionName}' han sido eliminados.`);
    } catch (err) {
      console.error(`Error al eliminar documentos en la colección '${collectionName}':`, err);
      setError(`Error al eliminar datos en la colección '${collectionName}'. Verifique los permisos.`);
      throw err;
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      products, clients, suppliers, transactions, priceLists, branches, loading, error,
      addProduct, updateProduct, addSale,
      addClient, updateClient, deleteClient,
      addSupplier, updateSupplier, deleteSupplier,
      addPriceList, updatePriceList, deletePriceList,
      addBranch, updateBranch, deleteBranch,
      exportAllData, // Add new export function
      deleteAllDocumentsInCollection // Add new delete function
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirebase debe usarse dentro de FirebaseProvider");
  return context;
};
    