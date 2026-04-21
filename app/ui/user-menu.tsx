"use client";

import { useState } from "react";
import { UserIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

export default function UserMenu({
  username,
  email,
}: {
  username: string;
  email: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 transition-colors rounded-full bg-amber-700 text-parchment hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2 focus:ring-offset-parchment"
      >
        <span className="font-bold">AT</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 z-20 w-48 py-1 mt-2 bg-white border rounded-md shadow-lg border-amber-700/20 ring-1 ring-black ring-opacity-5">
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm text-stone-700 hover:bg-parchment hover:text-amber-900"
            >
              <UserIcon className="w-4 h-4 mr-3" />
              {username}
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm text-stone-700 hover:bg-parchment hover:text-amber-900"
            >
              <EnvelopeIcon className="w-4 h-4 mr-3" />
              {email}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
