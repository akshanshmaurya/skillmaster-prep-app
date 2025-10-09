"use client";

import { ReactNode } from "react";
import TopNav from "./TopNav";
import LeftRail from "./LeftRail";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <TopNav />
      <div className="flex">
        <LeftRail />
        <main className="flex-1 ml-64 pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}