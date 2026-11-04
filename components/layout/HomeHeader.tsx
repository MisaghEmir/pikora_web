
import Link from "next/link";
import { Spade, Coins, ShoppingBag, UserRound } from "lucide-react";
import { avatarImages } from "@/utils/assets";

interface HomeHeaderProps {
  user: {
    avatar?: string;
    chips?: number;
  } | null;
  chips: number;
  isLoaded: boolean;
}

export default function HomeHeader({
  user,
  chips,
  isLoaded,
}: HomeHeaderProps) {
  const actualChips = Number(user?.chips ?? chips ?? 0);

  return (
    <header className="relative z-10 border-b border-white/[0.07] bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex h-[82px] w-full max-w-[1500px] items-center justify-between px-5 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a45c]/30 bg-[#c9a45c]/10">
            <Spade className="h-6 w-6 fill-[#d6b66e] text-[#d6b66e]" />
          </div>

          <div>
            <div className="text-[23px] font-black tracking-[0.18em]">
              PIKORA<span className="text-[#d6b66e]">.</span>
            </div>

            <div className="text-[9px] tracking-[0.3em] text-white/40">
              OWN YOUR GAME
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-5">
          {isLoaded && user && (
            <>
              {/* Chips */}
              <div className="flex h-11 items-center gap-2 rounded-xl border border-[#c9a45c]/20 bg-[#c9a45c]/[0.07] px-3 md:px-5">
                <Coins className="h-5 w-5 text-[#e4bd6d]" />

                <span className="text-sm font-bold text-[#f3d99f]">
                  {actualChips.toLocaleString()}
                </span>

                <span className="hidden text-xs text-white/40 sm:inline">
                  CHIPS
                </span>
              </div>

              {/* Shop */}
              <Link
                href="/shop"
                className="flex h-11 items-center gap-2 rounded-xl bg-[#c9a45c] px-4 text-sm font-bold text-[#17130b] transition hover:bg-[#e5c77f]"
              >
                <ShoppingBag size={17} />
                <span className="hidden sm:inline">SHOP</span>
              </Link>
            </>
          )}

          {/* Profile / Login */}
          {!isLoaded ? (
            <div className="h-11 w-11 animate-pulse rounded-xl bg-white/10" />
          ) : (
            <Link
              href={user ? "/profile" : "/login"}
              aria-label={user ? "Profile" : "Login"}
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition hover:border-[#c9a45c]/50 hover:bg-white/10"
            >
              {user?.avatar ? (
                <img
                  src={avatarImages[user.avatar] || avatarImages.user}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound
                  size={19}
                  className={user ? "text-[#d6b66e]" : "text-white"}
                />
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
