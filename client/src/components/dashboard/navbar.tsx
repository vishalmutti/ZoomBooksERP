
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Navbar() {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <span className="transition-colors hover:text-foreground/80 text-foreground">
              <Link href="/dashboard">Dashboard</Link>
            </span>
            <span className="transition-colors hover:text-foreground/80 text-foreground">
              <Link href="/suppliers">Suppliers</Link>
            </span>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
