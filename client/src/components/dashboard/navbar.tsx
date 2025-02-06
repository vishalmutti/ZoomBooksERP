
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

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
          <Link href="/">
            <img 
              src="/attached_assets/Zoom Books Logo Final-01.png" 
              alt="Zoom Books Logo" 
              className="h-12 w-auto" 
            />
          </Link>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  location === item.href ? "text-primary" : "text-muted-foreground"
                }`}>
                  {item.label}
                </span>
              </Link>
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
