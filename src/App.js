import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { Car, Ticket, User, Phone, Search, CheckCircle2, Trophy, Users, Receipt, Sparkles, X, ShieldAlert, Loader2, Plus, CreditCard } from 'lucide-react';

// ==========================================
// 🎨 DESIGN & SETTINGS
// ==========================================

const SETTINGS = {
  isTestMode: true, // Set to false when ready for real use
  appName: "Bloom Car Raffle",
  appSubtitle: "Bloom Hail Car raffle Tortiment",
  logoUrl: "/logo.png", 
};

// ==========================================
// 🚀 SYSTEM CODE
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyDaU3dQd9aAJRwZL8XlWrl1hbV_WqCaf3Q",
  authDomain: "car-raffle.firebaseapp.com",
  projectId: "car-raffle",
  storageBucket: "car-raffle.firebasestorage.app",
  messagingSenderId: "316125583760",
  appId: "1:316125583760:web:0c48c9bba3662177ff7b15",
  measurementId: "G-XDNSEZ8HY1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = SETTINGS.isTestMode ? 'raffle-TEST-v1' : 'raffle-OFFICIAL-v1'; 

const generateGeminiContent = async (prompt) => {
  const apiKey = ""; 
  if (!apiKey) return null; 
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) { return null; }
};

