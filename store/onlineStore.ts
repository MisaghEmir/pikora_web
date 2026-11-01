import { create } from "zustand";

export interface TablePlayer {
  user: string;
  seat: number;
  chips: number;
  socketId?: string;
}

export interface OnlineTable {
  _id: string;
  stakes: string;
  players: TablePlayer[];
  maxPlayers: number;
  status?: string;
}

interface TableStore {
  table: OnlineTable | null;

  onlinesetTable: (table: OnlineTable) => void;
  onlineCclearTable: () => void;
}

export const useTableStore =
  create<TableStore>((set) => ({
    table: null,

    onlinesetTable: (table) =>
      set({
        table,
      }),

    onlineCclearTable: () =>
      set({
        table: null,
      }),
  }));