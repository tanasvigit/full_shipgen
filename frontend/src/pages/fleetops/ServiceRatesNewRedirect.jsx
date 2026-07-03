import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Legacy /service-rates/new → list with create dialog open. */
export default function ServiceRatesNewRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/fleet-ops/operations/service-rates?create=1", { replace: true });
  }, [navigate]);
  return null;
}
