// ─── FIREBASE AUTH ───
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhBmp8esSlzkOUqZo41Qx1N0lxc2zvJDY",
  authDomain: "ondabooks.firebaseapp.com",
  projectId: "ondabooks",
  storageBucket: "ondabooks.firebasestorage.app",
  messagingSenderId: "183667962834",
  appId: "1:183667962834:web:1d64a9932137224cee4e0b"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ─── NAVBAR AUTH AREA ───
function updateNavAuth(user) {
  const area = document.getElementById('authNavArea');
  if (!area) return;
  if (user) {
    const initial = (user.displayName || user.email || '?')[0].toUpperCase();
    area.innerHTML = `
      <div class="auth-user-menu">
        <button class="btn-user-avatar" onclick="toggleUserMenu()">
          ${user.photoURL
            ? `<img src="${user.photoURL}" alt="avatar" class="user-avatar-img">`
            : `<span class="user-avatar-initial">${initial}</span>`}
        </button>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-name">${user.displayName || user.email}</div>
          <a href="library.html" class="user-dropdown-item"><i class="bi bi-book"></i> My Library</a>
          <div class="user-dropdown-item" onclick="handleSignOut()"><i class="bi bi-box-arrow-right"></i> Sign Out</div>
        </div>
      </div>`;
  } else {
    area.innerHTML = `<button class="btn-signin" onclick="openAuthModal()">Sign In</button>`;
  }
}

function toggleUserMenu() {
  document.getElementById('userDropdown')?.classList.toggle('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.auth-user-menu')) {
    document.getElementById('userDropdown')?.classList.remove('open');
  }
});

// ─── AUTH STATE ───
onAuthStateChanged(auth, user => {
  window.currentUser = user;
  updateNavAuth(user);
});

// ─── SIGN IN MODAL ───
window.openAuthModal = function(mode='signin') {
  document.getElementById('authModal').classList.add('open');
  showAuthTab(mode);
};

window.closeAuthModal = function() {
  document.getElementById('authModal').classList.remove('open');
  document.getElementById('authError').textContent = '';
};

window.showAuthTab = function(tab) {
  document.getElementById('signinForm').style.display = tab==='signin' ? 'block' : 'none';
  document.getElementById('signupForm').style.display = tab==='signup' ? 'block' : 'none';
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById('authError').textContent = '';
};

// ─── GOOGLE SIGN IN ───
window.signInWithGoogle = async function() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await saveUserToFirestore(result.user);
    closeAuthModal();
  } catch(e) {
    showAuthError(e.message);
  }
};

// ─── EMAIL SIGN IN ───
window.handleSignIn = async function() {
  const email = document.getElementById('siEmail').value.trim();
  const pass  = document.getElementById('siPass').value;
  if (!email || !pass) { showAuthError('Please fill in all fields.'); return; }
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    closeAuthModal();
  } catch(e) {
    showAuthError('Invalid email or password.');
  }
};

// ─── EMAIL SIGN UP ───
window.handleSignUp = async function() {
  const name  = document.getElementById('suName').value.trim();
  const email = document.getElementById('suEmail').value.trim();
  const pass  = document.getElementById('suPass').value;
  const pass2 = document.getElementById('suPass2').value;
  if (!name || !email || !pass) { showAuthError('Please fill in all fields.'); return; }
  if (pass !== pass2) { showAuthError('Passwords do not match.'); return; }
  if (pass.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    await saveUserToFirestore(result.user, name);
    closeAuthModal();
  } catch(e) {
    if (e.code === 'auth/email-already-in-use') showAuthError('This email is already registered.');
    else showAuthError(e.message);
  }
};

// ─── SIGN OUT ───
window.handleSignOut = async function() {
  await signOut(auth);
  if (window.location.href.includes('library.html')) window.location.href = 'index.html';
};

// ─── SAVE USER TO FIRESTORE ───
async function saveUserToFirestore(user, displayName) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid:         user.uid,
        name:        displayName || user.displayName || '',
        email:       user.email,
        photoURL:    user.photoURL || '',
        createdAt:   serverTimestamp(),
        purchases:   [],
        subscription: null
      });
    }
  } catch(e) { console.warn('Could not save user:', e); }
}

// ─── SAVE ORDER + ADD TO LIBRARY ───
export async function saveOrder(cartItems, total, paymentMethod) {
  try {
    const user = auth.currentUser;
    const order = {
      items:         cartItems.map(i=>({ title:i.title, author:i.author, price:i.price, qty:i.qty })),
      total:         total,
      paymentMethod: paymentMethod,
      status:        'completed',
      userId:        user?.uid || 'guest',
      userEmail:     user?.email || 'guest',
      createdAt:     serverTimestamp()
    };
    const docRef = await addDoc(collection(db,'orders'), order);

    // Add books to user's library
    if (user) {
      for (const item of cartItems) {
        await addDoc(collection(db,'library'), {
          userId:    user.uid,
          bookTitle: item.title,
          bookId:    item.title.toLowerCase().replace(/\s+/g,'-'),
          pdfUrl:    '',
          purchasedAt: serverTimestamp()
        });
      }
    }
    return docRef.id;
  } catch(e) { console.warn('Order save error:', e); return null; }
}

function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (el) el.textContent = msg;
}

export { auth, db };
