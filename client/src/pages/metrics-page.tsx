
import { Link } from "wouter";

export default function MetricsPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Key Performance Metrics</h1>
        <nav className="flex gap-4">
          <Link href="/metrics/ontario">
            <a className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Ontario Metrics
            </a>
          </Link>
          <Link href="/metrics/british-columbia">
            <a className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              British Columbia Metrics
            </a>
          </Link>
        </nav>
      </div>
      <div className="text-muted-foreground">
        Select a region above to view detailed metrics
      </div>
    </div>
  );
}
