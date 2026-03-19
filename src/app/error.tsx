"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global UI Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Application Exception</h2>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
          A client-side error occurred while rendering this component. We've logged the incident.
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          Try to Recover
        </button>
      </div>
    </div>
  );
}
