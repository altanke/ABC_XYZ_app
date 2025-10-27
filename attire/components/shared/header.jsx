"use client";

import { useContext } from "react";
import Link from "next/link";
import { UserContext } from "@/context/UserContext";

export default function Header({ searchQuery, setSearchQuery, handleSearch }) {
  const { currentUser, logoutUser } = useContext(UserContext);

  return (
    <div className="w-full p-4">
      <div className="flex flex-row justify-between h-20 w-full bg-[--foreground] rounded-lg">
        {/* Логотип */}
        <div className="h-full flex items-center pl-10">
          <Link href="/">
            <p className="text-4xl font-bold text-[#f5f5f5]">ATTIRE</p>
          </Link>
        </div>

        {/* Поиск */}
        <div className="absolute left-1/2 transform -translate-x-1/2 h-20 flex items-center">
          <input
            type="search"
            value={searchQuery} // Привязка к состоянию строки поиска
            onChange={(e) => setSearchQuery(e.target.value)} // Обновление строки
            onKeyDown={handleSearch} // Обработчик нажатия клавиши
            className="w-[300px] text-lg border border-[#dddddd] rounded-md pl-3 h-10 focus:outline-none"
            placeholder="Поиск..."
          />
        </div>

        {/* Навигация */}
        <div className="flex h-full items-center pr-10">
          {currentUser ? (
            <div className="flex flex-row gap-4 justify-center items-center">
              {/* Имя пользователя */}
              <span className="text-[#f5f5f5]">{currentUser.username}</span>
              {currentUser.role === "ADMIN" ? (
                <Link href="/admin">
                  <button className="bg-[--buttonhover] text-[#f5f5f5] rounded-md px-3 py-1 hover:bg-[--button] transition duration-300">
                    Админ
                  </button>
                </Link>
              ) : (
                <Link href="/cart">
                  <button className="bg-[--buttonhover] text-[#f5f5f5] rounded-md px-3 py-1 hover:bg-[--button] transition duration-300">
                    Корзина
                  </button>
                </Link>
              )}
              <button
                onClick={logoutUser}
                className="bg-[--buttonhover] text-[#f5f5f5] rounded-md px-3 py-1 hover:bg-[--button] transition duration-300"
              >
                Выход
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-[--buttonhover] text-[#f5f5f5] rounded-md px-3 py-1 hover:bg-[--button] transition duration-300">
                Войти
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
