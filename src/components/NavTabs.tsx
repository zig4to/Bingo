"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGrid, IconTally } from "@/components/ui/icons";
import clsx from "@/lib/utils/clsx";

const TABS = [
  { href: "/", label: "Bingo", Icon: IconGrid },
  { href: "/stevec", label: "Števec", Icon: IconTally },
];

// Glavna zavihka na sredini zgornje vrstice; aktivni je obarvan.
export default function NavTabs() {
  const path = usePathname();
  return (
    <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
