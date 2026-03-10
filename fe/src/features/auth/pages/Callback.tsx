import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const loginWithToken = useAuth((state) => state.loginWithToken);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      navigate('/');
      return;
    }

    loginWithToken(token).then(() => {
      navigate('/');
    });
  }, [loginWithToken, navigate]);

  return <p>Signing in with Google...</p>;
}
