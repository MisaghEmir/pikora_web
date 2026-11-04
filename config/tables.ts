
export type PokerTable = {
  id: string;
  title: string;
  stakes: string;
  buy: string;
  spots: number;
  level: number;
  minChips: number;
  maxChips: number;
  background: string;
  gameType: "online" | "bot";
};

export const POKER_TABLES: PokerTable[] = [
  {
    id: "table-1",
    title: "ONLINE POKER",
    stakes: "1 / 2",
    buy: "40 / 200",
    spots: 2,
    level: 1,
    minChips: 40,
    maxChips: 200,
    background: "/images/tools/images.jpg",
    gameType: "online",
  },
  {
    id: "table-2",
    title: "ONLINE POKER",
    stakes: "2 / 4",
    buy: "80 / 400",
    spots: 5,
    level: 2,
    minChips: 80,
    maxChips: 400,
    background: "/images/tools/images4.jpg",
    gameType: "online",
  },
  {
    id: "table-3",
    title: "ONLINE POKER",
    stakes: "5 / 10",
    buy: "200 / 1K",
    spots: 5,
    level: 3,
    minChips: 200,
    maxChips: 1000,
    background: "/images/tools/images2.jpg",
    gameType: "online",
  },
  {
    id: "table-4",
    title: "ONLINE POKER",
    stakes: "10 / 20",
    buy: "800 / 4K",
    spots: 9,
    level: 4,
    minChips: 800,
    maxChips: 4000,
    background: "/images/tools/images3.jpg",
    gameType: "bot",
  },
  {
    id: "table-5",
    title: "ONLINE POKER",
    stakes: "20 / 40",
    buy: "2K / 10K",
    spots: 9,
    level: 5,
    minChips: 2000,
    maxChips: 10000,
    background: "/images/tools/images2.jpg",
    gameType: "bot",
  },
  {
    id: "table-6",
    title: "ONLINE POKER",
    stakes: "50 / 100",
    buy: "10K / 50K",
    spots: 9,
    level: 5,
    minChips: 10000,
    maxChips: 50000,
    background: "/images/tools/images2.jpg",
    gameType: "bot",
  },
  {
    id: "table-7",
    title: "ONLINE POKER",
    stakes: "100 / 200",
    buy: "100K / 200K",
    spots: 9,
    level: 5,
    minChips: 100000,
    maxChips: 200000,
    background: "/images/tools/images2.jpg",
    gameType: "bot",
  },
];
