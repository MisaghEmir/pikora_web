"use client";

import { Suspense } from "react";
import FindingTableContent from "./FindingTableContent";

export default function FindingTablePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0F1116] flex items-center justify-center text-white">
          Finding a table...
        </main>
      }
    >
      <FindingTableContent />
    </Suspense>
  );
}