// --- STYLES ---
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Segoe UI, sans-serif', color: '#334155' },
  header: { 
    backgroundColor: SETTINGS.isTestMode ? '#334155' : '#1e293b', 
    color: 'white', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    borderBottom: SETTINGS.isTestMode ? '4px solid #facc15' : 'none'
  },
  headerInner: { maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { display: 'flex', alignItems: 'center', gap: '16px' },
  logoImage: { height: '50px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)' },
  title: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '14px', color: '#cbd5e1', margin: 0 },
  main: { maxWidth: '1000px', margin: '32px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' },
  card: { backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' },
  inputWrapper: { position: 'relative' },
  icon: { position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' },
  input: { width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' },
  button: { width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  winnerButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { textAlign: 'left', padding: '12px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '14px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  tag: { display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
};

// --- COMPONENTS ---

const WinnerModal = ({ winner, speech, onClose }) => {
  if (!winner) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px', width: '90%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}><X color="#94a3b8" /></button>
        <div style={{ backgroundColor: '#fef9c3', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trophy size={40} color="#ca8a04" />
        </div>
        <h2 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Winner Announced</h2>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '10px 0' }}>{winner.name}</h1>
        <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '8px 16px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold', fontFamily: 'monospace' }}>
          Ticket #{winner.ticket}
        </div>
        <p style={{ marginTop: '24px', fontStyle: 'italic', color: '#4b5563', lineHeight: '1.6' }}>"{speech || "Congratulations on winning the Grand Prize!"}"</p>
      </div>
    </div>
  );
};

const RegistrationForm = ({ onRegister, loading, error, success, slogan }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', idNumber: '', ticket: '', ticket2: '', invoice: '' });
  
  // LOGIC: If invoice has text, it's an "Invoice Entry". If empty, it's a "Standard ID Entry".
  const hasInvoice = formData.invoice.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isSuccess = await onRegister(formData);
    // Reset everything on success
    if (isSuccess) setFormData({ name: '', phone: '', idNumber: '', ticket: '', ticket2: '', invoice: '' });
  };

  return (
    <div style={styles.card}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Ticket color="#2563eb" /> New Registration
      </h2>

      {error && <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #dc2626' }}>{error}</div>}
      
      {success && (
        <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #16a34a' }}>
          <strong>Success!</strong> {success}
          {slogan && <div style={{ marginTop: '5px', fontStyle: 'italic', opacity: 0.9 }}>✨ {slogan}</div>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Full Name</label>
          <div style={styles.inputWrapper}>
            <User size={18} style={styles.icon} />
            <input style={styles.input} required placeholder="Customer Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Phone Number</label>
          <div style={styles.inputWrapper}>
            <Phone size={18} style={styles.icon} />
            <input style={styles.input} required type="tel" placeholder="050 123 4567" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
        </div>

        {/* INVOICE SECTION */}
        <div style={{...styles.inputGroup, padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
          <label style={{...styles.label, color: '#2563eb'}}>Do they have an Invoice? 🧾</label>
          <div style={styles.inputWrapper}>
            <Receipt size={18} style={styles.icon} />
            <input style={{...styles.input, backgroundColor: 'white'}} placeholder="Invoice Number (Optional)" value={formData.invoice} onChange={e => setFormData({...formData, invoice: e.target.value})} />
          </div>
        </div>

        {/* ID NUMBER (Only shows if NO invoice) */}
        {!hasInvoice && (
           <div style={{...styles.inputGroup, animation: 'fadeIn 0.3s'}}>
             <label style={{...styles.label, color: '#dc2626'}}>ID Number (Required for Free Entry) 🪪</label>
             <div style={styles.inputWrapper}>
               <CreditCard size={18} style={styles.icon} />
               <input 
                 style={{...styles.input, borderColor: '#fca5a5'}} 
                 required={!hasInvoice} 
                 placeholder="National ID / Iqama" 
                 value={formData.idNumber} 
                 onChange={e => setFormData({...formData, idNumber: e.target.value})} 
               />
             </div>
           </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: hasInvoice ? '1fr 1fr' : '1fr', gap: '15px' }}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Ticket #1</label>
            <div style={styles.inputWrapper}>
              <Ticket size={18} style={styles.icon} />
              <input style={styles.input} required placeholder="C-1001" value={formData.ticket} onChange={e => setFormData({...formData, ticket: e.target.value})} />
            </div>
          </div>

          {/* BONUS TICKET (Only shows WITH invoice) */}
          {hasInvoice && (
            <div style={{...styles.inputGroup, animation: 'fadeIn 0.5s'}}>
              <label style={{...styles.label, color: '#16a34a'}}>Ticket #2 (Bonus) 🎉</label>
              <div style={styles.inputWrapper}>
                <Plus size={18} style={{...styles.icon, color: '#16a34a'}} />
                <input style={{...styles.input, borderColor: '#86efac', backgroundColor: '#f0fdf4'}} required placeholder="C-1002" value={formData.ticket2} onChange={e => setFormData({...formData, ticket2: e.target.value})} />
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} style={{ ...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? <><Loader2 className="animate-spin" size={20} /> Registering...</> : (hasInvoice ? 'Register 2 Tickets' : 'Register 1 Ticket')}
        </button>
      </form>
    </div>
  );
};

const ParticipantList = ({ entries }) => {
  const [term, setTerm] = useState('');
  const filtered = entries.filter(e => e.name.toLowerCase().includes(term.toLowerCase()) || e.phone.includes(term) || e.ticket.toLowerCase().includes(term.toLowerCase()));

  return (
    <div style={{ ...styles.card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '680px' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users color="#7c3aed" /> Registered Customers
        </h2>
        <div style={styles.inputWrapper}>
          <Search size={18} style={styles.icon} />
          <input style={{ ...styles.input, fontSize: '14px', paddingLeft: '38px' }} placeholder="Search list..." value={term} onChange={e => setTerm(e.target.value)} />
        </div>
      </div>
      
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ticket</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Type</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.id}>
                <td style={styles.td}>
                  <span style={{ ...styles.tag, backgroundColor: '#eff6ff', color: '#2563eb' }}>{entry.ticket}</span>
                </td>
                <td style={{ ...styles.td, fontWeight: '500' }}>
                  {entry.name}
                  {entry.idNumber && <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {entry.idNumber}</div>}
                </td>
                <td style={{ ...styles.td, color: '#64748b' }}>{entry.phone}</td>
                <td style={{ ...styles.td }}>
                   {entry.invoice 
                     ? <span style={{...styles.tag, backgroundColor: '#f0fdf4', color: '#166534'}}>Invoice: {entry.invoice}</span>
                     : <span style={{...styles.tag, backgroundColor: '#f1f5f9', color: '#64748b'}}>ID Entry</span>
                   }
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No entries found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN LOGIC ---
export default function RaffleApp() {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slogan, setSlogan] = useState('');
  const [winner, setWinner] = useState(null);
  const [speech, setSpeech] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        if (err.code === 'auth/configuration-not-found' || err.code === 'auth/admin-restricted-operation') {
           setAuthError('Configuration Error: Enable "Anonymous" sign-in in Firebase Console.');
        } else {
           setAuthError(`Authentication Error: ${err.message}`);
        }
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'raffle_entries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
    return () => unsubscribe();
  }, [user]);

  const handleRegister = async (data) => {
    if (!user) return false;
    setLoading(true); setError(''); setSuccess(''); setSlogan('');

    try {
      const name = data.name.trim();
      const phone = data.phone.trim();
      const idNumber = data.idNumber ? data.idNumber.trim() : '';
      const ticket1 = data.ticket.trim();
      const ticket2 = data.ticket2 ? data.ticket2.trim() : '';
      const invoice = data.invoice ? data.invoice.trim() : '';

      // 1. Check if Ticket 1 is taken
      if (entries.find(e => e.ticket.toLowerCase() === ticket1.toLowerCase())) throw new Error(`Ticket #${ticket1} is already taken.`);
      
      // --- LOGIC SPLIT ---
      if (invoice) {
        // SCENARIO A: INVOICE (2 Tickets, No ID needed)
        if (!ticket2) throw new Error("Please enter the Bonus Ticket Number.");
        if (ticket1 === ticket2) throw new Error("Ticket numbers must be different.");
        if (entries.find(e => e.ticket.toLowerCase() === ticket2.toLowerCase())) throw new Error(`Ticket #${ticket2} is already taken.`);
        
        // Check Invoice Limit
        if (entries.some(e => e.invoice && e.invoice.toLowerCase() === invoice.toLowerCase())) throw new Error(`Invoice #${invoice} has already been used.`);
        
      } else {
        // SCENARIO B: NO INVOICE (1 Ticket, ID Required)
        if (!idNumber) throw new Error("ID Number is required for free entry.");
        
        // Check ID uniqueness
        const existingID = entries.find(e => e.idNumber && e.idNumber.toLowerCase() === idNumber.toLowerCase());
        if (existingID) throw new Error(`ID Number ${idNumber} has already been registered.`);
      }

      // 3. Prepare promises
      const savePromises = [];
      const baseData = { name, phone, idNumber, invoice, createdAt: serverTimestamp(), createdBy: user.uid };
      
      savePromises.push(addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'raffle_entries'), { ...baseData, ticket: ticket1 }));
      
      if (invoice && ticket2) {
         savePromises.push(addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'raffle_entries'), { ...baseData, ticket: ticket2 }));
      }

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Network slow. Check internet.")), 10000));
      await Promise.race([Promise.all(savePromises), timeoutPromise]);

      setSuccess(invoice ? `Registered Tickets #${ticket1} & #${ticket2}` : `Registered Ticket #${ticket1}`);
      generateGeminiContent(`Short lucky slogan for ${name}`).then(res => res && setSlogan(res));
      return true;

    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePickWinner = async () => {
    if (entries.length === 0) return;
    const random = entries[Math.floor(Math.random() * entries.length)];
    setWinner(random);
    const speechText = await generateGeminiContent(`Announce winner ${random.name} ticket ${random.ticket} dramatically.`);
    setSpeech(speechText);
  };

  if (authError) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', color: '#991b1b', flexDirection: 'column', gap: '20px', padding: '20px', textAlign: 'center' }}><ShieldAlert size={48} /><div><h1 style={{fontSize: '24px', fontWeight: 'bold'}}>Authentication Error</h1><p>{authError}</p></div></div>;
  if (!user) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading System...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            {SETTINGS.logoUrl ? <img src={SETTINGS.logoUrl} alt="Logo" style={styles.logoImage} /> : <Car color="#fbbf24" size={32} />}
            <div><h1 style={styles.title}>{SETTINGS.appName} {SETTINGS.isTestMode ? '(TEST MODE)' : ''}</h1><p style={styles.subtitle}>{SETTINGS.appSubtitle}</p></div>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button onClick={handlePickWinner} disabled={entries.length === 0} style={styles.winnerButton}><Sparkles size={18} /> Pick Winner</button>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '12px', color: '#94a3b8' }}>TOTAL</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>{entries.length}</div></div>
          </div>
        </div>
      </div>
      <div style={styles.main}>
        <RegistrationForm onRegister={handleRegister} loading={loading} error={error} success={success} slogan={slogan} />
        <ParticipantList entries={entries} />
      </div>
      <WinnerModal winner={winner} speech={speech} onClose={() => setWinner(null)} />
    </div>
  );
}