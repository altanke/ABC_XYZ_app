"use client";

import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const loginUser = async (email, password) => {
    try {
      const response = await fetch("http://localhost:8080/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Ошибка авторизации");
      }
    } catch (error) {
      console.error("Ошибка логина:", error);
      localStorage.removeItem("user");
      setCurrentUser(null);
      throw error;
    }
  };

  const logoutUser = async () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    router.push("/");
  };

  const registerUser = async (username, email, password) => {
    try {
      const response = await fetch("http://localhost:8080/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, role: "USER" }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Ошибка регистрации");
      }
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        loginUser,
        logoutUser,
        registerUser,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
