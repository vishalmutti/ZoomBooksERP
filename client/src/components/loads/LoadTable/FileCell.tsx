
import { Button } from "@/components/ui/button";
import { LuFileText } from "react-icons/lu";

export function FileCell({ file, label }: { file: string | null; label: string }) {
  if (!file) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => window.open(`/uploads/${file}`, "_blank")}
      title={label}
    >
      <LuFileText className="h-4 w-4" />
    </Button>
  );
}
