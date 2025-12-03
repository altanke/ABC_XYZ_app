"use client";

import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";

export default function ProductCard({ product }) {
  const { toast } = useToast();
  const { currentUser } = useContext(UserContext);

  const addToCart = async (productId) => {
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
          userId: currentUser.id,
          productId: productId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Ошибка при добавлении товара в корзину");
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
    <div className="flex flex-col w-full border shadow-lg rounded-xl bg-white overflow-hidden">
      {" "}
      <Link href={`/product/${product.id}`}>
        <div className="w-full aspect-square cursor-pointer relative">
          {" "}
          <Image
            src={product.imageUrl || "/placeholder.png"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain"
            alt={product.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder.png";
            }}
          />
        </div>
      </Link>
      <div className="min-h-16 flex items-center justify-center mb-2">
        <p className="text-center text-2xl font-bold">{product.name}</p>
      </div>
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
