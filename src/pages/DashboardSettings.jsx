import React, { useState, useEffect, useContext } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { firebaseConfig, db } from '../firebase';
import { useTenant } from '../utils/TenantContext';
import { Key, Store, MapPin, UserPlus, Shield, Eye, EyeOff, Users, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { LangContext } from '../components/Layout';

const getSecondaryAuth = () => {
    const existing = getApps().find(a => a.name === 'admin-secondary');
    const secondaryApp = existing || initializeApp(firebaseConfig, 'admin-secondary');
    return getAuth(secondaryApp);
};

const DashboardSettings = () => {
    const { lang } = useContext(LangContext);
    const { user } = useTenant();

    const [activeTab, setActiveTab] = useState('create'); // 'create' | 'list'
    const [accounts, setAccounts] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);

    const [form, setForm] = useState({ username: '', password: '', shopName: '', location: '' });
    const [showPw, setShowPw] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const showMsg = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 5000);
    };

    const loadAccounts = async () => {
        setLoadingAccounts(true);
        try {
            const q = query(collection(db, 'tenants'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {
            // tenants collection may not have index yet — try without orderBy
            try {
                const snap = await getDocs(collection(db, 'tenants'));
                setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Could not load accounts:", err);
            }
        }
        setLoadingAccounts(false);
    };

    useEffect(() => {
        if (activeTab === 'list') {
            loadAccounts();
        }
    }, [activeTab]);

    const handleCreate = async (e) => {
        e.preventDefault();
        const { username, password, shopName, location } = form;

        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!cleanUsername || !password || !shopName || !location) {
            return showMsg('error', lang === 'ta' ? 'அனைத்து புலங்களும் தேவை.' : 'All fields are required.');
        }
        if (password.length < 6) {
            return showMsg('error', lang === 'ta' ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.' : 'Password must be at least 6 characters.');
        }

        setSaving(true);
        try {
            const secondaryAuth = getSecondaryAuth();
            const email = `${cleanUsername}@poovanam.com`;

            // Create Firebase Auth user without logging out current session
            const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const uid = userCred.user.uid;
            await signOut(secondaryAuth);

            // Store user mapping in Firestore
            await setDoc(doc(db, 'users', uid), {
                email,
                tenantId: cleanUsername,
                role: 'owner'
            });

            // Store tenant metadata profile in Firestore
            await setDoc(doc(db, 'tenants', cleanUsername), {
                name: shopName.trim(),
                shopName: shopName.trim(),
                type: location.trim(),
                location: location.trim(),
                username: cleanUsername,
                email,
                password,
                tenantId: cleanUsername,
                createdAt: new Date().toISOString(),
                active: true,
            });

            showMsg('success', lang === 'ta' ? `✅ பயனர் கணக்கு "${cleanUsername}" வெற்றிகரமாக உருவாக்கப்பட்டது!` : `✅ User account "${cleanUsername}" created successfully!`);
            setForm({ username: '', password: '', shopName: '', location: '' });
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                showMsg('error', lang === 'ta' ? `பயனர் பெயர் "${cleanUsername}" ஏற்கனவே பயன்படுத்தப்பட்டுள்ளது.` : `Username "${cleanUsername}" is already taken.`);
            } else {
                showMsg('error', err.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (tenantId) => {
        try {
            await deleteDoc(doc(db, 'tenants', tenantId));
            showMsg('success', lang === 'ta' ? `கணக்கு நீக்கப்பட்டது.` : `Tenant record removed. Note: Delete the Firebase Auth user manually from Firebase Console.`);
            setDeleteConfirm(null);
            await loadAccounts();
        } catch (err) {
            showMsg('error', 'Delete failed: ' + err.message);
        }
    };

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '2px solid #f8fafc', paddingBottom: '16px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', background: '#eef2ff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>⚙️</div>
                <div className="text-left">
                    <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        {lang === 'ta' ? 'அமைப்புகள்' : 'Settings'}
                    </h2>
                    <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, margin: '2px 0 0' }}>
                        {lang === 'ta' ? 'பயனர் கணக்குகள் மற்றும் கடை விவரங்களை நிர்வகிக்கவும்' : 'Manage user accounts and credentials directory'}
                    </p>
                </div>
            </div>

            {/* Tab Switched Header */}
            <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '6px', borderRadius: '14px', marginBottom: '24px' }}>
                <button
                    onClick={() => setActiveTab('create')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                        background: activeTab === 'create' ? '#ffffff' : 'transparent',
                        color: activeTab === 'create' ? '#4f46e5' : '#64748b',
                        fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                        boxShadow: activeTab === 'create' ? '0 4px 10px rgba(0,0,0,0.03)' : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    👤 {lang === 'ta' ? 'உருவாக்கு' : 'Create Account'}
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                        background: activeTab === 'list' ? '#ffffff' : 'transparent',
                        color: activeTab === 'list' ? '#4f46e5' : '#64748b',
                        fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                        boxShadow: activeTab === 'list' ? '0 4px 10px rgba(0,0,0,0.03)' : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    📋 {lang === 'ta' ? 'பட்டியல்' : 'Account List'}
                </button>
            </div>

            {msg && (
                <div style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textAlign: 'center',
                    marginBottom: '20px',
                    background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    color: msg.type === 'success' ? '#15803d' : '#b91c1c',
                    border: `1.5px solid ${msg.type === 'success' ? '#bbf7d0' : '#fca5a5'}`,
                }}>
                    {msg.text}
                </div>
            )}

            {/* TAB 1: Create Account */}
            {activeTab === 'create' && (
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }} className="text-left">
                    {/* Shop Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {lang === 'ta' ? 'கடையின் பெயர் *' : 'Shop Name *'}
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. SVM Flowers"
                            value={form.shopName}
                            onChange={e => setForm(p => ({ ...p, shopName: e.target.value }))}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #f1f5f9', background: '#fff', fontSize: '14px', fontWeight: 600, color: '#1e293b', outline: 'none' }}
                        />
                    </div>

                    {/* Location */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {lang === 'ta' ? 'இடம் / முகவரி *' : 'Location *'}
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Flower Market, Madurai"
                            value={form.location}
                            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #f1f5f9', background: '#fff', fontSize: '14px', fontWeight: 600, color: '#1e293b', outline: 'none' }}
                        />
                    </div>

                    {/* Username */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {lang === 'ta' ? 'பயனர் பெயர் / லாகின் ஐடி *' : 'Username / Login ID *'}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                            <input
                                type="text"
                                required
                                autoComplete="new-username"
                                placeholder="e.g. ramu"
                                value={form.username}
                                onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                                style={{ flex: 1, padding: '12px 14px', outline: 'none', border: 'none', fontSize: '14px', fontWeight: 600, color: '#1e293b', background: 'transparent' }}
                            />
                            <span style={{ padding: '12px 14px', background: '#f8fafc', borderLeft: '1px solid #f1f5f9', fontSize: '12px', fontWeight: 800, color: '#94a3b8' }}>
                                @poovanam.com
                            </span>
                        </div>
                    </div>

                    {/* Password */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {lang === 'ta' ? 'கடவுச்சொல் *' : 'Password *'}
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={showPw ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                style={{ width: '100%', padding: '12px 14px', paddingRight: '48px', borderRadius: '12px', border: '2px solid #f1f5f9', background: '#fff', fontSize: '14px', fontWeight: 600, color: '#1e293b', outline: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(p => !p)}
                                style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                            >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            width: '100%', padding: '14px', borderRadius: '12px',
                            background: '#4f46e5', color: '#fff', fontWeight: 800, fontSize: '14px',
                            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            boxShadow: '0 4px 12px rgba(79,70,229,0.2)', transition: 'all 0.2s',
                            marginTop: '10px'
                        }}
                    >
                        {saving ? (
                            <>
                                <div style={{ width: '14px', height: '14px', border: '2px solid #white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                {lang === 'ta' ? 'உருவாக்குகிறது...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <UserPlus size={16} />
                                {lang === 'ta' ? 'கணக்கை உருவாக்கு' : 'Create User Account'}
                            </>
                        )}
                    </button>
                </form>
            )}

            {/* TAB 2: Accounts List */}
            {activeTab === 'list' && (
                <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    {loadingAccounts ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            <div style={{ width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto', marginBottom: '12px' }} />
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Loading registry...</p>
                        </div>
                    ) : accounts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            <Users size={48} style={{ marginBottom: '12px', opacity: 0.3, margin: '0 auto' }} />
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#64748b' }}>No accounts registered yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {accounts.map(acc => (
                                <div key={acc.id} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="text-left">
                                    {/* Main Info */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: 800 }}>
                                                {(acc.shopName || acc.username || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>{acc.shopName}</h4>
                                                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                                    {lang === 'ta' ? 'பயனர்:' : 'Login:'} <span style={{ color: '#4f46e5' }}>{acc.email || `${acc.id}@poovanam.com`}</span>
                                                </p>
                                                {acc.password && (
                                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                                        {lang === 'ta' ? 'கடவுச்சொல்:' : 'Password:'} <span style={{ color: '#059669', fontFamily: 'monospace', fontWeight: 700 }}>{acc.password}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div>
                                            {deleteConfirm === acc.id ? (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => handleDelete(acc.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>Delete</button>
                                                    <button onClick={() => setDeleteConfirm(null)} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setDeleteConfirm(acc.id)} style={{ padding: '8px', background: '#fff', border: '1.5px solid #fee2e2', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Business Metadata */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={13} className="text-gray-400" />
                                            <span>{acc.location || acc.type || '—'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={13} className="text-gray-400" />
                                            <span>
                                                {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardSettings;
