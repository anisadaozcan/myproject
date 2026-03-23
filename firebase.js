// ─── FIREBASE CONFIG ───
// Firebase başlatma auth.js'de yapılıyor — çakışmayı önlemek için getApps() kullanılıyor.

import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhBmp8esSlzkOUqZo41Qx1N0lxc2zvJDY",
  authDomain: "ondabooks.firebaseapp.com",
  projectId: "ondabooks",
  storageBucket: "ondabooks.firebasestorage.app",
  messagingSenderId: "183667962834",
  appId: "1:183667962834:web:1d64a9932137224cee4e0b",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function saveOrder(cartItems, total, paymentMethod) {
  try {
    const order = {
      items: cartItems.map((i) => ({
        title: i.title,
        author: i.author,
        price: i.price,
        qty: i.qty,
      })),
      total,
      paymentMethod,
      status: "completed",
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "orders"), order);
    return docRef.id;
  } catch (e) {
    console.warn("Order save error:", e);
    return null;
  }
}

export async function saveSubscription(planName, billingType, email) {
  try {
    const sub = {
      plan: planName,
      billing: billingType,
      email,
      status: "pending",
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "subscriptions"), sub);
    return docRef.id;
  } catch (e) {
    console.warn("Subscription save error:", e);
    return null;
  }
}

export { db };
