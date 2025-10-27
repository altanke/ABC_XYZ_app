"use client";

import Header from "@/components/shared/Header";
import ProductCard from "@/components/shared/product-card";
import { useState, useEffect } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // Текущий ввод
  const [filterQuery, setFilterQuery] = useState(""); // Запрос для фильтрации
  const [currentUser, setCurrentUser] = useState(null);

  // Загрузка продуктов
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/products");
        if (!response.ok) throw new Error("Ошибка загрузки продуктов");
        const data = await response.json();
        console.log("Загруженные продукты:", data); // Проверяем данные
        setProducts(data);
        setFilteredProducts(data); // Изначально показываем все продукты
      } catch (error) {
        console.error(error);
      }
    };

    fetchProducts();

    // Загрузка пользователя
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Фильтрация продуктов по имени и категории
  useEffect(() => {
    const filtered = products.filter((product) => {
      const searchLower = filterQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) // Фильтрация по категории
      );
    });

    console.log("Отфильтрованные продукты:", filtered); // Проверяем фильтрацию
    setFilteredProducts(filtered);
  }, [filterQuery, products]);

  // Обработчик нажатия клавиши Enter
  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setFilterQuery(searchQuery); // Устанавливаем фильтр только при Enter
    }
  };

  return (
    <>
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
      />
      <div className="w-full px-52 py-10">
        <p className="text-3xl font-bold text-center mb-12">Список товаров</p>
        <div className="grid grid-cols-3 gap-x-[2%] gap-y-16 place-content-center">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currentUser={currentUser}
              />
            ))
          ) : (
            <p>Товары не найдены</p>
          )}
        </div>
      </div>
    </>
  );
}
