"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-2 py-1.5 text-[13px] font-medium ${
              active
                ? "bg-zinc-200/60 text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
