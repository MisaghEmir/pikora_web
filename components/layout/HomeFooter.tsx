import Link from "next/link";
import {
  Gift,
  UserRound,
  Settings,
  LogOut,
  BookOpen,
  Info,
} from "lucide-react";
import { avatarImages } from "@/utils/assets";

interface HomeFooterProps {
  user: {
    username: string;
    avatar?: string;
  } | null;
  isLoaded: boolean;
  onLogout: () => void | Promise<void>;
}

export default function HomeFooter({
  user,
  isLoaded,
  onLogout,
}: HomeFooterProps) {
  return (
    <footer className="relative z-10 border-t border-white/[0.07] bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[85px] w-full max-w-[1500px] items-center justify-between gap-3 px-5 md:px-10">
        {/* User Profile */}
        <Link
          href={user ? "/profile" : "/login"}
          className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.05]"
        >
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#c9a45c]/60 bg-[#17251e]">
            {user?.avatar ? (
              <img
                src={avatarImages[user.avatar] || avatarImages.user}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-6 w-6 text-[#d6b66e]" />
            )}
          </div>

          <div>
            <div className="text-sm font-bold">
              {!isLoaded ? "Loading..." : user ? user.username : "Guest Player"}
            </div>

            <div className="mt-1 text-[9px] tracking-[0.18em] text-white/40">
              {user ? "VIEW PROFILE" : "LOGIN / REGISTER"}
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/about"
            className="flex items-center gap-2 rounded-xl px-3 py-3 text-xs font-bold text-white/50 transition hover:bg-white/[0.05] hover:text-[#e4c77e]"
          >
            <Info size={17} />
            <span className="hidden sm:inline">ABOUT US</span>
          </Link>

          <Link
            href="/blog"
            className="flex items-center gap-2 rounded-xl px-3 py-3 text-xs font-bold text-white/50 transition hover:bg-white/[0.05] hover:text-[#e4c77e]"
          >
            <BookOpen size={17} />
            <span className="hidden sm:inline">BLOG</span>
          </Link>

          <Link
            href="/gifts"
            className="flex items-center gap-2 rounded-xl border border-[#c9a45c]/20 bg-[#c9a45c]/[0.07] px-3 sm:px-4 py-3 text-xs font-bold text-[#e4c77e] transition hover:bg-[#c9a45c]/15"
          >
            <Gift size={18} />
            <span className="hidden sm:inline">GIFTS</span>
          </Link>

          {user && (
            <button
              type="button"
              onClick={onLogout}
              aria-label="Logout"
              title="Logout"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.05] text-red-400 transition hover:bg-red-500/15"
            >
              <LogOut size={18} />
            </button>
          )}

          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <Settings size={18} />
          </Link>
        </nav>
      </div>
    </footer>
  );
}
