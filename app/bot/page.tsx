
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import {
  ArrowLeft,
  Coins,
  Plus,
  X,
  Loader2,
  Smartphone,
  RotateCw,
} from "lucide-react";

import PokerTable from "@/components/game/PokerTable";
import PlayerSeat, { type PlayerBot } from "@/components/game/PlayerSeat";
import ActionBar from "@/components/game/ActionBar";

import { getCardImage } from "@/utils/cardImages";
import { avatarImages, tableImages } from "@/utils/assets";

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
};

type Winner = {
  id: string;
  username: string;
  hand: string | null;
  winnerCards?: Card[];
  winningCards?: Card[];
};

type Guest = {
  guestId: string;
  username: string;
  roomId: string;
};

const positions = ["bottomLeft", "left", "top", "right", "me"] as const;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://poker-server-2-iv79.onrender.com";

const CARD_BACK = "/images/cards/back.png";

function getGuestId() {
  let id = localStorage.getItem("pikora_guest_id");

  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem("pikora_guest_id", id);
  }

  return id;
}

function getGuestName() {
  let name = localStorage.getItem("pikora_guest_name");

  if (!name) {
    name = `Guest${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem("pikora_guest_name", name);
  }

  return name;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-US");
}

// ==================================================
// BOT PAGE CONTENT
// ==================================================

function BotPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const socketRef = useRef<Socket | null>(null);
  const guestRef = useRef<Guest | null>(null);

  const joinedRef = useRef(false);
  const startedRef = useRef(false);
  const leavingRef = useRef(false);
  const mountedRef = useRef(false);

  const connectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // ORIENTATION
  const [isLandscape, setIsLandscape] = useState(false);
  const [orientationReady, setOrientationReady] = useState(false);

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

  const [cardDesign, setCardDesign] = useState("default");
  const [tableBackground, setTableBackground] = useState("default");
  const [avatar, setAvatar] = useState("avatar1");

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

  const myTurn =
    !!guest && String(gameData.turn) === String(guest.guestId);

  const communityCards: Card[] = gameData.communityCards || [];

  const selectedTable = tableImages.find(
    (item) => item.id === tableBackground,
  );

  const backgroundImage =
    selectedTable?.source ||
    tableImages.find((item) => item.id === "default")?.source ||
    "/images/backgrounds/Dark.png";

  const clearConnectionTimer = () => {
    if (connectionTimerRef.current) {
      clearTimeout(connectionTimerRef.current);
      connectionTimerRef.current = null;
    }
  };

  // --------------------------------------------------
  // AUTOMATIC LANDSCAPE REQUEST
  // --------------------------------------------------

const handleLandscape = useCallback(async () => {
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch (error) {
    console.log("Landscape lock is not supported:", error);
  }

  setTimeout(() => {
    setIsLandscape(window.innerWidth > window.innerHeight);
  }, 300);
}, []);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    // Show loading for 2 seconds, then request landscape.
    const timer = setTimeout(async () => {
      await handleLandscape();
      checkOrientation();
      setOrientationReady(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);

      try {
        screen.orientation?.unlock();
      } catch {}
    };
  }, [handleLandscape]);

  // --------------------------------------------------
  // LOAD SAVED VISUAL SETTINGS
  // --------------------------------------------------

  useEffect(() => {
    setCardDesign(
      localStorage.getItem("pikora_card_design") || "default",
    );

    setTableBackground(
      localStorage.getItem("pikora_table_background") || "default",
    );

    setAvatar(localStorage.getItem("pikora_avatar") || "avatar1");
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

    const setConnectionError = (message: string) => {
      if (!mountedRef.current) return;

      clearConnectionTimer();
      setError(message);
      setLoading(false);
    };

    const initialize = () => {
      try {
        const currentGuest: Guest = {
          guestId: getGuestId(),
          username: getGuestName(),
          roomId: `web-${getGuestId()}`,
        };

        guestRef.current = currentGuest;
        setGuest(currentGuest);

        console.log("PIKORA GUEST:", currentGuest);
        console.log("PIKORA SOCKET:", SOCKET_URL);

        setLoading(true);

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

          joinedRef.current = true;

          setConnected(true);
          setError("");
          setLoading(true);

          const payload = {
            roomId: currentGuest.roomId,
            guestId: currentGuest.guestId,
            username: currentGuest.username,
            smallBlind,
            bigBlind,
            chip: buyIn,
          };

          console.log("JOIN BOT WEB:", payload);

          socket?.emit("join-game-bot-web", payload);
        };

        socket.on("connect", () => {
          console.log("SOCKET CONNECTED:", socket?.id);

          if (!mountedRef.current) return;

          setConnected(true);
          setError("");

          joinGame();
        });

        socket.on("connect_error", (err) => {
          console.error("SOCKET ERROR:", err);

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

        connectionTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;

          if (!joinedRef.current) {
            setConnectionError(
              "Server connected, but joining the table timed out.",
            );
          } else {
            setConnectionError("Waiting for the game to start timed out.");
          }
        }, 15000);

        if (socket.connected) {
          joinGame();
        }
      } catch (err) {
        console.error("GAME INITIALIZATION ERROR:", err);
        setConnectionError("Game initialization failed.");
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;
      clearConnectionTimer();

      const currentSocket = socketRef.current;
      const currentGuest = guestRef.current;

      if (currentSocket) {
        if (
          currentSocket.connected &&
          currentGuest &&
          !leavingRef.current
        ) {
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
        console.warn("ACTION IGNORED:", {
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

  const handleRaise = () => {
    if (!Number.isFinite(raiseAmount) || raiseAmount <= 0) return;

    emitAction("RAISE", raiseAmount);
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
      setError(
        `Enter an amount between ${formatNumber(minBuyIn)} and ${formatNumber(maxBuyIn)}.`,
      );
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
  // INITIAL LANDSCAPE LOADING
  // --------------------------------------------------

  if (!orientationReady) {
    return (
      <main className="fixed inset-0 z-[9999] flex min-h-[100dvh] items-center justify-center bg-[#07130f] px-6 text-white">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-7 flex h-28 w-28 items-center justify-center rounded-3xl border border-amber-400/30 bg-black/40 shadow-2xl shadow-amber-500/10">
            <Smartphone className="h-16 w-16 text-amber-400" />
            <div className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/30 bg-[#10251b]">
              <RotateCw className="h-5 w-5 animate-spin text-amber-400" />
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-widest text-amber-400">
            PIKORA
          </h1>

          <p className="mt-4 text-sm text-white/60">
            Preparing your poker table...
          </p>

          <Loader2 className="mt-6 h-7 w-7 animate-spin text-amber-400" />
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // LANDSCAPE REQUIRED
  // --------------------------------------------------

  if (!isLandscape) {
    return (
      <main className="fixed inset-0 z-[9999] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#07130f] px-6 text-white">
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="relative mb-8 flex h-28 w-28 items-center justify-center rounded-3xl border border-amber-400/30 bg-black/40 shadow-2xl shadow-amber-500/10">
            <Smartphone className="h-16 w-16 rotate-90 text-amber-400" />

            <div className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/30 bg-[#10251b]">
              <RotateCw className="h-5 w-5 animate-spin text-amber-400" />
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-widest text-amber-400">
            PIKORA
          </h1>

          <h2 className="mt-4 text-lg font-bold">
            Please Rotate Your Phone
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/60">
            Turn your phone horizontally to continue playing poker.
          </p>

          <button
            onClick={handleLandscape}
            className="mt-7 flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-amber-400"
          >
            <RotateCw size={17} />
            Try Landscape Mode
          </button>

          <button
            onClick={leaveGame}
            className="mt-7 flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to lobby
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main
        className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-cover bg-center px-4 text-white"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/30 bg-black/50">
            <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold tracking-widest">
              PIKORA POKER
            </h2>

            <p className="mt-2 text-sm text-white/60">
              {!connected
                ? "Connecting to server..."
                : joinedRef.current
                  ? "Preparing your table..."
                  : "Joining poker table..."}
            </p>
          </div>

          {error && (
            <div className="max-w-sm rounded-xl border border-red-500/30 bg-red-950/80 px-5 py-4 text-center">
              <p className="text-sm text-red-300">{error}</p>

              <button
                onClick={() => window.location.reload()}
                className="mt-3 rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold"
              >
                Try again
              </button>
            </div>
          )}

          <button
            onClick={leaveGame}
            className="mt-4 flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to lobby
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN GAME UI
  // --------------------------------------------------

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden bg-cover bg-center bg-no-repeat text-white"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      <div className="absolute inset-0 bg-black/25" />

      {/* BACK BUTTON */}
      <button
        onClick={leaveGame}
        className="absolute left-2 top-2 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 backdrop-blur-md transition hover:bg-black/80 sm:left-5 sm:top-5 sm:h-11 sm:w-11"
      >
        <ArrowLeft size={20} className="sm:h-[22px] sm:w-[22px]" />
      </button>

      {/* CONNECTION STATUS */}
      <div className="absolute right-2 top-2 z-50 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1.5 text-[10px] backdrop-blur-md sm:right-5 sm:top-5 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs">
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? "bg-green-400" : "bg-red-500"
          }`}
        />
        {connected ? "Connected" : "Disconnected"}
      </div>

      {/* TABLE AREA */}
      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-1 pb-28 pt-14 sm:px-4 sm:py-20 landscape:px-2 landscape:pb-20 landscape:pt-12">
        <div className="relative flex h-[58dvh] w-full max-w-[1250px] items-center justify-center sm:h-[min(78vh,760px)] landscape:h-[calc(100dvh-100px)]">
          {/* POKER TABLE */}
          <div className="absolute inset-x-[5%] inset-y-[17%] sm:inset-x-[8%] sm:inset-y-[15%] landscape:inset-x-[12%] landscape:inset-y-[12%]">
            <PokerTable />
          </div>

          {/* PLAYERS */}
          {players.map((player, index) => {
            if (index >= positions.length) return null;

            const avatarKey =
              player.id === guest?.guestId
                ? avatar
                : `avatar${(index % 12) + 1}`;

            return (
              <PlayerSeat
                key={player.id}
                position={positions[index]}
                player={player}
                turn={gameData.turn}
                name={player.username}
                chips={player.chips}
                cardDesign={cardDesign}
                avatarUrl={
                  avatarImages[avatarKey] || avatarImages.avatar1
                }
                cardBack={CARD_BACK}
                winner={winner}
              />
            );
          })}

          {/* POT */}
          <div className="absolute left-1/2 top-[17%] z-20 -translate-x-1/2 -translate-y-1/2">
            <div className="flex min-w-[95px] flex-col items-center rounded-xl border border-amber-300/20 bg-black/65 px-3 py-1.5 shadow-xl backdrop-blur-md sm:min-w-[125px] sm:rounded-2xl sm:px-5 sm:py-2">
              <span className="text-[8px] font-bold tracking-[0.2em] text-amber-300/70 sm:text-[10px] sm:tracking-[0.25em]">
                TOTAL POT
              </span>

              <div className="mt-1 flex items-center gap-1.5 sm:gap-2">
                <Coins size={14} className="text-amber-400 sm:h-[17px] sm:w-[17px]" />

                <span className="text-base font-black tabular-nums sm:text-xl">
                  {formatNumber(gameData.pot || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* COMMUNITY CARDS */}
          <div className="absolute left-1/2 top-[49%] z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 sm:gap-3 landscape:gap-2">
            {communityCards.map((card, index) => (
              <div
                key={`${card.rank}${card.suit}-${index}`}
                className="relative h-[clamp(48px,12vh,115px)] w-[clamp(34px,6vw,78px)] overflow-hidden rounded-md border border-white/20 bg-white shadow-[0_8px_20px_rgba(0,0,0,.4)] sm:h-[clamp(65px,14vh,115px)] sm:w-[clamp(46px,7vw,78px)] sm:rounded-lg"
              >
                <img
                  src={getCardImage(
                    cardDesign,
                    card.rank,
                    card.suit.toUpperCase(),
                  )}
                  alt={`${card.rank}${card.suit}`}
                  className="h-full w-full object-fill"
                />
              </div>
            ))}
          </div>

          {/* EMPTY COMMUNITY CARD SLOTS */}
          {communityCards.length === 0 && (
            <div className="absolute left-1/2 top-[49%] z-10 flex -translate-x-1/2 -translate-y-1/2 gap-1 opacity-20 sm:gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[clamp(48px,12vh,115px)] w-[clamp(34px,6vw,78px)] rounded-md border border-dashed border-white/50 sm:h-[clamp(65px,10vh,115px)] sm:w-[clamp(46px,7vw,78px)] sm:rounded-lg"
                />
              ))}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="absolute bottom-24 left-1/2 z-50 max-w-[90%] -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-950/90 px-4 py-2 text-center text-xs text-red-200 shadow-xl sm:px-5 sm:py-3 sm:text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="absolute bottom-0 left-0 right-0 z-40">
        <ActionBar
          disabled={!myTurn || !connected}
          onFold={handleFold}
          onCall={handleCall}
          onRaise={() => {
            setRaiseAmount(Math.min(bigBlind * 2, myPlayer?.chips || 0));
            setShowRaise(true);
          }}
          onAllIn={handleAllIn}
        />
      </div>

      {/* TABLE CHIPS */}
      <button
        onClick={() => {
          setBuyInAmount(minBuyIn);
          setShowBuyIn(true);
        }}
        className="absolute bottom-[5.5rem] left-2 z-40 flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-black/70 px-2.5 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition hover:bg-black sm:bottom-14 sm:left-5 sm:gap-2 sm:px-4 sm:py-3 sm:text-sm landscape:bottom-14"
      >
        <Plus size={15} className="text-amber-400 sm:h-[17px] sm:w-[17px]" />
        Add Chips
      </button>

      {/* RAISE MODAL */}
      {showRaise && myPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-4">
          <div className="my-auto w-full max-w-sm rounded-2xl border border-white/10 bg-[#111713] p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between sm:mb-6">
              <h3 className="text-base font-bold sm:text-lg">
                Raise Bet
              </h3>

              <button
                onClick={() => setShowRaise(false)}
                className="text-white/50 hover:text-white"
              >
                <X size={21} />
              </button>
            </div>

            <div className="mb-3 flex justify-between text-sm text-white/50">
              <span>Raise amount</span>
              <span>{formatNumber(raiseAmount)}</span>
            </div>

            <input
              type="range"
              min={bigBlind}
              max={Math.max(bigBlind, myPlayer.chips)}
              step={bigBlind}
              value={Math.min(
                Math.max(raiseAmount, bigBlind),
                Math.max(bigBlind, myPlayer.chips),
              )}
              onChange={(event) =>
                setRaiseAmount(Number(event.target.value))
              }
              className="w-full accent-amber-400"
            />

            <div className="mt-2 flex justify-between text-xs text-white/40">
              <span>{formatNumber(bigBlind)}</span>
              <span>{formatNumber(myPlayer.chips)}</span>
            </div>

            <button
              onClick={handleRaise}
              disabled={!myTurn || raiseAmount < bigBlind}
              className="mt-5 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40 sm:mt-6 sm:text-base"
            >
              Confirm Raise
            </button>
          </div>
        </div>
      )}

      {/* BUY CHIPS MODAL */}
      {showBuyIn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-4">
          <div className="my-auto w-full max-w-sm rounded-2xl border border-white/10 bg-[#111713] p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between sm:mb-6">
              <h3 className="text-base font-bold sm:text-lg">
                Add Table Chips
              </h3>

              <button
                onClick={() => setShowBuyIn(false)}
                className="text-white/50 hover:text-white"
              >
                <X size={21} />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-white/5 p-3 sm:mb-5 sm:p-4">
              <p className="text-xs text-white/40">
                Current table chips
              </p>

              <p className="mt-1 text-lg font-bold sm:text-xl">
                {formatNumber(myPlayer?.chips || 0)}
              </p>
            </div>

            <label className="mb-2 block text-sm text-white/60">
              Chip amount
            </label>

            <input
              type="number"
              min={minBuyIn}
              max={maxBuyIn}
              value={buyInAmount}
              onChange={(event) =>
                setBuyInAmount(Number(event.target.value))
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-amber-400 sm:text-base"
            />

            <p className="mt-2 text-xs text-white/40">
              Min: {formatNumber(minBuyIn)} · Max:{" "}
              {formatNumber(maxBuyIn)}
            </p>

            <button
              onClick={handleBuyIn}
              disabled={!connected}
              className="mt-5 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-40 sm:mt-6 sm:text-base"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* WINNER BANNER */}
      {winner && (
        <div className="pointer-events-none fixed left-1/2 top-14 z-[60] max-w-[90%] -translate-x-1/2 sm:top-24">
          <div className="rounded-2xl border border-amber-300/30 bg-black/85 px-5 py-3 text-center shadow-2xl backdrop-blur-md sm:px-8 sm:py-4">
            <p className="text-[10px] font-bold tracking-[0.3em] text-amber-300 sm:text-xs">
              WINNER
            </p>

            <h2 className="mt-1 text-xl font-black sm:text-2xl">
              {winner.username}
            </h2>

            {winner.hand && (
              <p className="mt-1 text-xs text-white/60 sm:text-sm">
                {winner.hand}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ==================================================
// PAGE WITH SUSPENSE
// ==================================================

export default function BotPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#080b09] text-white">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
        </main>
      }
    >
      <BotPageContent />
    </Suspense>
  );
}
