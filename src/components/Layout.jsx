import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ChevronLeft, Globe, User } from 'lucide-react';
import Petals from './Petals';
import { useTenant } from '../utils/TenantContext';

// ── Language Context ──────────────────────────────────────────────────────────
export const LangContext = createContext({ lang: 'en', t: (k) => k });

const strings = {
  en: {
    back: 'Back',
    sales: 'Sales',
    salesman: 'Salesman',
    customer: 'Customer',
    cashReceive: 'Cash Receive',
    salesEntry: 'Sales Entry',
    directSales: 'Direct Sales',
    reports: 'Customer Report',
    intake: 'Intake',
    farmer: 'Farmer',
    accounts: 'Accounts',
    buyer: 'Customer Master',
    language: 'Language',
    template: 'Template',
    import: 'Import',
    addCustomer: 'Add Customer',
    id: 'ID',
    name: 'Name',
    contact: 'Contact',
    amountDue: 'Amount Due (₹)',
    ledger: 'Ledger',
    actions: 'Actions',
    register: 'Register',
    cancel: 'Cancel',
    update: 'Update',
    initialDues: 'Old Balance',
    oldBalanceDate: 'Old Balance Date',
    search: 'Search by ID and Name...',
    noRecords: 'No records found.',
    view: 'View',
    receivePayment: 'Receive Payment',
    date: 'Date',
    sNo: 'S.No',
    customerName: 'Customer Name',
    amountReceived: 'Amount Received',
    notes: 'Short Note',
    action: 'Action',
    givenAmount: 'Given Amount',
    closingBalance: 'Closing Balance',
    openingBalance: 'Opening Balance',
    selectCustomer: 'Select Customer',
    customerId: 'Cust ID',
    close: 'Close',
    newPurchaseEntry: 'New Sales Entry',
    saleDate: 'Sale Date',
    flowerVariety: 'Flower Name',
    weightQty: 'Weight / Qty',
    rate: 'Rate',
    addNew: 'Save',
    totalQuantity: 'Total Quantity',
    grandTotal: 'Grand Total',
    submitSales: 'Submit Sales',
    selectFlower: 'Select Flower',
    items: 'Items',
    noItemsYet: 'No items added yet.',
    billSavedSuccess: 'Bill Saved & Balance Updated!',
    billSaveFailed: 'Failed to save bill.',
    logSalesSubtext: 'Log details of flowers sold to customers.',
    currentBatchItems: 'Current Batch Items',
    flower: 'Flower',
    qty: 'Qty',
    total: 'Total',
    to: 'To',
    today: 'Today',
    month: 'Month',
    custom: 'Custom',
    apply: 'Apply',
    flowers: 'Flowers',
    paid: 'Paid',
    net: 'Net',
    dues: 'Dues',
    balance: 'Balance',
    oldBalance: 'Old Balance',
    cashRec: 'Cash Rec',
    cashLess: 'Cash Less',
    adjustments: 'Adjustments',
    todayTotal: "Today's Total",
    dailyReport: 'Daily Report',
    customerNo: 'Customer No',
    particulars: 'Particulars',
    weight: 'Weight',
    statementTitle: 'STATEMENT',
    totalSales: 'Total Sales',
    finalBalance: 'Final Balance',
    thankYou: 'Thank you!',
    transactionHistory: 'Transaction History',
    viewLedger: 'View Ledger',
    printLedger: 'Print Ledger',
    closeView: 'Close View',
    time: 'Time',
    todayLiveEntries: "Today's Live Entries",
    history: 'History',
    delete: 'Delete',
    outsideShop: 'Outside Shop',
    vendorName: 'Vendor Name',
    purchase: 'Purchase',
    vendorReport: 'Vendor Report',
    location: 'Location',
    outsidePurchase: 'Outside Purchase',
    cashPaid: 'Cash Paid',
    totalPurchase: 'Total Purchase',
    vendorId: 'Vendor ID',
    addVendor: 'Add Vendor',
    backToMenu: 'Back to Menu',
    todayPurchases: "Today's Purchases",
    recordVendorPayment: 'Record Vendor Payment',
    recentPayments: 'Recent Payments',
    fromDate: 'From Date',
    toDate: 'To Date',
    allVendors: 'All Vendors',
    statement: 'Statement',
    editVendor: 'Edit Vendor',
    englishName: 'English Name',
    tamilNameOptional: 'Tamil Name (Optional)',
    locationPlaceholder: 'City/Town',
    englishNamePlaceholder: 'Vendor name in English',
    paymentDetailsPlaceholder: 'Payment details...',
    amount: 'Amount',
    paymentReceipt: 'Payment Receipt',
    purchaseReceipt: 'Purchase Receipt',
    all: 'All',
    yesterday: 'Yesterday',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    prevYear: 'Prev Year',
    filter: 'Filter',
  },
  ta: {
    back: 'பின்',
    sales: 'விற்பனை',
    salesman: 'விற்பனையாளர்',
    customer: 'வாடிக்கையாளர்',
    cashReceive: 'பண வரவு',
    salesEntry: 'விற்பனை பதிவு',
    directSales: 'நேரடி விற்பனை',
    reports: 'வாடிக்கையாளர் அறிக்கை',
    intake: 'உள்வருதல்',
    farmer: 'விவசாயி',
    accounts: 'கணக்குகள்',
    buyer: 'வாடிக்கையாளர் பட்டியல்',
    language: 'மொழி',
    template: 'மாதிரி',
    import: 'இறக்குமதி',
    addCustomer: 'வாடிக்கையாளரைச் சேர்',
    id: 'ஐடி',
    name: 'பெயர்',
    contact: 'தொடர்பு',
    amountDue: 'நிலுவைத் தொகை (₹)',
    ledger: 'பேரேடு',
    actions: 'செயல்கள்',
    register: 'பதிவு செய்',
    cancel: 'ரத்து செய்',
    update: 'புதுப்பி',
    initialDues: 'பழைய நிலுவை',
    oldBalanceDate: 'பழைய நிலுவை தேதி',
    search: 'ஐடி அல்லது பெயர் மூலம் தேடு...',
    noRecords: 'பதிவுகள் எதுவும் இல்லை.',
    view: 'காண்க',
    receivePayment: 'வரவு பதிவு செய்யவும்',
    date: 'தேதி',
    sNo: 'வ.எண்',
    customerName: 'வாடிக்கையாளர் பெயர்',
    amountReceived: 'பெறப்பட்ட தொகை',
    notes: 'சிறு குறிப்பு',
    action: 'செயல்',
    givenAmount: 'செலுத்தும் தொகை',
    closingBalance: 'நிகர நிலுவை',
    openingBalance: 'ஆரம்ப நிலுவை',
    selectCustomer: 'வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்',
    customerId: 'வாடிக்கையாளர் ஐடி',
    close: 'மூடு',
    newPurchaseEntry: 'புதிய விற்பனை பதிவு',
    saleDate: 'விற்பனை தேதி',
    flowerVariety: 'பூ',
    weightQty: 'எடை / அளவு',
    rate: 'விலை',
    addNew: 'சேமி',
    totalQuantity: 'மொத்த அளவு',
    grandTotal: 'மொத்த பாக்கி',
    submitSales: 'பதிவு செய்',
    selectFlower: 'பூவைத் தேர்ந்தெடுக்கவும்',
    items: 'உருப்படிகள்',
    noItemsYet: 'இன்னும் சேர்க்கப்படவில்லை.',
    billSavedSuccess: 'பில் சேமிக்கப்பட்டு நிலுவை புதுப்பிக்கப்பட்டது!',
    billSaveFailed: 'பில் சேமிக்கத் தவறிவிட்டது.',
    logSalesSubtext: 'வாடிக்கையாளர்களுக்கு விற்ற பூக்களின் விவரங்களை இங்கே பதிவு செய்யவும்.',
    currentBatchItems: 'தற்போதைய பட்டியல்',
    flower: 'பூ',
    qty: 'அளவு',
    total: 'மொத்தம்',
    to: 'To',
    today: 'இன்று',
    month: 'மாதம்',
    custom: 'விருப்ப தேதி',
    apply: 'பயன்படுத்து',
    flowers: 'பூக்கள்',
    paid: 'செலுத்தியது',
    net: 'நிகர்',
    dues: 'நிலுவை',
    balance: 'பாக்கி',
    oldBalance: 'முன் பாக்கி',
    cashRec: 'வரவு',
    cashLess: 'கழி',
    adjustments: 'சரிகட்டுதல்',
    todayTotal: 'இன்றைய மொத்தம்',
    dailyReport: 'தினசரி அறிக்கை',
    customerNo: 'வாடிக்கையாளர் எண்',
    particulars: 'விபரம்',
    weight: 'எடை',
    statementTitle: 'கணக்கு அறிக்கை',
    totalSales: 'மொத்த விற்பனை',
    finalBalance: 'இறுதி மீதி',
    thankYou: 'நன்றி!',
    transactionHistory: 'பரிவர்த்தனை வரலாறு',
    viewLedger: 'பேரேட்டைப் பார்க்க',
    printLedger: 'பேரேடு அச்சிடு',
    closeView: 'பார்வையை மூடு',
    time: 'நேரம்',
    todayLiveEntries: 'இன்றைய நேரடி பதிவுகள்',
    history: 'வரலாறு',
    delete: 'நீக்கு',
    outsideShop: 'வெளிக்கடை',
    vendorName: 'விற்பனையாளர் பெயர்',
    purchase: 'கொள்முதல்',
    vendorReport: 'விற்பனையாளர் அறிக்கை',
    location: 'இடம்',
    outsidePurchase: 'வெளிப்புற கொள்முதல்',
    cashPaid: 'செலுத்திய தொகை',
    totalPurchase: 'மொத்த கொள்முதல்',
    vendorId: 'விற்பனையாளர் ஐடி',
    addVendor: 'விற்பனையாளரைச் சேர்',
    backToMenu: 'மெனுவுக்குச் செல்',
    todayPurchases: 'இன்றைய கொள்முதல்',
    recordVendorPayment: 'கொடுப்பனவு பதிவு',
    recentPayments: 'சமீபத்திய கொடுப்பனவுகள்',
    fromDate: 'தொடக்க தேதி',
    toDate: 'முடிவு தேதி',
    allVendors: 'அனைத்து விற்பனையாளர்கள்',
    statement: 'அறிக்கை',
    editVendor: 'விற்பனையாளர் மாற்றம்',
    englishName: 'ஆங்கிலப் பெயர்',
    tamilNameOptional: 'தமிழ் பெயர் (தேவைப்பட்டால்)',
    locationPlaceholder: 'நகரம்/ஊர்',
    englishNamePlaceholder: 'ஆங்கிலத்தில் பெயர்',
    paymentDetailsPlaceholder: 'செலுத்திய விபரம்...',
    amount: 'தொகை',
    paymentReceipt: 'பணம் பெற்றுக் கொண்டமைக்கான ரசீது',
    purchaseReceipt: 'கொள்முதல் ரசீது',
    all: 'அனைத்தும்',
    yesterday: 'நேற்று',
    thisMonth: 'இந்த மாதம்',
    thisYear: 'இந்த ஆண்டு',
    prevYear: 'கடந்த ஆண்டு',
    filter: 'தேடல்',
  },
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantData, logout } = useTenant();

  // ── Developer auth popup states ──
  const [showDevModal, setShowDevModal] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [devError, setDevError] = useState('');

  // ── Language state (persisted) ──
  const [lang, setLang] = useState(() => sessionStorage.getItem('fm_lang') || 'en');

  // ── Toaster states ──
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type } = e.detail;
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  const t = (key) => strings[lang]?.[key] ?? strings['en']?.[key] ?? key;

  const handleLangChange = (e) => {
    const selected = e.target.value;
    setLang(selected);
    sessionStorage.setItem('fm_lang', selected);
  };

  const isDashboard = location.pathname.includes('/dashboard');

  // ── Smart Back Navigation ──
  const getParentRoute = () => {
    const p = location.pathname;
    if (p.includes('/salesman-ledger') || p.includes('/salesman-master') || p.includes('/salesman-credit-expenses')) return '/app/salesman-menu';
    if (p.includes('/sales-entry') || 
        p.includes('/buyer') || 
        p.includes('/reports')) {
      return '/app/sales-menu';
    }
    if (p.includes('/flower-wise-report')) {
      return '/app/dashboard';
    }
    if (p.includes('/outside-shop') || 
        p.includes('/flowers') || 
        p.includes('/daily-report') ||
        p.includes('/daily-statement')) {
      return '/app/vendor-menu';
    }
    return '/app/dashboard';
  };

  // ── Page title ──
  const getTitle = () => {
    const p = location.pathname;
    if (p.includes('/sales-entry'))  return `🧾 ${lang === 'ta' ? 'விற்பனை பக்கம்' : 'Sales Page'}`;
    if (p.includes('/buyer'))        return `👥 ${lang === 'ta' ? 'வாடிக்கையாளர் பட்டியல்' : 'Customer Registry'}`;
    if (p.includes('/outside-shop')) return `🏪 ${lang === 'ta' ? 'விற்பனையாளர்' : 'Vendor'}`;
    if (p.includes('/flowers'))      return `🌸 ${lang === 'ta' ? 'பூக்கள்' : 'Flowers Master'}`;
    if (p.includes('/daily-report')) return `📅 ${lang === 'ta' ? 'தினசரி அறிக்கை' : 'Daily Report'}`;
    if (p.includes('/daily-statement')) return `📖 ${lang === 'ta' ? 'தினசரி கணக்கு அறிக்கை' : 'Daily Statement'}`;
    if (p.includes('/salesman-ledger')) return `📖 ${lang === 'ta' ? 'வரலாற்று/பேரேடு தரவு' : 'Salesman Ledger'}`;
    if (p.includes('/salesman-master')) return `👥 ${lang === 'ta' ? 'விற்பனையாளர் பட்டியல்' : 'Salesman List'}`;
    if (p.includes('/salesman-credit-expenses')) return `💸 ${lang === 'ta' ? 'கடன் / செலவுகள்' : 'Credit / Expenses'}`;
    if (p.includes('/flower-wise-report')) return `🌸 ${lang === 'ta' ? 'பூக்கள் வாரியான அறிக்கை' : 'Flower Wise Report'}`;
    if (p.includes('/settings'))      return `⚙️ ${lang === 'ta' ? 'அமைப்புகள்' : 'Settings'}`;
    if (p.includes('/business-info'))  return `🏢 ${lang === 'ta' ? 'வணிக தகவல்' : 'Business Info'}`;
    return '';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <LangContext.Provider value={{ lang, t }}>
      <div className="page page-main flex flex-col min-h-screen">
        <Petals />

        {/* ── Premium Glassmorphic Top Bar ── */}
        <header style={{
          height: '68px', flexShrink: 0,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', padding: '0 28px',
          position: 'sticky', top: 0, zIndex: 50
        }}>

          {/* Left: Back */}
          <div style={{width: '160px', flexShrink: 0}}>
            {!isDashboard && (
              <button
                onClick={() => navigate(getParentRoute())}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{background:'#f8fafc', border:'1.5px solid #e2e8f0', color:'#64748b', fontFamily:'var(--font-sans)'}}
                onMouseEnter={e => Object.assign(e.currentTarget.style, {background:'#ecfdf5', borderColor:'#6ee7b7', color:'#047857'})}
                onMouseLeave={e => Object.assign(e.currentTarget.style, {background:'#f8fafc', borderColor:'#e2e8f0', color:'#64748b'})}
              >
                <ChevronLeft size={15} /> {t('back')}
              </button>
            )}
          </div>

          {/* Center */}
          <div style={{flex: 1, display:'flex', justifyContent:'center', alignItems:'center'}}>
            {getTitle() && (
              <div style={{
                display:'flex', alignItems:'center', gap:'8px',
                padding:'7px 20px',
                background:'linear-gradient(135deg,#ecfdf5,#f0fdf4)',
                borderRadius:'100px', border:'1px solid #a7f3d0',
                boxShadow:'0 1px 3px rgba(16,185,129,0.1)'
              }}>
                <span style={{fontFamily:'var(--font-display)', fontWeight:700, fontSize:'14px', color:'#065f46', letterSpacing:'-0.01em'}}>
                  {getTitle()}
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div style={{width:'auto', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'8px'}}>
            {/* Profile Trigger */}
            <button
              onClick={() => {
                setDevError('');
                setDevPassword('');
                setIsDevUnlocked(false);
                setShowDevModal(true);
              }}
              style={{
                display:'flex', alignItems:'center', gap:'6px',
                padding:'7px 12px', background:'#f8fafc',
                border:'1.5px solid #e2e8f0', borderRadius:'10px',
                color:'#1e293b', fontFamily:'var(--font-sans)',
                fontWeight:700, fontSize:'12px', cursor:'pointer',
                transition:'all 0.2s', flexShrink:0
              }}
              onMouseEnter={e => Object.assign(e.currentTarget.style, {background:'#f1f5f9', borderColor:'#cbd5e1'})}
              onMouseLeave={e => Object.assign(e.currentTarget.style, {background:'#f8fafc', borderColor:'#e2e8f0'})}
            >
              <span style={{ fontSize: '14px' }}>👤</span>
              <span>Developer</span>
            </button>

            {/* Language picker */}
            <div style={{
              display:'flex', alignItems:'center', gap:'5px',
              padding:'7px 11px', background:'#f8fafc',
              border:'1.5px solid #e2e8f0', borderRadius:'10px'
            }}>
              <Globe size={13} style={{color:'#10b981', flexShrink:0}} />
              <select
                value={lang}
                onChange={handleLangChange}
                style={{
                  background:'transparent', outline:'none', border:'none',
                  cursor:'pointer', color:'#475569', fontWeight:600,
                  fontFamily:'var(--font-sans)', fontSize:'12px',
                  padding:0, width:'auto'
                }}
              >
                <option value="en">EN</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                display:'flex', alignItems:'center', gap:'5px',
                padding:'7px 13px', background:'#fff1f2',
                border:'1.5px solid #fecdd3', borderRadius:'10px',
                color:'#f43f5e', fontFamily:'var(--font-sans)',
                fontWeight:700, fontSize:'12px', cursor:'pointer',
                letterSpacing:'0.04em', textTransform:'uppercase',
                transition:'all 0.2s'
              }}
              onMouseEnter={e => Object.assign(e.currentTarget.style, {background:'#f43f5e', color:'white', borderColor:'#f43f5e', transform:'translateY(-1px)', boxShadow:'0 4px 12px rgba(244,63,94,0.3)'})}
              onMouseLeave={e => Object.assign(e.currentTarget.style, {background:'#fff1f2', color:'#f43f5e', borderColor:'#fecdd3', transform:'none', boxShadow:'none'})}
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </header>

        <main style={{flex:1, padding:'28px', position:'relative', zIndex:10, overflowX:'hidden'}}>
          <div style={{maxWidth:'1700px', margin:'0 auto', width:'100%'}}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Developer Restricted Modal */}
      {showDevModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.3)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 99999, padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '24px', width: '100%',
            maxWidth: '380px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            border: '4px solid #f1f5f9', fontFamily: 'var(--font-sans)', textAlign: 'center'
          }}>
            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button 
                onClick={() => {
                  setShowDevModal(false);
                  setIsDevUnlocked(false);
                }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {!isDevUnlocked ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (devPassword === 'Green123') {
                  setIsDevUnlocked(true);
                  setDevError('');
                } else {
                  setDevError(lang === 'ta' ? 'தவறான கடவுச்சொல்!' : 'Incorrect password!');
                }
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔑</div>
                <h3 style={{ margin: '0 0 6px', fontWeight: 900, color: '#1e293b', fontSize: '18px' }}>
                  {lang === 'ta' ? 'டெவலப்பர் அங்கீகாரம்' : 'Developer Access'}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'ta' ? 'அமைப்புகளை அணுக கடவுச்சொல்லை உள்ளிடவும்' : 'Enter password to access settings'}
                </p>

                {devError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, marginBottom: '14px' }}>
                    {devError}
                  </div>
                )}

                <input
                  type="password"
                  required
                  placeholder={lang === 'ta' ? 'கடவுச்சொல்' : 'Password'}
                  value={devPassword}
                  onChange={e => setDevPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    border: '2px solid #f1f5f9', outline: 'none', fontSize: '14px',
                    fontWeight: 600, color: '#1e293b', boxSizing: 'border-box', marginBottom: '16px'
                  }}
                />

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    background: '#4f46e5', color: '#fff', fontWeight: 800, fontSize: '13px',
                    border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,70,229,0.2)'
                  }}
                >
                  {lang === 'ta' ? 'அங்கீகரி' : 'Authenticate'}
                </button>
              </form>
            ) : (
              <div>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛠️</div>
                <h3 style={{ margin: '0 0 4px', fontWeight: 900, color: '#1e293b', fontSize: '18px' }}>
                  {lang === 'ta' ? 'டெவலப்பர் அமைப்புகள்' : 'Developer Console'}
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: '11px', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'ta' ? '✓ அணுகல் அனுமதிக்கப்பட்டது' : '✓ Access Granted'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Settings */}
                  <button
                    onClick={() => {
                      setShowDevModal(false);
                      setIsDevUnlocked(false);
                      navigate('/app/settings');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
                      background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px',
                      cursor: 'pointer', color: '#1e293b', fontWeight: 800, fontSize: '13px',
                      transition: 'all 0.2s', width: '100%', boxSizing: 'border-box'
                    }}
                    onMouseEnter={e => Object.assign(e.currentTarget.style, { background: '#eef2ff', borderColor: '#818cf8' })}
                    onMouseLeave={e => Object.assign(e.currentTarget.style, { background: '#f8fafc', borderColor: '#e2e8f0' })}
                  >
                    <span style={{ fontSize: '16px' }}>⚙️</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{lang === 'ta' ? 'அமைப்புகள்' : 'Settings'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Toast Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '350px',
        width: '100%',
        pointerEvents: 'none'
      }}>
        {toasts.map(t => {
          let bg, border, text, icon;
          if (t.type === 'success') {
            bg = 'rgba(236, 253, 245, 0.98)';
            border = '#10b981';
            text = '#065f46';
            icon = '✅';
          } else if (t.type === 'error') {
            bg = 'rgba(254, 242, 242, 0.98)';
            border = '#ef4444';
            text = '#991b1b';
            icon = '❌';
          } else if (t.type === 'warning') {
            bg = 'rgba(255, 251, 235, 0.98)';
            border = '#f59e0b';
            text = '#92400e';
            icon = '⚠️';
          } else {
            bg = 'rgba(240, 249, 255, 0.98)';
            border = '#0ea5e9';
            text = '#075985';
            icon = 'ℹ️';
          }
          
          return (
            <div
              key={t.id}
              style={{
                background: bg,
                borderLeft: `5px solid ${border}`,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                padding: '14px 18px',
                color: text,
                fontFamily: 'var(--font-sans)',
                fontWeight: 750,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                pointerEvents: 'auto',
                animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
              <span style={{ flex: 1, lineHeight: '1.4' }}>{t.message}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                style={{ background: 'none', border: 'none', color: text, cursor: 'pointer', opacity: 0.6, fontSize: '16px', padding: '0 4px' }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </LangContext.Provider>
  );
};

export default Layout;
