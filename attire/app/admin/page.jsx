"use client";

import Header from "@/components/shared/Header";
import { useState, useEffect, useContext, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserContext } from "@/context/UserContext";
import Image from "next/image"; // <--- 1. Импортируем Image

export default function AdminProductsPage() {
  const { toast } = useToast();
  const { currentUser, loading: userLoading } = useContext(UserContext);

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      const fetchProducts = async () => {
        try {
          const response = await fetch("http://localhost:8080/api/products");
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Не удалось загрузить товары: ${response.status} ${response.statusText} - ${errorText}`
            );
          }
          const data = await response.json();
          setProducts(data);
        } catch (error) {
          toast({
            title: "Ошибка загрузки товаров",
            description: error.message,
            variant: "destructive",
          });
        }
      };
      fetchProducts();
    } else if (!userLoading) {
      setProducts([]);
    }
  }, [currentUser, userLoading, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleAddOrEditProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      toast({
        title: "Ошибка",
        description: "Название, цена и категория обязательны",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser || currentUser.role !== "ADMIN") {
      toast({
        title: "Ошибка",
        description: "У вас нет прав на выполнение этого действия",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    const productData = { ...newProduct, price: parseFloat(newProduct.price) };
    formData.append(
      "product",
      new Blob([JSON.stringify(productData)], { type: "application/json" })
    );

    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    const url = isEditing
      ? `http://localhost:8080/api/products/${editingProductId}`
      : "http://localhost:8080/api/products";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Не удалось ${isEditing ? "обновить" : "добавить"} товар: ${
            response.status
          } ${response.statusText} - ${errorText}`
        );
      }

      const resultProduct = await response.json();

      if (isEditing) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProductId ? resultProduct : p))
        );
        toast({ title: "Успех", description: "Товар обновлён" });
      } else {
        setProducts((prev) => [...prev, resultProduct]);
        toast({ title: "Успех", description: "Товар добавлен" });
      }

      setNewProduct({ name: "", description: "", price: "", category: "" });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsEditing(false);
      setEditingProductId(null);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product) => {
    if (!currentUser || currentUser.role !== "ADMIN") {
      toast({
        title: "Ошибка",
        description: "У вас нет прав на выполнение этого действия",
        variant: "destructive",
      });
      return;
    }
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsEditing(true);
    setEditingProductId(product.id);
  };

  const handleDeleteProduct = async (id) => {
    if (!currentUser || currentUser.role !== "ADMIN") {
      toast({
        title: "Ошибка",
        description: "У вас нет прав на выполнение этого действия",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Не удалось удалить товар: ${response.status} ${response.statusText} - ${errorText}`
        );
      }
      setProducts((prev) => prev.filter((product) => product.id !== id));
      toast({ title: "Успех", description: "Товар удалён" });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (userLoading) {
    return (
      <>
        <Header />
        <div className="w-full flex justify-center py-4">
          <p>Загрузка...</p>
        </div>
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Header />
        <div className="w-full flex justify-center py-4">
          <p className="text-center text-xl font-bold text-red-600">
            Пожалуйста, авторизуйтесь для доступа к панели администратора
          </p>
        </div>
      </>
    );
  }

  if (currentUser.role !== "ADMIN") {
    return (
      <>
        <Header />
        <div className="w-full flex justify-center py-4">
          <p className="text-center text-xl font-bold text-red-600">
            У вас нет прав доступа к панели администратора
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="w-full flex justify-center py-4 px-4 sm:px-8">
        <div className="w-full max-w-5xl bg-white shadow rounded-lg flex flex-col p-6">
          <h2 className="text-center py-2 font-bold text-3xl">
            Панель администратора - Управление товарами
          </h2>

          <h3 className="text-center py-2 font-bold text-2xl">
            {isEditing ? "Редактировать товар" : "Добавить новый товар"}
          </h3>
          <form
            onSubmit={handleAddOrEditProduct}
            className="flex flex-col gap-2 text-[#565656]"
          >
            <label className="font-bold">Название:</label>
            <input
              className="border border-gray-300 rounded-lg p-1 pl-3 mb-2"
              type="text"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              required
            />
            <label className="font-bold">Описание:</label>
            <textarea
              className="border border-gray-300 rounded-lg p-1 pl-3 mb-2"
              rows="2"
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
              style={{ resize: "none" }}
              required
            ></textarea>
            <label className="font-bold">Цена:</label>
            <input
              className="border border-gray-300 rounded-lg p-1 pl-3 mb-2"
              type="number"
              name="price"
              value={newProduct.price}
              onChange={handleInputChange}
              step="0.01"
              required
            />
            <label className="font-bold">Категория:</label>
            <input
              className="border border-gray-300 rounded-lg p-1 pl-3 mb-2"
              type="text"
              name="category"
              value={newProduct.category}
              onChange={handleInputChange}
              required
            />
            <label className="font-bold">Изображение:</label>
            <input
              className="border border-gray-300 rounded-lg p-1 mb-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              type="file"
              name="image"
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/gif"
              ref={fileInputRef}
            />
            {selectedFile && (
              <p className="text-sm text-gray-500">
                Выбран файл: {selectedFile.name}
              </p>
            )}
            {isEditing &&
              !selectedFile &&
              products.find((p) => p.id === editingProductId)?.imageUrl && (
                <p className="text-sm text-gray-500">
                  Текущее изображение:{" "}
                  {products
                    .find((p) => p.id === editingProductId)
                    .imageUrl.split("/")
                    .pop()}
                </p>
              )}
            <button
              type="submit"
              className={`${
                isEditing
                  ? "bg-yellow-500 hover:bg-yellow-700"
                  : "bg-[--button] hover:bg-[--buttonhover]"
              } text-white font-bold py-2 px-4 rounded-lg transition duration-300 mt-2`}
            >
              {isEditing ? "Сохранить изменения" : "Добавить товар"}
            </button>
          </form>

          <h3 className="text-center py-5 font-bold text-2xl text-[#565656]">
            Список товаров
          </h3>
          <div className="flex flex-col gap-4">
            {products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col sm:flex-row justify-between py-4 border-b sm:h-40"
                >
                  <div className="flex flex-row items-center gap-5 mb-4 sm:mb-0">
                    {/* --- 2. ИЗМЕНЕНИЯ ЗДЕСЬ --- */}
                    <div className="h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 flex justify-center relative rounded-md overflow-hidden">
                      <Image
                        className="object-cover"
                        src={product.imageUrl || "/placeholder.png"}
                        alt={product.name}
                        fill
                        sizes="128px"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.png";
                        }}
                      />
                    </div>
                    {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
                    <div className="h-full flex flex-col justify-between py-4">
                      <p className="font-bold text-xl">{product.name}</p>
                      <p className="text-[#565656]">Цена: ${product.price}</p>
                      <p className="text-[#565656]">
                        Категория: {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end sm:justify-center sm:flex-col">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="bg-yellow-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-yellow-700 transition duration-300"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-red-700 transition duration-300"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center">
                Товары не загружены или отсутствуют.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
