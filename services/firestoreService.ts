// services/firestoreService.ts
// Servicio para guardar y leer datos en Firebase Firestore

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';
import type { Product, Client, Invoice, Remito, Purchase, Provider } from '../types';

// ==========================================
// PRODUCTOS
// ==========================================

export const productosService = {
  // Guardar un producto nuevo
  async crear(producto: Omit<Product, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'productos'), {
        ...producto,
        fechaCreacion: Timestamp.now(),
        fechaModificacion: Timestamp.now()
      });
      console.log('✅ Producto guardado en Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      throw error;
    }
  },

  // Obtener todos los productos
  async obtenerTodos(): Promise<Product[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'productos'));
      const productos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      console.log(`✅ ${productos.length} productos cargados desde Firebase`);
      return productos;
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      return [];
    }
  },

  // Obtener un producto por ID
  async obtenerPorId(id: string): Promise<Product | null> {
    try {
      const docRef = doc(db, 'productos', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
      }
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo producto:', error);
      return null;
    }
  },

  // Actualizar un producto
  async actualizar(id: string, datos: Partial<Product>): Promise<void> {
    try {
      const docRef = doc(db, 'productos', id);
      await updateDoc(docRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      });
      console.log('✅ Producto actualizado en Firebase:', id);
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      throw error;
    }
  },

  // Eliminar un producto
  async eliminar(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'productos', id));
      console.log('✅ Producto eliminado de Firebase:', id);
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      throw error;
    }
  },

  // Buscar productos por nombre o código
  async buscar(termino: string): Promise<Product[]> {
    try {
      const productos = await this.obtenerTodos();
      const terminoLower = termino.toLowerCase();
      
      return productos.filter(p => 
        p.name.toLowerCase().includes(terminoLower) ||
        p.internalCode.toLowerCase().includes(terminoLower) ||
        p.barcodes.some(b => b.includes(termino))
      );
    } catch (error) {
      console.error('❌ Error buscando productos:', error);
      return [];
    }
  }
};

// ==========================================
// CLIENTES
// ==========================================

export const clientesService = {
  // Guardar un cliente nuevo
  async crear(cliente: Omit<Client, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'clientes'), {
        ...cliente,
        fechaCreacion: Timestamp.now(),
        fechaModificacion: Timestamp.now()
      });
      console.log('✅ Cliente guardado en Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando cliente:', error);
      throw error;
    }
  },

  // Obtener todos los clientes
  async obtenerTodos(): Promise<Client[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      const clientes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Client));
      console.log(`✅ ${clientes.length} clientes cargados desde Firebase`);
      return clientes;
    } catch (error) {
      console.error('❌ Error obteniendo clientes:', error);
      return [];
    }
  },

  // Obtener un cliente por ID
  async obtenerPorId(id: string): Promise<Client | null> {
    try {
      const docRef = doc(db, 'clientes', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Client;
      }
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo cliente:', error);
      return null;
    }
  },

  // Actualizar un cliente
  async actualizar(id: string, datos: Partial<Client>): Promise<void> {
    try {
      const docRef = doc(db, 'clientes', id);
      await updateDoc(docRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      });
      console.log('✅ Cliente actualizado en Firebase:', id);
    } catch (error) {
      console.error('❌ Error actualizando cliente:', error);
      throw error;
    }
  },

  // Eliminar un cliente
  async eliminar(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'clientes', id));
      console.log('✅ Cliente eliminado de Firebase:', id);
    } catch (error) {
      console.error('❌ Error eliminando cliente:', error);
      throw error;
    }
  }
};

// ==========================================
// FACTURAS
// ==========================================

export const facturasService = {
  // Guardar una factura nueva
  async crear(factura: Invoice): Promise<string> {
    try {
      // Usar el número de factura como ID del documento
      const docRef = doc(db, 'facturas', factura.number);
      await setDoc(docRef, {
        ...factura,
        fechaCreacion: Timestamp.now()
      });
      console.log('✅ Factura guardada en Firebase:', factura.number);
      return factura.number;
    } catch (error) {
      console.error('❌ Error creando factura:', error);
      throw error;
    }
  },

  // Obtener todas las facturas
  async obtenerTodos(): Promise<Invoice[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'facturas'));
      const facturas = querySnapshot.docs.map(doc => doc.data() as Invoice);
      console.log(`✅ ${facturas.length} facturas cargadas desde Firebase`);
      return facturas.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error('❌ Error obteniendo facturas:', error);
      return [];
    }
  },

  // Obtener facturas por cliente
  async obtenerPorCliente(clienteCuit: string): Promise<Invoice[]> {
    try {
      const facturas = await this.obtenerTodos();
      return facturas.filter(f => f.customerCuit === clienteCuit);
    } catch (error) {
      console.error('❌ Error obteniendo facturas por cliente:', error);
      return [];
    }
  },

  // Obtener facturas por fecha
  async obtenerPorFecha(desde: string, hasta: string): Promise<Invoice[]> {
    try {
      const facturas = await this.obtenerTodos();
      return facturas.filter(f => f.date >= desde && f.date <= hasta);
    } catch (error) {
      console.error('❌ Error obteniendo facturas por fecha:', error);
      return [];
    }
  }
};

