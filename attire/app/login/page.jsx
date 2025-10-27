"use client";

import Header from "@/components/shared/Header";
import Link from "next/link";
import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "@/context/UserContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginUser } = useContext(UserContext); // Получаем функцию логина из контекста
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginUser(email, password); // Вызываем функцию логина
      router.push("/"); // Перенаправляем на главную страницу после успешного входа
    } catch (err) {
      setError(err.message || "Ошибка авторизации");
    }
  };

  return (
    <>
      <Header />
      <div className="w-full flex justify-center py-4">
        <div className="w-[35%] bg-white shadow-lg rounded-xl flex flex-col p-6">
          <h2 className="text-center py-2 font-bold text-3xl">Вход</h2>
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-2 text-[#565656]"
          >
            <label className="font-bold">Email:</label>
            <input
              className="border border-[#565656] rounded-lg p-2 mb-2"
              type="email"
              placeholder="Введите ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="font-bold">Пароль:</label>
            <input
              className="border border-[#565656] rounded-lg p-2 mb-2"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="bg-[--button] hover:bg-[--buttonhover] text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Войти
            </button>
          </form>
          <div className="w-full flex justify-center">
            <Link href="/registration">
              <p className="text-center py-4 underText">
                У вас нет аккаунта? Регистрация
              </p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
