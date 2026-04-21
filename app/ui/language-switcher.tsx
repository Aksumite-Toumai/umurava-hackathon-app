"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const languages = [
  { code: "en", name: "English", icon: "/en.png" },
  { code: "fr", name: "Français", icon: "/fr.png" },
  { code: "rw", name: "Kinyarwanda", icon: "/rw.png" },
];

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const currentLocale = useLocale();
  const [isPending, startTransition] = useTransition();

  const activeLanguage =
    languages.find((lang) => lang.code === currentLocale) || languages[1];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLanguage = (newLocale: string) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;

    startTransition(() => {
      router.refresh();
    });

    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
          isPending ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {/* The Active Flag Image */}
        <div className="relative h-4 w-6 overflow-hidden rounded-sm border border-gray-200">
          <Image
            src={activeLanguage.icon}
            alt={`${activeLanguage.name} flag`}
            fill
            className="object-cover"
            sizes="24px"
          />
        </div>

        <span className="hidden sm:inline">{activeLanguage.name}</span>
        <span className="inline sm:hidden">
          {activeLanguage.code.toUpperCase()}
        </span>
        <ChevronDownIcon
          className="-mr-1 h-4 w-4 text-gray-400"
          aria-hidden="true"
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLanguage(lang.code)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-100 ${
                  currentLocale === lang.code
                    ? "bg-amber-50 text-amber-900 font-semibold"
                    : "text-stone-700"
                }`}
                role="menuitem"
              >
                {/* 4. The Dropdown Flag Images */}
                <div className="relative h-4 w-6 overflow-hidden rounded-sm border border-gray-200 shrink-0">
                  <Image
                    src={lang.icon}
                    alt={`${lang.name} flag`}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
