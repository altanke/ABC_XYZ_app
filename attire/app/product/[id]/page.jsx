"use client";

import Header from "@/components/shared/Header";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import { UserContext } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";

export default function Product() {
  const { id } = useParams();
  const { toast } = useToast();
  const { currentUser } = useContext(UserContext);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(0);

  // Новые состояния для конвертации валюты
  const [selectedCurrency, setSelectedCurrency] = useState("USD"); // Валюта по умолчанию (базовая)
  const [convertedPrice, setConvertedPrice] = useState(null); // Состояние для конвертированной цены

  // Fetch product and reviews
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/products/${id}`
        );
        if (!response.ok) throw new Error("Failed to load product data");
        const data = await response.json();
        setProduct(data);
        // При загрузке продукта сбрасываем конвертированную цену
        setConvertedPrice(null);
        setSelectedCurrency("USD"); // Сбрасываем выбранную валюту на базовую
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
        const response = await fetch(`http://localhost:8080/api/reviews/${id}`);
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
  }, [id, toast]); // Зависимости: id продукта и toast

  // Новый useEffect для получения конвертированной цены при изменении продукта или выбранной валюты
  useEffect(() => {
    // Не делаем запрос, если продукт еще не загружен или выбрана базовая валюта (USD)
    if (!product || selectedCurrency === "USD") {
      setConvertedPrice(null); // Сбрасываем конвертированную цену
      return;
    }

    const fetchConvertedPrice = async () => {
      try {
        // Обращаемся к новому эндпоинту на нашем бэкенде
        const response = await fetch(
          `http://localhost:8080/api/products/${product.id}/price/in/${selectedCurrency}`
        );
        if (!response.ok) {
          // Попытка прочитать сообщение об ошибке с бэкенда
          const errorText = await response.text();
          throw new Error(
            `Не удалось получить конвертированную цену: ${response.status} ${response.statusText} - ${errorText}`
          );
        }
        const data = await response.json();
        // Устанавливаем полученную конвертированную цену
        setConvertedPrice(data.convertedPrice);
      } catch (error) {
        toast({
          title: "Ошибка конвертации валюты",
          description: error.message,
          variant: "destructive",
        });
        setConvertedPrice(null); // Сбрасываем при ошибке
      }
    };

    // Выполняем запрос
    fetchConvertedPrice();
  }, [product, selectedCurrency, toast]); // Зависимости: загруженный продукт, выбранная валюта, toast

  const costAverageRating = () => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    return parseFloat((totalRating / reviews.length).toFixed(1));
  };

  const handleAddReview = async () => {
    // Проверка на аутентификацию перед добавлением отзыва
    if (!currentUser) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для добавления отзыва",
        variant: "destructive",
      });
      return;
    }
    // ... остальная логика добавления отзыва
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
    // Проверка на аутентификацию перед добавлением в корзину
    if (!currentUser) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для добавления в корзину",
        variant: "destructive",
      });
      return;
    }
    // ... остальная логика добавления в корзину
    try {
      const response = await fetch("http://localhost:8080/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: { id: currentUser.id }, // Указываем ID пользователя
          product: { id: product.id }, // Указываем ID продукта
          quantity: 1, // По умолчанию добавляем 1 товар
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Ошибка при добавлении товара в корзину: ${response.status} ${response.statusText} - ${errorText}`
        );
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

  // Обработчик изменения выбранной валюты
  const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
  };

  if (!product) return <p>Загрузка...</p>;

  return (
    <>
      <Header />
      <div className="w-full flex flex-col py-8 px-40">
        <div className="bg-white rounded-xl flex flex-col">
          <div className="grid grid-cols-2 p-4">
            <div className="flex items-center justify-center">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="rounded-xl object-cover h-[650px]"
              />
            </div>
            <div className="flex flex-col p-4 w-full h-full justify-between">
              <div>
                <p className="text-6xl text-center mb-20 font-bold">
                  {product.name}
                </p>
                <p className="text-xl px-12 text-[#3f3f3f] mb-10">
                  {product.description}
                </p>
                {/* Отображаем базовую цену */}
                <p className="text-xl px-12 text-[#3b3b3b] font-bold ">
                  Цена: ${product.price} USD
                </p>

                {/* Отображаем конвертированную цену, если она получена и валюта не базовая */}
                {convertedPrice !== null && selectedCurrency !== "USD" && (
                  <p className="text-lg px-12 text-[#565656]">
                    Примерная цена в {selectedCurrency}:{" "}
                    {convertedPrice.toFixed(2)} {selectedCurrency}
                  </p>
                )}

                {/* Селектор валюты */}
                <div className="px-12 mt-4">
                  <label htmlFor="currencySelect" className="mr-2 font-bold">
                    Показать цену в:
                  </label>
                  <select
                    id="currencySelect"
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                    className="border rounded p-1"
                  >
                    <option value="USD">USD</option> {/* Базовая валюта */}
                    <option value="EUR">EUR</option>
                    <option value="RUB">RUB</option>
                    <option value="BYN">BYN</option>{" "}
                  </select>
                </div>
              </div>
              {currentUser && currentUser.role === "USER" && (
                <div className="flex justify-center mb-6">
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

          {/* Секция отзывов */}
          <div className="w-full p-10 bg-gray-50">
            <div className="flex flex-col w-full bg-white rounded-lg shadow-lg">
              <p className="px-10 py-6 text-2xl font-bold">
                Отзывы (средняя оценка: {costAverageRating()} ★)
              </p>

              <div className="flex px-10">
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
              <p className="px-10 py-4">Выбранный рейтинг: {rating}</p>

              {/* Форма добавления отзыва - показывается только если пользователь аутентифицирован */}
              {currentUser && (
                <div className="flex flex-row items-center gap-20 bg-white rounded-lg p-5">
                  <Textarea
                    placeholder="Оставьте отзыв"
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    disabled={!currentUser} // Делаем поле неактивным, если не авторизован
                  />
                  <div className="h-full w-[250px] pr-10">
                    <button
                      onClick={handleAddReview}
                      className="bg-[--button] hover:bg-[--buttonhover] text-white p-2 rounded-lg w-full transition duration-300 disabled:opacity-50"
                      disabled={!currentUser} // Делаем кнопку неактивной, если не авторизован
                    >
                      Оставить отзыв
                    </button>
                  </div>
                </div>
              )}

              {/* Список отзывов */}
              {reviews.length > 0 && (
                <div className="flex flex-col items-center gap-5 rounded-lg px-14 py-8">
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
