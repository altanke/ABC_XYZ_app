"use client";

import Header from "@/components/shared/Header";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import { UserContext } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image"; // <--- 1. Импортируем Image

export default function Product() {
  const { id } = useParams();
  const { toast } = useToast();
  const { currentUser } = useContext(UserContext);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(0);

  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [convertedPrice, setConvertedPrice] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/products/${id}`
        );
        if (!response.ok) throw new Error("Failed to load product data");
        const data = await response.json();
        setProduct(data);
        setConvertedPrice(null);
        setSelectedCurrency("USD");
      } catch (error) {
        toast({
          title: "Ошибка",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/reviews/product/${id}`
        ); // Исправлено
        if (!response.ok) throw new Error("Failed to load reviews");
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        toast({
          title: "Ошибка",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id, toast]);

  useEffect(() => {
    if (!product || selectedCurrency === "USD") {
      setConvertedPrice(null);
      return;
    }

    const fetchConvertedPrice = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/products/${product.id}/price/in/${selectedCurrency}`
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Не удалось получить конвертированную цену: ${response.status} ${response.statusText} - ${errorText}`
          );
        }
        const data = await response.json();
        setConvertedPrice(data.convertedPrice);
      } catch (error) {
        toast({
          title: "Ошибка конвертации валюты",
          description: error.message,
          variant: "destructive",
        });
        setConvertedPrice(null);
      }
    };

    fetchConvertedPrice();
  }, [product, selectedCurrency, toast]);

  const costAverageRating = () => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    return parseFloat((totalRating / reviews.length).toFixed(1));
  };

  const handleAddReview = async () => {
    if (!currentUser) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для добавления отзыва",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch("http://localhost:8080/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: { id: currentUser.id },
          product: { id: product.id },
          rating,
          content: newReview,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Ошибка при добавлении отзыва: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const addedReview = await response.json();
      setReviews((prevReviews) => [...prevReviews, addedReview]);
      setNewReview("");
      setRating(0);

      toast({
        title: "Успех",
        description: "Отзыв успешно добавлен",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для добавления в корзину",
        variant: "destructive",
      });
      return;
    }
    if (!product) {
      toast({
        title: "Ошибка",
        description: "Данные продукта еще не загружены",
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
          productId: product.id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Ошибка при добавлении товара в корзину`);
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

  const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
  };

  if (!product) return <p>Загрузка...</p>;

  return (
    <>
      <Header />
      <div className="w-full flex flex-col py-8 px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40">
        <div className="bg-white rounded-xl flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 p-4">
            {/* --- 2. ИЗМЕНЕНИЯ ЗДЕСЬ --- */}
            <div className="flex items-center justify-center p-4">
              <div className="relative w-full h-[400px] md:h-[650px] rounded-xl overflow-hidden">
                <Image
                  src={product.imageUrl || "/placeholder.png"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder.png";
                  }}
                />
              </div>
            </div>
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

            <div className="flex flex-col p-4 w-full h-full justify-between">
              <div>
                <p className="text-4xl md:text-6xl text-center mb-10 md:mb-20 font-bold">
                  {product.name}
                </p>
                <p className="text-lg md:text-xl px-4 md:px-12 text-[#3f3f3f] mb-10">
                  {product.description}
                </p>
                <p className="text-lg md:text-xl px-4 md:px-12 text-[#3b3b3b] font-bold ">
                  Цена: ${product.price} USD
                </p>

                {convertedPrice !== null && selectedCurrency !== "USD" && (
                  <p className="text-base md:text-lg px-4 md:px-12 text-[#565656]">
                    Примерная цена в {selectedCurrency}:{" "}
                    {convertedPrice.toFixed(2)} {selectedCurrency}
                  </p>
                )}

                <div className="px-4 md:px-12 mt-4">
                  <label htmlFor="currencySelect" className="mr-2 font-bold">
                    Показать цену в:
                  </label>
                  <select
                    id="currencySelect"
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                    className="border rounded p-1"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="RUB">RUB</option>
                    <option value="BYN">BYN</option>
                  </select>
                </div>
              </div>
              {currentUser && currentUser.role === "USER" && (
                <div className="flex justify-center mt-6 mb-6">
                  <button
                    onClick={handleAddToCart}
                    className="bg-[#52b788] rounded-lg py-2 px-4 hover:bg-[#40916c] text-white"
                  >
                    Добавить в корзину
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Секция отзывов (без изменений) */}
          <div className="w-full p-4 md:p-10 bg-gray-50">
            <div className="flex flex-col w-full bg-white rounded-lg shadow-lg">
              <p className="px-6 md:px-10 py-6 text-2xl font-bold">
                Отзывы (средняя оценка: {costAverageRating()} ★)
              </p>

              <div className="flex px-6 md:px-10">
                {[...Array(5)].map((_, index) => (
                  <svg
                    key={index}
                    onClick={() => setRating(index + 1)}
                    className={`w-8 h-8 cursor-pointer ${
                      index < rating ? "text-yellow-500" : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 .587l3.668 7.431 8.23 1.197-5.95 5.784 1.408 8.235L12 18.896l-7.356 3.865 1.408-8.235-5.95-5.784 8.23-1.197z" />
                  </svg>
                ))}
              </div>
              <p className="px-6 md:px-10 py-4">Выбранный рейтинг: {rating}</p>

              {currentUser && (
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-20 bg-white rounded-lg p-5">
                  <Textarea
                    placeholder="Оставьте отзыв"
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    disabled={!currentUser}
                  />
                  <div className="h-full w-full md:w-[250px] md:pr-10">
                    <button
                      onClick={handleAddReview}
                      className="bg-[--button] hover:bg-[--buttonhover] text-white p-2 rounded-lg w-full transition duration-300 disabled:opacity-50"
                      disabled={!currentUser}
                    >
                      Оставить отзыв
                    </button>
                  </div>
                </div>
              )}

              {reviews.length > 0 && (
                <div className="flex flex-col items-center gap-5 rounded-lg px-4 md:px-14 py-8">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex flex-col px-5 py-2 gap-2 bg-[#f0fdf4] w-full rounded-lg"
                    >
                      <p className="text-lg font-bold">
                        {review.user.username} - {review.rating} ★
                      </p>
                      <p className="text-[#565656]">{review.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
