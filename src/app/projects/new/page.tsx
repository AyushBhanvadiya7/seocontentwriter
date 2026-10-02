"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, MapPin, Globe } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    websiteUrl: "",
    siteType: "local" as "local" | "global",
    language: "en",
    targetCountry: "IN",
    targetCity: "",
    businessDescription: "",
    industry: "",
    audience: "",
    productsServices: "",
    competitors: "",
  });

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleContinueStep1() {
    if (!form.name.trim()) {
      setError("Please enter a project name.");
      return;
    }
    if (!form.websiteUrl.trim() || !form.websiteUrl.startsWith("https://")) {
      setError("Website URL must start with https://");
      return;
    }
    if (form.siteType === "local" && !form.targetCity.trim()) {
      setError("City is required for Local Business projects to rank in local search.");
      return;
    }
    setError("");
    setStep(2);
  }

  async function submit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } else {
      setError(data.message || "Could not create project");
    }
  }

  const steps = [
    "Website identity",
    "Business details",
    "Keywords",
    "Website pages",
    "Brand voice",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Create a new project</h1>
      <p className="text-sm text-slate-600">Tell us about the website so we can write in the right voice.</p>

      <div className="mt-6 flex items-center justify-between">
        {steps.map((s, idx) => (
          <div key={s} className="flex flex-1 flex-col items-center text-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                idx + 1 <= step ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {idx + 1 < step ? <Check className="h-4 w-4" /> : idx + 1}
            </div>
            <span className="mt-2 hidden text-xs font-medium text-slate-600 sm:block">{s}</span>
          </div>
        ))}
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Step 1: Website identity</h2>

            {/* Project Type: Local vs Global Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Project Type</label>
              <p className="mt-0.5 text-xs text-slate-500">
                Choose whether articles should focus on a specific city or speak to a worldwide audience.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => update("siteType", "local")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                    form.siteType === "local"
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Local Business (City)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    update("siteType", "global");
                    update("targetCity", "");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                    form.siteType === "global"
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Globe className="h-4 w-4 text-blue-600" />
                  Global / National
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Project name</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Shree Roof Care"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Website URL</label>
              <input
                type="url"
                value={form.websiteUrl}
                onChange={(e) => update("websiteUrl", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://shreeroofcare.in"
              />
              <p className="mt-1 text-xs text-slate-500">Must start with https://</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => update("language", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="gu">Gujarati</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Country</label>
                <select
                  value={form.targetCountry}
                  onChange={(e) => update("targetCountry", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>

            {form.siteType === "local" ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                <label className="block text-sm font-semibold text-slate-900">
                  Target City <span className="text-red-500">*</span>
                </label>
                <p className="mt-0.5 text-xs text-slate-600">
                  Required for local ranking. Articles will naturally reference this city, local climate, and service intent.
                </p>
                <input
                  value={form.targetCity}
                  onChange={(e) => update("targetCity", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Surat, Mumbai, Delhi, Ahmedabad"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Global Website:</span> Articles will address a nationwide or universal audience without referencing a specific city.
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Step 2: Business details</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                What does the website offer? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.businessDescription}
                onChange={(e) => update("businessDescription", e.target.value)}
                rows={4}
                minLength={100}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="We do terrace waterproofing, bathroom leak repair and wall dampness treatment in Surat using PU and epoxy coatings."
              />
              <p className="mt-1 text-xs text-slate-500">Min 100 characters. This powers real details in your content.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Industry / niche</label>
              <input
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Construction services / waterproofing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Target audience</label>
              <input
                value={form.audience}
                onChange={(e) => update("audience", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Homeowners in Surat dealing with monsoon leaks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Products / services</label>
              <input
                value={form.productsServices}
                onChange={(e) => update("productsServices", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Terrace waterproofing, bathroom waterproofing, epoxy coating"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Competitor URLs</label>
              <textarea
                value={form.competitors}
                onChange={(e) => update("competitors", e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="https://competitor1.com&#10;https://competitor2.com"
              />
            </div>
          </div>
        )}

        {step >= 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Steps 3–5: Keywords, pages & voice</h2>
            <p className="text-sm text-slate-600">
              We will set these up next in the project workspace. You can upload keywords, import your sitemap, and tune the brand voice there.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Back
        </button>
        {step < 2 ? (
          <button
            onClick={step === 1 ? handleContinueStep1 : () => setStep((s) => s + 1)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading || form.businessDescription.length < 100}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create project"}
          </button>
        )}
      </div>
    </div>
  );
}
