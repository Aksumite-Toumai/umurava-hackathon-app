"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CRITICAL FATAL ERROR:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 text-center">
          <h2 className="text-2xl font-bold text-red-600">
            Critical System Error
          </h2>
          <p className="mt-2 text-gray-600">The application failed to load.</p>
          <button
            onClick={() => reset()}
            className="mt-6 rounded-md bg-amber-700 px-4 py-2 text-white hover:bg-amber-800"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
