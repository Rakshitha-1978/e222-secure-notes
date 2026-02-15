import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyD9lSSZ1ZXGCaFUlF3jkAOW_h3_drdRN6s",
  authDomain: "capstone-e2ee.firebaseapp.com",
  projectId: "capstone-e2ee",
  storageBucket: "capstone-e2ee.firebasestorage.app",
  messagingSenderId: "936047041783",
  appId: "936047041783"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// =========================
// 🔐 ENCRYPT
// =========================
async function encrypt(text, password) {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(password)
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(text)
  );

  return {
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}


// =========================
// 🔓 DECRYPT
// =========================
async function decrypt(data, iv, password) {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(password)
  );

  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0))
    },
    key,
    Uint8Array.from(atob(data), c => c.charCodeAt(0))
  );

  return new TextDecoder().decode(decrypted);
}


// =========================
// 👤 AUTH
// =========================
window.signup = async () => {
  try {
    await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    alert("Signup successful!");
  } catch (err) {
    alert(err.message);
  }
};

window.login = async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );

    userStatus.innerText = "✅ Logged in as " + email.value;
  } catch (err) {
    alert(err.message);
  }
};

window.logout = async () => {
  await signOut(auth);
  userStatus.innerText = "Logged out";
};


// =========================
// 💾 SAVE NOTE
// =========================
window.saveNote = async () => {
  const user = auth.currentUser;
  if (!user) return alert("Login first");

  if (!note.value) return alert("Write something");

  const encrypted = await encrypt(
    note.value,
    password.value
  );

  await addDoc(collection(db, "notes"), {
    uid: user.uid,
    data: encrypted.data,
    iv: encrypted.iv,
    created: new Date().toLocaleString()
  });

  alert("🔐 Encrypted note saved!");
  note.value = "";
};


// =========================
// 📂 LOAD NOTES
// =========================
window.loadNotes = async () => {
  const user = auth.currentUser;
  if (!user) return alert("Login first");

  notesList.innerHTML = "⏳ Loading...";

  const snap = await getDocs(collection(db, "notes"));

  notesList.innerHTML = "";

  snap.forEach(async docSnap => {
    const d = docSnap.data();

    if (d.uid === user.uid) {
      try {
        const decrypted = await decrypt(
          d.data,
          d.iv,
          password.value
        );

        const div = document.createElement("div");

        div.innerHTML = `
          <p>🔓 ${decrypted}</p>
          <small>${d.created}</small><br>
          <button onclick="deleteNote('${docSnap.id}')">
            🗑 Delete
          </button>
          <hr>
        `;

        notesList.appendChild(div);

      } catch {
        notesList.innerHTML += "<p>❌ Wrong password</p>";
      }
    }
  });
};


// =========================
// 🗑 DELETE NOTE
// =========================
window.deleteNote = async (id) => {
  await deleteDoc(doc(db, "notes", id));
  alert("Deleted!");
  loadNotes();
};
