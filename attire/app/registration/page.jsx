"use client";

import Header from "@/components/shared/Header";
import Link from "next/link";
import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "@/context/UserContext";

export default function Registration() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { registerUser } = useContext(UserContext); // Используем функцию регистрации из контекста
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await registerUser(name, email, password); // Вызываем функцию регистрации
      setSuccess("Регистрация прошла успешно! Перенаправляем...");
      setTimeout(() => router.push("/login"), 2000); // Через 2 секунды перенаправляем
    } catch (err) {
      setError(err.message || "Ошибка регистрации");
    }
  };

  return (
    <>
      <Header />
      <div className="w-full flex justify-center py-4">
        <div className="w-[35%] bg-white shadow-lg rounded-xl flex flex-col p-6">
          <h2 className="text-center py-2 font-bold text-3xl">Регистрация</h2>
          <form
            onSubmit={handleRegister}
            className="flex flex-col gap-2 text-[#565656]"
          >
            <label className="font-bold">Имя:</label>
            <input
              className="border border-[#565656] rounded-lg p-2 mb-2"
              type="text"
              placeholder="Введите ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <button
              type="submit"
              className="bg-[--button] hover:bg-[--buttonhover] text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Зарегистрироваться
            </button>
          </form>
          <div className="w-full flex justify-center">
            <Link href="/login">
              <p className="text-center py-4 underText">
                Уже есть аккаунт? Войти
              </p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
