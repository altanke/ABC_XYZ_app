"use client";

import Header from "@/components/shared/Header";
import { useState, useEffect, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserContext } from "@/context/UserContext";

import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminPanel() {
  const { toast } = useToast();
  const { currentUser } = useContext(UserContext);

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [summary, setSummary] = useState(null); // Сводные данные (карточки)
  const [productRatings, setProductRatings] = useState([]); // Рейтинги продуктов (таблица)
  const [loadingReports, setLoadingReports] = useState(true); // Состояние загрузки отчетов
  const [errorReports, setErrorReports] = useState(null); // Состояние ошибки отчетов

  const [productRatingsChartData, setProductRatingsChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [productsByCategory, setProductsByCategory] = useState([]);
  const [productsByCategoryChartData, setProductsByCategoryChartData] =
    useState({
      labels: [],
      datasets: [],
    });

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

  useEffect(() => {
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
  }, [toast]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        setErrorReports(null);

        // 1. Загрузка сводного отчета
        const summaryResponse = await fetch(
          "http://localhost:8080/api/reports/summary"
        );
        if (!summaryResponse.ok) {
          const errorText = await summaryResponse.text();
          throw new Error(
            `Не удалось загрузить сводный отчет: ${summaryResponse.status} ${summaryResponse.statusText} - ${errorText}`
          );
        }
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);

        // 2. Загрузка отчета по средним рейтингам продуктов
        const ratingsResponse = await fetch(
          "http://localhost:8080/api/reports/average-product-ratings"
        );
        if (!ratingsResponse.ok) {
          const errorText = await ratingsResponse.text();
          throw new Error(
            `Не удалось загрузить отчет по рейтингам: ${ratingsResponse.status} ${ratingsResponse.statusText} - ${errorText}`
          );
        }
        const ratingsData = await ratingsResponse.json();
        setProductRatings(ratingsData);

        // 3. Подготовка данных для графика среднего рейтинга продуктов (Bar Chart)
        if (ratingsData && ratingsData.length > 0) {
          const chartLabels = ratingsData.map((item) => item.productName);
          const chartRatings = ratingsData.map((item) =>
            item.averageRating ? parseFloat(item.averageRating.toFixed(1)) : 0
          );

          setProductRatingsChartData({
            labels: chartLabels,
            datasets: [
              {
                label: "Средний рейтинг",
                data: chartRatings,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
            ],
          });
        } else {
          setProductRatingsChartData({ labels: [], datasets: [] });
        }

        // 4. Загрузка отчета по продуктам по категориям
        const categoryResponse = await fetch(
          "http://localhost:8080/api/reports/products-by-category"
        );
        if (!categoryResponse.ok) {
          const errorText = await categoryResponse.text();
          throw new Error(
            `Не удалось загрузить отчет по категориям: ${categoryResponse.status} ${categoryResponse.statusText} - ${errorText}`
          );
        }
        const categoryData = await categoryResponse.json();
        setProductsByCategory(categoryData);

        if (categoryData && categoryData.length > 0) {
          const chartLabels = categoryData.map((item) => item.category);
          const chartCounts = categoryData.map((item) => item.productCount);

          const backgroundColors = chartLabels.map(
            (_, index) =>
              `hsl(${(index * (360 / chartLabels.length)) % 360}, 70%, 60%)`
          );

          setProductsByCategoryChartData({
            labels: chartLabels,
            datasets: [
              {
                label: "Количество продуктов", // Подпись для данных
                data: chartCounts, // Сами данные (количество)
                backgroundColor: backgroundColors, // Массив цветов для каждого сектора
                borderColor: "#fff", // Белая граница между секторами
                borderWidth: 1,
              },
            ],
          });
        } else {
          setProductsByCategoryChartData({ labels: [], datasets: [] });
        }
      } catch (err) {
        setErrorReports(err.message);
        toast({
          title: "Ошибка загрузки отчетов",
          description: err.message,
          variant: "destructive",
        });
        setSummary(null);
        setProductRatings([]);
        setProductRatingsChartData({ labels: [], datasets: [] });
        setProductsByCategory([]);
        setProductsByCategoryChartData({ labels: [], datasets: [] });
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEditProduct = async (e) => {
    e.preventDefault();
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.category ||
      !newProduct.imageUrl
    ) {
      toast({
        title: "Ошибка",
        description: "Название, цена, категория и URL изображения обязательны",
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
    if (isEditing) {
      try {
        const response = await fetch(
          `http://localhost:8080/api/products/${editingProductId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...newProduct,
              price: parseFloat(newProduct.price),
            }),
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Не удалось обновить товар: ${response.status} ${response.statusText} - ${errorText}`
          );
        }
        const updatedProduct = await response.json();
        setProducts((prev) =>
          prev.map((product) =>
            product.id === editingProductId ? updatedProduct : product
          )
        );
        toast({ title: "Успех", description: "Товар обновлён" });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      try {
        const response = await fetch("http://localhost:8080/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newProduct,
            price: parseFloat(newProduct.price),
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Не удалось добавить товар: ${response.status} ${response.statusText} - ${errorText}`
          );
        }
        const addedProduct = await response.json();
        setProducts((prev) => [...prev, addedProduct]);
        toast({ title: "Успех", description: "Товар добавлен" });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: error.message,
          variant: "destructive",
        });
      }
    }
    setNewProduct({
      name: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
    });
    setIsEditing(false);
    setEditingProductId(null);
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
      imageUrl: product.imageUrl,
    });
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

  // Настройки для графика (опции Chart.js)
  const chartOptions = {
    responsive: true, // График будет адаптивным
    plugins: {
      legend: {
        // Настройки легенды
        position: "top",
      },
      title: {
        // Настройки заголовка графика
        display: true,
        text: "Средний рейтинг продуктов",
      },
      tooltip: {
        // Настройки всплывающей подсказки при наведении
        callbacks: {
          label: function (context) {
            // Форматируем отображение значения рейтинга
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + " ★"; // Отображаем рейтинг с одной цифрой после запятой и звездочкой
            }
            // Находим соответствующий элемент из исходных данных productRatings
            // чтобы получить количество отзывов для отображения в подсказке
            const productItem = productRatings.find(
              (pr) => pr.productName === context.label
            );
            if (productItem) {
              label += ` (${productItem.reviewCount} отзывов)`; // Добавляем количество отзывов
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        // Настройки оси Y (рейтинг)
        beginAtZero: true, // Начинаем от нуля
        max: 5, // Максимальное значение шкалы - 5 (для рейтинга)
        title: {
          // Подпись оси Y
          display: true,
          text: "Рейтинг",
        },
      },
      x: {
        // Настройки оси X (названия продуктов)
        title: {
          // Подпись оси X
          display: true,
          text: "Продукт",
        },
      },
    },
  };

  // Настройки для графика распределения по категориям (Pie Chart)
  const pieChartOptions = {
    responsive: true, // График будет адаптивным
    maintainAspectRatio: false, // Позволяет лучше контролировать размеры через CSS
    plugins: {
      legend: {
        // Легенда (показывает категории и их цвет)
        position: "top",
      },
      tooltip: {
        // Всплывающие подсказки при наведении на сектор
        callbacks: {
          label: function (context) {
            const label = context.label || ""; // Название категории
            const value = context.parsed || 0; // Количество продуктов
            const total = context.dataset.data.reduce(
              (sum, val) => sum + val,
              0
            );
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`; // Формат: Категория: Количество (Процент%)
          },
        },
      },
    },
  };

  return (
    <>
      <Header />
      <div className="w-full flex justify-center py-4">
        <div className="w-[70%] bg-white shadow rounded-lg flex flex-col p-6">
          {" "}
          {/* Увеличил ширину для размещения графиков */}
          <h2 className="text-center py-2 font-bold text-3xl">
            Панель администратора
          </h2>
          {/* Секция управления продуктами */}
          <h3 className="text-center py-2 font-bold text-2xl">
            {isEditing ? "Редактировать товар" : "Добавить новый товар"}
          </h3>
          <form
            onSubmit={handleAddOrEditProduct}
            className="flex flex-col gap-2 text-[#565656]"
          >
            {/* Поля формы (оставляем как было, возможно, добавив 'required') */}
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
            <label className="font-bold">URL изображения:</label>
            <input
              className="border border-gray-300 rounded-lg p-1 pl-3 mb-2"
              type="text"
              name="imageUrl"
              value={newProduct.imageUrl}
              onChange={handleInputChange}
              required
            />

            <button
              type="submit"
              className={`${
                isEditing
                  ? "bg-yellow-500 hover:bg-yellow-700"
                  : "bg-[--button] hover:bg-[--buttonhover]"
              } text-white font-bold py-2 px-4 rounded-lg transition duration-300`}
            >
              {isEditing ? "Сохранить изменения" : "Добавить товар"}
            </button>
          </form>
          <h3 className="text-center py-5 font-bold text-2xl text-[#565656]">
            Управление товарами
          </h3>
          <div className="flex flex-col gap-4">
            {/* Список товаров (оставляем как было) */}
            {products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between py-4 border-b h-40"
                >
                  <div className="flex flex-row items-center gap-5">
                    <div className="h-full flex justify-center">
                      <img
                        className="h-full object-cover rounded-md items-center"
                        src={product.imageUrl}
                        alt={product.name}
                      />
                    </div>
                    <div className="h-full flex flex-col justify-between py-4">
                      <p className="font-bold text-xl">{product.name}</p>
                      <p className="text-[#565656]">Цена: ${product.price}</p>
                      <p className="text-[#565656]">
                        Категория: {product.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-full flex flex-col justify-center">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="bg-yellow-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-yellow-700 transition duration-300"
                      >
                        Редактировать
                      </button>
                    </div>
                    <div className="h-full flex flex-col justify-center">
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-red-700 transition duration-300"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center">
                Товары не загружены или отсутствуют.
              </p>
            )}
          </div>
          {/* --- Секция Отчетов --- */}
          <h3 className="text-center py-5 font-bold text-2xl text-[#565656] mt-8">
            Отчеты по магазину
          </h3>
          {/* Индикаторы загрузки и ошибок для отчетов */}
          {loadingReports && <p className="text-center">Загрузка отчетов...</p>}
          {errorReports && (
            <p className="text-center text-red-600">
              Ошибка загрузки отчетов: {errorReports}
            </p>
          )}
          {!loadingReports && !errorReports && (
            <div className="flex flex-col gap-6">
              {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 text-lg text-[#565656]">
                  <div className="bg-green-100 p-4 rounded-lg shadow flex flex-col items-center">
                    <strong className="text-xl text-green-700">
                      Пользователей
                    </strong>
                    <span className="text-2xl font-bold text-green-900">
                      {summary.userCount}
                    </span>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg shadow flex flex-col items-center">
                    <strong className="text-xl text-green-700">
                      Продуктов
                    </strong>
                    <span className="text-2xl font-bold text-green-900">
                      {summary.productCount}
                    </span>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg shadow flex flex-col items-center">
                    <strong className="text-xl text-green-700">Заказов</strong>
                    <span className="text-2xl font-bold text-green-900">
                      {summary.orderCount}
                    </span>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg shadow flex flex-col items-center">
                    <strong className="text-xl text-green-700">Выручка</strong>
                    <span className="text-2xl font-bold text-green-900">
                      $
                      {summary.totalRevenue
                        ? summary.totalRevenue.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg shadow flex flex-col items-center">
                    <strong className="text-xl text-green-700">Отзывов</strong>
                    <span className="text-2xl font-bold text-green-900">
                      {summary.reviewCount}
                    </span>
                  </div>
                </div>
              )}
              {!summary && !loadingReports && !errorReports && (
                <p className="text-center mt-4 text-[#565656]">
                  Нет сводных данных для отображения.
                </p>
              )}

              {/* Таблица среднего рейтинга продуктов */}
              {productRatings.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-bold text-xl mb-4 text-center">
                    Средний рейтинг продуктов
                  </h4>
                  <div className="overflow-x-auto rounded-lg shadow">
                    {" "}
                    {/* Добавлено для горизонтального скролла на маленьких экранах */}
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead>
                        <tr className="bg-gray-200 text-[#565656] uppercase text-sm leading-normal">
                          <th className="py-3 px-6 text-left">ID</th>
                          <th className="py-3 px-6 text-left">
                            Название Продукта
                          </th>
                          <th className="py-3 px-6 text-center">Рейтинг</th>
                          <th className="py-3 px-6 text-center">Отзывов</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#565656] text-sm font-light">
                        {productRatings.map((item) => (
                          <tr
                            key={item.productId}
                            className="border-b border-gray-200 hover:bg-gray-100"
                          >
                            <td className="py-3 px-6 text-left whitespace-nowrap">
                              {item.productId}
                            </td>
                            <td className="py-3 px-6 text-left">
                              {item.productName}
                            </td>
                            <td className="py-3 px-6 text-center">
                              {item.averageRating
                                ? item.averageRating.toFixed(1)
                                : "N/A"}{" "}
                              ★
                            </td>
                            <td className="py-3 px-6 text-center">
                              {item.reviewCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Сообщение, если табличные данные пусты */}
              {productRatings.length === 0 &&
                !loadingReports &&
                !errorReports &&
                summary /* Проверяем, что summary загружены, чтобы избежать сообщения при общей ошибке */ && (
                  <p className="text-center mt-4 text-[#565656]">
                    Нет данных о рейтингах продуктов для таблицы.
                  </p>
                )}

              {/* График среднего рейтинга продуктов */}
              {/* Отображаем график только если есть данные в productRatingsChartData */}
              {productRatingsChartData &&
                productRatingsChartData.labels.length > 0 && (
                  <div className="mt-8 p-4 bg-white rounded-lg shadow">
                    {" "}
                    {/* Добавил фон и тени для графика */}
                    {/* Chart.js Bar компонента */}
                    <Bar
                      data={productRatingsChartData}
                      options={chartOptions}
                    />
                  </div>
                )}
              {/* Сообщение, если нет данных для графика */}
              {(!productRatingsChartData ||
                productRatingsChartData.labels.length === 0) &&
                !loadingReports &&
                !errorReports &&
                productRatings.length > 0 && (
                  <p className="text-center mt-4 text-[#565656]">
                    Нет данных для построения графика рейтингов.
                  </p>
                )}
              {/* График: Распределение продуктов по категориям (Pie Chart) */}
              {productsByCategoryChartData &&
                productsByCategoryChartData.labels.length > 0 && (
                  <div className="mt-8 p-4 bg-white rounded-lg shadow">
                    {" "}
                    <h4 className="font-bold text-xl mb-4 text-center">
                      Распределение продуктов по категориям
                    </h4>{" "}
                    <div style={{ height: "400px" }}>
                      {" "}
                      <Pie
                        data={productsByCategoryChartData}
                        options={pieChartOptions}
                      />
                    </div>
                  </div>
                )}
              {(!productsByCategoryChartData ||
                productsByCategoryChartData.labels.length === 0) &&
                !loadingReports &&
                !errorReports &&
                productsByCategory.length > 0 && (
                  <p className="text-center mt-4 text-[#565656]">
                    Нет данных для построения графика распределения по
                    категориям.
                  </p>
                )}

              {/* Общее сообщение, если вообще нет данных по категориям */}
              {productsByCategory.length === 0 &&
                !loadingReports &&
                !errorReports &&
                summary /* Проверяем summary, чтобы не показывать это сообщение при общей ошибке */ && (
                  <p className="text-center mt-4 text-[#565656]">
                    Нет данных о категориях продуктов для отображения.
                  </p>
                )}
              {/* <-- КОНЕЦ ДОБАВЛЕННОГО БЛОКА --> */}
            </div>
          )}
          {/* --- Конец Секции Отчетов --- */}
        </div>
      </div>
    </>
  );
}
