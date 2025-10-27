"use client";

import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";

export default function ProductCard({ product }) {
  const { toast } = useToast();
  const { currentUser } = useContext(UserContext);

  const addToCart = async (id) => {
    if (!currentUser) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для добавления в корзину",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: { id: currentUser.id }, // Указываем ID пользователя
          product: { id }, // Указываем ID продукта
          quantity: 1, // По умолчанию добавляем 1 товар
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при добавлении товара в корзину");
      }

      toast({
        title: "Успех",
        description: "Товар успешно добавлен в корзину",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col w-full border shadow-lg rounded-xl bg-white">
      <Link href={`/product/${product.id}`}>
        <div className="w-full p-4 h-[450px] overflow-hidden cursor-pointer">
          <img
            src={product.imageUrl}
            className="h-full w-full object-cover rounded-sm"
            alt={product.name}
          />
        </div>
      </Link>

      <p className="text-center text-2xl font-bold mb-2">{product.name}</p>
      <p className="text-center text-lg font-bold mb-2">{product.price} $</p>
      <p className="text-center text-lg mb-1">Категория: {product.category}</p>

      <div className="flex justify-center mb-2">
        <Link href={`/product/${product.id}`}>
          <button className="bg-[#52b788] rounded-lg py-2 px-4 hover:bg-[#40916c] text-white transition duration-300">
            Подробнее
          </button>
        </Link>
      </div>
      {currentUser && currentUser.role === "USER" && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => addToCart(product.id)}
            className="bg-[#52b788] rounded-lg py-2 px-4 hover:bg-[#40916c] text-white transition duration-300"
          >
            Добавить в корзину
          </button>
        </div>
      )}
    </div>
  );
}
