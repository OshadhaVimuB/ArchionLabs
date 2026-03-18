"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight, CheckCircle2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  "Architect",
  "Urban Planner",
  "Civil Engineer",
  "Interior Designer",
  "Student",
  "Other"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward for animation
  
  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  // Step 2
  const [roleSelect, setRoleSelect] = useState("");
  const [roleOther, setRoleOther] = useState("");
  
  // Submission
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextStep = () => {
    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim()) nextStep();
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (roleSelect && (roleSelect !== "Other" || roleOther.trim())) {
      nextStep();
    }
  };

  const completeSetup = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const finalRole = roleSelect === "Other" ? roleOther.trim() : roleSelect;
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          job_role: finalRole,
        }
      });

      if (updateError) throw updateError;
      
      router.refresh();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save profile details");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#09090b] p-4 text-zinc-950 dark:text-zinc-50 transition-colors">
      
      <div className="w-full max-w-sm">
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 ease-out",
                step >= s ? "w-8 bg-zinc-900 dark:bg-zinc-100" : "w-2 bg-zinc-200 dark:bg-zinc-800"
              )} 
            />
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden relative min-h-[400px]">
          
          {/* STEP 1: Name */}
          {step === 1 && (
            <div className="absolute inset-0 p-8 flex flex-col animate-in slide-in-from-right-8 fade-in duration-300">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 font-bold mb-6">
                <img src="/Assets/favicon.svg" alt="ArchionLabs" className="w-5 h-5 object-contain" />
                <span>ArchionLabs</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Welcome aboard</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 mb-8">
                Let's get to know you. What's your name?
              </p>

              <form onSubmit={handleNextStep1} className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium leading-none">
                      First name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      autoFocus
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium leading-none">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!firstName.trim() || !lastName.trim()}
                  className="w-full mt-6 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 h-10 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Role */}
          {step === 2 && (
            <div className="absolute inset-0 p-8 flex flex-col animate-in slide-in-from-right-8 fade-in duration-300 fill-mode-forwards">
              <h2 className="text-2xl font-semibold tracking-tight">Your role</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 mb-8">
                How do you plan to use ArchionLabs?
              </p>

              <form onSubmit={handleNextStep2} className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium leading-none">
                      Primary discipline
                    </label>
                    <select
                      id="role"
                      value={roleSelect}
                      onChange={(e) => setRoleSelect(e.target.value)}
                      required
                      className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 transition-all shadow-sm appearance-none"
                    >
                      <option value="" disabled className="text-zinc-500">Select your role...</option>
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="text-zinc-900">{r}</option>
                      ))}
                    </select>
                  </div>

                  {roleSelect === "Other" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label htmlFor="roleOther" className="text-sm font-medium leading-none">
                        Please specify
                      </label>
                      <input
                        id="roleOther"
                        type="text"
                        autoFocus
                        required
                        value={roleOther}
                        onChange={(e) => setRoleOther(e.target.value)}
                        placeholder="e.g. Real Estate Developer"
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300 transition-all shadow-sm"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!roleSelect || (roleSelect === "Other" && !roleOther.trim())}
                  className="w-full mt-6 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 h-10 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: Complete / Micro-interaction */}
          {step === 3 && (
            <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center animate-in slide-in-from-bottom-8 fade-in duration-500">
              
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 dark:opacity-40 animate-pulse rounded-full" />
                <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in-50 duration-500 ease-out" />
              </div>
              
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                All set, {firstName}!
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-[250px]">
                Your workspace is ready. Let's start building the future.
              </p>

              {error && (
                <div className="p-3 mb-4 w-full text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={completeSetup}
                disabled={loading}
                className="w-full bg-[#2563eb] text-white hover:bg-[#2563eb]/90 h-10 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go to Dashboard"}
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
