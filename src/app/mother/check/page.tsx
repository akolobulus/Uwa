'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Symptom {
  id: string;
  name: string;
  icon: string;
}

const symptoms: Symptom[] = [
  { id: 'headache', name: 'Severe headache', icon: 'neurology' },
  { id: 'vision', name: 'Blurred vision', icon: 'visibility_off' },
  { id: 'swelling', name: 'Swelling in face/feet', icon: 'foot_bones' },
  { id: 'movement', name: 'Baby moving less', icon: 'child_care' },
  { id: 'fever', name: 'Fever/Chills', icon: 'thermostat' },
  { id: 'bleeding', name: 'Heavy bleeding', icon: 'blood_pressure' },
  { id: 'pain', name: 'Sharp abdominal pain', icon: 'personal_injury' },
  { id: 'breathing', name: 'Difficulty breathing', icon: 'air' },
];

export default function MotherCheck() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());

  const toggleSymptom = (symptomId: string) => {
    const newSelected = new Set(selectedSymptoms);
    if (newSelected.has(symptomId)) {
      newSelected.delete(symptomId);
    } else {
      newSelected.add(symptomId);
    }
    setSelectedSymptoms(newSelected);
  };

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-primary/5 flex justify-between items-center px-6 py-4">
        <h1 className="font-brand text-3xl text-primary">Nurture</h1>
        <div className="flex items-center gap-3">
          <button className="bg-surface-variant/50 px-3 py-1.5 rounded-full text-[11px] font-bold text-primary/70 tracking-wider font-sans">
            EN/YO/HA/IG
          </button>
          <button className="bg-[#D32F2F] text-white px-5 py-2 rounded-full font-sans font-bold text-sm shadow-lg shadow-red-900/10 active:scale-95 transition-transform">
            SOS
          </button>
        </div>
      </header>

      <main className="relative z-10 pt-24 pb-32 px-6 md:px-32 max-w-5xl mx-auto">
        {/* Streak Tracker */}
        <section className="mb-10">
          <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 text-primary p-6 rounded-[40px_12px_40px_12px] flex items-center justify-between shadow-sm border border-primary/10">
            <div>
              <h2 className="font-brand text-2xl">7 Day Streak!</h2>
              <p className="text-sm font-medium text-primary/70">You're doing great, keep tracking daily.</p>
            </div>
            <div className="bg-white/40 p-3 rounded-full">
              <span className="material-symbols-outlined text-4xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
            </div>
          </div>
        </section>

        {/* Instructional Text */}
        <section className="mb-6 px-2">
          <h3 className="text-3xl font-brand text-primary mb-2">Check for Warning Signs</h3>
          <p className="text-sm font-medium text-on-surface/60">Tap all that you feel right now. We are here to help.</p>
        </section>

        {/* Symptom Checklist Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {symptoms.map((symptom) => (
            <button
              key={symptom.id}
              onClick={() => toggleSymptom(symptom.id)}
              className={`flex flex-col items-start p-5 rounded-[24px_8px_24px_8px] transition-all duration-200 border ${
                selectedSymptoms.has(symptom.id)
                  ? 'border-primary bg-primary-fixed transform scale-102 shadow-lg'
                  : 'border-primary/10 bg-white hover:border-secondary hover:shadow-lg'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                  selectedSymptoms.has(symptom.id)
                    ? 'bg-primary text-white'
                    : 'bg-primary-fixed text-primary'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: selectedSymptoms.has(symptom.id) ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {symptom.icon}
                </span>
              </div>
              <span className="text-sm font-bold text-primary text-left leading-tight">{symptom.name}</span>
            </button>
          ))}
        </div>

        {/* CTA Area */}
        <div className="flex flex-col items-center mb-16">
          <button className="w-full max-w-sm h-14 bg-secondary text-white rounded-2xl font-sans font-bold text-sm uppercase tracking-widest shadow-xl shadow-secondary/20 hover:opacity-90 transition-all active:scale-95 duration-150">
            Check My Symptoms
          </button>
          <p className="mt-4 text-xs font-medium text-primary/40 text-center">Your data is stored securely and privately.</p>
        </div>

        {/* Supportive Visual Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative overflow-hidden rounded-[40px_12px_40px_12px] h-48 bg-tertiary-container text-primary p-6 flex flex-col justify-end shadow-md">
            <div className="absolute inset-0 opacity-20">
              <img
                className="w-full h-full object-cover"
                alt="A soft, high-key photograph of a mother and infant sharing a moment of calm connection in a sunlit nursery."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDy6mYQvxiJIvuJp-0G7kZ3EwZR1_LFvrRuhqyNnszVap0m5LpOILEiB4E2rl9ZG53UK5HmMOF--A4hGJfHSqu4_sRPh7-y2GE_dCwgu043Zruen-Pw-TaLf1kMAFK6gU5iOmPI3Eka4s2tPILIlC2-KJ64Vl5Hngx-bZKv5NI2JaxFoX_nwrQ06wV4OiXSAeIBoKMz3Pt97TifIOPjQnrB7igtcow6gFsFa_hi0o_EyD2AgpGkPLFHckeuH7QQzjzy8Q1xzfRR1CzJ"
              />
            </div>
            <div className="relative z-10">
              <h4 className="font-brand text-2xl leading-tight">Emergency Care Tips</h4>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Keep your clinic number nearby.</p>
            </div>
          </div>
          <div className="bg-white rounded-[40px_12px_40px_12px] p-6 flex flex-col justify-center border border-primary/10 shadow-sm">
            <span className="material-symbols-outlined text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
              health_and_safety
            </span>
            <h4 className="font-brand text-xl text-primary mb-2">Clinical Reliability</h4>
            <p className="text-sm font-medium text-on-surface/60 leading-relaxed">
              These checks are based on standard maternal healthcare protocols to ensure the safety of you and your baby.
            </p>
          </div>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-white/90 backdrop-blur-xl border-t border-primary/5">
        <Link href="/mother" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">home</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </Link>
        <Link href="/mother/learn" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">menu_book</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Learn</span>
        </Link>
        <Link href="/mother/check" className="flex flex-col items-center justify-center gap-1 text-primary group">
          <div className="bg-primary px-5 py-2 rounded-2xl shadow-lg shadow-primary/20 transition-all group-active:scale-90">
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              health_and_safety
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest mt-1">Check</span>
        </Link>
        <Link href="/mother/baby" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">child_care</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Baby</span>
        </Link>
        <Link href="/mother/profile" className="flex flex-col items-center justify-center gap-1 text-primary/30 hover:text-primary transition-all group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110">person</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
        </Link>
      </nav>
    </>
  );
}
