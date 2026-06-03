"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Risk = {
  pph: number;
  pre: number;
  ptl: number;
  composite: number;
  flags: { pph: boolean; pre: boolean; ptl: boolean };
  priority: string;
  colour: "critical" | "high" | "moderate" | "low";
  drivers: string[];
};

type Visit = {
  id: string;
  date: string;
  week?: number;
  sbp: number;
  dbp: number;
  hr?: number;
  bs?: number;
  temp?: number;
  weight?: number;
  notes?: string;
  oedema?: string;
  protein?: string;
};

type Patient = {
  id: string;
  name: string;
  age: number;
  state?: string;
  week: number;
  ancWeek?: number;
  gravidity?: number;
  scd: string;
  hiv: string;
  malaria: string;
  iptpDoses: string;
  htn: string;
  multiple: string;
  facility: string;
  multiparity: string;
  visits: Visit[];
  createdAt: string;
};

function MaterialIcon({
  children,
  filled = false,
  className = "",
}: {
  children: string;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {children}
    </span>
  );
}

export default function ClinicianDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeView, setActiveView] = useState<"overview" | "patients" | "detail" | "education">("overview");
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [engineStatus, setEngineStatus] = useState('unknown');
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);

  // Form states for patient
  const [patientForm, setPatientForm] = useState({
    name: "",
    dateOfBirth: "",
    state: "",
    week: "",
    ancWeek: "",
    gravidity: "",
    scd: "AA",
    hiv: "Negative",
    malaria: "0",
    iptpDoses: "0",
    htn: "0",
    multiple: "0",
    facility: "1",
    multiparity: "0",
  });

  // Form states for visit
  const [visitForm, setVisitForm] = useState({
    date: new Date().toISOString().split("T")[0],
    week: "",
    sbp: "",
    dbp: "",
    hr: "",
    bs: "",
    temp: "",
    weight: "",
    notes: "",
    oedema: "none",
    protein: "none",
  });

  // Load from DB on mount + poll every 30s
  useEffect(() => {
    loadPatients();
    const interval = setInterval(loadPatients, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setPatients(data);
    } catch (e) {
      console.error('Failed to load patients:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPatient = async () => {
    if (!patientForm.name || !patientForm.dateOfBirth || !patientForm.week) {
      alert('Name, Date of Birth and Gestational Week are required.');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmittingPatient) return;
    setIsSubmittingPatient(true);

    try {
      // Calculate age from date of birth
      const birthDate = new Date(patientForm.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      const newPatient = {
        id: 'p_' + Date.now(),
        name: patientForm.name,
        age: age,
        state: patientForm.state,
        week: parseInt(patientForm.week),
        ancWeek: patientForm.ancWeek ? parseInt(patientForm.ancWeek) : undefined,
        gravidity: patientForm.gravidity ? parseInt(patientForm.gravidity) : undefined,
        scd: patientForm.scd,
        hiv: patientForm.hiv,
        malaria: patientForm.malaria,
        iptpDoses: patientForm.iptpDoses,
        htn: patientForm.htn,
        multiple: patientForm.multiple,
        facility: patientForm.facility,
        multiparity: patientForm.multiparity,
        visits: [],
        createdAt: new Date().toISOString(),
      };

      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });

      if (!res.ok) { alert('Failed to save patient.'); return; }

      await loadPatients();
      setShowAddPatientModal(false);
      setPatientForm({ name:'', dateOfBirth:'', state:'', week:'', ancWeek:'', gravidity:'',
        scd:'AA', hiv:'Negative', malaria:'0', iptpDoses:'0', htn:'0',
        multiple:'0', facility:'1', multiparity:'0' });
      setActivePatientId(newPatient.id);
      setActiveView('detail');
    } catch (err) {
      console.error('Error adding patient:', err);
      alert('An error occurred while saving the patient.');
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  const handleAddVisit = async () => {
    if (!visitForm.sbp || !visitForm.dbp || !visitForm.date) {
      alert('Date, Systolic BP and Diastolic BP are required.');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmittingVisit) return;
    setIsSubmittingVisit(true);

    try {
      const patient = patients.find((p) => p.id === activePatientId);
      if (!patient) return;

      const newVisit = {
        id: 'v_' + Date.now(),
        patientId: activePatientId,
        date: visitForm.date,
        week: visitForm.week ? parseInt(visitForm.week) : undefined,
        sbp: parseInt(visitForm.sbp),
        dbp: parseInt(visitForm.dbp),
        hr: visitForm.hr ? parseInt(visitForm.hr) : undefined,
        bs: visitForm.bs ? parseFloat(visitForm.bs) : undefined,
        temp: visitForm.temp ? parseFloat(visitForm.temp) : undefined,
        weight: visitForm.weight ? parseFloat(visitForm.weight) : undefined,
        notes: visitForm.notes,
        oedema: visitForm.oedema,
        protein: visitForm.protein,
      };

      setEngineStatus('unknown');

      const res = await fetch('/api/patients/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit: newVisit, patient }),
      });

      const result = await res.json();
      setEngineStatus(result.scored ? 'online' : 'offline');

      await loadPatients();
      setShowAddVisitModal(false);
      setVisitForm({ date: new Date().toISOString().split('T')[0], week:'', sbp:'',
        dbp:'', hr:'', bs:'', temp:'', weight:'', notes:'', oedema:'none', protein:'none' });
    } catch (err) {
      console.error('Error adding visit:', err);
      alert('An error occurred while saving the visit.');
    } finally {
      setIsSubmittingVisit(false);
    }
  };

  const scorePatient = (p: Patient, vitals?: { sbp: number; dbp: number; bs?: number; hr?: number }): Risk => {
    const sbp = vitals?.sbp ?? 110;
    const dbp = vitals?.dbp ?? 70;
    const bs = vitals?.bs ?? 6.0;
    const hr = vitals?.hr ?? 75;
    const scd = { AA: 0, AS: 1, SC: 2, SS: 3 }[p.scd] ?? 0;
    const malaria = parseInt(p.malaria) || 0;
    const hiv = { Negative: 0, Unknown: 0.2, Positive_ART: 0.5, Positive_No_ART: 1.0 }[p.hiv] || 0;
    const lateANC = ((p.ancWeek ?? 40) >= 20) ? 1 : 0;
    const htn = parseInt(p.htn) || 0;
    const multi = parseInt(p.multiple) || 0;
    const grandM = parseInt(p.multiparity) || 0;

    const riskBase = (sbp > 140 || dbp > 90) ? 0.7 : (sbp > 130 || dbp > 85) ? 0.4 : 0.1;
    const pph = (
      riskBase * 0.35 +
      (scd / 3) * 0.2 +
      (bs < 7.0 ? 1 : 0) * 0.15 +
      (malaria / 2) * 0.15 +
      grandM * 0.1 +
      multi * 0.05
    );

    const pre = (
      (sbp >= 140 ? 1 : 0) * 0.35 +
      (dbp >= 90 ? 1 : 0) * 0.25 +
      htn * 0.2 +
      lateANC * 0.1 +
      multi * 0.05 +
      ((parseInt(p.age.toString()) < 18 || parseInt(p.age.toString()) > 35) ? 1 : 0) * 0.05
    );

    const ptl = (
      riskBase * 0.3 +
      (malaria / 2) * 0.25 +
      hiv * 0.2 +
      (scd / 3) * 0.15 +
      lateANC * 0.1
    );

    const pphPct = Math.min(99, Math.round(pph * 100));
    const prePct = Math.min(99, Math.round(pre * 100));
    const ptlPct = Math.min(99, Math.round(ptl * 100));
    const composite = Math.max(pphPct, prePct, ptlPct);

    const flags = {
      pph: pphPct >= 25,
      pre: prePct >= 25,
      ptl: ptlPct >= 25,
    };

    let priority, colour: "critical" | "high" | "moderate" | "low";
    if (composite >= 70) {
      priority = "🚨 CRITICAL";
      colour = "critical";
    } else if (composite >= 50) {
      priority = "⚠️ HIGH";
      colour = "high";
    } else if (composite >= 30) {
      priority = "🟡 MODERATE";
      colour = "moderate";
    } else {
      priority = "✅ LOW";
      colour = "low";
    }

    const drivers = [];
    if (sbp >= 140 || dbp >= 90) drivers.push("Hypertensive BP");
    if (scd >= 2) drivers.push("SCD genotype");
    if (malaria >= 2) drivers.push("Malaria episodes");
    if (hiv > 0.4) drivers.push("HIV co-infection");
    if (lateANC) drivers.push("Late ANC booking");
    if (multi) drivers.push("Multiple gestation");
    if (htn) drivers.push("Prior hypertension");

    return { pph: pphPct, pre: prePct, ptl: ptlPct, composite, flags, priority, colour, drivers };
  };

  const getLatestVitals = (p: Patient) => {
    if (!p.visits || !p.visits.length) return null;
    const sorted = [...p.visits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { sbp: sorted[0].sbp, dbp: sorted[0].dbp, bs: sorted[0].bs, hr: sorted[0].hr };
  };

  const getRiskColor = (colour: string) => {
    switch (colour) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-300";
      case "high":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "moderate":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "low":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-container-low border-r border-outline-variant flex flex-col">
        <div className="p-6 border-b border-outline-variant">
          <div className="font-headline-sm text-primary mb-1">Nurture</div>
          <div className="text-xs text-on-surface-variant italic">Maternal Risk Assessment</div>
        </div>

        <nav className="flex-1 py-3 px-0">
          <div className="text-xs font-bold uppercase text-on-surface-variant px-5 py-3 tracking-widest">Clinical</div>
          <button
            onClick={() => setActiveView("overview")}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 transition-all ${
              activeView === "overview"
                ? "border-primary text-primary bg-red-50"
                : "border-transparent text-on-surface-variant hover:bg-surface"
            }`}
          >
            <MaterialIcon>dashboard</MaterialIcon>
            Overview
          </button>
          <button
            onClick={() => setActiveView("patients")}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 transition-all relative ${
              activeView === "patients"
                ? "border-primary text-primary bg-red-50"
                : "border-transparent text-on-surface-variant hover:bg-surface"
            }`}
          >
            <MaterialIcon>people</MaterialIcon>
            Patients
            {patients.filter((p) => scorePatient(p, getLatestVitals(p) || undefined).colour === "critical").length > 0 && (
              <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {patients.filter((p) => scorePatient(p, getLatestVitals(p) || undefined).colour === "critical").length}
              </span>
            )}
          </button>

          <div className="text-xs font-bold uppercase text-on-surface-variant px-5 py-3 tracking-widest mt-4">Tools</div>
          <button
            onClick={() => setActiveView("education")}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 transition-all ${
              activeView === "education"
                ? "border-primary text-primary bg-red-50"
                : "border-transparent text-on-surface-variant hover:bg-surface"
            }`}
          >
            <MaterialIcon>school</MaterialIcon>
            Education
          </button>
        </nav>

        <div className="p-5 border-t border-outline-variant text-xs text-on-surface-variant font-mono">
          Model: <span className="text-primary">Nurture-v2.0</span>
          <br />
          Threshold: <span className="text-primary">0.25</span>
          <br />
          Engine:{" "}
          <span className="text-primary">
            {engineStatus === 'online' ? '● Live' : engineStatus === 'offline' ? '● Offline' : '● —'}
          </span>
        </div>

        <button
          onClick={() => router.push("/auth")}
          className="mx-5 mb-5 px-4 py-2 bg-primary/10 text-primary border border-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2 justify-center"
        >
          <MaterialIcon>logout</MaterialIcon>
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-14 border-b border-outline-variant flex items-center px-7 gap-4 bg-surface-container-low">
          <div className="text-xs font-bold uppercase text-on-surface-variant">
            {activeView === "overview" && "Overview "}
            {activeView === "patients" && "Patients "}
            {activeView === "education" && "Tools "}
            <span className="text-on-surface-variant/70">/ {activeView === "overview" && "Dashboard"}
              {activeView === "patients" && "All Records"}
              {activeView === "education" && "Education Cards"}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant">
            <MaterialIcon className="text-base">search</MaterialIcon>
            <input
              type="text"
              placeholder="Search patients…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-sm placeholder:text-on-surface-variant flex-1"
            />
          </div>
          <button
            onClick={() => setShowAddPatientModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:brightness-110 transition-all"
          >
            <MaterialIcon>add</MaterialIcon>
            Add Patient
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-7">
          {activeView === "overview" && <OverviewView patients={patients} scorePatient={scorePatient} getLatestVitals={getLatestVitals} getRiskColor={getRiskColor} setActiveView={setActiveView} setActivePatientId={setActivePatientId} setShowAddPatientModal={setShowAddPatientModal} />}
          {activeView === "patients" && <PatientsView patients={patients} scorePatient={scorePatient} getLatestVitals={getLatestVitals} getRiskColor={getRiskColor} searchQuery={searchQuery} setActiveView={setActiveView} setActivePatientId={setActivePatientId} />}
          {activeView === "detail" && <DetailView patient={patients.find((p) => p.id === activePatientId)} scorePatient={scorePatient} getLatestVitals={getLatestVitals} getRiskColor={getRiskColor} setActiveView={setActiveView} setShowAddVisitModal={setShowAddVisitModal} />}
          {activeView === "education" && <EducationView />}
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-outline-variant p-6 flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-primary">Register New Patient</h2>
                <p className="text-sm text-on-surface-variant">Personal info + baseline clinical data</p>
              </div>
              <button onClick={() => setShowAddPatientModal(false)} className="text-xl text-on-surface-variant hover:text-on-surface">✕</button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase text-on-surface-variant mb-4">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Full Name" value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="date" placeholder="Date of Birth" value={patientForm.dateOfBirth} onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="text" placeholder="State of Origin" value={patientForm.state} onChange={(e) => setPatientForm({ ...patientForm, state: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="number" placeholder="Gestational Week" value={patientForm.week} onChange={(e) => setPatientForm({ ...patientForm, week: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="number" placeholder="ANC Booking Week" value={patientForm.ancWeek} onChange={(e) => setPatientForm({ ...patientForm, ancWeek: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="number" placeholder="Gravidity (# pregnancies)" value={patientForm.gravidity} onChange={(e) => setPatientForm({ ...patientForm, gravidity: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-on-surface-variant mb-4">Clinical History</h3>
                <div className="grid grid-cols-2 gap-4">
                  <select value={patientForm.scd} onChange={(e) => setPatientForm({ ...patientForm, scd: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm">
                    <option value="">Sickle Cell Genotype</option>
                    <option value="AA">AA — Normal</option>
                    <option value="AS">AS — Carrier</option>
                    <option value="SS">SS — Sickle cell</option>
                    <option value="SC">SC — Sickle-C</option>
                  </select>
                  <select value={patientForm.hiv} onChange={(e) => setPatientForm({ ...patientForm, hiv: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm">
                    <option value="">HIV Status</option>
                    <option value="Negative">Negative</option>
                    <option value="Positive_ART">Positive (ART)</option>
                    <option value="Positive_No_ART">Positive (No ART)</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                  <select value={patientForm.malaria} onChange={(e) => setPatientForm({ ...patientForm, malaria: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm">
                    <option value="">Malaria Episodes</option>
                    <option value="0">0 episodes</option>
                    <option value="1">1 episode</option>
                    <option value="2">2+ episodes</option>
                  </select>
                  <select value={patientForm.iptpDoses} onChange={(e) => setPatientForm({ ...patientForm, iptpDoses: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm">
                    <option value="">IPTp Doses</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3 (adequate)</option>
                  </select>
                  <select value={patientForm.htn} onChange={(e) => setPatientForm({ ...patientForm, htn: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm">
                    <option value="">Prior Hypertension</option>
                    <option value="0">No</option>
                    <option value="1">Yes — chronic or prior preeclampsia</option>
                  </select>
                  <select value={patientForm.multiple} onChange={(e) => setPatientForm({ ...patientForm, multiple: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm">
                    <option value="">Multiple Gestation</option>
                    <option value="0">Single pregnancy</option>
                    <option value="1">Twins or more</option>
                  </select>
                  <select value={patientForm.facility} onChange={(e) => setPatientForm({ ...patientForm, facility: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm">
                    <option value="">Prior Facility Delivery</option>
                    <option value="1">Yes</option>
                    <option value="0">No — home delivery</option>
                  </select>
                  <select value={patientForm.multiparity} onChange={(e) => setPatientForm({ ...patientForm, multiparity: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm">
                    <option value="">Grand Multiparity (5+ births)</option>
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-outline-variant p-6 flex gap-3 justify-end">
              <button onClick={() => setShowAddPatientModal(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-bold hover:bg-surface-container">Cancel</button>
              <button onClick={handleAddPatient} disabled={isSubmittingPatient} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmittingPatient ? 'Registering...' : 'Register Patient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Visit Modal */}
      {showAddVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-outline-variant p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="font-headline-sm text-primary">Log ANC Visit</h2>
                <p className="text-sm text-on-surface-variant">Record vitals for this checkup</p>
              </div>
              <button onClick={() => setShowAddVisitModal(false)} className="text-xl text-on-surface-variant hover:text-on-surface">✕</button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase text-on-surface-variant mb-4">Visit Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={visitForm.date} onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="number" placeholder="Gestational Week" value={visitForm.week} onChange={(e) => setVisitForm({ ...visitForm, week: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-on-surface-variant mb-4">Vitals</h3>
                <div className="grid grid-cols-3 gap-4">
                  <input type="number" placeholder="Systolic BP" value={visitForm.sbp} onChange={(e) => setVisitForm({ ...visitForm, sbp: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="number" placeholder="Diastolic BP" value={visitForm.dbp} onChange={(e) => setVisitForm({ ...visitForm, dbp: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="number" placeholder="Heart Rate" value={visitForm.hr} onChange={(e) => setVisitForm({ ...visitForm, hr: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="number" placeholder="Blood Sugar" value={visitForm.bs} onChange={(e) => setVisitForm({ ...visitForm, bs: e.target.value })} step="0.1" className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="number" placeholder="Temperature" value={visitForm.temp} onChange={(e) => setVisitForm({ ...visitForm, temp: e.target.value })} step="0.1" className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                  <input type="number" placeholder="Weight (kg)" value={visitForm.weight} onChange={(e) => setVisitForm({ ...visitForm, weight: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm" />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-on-surface-variant mb-4">Clinical Observations</h3>
                <div className="grid grid-cols-2 gap-4">
                  <select value={visitForm.oedema} onChange={(e) => setVisitForm({ ...visitForm, oedema: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm">
                    <option value="">Oedema</option>
                    <option value="none">None</option>
                    <option value="mild">Mild — feet/ankles</option>
                    <option value="severe">Severe — face/hands</option>
                  </select>
                  <select value={visitForm.protein} onChange={(e) => setVisitForm({ ...visitForm, protein: e.target.value })} className="px-3 py-2 border border-outline-variant rounded-lg text-sm">
                    <option value="">Proteinuria</option>
                    <option value="none">None / Not tested</option>
                    <option value="trace">Trace (+)</option>
                    <option value="positive">Positive (++ or more)</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-on-surface-variant mb-4">Clinician Notes</h3>
                <textarea placeholder="Observations, complaints, treatment given…" value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm" rows={3} />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-outline-variant p-6 flex gap-3 justify-end z-10">
              <button onClick={() => setShowAddVisitModal(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-bold hover:bg-surface-container">Cancel</button>
              <button onClick={handleAddVisit} disabled={isSubmittingVisit} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmittingVisit ? 'Saving...' : 'Save Visit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewView({ patients, scorePatient, getLatestVitals, getRiskColor, setActiveView, setActivePatientId, setShowAddPatientModal }: any) {
  const scored = patients.map((p: Patient) => ({ ...p, risk: scorePatient(p, getLatestVitals(p) || undefined) }));
  const critical = scored.filter((p: any) => p.risk.colour === "critical").length;
  const high = scored.filter((p: any) => p.risk.colour === "high").length;
  const safe = scored.filter((p: any) => p.risk.colour === "low" || p.risk.colour === "moderate").length;
  const flagged = scored.filter((p: any) => p.risk.colour === "critical" || p.risk.colour === "high");

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-7">
        <StatCard label="Total Patients" value={patients.length} color="blue" sub="Registered in system" />
        <StatCard label="Critical Risk" value={critical} color="red" sub="Immediate review needed" />
        <StatCard label="High Risk" value={high} color="amber" sub="Escalate within 48h" />
        <StatCard label="Low / Moderate" value={safe} color="green" sub="Standard ANC care" />
      </div>

      <div className="mb-3">
        <h3 className="text-xs font-bold uppercase text-on-surface-variant">Flagged Patients — Requires Attention</h3>
      </div>

      {flagged.length === 0 ? (
        <div className="bg-surface rounded-lg border border-outline-variant p-16 text-center">
          <div className="text-4xl text-on-surface-variant/40 mb-3">✓</div>
          <p className="text-on-surface-variant mb-4">{patients.length ? "No patients flagged. All patients are low/moderate risk." : "No patients added yet."}</p>
          {patients.length === 0 && (
            <button onClick={() => setShowAddPatientModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:brightness-110">
              Add Patient
            </button>
          )}
        </div>
      ) : (
        <PatientTable patients={flagged} getRiskColor={getRiskColor} setActiveView={setActiveView} setActivePatientId={setActivePatientId} />
      )}
    </div>
  );
}

function PatientsView({ patients, scorePatient, getLatestVitals, getRiskColor, searchQuery, setActiveView, setActivePatientId }: any) {
  const filtered = patients.filter((p: Patient) =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.state || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const scored = filtered.map((p: Patient) => ({ ...p, risk: scorePatient(p, getLatestVitals(p) || undefined) }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-on-surface-variant">All Patients</h3>
      </div>

      {scored.length === 0 ? (
        <div className="bg-surface rounded-lg border border-outline-variant p-16 text-center">
          <div className="text-4xl text-on-surface-variant/40 mb-3">◎</div>
          <p className="text-on-surface-variant mb-4">{searchQuery ? "No patients match your search." : "No patients yet."}</p>
        </div>
      ) : (
        <PatientTable patients={scored} getRiskColor={getRiskColor} setActiveView={setActiveView} setActivePatientId={setActivePatientId} />
      )}
    </div>
  );
}

function DetailView({ patient, scorePatient, getLatestVitals, getRiskColor, setActiveView, setShowAddVisitModal }: any) {
  if (!patient) return null;

  const latestVitals = getLatestVitals(patient);
  const risk = scorePatient(patient, latestVitals || undefined);
  const initials = patient.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const visits = patient.visits ? [...patient.visits].sort((a: Visit, b: Visit) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  return (
    <div>
      <button onClick={() => setActiveView("patients")} className="flex items-center gap-2 text-primary text-xs font-bold mb-4 hover:underline">
        <MaterialIcon>arrow_back</MaterialIcon>
        Back to Patients
      </button>

      <div className="bg-surface rounded-lg border border-outline-variant p-6 mb-5">
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-lg">{initials}</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-on-surface mb-1">{patient.name}</h2>
            <div className="flex gap-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1"><MaterialIcon className="text-xs text-amber-600">cake</MaterialIcon> Age {patient.age}</span>
              <span className="flex items-center gap-1"><MaterialIcon className="text-xs text-green-600">location_on</MaterialIcon> {patient.state || "—"}</span>
              <span className="flex items-center gap-1"><MaterialIcon className="text-xs text-pink-600">womb</MaterialIcon> Week {patient.week}</span>
              <span className="flex items-center gap-1"><MaterialIcon className="text-xs text-blue-600">calendar_month</MaterialIcon> ANC Wk {patient.ancWeek || "—"}</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddVisitModal(true)}
            className="px-3 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:brightness-110"
          >
            + Log Visit
          </button>
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase text-on-surface-variant mb-3">Risk Scores — Composite: {risk.composite}/99 [{risk.priority}]</h3>
        <div className="grid grid-cols-3 gap-3">
          <RiskScoreCard label="Postpartum Haemorrhage" score={risk.pph} flagged={risk.flags.pph} color="red" />
          <RiskScoreCard label="Preeclampsia / Eclampsia" score={risk.pre} flagged={risk.flags.pre} color="amber" />
          <RiskScoreCard label="Preterm Labour" score={risk.ptl} flagged={risk.flags.ptl} color="blue" />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase text-on-surface-variant mb-3">Visit History ({visits.length} visit{visits.length !== 1 ? "s" : ""})</h3>
        {visits.length === 0 ? (
          <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-lg p-10 text-center text-on-surface-variant">
            No visits recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((v, i) => (
              <div key={v.id} className="bg-surface border border-outline-variant rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs text-on-surface-variant">{new Date(v.date).toLocaleDateString("en-NG")} {v.week && `· Week ${v.week}`}</div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-surface-container p-2 rounded">
                    <div className="text-on-surface-variant text-xs mb-1">SYSTOLIC BP</div>
                    <div className="font-bold text-on-surface">{v.sbp} mmHg</div>
                  </div>
                  <div className="bg-surface-container p-2 rounded">
                    <div className="text-on-surface-variant text-xs mb-1">DIASTOLIC BP</div>
                    <div className="font-bold text-on-surface">{v.dbp} mmHg</div>
                  </div>
                  {v.hr && (
                    <div className="bg-surface-container p-2 rounded">
                      <div className="text-on-surface-variant text-xs mb-1">HEART RATE</div>
                      <div className="font-bold text-on-surface">{v.hr} bpm</div>
                    </div>
                  )}
                  {v.weight && (
                    <div className="bg-surface-container p-2 rounded">
                      <div className="text-on-surface-variant text-xs mb-1">WEIGHT</div>
                      <div className="font-bold text-on-surface">{v.weight} kg</div>
                    </div>
                  )}
                </div>
                {v.notes && <div className="mt-3 text-xs italic text-on-surface-variant">"{v.notes}"</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EducationView() {
  const cards = [
    {
      week: "Weeks 20–24",
      topic: "Warning Signs — High Blood Pressure",
      icon: "🩺",
      langs: {
        English: { title: "Danger Signs of Preeclampsia", body: "If you have a severe headache, blurry vision, or sudden swelling — go to hospital TODAY." },
        Yoruba: { title: "Àmì Ìkìlọ", body: "Bí orí rẹ bá ń fọ́ gan-an, tàbí ójú rẹ bá ń ṣòkùnkùn — lọ sí ilé-ìwòsàn lónìí." },
      },
    },
  ];

  return (
    <div>
      <h3 className="text-xs font-bold uppercase text-on-surface-variant mb-4">Multilingual Education Cards</h3>
      {cards.map((card, i) => (
        <div key={i} className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{card.icon}</span>
            <div>
              <div className="text-xs font-bold uppercase text-on-surface-variant">{card.week}</div>
              <div className="text-sm text-on-surface-variant">{card.topic}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(card.langs).map(([lang, content]: any) => (
              <div key={lang} className="bg-surface border border-outline-variant rounded-lg p-4 border-t-4 border-t-primary">
                <div className="text-xs font-bold text-primary mb-2 uppercase">{lang}</div>
                <div className="text-sm font-bold text-on-surface mb-2">{content.title}</div>
                <div className="text-xs text-on-surface-variant leading-relaxed">{content.body}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, color, sub }: {
  label: string;
  value: number;
  color: "blue" | "red" | "amber" | "green";
  sub: string;
}) {
  const colors = {
    blue: "border-t-blue-500",
    red: "border-t-red-500",
    amber: "border-t-amber-500",
    green: "border-t-green-500",
  };

  return (
    <div className={`bg-surface border border-outline-variant rounded-lg p-4 border-t-4 ${colors[color]}`}>
      <div className="text-xs text-on-surface-variant uppercase mb-2">{label}</div>
      <div className={`text-2xl font-bold mb-1 ${color === "red" ? "text-red-600" : color === "amber" ? "text-amber-600" : color === "blue" ? "text-blue-600" : "text-green-600"}`}>{value}</div>
      <div className="text-xs text-on-surface-variant">{sub}</div>
    </div>
  );
}

function RiskScoreCard({ label, score, flagged, color }: {
  label: string;
  score: number;
  flagged: boolean;
  color: "red" | "amber" | "blue";
}) {
  const colorMap = {
    red: { text: "text-red-600", bg: "bg-red-50" },
    amber: { text: "text-amber-600", bg: "bg-amber-50" },
    blue: { text: "text-blue-600", bg: "bg-blue-50" },
  };

  return (
    <div className={`${colorMap[color].bg} border border-outline-variant rounded-lg p-4`}>
      <div className="text-xs text-on-surface-variant uppercase mb-2">{label}</div>
      <div className={`text-3xl font-bold mb-2 ${colorMap[color].text}`}>{score}<span className="text-xs text-on-surface-variant">/99</span></div>
      {flagged ? (
        <div className={`text-xs font-bold ${colorMap[color].text}`}>⚑ Flagged</div>
      ) : (
        <div className="text-xs text-on-surface-variant">✓ Clear</div>
      )}
    </div>
  );
}

function PatientTable({ patients, getRiskColor, setActiveView, setActivePatientId }: any) {
  return (
    <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container border-b border-outline-variant">
            <th className="text-left px-4 py-3 text-xs font-bold uppercase text-on-surface-variant">Patient</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase text-on-surface-variant">Age</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase text-on-surface-variant">Gestation</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase text-on-surface-variant">Risk</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase text-on-surface-variant">Last BP</th>
            <th className="text-left px-4 py-3 text-xs font-bold uppercase text-on-surface-variant">Visits</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p: any) => (
            <tr
              key={p.id}
              onClick={() => {
                setActivePatientId(p.id);
                setActiveView("detail");
              }}
              className="border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">
                    {p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-on-surface">{p.name}</div>
                    <div className="text-xs text-on-surface-variant">{p.state || "—"}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-on-surface font-mono">{p.age}</td>
              <td className="px-4 py-3 text-on-surface font-mono">Wk {p.week}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${getRiskColor(p.risk.colour)}`}>
                  {p.risk.priority}
                </span>
              </td>
              <td className="px-4 py-3 text-on-surface-variant text-xs">
                {p.visits?.length > 0 ? `${p.visits[p.visits.length - 1].sbp}/${p.visits[p.visits.length - 1].dbp}` : "—"}
              </td>
              <td className="px-4 py-3 text-on-surface-variant text-xs">{p.visits?.length || 0} visit{p.visits?.length !== 1 ? "s" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
