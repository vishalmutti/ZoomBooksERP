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
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2">
            <img src="/attached_assets/Zoom Books Logo Final-02.png" alt="Zoom Books Logo" className="h-8" />
            <h1 className="text-2xl font-bold">Zoom Books AR</h1>
          </div>
            <nav className="flex items-center space-x-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === item.href ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
