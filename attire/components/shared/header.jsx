"use client";

import { useContext } from "react";
import Link from "next/link";
import { UserContext } from "@/context/UserContext";

export default function Header({ searchQuery, setSearchQuery, handleSearch }) {
  const { currentUser, logoutUser } = useContext(UserContext);

  return (
    <div className="w-full p-4">
      {/* Контейнер хедера */}
      <div className="flex flex-row justify-between h-20 w-full bg-[--foreground] rounded-lg relative">
        {/* Логотип: Уменьшили шрифт (text-2xl) и отступ (pl-4) на мобильных */}
        <div className="h-full flex items-center pl-4 md:pl-10">
          <Link href="/">
            <p className="text-2xl md:text-4xl font-bold text-[#f5f5f5]">
              ATTIRE
            </p>
          </Link>
        </div>

        {/* Поиск: Абсолютное позиционирование, но ширина адаптивная */}
        <div className="absolute left-1/2 transform -translate-x-1/2 h-20 flex items-center">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            // w-[120px] на телефоне -> w-[300px] на ПК
            className="w-[120px] sm:w-[200px] md:w-[300px] text-sm md:text-lg border border-[#dddddd] rounded-md pl-2 md:pl-3 h-8 md:h-10 focus:outline-none transition-all duration-300"
            placeholder="Поиск..."
          />
        </div>

        {/* Навигация: Уменьшили отступ (pr-4) */}
        <div className="flex h-full items-center pr-4 md:pr-10">
          {currentUser ? (
            <div className="flex flex-row gap-2 md:gap-4 justify-center items-center">
              {/* Имя пользователя: Скрываем на мобильных, чтобы не мешало */}
              <span className="text-[#f5f5f5] hidden md:block">
                {currentUser.username}
              </span>

              {currentUser.role === "ADMIN" ? (
                <>
                  <Link href="/admin">
                    <button className="bg-[--buttonhover] text-[#f5f5f5] rounded-md px-2 py-1 md:px-3 hover:bg-[--button] transition duration-300 text-xs md:text-base">
                      Товары
                    </button>
                  </Link>
                  <Link href="/admin/reports">
                    <button className="bg-[--buttonhover] text-[#f5f5f5] rounded-md px-2 py-1 md:px-3 hover:bg-[--button] transition duration-300 text-xs md:text-base">
                      Отчеты
                    </button>
                  </Link>
                </>
              ) : (
                <Link href="/cart">
                  {/* Кнопки: Меньше шрифт (text-xs) и отступы (px-2) на мобильных */}
                  <button className="bg-[--buttonhover] text-[#f5f5f5] rounded-md px-2 py-1 md:px-3 hover:bg-[--button] transition duration-300 text-xs md:text-base">
                    Корзина
                  </button>
                </Link>
              )}
              <button
                onClick={logoutUser}
                className="bg-[--buttonhover] text-[#f5f5f5] rounded-md px-2 py-1 md:px-3 hover:bg-[--button] transition duration-300 text-xs md:text-base"
              >
                Выход
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-[--buttonhover] text-[#f5f5f5] rounded-md px-2 py-1 md:px-3 hover:bg-[--button] transition duration-300 text-xs md:text-base">
                Войти
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
