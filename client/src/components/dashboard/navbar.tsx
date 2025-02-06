import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/suppliers", label: "Suppliers" },
];

export function Navbar() {
  const { logoutMutation } = useAuth();
  const [location] = useLocation();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          {/* Fix nested anchor tag issue by using a div with onClick */}
          <div className="cursor-pointer" onClick={() => window.location.href = '/'}>
            <img 
              src="/logo.png" 
              alt="Zoom Books Logo" 
              className="h-16 w-auto" 
            />
          </div>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => logoutMutation.mutate()}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}