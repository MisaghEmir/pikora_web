
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  POKER_TABLES,
  type PokerTable,
} from "@/config/tables";

type User = {
  _id?: string;
  id?: string;
  username?: string;
  chips: number;
  [key: string]: any;
};

export default function LobbyPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [selectedTable, setSelectedTable] =
    useState<PokerTable | null>(null);

  const [buyIn, setBuyIn] = useState(0);
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (!parsedUser) {
        router.replace("/login");
        return;
      }

      setUser(parsedUser);
    } catch {
      localStorage.removeItem("user");
      router.replace("/login");
    } finally {
      setLoadingUser(false);
    }
  }, [router]);

  const showError = (message: string) => {
    setErrorMessage(message);

    setTimeout(() => {
      setErrorMessage("");
    }, 2500);
  };

  const handleTablePress = (table: PokerTable) => {
    if (!user) return;

    const chips = Number(user.chips) || 0;

    if (chips < table.minChips) {
      showError(
        `You need at least ${table.minChips.toLocaleString()} chips`
      );
      return;
    }

    setSelectedTable(table);
    setBuyIn(table.minChips);
  };

  const handleJoinTable = async () => {
    if (!selectedTable || !user || joining) return;

    const currentChips = Number(user.chips) || 0;

    if (buyIn <= 0) {
      showError("Invalid buy-in amount");
      return;
    }

    if (buyIn < selectedTable.minChips) {
      showError("Buy-in is below the minimum amount");
      return;
    }

    if (buyIn > selectedTable.maxChips) {
      showError("Buy-in exceeds the maximum amount");
      return;
    }

    if (buyIn > currentChips) {
      showError("Not enough chips");
      return;
    }

    try {
      setJoining(true);

      const response = await api.post("/auth/chips/deduct", {
        amount: buyIn,
      });

      const newChips = Number(response.data?.chips);

      if (!Number.isFinite(newChips)) {
        throw new Error("Invalid chips response");
      }

      const updatedUser = {
        ...user,
        chips: newChips,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      const stakes = selectedTable.stakes;
      const chips = buyIn;

      setSelectedTable(null);

      router.push(
        `/finding-table?stakes=${encodeURIComponent(stakes)}&chips=${chips}`
      );
    } catch (error: any) {
      console.error(
        "DEDUCT CHIPS ERROR:",
        error?.response?.data || error
      );

      showError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to use chips"
      );
    } finally {
      setJoining(false);
    }
  };

  if (loadingUser || !user) {
    return (
      <main className="min-h-screen bg-[#0c100e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#d6a83b] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-white/50">Loading lobby...</p>
        </div>
      </main>
    );
  }

  const availableChips = Number(user.chips) || 0;

  const sliderMax = selectedTable
    ? Math.min(selectedTable.maxChips, availableChips)
    : 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0c100e] text-white">
      {/* BACKGROUND */}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(25,75,48,0.25),_transparent_65%)]" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#c99a32]/[0.06] blur-[130px] rounded-full" />
      </div>

      {/* HEADER */}

      <header className="relative z-10 flex items-center justify-between px-5 md:px-10 py-5 border-b border-white/[0.07] bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center transition"
            aria-label="Back to home"
          >
            <span className="text-xl">←</span>
          </button>

          <div>
            <h1 className="text-lg md:text-xl font-black tracking-[0.18em]">
              PIKORA
            </h1>
            <p className="text-[10px] text-white/40 tracking-[0.2em]">
              POKER LOBBY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs text-white/40">Welcome</p>
            <p className="text-sm font-bold">
              {user.username || "Player"}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#d6a83b]/30 bg-[#d6a83b]/10 px-4 py-2">
            <span className="text-lg">🪙</span>
            <span className="text-sm font-bold text-[#e6bd59] tabular-nums">
              {availableChips.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* CONTENT */}

      <section className="relative z-10 max-w-[1500px] mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-20">
        <div className="mb-8 md:mb-12">
          <p className="text-[#d6a83b] text-xs tracking-[0.3em] font-bold mb-3">
            CHOOSE YOUR TABLE
          </p>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Poker Tables
          </h2>

          <p className="text-white/45 text-sm mt-3">
            Select a table and choose your buy-in to start playing.
          </p>
        </div>

        {/* TABLE LIST */}

        <div className="flex gap-5 overflow-x-auto pb-8 snap-x snap-mandatory [scrollbar-width:thin] [scrollbar-color:#6e5728_transparent]">
          {POKER_TABLES.map((table) => {
            const canJoin = availableChips >= table.minChips;

            return (
              <button
                key={table.id}
                onClick={() => handleTablePress(table)}
                className="group relative flex-shrink-0 w-[270px] sm:w-[310px] h-[390px] rounded-3xl overflow-hidden text-left border border-white/10 hover:border-[#d6a83b]/60 transition-all duration-300 hover:-translate-y-2 snap-start"
              >
                {/* TABLE IMAGE */}

                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{
                    backgroundImage: `url("${table.background}")`,
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#080d0a] via-black/35 to-black/10" />

                <div className="absolute inset-0 bg-[#10251a]/20 group-hover:bg-transparent transition" />

                {/* LEVEL */}

                <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                  <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-wider">
                    LEVEL {table.level}
                  </span>

                  <span
                    className={`w-2 h-2 rounded-full ${
                      canJoin ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                </div>

                {/* TABLE INFO */}

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[#e5bd5c] text-[10px] tracking-[0.25em] font-bold mb-2">
                    {table.gameType === "online"
                      ? "ONLINE GAME"
                      : "BOT GAME"}
                  </p>

                  <h3 className="text-2xl font-black tracking-wide">
                    {table.title}
                  </h3>

                  <div className="mt-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-xs">
                        Stakes
                      </span>
                      <span className="font-bold text-sm">
                        {table.stakes}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-xs">
                        Buy-in
                      </span>
                      <span className="font-bold text-sm text-[#e6bd59]">
                        {table.buy}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-xs">
                        Players
                      </span>
                      <span className="font-bold text-sm">
                        {table.spots}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 w-full h-11 rounded-xl bg-[#c99a32] group-hover:bg-[#e0b84e] text-black font-black text-xs tracking-widest flex items-center justify-center transition">
                    {canJoin ? "SELECT TABLE" : "NOT ENOUGH CHIPS"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* FOOTER INFO */}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
          <p className="text-xs text-white/35">
            Choose a table that matches your chip balance.
          </p>

          <button
            onClick={() => router.push("/")}
            className="text-xs text-[#d6a83b] hover:text-[#f0cf72] transition"
          >
            Back to Home →
          </button>
        </div>
      </section>

      {/* ERROR TOAST */}

      {errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-32px)] max-w-md">
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-[#211615] px-5 py-4 shadow-2xl">
            <span className="text-xl">⚠️</span>

            <div>
              <p className="text-sm font-bold text-white">
                Not enough chips
              </p>
              <p className="text-xs text-white/60 mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BUY-IN MODAL */}

      {selectedTable && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !joining
            ) {
              setSelectedTable(null);
            }
          }}
        >
          <div className="relative w-full max-w-[430px] rounded-[28px] border border-[#d6a83b]/25 bg-[#171b19] p-6 sm:p-8 shadow-[0_25px_100px_rgba(0,0,0,0.7)]">
            {/* CLOSE */}

            <button
              onClick={() => setSelectedTable(null)}
              disabled={joining}
              className="absolute top-4 right-5 text-3xl text-white/40 hover:text-white transition disabled:opacity-30"
              aria-label="Close"
            >
              ×
            </button>

            {/* TITLE */}

            <div className="text-center mt-3">
              <p className="text-[10px] text-[#d6a83b] tracking-[0.3em] font-bold">
                PIKORA TABLE
              </p>

              <h3 className="text-2xl font-black mt-3">
                {selectedTable.title}
              </h3>

              <p className="text-[#d6a83b] text-sm mt-2">
                Stakes {selectedTable.stakes}
              </p>
            </div>

            {/* BUY IN */}

            <div className="mt-9 text-center">
              <p className="text-sm text-white/45">
                Choose your buy-in
              </p>

              <div className="text-4xl font-black text-[#e6bd59] mt-3 tabular-nums">
                {buyIn.toLocaleString()}
              </div>

              <p className="text-xs text-white/40 mt-3">
                Your chips:{" "}
                <span className="text-white font-bold">
                  {availableChips.toLocaleString()}
                </span>
              </p>
            </div>

            {/* SLIDER */}

            <div className="mt-9">
              <input
                type="range"
                min={selectedTable.minChips}
                max={sliderMax}
                step={selectedTable.minChips}
                value={Math.min(buyIn, sliderMax)}
                onChange={(event) =>
                  setBuyIn(Number(event.target.value))
                }
                disabled={joining || sliderMax <= selectedTable.minChips}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#d6a83b] bg-[#3b3d39] disabled:opacity-40"
                style={{
                  background: `linear-gradient(to right, #d6a83b ${
                    sliderMax > selectedTable.minChips
                      ? ((buyIn - selectedTable.minChips) /
                          (sliderMax - selectedTable.minChips)) *
                        100
                      : 0
                  }%, #3b3d39 0%)`,
                }}
              />

              <div className="flex justify-between mt-3 text-[11px] text-white/40 tabular-nums">
                <span>
                  {selectedTable.minChips.toLocaleString()}
                </span>

                <span>
                  {sliderMax.toLocaleString()}
                </span>
              </div>
            </div>

            {/* JOIN BUTTON */}

            <button
              onClick={handleJoinTable}
              disabled={joining}
              className="w-full h-14 mt-9 rounded-xl bg-gradient-to-r from-[#bd8524] to-[#e5bd55] hover:brightness-110 text-black font-black text-sm tracking-[0.15em] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? "JOINING..." : "JOIN TABLE"}
            </button>

            <p className="text-center text-[10px] text-white/25 mt-5">
              Your buy-in will be deducted from your balance.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
