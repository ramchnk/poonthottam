import React, { useState, useEffect, useContext } from 'react';
import { Save, Check } from 'lucide-react';
import { useTenant } from '../utils/TenantContext';
import { db, COLLECTIONS } from '../utils/storage';
import { doc, setDoc } from 'firebase/firestore';
import { LangContext } from '../components/Layout';

const DEFAULTS = {
    motto:   '',
    name:    '',
    type:    '',
    address: '',
    phone1:  '',
    phone2:  '',
};

const S = {
    page: {
        background: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9',
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)', padding: '32px',
        fontFamily: 'var(--font-sans)', maxWidth: '540px', margin: '0 auto',
        marginTop: '20px',
    },
    label: { display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' },
    input: {
        width: '100%', padding: '12px 14px', borderRadius: '12px',
        border: '2px solid #f1f5f9', background: '#fff', fontSize: '14px',
        fontWeight: 600, color: '#1e293b', outline: 'none',
        fontFamily: 'var(--font-sans)', boxSizing: 'border-box', transition: 'all 0.2s',
    },
};

const BusinessSettings = ({ isModal, onClose }) => {
    const { lang } = useContext(LangContext);
    const { tenantId, tenantData, setTenantData, loading } = useTenant();
    const [form, setForm]       = useState(tenantData || DEFAULTS);
    const [saving, setSaving]   = useState(false);
    const [saved, setSaved]     = useState(false);

    useEffect(() => {
        if (tenantData) {
            setForm(tenantData);
        }
    }, [tenantData]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!tenantId) return;
        setSaving(true);
        try {
            await setDoc(doc(db, COLLECTIONS.TENANTS, tenantId), form, { merge: true });
            setTenantData(form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert('❌ Save failed: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const field = (key, label, placeholder) => (
        <div style={{ marginBottom: '18px' }} className="text-left">
            <label style={S.label}>{label}</label>
            <input
                value={form[key] || ''}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                style={S.input}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = '#f1f5f9'}
            />
        </div>
    );

    if (loading) return (
        <div style={{ ...S.page, textAlign: 'center', padding: '60px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: '12px', color: '#94a3b8', fontSize: '13px' }}>Loading settings…</p>
        </div>
    );

    const content = (
        <div style={{ 
            ...S.page, 
            marginTop: isModal ? '0' : '20px', 
            position: 'relative',
            maxHeight: isModal ? '90vh' : 'none',
            overflowY: isModal ? 'auto' : 'visible'
        }}>
            {isModal && (
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', right: '20px', top: '20px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#94a3b8', fontSize: '18px', fontWeight: 'bold', zIndex: 10
                    }}
                >
                    ✕
                </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '2px solid #f8fafc', paddingBottom: '16px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', background: '#ecfdf5', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏢</div>
                <div className="text-left">
                    <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        {lang === 'ta' ? 'வணிக அமைப்புகள்' : 'Business Settings'}
                    </h2>
                    <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, margin: '2px 0 0' }}>
                        {lang === 'ta' ? 'வாட்ஸ்அப் ரசீதுகளில் இந்தத் தகவல் தோன்றும்' : 'This info appears on WhatsApp receipts'}
                    </p>
                </div>
            </div>

            {/* Preview Box */}
            <div style={{
                background: '#fafafa', border: '1.5px dashed #e2e8f0', borderRadius: '16px',
                padding: '16px', marginBottom: '24px', textAlign: 'center', fontSize: '13px'
            }}>
                <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Preview</div>
                <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b' }}>{form.motto || 'SRI RAMA JAYAM'}</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: '2px 0' }}>{form.name || 'SVM Flowers'}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{form.type || 'Sri Valli Flower Merchant'}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{form.address || 'Address Line'}</div>
                {(form.phone1 || form.phone2) && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
                        {form.phone1 && `Cell: ${form.phone1}`} {form.phone2 && ` | Cell: ${form.phone2}`}
                    </div>
                )}
            </div>

            <form onSubmit={handleSave}>
                {field('motto', lang === 'ta' ? 'முக்கிய வாழ்த்து / முழக்கம் (motto)' : 'Blessing / Motto (top center)', 'e.g. SRI RAMA JAYAM')}
                {field('name', lang === 'ta' ? 'கடையின் பெயர் (bold)' : 'Shop Name (large bold)', 'e.g. SVM Flowers')}
                {field('type', lang === 'ta' ? 'வணிக வகை' : 'Business Type', 'e.g. Sri Valli Flower Merchant')}
                {field('address', lang === 'ta' ? 'கடை முகவரி' : 'Address', 'e.g. B-7, Flower Market')}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {field('phone1', lang === 'ta' ? 'தொலைபேசி 1 (இடது)' : 'Phone 1 (left)', 'e.g. 9952535057')}
                    {field('phone2', lang === 'ta' ? 'தொலைபேசி 2 (வலது)' : 'Phone 2 (right)', 'e.g. 9443247771')}
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        width: '100%', padding: '14px', borderRadius: '12px',
                        background: saved ? '#059669' : '#10b981', color: '#fff',
                        fontWeight: 800, fontSize: '14px', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.2)', transition: 'all 0.2s',
                        marginTop: '10px'
                    }}
                >
                    {saved ? (
                        <><Check size={16} /> {lang === 'ta' ? 'சேமிக்கப்பட்டது!' : 'Saved Info!'}</>
                    ) : (
                        <><Save size={16} /> {lang === 'ta' ? 'வணிகத் தகவலைச் சேமி' : 'Save Business Info'}</>
                    )}
                </button>
            </form>
        </div>
    );

    if (isModal) {
        return (
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.3)',
                backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 99999, padding: '16px'
            }}>
                {content}
            </div>
        );
    }
    return content;
};

export default BusinessSettings;
