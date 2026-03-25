import React, { useState } from "react";
import { User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import { User } from "../hooks/useAuth";

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Get initials for avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
      >
        {/* Avatar */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
          {initials}
        </div>
        <span className="text-[12px] font-medium text-gray-600 dark:text-white/70 max-w-[100px] truncate hidden sm:block">
          {user.name}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 dark:text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Invisible overlay to close on click outside */}
          <div
            className="fixed inset-0 z-[150]"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full mt-1.5 z-[151] w-56 bg-white dark:bg-[#1e2130] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[12px] font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-gray-800 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-white/40 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
