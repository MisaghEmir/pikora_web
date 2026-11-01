
import React from "react";

type PokerTableProps = {
  children?: React.ReactNode;
};

export default function PokerTable({ children }: PokerTableProps) {
  return (
    <div className="absolute top-[18%] left-1/2 flex h-[58%] w-[90%] -translate-x-1/2 items-center justify-center">
      {/* Table shadow */}
      <div className="absolute h-[102%] w-[102%] scale-[1.05] rounded-[500px] bg-black/45" />

      {/* Wooden border */}
      <div className="relative h-full w-full rounded-[500px] bg-[#5E3B1E] p-[14px] shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
        {/* Green felt */}
        <div className="relative h-full w-full overflow-hidden rounded-[500px] border-[3px] border-[#2FA76F] bg-[#0F6D44]">
          
          {/* Pot area */}
          <div className="absolute left-1/2 top-[33%] flex h-[50px] w-[120px] -translate-x-1/2 items-center justify-center rounded-xl border-2 border-dashed border-white/15">
            <span className="text-xs font-bold tracking-wider text-white/80">
              POT
            </span>
          </div>

          {/* Community cards area */}
          <div className="absolute left-1/2 top-[47%] flex h-[80px] w-[330px] max-w-[90%] -translate-x-1/2 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}
