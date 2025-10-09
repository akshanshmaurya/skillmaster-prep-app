"use client";

import { Home, BookOpen, Target, Brain, Trophy, MessageSquare, User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { removeAuthToken, removeAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Practice", href: "/practice", icon: BookOpen },
  { name: "Tests", href: "/tests", icon: Target },
  { name: "AI Insights", href: "/insights", icon: Brain },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Interview", href: "/interview", icon: MessageSquare },
];

export default function LeftRail() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    removeAuthToken();
    removeAuthUser();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border overflow-y-auto flex flex-col">
      <nav className="p-4 space-y-1 flex-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground backdrop-blur-sm"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </aside>
  );
}