import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Calendar, Layers, ShoppingCart, Tag, FileText, Download } from 'lucide-react';
import { subscribeToCollection } from '../utils/storage';
import { LangContext } from '../components/Layout';
import { useTenant } from '../utils/TenantContext';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const toDateStr = (d) => {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};

const FlowerWiseReport = () => {
    const { lang } = useContext(LangContext);
    const { tenantData } = useTenant();
    const [fromDate, setFromDate] = useState(toDateStr(new Date()));
    const [toDate, setToDate] = useState(toDateStr(new Date()));
    const [selectedFlower, setSelectedFlower] = useState('all');

    const [products, setProducts] = useState([]);
    const [intakes, setIntakes] = useState([]);
    const [outsidePurchases, setOutsidePurchases] = useState([]);
    const [sales, setSales] = useState([]);
    
    const [farmers, setFarmers] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [buyers, setBuyers] = useState([]);

    useEffect(() => {
        const u1 = subscribeToCollection('products', setProducts, true);
        const u2 = subscribeToCollection('intakes', setIntakes, true);
        const u3 = subscribeToCollection('outside_purchases', setOutsidePurchases, true);
        const u4 = subscribeToCollection('sales', setSales, true);
        const u5 = subscribeToCollection('farmers', setFarmers, true);
        const u6 = subscribeToCollection('vendors', setVendors, true);
        const u7 = subscribeToCollection('buyers', setBuyers, true);

        return () => {
            u1();
            u2();
            u3();
            u4();
            u5();
            u6();
            u7();
        };
    }, []);

    // Helper to match selected flower across English, Tamil, and Case differences
    const matchesFlower = useMemo(() => {
        if (selectedFlower === 'all' || selectedFlower === '') {
            return () => true;
        }
        const activeProd = products.find(p => p.name === selectedFlower);
        const nameEn = activeProd ? activeProd.name : selectedFlower;
        const nameTa = activeProd ? activeProd.taName : '';

        return (type) => {
            if (!type) return false;
            const t = type.trim().toLowerCase();
            const matchEn = nameEn && nameEn.trim().toLowerCase() === t;
            const matchTa = nameTa && nameTa.trim().toLowerCase() === t;
            return matchEn || matchTa;
        };
    }, [products, selectedFlower]);

    // Compute Purchase list (Farmers + Vendors) for selected date range and flower
    const purchaseData = useMemo(() => {
        const list = [];
        
        // 1. Farmer intakes
        intakes.forEach(intake => {
            const dateStr = (intake.date || '').substring(0, 10);
            if (dateStr >= fromDate && dateStr <= toDate) {
                (intake.items || []).forEach(item => {
                    if (matchesFlower(item.flowerType)) {
                        const farmer = farmers.find(f => f.id === intake.farmerId);
                        const name = farmer ? (lang === 'ta' ? (farmer.nameTa || farmer.name) : farmer.name) : (intake.farmerName || 'Farmer');
                        list.push({
                            name,
                            source: lang === 'ta' ? 'விவசாயி' : 'Farmer',
                            quantity: parseFloat(item.quantity || 0),
                            total: parseFloat(item.total || 0)
                        });
                    }
                });
            }
        });

        // 2. Outside shop purchases
        outsidePurchases.forEach(p => {
            const dateStr = (p.date || '').substring(0, 10);
            if (dateStr >= fromDate && dateStr <= toDate) {
                (p.items || []).forEach(item => {
                    if (matchesFlower(item.flowerType)) {
                        const vendor = vendors.find(v => v.id === p.vendorId);
                        const name = vendor ? (lang === 'ta' ? (vendor.nameTa || vendor.name) : vendor.name) : 'Vendor';
                        list.push({
                            name,
                            source: lang === 'ta' ? 'விற்பனையாளர்' : 'Vendor',
                            quantity: parseFloat(item.quantity || 0),
                            total: parseFloat(item.total || 0)
                        });
                    }
                });
            }
        });

        const totalKg = list.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = list.reduce((sum, item) => sum + item.total, 0);

        return { list, totalKg, totalAmount };
    }, [intakes, outsidePurchases, farmers, vendors, fromDate, toDate, matchesFlower, lang]);

    // Compute Sales list (Customers) for selected date range and flower
    const salesData = useMemo(() => {
        const list = [];

        sales.forEach(s => {
            const dateStr = (s.date || '').substring(0, 10);
            if (dateStr >= fromDate && dateStr <= toDate) {
                (s.items || []).forEach(item => {
                    if (matchesFlower(item.flowerType)) {
                        const buyer = buyers.find(b => b.id === s.buyerId);
                        const name = buyer ? (lang === 'ta' ? (buyer.nameTa || buyer.name) : buyer.name) : (s.buyerName || 'Customer');
                        list.push({
                            name,
                            quantity: parseFloat(item.quantity || 0),
                            total: parseFloat(item.total || item.totalPrice || 0)
                        });
                    }
                });
            }
        });

        const totalKg = list.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = list.reduce((sum, item) => sum + item.total, 0);

        return { list, totalKg, totalAmount };
    }, [sales, buyers, fromDate, toDate, matchesFlower, lang]);

    const handleDownloadPDF = () => {
        try {
            const doc = new jsPDF();
            const biz = tenantData || { name: 'S.V.M', motto: 'SRI RAMA JAYAM', type: 'Sri Valli Flower Merchant', address: 'B-7, Flower Market, Tindivanam.', phone1: '', phone2: '' };
            
            // Header
            doc.setFontSize(10);
            doc.text(biz.motto || '', 105, 10, { align: 'center' });
            doc.setFontSize(18);
            doc.text(biz.name || 'S.V.M', 105, 18, { align: 'center' });
            doc.setFontSize(11);
            doc.text(biz.type || '', 105, 24, { align: 'center' });
            doc.setFontSize(9);
            doc.text(biz.address || '', 105, 29, { align: 'center' });
            const cellInfo = (biz.phone1 ? `CELL: ${biz.phone1}` : '') + (biz.phone2 ? ` | CELL: ${biz.phone2}` : '');
            doc.text(cellInfo, 105, 34, { align: 'center' });
            
            doc.setFontSize(14);
            doc.text(lang === 'ta' ? 'பூக்கள் வாரியான அறிக்கை' : 'Flower Wise Report', 105, 44, { align: 'center' });
            doc.setFontSize(11);
            doc.text(`${lang === 'ta' ? 'பூ பெயர்' : 'Flower Name'}: ${selectedFlower === 'all' ? (lang === 'ta' ? 'அனைத்தும்' : 'All') : selectedFlower}`, 105, 50, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`${fromDate.split('-').reverse().join('/')} - ${toDate.split('-').reverse().join('/')}`, 105, 55, { align: 'center' });
            
            let y = 65;

            // 1. Purchases Table
            doc.setFontSize(12);
            doc.text(lang === 'ta' ? 'பற்று (Dr) / கொள்முதல்' : 'Debit (Dr) / Purchase', 14, y);
            y += 4;

            doc.setFillColor(240, 240, 240);
            doc.rect(14, y, 182, 8, 'F');
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(lang === 'ta' ? 'வ.எண்' : 'S.No', 16, y + 5.5);
            doc.text(lang === 'ta' ? 'விற்பனையாளர்/விவசாயி' : 'Vendor/Farmer', 46, y + 5.5);
            doc.text(lang === 'ta' ? 'வகை' : 'Source', 96, y + 5.5);
            doc.text('KG', 136, y + 5.5, { align: 'right' });
            doc.text(lang === 'ta' ? 'பற்று (Dr)' : 'Debit (Dr)', 182, y + 5.5, { align: 'right' });

            y += 8;
            doc.setFont('Helvetica', 'normal');

            purchaseData.list.forEach((item, idx) => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.line(14, y, 196, y);
                doc.text(String(idx + 1), 16, y + 5.5);
                doc.text(item.name || '', 46, y + 5.5);
                doc.text(item.source || '', 96, y + 5.5);
                doc.text((item.quantity || 0).toFixed(2), 136, y + 5.5, { align: 'right' });
                doc.text(fmt(item.total), 182, y + 5.5, { align: 'right' });
                y += 8;
            });

            // Total Row
            doc.line(14, y, 196, y);
            doc.setFont('Helvetica', 'bold');
            doc.text(lang === 'ta' ? 'மொத்தம்' : 'Total', 46, y + 5.5);
            doc.text((purchaseData.totalKg || 0).toFixed(2), 136, y + 5.5, { align: 'right' });
            doc.text(fmt(purchaseData.totalAmount), 182, y + 5.5, { align: 'right' });
            doc.line(14, y + 8, 196, y + 8);
            y += 18;

            if (y > 240) { doc.addPage(); y = 20; }

            // 2. Sales Table
            doc.setFontSize(12);
            doc.text(lang === 'ta' ? 'வரவு (Cr) / விற்பனை' : 'Credit (Cr) / Sales', 14, y);
            y += 4;

            doc.setFillColor(240, 240, 240);
            doc.rect(14, y, 182, 8, 'F');
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(lang === 'ta' ? 'வ.எண்' : 'S.No', 16, y + 5.5);
            doc.text(lang === 'ta' ? 'வாடிக்கையாளர்' : 'Customer Name', 46, y + 5.5);
            doc.text('KG', 136, y + 5.5, { align: 'right' });
            doc.text(lang === 'ta' ? 'வரவு (Cr)' : 'Credit (Cr)', 182, y + 5.5, { align: 'right' });

            y += 8;
            doc.setFont('Helvetica', 'normal');

            salesData.list.forEach((item, idx) => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.line(14, y, 196, y);
                doc.text(String(idx + 1), 16, y + 5.5);
                doc.text(item.name || '', 46, y + 5.5);
                doc.text((item.quantity || 0).toFixed(2), 136, y + 5.5, { align: 'right' });
                doc.text(fmt(item.total), 182, y + 5.5, { align: 'right' });
                y += 8;
            });

            // Total Row
            doc.line(14, y, 196, y);
            doc.setFont('Helvetica', 'bold');
            doc.text(lang === 'ta' ? 'மொத்தம்' : 'Total', 46, y + 5.5);
            doc.text((salesData.totalKg || 0).toFixed(2), 136, y + 5.5, { align: 'right' });
            doc.text(fmt(salesData.totalAmount), 182, y + 5.5, { align: 'right' });
            doc.line(14, y + 8, 196, y + 8);

            doc.save(`FlowerReport_${selectedFlower}_${Date.now()}.pdf`);
        } catch (e) {
            alert('PDF Generation failed: ' + e.message);
        }
    };

    const handleDownloadExcel = () => {
        try {
            const wb = XLSX.utils.book_new();

            // 1. Purchase Sheet
            const purchaseRows = purchaseData.list.map((item, idx) => ({
                'S.No': idx + 1,
                'Vendor/Farmer Name': item.name,
                'Source (Farmer/Vendor)': item.source,
                'Quantity (KG)': item.quantity,
                'Purchase Amount (INR)': item.total
            }));
            // Append Total row
            purchaseRows.push({
                'S.No': 'Total',
                'Vendor/Farmer Name': '',
                'Source (Farmer/Vendor)': '',
                'Quantity (KG)': purchaseData.totalKg,
                'Purchase Amount (INR)': purchaseData.totalAmount
            });
            const wsPurchase = XLSX.utils.json_to_sheet(purchaseRows);
            XLSX.utils.book_append_sheet(wb, wsPurchase, 'Purchases (Dr)');

            // 2. Sales Sheet
            const salesRows = salesData.list.map((item, idx) => ({
                'S.No': idx + 1,
                'Customer Name': item.name,
                'Quantity (KG)': item.quantity,
                'Sales Amount (INR)': item.total
            }));
            // Append Total row
            salesRows.push({
                'S.No': 'Total',
                'Customer Name': '',
                'Quantity (KG)': salesData.totalKg,
                'Sales Amount (INR)': salesData.totalAmount
            });
            const wsSales = XLSX.utils.json_to_sheet(salesRows);
            XLSX.utils.book_append_sheet(wb, wsSales, 'Sales (Cr)');

            XLSX.writeFile(wb, `FlowerReport_${selectedFlower}_${Date.now()}.xlsx`);
        } catch (e) {
            alert('Excel Generation failed: ' + e.message);
        }
    };

    const TH_S = {
        padding: '12px 14px', textAlign: 'left',
        fontSize: '11px', fontWeight: 700, color: '#475569',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        borderBottom: '1.5px solid #e2e8f0', background: '#f8fafc'
    };

    const TD_S = {
        padding: '12px 14px', fontSize: '13px',
        color: '#334155', borderBottom: '1px solid #f1f5f9',
        fontWeight: 650
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
            
            {/* Filter Panel */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', background: '#fff', border: '1px solid #f1f5f9', padding: '20px 24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                {/* From Date Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} color="#db2777" />
                        {lang === 'ta' ? 'தொடக்க தேதி' : 'From Date'}
                    </span>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={e => setFromDate(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '12px', border: '2px solid #f1f5f9', outline: 'none', fontSize: '13px', fontWeight: 700, color: '#334155' }}
                    />
                </div>

                {/* To Date Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} color="#db2777" />
                        {lang === 'ta' ? 'முடிவு தேதி' : 'To Date'}
                    </span>
                    <input
                        type="date"
                        value={toDate}
                        onChange={e => setToDate(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '12px', border: '2px solid #f1f5f9', outline: 'none', fontSize: '13px', fontWeight: 700, color: '#334155' }}
                    />
                </div>

                {/* Flower Dropdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={12} color="#db2777" />
                        {lang === 'ta' ? 'பூ பெயர்' : 'Flower Name'}
                    </span>
                    <select
                        value={selectedFlower}
                        onChange={e => setSelectedFlower(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '12px', border: '2px solid #f1f5f9', outline: 'none', fontSize: '13px', fontWeight: 700, color: '#334155', background: '#fff' }}
                    >
                        <option value="all">
                            {lang === 'ta' ? 'அனைத்தும்' : 'All'}
                        </option>
                        {products.map(p => (
                            <option key={p.name} value={p.name}>
                                {lang === 'ta' ? (p.taName || p.name) : p.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Download Actions */}
                <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto', alignSelf: 'flex-end', height: '42px' }}>
                    <button
                        onClick={handleDownloadPDF}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 18px', borderRadius: '12px', border: '1.5px solid #fecdd3',
                            background: '#fff5f5', color: '#e11d48', fontSize: '13px', fontWeight: 800,
                            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}
                    >
                        <FileText size={15} color="#e11d48" />
                        {lang === 'ta' ? 'PDF' : 'Download PDF'}
                    </button>
                    <button
                        onClick={handleDownloadExcel}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 18px', borderRadius: '12px', border: '1.5px solid #a7f3d0',
                            background: '#f0fdf4', color: '#059669', fontSize: '13px', fontWeight: 800,
                            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#d1fae5'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
                    >
                        <Download size={15} color="#059669" />
                        {lang === 'ta' ? 'Excel' : 'Download Excel'}
                    </button>
                </div>
            </div>

            {/* Side-by-side Summary Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', width: '100%' }}>
                
                {/* Left Panel: Purchase Summary (Debit / Dr) */}
                <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '2px solid #f8fafc', paddingBottom: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📥</div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#1e293b' }}>
                                {lang === 'ta' ? 'பற்று (Dr) / கொள்முதல்' : 'Debit (Dr) / Purchase'}
                            </h3>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                                {lang === 'ta' ? 'விவசாயி & விற்பனையாளர்கள்' : 'Farmers & Vendors'}
                            </p>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...TH_S, width: '50px' }}>S.No</th>
                                    <th style={TH_S}>{lang === 'ta' ? 'வழங்குநர்' : 'Vendor/Farmer'}</th>
                                    <th style={{ ...TH_S, textAlign: 'right' }}>KG</th>
                                    <th style={{ ...TH_S, textAlign: 'right' }}>{lang === 'ta' ? 'பற்று (Dr)' : 'Debit (Dr)'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseData.list.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '36px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                            {lang === 'ta' ? 'பரிவர்த்தனைகள் எதுவும் இல்லை' : 'No records found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    purchaseData.list.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={TD_S}>{idx + 1}</td>
                                            <td style={TD_S}>
                                                <div>{item.name}</div>
                                                <span style={{ fontSize: '9px', background: '#f1f5f9', color: '#64748b', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                                                    {item.source}
                                                </span>
                                            </td>
                                            <td style={{ ...TD_S, textAlign: 'right', color: '#0f172a' }}>{item.quantity.toFixed(2)}</td>
                                            <td style={{ ...TD_S, textAlign: 'right', color: '#ef4444' }}>{fmt(item.total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {purchaseData.list.length > 0 && (
                                <tfoot>
                                    <tr style={{ background: '#f8fafc', fontWeight: 850 }}>
                                        <td colSpan={2} style={{ ...TD_S, color: '#1e293b', borderTop: '2px solid #e2e8f0' }}>{lang === 'ta' ? 'மொத்தம்' : 'Total'}</td>
                                        <td style={{ ...TD_S, textAlign: 'right', color: '#0f172a', borderTop: '2px solid #e2e8f0' }}>{purchaseData.totalKg.toFixed(2)}</td>
                                        <td style={{ ...TD_S, textAlign: 'right', color: '#ef4444', borderTop: '2px solid #e2e8f0' }}>{fmt(purchaseData.totalAmount)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* Right Panel: Sales Summary (Credit / Cr) */}
                <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '2px solid #f8fafc', paddingBottom: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📤</div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#1e293b' }}>
                                {lang === 'ta' ? 'வரவு (Cr) / விற்பனை' : 'Credit (Cr) / Sales'}
                            </h3>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                                {lang === 'ta' ? 'வாடிக்கையாளர்கள்' : 'Customers'}
                            </p>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...TH_S, width: '50px' }}>S.No</th>
                                    <th style={TH_S}>{lang === 'ta' ? 'வாடிக்கையாளர்' : 'Customer'}</th>
                                    <th style={{ ...TH_S, textAlign: 'right' }}>KG</th>
                                    <th style={{ ...TH_S, textAlign: 'right' }}>{lang === 'ta' ? 'வரவு (Cr)' : 'Credit (Cr)'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesData.list.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '36px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                            {lang === 'ta' ? 'பரிவர்த்தனைகள் எதுவும் இல்லை' : 'No records found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    salesData.list.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={TD_S}>{idx + 1}</td>
                                            <td style={TD_S}>{item.name}</td>
                                            <td style={{ ...TD_S, textAlign: 'right', color: '#0f172a' }}>{item.quantity.toFixed(2)}</td>
                                            <td style={{ ...TD_S, textAlign: 'right', color: '#16a34a' }}>{fmt(item.total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {salesData.list.length > 0 && (
                                <tfoot>
                                    <tr style={{ background: '#f8fafc', fontWeight: 850 }}>
                                        <td colSpan={2} style={{ ...TD_S, color: '#1e293b', borderTop: '2px solid #e2e8f0' }}>{lang === 'ta' ? 'மொத்தம்' : 'Total'}</td>
                                        <td style={{ ...TD_S, textAlign: 'right', color: '#0f172a', borderTop: '2px solid #e2e8f0' }}>{salesData.totalKg.toFixed(2)}</td>
                                        <td style={{ ...TD_S, textAlign: 'right', color: '#16a34a', borderTop: '2px solid #e2e8f0' }}>{fmt(salesData.totalAmount)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

            </div>

            {/* Grand Total Summary Box */}
            <div style={{
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                border: '1.5px solid #e2e8f0',
                borderRadius: '24px',
                padding: '24px 32px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
                marginTop: '12px'
            }}>
                {/* Column 1: Purchases */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {lang === 'ta' ? 'மொத்த கொள்முதல் (பற்று)' : 'Total Purchases (Debit)'}
                    </span>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#ef4444' }}>
                        {fmt(purchaseData.totalAmount)}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                        {purchaseData.totalKg.toFixed(2)} KG
                    </span>
                </div>

                {/* Column 2: Sales */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {lang === 'ta' ? 'மொத்த விற்பனை (வரவு)' : 'Total Sales (Credit)'}
                    </span>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#16a34a' }}>
                        {fmt(salesData.totalAmount)}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                        {salesData.totalKg.toFixed(2)} KG
                    </span>
                </div>

                {/* Column 3: Net Difference */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '1.5px solid #cbd5e1', paddingLeft: '24px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {lang === 'ta' ? 'நிகர மதிப்பு (விற்பனை - கொள்முதல்)' : 'Net Balance (Sales - Purchase)'}
                    </span>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: 950,
                        color: (salesData.totalAmount - purchaseData.totalAmount) >= 0 ? '#10b981' : '#ef4444'
                    }}>
                        {(salesData.totalAmount - purchaseData.totalAmount) >= 0 ? '+' : ''}
                        {fmt(salesData.totalAmount - purchaseData.totalAmount)}
                    </div>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: (salesData.totalKg - purchaseData.totalKg) >= 0 ? '#10b981' : '#ef4444'
                    }}>
                        {(salesData.totalKg - purchaseData.totalKg) >= 0 ? '+' : ''}
                        {(salesData.totalKg - purchaseData.totalKg).toFixed(2)} KG
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FlowerWiseReport;
