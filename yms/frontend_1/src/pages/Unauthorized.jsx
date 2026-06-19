import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";

export default function Unauthorized() {
  const { role, roleLabels, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-600 mb-6">
          Your role ({roleLabels[role] || role}) does not have permission to access this module.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="bg-slate-900 hover:bg-slate-800">
            <Link to="/">Return to home</Link>
          </Button>
          <Button
            variant="outline"
            data-testid="settings-logout"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
