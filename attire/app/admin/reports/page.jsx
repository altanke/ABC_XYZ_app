"use client";

import Header from "@/components/shared/Header";
import { useState, useEffect, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserContext } from "@/context/UserContext";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminReportsPage() {
  const { toast } = useToast();
  const { currentUser, loading: userLoading } = useContext(UserContext);

  const [reportData, setReportData] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [errorReports, setErrorReports] = useState(null);

  // Состояния для Dashboard
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgCheck: 0,
    topCategory: "",
  });
  const [categoryChartData, setCategoryChartData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);

  const [matrix, setMatrix] = useState({
    AX: [],
    AY: [],
    AZ: [],
    BX: [],
    BY: [],
    BZ: [],
    CX: [],
    CY: [],
    CZ: [],
  });
  const [matrixTotals, setMatrixTotals] = useState({
    A: 0,
    B: 0,
    C: 0,
    X: 0,
    Y: 0,
    Z: 0,
    total: 0,
  });

  const [abcPieChartData, setAbcPieChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [xyzBarChartData, setXyzBarChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [currentView, setCurrentView] = useState("Dashboard");

  const [months, setMonths] = useState(12);
  const [sliderValue, setSliderValue] = useState([12]);

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      const fetchAbcXyzReport = async () => {
        try {
          setLoadingReports(true);
          setErrorReports(null);
          setReportData([]);

          const response = await fetch(
            `http://localhost:8080/api/reports/abc-xyz-analysis?months=${months}`
          );
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Не удалось загрузить отчет: ${response.status} ${response.statusText} - ${errorText}`
            );
          }
          const data = await response.json();
          setReportData(data);
          processMatrixData(data);
          calculateDashboardData(data);
        } catch (err) {
          setErrorReports(err.message);
          toast({
            title: "Ошибка загрузки отчета",
            description: err.message,
            variant: "destructive",
          });
          setReportData([]);
        } finally {
          setLoadingReports(false);
        }
      };
      fetchAbcXyzReport();
    } else if (!userLoading) {
      setLoadingReports(false);
      setReportData([]);
    }
  }, [currentUser, userLoading, toast, months]);

  const calculateDashboardData = (data) => {
    if (!data || data.length === 0) return;

    // 1. Общие метрики
    const totalRev = data.reduce((acc, item) => acc + item.totalRevenue, 0);

    // Считаем категории
    const categoryStats = {};
    data.forEach((item) => {
      const cat = item.product.category;
      if (!categoryStats[cat]) categoryStats[cat] = 0;
      categoryStats[cat] += item.totalRevenue;
    });

    const categories = Object.keys(categoryStats);
    const revenues = Object.values(categoryStats);

    // Находим топ категорию
    let maxRev = -1;
    let topCat = "Нет данных";
    for (const [cat, rev] of Object.entries(categoryStats)) {
      if (rev > maxRev) {
        maxRev = rev;
        topCat = cat;
      }
    }

    setDashboardMetrics({
      totalRevenue: totalRev,
      totalOrders: data.length,
      avgCheck: data.length > 0 ? totalRev / data.length : 0,
      topCategory: topCat,
    });

    // 2. График категорий
    setCategoryChartData({
      labels: categories,
      datasets: [
        {
          label: "Выручка ($)",
          data: revenues,
          backgroundColor: [
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 99, 132, 0.7)",
            "rgba(255, 206, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(153, 102, 255, 0.7)",
          ],
          borderWidth: 1,
        },
      ],
    });

    // 3. Топ-5 товаров
    const sorted = [...data]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
    setTopProducts(sorted);
  };

  const processMatrixData = (data) => {
    const newMatrix = {
      AX: [],
      AY: [],
      AZ: [],
      BX: [],
      BY: [],
      BZ: [],
      CX: [],
      CY: [],
      CZ: [],
    };
    const newTotals = { A: 0, B: 0, C: 0, X: 0, Y: 0, Z: 0, total: 0 };

    data.forEach((item) => {
      if (item.totalRevenue > 0) {
        const combinedClass = item.combinedClass;
        if (newMatrix[combinedClass]) {
          newMatrix[combinedClass].push(item.product.name);
        }
        if (item.abcClass === "A") newTotals.A++;
        if (item.abcClass === "B") newTotals.B++;
        if (item.abcClass === "C") newTotals.C++;
        if (item.xyzClass === "X") newTotals.X++;
        if (item.xyzClass === "Y") newTotals.Y++;
        if (item.xyzClass === "Z") newTotals.Z++;
        newTotals.total++;
      }
    });

    setMatrix(newMatrix);
    setMatrixTotals(newTotals);

    setAbcPieChartData({
      labels: [
        "Категория A (Важные)",
        "Категория B (Средние)",
        "Категория C (Малые)",
      ],
      datasets: [
        {
          label: "Кол-во товаров",
          data: [newTotals.A, newTotals.B, newTotals.C],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    });

    setXyzBarChartData({
      labels: ["Группа A", "Группа B", "Группа C"],
      datasets: [
        {
          label: "X (Стабильные)",
          data: [newMatrix.AX.length, newMatrix.BX.length, newMatrix.CX.length],
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderRadius: 4,
        },
        {
          label: "Y (Переменные)",
          data: [newMatrix.AY.length, newMatrix.BY.length, newMatrix.CY.length],
          backgroundColor: "rgba(245, 158, 11, 0.7)",
          borderRadius: 4,
        },
        {
          label: "Z (Непредсказуемые)",
          data: [newMatrix.AZ.length, newMatrix.BZ.length, newMatrix.CZ.length],
          backgroundColor: "rgba(239, 68, 68, 0.7)",
          borderRadius: 4,
        },
      ],
    });
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const headers = [
      "ID",
      "Название",
      "Категория",
      "Выручка ($)",
      "Доля (%)",
      "ABC",
      "CV",
      "XYZ",
      "Итог",
    ];
    const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;
    const rows = reportData.map((item) =>
      [
        item.product.id,
        escapeCSV(item.product.name),
        escapeCSV(item.product.category),
        Number(item.totalRevenue).toFixed(2),
        item.revenueSharePercentage.toFixed(2),
        item.abcClass,
        item.coefficientOfVariation.toFixed(3),
        item.xyzClass,
        item.combinedClass,
      ].join(",")
    );
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report_${months}m.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (userLoading) return <div className="p-10 text-center">Загрузка...</div>;
  if (!currentUser || currentUser.role !== "ADMIN")
    return (
      <div className="p-10 text-center text-red-600 font-bold">Нет доступа</div>
    );

  const getTabClassName = (viewName) => {
    const baseStyle =
      "py-2 px-4 rounded-lg font-medium transition-colors duration-200";
    return currentView === viewName
      ? `${baseStyle} bg-[--button] text-white`
      : `${baseStyle} bg-gray-100 text-gray-600 hover:bg-gray-200`;
  };

  const getMatrixCellColor = (abc, xyz) => {
    const combined = abc + xyz;
    if (["AX", "BX", "AY"].includes(combined)) return "bg-green-50";
    if (["CX", "BY", "AZ"].includes(combined)) return "bg-yellow-50";
    return "bg-red-50";
  };

  // --- ВОТ ЭТИ ОПЦИИ БЫЛИ ПРОПУЩЕНЫ В ПРОШЛЫЙ РАЗ ---
  const xyzBarOptions = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: "Количество товаров",
        },
        grid: { color: "#f0f0f0" },
      },
    },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
  };

  const abcPieOptions = {
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          font: { size: 14 },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              const total = context.chart.data.datasets[0].data.reduce(
                (a, b) => a + b,
                0
              );
              const percentage =
                total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
              label += `${context.parsed} шт. (${percentage}%)`;
            }
            return label;
          },
        },
      },
    },
  };
  // --- КОНЕЦ ДОБАВЛЕННЫХ ОПЦИЙ ---

  return (
    <>
      <Header />
      <div className="w-full flex justify-center py-4 px-4 sm:px-8">
        <div className="w-full max-w-7xl bg-white shadow rounded-lg flex flex-col p-6">
          <h2 className="text-center py-2 font-bold text-3xl mb-4">
            Аналитика Магазина
          </h2>

          <div className="flex justify-center flex-wrap gap-2 mb-4 border-b pb-4">
            <button
              onClick={() => setCurrentView("Dashboard")}
              className={getTabClassName("Dashboard")}
            >
              Общая статистика
            </button>
            <button
              onClick={() => setCurrentView("Combined")}
              className={getTabClassName("Combined")}
            >
              ABC/XYZ матрица
            </button>
            <button
              onClick={() => setCurrentView("ABC")}
              className={getTabClassName("ABC")}
            >
              ABC анализ
            </button>
            <button
              onClick={() => setCurrentView("XYZ")}
              className={getTabClassName("XYZ")}
            >
              XYZ анализ
            </button>
          </div>

          <div className="mb-8 p-4 border rounded-lg max-w-2xl mx-auto w-full">
            <label className="block text-center font-medium text-lg mb-2">
              Период анализа: {sliderValue[0]} мес.
            </label>
            <Slider
              defaultValue={[12]}
              value={sliderValue}
              min={2}
              max={12}
              step={1}
              onValueChange={setSliderValue}
              onValueCommit={(val) => setMonths(val[0])}
            />
          </div>

          {loadingReports ? (
            <p className="text-center">Загрузка данных...</p>
          ) : errorReports ? (
            <p className="text-center text-red-600">{errorReports}</p>
          ) : reportData.length === 0 ? (
            <p className="text-center text-gray-500">
              Нет данных за выбранный период.
            </p>
          ) : (
            <>
              {/* --- DASHBOARD VIEW --- */}
              {currentView === "Dashboard" && (
                <div className="flex flex-col gap-8">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
                      <p className="text-blue-600 text-sm font-semibold uppercase">
                        Общая выручка
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        ${dashboardMetrics.totalRevenue.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-100">
                      <p className="text-green-600 text-sm font-semibold uppercase">
                        Активных товаров
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        {dashboardMetrics.totalOrders}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg shadow-sm border border-purple-100">
                      <p className="text-purple-600 text-sm font-semibold uppercase">
                        Средняя выручка / SKU
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        ${dashboardMetrics.avgCheck.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-lg shadow-sm border border-orange-100">
                      <p className="text-orange-600 text-sm font-semibold uppercase">
                        Топ Категория
                      </p>
                      <p
                        className="text-xl font-bold text-gray-800 mt-1 truncate"
                        title={dashboardMetrics.topCategory}
                      >
                        {dashboardMetrics.topCategory}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow border">
                      <h4 className="font-bold text-lg mb-4 text-gray-700">
                        Топ-5 Товаров (по выручке)
                      </h4>
                      <ul>
                        {topProducts.map((item, idx) => (
                          <li
                            key={item.product.id}
                            className="flex justify-between items-center py-3 border-b last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs ${
                                  idx < 5
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className="text-sm font-medium">
                                {item.product.name}
                              </span>
                            </div>
                            <span className="font-bold text-gray-700">
                              ${item.totalRevenue.toFixed(0)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Категории */}
                    <div className="bg-white p-6 rounded-lg shadow border flex flex-col items-center">
                      <h4 className="font-bold text-lg mb-4 text-gray-700">
                        Продажи по категориям
                      </h4>
                      <div className="w-full max-w-xs">
                        {categoryChartData && (
                          <Doughnut data={categoryChartData} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- ABC/XYZ MATRIX VIEW --- */}
              {currentView === "Combined" && (
                <div className="overflow-x-auto rounded-lg shadow mb-10">
                  <Table className="min-w-[800px] border">
                    <TableCaption>Матрица ABC/XYZ</TableCaption>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead className="w-[100px] font-bold text-lg text-center border-r border-b">
                          ABC \ XYZ
                        </TableHead>
                        <TableHead className="font-bold text-lg text-center border-r border-b bg-green-200">
                          X (Стабильные)
                        </TableHead>
                        <TableHead className="font-bold text-lg text-center border-r border-b bg-yellow-200">
                          Y (Переменные)
                        </TableHead>
                        <TableHead className="font-bold text-lg text-center border-b bg-red-200">
                          Z (Нестабильные)
                        </TableHead>
                        <TableHead className="w-[120px] font-bold text-lg text-center border-l border-b bg-gray-200">
                          Итого
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {["A", "B", "C"].map((abc) => (
                        <TableRow key={abc} className="border-b">
                          <TableCell className="font-bold text-lg text-center border-r bg-gray-100">
                            {abc} (
                            {abc === "A" ? "80%" : abc === "B" ? "15%" : "5%"})
                          </TableCell>
                          {["X", "Y", "Z"].map((xyz) => (
                            <TableCell
                              key={xyz}
                              className={cn(
                                "p-2 align-top border-r",
                                getMatrixCellColor(abc, xyz)
                              )}
                            >
                              {matrix[abc + xyz].map((name) => (
                                <div
                                  key={name}
                                  className="truncate text-xs py-0.5"
                                  title={name}
                                >
                                  {name}
                                </div>
                              ))}
                            </TableCell>
                          ))}
                          <TableCell className="font-bold text-lg text-center border-l bg-gray-200">
                            {matrixTotals[abc]}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="bg-gray-200">
                      <TableRow>
                        <TableCell className="font-bold text-lg text-center border-r">
                          Итого
                        </TableCell>
                        <TableCell className="font-bold text-lg text-center border-r">
                          {matrixTotals.X}
                        </TableCell>
                        <TableCell className="font-bold text-lg text-center border-r">
                          {matrixTotals.Y}
                        </TableCell>
                        <TableCell className="font-bold text-lg text-center">
                          {matrixTotals.Z}
                        </TableCell>
                        <TableCell className="font-bold text-lg text-center border-l bg-gray-300">
                          {matrixTotals.total}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}

              {/* --- ABC VIEW --- */}
              {currentView === "ABC" && (
                <div className="mb-8 p-6 bg-white rounded-lg shadow max-w-lg mx-auto">
                  <h4 className="font-bold text-xl mb-6 text-center text-gray-700">
                    Распределение ABC
                  </h4>
                  <Doughnut data={abcPieChartData} options={abcPieOptions} />
                </div>
              )}

              {/* --- XYZ VIEW --- */}
              {currentView === "XYZ" && (
                <div className="mb-8 p-6 bg-white rounded-lg shadow max-w-3xl mx-auto">
                  <h4 className="font-bold text-xl mb-6 text-center text-gray-700">
                    Распределение XYZ
                  </h4>
                  <Bar data={xyzBarChartData} options={xyzBarOptions} />
                </div>
              )}

              {/* --- DETAIL TABLE (Always visible except Dashboard) --- */}
              {currentView !== "Dashboard" && (
                <>
                  <div className="flex justify-between items-center mb-4 mt-8">
                    <h3 className="font-bold text-xl text-center text-[#565656]">
                      Детализация
                    </h3>
                    <button
                      onClick={handleExportCSV}
                      className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                    >
                      CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-lg shadow">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead className="min-w-[300px]">Товар</TableHead>
                          <TableHead className="text-right">
                            Выручка ($)
                          </TableHead>
                          <TableHead className="text-right">Доля (%)</TableHead>
                          <TableHead className="text-center">ABC</TableHead>
                          <TableHead className="text-right">CV</TableHead>
                          <TableHead className="text-center">XYZ</TableHead>
                          <TableHead className="text-center font-bold">
                            Итог
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((item) => (
                          <TableRow
                            key={item.product.id}
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    item.product.imageUrl || "/placeholder.png"
                                  }
                                  alt={item.product.name}
                                  className="w-8 h-8 object-contain rounded-sm bg-white border"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/placeholder.png";
                                  }}
                                />
                                <span className="truncate">
                                  {item.product.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              ${Number(item.totalRevenue).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.revenueSharePercentage.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {item.abcClass}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.coefficientOfVariation.toFixed(3)}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {item.xyzClass}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {item.combinedClass}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
