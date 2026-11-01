
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export type Position = "top" | "left" | "right" | "bottomLeft" | "me";

export type Card = {
  rank: string;
  suit: string;
};

export type PlayerBot = {
  id: string;
  isBot?: boolean;
  hand?: Card[];
  lastAction?: "FOLD" | "CHECK" | "CALL" | "RAISE" | "ALL_IN";
  currentBet?: number;
  dealer?: boolean;
};

type Props = {
  position: Position;
  name: string;
  chips: number;
  player: PlayerBot;
  turn?: string;
  gameState?: string;
  winner?: any;
  cardDesign?: string;

  avatarUrl?: string;
  avatarImages?: Record<string, string>;
  cardImages?: Record<string, string>;
  cardBack?: string;
};

const positionClasses: Record<Position, string> = {
  top: "right-[calc(50%-165px)] top-[5%]",
  left: "left-[calc(50%-165px)] top-[5%]",
  right: "right-[40px] bottom-[120px]",
  bottomLeft: "left-[40px] bottom-[120px]",
  me: "bottom-[25px] left-1/2 -translate-x-1/2",
};

export default function PlayerSeat({
  position,
  name,
  chips,
  player,
  turn,
  gameState,
  winner,
  avatarUrl,
  avatarImages = {},
  cardImages = {},
  cardBack = "/images/cards/back.png",
}: Props) {
  const [time, setTime] = useState(0);

  const isMe = position === "me";
  const isTurn = player.id === turn;
  const isFinished =
    gameState === "SHOWDOWN" || gameState === "FINISHED";

  const showRealCard = isMe || isFinished || !!winner;

  const cardKeys = player.hand || [];

  const actionText = (() => {
    switch (player.lastAction) {
      case "FOLD":
        return "Fold";
      case "CHECK":
        return "Check";
      case "CALL":
        return player.currentBet ? String(player.currentBet) : "Check";
      case "RAISE":
        return String(player.currentBet || 0);
      case "ALL_IN":
        return "All In";
      default:
        return "";
    }
  })();

  // Timer
  useEffect(() => {
    if (gameState === "WAITING" || !isTurn) {
      setTime(0);
      return;
    }

    setTime(10);

    const interval = setInterval(() => {
      setTime((previous) => {
        if (previous <= 1) {
          clearInterval(interval);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [turn, gameState, player.id, isTurn]);

  const avatar =
    avatarUrl ||
    avatarImages[player.id] ||
    "/images/avatars/default.png";

  return (
    <div
      className={`absolute z-20 flex flex-col items-center ${positionClasses[position]}`}
    >
      {/* Dealer */}
      {player.dealer && (
        <div className="absolute -right-3 -top-3 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-gray-400 bg-white text-xs font-black text-black shadow-lg">
          D
        </div>
      )}

      {/* Avatar */}
      <div
        className={`relative h-11 w-11 overflow-hidden rounded-full border-2 transition-all duration-300 ${
          isTurn
            ? "border-[#ccab3f] shadow-[0_0_15px_rgba(204,171,63,0.7)]"
            : "border-[#5d5025]"
        }`}
      >
        <Image
          src={avatar}
          alt={name}
          fill
          sizes="44px"
          className="object-cover"
        />

        {!isTurn && (
          <div className="absolute inset-0 bg-black/60" />
        )}
      </div>

      {/* Name + Chips */}
      <div className="mt-1 flex items-center gap-2">
        <div className="text-center">
          <p
            className={`text-sm font-bold ${
              isTurn ? "text-white" : "text-[#858585]"
            }`}
          >
            {name}
          </p>

          <p className="mt-0.5 text-xs font-semibold text-[#FFD54F]">
            ${chips.toLocaleString("en-US")}
          </p>
        </div>

        {/* Cards */}
        <div className="mt-1 flex gap-1">
          {[0, 1].map((index) => {
            const card = cardKeys[index];

            const cardKey = card
              ? `${card.rank}${card.suit}`
              : "";

            const cardSource =
              showRealCard && card
                ? cardImages[cardKey] || cardBack
                : cardBack;

            return (
              <motion.div
                key={`${player.id}-${index}-${cardKey}`}
                initial={
                  !isMe && showRealCard
                    ? { scale: 0.8, rotateY: 90 }
                    : false
                }
                animate={{
                  scale: 1,
                  rotateY: 0,
                }}
                transition={{
                  duration: 0.35,
                  type: "spring",
                  stiffness: 180,
                }}
                className={`relative overflow-hidden rounded-[4px] border border-white/20 bg-white shadow-md ${
                  isMe || showRealCard
                    ? "h-[60px] w-10"
                    : "h-7 w-[18px]"
                }`}
              >
                <Image
                  src={cardSource}
                  alt="Poker card"
                  fill
                  sizes="40px"
                  className="object-fill"
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Timer */}
      <div className="mt-[5px] h-1 w-[46px] overflow-hidden rounded-full bg-[#333]">
        <motion.div
          className="h-full rounded-full bg-[#4CAF50]"
          initial={{ width: "100%" }}
          animate={{
            width: isTurn && gameState !== "WAITING"
              ? `${(time / 10) * 100}%`
              : "0%",
          }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Action */}
      <div className="mt-[5px] h-6">
        <AnimatePresence mode="wait">
          {actionText && (
            <motion.div
              key={actionText}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex h-5 items-center rounded-full bg-[#ad4e17] text-white shadow-md"
            >
              <span className="flex h-6 w-6 items-center justify-center">
                <Image
                  src="/images/chip.png"
                  alt="Chip"
                  width={25}
                  height={25}
                  className="object-contain"
                />
              </span>

              <span className="px-2 text-xs font-semibold">
                {actionText}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
