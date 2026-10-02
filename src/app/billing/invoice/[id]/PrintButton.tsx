"use client";

// Opens the browser print dialog; "Save as PDF" gives a PDF invoice.
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}