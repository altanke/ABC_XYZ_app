"use client";

import Header from "@/components/shared/Header";
import ProductCard from "@/components/shared/product-card";
import { useState, useEffect } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/products");
        if (!response.ok) throw new Error("Ошибка загрузки продуктов");
        const data = await response.json();
        console.log("Загруженные продукты:", data);
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchProducts();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const filtered = products.filter((product) => {
      const searchLower = filterQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    });

    console.log("Отфильтрованные продукты:", filtered);
    setFilteredProducts(filtered);
  }, [filterQuery, products]);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setFilterQuery(searchQuery);
    }
  };

  return (
    <>
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
      />
      <div className="w-full px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 py-10">
        <p className="text-3xl font-bold text-center mb-12">Список товаров</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currentUser={currentUser}
              />
            ))
          ) : products.length === 0 ? (
            <p className="col-span-full text-center">Загрузка товаров...</p>
          ) : (
            <p className="col-span-full text-center">Товары не найдены</p>
          )}
        </div>
      </div>
    </>
  );
}
