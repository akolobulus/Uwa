"use client";

import { useState, useEffect } from "react";

/**
 * DoctorOnDutyManager
 *
 * Drop this into the clinician dashboard so doctors can log themselves
 * as "on duty" — Nurture AI will then route mother alerts to them.
 */

type Doctor = {
  id: string;
  name: string;
  phone_number: string;
  specialty: string;
  shift_start: string;
  is_active: boolean;
};

export default function DoctorOnDutyManager() {
  const [current, setCurrent] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone_number: "", specialty: "Obstetrics" });

  useEffect(() => {
    fetch("/api/mother/doctor-on-duty")
      .then((r) => r.json())
      .then(({ doctor }) => setCurrent(doctor))
      .finally(() => setLoading(false));
  }, []);

  const setOnDuty = async () => {
    if (!form.name || !form.phone_number) return;
    setSaving(true);
    try {
      const res = await fetch("/api/mother/doctor-on-duty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const { doctor } = await res.json();
      setCurrent(doctor);
      setForm({ name: "", phone_number: "", specialty: "Obstetrics" });
    } finally {
      setSaving(false);
    }
  };

  const goOffDuty = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await fetch("/api/mother/doctor-on-duty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: current.id, is_active: false }),
      });
      setCurrent(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface p-4 text-xs text-on-surface-variant">
        Loading duty status…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant bg-surface shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
        <div className="font-bold text-sm text-on-surface">Doctor On Duty</div>
        {current && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            ON DUTY
          </span>
        )}
      </div>

      <div className="p-4">
        {current ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {current.name[0]}
              </div>
              <div>
                <div className="font-semibold text-sm text-on-surface">{current.name}</div>
                <div className="text-xs text-on-surface-variant">{current.specialty}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">phone</span>
              <a href={`tel:${current.phone_number}`} className="font-medium text-primary hover:underline">
                {current.phone_number}
              </a>
            </div>
            <div className="text-[10px] text-on-surface-variant">
              On since {new Date(current.shift_start).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <button
              onClick={goOffDuty}
              disabled={saving}
              className="w-full py-2 rounded-lg border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {saving ? "Updating…" : "Go Off Duty"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-on-surface-variant mb-2">
              No doctor currently on duty. Mothers who need help won't be able to reach a doctor until one is registered.
            </div>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Doctor's full name"
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-xs text-on-surface bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={form.phone_number}
              onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
              placeholder="Phone number (e.g. +2348012345678)"
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-xs text-on-surface bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={form.specialty}
              onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-xs text-on-surface bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Obstetrics</option>
              <option>Gynaecology</option>
              <option>General Practice</option>
              <option>Midwifery</option>
            </select>
            <button
              onClick={setOnDuty}
              disabled={saving || !form.name || !form.phone_number}
              className="w-full py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {saving ? "Setting…" : "Set Myself On Duty"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
