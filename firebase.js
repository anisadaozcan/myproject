// ─── FIREBASE CONFIG ───
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhBmp8esSlzkOUqZo41Qx1N0lxc2zvJDY",
  authDomain: "ondabooks.firebaseapp.com",
  projectId: "ondabooks",
  storageBucket: "ondabooks.firebasestorage.app",
  messagingSenderId: "183667962834",
  appId: "1:183667962834:web:1d64a9932137224cee4e0b",
  measurementId: "G-5K8TYXHWQT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── SİPARİŞ KAYDET ───
export async function saveOrder(cartItems, total, paymentMethod) {
  try {
    const order = {
      items: cartItems.map(item => ({
        title: item.title,
        author: item.author,
        price: item.price,
        qty: item.qty
      })),
      total: total,
      paymentMethod: paymentMethod,
      status: "pending",
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, "orders"), order);
    console.log("Order saved:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error saving order:", e);
    return null;
  }
}

// ─── ABONELİK KAYDET ───
export async function saveSubscription(planName, billingType, email) {
  try {
    const sub = {
      plan: planName,
      billing: billingType,
      email: email,
      status: "pending",
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, "subscriptions"), sub);
    console.log("Subscription saved:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error saving subscription:", e);
    return null;
  }
}

export { db };
