import Link from "next/link";
import SsoHashCleanup from "@/components/auth/SsoHashCleanup";
import NavTabs from "@/components/NavTabs";
import { IconGrid, IconSettings } from "@/components/ui/icons";

const HOVER =
  "rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200";

// Ogrodje aplikacije Bingo: zgornja vrstica (logo, zavihka Bingo/Števec na sredini, nastavitve),
// pod njo drseča vsebina.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col">
      <SsoHashCleanup />
      <header className="relative flex min-h-12 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900">
        <Link href="/" aria-label="Bingo" className="flex items-center gap-2 p-1 font-semibold text-orange-600 dark:text-orange-400">
          <IconGrid className="h-5 w-5" />
          <span className="hidden sm:inline">Bingo</span>
        </Link>
        <NavTabs />
        <Link href="/nastavitve" aria-label="Nastavitve" className={`p-2 ${HOVER}`}>
          <IconSettings className="h-5 w-5" />
        </Link>
      </header>
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
        <main className="mx-auto w-full max-w-2xl px-3 py-5 sm:px-4">{children}</main>
      </div>
    </div>
  );
}
