"use client";

import { Home, BookOpen, Target, Brain, Trophy, MessageSquare, User, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Practice", href: "/practice", icon: BookOpen },
  { name: "Tests", href: "/tests", icon: Target },
  { name: "AI Insights", href: "/insights", icon: Brain },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Interview", href: "/interview", icon: MessageSquare },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function LeftRail() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-8">
        <div className="bg-accent rounded-lg p-4">
          <h3 className="font-semibold mb-2">Daily Streak</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">12</span>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Keep it up! 🔥</p>
        </div>
      </div>
    </aside>
  );
}