"use client";

import {
  HomeIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { lusitana } from "@/app/ui/fonts";

const links = [
  { key: "home", href: "/dashboard", icon: HomeIcon },
  { key: "jobs", href: "/dashboard/jobs", icon: DocumentDuplicateIcon },
  { key: "results", href: "/dashboard/results", icon: SparklesIcon },
];

export default function NavLinks() {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.key}
            href={link.href}
            className={clsx(
              "flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-orange-800 hover:text-white md:flex-none md:justify-start md:p-2 md:px-3",
              { "bg-orange-800 text-white": pathname === link.href },
            )}
          >
            <LinkIcon className="w-6" />

            <p className={`${lusitana.className} text-xl hidden md:block`}>
              {t(link.key)}
            </p>
          </Link>
        );
      })}
    </>
  );
}
