import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LangContext } from '../components/Layout';
import { Settings } from 'lucide-react';
import BusinessSettings from './BusinessSettings';

const Dashboard = () => {
    const navigate = useNavigate();
    const { lang } = useContext(LangContext);
    const [showBizModal, setShowBizModal] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] w-full px-4 py-8 animate-in fade-in zoom-in duration-500 relative">
            
            {/* Small business settings/info icon in top right corner */}
            <button
                onClick={() => setShowBizModal(true)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    zIndex: 10
                }}
                onMouseEnter={e => Object.assign(e.currentTarget.style, { background: '#f1f5f9', color: '#10b981', borderColor: '#a7f3d0' })}
                onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'rgba(255, 255, 255, 0.8)', color: '#64748b', borderColor: '#e2e8f0' })}
                title="Business Settings"
            >
                <Settings size={20} />
            </button>

            {/* Main Selection Containers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl">
                {/* Box 1: Sales */}
                <button
                    onClick={() => navigate('/app/sales-menu')}
                    className="group relative overflow-hidden bg-white/80 backdrop-blur-md border-4 border-orange-100 hover:border-orange-400 p-6 rounded-[40px] shadow-2xl hover:shadow-orange-100 transition-all transform hover:-translate-y-2 active:scale-95 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[260px]"
                >
                    <div className="text-center w-full px-2">
                        <span className="text-3xl font-black text-orange-800 tracking-tight italic block mb-3 font-display break-words">
                            {lang === 'ta' ? 'விற்பனை' : 'Sales'}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans block leading-normal break-words">
                            {lang === 'ta' ? 'வாடிக்கையாளர் மற்றும் விற்பனை பதிவு' : 'Customer Registry and Sales'}
                        </span>
                    </div>
                </button>

                {/* Box 2: Vendor */}
                <button
                    onClick={() => navigate('/app/vendor-menu')}
                    className="group relative overflow-hidden bg-white/80 backdrop-blur-md border-4 border-emerald-100 hover:border-emerald-400 p-6 rounded-[40px] shadow-2xl hover:shadow-emerald-100 transition-all transform hover:-translate-y-2 active:scale-95 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[260px]"
                >
                    <div className="text-center w-full px-2">
                        <span className={`font-black text-emerald-800 tracking-tight italic block mb-3 font-display whitespace-nowrap ${lang === 'ta' ? 'text-2xl' : 'text-3xl'}`}>
                            {lang === 'ta' ? 'விற்பனையாளர்' : 'Vendor'}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans block leading-normal break-words">
                            {lang === 'ta' ? 'கொள்முதல் மற்றும் கொடுப்பனவுகள்' : 'Purchases and Payments'}
                        </span>
                    </div>
                </button>

                {/* Box 3: Salesman */}
                <button
                    onClick={() => navigate('/app/salesman-menu')}
                    className="group relative overflow-hidden bg-white/80 backdrop-blur-md border-4 border-indigo-100 hover:border-indigo-400 p-6 rounded-[40px] shadow-2xl hover:shadow-indigo-100 transition-all transform hover:-translate-y-2 active:scale-95 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[260px]"
                >
                    <div className="text-center w-full px-2">
                        <span className="text-2xl font-black text-indigo-800 tracking-tight italic block mb-3 font-display break-words">
                            {lang === 'ta' ? 'விற்பனையாளர் பிரிவு' : 'Salesman'}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans block leading-normal break-words">
                            {lang === 'ta' ? 'பேரேடு மற்றும் வரலாற்று தரவு' : 'Ledger and Historical Data'}
                        </span>
                    </div>
                </button>

                {/* Box 4: Flower Wise Report */}
                <button
                    onClick={() => navigate('/app/flower-wise-report')}
                    className="group relative overflow-hidden bg-white/80 backdrop-blur-md border-4 border-pink-100 hover:border-pink-400 p-6 rounded-[40px] shadow-2xl hover:shadow-pink-100 transition-all transform hover:-translate-y-2 active:scale-95 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[260px]"
                >
                    <div className="text-center w-full px-2">
                        <span className="text-3xl font-black text-pink-800 tracking-tight italic block mb-3 font-display break-words">
                            {lang === 'ta' ? 'பூ அறிக்கை' : 'Flower Report'}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans block leading-normal break-words">
                            {lang === 'ta' ? 'பூக்கள் வாரியான பற்று மற்றும் வரவு' : 'Flower Wise Credit & Debit'}
                        </span>
                    </div>
                </button>
            </div>

            {/* Business Info Modal */}
            {showBizModal && (
                <BusinessSettings isModal={true} onClose={() => setShowBizModal(false)} />
            )}
        </div>
    );
};

export default Dashboard;
