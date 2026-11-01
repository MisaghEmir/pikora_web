export type CardDesign =
  | "default"
  | "gold"
  | "red"
  | "black"
  | "royal";

export type CardImage = string;

const suits = ["H", "S", "D", "C"];

const ranks = [
  "A", "2", "3", "4", "5", "6", "7",
  "8", "9", "10", "J", "Q", "K",
];

const designs: CardDesign[] = [
  "default",
  "gold",
  "red",
  "black",
  "royal",
];

const cardImages: Record<string, Record<string, CardImage>> = {};

designs.forEach((design) => {
  cardImages[design] = {};

  ranks.forEach((rank) => {
    suits.forEach((suit) => {
      const key = `${rank}${suit}`;

      cardImages[design][key] =
        `/images/cards/${design}/${key}.png`;
    });
  });
});

export const getCardImage = (
  design: string | undefined,
  rank: string,
  suit: string,
): string => {
  const cardKey = `${rank.trim().toUpperCase()}${suit.trim().toUpperCase()}`;

  return `/images/cards/${cardKey}.png`;
};