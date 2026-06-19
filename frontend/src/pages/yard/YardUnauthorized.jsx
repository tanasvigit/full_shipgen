import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { yardPath } from "@yard/constants/basePath";
import { Button } from "@/components/ui/button";

export default function YardUnauthorized() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="font-display text-xl font-bold text-[#0A0E1A]">Yard access restricted</h1>
      <p className="text-sm text-[#4B5563]">
        Your yard role does not include permission for this page. Contact a yard administrator if you need access.
      </p>
      <Button asChild variant="outline">
        <Link to={yardPath("/")}>Back to Control Tower</Link>
      </Button>
    </div>
  );
}
