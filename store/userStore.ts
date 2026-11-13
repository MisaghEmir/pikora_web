
import { create } from "zustand";
import { api } from "@/lib/api";

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;

  activeCardDesign: string;
  activeTableBackground: string;

  chips: number;
  chipsD: number;

  wins: number;
  losses: number;
  gamesPlayed: number;

  totalWon: number;

  games: number;
  raiseFrequency: number;
  foldPreFlop: number;
  foldFlop: number;
  foldTurn: number;
  foldRiver: number;

  buysell: boolean;
}

interface UserStore {
  user: User | null;
  token: string | null;

  setUser: (user: User, token: string) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  token: null,

  // SAVE USER
  setUser: async (user, token) => {
    try {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      set({
        user,
        token,
      });

      console.log("✅ ZUSTAND USER SAVED:", user);
    } catch (error) {
      console.log("❌ SAVE USER ERROR:", error);
      throw error;
    }
  },

  // LOAD USER
 loadUser: async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      set({ user: null, token: null });
      return;
    }

    console.log("🚀 CHECKING TOKEN WITH /AUTH/ME...");

    const response = await api.get("/auth/me");

    const user = response.data.user;

    if (!user?._id) {
      throw new Error("Invalid user response");
    }

    localStorage.setItem("user", JSON.stringify(user));

    set({
      user,
      token,
    });

    console.log("✅ USER FETCHED FROM SERVER:", user);
  } catch (error: any) {
    console.log(
      "❌ LOAD USER ERROR:",
      error?.response?.data || error?.message,
    );

    if (error?.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      set({ user: null, token: null });
    }
  }
},

  // LOGOUT
  logout: async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    set({
      user: null,
      token: null,
    });

    console.log("✅ USER LOGGED OUT");
  },
}));
