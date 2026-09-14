import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MarketplaceProduct, DemoOrder } from '../types';
import { MARKETPLACE_PRODUCTS_DATA, DEMO_ORDERS_DATA } from './seedData';
import { logActivity } from './activityService';

// In-memory cache with 5-minute TTL for ultra-fast response times
let productsCache: { data: MarketplaceProduct[]; timestamp: number } | null = null;
let ordersCache: { data: DemoOrder[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

export const fetchMarketplaceProducts = async (forceRefresh = false): Promise<MarketplaceProduct[]> => {
  const now = Date.now();
  if (!forceRefresh && productsCache && (now - productsCache.timestamp < CACHE_TTL_MS)) {
    return productsCache.data;
  }

  try {
    const colRef = collection(db, 'marketplaceProducts');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceProduct));
      productsCache = { data: list, timestamp: now };
      return list;
    }
  } catch (err) {
    console.warn('Firestore marketplaceProducts query fallback notice:', err);
  }

  // Fallback to rich seed dataset
  productsCache = { data: MARKETPLACE_PRODUCTS_DATA, timestamp: now };
  return MARKETPLACE_PRODUCTS_DATA;
};

export const fetchOrders = async (
  employeeId?: string, 
  isAdmin = false,
  forceRefresh = false
): Promise<DemoOrder[]> => {
  const now = Date.now();
  if (!forceRefresh && ordersCache && (now - ordersCache.timestamp < CACHE_TTL_MS)) {
    if (isAdmin || !employeeId) {
      return ordersCache.data;
    }
    return ordersCache.data.filter(o => o.employeeId === employeeId);
  }

  try {
    const colRef = collection(db, 'orders');
    let q = query(colRef, orderBy('orderDate', 'desc'));
    if (!isAdmin && employeeId) {
      q = query(colRef, where('employeeId', '==', employeeId));
    }

    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DemoOrder));
      ordersCache = { data: list, timestamp: now };
      return list;
    }
  } catch (err) {
    console.warn('Firestore orders query fallback notice:', err);
  }

  // Fallback to rich demo orders dataset
  ordersCache = { data: DEMO_ORDERS_DATA, timestamp: now };
  if (isAdmin || !employeeId) {
    return DEMO_ORDERS_DATA;
  }
  return DEMO_ORDERS_DATA.filter(o => o.employeeId === employeeId);
};

export const createOrder = async (
  order: Omit<DemoOrder, 'id' | 'orderNumber' | 'orderDate' | 'status' | 'trackingNumber'>,
  userProfile: { uid: string; name: string; role: any }
): Promise<DemoOrder> => {
  const newId = `ORD-${Date.now().toString().slice(-4)}`;
  const orderNumber = `PRX-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderDate = new Date().toISOString().split('T')[0];
  const trackingNumber = `BDT-${Math.floor(1000000 + Math.random() * 9000000)}`;

  const fullOrder: DemoOrder = {
    ...order,
    id: newId,
    orderNumber,
    orderDate,
    status: 'PROCESSING',
    trackingNumber,
  };

  try {
    await setDoc(doc(db, 'orders', newId), fullOrder);
    // Invalidate orders cache
    ordersCache = null;

    // Log Activity
    await logActivity(
      'ORDER_PLACED',
      userProfile.uid,
      userProfile.name,
      userProfile.role,
      'EMPLOYEE',
      newId,
      `Placed order ${orderNumber} for ${order.productName} (${order.totalPoints} points)`
    );
  } catch (err) {
    console.warn('Could not persist order to Firestore:', err);
  }

  return fullOrder;
};