// ==========================================
// REMITOS
// ==========================================

export const remitosService = {
  // Guardar un remito nuevo
  async crear(remito: Remito): Promise<string> {
    try {
      const docRef = doc(db, 'remitos', remito.id);
      await setDoc(docRef, {
        ...remito,
        fechaCreacion: Timestamp.now()
      });
      console.log('✅ Remito guardado en Firebase:', remito.id);
      return remito.id;
    } catch (error) {
      console.error('❌ Error creando remito:', error);
      throw error;
    }
  },

  // Obtener todos los remitos
  async obtenerTodos(): Promise<Remito[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'remitos'));
      const remitos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Remito));
      console.log(`✅ ${remitos.length} remitos cargados desde Firebase`);
      return remitos.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error('❌ Error obteniendo remitos:', error);
      return [];
    }
  },

  // Actualizar estado de remito
  async actualizarEstado(id: string, estado: Remito['status']): Promise<void> {
    try {
      const docRef = doc(db, 'remitos', id);
      await updateDoc(docRef, { status: estado });
      console.log('✅ Estado de remito actualizado:', id);
    } catch (error) {
      console.error('❌ Error actualizando estado de remito:', error);
      throw error;
    }
  }
};

// ==========================================
// PROVEEDORES
// ==========================================

export const proveedoresService = {
  // Guardar un proveedor nuevo
  async crear(proveedor: Omit<Provider, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'proveedores'), {
        ...proveedor,
        fechaCreacion: Timestamp.now()
      });
      console.log('✅ Proveedor guardado en Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando proveedor:', error);
      throw error;
    }
  },

  // Obtener todos los proveedores
  async obtenerTodos(): Promise<Provider[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'proveedores'));
      const proveedores = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Provider));
      console.log(`✅ ${proveedores.length} proveedores cargados desde Firebase`);
      return proveedores;
    } catch (error) {
      console.error('❌ Error obteniendo proveedores:', error);
      return [];
    }
  },

  // Actualizar un proveedor
  async actualizar(id: string, datos: Partial<Provider>): Promise<void> {
    try {
      const docRef = doc(db, 'proveedores', id);
      await updateDoc(docRef, datos);
      console.log('✅ Proveedor actualizado en Firebase:', id);
    } catch (error) {
      console.error('❌ Error actualizando proveedor:', error);
      throw error;
    }
  }
};

// ==========================================
// COMPRAS
// ==========================================

export const comprasService = {
  // Guardar una compra nueva
  async crear(compra: Purchase): Promise<string> {
    try {
      const docRef = doc(db, 'compras', compra.id);
      await setDoc(docRef, {
        ...compra,
        fechaCreacion: Timestamp.now()
      });
      console.log('✅ Compra guardada en Firebase:', compra.id);
      return compra.id;
    } catch (error) {
      console.error('❌ Error creando compra:', error);
      throw error;
    }
  },

  // Obtener todas las compras
  async obtenerTodos(): Promise<Purchase[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'compras'));
      const compras = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Purchase));
      console.log(`✅ ${compras.length} compras cargadas desde Firebase`);
      return compras.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error('❌ Error obteniendo compras:', error);
      return [];
    }
  },

  // Actualizar estado de compra
  async actualizarEstado(id: string, estado: Purchase['status']): Promise<void> {
    try {
      const docRef = doc(db, 'compras', id);
      await updateDoc(docRef, { status: estado });
      console.log('✅ Estado de compra actualizado:', id);
    } catch (error) {
      console.error('❌ Error actualizando estado de compra:', error);
      throw error;
    }
  }
};

// ==========================================
// UTILIDADES
// ==========================================

// Verificar conexión con Firebase
export async function verificarConexion(): Promise<boolean> {
  try {
    await getDocs(collection(db, 'productos'));
    console.log('✅ Conexión con Firebase exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error conectando con Firebase:', error);
    return false;
  }
}

// Obtener estadísticas rápidas
export async function obtenerEstadisticas() {
  try {
    const [productos, clientes, facturas] = await Promise.all([
      getDocs(collection(db, 'productos')),
      getDocs(collection(db, 'clientes')),
      getDocs(collection(db, 'facturas'))
    ]);

    return {
      productos: productos.size,
      clientes: clientes.size,
      facturas: facturas.size
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return { productos: 0, clientes: 0, facturas: 0 };
  }
}
