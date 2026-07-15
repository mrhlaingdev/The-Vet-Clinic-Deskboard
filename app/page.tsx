"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Users, Calendar, Activity, Cake } from "lucide-react";

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
    <div className="bg-slate-800 p-6 rounded-lg shadow-md mt-6 text-white border border-blue-500 max-w-4xl mx-auto">
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition"
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
  const [birthdayPets, setBirthdayPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { count: ownersCount } = await supabase.from("owners").select("*", { count: "exact", head: true });
        const { count: petsCount } = await supabase.from("pets").select("*", { count: "exact", head: true });
        const { count: appointmentsCount } = await supabase.from("appointments").select("*", { count: "exact", head: true });

        setStats({
          owners: ownersCount || 0,
          pets: petsCount || 0,
          appointments: appointmentsCount || 0,
        });

        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const birthdayString = `-${month}-${day}`;

        const { data: petsWithAppointments } = await supabase
          .from("appointments")
          .select(`
            id,
            appointment_date,
            pets ( id, name, type, date_of_birth )
          `);

        const filtered: any[] = [];
        petsWithAppointments?.forEach((app: any) => {
          if (app.pets && app.pets.date_of_birth && app.pets.date_of_birth.includes(birthdayString)) {
            const dob = new Date(app.pets.date_of_birth);
            const formattedDob = `${dob.getMonth() + 1}/${dob.getDate()}`;

            filtered.push({
              id: app.id,
              petName: app.pets.name,
              type: app.pets.type,
              dob: formattedDob,
              date: new Date(app.appointment_date).toLocaleDateString()
            });
          }
        });

        setBirthdayPets(filtered);

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-teal-400">🐾 Vet Clinic Dashboard</h1>
        <p className="text-gray-400 mt-1">တိရစ္ဆာန်ဆေးခန်း စီမံခန့်ခွဲမှုစနစ် (Mission Tasks)</p>
      </div>

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

      <div className="bg-gray-800 p-6 rounded-xl border border-purple-500/30 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Cake className="text-pink-400" size={24} />
          <h2 className="text-xl font-semibold text-purple-300">🎂 ယနေ့ မွေးနေ့ရှင် ရက်ချိန်းစာရင်း</h2>
        </div>

        {loading ? (
          <p className="text-gray-400">အချက်အလက်များ ရှာဖွေနေပါသည်...</p>
        ) : birthdayPets.length === 0 ? (
          <p className="text-gray-500 italic">ယနေ့ ရက်ချိန်းရှိသော မွေးနေ့ရှင် တိရစ္ဆာန်မရှိပါ။</p>
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
                    <td className="py-3 text-pink-400 font-semibold">{pet.dob} (ယနေ့)</td>
                    <td className="py-3 text-gray-300">{pet.date}</td>
                    <td className="py-3"><span className="bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded text-xs font-semibold">🎉 Birthday Match!</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AISymptomChecker />
    </div>
  );
}