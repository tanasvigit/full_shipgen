import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchAuthMe } from "../services/authApi";
import { resolvePostLoginPath } from "../utils/authRedirect";
import BrandLogo from "../components/common/BrandLogo";
import { Button } from "../components/ui/button";
import { PasswordInput } from "../components/ui/password-input";

const PASSWORD_HINT =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.";

export default function Login() {
  const { login, isAuthenticated, ready, permissions } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (ready && isAuthenticated) {
    const dest = resolvePostLoginPath(permissions, location.state?.from);
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      const me = await fetchAuthMe();
      navigate(resolvePostLoginPath(me.permissions, location.state?.from), { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block rounded bg-white/95 px-3 py-2 mb-4">
            <BrandLogo variant="responsive" height={40} />
          </div>
          <h1 className="text-white font-display font-bold text-xl tracking-tight">
            YARD<span className="text-amber-400">.OS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your yard operations account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-xl p-6 space-y-4"
          data-testid="login-form"
        >
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2" data-testid="login-error">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              id="email"
              data-testid="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-3 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Password
            </label>
            <PasswordInput
              id="password"
              data-testid="login-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-3 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">{PASSWORD_HINT}</p>
          </div>
          <Button
            type="submit"
            data-testid="login-submit"
            disabled={loading}
            className="w-full min-h-[44px] bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-[11px] text-slate-400 text-center pt-1 leading-relaxed">
            Demo accounts (email / password):<br />
            yard.admin@shipgen.demo · yard.gate@shipgen.demo<br />
            Password for all demo roles: Shipgen@Yms2026!
          </p>
        </form>
      </div>
    </div>
  );
}
