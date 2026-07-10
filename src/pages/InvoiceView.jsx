import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Printer, ArrowLeft, Globe, CreditCard, Check, Sparkles, FileText, Calendar, Clock, Phone, MapPin, Mail, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const toDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};

const displayDate = (iso) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const getFlowerImage = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('rose') || n.includes('ரோஸ்') || n.includes('சிவப்பு')) return '/images/rose_mala.png';
    if (n.includes('marigold') || n.includes('செண்டு') || n.includes('மஞ்சள்') || n.includes('கேசவ')) return '/images/marigold_mala.png';
    if (n.includes('jasmine') || n.includes('மல்லி') || n.includes('முல்லை')) return '/images/jasmine_garland.png';
    if (n.includes('lotus') || n.includes('தாமரை')) return '/images/lotus_garland.png';
    return '/images/rose_mala.png'; // fallback
};

const InvoiceView = () => {
    const { tenantId, buyerId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const from = searchParams.get('from') || toDateStr(new Date());
    const to = searchParams.get('to') || toDateStr(new Date());
    const isPb = searchParams.get('isPb') === 'true';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenantInfo, setTenantInfo] = useState(null);
    const [buyer, setBuyer] = useState(null);
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [financials, setFinancials] = useState({
        openingBalance: 0,
        todayTotal: 0,
        cashRec: 0,
        cashLess: 0,
        balanceDues: 0,
        totalKg: 0
    });
    const [lang, setLang] = useState(searchParams.get('lang') || 'en');


    // Load fonts
    useEffect(() => {
        const link = document.createElement('link');
        link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Montserrat:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,800;1,600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    // Load data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Tenant/Biz settings
                const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
                let biz = { motto: 'SRI RAMA JAYAM', name: 'S.V.M', type: 'SRI VALLI FLOWER MERCHANT', address: 'B-7, FLOWER MARKET, TINDIVANAM.', phone1: '9443247771', phone2: '9952535057' };
                if (tenantSnap.exists()) {
                    biz = { ...biz, ...tenantSnap.data() };
                } else {
                    const globalSnap = await getDoc(doc(db, 'system', 'settings'));
                    if (globalSnap.exists()) {
                        biz = { ...biz, ...globalSnap.data() };
                    }
                }
                setTenantInfo(biz);

                // 2. Fetch Buyer info
                const buyerSnap = await getDoc(doc(db, isPb ? 'pb_buyers' : 'buyers', buyerId));
                if (!buyerSnap.exists()) {
                    throw new Error('Customer details not found.');
                }
                const buyerData = { id: buyerSnap.id, ...buyerSnap.data() };
                setBuyer(buyerData);

                // 3. Fetch Sales
                const salesCol = collection(db, isPb ? 'pb_sales' : 'sales');
                const salesSnap = await getDocs(query(salesCol, where('tenantId', '==', tenantId), where('buyerId', '==', buyerId)));
                const allSales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // 4. Fetch Payments
                const paymentsCol = collection(db, isPb ? 'pb_payments' : 'payments');
                const paymentsSnap = await getDocs(query(paymentsCol, where('tenantId', '==', tenantId), where('entityId', '==', buyerId)));
                const allPayments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // --- Calculations matching Reports.jsx exactly ---
                // Future records (from `from` date onwards) for backward calculating opening balance
                const futureSales = allSales.filter(s => {
                    const dt = s.date || (s.timestamp?.toDate ? toDateStr(s.timestamp.toDate()) : null);
                    return dt && dt >= from;
                });
                const futurePayments = allPayments.filter(p => {
                    if (!isPb && p.type !== 'buyer') return false;
                    const dt = p.timestamp ? (typeof p.timestamp === 'string' ? p.timestamp.substring(0, 10) : toDateStr(p.timestamp.toDate ? p.timestamp.toDate() : new Date(p.timestamp))) : null;
                    return dt && dt >= from;
                });

                const futureSalesAmt = futureSales.reduce((sum, x) => sum + (Number(x.grandTotal) || 0), 0);
                const futurePayAmt = futurePayments.reduce((sum, x) => sum + (Number(x.amount) || 0) + (Number(x.cashLess) || 0), 0);

                // Opening balance backward calculated from active database current dues
                const openingBalance = (buyerData.balance || 0) - futureSalesAmt + futurePayAmt;

                // Period records (within selected date range)
                const periodSales = allSales.filter(s => {
                    const dt = s.date || (s.timestamp?.toDate ? toDateStr(s.timestamp.toDate()) : null);
                    return dt && dt >= from && dt <= to;
                });
                const periodPayments = allPayments.filter(p => {
                    if (!isPb && p.type !== 'buyer') return false;
                    const dt = p.timestamp ? (typeof p.timestamp === 'string' ? p.timestamp.substring(0, 10) : toDateStr(p.timestamp.toDate ? p.timestamp.toDate() : new Date(p.timestamp))) : null;
                    return dt && dt >= from && dt <= to;
                });

                const todayTotal = periodSales.reduce((sum, x) => sum + (Number(x.grandTotal) || 0), 0);
                const cashRec = periodPayments.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
                const cashLess = periodPayments.reduce((sum, x) => sum + (Number(x.cashLess) || 0), 0);
                const balanceDues = openingBalance + todayTotal - cashRec - cashLess;

                // Extract flattened items for invoice table
                const flatItems = periodSales.flatMap(s => (s.items || []).map(item => ({
                    ...item,
                    date: s.date || (s.timestamp?.toDate ? toDateStr(s.timestamp.toDate()) : '')
                })));

                const totalKg = flatItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

                setInvoiceItems(flatItems);
                setFinancials({
                    openingBalance,
                    todayTotal,
                    cashRec,
                    cashLess,
                    balanceDues,
                    totalKg
                });
            } catch (err) {
                console.error(err);
                setError(err.message || 'Failed to load invoice data.');
            } finally {
                setLoading(false);
            }
        };

        if (tenantId && buyerId) {
            fetchData();
        }
    }, [tenantId, buyerId, from, to, isPb]);

    // Triggers window print
    const handlePrint = () => {
        window.print();
    };

    const handleDownloadImage = async () => {
        const element = document.querySelector('.invoice-container');
        if (!element) return;
        
        // Save original styles
        const origWidth = element.style.width;
        const origMaxWidth = element.style.maxWidth;
        
        try {
            // Lock dimensions during capture to match standard desktop look
            element.style.width = '840px';
            element.style.maxWidth = '840px';
            
            const canvas = await html2canvas(element, {
                useCORS: true,
                allowTaint: false,
                scale: 2,
                backgroundColor: '#FFFDF9',
                scrollX: 0,
                scrollY: -window.scrollY
            });
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `Invoice-${from}-${buyer?.name || 'Customer'}.png`;
            link.click();
        } catch (err) {
            console.error('Error downloading invoice image:', err);
            alert('Failed to generate image download.');
        } finally {
            // Restore original style parameters
            element.style.width = origWidth;
            element.style.maxWidth = origMaxWidth;
        }
    };



    // Dynamic payment QR code based on UPI ID and invoice dues (modified to be static and allow manual input)
    const getPaymentQrUrl = () => {
        const upiId = tenantInfo?.upiId || 'mmafreshflowers@upi';
        const name = tenantInfo?.name || 'MMA Fresh Flowers';
        const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiPayUrl)}`;
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FDFBF7', fontFamily: 'Montserrat, sans-serif' }}>
                <div style={{ width: '40px', height: '40px', border: '3.5px solid #F4E8C1', borderTopColor: '#7C1A3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ marginTop: '16px', color: '#6E5D61', fontWeight: 600, fontSize: '14px' }}>Loading Premium Floral Invoice...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FDFBF7', fontFamily: 'Montserrat, sans-serif', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌸</div>
                <h3 style={{ color: '#7C1A3A', fontWeight: 800, fontSize: '20px', margin: 0 }}>Error Loading Invoice</h3>
                <p style={{ color: '#6E5D61', marginTop: '8px', maxWidth: '400px', fontSize: '14px' }}>{error}</p>
                <button onClick={() => navigate(-1)} style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '1.5px solid #7C1A3A', background: 'transparent', color: '#7C1A3A', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

    const qrUrl = getPaymentQrUrl();
    const showBank = tenantInfo?.bankName && tenantInfo?.bankAcc && tenantInfo?.bankIfsc;

    // Translation maps
    const txt = {
        en: {
            invoice: 'Invoice',
            invoiceNo: 'Invoice No.',
            date: 'Invoice Date',
            dueDate: 'Due Date',
            period: 'Billing Period',
            billTo: 'Bill To',
            dueTerms: 'Due on Receipt',
            terms: 'Payment Terms',
            slNo: 'S.No',
            itemDesc: 'Description / Flowers',
            qty: 'Weight (KG)',
            rate: 'Rate (₹)',
            amount: 'Amount (₹)',
            subtotal: 'Subtotal',
            openingBal: 'Opening Dues',
            todaysSales: 'Today\'s Sales',
            amtRec: 'Amount Received',
            cashLess: 'Cash Discount',
            balDues: 'Balance Amount',
            duesSummary: 'Financial Summary',
            notes: 'Terms & Conditions',
            notesContent: '1. Please clear the balance dues within the agreed credit terms.\n2. Goods once sold will not be accepted back.\n3. Thank you for choosing us!',
            thankYou: 'Thank You!',
            supportText: 'For Your Trust & Support',
            scanPay: 'Scan & Pay',
            scanPayDesc: 'Scan this QR code using any UPI app to pay the balance amount.',
            bankDetails: 'Bank Account Details',
            bank: 'Bank',
            accNo: 'Acc No',
            ifsc: 'IFSC',
            upiId: 'UPI ID',
            logoAlt: 'Company Logo',
            gstNo: 'GSTIN'
        },
        ta: {
            invoice: 'விலைப்பட்டியல்',
            invoiceNo: 'பட்டியல் எண்',
            date: 'தேதி',
            dueDate: 'முடிவு தேதி',
            period: 'கால அளவு',
            billTo: 'பெறுநர்',
            dueTerms: 'உடனடி செலுத்துகை',
            terms: 'செலுத்தும் காலம்',
            slNo: 'வ.எண்',
            itemDesc: 'விவரம் / பூக்கள்',
            qty: 'எடை (கி.கி)',
            rate: 'விலை (₹)',
            amount: 'தொகை (₹)',
            subtotal: 'கூட்டுத்தொகை',
            openingBal: 'துவக்க பாக்கி',
            todaysSales: 'இன்றைய விற்பனை',
            amtRec: 'பெறப்பட்ட தொகை',
            cashLess: 'கழிவு தொகை',
            balDues: 'மீதி பாக்கி',
            duesSummary: 'நிதிச் சுருக்கம்',
            notes: 'விதிமுறைகள் & நிபந்தனைகள்',
            notesContent: '1. ஒப்புக்கொள்ளப்பட்ட கடன் விதிமுறைகளுக்குள் மீதி தொகையைச் செலுத்தவும்.\n2. விற்கப்பட்ட பொருட்கள் எக்காரணம் கொண்டும் திருப்பிப் பெறப்பட மாட்டாது.\n3. எங்களை தேர்ந்தெடுத்தமைக்கு நன்றி!',
            thankYou: 'மிக்க நன்றி!',
            supportText: 'உங்கள் ஆதரவிற்கும் நம்பிக்கையிற்கும்',
            scanPay: 'ஸ்கேன் செய்து செலுத்தவும்',
            scanPayDesc: 'மீதி தொகையைச் செலுத்த ஏதேனும் ஒரு UPI செயலியைப் பயன்படுத்தி இந்த QR குறியீட்டை ஸ்கேன் செய்யவும்.',
            bankDetails: 'வங்கி கணக்கு விவரங்கள்',
            bank: 'வங்கி',
            accNo: 'கணக்கு எண்',
            ifsc: 'IFSC குறியீடு',
            upiId: 'UPI ஐடி',
            logoAlt: 'நிறுவன சின்னம்',
            gstNo: 'ஜிஎஸ்டி'
        }
    };

    const activeText = {
        ...(txt[lang] || txt.en),
        invoice: lang === 'ta' 
            ? (tenantInfo?.lblInvoiceTa || txt.ta.invoice) 
            : (tenantInfo?.lblInvoiceEn || txt.en.invoice),
        invoiceNo: lang === 'ta' 
            ? (tenantInfo?.lblInvoiceNoTa || txt.ta.invoiceNo) 
            : (tenantInfo?.lblInvoiceNoEn || txt.en.invoiceNo),
        date: lang === 'ta' 
            ? (tenantInfo?.lblDateTa || txt.ta.date) 
            : (tenantInfo?.lblDateEn || txt.en.date),
        dueDate: lang === 'ta' 
            ? (tenantInfo?.lblDueDateTa || txt.ta.dueDate) 
            : (tenantInfo?.lblDueDateEn || txt.en.dueDate),
        terms: lang === 'ta' 
            ? (tenantInfo?.lblTermsTa || txt.ta.terms) 
            : (tenantInfo?.lblTermsEn || txt.en.terms),
        dueTerms: lang === 'ta' 
            ? (tenantInfo?.lblDueTermsTa || txt.ta.dueTerms) 
            : (tenantInfo?.lblDueTermsEn || txt.en.dueTerms)
    };

    return (
        <div style={{ minHeight: '100vh', background: '#FDFBF7', color: '#2C1E21', padding: '0 0 40px', fontFamily: 'Montserrat, sans-serif' }}>
            {/* Top Toolbar (Hidden during print) */}
            <div className="no-print" style={{
                background: '#fff',
                borderBottom: '1px solid #f1f5f9',
                padding: '12px 24px',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            border: '1.5px solid #f1f5f9',
                            background: '#fff',
                            borderRadius: '8px',
                            color: '#6E5D61',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C1A3A'; e.currentTarget.style.color = '#7C1A3A'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.color = '#6E5D61'; }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#7C1A3A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Premium Invoice View
                        </h4>
                        <span style={{ fontSize: '11px', color: '#6E5D61', fontWeight: 500 }}>
                            {isPb ? 'Power Buy Module' : 'Standard Sales Module'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Language Switcher */}
                    <button
                        onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1.5px solid #D4AF37',
                            background: '#FFFDF9',
                            color: '#8B0032',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        <Globe size={14} /> {lang === 'en' ? 'தமிழ்' : 'English'}
                    </button>

                    {/* Print Button */}
                    <button
                        onClick={handlePrint}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1.5px solid #e2e8f0',
                            background: '#fff',
                            color: '#2c3e50',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <Printer size={14} /> Print / Save PDF
                    </button>

                    {/* Download Image Button */}
                    <button
                        onClick={handleDownloadImage}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1.5px solid #e2e8f0',
                            background: '#fff',
                            color: '#2c3e50',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <Download size={14} /> Download Image
                    </button>


                </div>
            </div>

            {/* Invoice Sheet */}
            <div id="printable-invoice" className="invoice-container" style={{
                maxWidth: '900px',
                margin: '24px auto',
                background: '#FFFDF9',
                border: '2px solid #D4AF37',
                padding: '40px',
                position: 'relative',
                boxShadow: '0 20px 50px rgba(124, 26, 58, 0.04)',
                boxSizing: 'border-box'
            }}>
                {/* Outer borders and floral corners */}
                <div style={{
                    position: 'absolute',
                    inset: '6px',
                    border: '1px solid #7C1A3A',
                    pointerEvents: 'none'
                }} />

                {/* Floral Corner Bouquets */}
                <img src="/images/flower_corner_top.png" alt="" style={{ position: 'absolute', top: '4px', left: '4px', width: '65px', pointerEvents: 'none', zIndex: 1 }} />
                <img src="/images/flower_corner_top.png" alt="" style={{ position: 'absolute', top: '4px', right: '4px', width: '65px', transform: 'scaleX(-1)', pointerEvents: 'none', zIndex: 1 }} />
                <img src="/images/flower_corner_top.png" alt="" style={{ position: 'absolute', bottom: '4px', left: '4px', width: '65px', pointerEvents: 'none', zIndex: 2 }} />
                <img src="/images/flower_corner_top.png" alt="" style={{ position: 'absolute', bottom: '4px', right: '4px', width: '65px', transform: 'scaleX(-1)', pointerEvents: 'none', zIndex: 2 }} />

                {/* ── HEADER SECTION ── */}
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '35px', borderBottom: '2px solid #F4E8C1', paddingBottom: '24px', boxSizing: 'border-box' }}>
                    
                    {/* Top Row: Info Columns */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', width: '100%', boxSizing: 'border-box' }}>
                        
                        {/* Left Column: Contact details */}
                        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginTop: '12px', paddingLeft: '15px', boxSizing: 'border-box' }}>
                            {/* Phone row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#7C1A3A', color: '#fff', flexShrink: 0 }}>
                                    <Phone size={13} />
                                </div>
                                <span style={{ fontSize: '12px', color: '#2C1E21', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    {tenantInfo?.phone1 || '9047022045'}
                                </span>
                            </div>
                            {/* Email row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#7C1A3A', color: '#fff', flexShrink: 0 }}>
                                    <Mail size={13} />
                                </div>
                                <span style={{ fontSize: '12px', color: '#2C1E21', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    {tenantInfo?.email || 'mmafreshflowers@gmail.com'}
                                </span>
                            </div>
                            {/* Address row */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#7C1A3A', color: '#fff', flexShrink: 0, marginTop: '2px' }}>
                                    <MapPin size={13} />
                                </div>
                                <span style={{ fontSize: '12px', color: '#2C1E21', fontWeight: 700, lineHeight: '1.4' }}>
                                    {tenantInfo?.address || '123, Flower Market, Avinashi Road, Coimbatore - 641 037, Tamil Nadu, India.'}
                                </span>
                            </div>
                        </div>

                        {/* Center Column: Logo & Tamil Banners (Centered relative to invoice width) */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'center' }}>
                            {tenantId === 'mma' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontFamily: 'Amiri, Georgia, serif', color: '#7C1A3A', fontSize: '98px', fontWeight: 900, letterSpacing: '0.03em', lineHeight: '1' }}>MMA</span>
                                        <svg width="84" height="84" viewBox="0 0 64 64" style={{ marginLeft: '4px', flexShrink: 0, transform: 'translateY(12px)' }}>
                                            {/* Stem */}
                                            <path d="M32,32 Q45,35 48,55" fill="none" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" />
                                            {/* Leaf 1 */}
                                            <path d="M38,40 Q46,36 50,44 Q42,46 38,40 Z" fill="#2d6a4f" />
                                            {/* Leaf 2 */}
                                            <path d="M43,48 Q49,43 54,50 Q46,52 43,48 Z" fill="#2d6a4f" />
                                            {/* Petals */}
                                            <path d="M32,24 C32,12 24,12 24,20 C24,28 32,28 32,24 Z" fill="#C81B54" />
                                            <path d="M24,28 C14,28 14,20 22,20 C30,20 30,28 24,28 Z" fill="#C81B54" />
                                            <path d="M40,28 C50,28 50,20 42,20 C34,20 34,28 40,28 Z" fill="#C81B54" />
                                            <path d="M27,33 C18,39 23,45 28,40 C33,35 32,29 27,33 Z" fill="#C81B54" />
                                            <path d="M37,33 C46,39 41,45 36,40 C31,35 32,29 37,33 Z" fill="#C81B54" />
                                            {/* Center */}
                                            <circle cx="32" cy="26" r="4.5" fill="#FCD34D" />
                                            <circle cx="32" cy="26" r="2" fill="#fff" />
                                        </svg>
                                    </div>
                                    <span style={{ fontFamily: 'Aref Ruqaa, Georgia, serif', fontSize: '52px', color: '#1E4620', fontWeight: 800, marginTop: '-24px', letterSpacing: '0.05em' }}>fresh flowers</span>
                                    <div style={{
                                        marginTop: '12px',
                                        fontFamily: 'Playfair Display, Georgia, serif',
                                        fontSize: '17px',
                                        color: '#7C1A3A',
                                        fontStyle: 'italic',
                                        fontWeight: 800,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        Every Flower Tells A Story, Let Us Be A Part Of Yours ♥
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {tenantInfo?.logoUrl ? (
                                        <img src={tenantInfo.logoUrl} alt="Logo" style={{ maxHeight: '60px', maxWidth: '140px', marginBottom: '6px' }} />
                                    ) : (
                                        <span style={{ fontSize: '36px', marginBottom: '6px' }}>🌸</span>
                                    )}
                                    <h1 style={{ fontFamily: 'Cinzel, Georgia, serif', color: '#7C1A3A', fontSize: '30px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', lineHeight: '1.1' }}>
                                        {tenantInfo?.name || 'SVM Flowers'}
                                    </h1>
                                    <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', color: '#D4AF37', fontStyle: 'italic', fontWeight: 600, marginTop: '4px' }}>
                                        {tenantInfo?.motto || 'Freshness You Can Trust, Quality You Deserve'}
                                    </span>
                                    <div style={{
                                        marginTop: '12px',
                                        fontFamily: 'Playfair Display, Georgia, serif',
                                        fontSize: '14px',
                                        color: '#7C1A3A',
                                        fontStyle: 'italic',
                                        fontWeight: 800,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        ♥ Every Flower Tells A Story, Let Us Be A Part Of Yours ♥
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Premium Round Badge (Symmetric to Left Column) */}
                        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingRight: '45px', boxSizing: 'border-box' }}>
                            {/* Premium Round Badge */}
                            <div style={{
                                marginTop: '12px',
                                display: 'flex',
                                justifyContent: 'center',
                                width: '240px',
                                boxSizing: 'border-box'
                            }}>
                                <div style={{
                                    width: '76px',
                                    height: '76px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxSizing: 'border-box',
                                    boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                                    overflow: 'hidden'
                                }}>
                                    <svg width="76" height="76" viewBox="0 0 100 100" style={{ display: 'block' }}>
                                        <defs>
                                            <path id="topTextPath" d="M 18 50 A 32 32 0 0 1 82 50" fill="none" />
                                            <path id="bottomTextPath" d="M 82 50 A 32 32 0 0 1 18 50" fill="none" />
                                        </defs>
                                        <circle cx="50" cy="50" r="48" fill="#1E4620" stroke="#D4AF37" strokeWidth="1.8" />
                                        <circle cx="50" cy="50" r="44" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="2, 2" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#D4AF37" strokeWidth="1.2" />
                                        <circle cx="50" cy="50" r="23" fill="#173518" stroke="#D4AF37" strokeWidth="0.8" />
                                        
                                        <text fontStyle="normal" fontWeight="800" fontSize="7" fill="#D4AF37" letterSpacing="0.6">
                                            <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
                                                FRESH FLOWERS
                                            </textPath>
                                        </text>
                                        
                                        <text fontStyle="normal" fontWeight="800" fontSize="7" fill="#D4AF37" letterSpacing="0.6">
                                            <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
                                                PREMIUM QUALITY
                                            </textPath>
                                        </text>
                                        
                                        <g fill="#D4AF37" transform="translate(50, 50) scale(0.6)">
                                            {/* Center circle */}
                                            <circle cx="0" cy="0" r="4.5" fill="#FCF9F2" stroke="#D4AF37" strokeWidth="1" />
                                            {/* Petals */}
                                            <path d="M 0,-5 C -4,-12 4,-12 0,-5 Z" />
                                            <path d="M 5,0 C 12,-4 12,4 5,0 Z" />
                                            <path d="M -5,0 C -12,-4 -12,4 -5,0 Z" />
                                            <path d="M 3.5,3.5 C 9.5,9.5 9.5,1.5 3.5,3.5 Z" />
                                            <path d="M -3.5,3.5 C -9.5,9.5 -9.5,1.5 -3.5,3.5 Z" />
                                            <path d="M 3.5,-3.5 C 9.5,-9.5 9.5,-1.5 3.5,-3.5 Z" />
                                            <path d="M -3.5,-3.5 C -9.5,-9.5 -9.5,-1.5 -3.5,-3.5 Z" />
                                        </g>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Garland & Flowers Row (Symmetric and continuous sequence) */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '16px',
                        width: '100%',
                        marginTop: '25px',
                        padding: '0 45px 0 15px',
                        boxSizing: 'border-box'
                    }}>
                        <img src="/images/flower_garland.png" alt="Garland" style={{ height: '145px', objectFit: 'contain', marginRight: '-25px', mixBlendMode: 'multiply', filter: 'brightness(1.08) contrast(1.08)' }} />
                        <img src="/images/jasmine_garland.png" alt="Kattu Pookal" style={{ height: '125px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'brightness(1.08) contrast(1.08)' }} />
                        <img src="/images/rose_petals.png" alt="Rose Petals" style={{ height: '95px', width: '95px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'brightness(1.08) contrast(1.08)' }} />
                        <img src="/images/malli.png" alt="Malli" style={{ height: '95px', width: '95px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'brightness(1.08) contrast(1.08)' }} />
                        <img src="/images/mullai.png" alt="Mullai" style={{ height: '95px', width: '95px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'brightness(1.08) contrast(1.08)' }} />
                        <img src="/images/sammanki.png" alt="Sammanki" style={{ height: '95px', width: '95px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'brightness(1.08) contrast(1.08)' }} />
                        <img src="/images/marigold_flower.png" alt="Samanthi" style={{ height: '95px', width: '95px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'brightness(1.08) contrast(1.08)' }} />
                    </div>
                </div>

                {/* ── CLIENT & FINANCIAL SUMMARY SECTION ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px', margin: '24px 0' }}>
                    {/* Bill To */}
                    <div style={{
                        flex: 1,
                        border: '1.5px solid #7C1A3A',
                        borderRadius: '16px',
                        padding: '24px 20px 16px',
                        background: '#FFFDF9',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        minHeight: '140px'
                    }}>
                        {/* Top-left flag/tab */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            background: '#7C1A3A',
                            color: '#fff',
                            padding: '6px 18px',
                            borderTopLeftRadius: '14px',
                            borderBottomRightRadius: '14px',
                            fontWeight: 800,
                            fontSize: '10.5px',
                            letterSpacing: '0.05em'
                        }}>
                            {activeText.billTo} :
                        </div>



                        {buyer && (
                            <div style={{ zIndex: 1, position: 'relative', width: '100%', marginTop: '10px' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <h3 style={{
                                        fontFamily: 'Playfair Display, Georgia, serif',
                                        fontStyle: 'normal',
                                        fontSize: (lang === 'ta' ? (buyer.nameTa || buyer.name) : buyer.name).length > 20
                                            ? '16px'
                                            : (lang === 'ta' ? (buyer.nameTa || buyer.name) : buyer.name).length > 12
                                                ? '20.5px'
                                                : '25px',
                                        fontWeight: 900,
                                        color: '#7C1A3A',
                                        margin: '0 0 10px'
                                    }}>
                                        {lang === 'ta' ? (buyer.nameTa || buyer.name) : buyer.name}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {buyer.address && buyer.address !== 'Local Market Customer' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: '#7C1A3A', color: '#fff', flexShrink: 0 }}>
                                                    <MapPin size={10} />
                                                </div>
                                                <span style={{ fontSize: '11.5px', color: '#6E5D61', fontWeight: 600 }}>
                                                    {buyer.address}
                                                </span>
                                            </div>
                                        )}
                                        {buyer.contact && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: '#7C1A3A', color: '#fff', flexShrink: 0 }}>
                                                    <Phone size={10} />
                                                </div>
                                                <span style={{ fontSize: '11.5px', color: '#6E5D61', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                    +91 {buyer.contact}
                                                </span>
                                            </div>
                                        )}
                                        {buyer.email && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: '#7C1A3A', color: '#fff', flexShrink: 0 }}>
                                                    <Mail size={10} />
                                                </div>
                                                <span style={{ fontSize: '11.5px', color: '#6E5D61', fontWeight: 600 }}>
                                                    {buyer.email}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dues summary badges */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {/* Opening Balance Card */}
                        <div style={{
                            minWidth: '135px',
                            borderRadius: '10px',
                            border: '1.5px solid #D4AF37',
                            background: '#FFFDF9',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(124, 26, 58, 0.02)',
                            boxSizing: 'border-box',
                            padding: '12px 14px'
                        }}>
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 800, 
                                color: '#FFFDF9', 
                                background: '#7C1A3A',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                textTransform: 'uppercase', 
                                letterSpacing: '0.04em', 
                                textAlign: 'center',
                                display: 'inline-block',
                                marginBottom: '8px'
                            }}>
                                {activeText.openingBal}
                            </span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#2C1E21' }}>
                                {fmt(financials.openingBalance)}
                            </span>
                        </div>

                        {/* Today's Sales Card */}
                        <div style={{
                            minWidth: '150px',
                            borderRadius: '10px',
                            border: '2px solid #7C1A3A',
                            background: '#7C1A3A',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 6px 15px rgba(124, 26, 58, 0.15)',
                            transform: 'scale(1.05)',
                            boxSizing: 'border-box',
                            padding: '14px 16px'
                        }}>
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 800, 
                                color: '#7C1A3A', 
                                background: '#FFFDF9',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                textTransform: 'uppercase', 
                                letterSpacing: '0.04em', 
                                textAlign: 'center',
                                display: 'inline-block',
                                marginBottom: '8px'
                            }}>
                                {activeText.todaysSales}
                            </span>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>
                                {fmt(financials.todayTotal)}
                            </span>
                        </div>

                        {/* Balance Dues Card */}
                        <div style={{
                            minWidth: '135px',
                            borderRadius: '10px',
                            border: '1.5px solid #D4AF37',
                            background: '#FCF9F2',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(124, 26, 58, 0.02)',
                            boxSizing: 'border-box',
                            padding: '12px 14px'
                        }}>
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 800, 
                                color: '#FFFDF9', 
                                background: '#7C1A3A',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                textTransform: 'uppercase', 
                                letterSpacing: '0.04em', 
                                textAlign: 'center',
                                display: 'inline-block',
                                marginBottom: '8px'
                            }}>
                                {activeText.balDues}
                            </span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#7C1A3A' }}>
                                {fmt(financials.balanceDues)}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ margin: '24px 0', border: '1px solid #D4AF37', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '18px', fontFamily: 'Montserrat, sans-serif' }}>
                        <thead>
                            <tr style={{ background: '#7C1A3A', color: '#fff', borderBottom: '2px solid #D4AF37' }}>
                                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 950, fontSize: '19px', width: '8%', whiteSpace: 'nowrap' }}>{activeText.slNo}</th>
                                {from !== to && <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 950, fontSize: '19px', width: '14%', whiteSpace: 'nowrap' }}>{activeText.date}</th>}
                                <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 950, fontSize: '19px', width: '32%', whiteSpace: 'nowrap' }}>{activeText.itemDesc}</th>
                                <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 950, fontSize: '19px', width: from !== to ? '14%' : '16%', whiteSpace: 'nowrap' }}>{activeText.qty}</th>
                                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 950, fontSize: '19px', width: from !== to ? '14%' : '20%', whiteSpace: 'nowrap' }}>{activeText.rate}</th>
                                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 950, fontSize: '19px', width: from !== to ? '18%' : '24%', whiteSpace: 'nowrap' }}>{activeText.amount}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceItems.length === 0 ? (
                                <tr>
                                    <td colSpan={from !== to ? 6 : 5} style={{ padding: '30px 16px', textAlign: 'center', color: '#6E5D61', fontStyle: 'italic', fontWeight: 500 }}>
                                        No sales records registered in this period.
                                    </td>
                                </tr>
                            ) : (
                                invoiceItems.map((item, idx) => (
                                    <tr key={idx} style={{
                                        borderBottom: '1px solid #F4E8C1',
                                        background: idx % 2 === 0 ? '#FFFDF9' : '#FCF9F2',
                                        color: '#2C1E21'
                                    }}>
                                        <td style={{ padding: '10px', textAlign: 'center', color: '#6E5D61', width: '8%', fontSize: '18.5px', fontWeight: 800 }}>{idx + 1}</td>
                                        {from !== to && <td style={{ padding: '10px', textAlign: 'left', fontSize: '17px', fontWeight: 700, width: '14%' }}>{item.date ? displayDate(item.date) : ''}</td>}
                                        <td style={{ padding: '8px 10px', textAlign: 'left', color: '#7C1A3A', fontWeight: 900, width: '32%', fontSize: '19px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <img src={getFlowerImage(item.flowerType)} alt="" style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover', border: '1.5px solid #F4E8C1', background: '#fff' }} />
                                                <span>{lang === 'ta' ? (item.flowerTypeTa || item.flowerType) : item.flowerType}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'left', width: from !== to ? '14%' : '16%', fontWeight: 900, fontSize: '19px' }}>{Number(item.quantity).toFixed(2)}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', width: from !== to ? '14%' : '20%', fontWeight: 900, fontSize: '19px' }}>{fmt(item.price)}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 950, fontSize: '20px', width: from !== to ? '18%' : '24%' }}>{fmt(item.total)}</td>
                                    </tr>
                                ))
                            )}

                            {/* Totals Summary Row inside table */}
                            {invoiceItems.length > 0 && (
                                <tr style={{ background: '#FCF9F2', borderTop: '2.5px double #D4AF37', fontWeight: 950, color: '#7C1A3A', fontSize: '20px' }}>
                                    <td colSpan={from !== to ? 3 : 2} style={{ padding: '12px 10px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Total
                                    </td>
                                    <td style={{ padding: '12px 10px', textAlign: 'left', width: from !== to ? '14%' : '16%', fontWeight: 950, whiteSpace: 'nowrap' }}>{financials.totalKg.toFixed(2)} Kg</td>
                                    <td style={{ padding: '12px 10px', width: from !== to ? '14%' : '20%' }} />
                                    <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '21px', fontWeight: 950, width: from !== to ? '18%' : '24%' }}>{fmt(financials.todayTotal)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── LOWER SECTION: DUES STATEMENT & PAYMENT ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', margin: '30px 0 10px' }}>
                    {/* Left: New Decorative Bordered Promotional Box */}
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px 30px',
                        background: '#FFFDF9',
                        border: '2px solid #D4AF37',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(124, 26, 58, 0.02)',
                        boxSizing: 'border-box',
                        minHeight: '135px',
                        overflow: 'hidden'
                    }}>
                        {/* Decorative thin inner border */}
                        <div style={{
                            position: 'absolute',
                            inset: '6px',
                            border: '1px dashed #D4AF37',
                            borderRadius: '10px',
                            pointerEvents: 'none'
                        }} />

                        {/* Subtle Floral Corner Decorations */}
                        <img src="/images/flower_corner_top.png" alt="" style={{ position: 'absolute', top: '8px', left: '8px', width: '32px', height: '32px', objectFit: 'contain', opacity: 0.8 }} />
                        <img src="/images/flower_corner_top.png" alt="" style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', objectFit: 'contain', transform: 'scaleX(-1)', opacity: 0.8 }} />
                        <img src="/images/flower_corner_top.png" alt="" style={{ position: 'absolute', bottom: '8px', left: '8px', width: '32px', height: '32px', objectFit: 'contain', transform: 'scaleY(-1)', opacity: 0.8 }} />
                        <img src="/images/flower_corner_top.png" alt="" style={{ position: 'absolute', bottom: '8px', right: '8px', width: '32px', height: '32px', objectFit: 'contain', transform: 'scale(-1)', opacity: 0.8 }} />

                        {/* Header: MMA & Fresh Flowers */}
                        <div style={{ textAlign: 'center', margin: '10px 0 18px', zIndex: 1 }}>
                            <h4 style={{
                                fontFamily: 'Playfair Display, Georgia, serif',
                                fontSize: '32px',
                                fontWeight: 950,
                                color: '#7C1A3A',
                                margin: '0',
                                letterSpacing: '0.05em',
                                lineHeight: '1.1'
                            }}>
                                MMA
                            </h4>
                            <span style={{
                                fontFamily: 'Playfair Display, Georgia, serif',
                                fontSize: '18.5px',
                                fontWeight: 900,
                                color: '#7C1A3A',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                display: 'block',
                                marginTop: '4px'
                            }}>
                                Fresh Flowers
                            </span>
                        </div>

                        {/* Promotional Bullet Points */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '18px',
                            textAlign: 'left',
                            zIndex: 1,
                            padding: '0 12px 10px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '22px', flexShrink: 0 }}>🌸</span>
                                <span style={{
                                    fontFamily: lang === 'ta' ? 'inherit' : 'Playfair Display, Georgia, serif',
                                    fontSize: '20.5px',
                                    fontWeight: 950,
                                    color: '#7C1A3A',
                                    fontStyle: 'normal',
                                    lineHeight: '1.4'
                                }}>
                                    {lang === 'ta'
                                        ? 'ஆர்டரின் பெயரில் கல்யாண மாலைகள் குறைந்த விலையில் கிடைக்கும்.'
                                        : 'Order-in peyaril Kalyana maalaigal kuraindha vilayil kidaikum.'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '22px', flexShrink: 0 }}>🌸</span>
                                <span style={{
                                    fontFamily: lang === 'ta' ? 'inherit' : 'Playfair Display, Georgia, serif',
                                    fontSize: '20.5px',
                                    fontWeight: 950,
                                    color: '#7C1A3A',
                                    fontStyle: 'normal',
                                    lineHeight: '1.4'
                                }}>
                                    {lang === 'ta'
                                        ? 'எங்களிடம் கட்டுப் பூக்களும் கட்டித் தரப்படும்.'
                                        : 'Engalidam kattu pookalum katti tharapadum.'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Calculations Dues Summary Block */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                        <div style={{
                            border: '1.5px solid #7C1A3A',
                            borderRadius: '12px',
                            background: '#FFFDF9',
                            overflow: 'hidden',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.01)'
                        }}>
                            <div style={{ background: '#7C1A3A', color: '#fff', padding: '12px 15px', textAlign: 'center', fontSize: '14.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {activeText.duesSummary}
                            </div>
                            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                                {/* Opening Dues */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1.2px solid #F4E8C1',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    background: '#FFFDF9'
                                }}>
                                    <span style={{ color: '#2C1E21', fontWeight: 800, fontSize: '13.5px' }}>{activeText.openingBal}:</span>
                                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#2C1E21' }}>{fmt(financials.openingBalance)}</span>
                                </div>

                                {/* Today's Sales */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1.2px solid #F4E8C1',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    background: '#FFFDF9'
                                }}>
                                    <span style={{ color: '#2C1E21', fontWeight: 800, fontSize: '13.5px' }}>{activeText.todaysSales}:</span>
                                    <span style={{ color: '#b91c1c', fontWeight: 900, fontSize: '14.5px' }}>+ {fmt(financials.todayTotal)}</span>
                                </div>

                                {/* Amount Received */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1.2px solid #F4E8C1',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    background: '#FFFDF9'
                                }}>
                                    <span style={{ color: '#2C1E21', fontWeight: 800, fontSize: '13.5px' }}>{activeText.amtRec}:</span>
                                    <span style={{ color: '#16a34a', fontWeight: 900, fontSize: '14.5px' }}>- {fmt(financials.cashRec)}</span>
                                </div>

                                {/* Cash Discount */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1.2px solid #F4E8C1',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    background: '#FFFDF9'
                                }}>
                                    <span style={{ color: '#2C1E21', fontWeight: 800, fontSize: '13.5px' }}>{activeText.cashLess}:</span>
                                    <span style={{ color: '#16a34a', fontWeight: 900, fontSize: '14.5px' }}>- {fmt(financials.cashLess)}</span>
                                </div>

                                {/* Balance Amount */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '2px solid #7C1A3A',
                                    borderRadius: '8px',
                                    padding: '14px 18px',
                                    background: '#7C1A3A',
                                    boxShadow: '0 4px 15px rgba(124, 26, 58, 0.25)'
                                }}>
                                    <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '18px' }}>
                                        {lang === 'ta' ? 'மீதி பாக்கி' : 'Balance Amount'}:
                                    </span>
                                    <span style={{ color: '#FCD34D', fontWeight: 950, fontSize: '24px' }}>
                                        {fmt(financials.balanceDues)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── THANK YOU & SIGNATURE ROW ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '25px 0 10px', borderTop: '2px solid #F4E8C1', paddingTop: '15px' }}>
                    {/* Left: Green Medallion Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '2px solid #D4AF37', borderRadius: '30px', padding: '6px 14px', background: '#1E4620', color: '#fff', width: '210px', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid #D4AF37', background: '#FFFDF9', color: '#1E4620', fontSize: '14px', flexShrink: 0 }}>
                            🌸
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '8px', fontWeight: 800, textAlign: 'left', letterSpacing: '0.05em', lineHeight: '1.2' }}>
                            <span style={{ color: '#D4AF37' }}>• LOWEST PRICE</span>
                            <span>• BEST QUALITY</span>
                            <span>• FRESHNESS GUARANTEED</span>
                        </div>
                    </div>

                    {/* Center: Thank You Script */}
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '24px', fontStyle: 'italic', fontWeight: 800, color: '#7C1A3A', margin: 0 }}>
                            Thank You!
                        </h3>
                        <span style={{ fontSize: '10px', color: '#6E5D61', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginTop: '2px' }}>
                            {activeText.supportText}
                        </span>
                        <div style={{ fontSize: '14px', color: '#7C1A3A', marginTop: '4px' }}>♥</div>
                    </div>

                    {/* Right: Signature Line */}
                    {/* Right: Signature Line (Simplified as requested) */}
                    <div style={{ textAlign: 'right', minWidth: '180px', marginRight: '35px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '17px', fontWeight: 900, color: '#7C1A3A', whiteSpace: 'nowrap' }}>
                            For, {tenantId === 'mma' ? 'MMA Fresh Flowers' : `${tenantInfo?.name || ''} ${tenantInfo?.type || ''}`}
                        </span>
                    </div>
                </div>

                {/* ── PAYMENT & BANK DETAILS BOX ── */}
                <div style={{
                    border: '1.5px solid #D4AF37',
                    borderRadius: '12px',
                    padding: '16px',
                    background: '#FFFDF9',
                    display: 'grid',
                    gridTemplateColumns: '0.9fr 1.2fr 0.9fr',
                    gap: '15px',
                    margin: '20px 0 10px',
                    boxSizing: 'border-box'
                }}>
                    {/* Col 1: We Accept */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRight: '1.2px solid #F4E8C1', paddingRight: '10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#7C1A3A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>We Accept</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '6px' }}>
                            <span style={{ fontSize: '8.5px', fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 6px', borderRadius: '4px' }}>Cash</span>
                            <span style={{ fontSize: '8.5px', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 6px', borderRadius: '4px' }}>UPI</span>
                            <span style={{ fontSize: '8.5px', fontWeight: 800, background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff', padding: '2px 6px', borderRadius: '4px' }}>PhonePe</span>
                            <span style={{ fontSize: '8.5px', fontWeight: 800, background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4', padding: '2px 6px', borderRadius: '4px' }}>GPay</span>
                            <span style={{ fontSize: '8.5px', fontWeight: 800, background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px' }}>Paytm</span>
                        </div>
                    </div>

                    {/* Col 2: Bank Details */}
                    <div style={{ display: 'flex', gap: '10px', borderRight: '1.2px solid #F4E8C1', paddingRight: '10px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#7C1A3A', color: '#fff', marginTop: '2px', flexShrink: 0 }}>
                            <CreditCard size={13} />
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#7C1A3A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{activeText.bankDetails}</span>
                            {showBank ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontWeight: 600, color: '#2C1E21' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '1px 0', color: '#6E5D61', width: '60px' }}>{activeText.bank}</td>
                                            <td style={{ padding: '1px 0' }}>: {tenantInfo.bankName}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '1px 0', color: '#6E5D61' }}>A/C Name</td>
                                            <td style={{ padding: '1px 0' }}>: {tenantInfo.name}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '1px 0', color: '#6E5D61' }}>A/C No.</td>
                                            <td style={{ padding: '1px 0', fontWeight: 700 }}>: {tenantInfo.bankAcc}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '1px 0', color: '#6E5D61' }}>{activeText.ifsc}</td>
                                            <td style={{ padding: '1px 0', fontWeight: 700, color: '#7C1A3A' }}>: {tenantInfo.bankIfsc}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <span style={{ fontSize: '9px', color: '#6E5D61', fontStyle: 'italic' }}>No bank account configured.</span>
                            )}
                        </div>
                    </div>

                    {/* Col 3: Scan & Pay */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingRight: '15px' }}>
                        {qrUrl ? (
                            <>
                                <img src={qrUrl} alt="UPI QR Code" style={{ width: '60px', height: '60px', border: '1px solid #E2C485', padding: '2px', borderRadius: '4px', background: '#fff', flexShrink: 0 }} />
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#7C1A3A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{activeText.scanPay}</span>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#b91c1c' }}>
                                        {tenantInfo?.phone1 || '9047022045'}
                                    </div>
                                    <span style={{ display: 'block', fontSize: '7.5px', fontWeight: 700, color: '#6E5D61', marginTop: '1px', wordBreak: 'break-all' }}>
                                        UPI ID: {tenantInfo?.upiId || 'mmafreshflowers@upi'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <span style={{ fontSize: '9px', color: '#6E5D61', fontStyle: 'italic' }}>No UPI configured.</span>
                        )}
                    </div>
                </div>

                {/* ── SOLID BOTTOM BAR ── */}
                <div style={{
                    background: '#7C1A3A',
                    margin: '20px -40px -40px',
                    padding: '12px 10px',
                    textAlign: 'center',
                    borderTop: '2px solid #D4AF37',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <span style={{ color: '#FFFDF9', fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        ♥ Thank You For Choosing Us ♥
                    </span>
                </div>
            </div>

            {/* Print stylesheet */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 12mm !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .invoice-container {
                        margin: 0 auto !important;
                        border: 2px solid #D4AF37 !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 40px !important;
                        background: #FFFDF9 !important;
                        zoom: 65% !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default InvoiceView;
