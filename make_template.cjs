// Generates farmer_import_template.xlsx using the local xlsx.min.js
// Run: node make_template.js

// The browser-bundle of SheetJS uses a UMD pattern; load it via eval trick
const fs = require('fs');
const src = fs.readFileSync('./xlsx.min.js', 'utf8');

// Evaluate in a context that provides a fake 'window' and 'self' for UMD
const vm = require('vm');
const ctx = { window: {}, self: {}, exports: {}, module: { exports: {} }, require };
vm.createContext(ctx);
vm.runInContext(src, ctx);

// Try to find XLSX in the context
const XLSX = ctx.XLSX || ctx.window.XLSX || ctx.module.exports || ctx.exports;

if (!XLSX || !XLSX.utils) {
  console.error('Could not load XLSX library');
  process.exit(1);
}

const headers = [
  'Farmer ID',
  'Farmer Name',
  'Contact Number',
  'Location',
  'Initial Dues',
  'Commission Percentage'
];

const samples = [
  ['F001', 'Ramu Kumar',   '9876543210', 'Chennai',     500,  5  ],
  ['F002', 'Selvi Devi',   '9123456789', 'Coimbatore',  0,    3.5],
  ['F003', 'Murugan',      '8765432109', 'Madurai',     1200, 4  ],
  ['F004', 'Lakshmi Bai',  '7654321098', 'Salem',       300,  5  ],
  ['F005', 'Kannan',       '6543210987', 'Tirunelveli', 0,    2.5],
];

const ws = XLSX.utils.aoa_to_sheet([headers, ...samples]);
ws['!cols'] = [12, 22, 18, 16, 14, 24].map(w => ({ wch: w }));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Farmers');
XLSX.writeFile(wb, 'farmer_import_template.xlsx');

console.log('✅ farmer_import_template.xlsx created successfully with', samples.length, 'sample rows');
