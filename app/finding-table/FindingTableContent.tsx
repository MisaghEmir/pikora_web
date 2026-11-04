"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type Table = {
  _id?: string;
  id?: string;
  [key: string]: any;
};

export default function FindingTableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const stakes = searchParams.get("stakes") || "";
  const chips = Number(searchParams.get("chips") || 0);

  const [message, setMessage] = useState("Finding a table...");
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const findTable = async () => {
      if (!stakes || !Number.isFinite(chips) || chips <= 0) {
        setError(true);
        setMessage("Invalid table information");
        return;
      }

      try {
        console.log("FIND TABLE:", { stakes, chips });

        setMessage(`Finding ${stakes} table...`);

        const response = await api.post("/table/find", {
          stakes,
          chips,
        });

        console.log("FIND TABLE RESPONSE:", response.data);

        const table: Table | undefined = response.data?.table;

        if (!table) {
          throw new Error("Table was not returned from server");
        }

        if (!mounted) return;

        const tableWithBuyIn = {
          ...table,
          buyIn: chips,
        };

        console.log("SAVING TABLE:", tableWithBuyIn);

        localStorage.setItem(
          "pikora_table",
          JSON.stringify(tableWithBuyIn)
        );

        setMessage("Table found! Entering...");

        timeout = setTimeout(() => {
          if (!mounted) return;

          router.replace(
            `/poker?stakes=${encodeURIComponent(stakes)}&chips=${chips}`
          );
        }, 500);
      } catch (error: any) {
        console.error(
          "FIND TABLE ERROR:",
          error?.response?.data || error?.message || error
        );

        if (!mounted) return;

        setError(true);

        setMessage(
          error?.response?.data?.message ||
            "Could not find a table"
        );
      }
    };

    findTable();

    return () => {
      mounted = false;

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [stakes, chips, router]);

  return (
    <main className="relative min-h-screen bg-[#0F1116] flex items-center justify-center overflow-hidden px-4 text-white">
      {/* BACKGROUND */}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#E6B72B]/[0.07] blur-[130px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* CARD */}

      <div className="relative w-full max-w-[380px] min-h-[340px] rounded-[28px] border border-white/[0.07] bg-[#1A1D24] shadow-2xl flex flex-col items-center justify-center px-8 py-10">
        {/* LOADER */}

        {error ? (
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-3xl text-red-400">!</span>
          </div>
        ) : (
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-[#E6B72B]/15" />

            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#E6B72B] animate-spin" />

            <div className="absolute inset-3 rounded-full bg-[#E6B72B]/10" />
          </div>
        )}

        {/* TITLE */}

        <h1 className="text-2xl font-extrabold mt-7">
          {error ? "Finding Failed" : "Finding Table"}
        </h1>

        {/* STAKES */}

        <p className="text-[#E6B72B] text-lg font-bold mt-4">
          Stakes {stakes || "-"}
        </p>

        {/* BUY IN */}

        <p className="text-white/50 text-sm mt-2">
          Buy-in {chips.toLocaleString()}
        </p>

        {/* MESSAGE */}

        <p className="text-white/55 text-sm mt-6 text-center min-h-5">
          {message}
        </p>

        {/* DOTS */}

        {!error && (
          <div className="flex gap-2 mt-5">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="w-2 h-2 rounded-full bg-[#E6B72B] animate-bounce"
                style={{
                  animationDelay: `${dot * 150}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* RETRY */}

        {error && (
          <div className="flex gap-3 mt-7">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#E6B72B] text-black text-sm font-bold hover:bg-[#f0c94c] transition"
            >
              Try Again
            </button>

            <button
              onClick={() => router.replace("/lobby")}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm font-bold hover:bg-white/5 transition"
            >
              Back to Lobby
            </button>
          </div>
        )}
      </div>
    </main>
  );
}