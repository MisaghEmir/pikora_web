
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
import { api } from "@/lib/api";

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
  hand: Card[];
  lastAction?: string | null;
};

type Winner = {
  id?: string;
  username?: string;
  hand?: string | null;
  winnerCards?: Card[];
  winningCards?: Card[];
};

type OnlineTable = {
  _id: string;
  buyIn?: number;
};

type StoredUser = {
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  chips?: number;
  activeTableBackground?: string;
  activeCardDesign?: string;
};

const positions = ["bottomLeft", "left", "top", "right", "me"] as const;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://poker-server-4oi4.onrender.com";

const CARD_BACK = "/images/cards/back.png";

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-US");
}

function getStoredUser(): StoredUser | null {
  try {
    const value = localStorage.getItem("user");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

// ==================================================
// ONLINE PAGE CONTENT
// ==================================================

function OnlinePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const socketRef = useRef<Socket | null>(null);
  const userRef = useRef<StoredUser | null>(null);

  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const mountedRef = useRef(false);

  const outOfChipsTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // ORIENTATION
  const [isLandscape, setIsLandscape] = useState(false);
  const [orientationReady, setOrientationReady] = useState(false);

  // USER AND TABLE
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("Player");
  const [table, setTable] = useState<OnlineTable | null>(null);

  // GAME
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameData, setGameData] = useState<any>({});
  const [winner, setWinner] = useState<Winner | null>(null);

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [error, setError] = useState("");

  const [showRaise, setShowRaise] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(0);

  const [showBuyIn, setShowBuyIn] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState(0);

  const [outOfChips, setOutOfChips] = useState(false);
  const [showingWinner, setShowingWinner] = useState(false);

  // VISUAL SETTINGS
  const [cardDesign, setCardDesign] = useState("default");
  const [tableBackground, setTableBackground] = useState("default");
  const [avatar, setAvatar] = useState("avatar1");

  const stakes = searchParams.get("stakes") || "1 / 2";

  const chipsParam = Number(searchParams.get("chips") || 0);

  const [smallBlind, bigBlind] = useMemo(() => {
    const values = stakes.split("/").map(Number);

    return [
      Number.isFinite(values[0]) && values[0] > 0 ? values[0] : 1,
      Number.isFinite(values[1]) && values[1] > 0 ? values[1] : 2,
    ];
  }, [stakes]);

  const myPlayer = players.find(
    (player) => String(player.id) === String(userId),
  );

  const myTurn =
    !!userId &&
    String(gameData?.turn) === String(userId) &&
    !waitingForPlayer;

  const communityCards: Card[] = gameData?.communityCards || [];

  const selectedTable = tableImages.find(
    (item) => item.id === tableBackground,
  );

  const backgroundImage =
    selectedTable?.source ||
    tableImages.find((item) => item.id === "default")?.source ||
    "/images/backgrounds/Dark.png";

  // --------------------------------------------------
  // AUTOMATIC LANDSCAPE
  // --------------------------------------------------

  const handleLandscape = useCallback(async () => {
    try {
      const orientation = screen.orientation as unknown as {
        lock?: (orientation: "landscape") => Promise<void>;
      };

      if (orientation?.lock) {
        await orientation.lock("landscape");
      }
    } catch (err) {
      console.log("Landscape lock is not supported:", err);
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
  // LOAD USER AND TABLE
  // --------------------------------------------------

  useEffect(() => {
    try {
      const storedUser = getStoredUser();
      const storedTable = localStorage.getItem("pikora_table");

      if (!storedUser) {
        router.replace("/login");
        return;
      }

      if (!storedTable) {
        router.replace("/lobby");
        return;
      }

      const parsedTable = JSON.parse(storedTable);

      const id = storedUser._id || storedUser.id;

      if (!id || !parsedTable?._id) {
        router.replace("/lobby");
        return;
      }

      const currentBuyIn = Number(
        parsedTable.buyIn || chipsParam || 0,
      );

      userRef.current = storedUser;

      setUserId(String(id));

      setUsername(
        storedUser.username ||
          storedUser.name ||
          storedUser.email ||
          "Player",
      );

      setTable(parsedTable);

      setRaiseAmount(bigBlind * 2);

      console.log("ONLINE USER:", id);
      console.log("ONLINE TABLE:", parsedTable);
    } catch (err) {
      console.error("ONLINE INITIALIZATION ERROR:", err);
      router.replace("/lobby");
    }
  }, [router, chipsParam, bigBlind]);

  // --------------------------------------------------
  // LOAD VISUAL SETTINGS
  // --------------------------------------------------

  useEffect(() => {
    setCardDesign(
      localStorage.getItem("pikora_card_design") || "default",
    );

    setTableBackground(
      localStorage.getItem("pikora_table_background") || "default",
    );

    setAvatar(
      localStorage.getItem("pikora_avatar") || "avatar1",
    );
  }, []);

  // --------------------------------------------------
  // SOCKET CONNECTION
  // --------------------------------------------------

  useEffect(() => {
    if (!userId || !table?._id) return;

    mountedRef.current = true;
    leavingRef.current = false;
    joinedRef.current = false;

    let socket: Socket | null = null;

    const setConnectionError = (message: string) => {
      if (!mountedRef.current) return;

      setError(message);
      setLoading(false);
    };

    const initialize = () => {
      try {
        socket = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 15000,
        });

        socketRef.current = socket;

        const joinGame = () => {
          if (!mountedRef.current || joinedRef.current) return;

          joinedRef.current = true;

          setConnected(true);
          setError("");
          setLoading(true);

          const payload = {
            tableId: String(table._id),
            userId,
            username,
            smallBlind,
            bigBlind,
            chips: Number(table.buyIn || chipsParam || 0),
          };

          console.log("JOIN ONLINE TABLE:", payload);

          socket?.emit("join-online-table", payload);
        };

        socket.on("connect", () => {
          console.log("ONLINE SOCKET CONNECTED:", socket?.id);

          if (!mountedRef.current) return;

          setConnected(true);
          setError("");
          joinGame();
        });

        socket.on("connect_error", (err) => {
          console.error("ONLINE SOCKET ERROR:", err);

          if (!mountedRef.current) return;

          setConnected(false);
          joinedRef.current = false;

          setConnectionError(
            "Could not connect to the poker server.",
          );
        });

        socket.on("disconnect", (reason) => {
          console.warn("ONLINE SOCKET DISCONNECTED:", reason);

          if (!mountedRef.current) return;

          setConnected(false);
          joinedRef.current = false;

          if (!leavingRef.current) {
            setError("Connection to the server was interrupted.");
          }
        });

        // JOIN SUCCESS
        socket.on("online-join-success", (result) => {
          console.log("ONLINE JOIN SUCCESS:", result);

          if (!mountedRef.current) return;

          setError("");

          if (Array.isArray(result?.players)) {
            setPlayers(result.players);

            const waiting = result.players.length < 2;
            setWaitingForPlayer(waiting);
          }

          setLoading(false);
        });

        // JOIN ERROR
        socket.on("online-join-error", (result) => {
          console.error("ONLINE JOIN ERROR:", result);

          if (!mountedRef.current) return;

          joinedRef.current = false;

          setConnectionError(
            result?.message ||
              result?.error ||
              "Could not join the poker table.",
          );
        });

        // GAME START
        socket.on("online-game-start", (data) => {
          console.log("ONLINE GAME START:", data);

          if (!mountedRef.current) return;

          setPlayers(data?.players || []);
          setGameData(data || {});
          setWinner(data?.winner ?? null);
          setWaitingForPlayer(false);
          setLoading(false);
          setError("");
        });

        // GAME UPDATE
        socket.on("online-game-update", (data) => {
          console.log("ONLINE GAME UPDATE:", data);

          if (!mountedRef.current) return;

          const updatedPlayers: Player[] = data?.players || [];

          setPlayers(updatedPlayers);
          setGameData(data || {});
          setWinner(data?.winner ?? null);

          const finished =
            data?.state === "SHOWDOWN" ||
            data?.state === "FINISHED";

          const me = updatedPlayers.find(
            (player) => String(player.id) === String(userId),
          );

          if (me && Number(me.chips) <= 0 && finished) {
            setShowingWinner(true);
            setOutOfChips(false);

            if (outOfChipsTimerRef.current) {
              clearTimeout(outOfChipsTimerRef.current);
            }

            outOfChipsTimerRef.current = setTimeout(() => {
              if (!mountedRef.current) return;

              setShowingWinner(false);
              setOutOfChips(true);
            }, 5000);
          } else if (!finished) {
            setOutOfChips(false);
            setShowingWinner(false);
          }

          const waiting =
            updatedPlayers.length < 2 &&
            data?.state === "WAITING";

          setWaitingForPlayer(waiting);
          setLoading(false);
        });

        // TABLE READY
        socket.on("table-ready", (result) => {
          console.log("ONLINE TABLE READY:", result);

          if (!mountedRef.current) return;

          const count =
            result?.playerCount ??
            result?.table?.players?.length ??
            0;

          if (Array.isArray(result?.table?.players)) {
            const mappedPlayers: Player[] =
              result.table.players.map((player: any) => ({
                id: String(
                  player.user?._id ||
                    player.user ||
                    player.id,
                ),
                username:
                  player.username ||
                  player.user?.username ||
                  "Player",
                chips: Number(player.chips || 0),
                isBot: false,
                currentBet: Number(player.currentBet || 0),
                folded: Boolean(player.folded),
                hand: player.hand || [],
                dealer: Boolean(player.dealer),
                smallBlind: Boolean(player.smallBlind),
                bigBlind: Boolean(player.bigBlind),
                lastAction: player.lastAction,
              }));

            setPlayers(mappedPlayers);
          }

          setGameData((previous: any) => ({
            ...previous,
            ...(result?.table || {}),
            playerCount: count,
          }));

          setWaitingForPlayer(count < 2);
          setLoading(false);
        });

        // TURN START
        socket.on("online-turn-start", (result) => {
          if (!mountedRef.current) return;

          setGameData((previous: any) => ({
            ...previous,
            turn: result?.playerId,
          }));
        });
      } catch (err) {
        console.error("ONLINE GAME INITIALIZATION ERROR:", err);
        setConnectionError("Game initialization failed.");
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;

      if (outOfChipsTimerRef.current) {
        clearTimeout(outOfChipsTimerRef.current);
      }

      const currentSocket = socketRef.current;

      if (currentSocket) {
        currentSocket.off("connect");
        currentSocket.off("connect_error");
        currentSocket.off("disconnect");
        currentSocket.off("online-join-success");
        currentSocket.off("online-join-error");
        currentSocket.off("online-game-start");
        currentSocket.off("online-game-update");
        currentSocket.off("table-ready");
        currentSocket.off("online-turn-start");

        // No chip refund in cleanup.
        currentSocket.disconnect();

        if (socketRef.current === currentSocket) {
          socketRef.current = null;
        }
      }

      joinedRef.current = false;
    };
  }, [
    userId,
    username,
    table?._id,
    table?.buyIn,
    smallBlind,
    bigBlind,
    chipsParam,
  ]);

  // --------------------------------------------------
  // GAME ACTIONS
  // --------------------------------------------------

  const emitAction = useCallback(
    (action: "FOLD" | "CALL" | "RAISE" | "ALL_IN", amount = 0) => {
      const socket = socketRef.current;

      if (
        !socket?.connected ||
        !userId ||
        !table?._id ||
        !myTurn ||
        waitingForPlayer
      ) {
        return;
      }

      socket.emit("online-action", {
        tableId: String(table._id),
        userId,
        action,
        amount,
      });
    },
    [userId, table, myTurn, waitingForPlayer],
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
  // ADD CHIPS TO TABLE
  // --------------------------------------------------

  const handleBuyIn = () => {
    // The online backend events currently supplied do not
    // include an add-chips event. Avoid emitting a bot event here.
    setError("Adding chips during an online hand is not available yet.");
  };

  // --------------------------------------------------
  // LEAVE GAME AND RETURN CHIPS
  // --------------------------------------------------

  const leaveGame = async () => {
    if (leavingRef.current) return;

    leavingRef.current = true;

    try {
      const socket = socketRef.current;

      const me = players.find(
        (player) => String(player.id) === String(userId),
      );

      const remainingChips = Math.max(
        0,
        Number(me?.chips ?? 0),
      );

      socket?.emit("leave-online-table", {
        tableId: String(table?._id),
        userId,
      });

      if (remainingChips > 0) {
        const response = await api.post("/auth/chips/add", {
          amount: remainingChips,
        });

        const newChips = Number(response.data?.chips);

        if (Number.isFinite(newChips)) {
          const currentUser = getStoredUser();

          if (currentUser) {
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...currentUser,
                chips: newChips,
              }),
            );
          }
        }
      }

      socket?.disconnect();
      localStorage.removeItem("pikora_table");

      router.push("/lobby");
    } catch (err: any) {
      console.error(
        "RETURN CHIPS ERROR:",
        err?.response?.data || err,
      );

      leavingRef.current = false;

      setError(
        err?.response?.data?.message ||
          "Could not return your remaining chips.",
      );
    }
  };

  // --------------------------------------------------
  // LANDSCAPE LOADING
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
                  ? "Waiting for table..."
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
        <ArrowLeft size={20} />
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

            const isMe = String(player.id) === String(userId);

            const avatarKey = isMe
              ? avatar
              : `avatar${(index % 12) + 1}`;

            return (
              <PlayerSeat
                key={player.id}
                position={
                  isMe
                    ? "me"
                    : positions[index === 0 ? 1 : index]
                }
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

          {/* WAITING FOR PLAYER */}
          {waitingForPlayer && (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <div className="rounded-2xl border border-amber-400/20 bg-black/75 px-6 py-5 text-center shadow-xl backdrop-blur-md">
                <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-amber-400" />

                <h2 className="text-base font-bold">
                  Waiting for another player
                </h2>

                <p className="mt-2 text-xs text-white/50">
                  The game will start when another player joins.
                </p>
              </div>
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
          disabled={!myTurn || !connected || waitingForPlayer}
          onFold={handleFold}
          onCall={handleCall}
          onRaise={() => {
            setRaiseAmount(
              Math.min(bigBlind * 2, myPlayer?.chips || 0),
            );
            setShowRaise(true);
          }}
          onAllIn={handleAllIn}
        />
      </div>

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

      {/* ADD CHIPS MODAL */}
      {showBuyIn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111713] p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
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

            <p className="mb-4 text-sm text-white/50">
              Adding chips during an online game is not supported yet.
            </p>

            <button
              onClick={() => setShowBuyIn(false)}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* OUT OF CHIPS */}
      {outOfChips && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-[#111713] p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-amber-400">
              💰 Out of Chips
            </h2>

            <p className="mt-3 text-sm text-white/60">
              You don't have enough chips to continue.
            </p>

            <button
              onClick={() => router.push("/shop")}
              className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black"
            >
              ADD CHIPS
            </button>

            <button
              onClick={leaveGame}
              className="mt-3 w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white"
            >
              LEAVE TABLE
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
              {winner.username || "Winner"}
            </h2>

            {winner.hand && (
              <p className="mt-1 text-xs text-white/60 sm:text-sm">
                {winner.hand}
              </p>
            )}
          </div>
        </div>
      )}

      {/* WINNER TRANSITION */}
      {showingWinner && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="rounded-2xl border border-amber-400/40 bg-black/80 px-8 py-5 text-center">
            <p className="font-black text-amber-300">
              Hand Finished
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

// ==================================================
// PAGE WITH SUSPENSE
// ==================================================

export default function OnlinePokerPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#080b09] text-white">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
        </main>
      }
    >
      <OnlinePageContent />
    </Suspense>
  );
}
