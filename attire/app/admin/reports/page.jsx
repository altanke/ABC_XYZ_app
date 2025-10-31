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

export default function AdminReportsPage() {
  const { toast } = useToast();
  const { currentUser, loading: userLoading } = useContext(UserContext);

  const [reportData, setReportData] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [errorReports, setErrorReports] = useState(null);

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

  const [currentView, setCurrentView] = useState("Combined");

  const [months, setMonths] = useState(2);
  const [sliderValue, setSliderValue] = useState([2]);

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
              `Не удалось загрузить отчет ABC/XYZ: ${response.status} ${response.statusText} - ${errorText}`
            );
          }
          const data = await response.json();
          setReportData(data);
          processMatrixData(data);
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
    const newTotals = {
      A: 0,
      B: 0,
      C: 0,
      X: 0,
      Y: 0,
      Z: 0,
      total: 0,
    };

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
      labels: ["Категория A", "Категория B", "Категория C"],
      datasets: [
        {
          label: "Кол-во товаров",
          data: [newTotals.A, newTotals.B, newTotals.C],
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(255, 99, 132, 0.6)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(255, 99, 132, 1)",
          ],
          borderWidth: 1,
        },
      ],
    });

    setXyzBarChartData({
      labels: [
        "Категория X (Стабильные)",
        "Категория Y (Переменные)",
        "Категория Z (Нестабильные)",
      ],
      datasets: [
        {
          label: "Кол-во товаров",
          data: [newTotals.X, newTotals.Y, newTotals.Z],
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(255, 99, 132, 0.6)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(255, 99, 132, 1)",
          ],
          borderWidth: 1,
        },
      ],
    });
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast({
        title: "Ошибка",
        description: "Нет данных для экспорта",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "ID Товара",
      "Название Товара",
      "Категория",
      "Выручка ($)",
      "Доля в выручке (%)",
      "Класс ABC",
      "Коэфф. Вариации (CV)",
      "Класс XYZ",
      "Итоговый Класс",
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
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `abc_xyz_report_${months}m_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            Пожалуйста, авторизуйтесь для доступа к отчетам
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
            У вас нет прав доступа к отчетам
          </p>
        </div>
      </>
    );
  }

  const getTabClassName = (viewName) => {
    const baseStyle =
      "py-2 px-4 rounded-lg font-medium transition-colors duration-200";
    if (currentView === viewName) {
      return `${baseStyle} bg-[--button] text-white`;
    }
    return `${baseStyle} bg-gray-100 text-gray-600 hover:bg-gray-200`;
  };

  const getMatrixCellColor = (abcClass, xyzClass) => {
    const combined = abcClass + xyzClass;
    if (["AX", "BX", "AY"].includes(combined)) {
      return "bg-green-50";
    }
    if (["CX", "BY", "AZ"].includes(combined)) {
      return "bg-yellow-50";
    }
    if (["BZ", "CZ", "CY"].includes(combined)) {
      return "bg-red-50";
    }
    return "bg-white";
  };

  const xyzBarOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Количество товаров",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const abcPieOptions = {
    plugins: {
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

  return (
    <>
      <Header />
      <div className="w-full flex justify-center py-4 px-4 sm:px-8">
        <div className="w-full max-w-7xl bg-white shadow rounded-lg flex flex-col p-6">
          <h2 className="text-center py-2 font-bold text-3xl mb-4">
            ABC / XYZ Анализ Ассортимента
          </h2>

          <div className="flex justify-center gap-2 mb-4 border-b pb-4">
            <button
              onClick={() => setCurrentView("Combined")}
              className={getTabClassName("Combined")}
            >
              ABC/XYZ (Матрица)
            </button>
            <button
              onClick={() => setCurrentView("ABC")}
              className={getTabClassName("ABC")}
            >
              Только ABC (Детально)
            </button>
            <button
              onClick={() => setCurrentView("XYZ")}
              className={getTabClassName("XYZ")}
            >
              Только XYZ (Детально)
            </button>
          </div>

          <div className="mb-8 p-4 border rounded-lg">
            <label
              htmlFor="monthsSlider"
              className="block text-center font-medium text-lg mb-2"
            >
              Период анализа: {sliderValue[0]}{" "}
              {sliderValue[0] > 4
                ? "месяцев"
                : sliderValue[0] > 1
                ? "месяца"
                : "месяц"}
            </label>
            <Slider
              id="monthsSlider"
              defaultValue={[2]}
              value={sliderValue}
              min={2}
              max={12}
              step={1}
              onValueChange={(value) => setSliderValue(value)}
              onValueCommit={(value) => setMonths(value[0])}
              className="w-[60%] mx-auto"
            />
          </div>

          {loadingReports && <p className="text-center">Загрузка отчетов...</p>}
          {errorReports && (
            <p className="text-center text-red-600">
              Ошибка загрузки отчетов: {errorReports}
            </p>
          )}

          {!loadingReports && !errorReports && reportData.length === 0 && (
            <p className="text-center text-gray-500">
              Нет данных для анализа. Вероятно, еще не было ни одного заказа за
              выбранный период.
            </p>
          )}

          {!loadingReports && !errorReports && reportData.length > 0 && (
            <>
              {currentView === "Combined" && (
                <div className="overflow-x-auto rounded-lg shadow mb-10">
                  <Table className="min-w-[800px] border">
                    <TableCaption>
                      Матрица ABC/XYZ анализа за {months} мес.
                    </TableCaption>
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
                          Итого (ABC)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-b">
                        <TableCell className="font-bold text-lg text-center border-r bg-gray-100">
                          A (80%)
                        </TableCell>
                        <TableCell
                          className={cn(
                            "p-2 align-top border-r",
                            getMatrixCellColor("A", "X")
                          )}
                        >
                          {matrix.AX.map((name) => (
                            <div key={name}>{name}</div>
                          ))}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "p-2 align-top border-r",
                            getMatrixCellColor("A", "Y")
                          )}
                        >
                          {matrix.AY.map((name) => (
                            <div key={name}>{name}</div>
                          ))}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "p-2 align-top",
                            getMatrixCellColor("A", "Z")
                          )}
                        >
                          {matrix.AZ.map((name) => (
                            <div key={name}>{name}</div>
                          ))}
                        </TableCell>
                        <TableCell className="font-bold text-lg text-center border-l bg-gray-200">
                          {matrixTotals.A}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-b">
                        <TableCell className="font-bold text-lg text-center border-r bg-gray-100">
                          B (15%)
                        </TableCell>
                        <TableCell
                          className={cn(
                            "p-2 align-top border-r",
                            getMatrixCellColor("B", "X")
                          )}
                        >
                          {matrix.BX.map((name) => (
                            <div key={name}>{name}</div>
                          ))}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "p-2 align-top border-r",
                            getMatrixCellColor("B", "Y")
                          )}
                        >
                          {matrix.BY.map((name) => (
                            <div key={name}>{name}</div>
                          ))}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "p-2 align-top",
                            getMatrixCellColor("B", "Z")
                          )}
                        >
                          {matrix.BZ.map((name) => (
                            <div key={name}>{name}</div>
                          ))}
                        </TableCell>
                        <TableCell className="font-bold text-lg text-center border-l bg-gray-200">
                          {matrixTotals.B}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold text-lg text-center border-r bg-gray-100">
                          C (5%)
                        </TableCell>
                        <TableCell
                          className={cn(
                            "p-2 align-top border-r",
                            getMatrixCellColor("C", "X")
                          )}
                        >
                          {matrix.CX.map((name) => (
                            <div key={name}>{name}</div>
                          ))}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "p-2 align-top border-r",
                            getMatrixCellColor("C", "Y")
                          )}
                        >
                          {matrix.CY.map((name) => (
                            <div key={name}>{name}</div>
                          ))}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "p-2 align-top",
                            getMatrixCellColor("C", "Z")
                          )}
                        >
                          {matrix.CZ.map((name) => (
                            <div key={name}>{name}</div>
                          ))}
                        </TableCell>
                        <TableCell className="font-bold text-lg text-center border-l bg-gray-200">
                          {matrixTotals.C}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                    <TableFooter className="bg-gray-200">
                      <TableRow>
                        <TableCell className="font-bold text-lg text-center border-r">
                          Итого (XYZ)
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

              {/* --- ИЗМЕНЕНИЕ: Диаграммы ПЕРЕД таблицей --- */}
              {currentView === "ABC" && (
                <div className="mb-8 p-4 bg-white rounded-lg shadow max-w-lg mx-auto">
                  <h4 className="font-bold text-xl mb-4 text-center">
                    Распределение по ABC (по кол-ву товаров)
                  </h4>
                  <Pie data={abcPieChartData} options={abcPieOptions} />
                </div>
              )}

              {currentView === "XYZ" && (
                <div className="mb-8 p-4 bg-white rounded-lg shadow max-w-2xl mx-auto">
                  <h4 className="font-bold text-xl mb-4 text-center">
                    Распределение по XYZ (по кол-ву товаров)
                  </h4>
                  <Bar data={xyzBarChartData} options={xyzBarOptions} />
                </div>
              )}
              {/* --- КОНЕЦ ИЗМЕНЕНИЯ --- */}

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-center text-[#565656]">
                  Детализация Анализа (
                  {currentView === "Combined" ? "ABC/XYZ" : currentView})
                </h3>
                <button
                  onClick={handleExportCSV}
                  className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                  Выгрузить в CSV
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg shadow">
                <Table>
                  <TableCaption>
                    Детальный отчет по ABC/XYZ анализу за {months} мес.
                  </TableCaption>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="min-w-[300px]">Товар</TableHead>

                      {(currentView === "Combined" ||
                        currentView === "ABC") && (
                        <>
                          <TableHead className="text-right">
                            Выручка ($)
                          </TableHead>
                          <TableHead className="text-right">Доля (%)</TableHead>
                          <TableHead className="text-center">
                            Класс ABC
                          </TableHead>
                        </>
                      )}

                      {(currentView === "Combined" ||
                        currentView === "XYZ") && (
                        <>
                          <TableHead className="text-right">
                            Коэфф. вариации (CV)
                          </TableHead>
                          <TableHead className="text-center">
                            Класс XYZ
                          </TableHead>
                        </>
                      )}

                      {currentView === "Combined" && (
                        <TableHead className="text-center font-bold">
                          Итог
                        </TableHead>
                      )}
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
                              src={item.product.imageUrl || "/placeholder.png"}
                              alt={item.product.name}
                              className="w-10 h-10 object-cover rounded-sm flex-shrink-0"
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

                        {(currentView === "Combined" ||
                          currentView === "ABC") && (
                          <>
                            <TableCell className="text-right">
                              ${Number(item.totalRevenue).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.revenueSharePercentage.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {item.abcClass}
                            </TableCell>
                          </>
                        )}

                        {(currentView === "Combined" ||
                          currentView === "XYZ") && (
                          <>
                            <TableCell className="text-right">
                              {item.coefficientOfVariation.toFixed(3)}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {item.xyzClass}
                            </TableCell>
                          </>
                        )}

                        {currentView === "Combined" && (
                          <TableCell className="text-center font-bold">
                            {item.combinedClass}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
