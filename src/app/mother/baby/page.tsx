// ARCHIVED: Old mother baby page
// Replaced by main mother dashboard with integrated NurtureAI
// Route: /mother

/*
'use client';

import Link from 'next/link';
import { useState } from 'react';

type HospitalBagItems = {
  'baby-clothes': boolean;
  'wrap': boolean;
  'mat': boolean;
};

/* export default function MotherBaby() {
  const [kickCount, setKickCount] = useState(12);
  const [hospitalBag, setHospitalBag] = useState<HospitalBagItems>({
    'baby-clothes': false,
    'wrap': true,
    'mat': false,
  });

  const handleKickTap = () => {
    setKickCount(kickCount + 1);
  };

  const handleCheckboxChange = (key: keyof HospitalBagItems) => {
    setHospitalBag((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#FFF5F5', backgroundImage: 'radial-gradient(#FFD1D1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      {/* Top App Bar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center px-6 md:px-32 py-3 w-full border-b border-red-100">
        <div className="text-4xl font-bold text-[#B01E35]">Nurture</div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-600 hidden sm:inline">EN/YO/HA/IG</span>
          <button className="bg-[#B01E35] text-white px-4 py-2 rounded-full font-bold text-sm shadow-md active:scale-95 transition-transform">
            SOS
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-32 pt-6 space-y-6">
        {/* Trimester Summary Header */}
        <section className="flex justify-between items-center bg-red-100 p-6 rounded-[40px_12px_40px_12px] border border-red-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-red-900">Welcome to the Third Trimester</h2>
            <p className="text-lg text-red-900/80">You're doing amazing, mama.</p>
          </div>
          <span className="material-symbols-outlined text-4xl text-[#B01E35]">stroller</span>
        </section>

        {/* Weekly Milestone & Illustration */}
        <section className="bg-white rounded-[40px_12px_40px_12px] overflow-hidden shadow-sm border border-red-50">
          <div className="relative h-64 md:h-80 w-full">
            <img
              alt="Baby milestone illustration"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZfrjt_vEp5tiUevvfaMh20NPnIQ3LXS-mBlK60yLvNHdBdrVEZ9EDEpxeiEPbZoEReKR7_fA92We5yXebRzfLvuPehue7n3F7g4JoKFFQq9hpgc_rHucIYAcPFIz8jV2yYjnm2tOLt73I3vT7zapewp03e5g8tP8Sw0yPlCR2TMI0RRTN8zD36CE0TBRafKB4EawvRuBVcUEtu_gW8UPHFTys-nOOfsID_VPsRPGeEdPixxDxnsAvixhP2eo4CgdJihBbqzTg9fdV"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/30 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <span className="bg-[#B01E35] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">28 WEEKS</span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-lg text-gray-700 leading-relaxed">Your baby is 28 weeks old. They are opening their eyes for the first time!</p>
          </div>
        </section>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Days Until Due */}
          <div className="bg-white p-6 rounded-[40px_12px_40px_12px] flex flex-col justify-center items-center text-center shadow-sm border border-red-50 h-full min-h-[180px]">
            <div className="text-5xl font-bold text-[#B01E35]">84</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Days Until Due</div>
          </div>

          {/* Meet Your Baby */}
          <div className="bg-red-100 p-6 rounded-[40px_12px_40px_12px] flex flex-col justify-center items-center text-center shadow-sm border border-red-200 h-full min-h-[180px]">
            <span className="material-symbols-outlined text-5xl text-[#B01E35] mb-2">toys</span>
            <p className="text-2xl font-bold text-red-900">Meet your baby soon</p>
          </div>

          {/* Fetal Movement Tracker */}
          <section className="bg-white p-6 rounded-[40px_12px_40px_12px] shadow-sm border border-red-50 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#B01E35]">footprint</span>
                </div>
                <h3 className="text-2xl font-bold">Movement Tracker</h3>
              </div>
              <div className="flex items-center gap-1 bg-red-100/50 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[#B01E35] text-sm">favorite</span>
                <span className="font-bold text-red-900">{kickCount}</span>
              </div>
            </div>
            <button
              onClick={handleKickTap}
              className="w-full bg-[#B01E35] text-white py-8 rounded-[40px_12px_40px_12px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-md group mb-6 hover:opacity-90"
            >
              <span className="material-symbols-outlined text-4xl group-active:animate-ping">back_hand</span>
              <span className="font-bold text-sm">Tap when you feel a kick</span>
            </button>
            <div className="mt-auto pt-6 border-t border-red-50">
              <p className="text-sm font-semibold text-gray-500 mb-3">History (Last 3 Hours)</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <div className="flex-shrink-0 bg-gray-100 p-2 rounded-xl text-center min-w-[70px] border border-red-100">
                  <span className="block text-sm text-gray-600">10:45</span>
                  <span className="block text-[#B01E35] font-bold">3 kicks</span>
                </div>
                <div className="flex-shrink-0 bg-gray-100 p-2 rounded-xl text-center min-w-[70px] border border-red-100">
                  <span className="block text-sm text-gray-600">11:30</span>
                  <span className="block text-[#B01E35] font-bold">5 kicks</span>
                </div>
                <div className="flex-shrink-0 bg-gray-100 p-2 rounded-xl text-center min-w-[70px] border border-red-100">
                  <span className="block text-sm text-gray-600">12:15</span>
                  <span className="block text-[#B01E35] font-bold">4 kicks</span>
                </div>
              </div>
            </div>
          </section>

          {/* Growth Log */}
          <section className="bg-white p-6 rounded-[40px_12px_40px_12px] shadow-sm border border-red-50 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#B01E35]">baby_changing_station</span>
              </div>
              <h3 className="text-2xl font-bold">Growth Log</h3>
            </div>
            <div className="space-y-8 flex-1 flex flex-col justify-center">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#B01E35]">scale</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-gray-600">Weight</span>
                      <span className="text-[#B01E35] font-bold">1.1 kg</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#B01E35] w-3/4 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#B01E35]">straighten</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-gray-600">Fundal Height</span>
                      <span className="text-[#B01E35] font-bold">26 cm</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#B01E35] w-2/3 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center bg-gray-100 py-2 rounded-xl">
              <p className="text-gray-600 text-sm font-semibold">Growth tracking is healthy</p>
            </div>
          </section>
        </div>

        {/* Hospital Bag Checklist */}
        <section className="bg-white p-6 rounded-[40px_12px_40px_12px] shadow-sm border border-red-50 w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#B01E35]">shopping_basket</span>
            </div>
            <h3 className="text-2xl font-bold">Hospital Bag</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center gap-4 p-4 bg-gray-100 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={hospitalBag['baby-clothes']}
                  onChange={() => handleCheckboxChange('baby-clothes')}
                  className="w-6 h-6 rounded-md border-gray-400 text-[#B01E35]"
                />
                <span className="font-semibold text-gray-800">Clean clothes for baby</span>
              </label>
              <label className="flex items-center gap-4 p-4 bg-gray-100 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={hospitalBag['wrap']}
                  onChange={() => handleCheckboxChange('wrap')}
                  className="w-6 h-6 rounded-md border-gray-400 text-[#B01E35]"
                />
                <span className="font-semibold text-gray-800">Comfortable wrap for you</span>
              </label>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-4 p-4 bg-gray-100 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={hospitalBag['mat']}
                  onChange={() => handleCheckboxChange('mat')}
                  className="w-6 h-6 rounded-md border-gray-400 text-[#B01E35]"
                />
                <span className="font-semibold text-gray-800">Woven mat</span>
              </label>
              <button className="w-full py-4 border-2 border-dashed border-gray-400 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Add Item
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-safe h-24 bg-white/95 backdrop-blur-lg border-t border-red-100 shadow-[0_-4px_20px_rgba(176,30,53,0.05)]">
        <Link href="/mother" className="flex flex-col items-center justify-center text-gray-600 p-2 hover:text-[#B01E35] transition-all">
          <span className="material-symbols-outlined">home</span>
          <span className="text-sm font-bold">Home</span>
        </Link>
        <Link href="/mother/learn" className="flex flex-col items-center justify-center text-gray-600 p-2 hover:text-[#B01E35] transition-all">
          <span className="material-symbols-outlined">menu_book</span>
          <span className="text-sm font-bold">Learn</span>
        </Link>
        <Link href="/mother/check" className="flex flex-col items-center justify-center text-gray-600 p-2 hover:text-[#B01E35] transition-all">
          <span className="material-symbols-outlined">health_and_safety</span>
          <span className="text-sm font-bold">Check</span>
        </Link>
        <Link href="/mother/baby" className="flex flex-col items-center justify-center bg-red-100 text-[#B01E35] rounded-[20px] px-4 py-2 scale-105 shadow-sm transition-all">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            child_care
          </span>
          <span className="text-sm font-bold">My Baby</span>
        </Link>
        <Link href="/mother/profile" className="flex flex-col items-center justify-center text-gray-600 p-2 hover:text-[#B01E35] transition-all">
          <span className="material-symbols-outlined">person</span>
          <span className="text-sm font-bold">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
*/
