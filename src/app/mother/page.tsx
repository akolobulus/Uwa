'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NurtureAI from '@/components/NurtureAI';

const PATIENT_NAME = 'Adaeze';
const PATIENT_ID = undefined; // swap with real auth session

export default function MotherDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear any session/auth data here
    // For now, just redirect to home
    router.push('/');
  };

  return (
    <div className="bg-background font-body-md text-on-surface overflow-hidden h-screen flex flex-col">
      
      {/* ── Top Navigation ── */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-surface-dim/80 backdrop-blur-xl shadow-sm dark:shadow-none border-b border-primary-container/10">
        <div className="flex justify-between items-center w-full px-12 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/site logo.png"
              alt="Nurture Logo"
              className="w-10 h-10 rounded-full object-cover"
              style={{ borderRadius: "50%" }}
            />
            <span className="font-display text-2xl font-semibold text-secondary">Nurture AI</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-semibold text-secondary hover:text-primary transition-colors"
              aria-label="Back to home"
            >
              ← Back to Home
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-white bg-secondary hover:bg-secondary/90 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Profile */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
            <img
              alt="Patient Profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPbVtzuXM7_zBLGYnY9_4WMXoufHKKpUNV0njfwxOkNMaGSdgg1keBBpch_T4i3VSRmXufwWR-2iXOoXiBGXEfVxWUX9KyLkzYWNWQoCW1v4oztZeOLtKUnw7_Hec4x3CBIeXv5RNWlADcQ6EEachJFErROaDEXttnCe20aC64YNPZUBw0xUCLa3jPXIx2mItKTcvW_CMg97qajwE6g7qCCJH5IBbtfzwzcsAcmTIqdnnS9MMB85iniOZuy3yWjwKc5FWWVSAseMqO"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="flex flex-1 pt-24 px-12 gap-6 pb-8 overflow-hidden">
        
        {/* ── Sidebar ── */}
        <aside className="w-80 flex flex-col gap-6 overflow-y-auto pr-2">
          
          {/* Mama's Dashboard Card */}
          <div className="p-6 bg-white rounded-2xl shadow-[0_40px_40px_0_rgba(175,42,76,0.04)] border border-primary-container/20">
            <h3 className="font-headline-md text-headline-md text-secondary mb-4">Mama&apos;s Dashboard</h3>

            {/* Upcoming Appointment */}
            <div className="space-y-4">
              <p className="text-label-md font-label-md text-on-surface-variant">UPCOMING</p>
              <div className="flex items-start gap-3 p-3 hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-tertiary-container rounded-lg flex items-center justify-center text-on-tertiary-container">
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div>
                  <p className="text-body-md font-semibold">OB-GYN Checkup</p>
                  <p className="text-label-sm text-on-surface-variant">Tomorrow, 10:30 AM</p>
                </div>
              </div>
            </div>
          </div>


        </aside>

        {/* ── Main Chat Area ── */}
        <section className="flex-1 flex flex-col bg-primary-container rounded-2xl overflow-hidden relative border border-white shadow-lg">
          <NurtureAI patientId={PATIENT_ID} patientName={PATIENT_NAME} />
        </section>
      </main>


    </div>
  );
}
