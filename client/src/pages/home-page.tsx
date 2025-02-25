import { Link } from "wouter";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { LoadManagementWidget } from "@/components/LoadManagementWidget";
import { PayrollWidget } from "@/components/PayrollWidget";
import ZoomBookAI from "./zoom-book-ai";
import { Route } from "wouter";

const widgets = [
  {
    title: "Load Management",
    description: "Track and manage your inventory loads and view key supplier metrics",
    path: "/loads",
    icon: "🚚"
  },
  {
    title: "Payroll",
    description: "View and manage employee hours for BC and ON",
    path: "/payroll",
    icon: "👥"
  },
  {
    title: "Accounts Receivable",
    description: "Manage invoices and view key wholesale metrics",
    path: "/dashboard",
    icon: "💰"
  },
  {
    title: "Carrier Portal",
    description: "Manage carrier documentation and payments",
    path: "/carrier",
    icon: "🚛"
  },
  {
    title: "Inventory",
    description: "Track warehouse inventory levels and manage G&P stock",
    path: "/inventory",
    icon: "📦"
  },
  {
    title: "Key Performance Metrics",
    description: "Monitor business performance and analytics",
    path: "/metrics",
    icon: "📊"
  },
  {
    title: "Important Links",
    description: "Access important resources and training materials",
    path: "/important-links",
    icon: "🔗"
  },
  {
    title: "Zoom Book AI",
    description: "Chat with a top AI model",
    path: "/zoom-book-ai",
    icon: "🤖"
  }
];

export default function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <Link key={widget.title} href={widget.path}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-2">{widget.icon}</div>
                <CardTitle>{widget.title}</CardTitle>
                <CardDescription>{widget.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
