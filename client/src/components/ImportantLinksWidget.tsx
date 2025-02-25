import { Link } from "wouter";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ImportantLinksWidget() {
  return (
    <Link href="/important-links">
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="text-4xl mb-2">🔗</div>
          <CardTitle>Important Links</CardTitle>
          <CardDescription>Access important resources and training materials</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
