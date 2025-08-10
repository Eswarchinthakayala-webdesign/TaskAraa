import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

let alertAlreadyShown = false; // persists across renders

export default function AuthComponent({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useUser();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const isAuthPage = ["/login", "/signup"].includes(location.pathname);
    if (isAuthPage) {
      setIsAllowed(true);
      return;
    }

    if (!loading) {
      if (!user) {
        if (!alertAlreadyShown) {
          alert("Login or Signup to get access");
          alertAlreadyShown = true;
        }
        navigate("/login", { replace: true });
      } else {
        alertAlreadyShown = false; // Reset after successful login
        setIsAllowed(true);
      }
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return <p className="text-white p-4">Checking authentication...</p>;
  }

  return isAllowed ? children : null;
}
