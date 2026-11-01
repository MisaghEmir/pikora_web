
"use client";

import React from "react";

type PokerTableProps = {
  children?: React.ReactNode;
};

export default function PokerTable({ children }: PokerTableProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
      {children}
    </div>
  );
}
