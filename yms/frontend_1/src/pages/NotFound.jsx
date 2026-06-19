import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPinOff } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <MapPinOff className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-sm text-slate-600 mb-2">
          No route exists for <span className="font-mono-yms text-slate-800">{pathname}</span>.
        </p>
        {pathname.toLowerCase().includes("log") && pathname !== "/login" && (
          <p className="text-sm text-amber-700 mb-4">Did you mean to go to the login page?</p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold">
            <Link to="/login">Go to login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Control Tower</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
