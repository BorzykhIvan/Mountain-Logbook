import React, { useEffect, useState } from "react";
import AuthPage from "./pages/AuthPage";
import TripsPage from "./pages/TripsPage";
import { getCurrentUser } from "./api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("ml_token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let isMounted = true;

    async function bootstrapUser() {
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      try {
        const response = await getCurrentUser(token);
        if (isMounted) {
          setUser(response.user);
        }
      } catch (error) {
        localStorage.removeItem("ml_token");
        if (isMounted) {
          setToken("");
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrapUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAuthSuccess = (nextToken, nextUser) => {
    localStorage.setItem("ml_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("ml_token");
    setToken("");
    setUser(null);
  };

  if (loading) {
    return <div className="screen-center">Loading account...</div>;
  }

  if (!token || !user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <TripsPage user={user} token={token} onLogout={handleLogout} />;
}

export default App;
