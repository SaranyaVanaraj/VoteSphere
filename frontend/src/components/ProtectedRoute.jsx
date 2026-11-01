
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

function ProtectedRoute() {
  const location = useLocation();

  // Check whether the user is logged in
  const token = sessionStorage.getItem("token");

  // Redirect unauthenticated users to login
  if (!token) {
    // Save the original page URL
    const next = location.pathname + location.search;

    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(next)}`}
        replace
      />
    );
  }

  // Allow logged-in users to access the protected page
  return <Outlet />;
}

export default ProtectedRoute;
