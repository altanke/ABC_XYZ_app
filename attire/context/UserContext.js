// context/UserContext.js
"use client";

import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Для отслеживания загрузки данных пользователя

  useEffect(() => {
    // Загружаем текущего пользователя из API
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:8080/api/users/current",
          {
            credentials: "include", // Для передачи cookies, если требуется
          }
        );

        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        } else {
          setCurrentUser(null); // Если пользователь не авторизован
        }
      } catch (error) {
        console.error("Ошибка загрузки пользователя:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
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
        localStorage.setItem("user", JSON.stringify(user)); // Для совместимости
      } else {
        throw new Error("Ошибка авторизации");
      }
    } catch (error) {
      console.error("Ошибка логина:", error);
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await fetch("http://localhost:8080/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("user"); // Для совместимости
      setCurrentUser(null);
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        loginUser,
        logoutUser,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
