"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { io, type Socket } from "socket.io-client";
import { ArrowLeft, Coins, Plus, X } from "lucide-react";

import PokerTable from "@/components/game/PokerTable";
import PlayerSeat, { type PlayerBot } from "@/components/game/PlayerSeat";
import ActionBar from "@/components/game/ActionBar";

type Card = {
  rank: string;
  suit: string;
};

type Player = PlayerBot & {
  username: string;
  chips: number;
  currentBet: number;
  folded: boolean;
  dealer: boolean;
  smallBlind?: boolean;
  bigBlind?: boolean;
  isBot?: boolean;
};

type Winner = {
  id: string;
  username: string;
  hand: string | null;
  winnerCards: Card[];
};

type Guest = {
  guestId: string;
  username: string;
  roomId: string;
};

const positions = ["bottomLeft", "left", "top", "right", "me"] as const;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

const cardBack = "/images/cards/back.png";

function getCardKey(card: Card) {
  return `${card.rank}${card.suit}`;
}

export default function BotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const socketRef = useRef<Socket | null>(null);
  const guestRef = useRef<Guest | null>(null);
  const joinedRef = useRef(false);
  const startedRef = useRef(false);
  const leavingRef = useRef(false);
  const mountedRef = useRef(false);
  const connectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [guest, setGuest] = useState<Guest | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameData, setGameData] = useState<any>({});
  const [winner, setWinner] = useState<Winner | null>(null);

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const [showRaise, setShowRaise] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(0);

  const [showBuyIn, setShowBuyIn] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState(0);

  const stakes = searchParams.get("stakes") || "10/20";
  const buyIn = Number(searchParams.get("chips") || 1000);
  const minBuyIn = Number(searchParams.get("minBuyIn") || 200);
  const maxBuyIn = Number(searchParams.get("maxBuyIn") || 10000);

  const [smallBlind, bigBlind] = useMemo(() => {
    const values = stakes.split("/").map(Number);

    return [
      Number.isFinite(values[0]) && values[0] > 0 ? values[0] : 10,
      Number.isFinite(values[1]) && values[1] > 0 ? values[1] : 20,
    ];
  }, [stakes]);

  const myPlayer = players.find(
    (player) => String(player.id) === String(guest?.guestId),
  );

  const myTurn = !!guest && String(gameData.turn) === String(guest.guestId);

  const communityCards: Card[] = gameData.communityCards || [];

  const cardImages = useMemo(() => {
    const images: Record<string, string> = {};
    const suits = ["h", "d", "c", "s"];
    const ranks = [
      "A",
      "K",
      "Q",
      "J",
      "10",
      "9",
      "8",
      "7",
      "6",
      "5",
      "4",
      "3",
      "2",
    ];

    ranks.forEach((rank) => {
      suits.forEach((suit) => {
        images[`${rank}${suit}`] = `/images/cards/${rank}${suit}.png`;
      });
    });

    return images;
  }, []);

  // --------------------------------------------------
  // SOCKET CONNECTION
  // --------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;
    leavingRef.current = false;
    joinedRef.current = false;
    startedRef.current = false;

    let socket: Socket | null = null;

    const clearConnectionTimer = () => {
      if (connectionTimerRef.current) {
        clearTimeout(connectionTimerRef.current);
        connectionTimerRef.current = null;
      }
    };

    const setConnectionError = (message: string) => {
      if (!mountedRef.current) return;

      clearConnectionTimer();
      setError(message);
      setLoading(false);
    };

    try {
      let guestId = localStorage.getItem("pikora_guest_id");

      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem("pikora_guest_id", guestId);
      }

      let username = localStorage.getItem("pikora_guest_name");

      if (!username) {
        username = `Guest${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem("pikora_guest_name", username);
      }

      const currentGuest: Guest = {
        guestId,
        username,
        roomId: `web-${guestId}`,
      };

      guestRef.current = currentGuest;
      setGuest(currentGuest);

      console.log("PIKORA guest:", currentGuest);
      console.log("PIKORA socket URL:", SOCKET_URL);

      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socketRef.current = socket;

      const joinGame = () => {
        if (!mountedRef.current || joinedRef.current) return;

        console.log("Sending join-game-bot-web");

        joinedRef.current = true;
        setConnected(true);
        setError("");
        setLoading(true);

        socket?.emit("join-game-bot-web", {
          roomId: currentGuest.roomId,
          guestId: currentGuest.guestId,
          username: currentGuest.username,
          smallBlind,
          bigBlind,
          chip: buyIn,
        });
      };

      socket.on("connect", () => {
        console.log("SOCKET CONNECTED:", socket?.id);

        if (!mountedRef.current) return;

        setConnected(true);
        setError("");
        joinGame();
      });

      socket.on("connect_error", (err) => {
        console.error("SOCKET CONNECT ERROR:", err);

        if (!mountedRef.current) return;

        setConnected(false);
        joinedRef.current = false;
        setConnectionError("Could not connect to the poker server.");
      });

      socket.on("disconnect", (reason) => {
        console.warn("SOCKET DISCONNECTED:", reason);

        if (!mountedRef.current) return;

        setConnected(false);
        joinedRef.current = false;

        if (!leavingRef.current) {
          setError("Connection to the server was interrupted.");
        }
      });

      socket.on("join-success-web", (result) => {
        console.log("JOIN SUCCESS:", result);

        if (!mountedRef.current) return;

        clearConnectionTimer();
        setError("");

        if (Array.isArray(result?.players)) {
          setPlayers(result.players);
        }

        if (startedRef.current) return;

        startedRef.current = true;

        console.log("Sending start-game-bot-web");

        socket?.emit("start-game-bot-web", {
          roomId: currentGuest.roomId,
          guestId: currentGuest.guestId,
        });
      });

      socket.on("join-game-bot-web-error", (result) => {
        console.error("JOIN ERROR:", result);

        if (!mountedRef.current) return;

        joinedRef.current = false;

        setConnectionError(
          result?.message || "Could not join the poker table.",
        );
      });

      socket.on("game-start-web", (data) => {
        console.log("GAME START:", data);

        if (!mountedRef.current) return;

        clearConnectionTimer();
        setPlayers(data?.players || []);
        setGameData(data || {});
        setWinner(data?.winner ?? null);
        setLoading(false);
        setError("");
      });

      socket.on("game-update-web", (data) => {
        console.log("GAME UPDATE:", data);

        if (!mountedRef.current) return;

        clearConnectionTimer();
        setPlayers(data?.players || []);
        setGameData(data || {});
        setWinner(data?.winner ?? null);
        setLoading(false);
      });

      socket.on("add-chips-success-web", (result) => {
        console.log("ADD CHIPS SUCCESS:", result);

        if (!mountedRef.current) return;

        setPlayers((currentPlayers) =>
          currentPlayers.map((player) =>
            String(player.id) === String(currentGuest.guestId)
              ? {
                  ...player,
                  chips: Number(result.tableChips),
                }
              : player,
          ),
        );

        setShowBuyIn(false);
        setError("");
      });

      socket.on("add-chips-error-web", (result) => {
        console.error("ADD CHIPS ERROR:", result);

        if (!mountedRef.current) return;

        setError(result?.message || "Could not add chips.");
      });

      // Timeout prevents an endless loading screen.
      connectionTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;

        if (!joinedRef.current) {
          setConnectionError(
            "Server connected, but joining the table timed out.",
          );
        } else if (loading) {
          setConnectionError("Waiting for the game to start timed out.");
        }
      }, 15000);

      // In case the socket connected before listeners were registered.
      if (socket.connected) {
        joinGame();
      }
    } catch (err) {
      console.error("GAME INITIALIZATION ERROR:", err);
      setConnectionError("Game initialization failed.");
    }

    return () => {
      mountedRef.current = false;
      clearConnectionTimer();

      const currentSocket = socketRef.current;
      const currentGuest = guestRef.current;

      if (currentSocket) {
        if (currentSocket.connected && currentGuest && !leavingRef.current) {
          currentSocket.emit("leave-game-bot-web", {
            roomId: currentGuest.roomId,
            guestId: currentGuest.guestId,
          });
        }

        currentSocket.removeAllListeners();
        currentSocket.disconnect();

        if (socketRef.current === currentSocket) {
          socketRef.current = null;
        }
      }

      joinedRef.current = false;
      startedRef.current = false;
    };
  }, [smallBlind, bigBlind, buyIn]);

  // --------------------------------------------------
  // GAME ACTIONS
  // --------------------------------------------------

  const emitAction = useCallback(
    (action: string, amount = 0) => {
      const socket = socketRef.current;
      const currentGuest = guestRef.current;

      if (!socket?.connected || !currentGuest || !myTurn) {
        console.warn("Action ignored:", {
          connected: socket?.connected,
          guest: !!currentGuest,
          myTurn,
        });
        return;
      }

      socket.emit("action-web", {
        roomId: currentGuest.roomId,
        guestId: currentGuest.guestId,
        action,
        amount,
      });
    },
    [myTurn],
  );

  const handleFold = () => emitAction("FOLD");
  const handleCall = () => emitAction("CALL");
  const handleAllIn = () => emitAction("ALL_IN");

  const handleRaise = (amount: number) => {
    emitAction("RAISE", amount);
    setShowRaise(false);
  };

  // --------------------------------------------------
  // ADD CHIPS
  // --------------------------------------------------

  const handleBuyIn = () => {
    const socket = socketRef.current;
    const currentGuest = guestRef.current;

    if (!socket?.connected || !currentGuest) return;

    if (
      !Number.isInteger(buyInAmount) ||
      buyInAmount < minBuyIn ||
      buyInAmount > maxBuyIn
    ) {
      setError("Please enter a valid chip amount.");
      return;
    }

    socket.emit("add-chips-bot-web", {
      roomId: currentGuest.roomId,
      guestId: currentGuest.guestId,
      amount: buyInAmount,
    });
  };

  // --------------------------------------------------
  // LEAVE GAME
  // --------------------------------------------------

  const leaveGame = () => {
    if (leavingRef.current) return;

    leavingRef.current = true;

    const socket = socketRef.current;
    const currentGuest = guestRef.current;

    if (socket?.connected && currentGuest) {
      socket.emit("leave-game-bot-web", {
        roomId: currentGuest.roomId,
        guestId: currentGuest.guestId,
      });
    }

    socket?.disconnect();
    router.push("/");
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-[#080d0b] p-4"
        style={{
          backgroundImage: "url('/images/poker-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-[#c9a45c]/20 bg-black/70 px-8 py-10 text-center backdrop-blur-xl">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#c9a45c]" />

          <p className="text-sm font-semibold tracking-[0.2em] text-[#d6b66e]">
            PIKORA
          </p>

          <p className="text-sm text-white/60">
            {connected
              ? "Joining poker table..."
              : "Connecting to poker server..."}
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {error && (
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[#c9a45c] px-5 py-2 text-sm font-bold text-black"
            >
              TRY AGAIN
            </button>
          )}
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#080d0b] text-white"
      style={{
        backgroundImage: "url('/images/poker-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/35" />

      <header className="absolute left-0 right-0 top-0 z-40 flex items-center justify-between px-5 py-5 sm:px-8">
        <button
          onClick={leaveGame}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 transition hover:border-[#c9a45c] hover:bg-black/80"
        >
          <ArrowLeft size={21} />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-black tracking-[0.3em] text-[#d6b66e]">
            PIKORA
          </h1>

          <p className="text-[10px] tracking-[0.25em] text-white/50">
            BOT POKER · {guest?.username}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />

          <span className="text-xs text-white/70">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>

      {error && (
        <div className="absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-lg border border-red-500/30 bg-black/90 px-5 py-3 text-center text-sm text-red-300">
          {error}

          <button
            onClick={() => setError("")}
            className="ml-3 text-white/60 hover:text-white"
          >
            <X size={14} className="inline" />
          </button>
        </div>
      )}

      <section className="relative min-h-screen w-full">
        <PokerTable>
          <div className="absolute left-1/2 top-[33%] z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center rounded-xl border border-[#d6b66e]/20 bg-black/30 px-5 py-2 backdrop-blur-sm">
              <span className="text-[10px] tracking-[0.2em] text-white/50">
                TOTAL POT
              </span>

              <div className="flex items-center gap-2 text-lg font-black text-[#f5d47e]">
                <Coins size={17} />
                {(gameData.pot || 0).toLocaleString("en-US")}
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 top-[47%] z-10 flex -translate-x-1/2 -translate-y-1/2 gap-1.5 sm:gap-2">
            {[0, 1, 2, 3, 4].map((index) => {
              const card = communityCards[index];

              const src = card
                ? cardImages[getCardKey(card)] || cardBack
                : null;

              return (
                <div
                  key={index}
                  className="relative h-12 w-8 overflow-hidden rounded-md border border-white/20 bg-black/20 shadow-lg sm:h-[70px] sm:w-12"
                >
                  {src && (
                    <Image
                      src={src}
                      alt="Community card"
                      fill
                      sizes="48px"
                      className="object-fill"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </PokerTable>

        {players.map((player, index) => {
          const position = positions[index];

          if (!position) return null;

          return (
            <PlayerSeat
              key={player.id}
              position={position}
              player={player}
              name={player.username}
              chips={player.chips}
              turn={gameData.turn}
              gameState={gameData.state}
              winner={winner}
              avatarUrl={
                !player.isBot ? "/images/avatars/default.png" : undefined
              }
              avatarImages={{
                bot1: "/images/avatars/ali.png",
                bot2: "/images/avatars/sara.png",
                bot3: "/images/avatars/reza.png",
                bot4: "/images/avatars/mina.png",
              }}
              cardImages={cardImages}
              cardBack={cardBack}
            />
          );
        })}

        {winner && (
          <div className="absolute left-1/2 top-[65%] z-30 -translate-x-1/2 rounded-xl border border-[#d6b66e]/40 bg-black/80 px-8 py-4 text-center shadow-2xl backdrop-blur-md">
            <p className="text-xs tracking-[0.25em] text-[#d6b66e]">WINNER</p>

            <h2 className="mt-1 text-xl font-black">{winner.username}</h2>

            {winner.hand && (
              <p className="mt-1 text-sm text-white/60">{winner.hand}</p>
            )}
          </div>
        )}

        <ActionBar
          disabled={!myTurn || !connected}
          onFold={handleFold}
          onCall={handleCall}
          onAllIn={handleAllIn}
          onRaise={() => {
            setRaiseAmount(bigBlind * 2);
            setShowRaise(true);
          }}
        />

        <div className="absolute bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-[#d6b66e]/20 bg-black/60 px-5 py-2 backdrop-blur-md">
          <span className="text-xs text-white/50">YOUR CHIPS</span>

          <span className="font-bold text-[#f5d47e]">
            {(myPlayer?.chips || 0).toLocaleString("en-US")}
          </span>

          <button
            onClick={() => {
              setBuyInAmount(Math.min(bigBlind * 10, maxBuyIn));
              setShowBuyIn(true);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c9a45c] text-black transition hover:bg-[#e6c77d]"
          >
            <Plus size={17} />
          </button>
        </div>
      </section>

      {showRaise && myPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#c9a45c]/30 bg-[#101713] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#d6b66e]">Raise Amount</h2>

              <button onClick={() => setShowRaise(false)}>
                <X size={20} />
              </button>
            </div>

            <p className="mb-3 text-sm text-white/50">
              Select your raise amount
            </p>

            <div className="mb-5 rounded-xl bg-black/40 p-4 text-center">
              <span className="text-2xl font-black text-[#f5d47e]">
                {raiseAmount.toLocaleString("en-US")}
              </span>
            </div>

            <input
              type="range"
              min={bigBlind}
              max={Math.max(bigBlind, myPlayer.chips)}
              step={bigBlind}
              value={Math.min(raiseAmount, Math.max(bigBlind, myPlayer.chips))}
              onChange={(event) => setRaiseAmount(Number(event.target.value))}
              className="mb-6 w-full accent-[#c9a45c]"
            />

            <button
              onClick={() => handleRaise(raiseAmount)}
              disabled={
                raiseAmount <= 0 || raiseAmount > myPlayer.chips || !myTurn
              }
              className="w-full rounded-xl bg-[#c9a45c] py-3 font-bold text-black transition hover:bg-[#e6c77d] disabled:opacity-40"
            >
              CONFIRM RAISE
            </button>
          </div>
        </div>
      )}

      {showBuyIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#c9a45c]/30 bg-[#101713] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#d6b66e]">Add Chips</h2>

              <button onClick={() => setShowBuyIn(false)}>
                <X size={20} />
              </button>
            </div>

            <p className="mb-2 text-sm text-white/50">Amount to add</p>

            <input
              type="number"
              min={minBuyIn}
              max={maxBuyIn}
              value={buyInAmount}
              onChange={(event) => setBuyInAmount(Number(event.target.value))}
              className="mb-5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#c9a45c]"
            />

            <p className="mb-5 text-xs text-white/40">
              Min: {minBuyIn.toLocaleString("en-US")} | Max:{" "}
              {maxBuyIn.toLocaleString("en-US")}
            </p>

            <button
              onClick={handleBuyIn}
              disabled={
                buyInAmount < minBuyIn || buyInAmount > maxBuyIn || !connected
              }
              className="w-full rounded-xl bg-[#c9a45c] py-3 font-bold text-black transition hover:bg-[#e6c77d] disabled:opacity-40"
            >
              ADD CHIPS
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
