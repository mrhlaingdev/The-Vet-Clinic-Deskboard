"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Users, Calendar, Activity, Cake, PlusCircle, Clipboard, PawPrint } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function AISymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms) return;
    setLoading(true);
    
    setTimeout(() => {
      const text = symptoms.toLowerCase();
      if (text.includes("fever") || text.includes("hot")) {
        setResult("⚠️ Potential Infection or Flu. Recommendation: Check temperature, keep hydrated, and schedule a blood test.");
      } else if (text.includes("cough") || text.includes("breathe")) {
        setResult("⚠️ Respiratory Issue detected. Recommendation: Isolate pet from dust, check for asthma, and humidify the room.");
      } else if (text.includes("vomit") || text.includes("diarrhea")) {
        setResult("⚠️ Gastrointestinal Distress. Recommendation: Fast the pet for 12 hours, offer small amounts of water, check for toxic food intake.");
      } else {
        setResult("💡 General Symptoms. Recommendation: Monitor for 24 hours. If symptoms persist, conduct a physical examination.");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md text-white border border-blue-500 w-full">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        🤖 AI Symptom Checker
      </h2>
      <form onSubmit={handleCheck} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Enter Pet's Symptoms (e.g., fever, cough, vomiting):</label>
          <input
            type="text"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe what's wrong with the pet..."
            className="w-full p-2 rounded bg-slate-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition w-full md:w-auto"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Symptoms"}
        </button>
      </form>
      
      {result && (
        <div className="mt-4 p-4 bg-slate-900 rounded border-l-4 border-blue-400">
          <p className="text-sm font-medium">{result}</p>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ owners: 0, pets: 0, appointments: 0 });
  const [birthdayPets, setBirthdayPets] = useState<any[]>([]); // မွေးနေ့ရှင်များအတွက်
  const [allPetsList, setAllPetsList] = useState<any[]>([]); // တိရစ္ဆာန် စာရင်းအကုန်လုံးအတွက်
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal States
  const [showPetModal, setShowPetModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Form Input States
  const [petForm, setPetForm] = useState({ name: "", type: "", breed: "", date_of_birth: "" });
  const [recordForm, setRecordForm] = useState({ pet_id: "", diagnosis: "", treatment: "" });

  async function fetchData() {
    try {
      setLoading(true);
      const { count: ownersCount } = await supabase.from("owners").select("*", { count: "exact", head: true });
      const { count: petsCount } = await supabase.from("pets").select("*", { count: "exact", head: true });
      const { count: appointmentsCount } = await supabase.from("appointments").select("*", { count: "exact", head: true });

      setStats({
        owners: ownersCount || 0,
        pets: petsCount || 0,
        appointments: appointmentsCount || 0,
      });

      // 1. တိရစ္ဆာန် စာရင်းအကုန်လုံးကို ဆွဲယူခြင်း (All Pets Table အတွက်)
      const { data: petsData } = await supabase
        .from("pets")
        .select("*")
        .order("created_at", { ascending: false });
      
      setAllPetsList(petsData || []);

      // 2. ယနေ့ မွေးနေ့ကျရောက်သော တိရစ္ဆာန်များကို တိုက်ဆိုင်စစ်ဆေးခြင်း
      const today = new Date();
      const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
      const currentDay = String(today.getDate()).padStart(2, '0');

      const { data: petsWithAppointments } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          pets ( id, name, type, date_of_birth )
        `);

      const birthdayMatched: any[] = [];
      petsWithAppointments?.forEach((app: any) => {
        if (app.pets && app.pets.date_of_birth) {
          const dob = new Date(app.pets.date_of_birth);
          const petMonth = String(dob.getMonth() + 1).padStart(2, '0');
          const petDay = String(dob.getDate()).padStart(2, '0');
          
          // ယနေ့နှင့် မွေးနေ့တူသော တိရစ္ဆာန်များကိုပဲ သီးသန့်စစ်ထုတ်ခြင်း
          if (petMonth === currentMonth && petDay === currentDay) {
            birthdayMatched.push({
              id: app.id,
              petName: app.pets.name,
              type: app.pets.type,
              dob: `${dob.getMonth() + 1}/${dob.getDate()}/${dob.getFullYear()}`,
              appointmentDate: new Date(app.appointment_date).toLocaleDateString()
            });
          }
        }
      });

      setBirthdayPets(birthdayMatched);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Add Pet Submit
  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petForm.name || !petForm.type) return alert("Please fill Pet Name and Type");
    setActionLoading(true);

    try {
      const { error } = await supabase.from("pets").insert([
        {
          name: petForm.name,
          type: petForm.type,
          breed: petForm.breed || "Unknown",
          date_of_birth: petForm.date_of_birth || new Date().toISOString().split('T')[0]
        }
      ]);

      if (error) throw error;
      
      setShowPetModal(false);
      setPetForm({ name: "", type: "", breed: "", date_of_birth: "" });
      await fetchData(); // Refresh Dashboard Data
      alert("New Pet Profile Added Successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to add pet");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Add Medical Record Submit
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForm.pet_id || !recordForm.diagnosis) return alert("Please select a pet and enter diagnosis");
    setActionLoading(true);

    try {
      const { error } = await supabase.from("medical_records").insert([
        {
          pet_id: recordForm.pet_id,
          diagnosis: recordForm.diagnosis,
          treatment: recordForm.treatment || "Monitored",
          visit_date: new Date().toISOString().split('T')[0]
        }
      ]);

      if (error) throw error;

      setShowRecordModal(false);
      setRecordForm({ pet_id: "", diagnosis: "", treatment: "" });
      alert("Medical Record Added Successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to add medical record");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header & Admin Controls */}
      <div className="mb-8 border-b border-gray-800 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-teal-400">🐾 Vet Clinic Dashboard</h1>
          <p className="text-gray-400 mt-1">တိရစ္ဆာန်ဆေးခန်း စီမံခန့်ခွဲမှုစနစ် (Interactive Admin Panel)</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowPetModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <PlusCircle size={18} /> Add New Pet
          </button>
          <button 
            onClick={() => setShowRecordModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Clipboard size={18} /> Add Medical Record
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-lg"><Users size={28} /></div>
          <div>
            <p className="text-gray-400 text-sm">စုစုပေါင်း ပိုင်ရှင်များ</p>
            <h3 className="text-2xl font-bold">{loading ? "..." : stats.owners} ယောက်</h3>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Activity size={28} /></div>
          <div>
            <p className="text-gray-400 text-sm">ဆေးကုသဆဲ အကောင်ရေ</p>
            <h3 className="text-2xl font-bold">{loading ? "..." : stats.pets} ကောင်</h3>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg"><Calendar size={28} /></div>
          <div>
            <p className="text-gray-400 text-sm">ယနေ့ ရက်ချိန်းများ</p>
            <h3 className="text-2xl font-bold">{loading ? "..." : stats.appointments} ခု</h3>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Left Column: Tables Section */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* TABLE 1: ယနေ့ မွေးနေ့ရှင် ရက်ချိန်းစာရင်း */}
          <div className="bg-gray-800 p-6 rounded-xl border border-pink-500/30">
            <div className="flex items-center gap-2 mb-4">
              <Cake className="text-pink-400" size={24} />
              <h2 className="text-xl font-semibold text-pink-300">🎂 ယနေ့ မွေးနေ့ရှင် ရက်ချိန်းစာရင်း</h2>
            </div>

            {loading ? (
              <p className="text-gray-400">အချက်အလက်များ ရှာဖွေနေပါသည်...</p>
            ) : birthdayPets.length === 0 ? (
              <p className="text-gray-500 italic py-2">ယနေ့ မွေးနေ့ကျရောက်သော ရက်ချိန်းမရှိပါ။</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-sm">
                      <th className="pb-3">အကောင်နာမည်</th>
                      <th className="pb-3">အမျိုးအစား</th>
                      <th className="pb-3">မွေးနေ့စစ်စစ်</th>
                      <th className="pb-3">ရက်ချိန်းနေ့စွဲ</th>
                      <th className="pb-3">အခြေအနေ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {birthdayPets.map((pet) => (
                      <tr key={pet.id} className="border-b border-gray-800 text-sm hover:bg-gray-750">
                        <td className="py-3 font-medium text-teal-300">{pet.petName}</td>
                        <td className="py-3 text-gray-300">{pet.type}</td>
                        <td className="py-3 font-semibold text-pink-400">{pet.dob} (ယနေ့)</td>
                        <td className="py-3 text-gray-300">{pet.appointmentDate}</td>
                        <td className="py-3">
                          <span className="bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded text-xs font-semibold">🎉 Birthday Match!</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TABLE 2: တိရစ္ဆာန် စာရင်းအကုန်လုံး (ALL PETS LIST) */}
          <div className="bg-gray-800 p-6 rounded-xl border border-teal-500/30">
            <div className="flex items-center gap-2 mb-4">
              <PawPrint className="text-teal-400" size={24} />
              <h2 className="text-xl font-semibold text-teal-300">🐾 ဆေးခန်းရှိ တိရစ္ဆာန် စာရင်းအကုန်လုံး (All Pets)</h2>
            </div>

            {loading ? (
              <p className="text-gray-400">အချက်အလက်များ ရှာဖွေနေပါသည်...</p>
            ) : allPetsList.length === 0 ? (
              <p className="text-gray-500 italic">တိရစ္ဆာန် စာရင်း မရှိသေးပါ။</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-sm">
                      <th className="pb-3">အကောင်နာမည်</th>
                      <th className="pb-3">အမျိုးအစား</th>
                      <th className="pb-3">မျိုးစိတ် (Breed)</th>
                      <th className="pb-3">မွေးနေ့</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPetsList.map((pet) => (
                      <tr key={pet.id} className="border-b border-gray-800 text-sm hover:bg-gray-750">
                        <td className="py-3 font-medium text-teal-300">{pet.name}</td>
                        <td className="py-3 text-gray-300">{pet.type}</td>
                        <td className="py-3 text-gray-400">{pet.breed || "-"}</td>
                        <td className="py-3 text-gray-400">{pet.date_of_birth ? new Date(pet.date_of_birth).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI Symptom Checker */}
        <div className="flex flex-col justify-start">
          <AISymptomChecker />
        </div>
      </div>

      {/* MODAL 1: ADD NEW PET FORM */}
      {showPetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-teal-500 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-teal-400 mb-4 flex items-center gap-2">🐾 Add New Pet Profile</h2>
            <form onSubmit={handleAddPet} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pet Name *</label>
                <input 
                  type="text" required value={petForm.name} 
                  onChange={(e) => setPetForm({...petForm, name: e.target.value})}
                  className="w-full p-2 rounded bg-gray-750 text-white border border-gray-600 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Species/Type * (e.g., Dog, Cat)</label>
                <input 
                  type="text" required value={petForm.type} 
                  onChange={(e) => setPetForm({...petForm, type: e.target.value})}
                  className="w-full p-2 rounded bg-gray-750 text-white border border-gray-600 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Breed</label>
                <input 
                  type="text" value={petForm.breed} 
                  onChange={(e) => setPetForm({...petForm, breed: e.target.value})}
                  className="w-full p-2 rounded bg-gray-750 text-white border border-gray-600 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
                <input 
                  type="date" value={petForm.date_of_birth} 
                  onChange={(e) => setPetForm({...petForm, date_of_birth: e.target.value})}
                  className="w-full p-2 rounded bg-gray-750 text-white border border-gray-600 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" onClick={() => setShowPetModal(false)}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
                >Cancel</button>
                <button 
                  type="submit" disabled={actionLoading}
                  className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 transition font-semibold"
                >{actionLoading ? "Saving..." : "Save Pet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MEDICAL RECORD FORM */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-purple-500 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">📋 Add New Medical Record</h2>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Select Patient (Pet) *</label>
                <select 
                  required value={recordForm.pet_id}
                  onChange={(e) => setRecordForm({...recordForm, pet_id: e.target.value})}
                  className="w-full p-2 rounded bg-gray-750 text-white border border-gray-600 focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Choose a Pet --</option>
                  {allPetsList.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Diagnosis *</label>
                <input 
                  type="text" required value={recordForm.diagnosis} 
                  onChange={(e) => setRecordForm({...recordForm, diagnosis: e.target.value})}
                  placeholder="e.g., Seasonal Flu, Skin Allergy"
                  className="w-full p-2 rounded bg-gray-750 text-white border border-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Treatment / Prescription</label>
                <textarea 
                  value={recordForm.treatment} 
                  onChange={(e) => setRecordForm({...recordForm, treatment: e.target.value})}
                  placeholder="e.g., Antibiotics 50mg, Daily rest"
                  className="w-full p-2 rounded bg-gray-750 text-white border border-gray-600 focus:outline-none focus:border-purple-500 h-24"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
                >Cancel</button>
                <button 
                  type="submit" disabled={actionLoading}
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 transition font-semibold"
                >{actionLoading ? "Saving..." : "Save Record"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}