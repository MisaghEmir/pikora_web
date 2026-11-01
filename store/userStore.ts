
import { create } from "zustand";

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
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      console.log("📦 STORED USER:", userData);

      if (!userData || !token) {
        set({
          user: null,
          token: null,
        });
        return;
      }

      const user = JSON.parse(userData) as User;

      set({
        user,
        token,
      });

      console.log("✅ ZUSTAND USER LOADED:", user);
    } catch (error) {
      console.log("❌ LOAD USER ERROR:", error);

      set({
        user: null,
        token: null,
      });
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
