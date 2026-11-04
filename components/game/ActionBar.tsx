
"use client";

type Props = {
  disabled: boolean;
  onFold: () => void;
  onCall: () => void;
  onAllIn: () => void;
  onRaise: (amount: number) => void;
};

export default function ActionBar({
  disabled,
  onCall,
  onFold,
  onRaise,
  onAllIn,
}: Props) {
  const buttons = [
    {
      label: "Fold",
      action: onFold,
      color: "bg-[#7d2929] hover:bg-[#a33333]",
    },
    {
      label: "Check",
      action: onCall,
      color: "bg-[#1E7D32] hover:bg-[#269b40]",
    },
    {
      label: "All In",
      action: onAllIn,
      color: "bg-[#9b7027] hover:bg-[#bd8b35]",
    },
    {
      label: "Raise",
      action: () => onRaise(10),
      color: "bg-[#1E7D32] hover:bg-[#269b40]",
    },
  ];

  return (
    <div className="absolute bottom-12 right-0 z-30 flex w-full flex-wrap justify-center gap-2 px-3 sm:w-1/2 sm:justify-end sm:gap-2.5 sm:px-2">
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          disabled={disabled}
          onClick={button.action}
          className={`
            min-w-[70px] flex-1 rounded-xl px-3 py-3
            text-sm font-bold text-white shadow-lg
            transition-all duration-200
            active:scale-95
            disabled:cursor-not-allowed
            disabled:opacity-40
            sm:min-w-[80px] sm:flex-none sm:px-[18px]
            ${button.color}
          `}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
