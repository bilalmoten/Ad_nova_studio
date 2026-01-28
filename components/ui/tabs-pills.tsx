"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface TabPill {
  id: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

interface TabsPillsProps {
  tabs: TabPill[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabsPills({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabsPillsProps) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto scrollbar-hide pb-2",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0",
              isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : tab.disabled
                ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                : "bg-white/5 text-gray-300 border border-white/10 hover:text-white hover:border-white/20 hover:bg-white/10"
            )}
          >
            {Icon && <Icon size={16} />}
            <span>{tab.label}</span>
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-white"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}
