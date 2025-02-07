import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", label: "Dashboard" },
];

export function Navbar() {
  const { logoutMutation } = useAuth();
  const [location] = useLocation();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-32 items-center justify-between px-4">
        <Link href="/" className="cursor-pointer pt-4">
          <img 
            src="/logo.png" 
            alt="Zoom Books Logo" 
            className="h-72 w-auto" 
          />
        </Link>

        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button 
            variant="ghost" 
            onClick={() => logoutMutation.mutate()}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}