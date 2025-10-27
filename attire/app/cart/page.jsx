"use client";

import Header from "@/components/shared/Header";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { currentUser } = useContext(UserContext);
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const fetchCartItems = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/cart/${currentUser.id}`
        );
        if (!response.ok) {
          throw new Error("Не удалось загрузить корзину");
        }
        const data = await response.json();
        setCartItems(data);

        // Рассчитываем общую сумму
        const totalSum = data.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0
        );
        setTotal(totalSum);
      } catch (error) {
        toast({
          title: "Ошибка",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchCartItems();
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

      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id !== cartItemId)
      );
      setTotal(
        (prevTotal) =>
          prevTotal -
          cartItems.find((item) => item.id === cartItemId).product.price *
            cartItems.find((item) => item.id === cartItemId).quantity
      );

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
    if (newQuantity < 1) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/cart/${cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newQuantity),
        }
      );

      if (!response.ok) {
        throw new Error("Не удалось обновить количество товара");
      }

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );

      const updatedTotal = cartItems.reduce(
        (acc, item) =>
          acc +
          (item.id === cartItemId
            ? item.product.price * newQuantity
            : item.product.price * item.quantity),
        0
      );

      setTotal(updatedTotal);

      toast({
        title: "Успех",
        description: "Количество товара обновлено",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/orders/${currentUser.id}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка оформления заказа");
      }

      setCartItems([]);
      setTotal(0);

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
    return <p>Пожалуйста, авторизуйтесь для просмотра корзины</p>;
  }

  return (
    <>
      <Header />
      <div className="w-full flex justify-center py-4">
        <div className="w-[55%] bg-white shadow rounded-lg flex flex-col p-6">
          <h2 className="text-center py-2 font-bold text-3xl">Корзина</h2>
          {cartItems.length > 0 ? (
            <>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between py-4 border-b h-40"
                >
                  <div className="flex flex-row items-center gap-5">
                    <div className="h-full flex justify-center">
                      <img
                        className="h-full object-cover rounded-md items-center"
                        src={item.product.imageUrl}
                        alt={item.product.name}
                      />
                    </div>
                    <div className="h-full flex flex-col justify-between">
                      <p className="font-bold text-xl">{item.product.name}</p>
                      <p className="text-[#565656] my-3">
                        Цена: ${item.product.price}
                      </p>
                      <p className="text-[#565656]">
                        Категория: {item.product.category}
                      </p>
                      <div className="flex items-center gap-2">
                        <label htmlFor={`quantity-${item.id}`}>
                          Количество:
                        </label>
                        <input
                          id={`quantity-${item.id}`}
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id,
                              parseInt(e.target.value)
                            )
                          }
                          className="w-16 border rounded-lg text-center"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-full flex items-center">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg transition duration-300 hover:bg-red-700"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}

              <div className="w-full flex justify-end py-4">
                <div className="flex flex-col items-end">
                  <p className="text-[#565656] text-xl font-bold mb-2">
                    Итого: ${total.toFixed(2)}
                  </p>
                  <button
                    onClick={handleCheckout}
                    className="bg-[--button] hover:bg-[--buttonhover] transition duration-300 text-white py-2 px-4 rounded-lg"
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
      </div>
    </>
  );
}
