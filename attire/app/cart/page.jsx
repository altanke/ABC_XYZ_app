"use client";

import Header from "@/components/shared/Header";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image"; // <--- 1. Импортируем Image

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

export default function Cart() {
  const { currentUser } = useContext(UserContext);
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchCartItems = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/cart/user/${currentUser.id}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            setCartItems([]);
            setTotal(0);
            return;
          }
          throw new Error("Не удалось загрузить корзину");
        }
        const data = await response.json();
        setCartItems(data);

        const totalSum = data.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0
        );
        setTotal(totalSum);
      } catch (error) {
        console.error("Ошибка загрузки корзины:", error.message);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить корзину. " + error.message,
          variant: "destructive",
        });
        setCartItems([]);
        setTotal(0);
      }
    };

    fetchCartItems();
  }, [currentUser, toast]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const response = await fetch(
          `http://localhost:8080/api/orders/user/${currentUser.id}`
        );
        if (!response.ok) {
          throw new Error("Не удалось загрузить историю заказов");
        }
        const data = await response.json();
        data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        setOrders(data);
      } catch (error) {
        console.error("Ошибка загрузки заказов:", error.message);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить историю заказов. " + error.message,
          variant: "destructive",
        });
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [currentUser, toast]);

  const handleRemoveItem = async (cartItemId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/cart/${cartItemId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось удалить товар из корзины");
      }

      const removedItem = cartItems.find((item) => item.id === cartItemId);
      const newCartItems = cartItems.filter((item) => item.id !== cartItemId);
      setCartItems(newCartItems);
      if (removedItem) {
        setTotal(
          (prevTotal) =>
            prevTotal - removedItem.product.price * removedItem.quantity
        );
      } else {
        const totalSum = newCartItems.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0
        );
        setTotal(totalSum);
      }

      toast({
        title: "Успех",
        description: "Товар удалён из корзины",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) return;

    const currentItem = cartItems.find((item) => item.id === cartItemId);
    if (!currentItem) return;

    const originalQuantity = currentItem.quantity;
    const updatedCartItems = cartItems.map((item) =>
      item.id === cartItemId ? { ...item, quantity: quantity } : item
    );
    setCartItems(updatedCartItems);
    const updatedTotal = updatedCartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    setTotal(updatedTotal);

    try {
      const response = await fetch(
        `http://localhost:8080/api/cart/${cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(quantity),
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось обновить количество товара");
      }
    } catch (error) {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: originalQuantity }
            : item
        )
      );
      const originalTotal = cartItems.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      );
      setTotal(originalTotal);

      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      toast({
        title: "Ошибка",
        description: "Пользователь не авторизован",
        variant: "destructive",
      });
      return;
    }
    if (cartItems.length === 0) {
      toast({
        title: "Информация",
        description: "Корзина пуста",
        variant: "default",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/orders/user/${currentUser.id}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Ошибка оформления заказа");
      }

      setCartItems([]);
      setTotal(0);

      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await fetch(
            `http://localhost:8080/api/orders/user/${currentUser.id}`
          );
          if (!res.ok) throw new Error("Не удалось обновить историю заказов");
          const data = await res.json();
          data.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
          setOrders(data);
        } catch (err) {
          toast({
            title: "Ошибка",
            description: err.message,
            variant: "destructive",
          });
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();

      toast({
        title: "Успех",
        description: "Заказ успешно оформлен",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!currentUser) {
    return (
      <>
        <Header />
        <div className="w-full flex justify-center py-4">
          <p className="text-center text-xl font-bold text-red-600">
            Пожалуйста, авторизуйтесь для просмотра корзины и заказов
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="w-full flex flex-col items-center py-4 px-4 sm:px-8">
        <div className="w-full max-w-3xl bg-white shadow rounded-lg flex flex-col p-6 mb-8">
          <h2 className="text-center py-2 font-bold text-3xl">Корзина</h2>
          {cartItems.length > 0 ? (
            <>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row justify-between py-4 border-b sm:h-40"
                >
                  <div className="flex flex-row items-center gap-5 mb-4 sm:mb-0">
                    {/* --- 2. ИЗМЕНЕНИЯ ЗДЕСЬ --- */}
                    <div className="h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 flex justify-center relative rounded-md overflow-hidden">
                      <Image
                        src={item.product.imageUrl || "/placeholder.png"}
                        alt={item.product.name}
                        fill
                        sizes="128px"
                        className="object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.png";
                        }}
                      />
                    </div>
                    {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

                    <div className="flex flex-col justify-between">
                      <p className="font-bold text-lg sm:text-xl">
                        {item.product.name}
                      </p>
                      <p className="text-[#565656] my-1 sm:my-3 text-sm sm:text-base">
                        Цена: ${item.product.price.toFixed(2)}
                      </p>
                      <p className="text-[#565656] text-sm sm:text-base">
                        Категория: {item.product.category}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <label
                          htmlFor={`quantity-${item.id}`}
                          className="text-sm sm:text-base"
                        >
                          Количество:
                        </label>
                        <input
                          id={`quantity-${item.id}`}
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item.id, e.target.value)
                          }
                          className="w-16 border rounded-lg text-center p-1"
                          min="1"
                        />
                      </div>
                      <p className="text-[#565656] font-semibold mt-1 text-sm sm:text-base">
                        Сумма: $
                        {(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end sm:justify-center">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg transition duration-300 hover:bg-red-700 text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}

              <div className="w-full flex justify-end py-4 mt-4">
                <div className="flex flex-col items-end">
                  <p className="text-[#565656] text-xl font-bold mb-2">
                    Итого: ${total.toFixed(2)}
                  </p>
                  <button
                    onClick={handleCheckout}
                    className="bg-[--button] hover:bg-[--buttonhover] transition duration-300 text-white py-2 px-4 rounded-lg disabled:opacity-50"
                    disabled={cartItems.length === 0}
                  >
                    Оформить заказ
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center py-2">Ваша корзина пуста.</p>
          )}
        </div>

        {/* Секция истории заказов */}
        <div className="w-full max-w-3xl bg-white shadow rounded-lg flex flex-col p-6">
          <h2 className="text-center py-2 font-bold text-3xl mb-4">
            История заказов
          </h2>
          {loadingOrders ? (
            <p className="text-center">Загрузка заказов...</p>
          ) : orders.length > 0 ? (
            <div className="flex flex-col gap-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-3 pb-2 border-b">
                    <p className="font-bold text-lg">Заказ #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.orderDate)}
                    </p>
                  </div>
                  <div className="mb-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between mb-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {/* --- 3. ИЗМЕНЕНИЯ ЗДЕСЬ --- */}
                          <div className="w-8 h-8 relative rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={item.product.imageUrl || "/placeholder.png"}
                              alt={item.product.name}
                              fill
                              sizes="32px"
                              className="object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/placeholder.png";
                              }}
                            />
                          </div>
                          {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
                          <span>{item.product.name}</span>
                        </div>
                        <span>
                          {item.quantity} шт. x $
                          {Number(item.priceAtPurchase).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-right font-bold text-base">
                    Итоговая сумма: ${Number(order.totalPrice).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">У вас еще нет заказов.</p>
          )}
        </div>
      </div>
    </>
  );
}
