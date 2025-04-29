"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  LineChart,
  PieChart,
  Download,
  FileText,
  Loader2,
  Calendar,
  Filter,
  ChevronDown,
  ArrowDownToLine,
} from "lucide-react";

interface SalesByDateData {
  date: string;
  salesAmount: number;
  salesCount: number;
}

interface TopProductData {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
}

interface TopCategoryData {
  categoryId: number;
  categoryName: string;
  totalQuantity: number;
  totalAmount: number;
}

interface InventorySummaryData {
  categoryName: string;
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [dateRange, setDateRange] = useState("week");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 销售报表数据
  const [salesByDate, setSalesByDate] = useState<SalesByDateData[]>([]);
  const [totalSales, setTotalSales] = useState({ amount: 0, count: 0 });
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategoryData[]>([]);
  
  // 库存报表数据
  const [inventorySummary, setInventorySummary] = useState<InventorySummaryData[]>([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // 获取日期范围的开始和结束
  const getDateRange = (): { startDate: string; endDate: string } => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (dateRange) {
      case "today":
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date();
        break;
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = new Date();
        break;
      case "month":
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        endDate = new Date();
        break;
      case "year":
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        endDate = new Date();
        break;
      case "custom":
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) endDate = new Date(customEndDate);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  // 加载销售报表数据
  const fetchSalesReportData = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const { startDate, endDate } = getDateRange();

      // 销售趋势数据
      const trendsResponse = await fetch(
        `/api/reports/sales-trends?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!trendsResponse.ok) {
        throw new Error("获取销售趋势数据失败");
      }

      const trendsData = await trendsResponse.json();
      setSalesByDate(trendsData.data.salesByDate || []);
      setTotalSales({
        amount: trendsData.data.totalSalesAmount || 0,
        count: trendsData.data.totalSalesCount || 0,
      });

      // 热销商品数据
      const topProductsResponse = await fetch(
        `/api/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!topProductsResponse.ok) {
        throw new Error("获取热销商品数据失败");
      }

      const topProductsData = await topProductsResponse.json();
      setTopProducts(topProductsData.data || []);

      // 销售分类数据
      const topCategoriesResponse = await fetch(
        `/api/reports/top-categories?startDate=${startDate}&endDate=${endDate}&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!topCategoriesResponse.ok) {
        throw new Error("获取销售分类数据失败");
      }

      const topCategoriesData = await topCategoriesResponse.json();
      setTopCategories(topCategoriesData.data || []);

    } catch (error) {
      console.error("获取销售报表数据失败:", error);
      setError("获取报表数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 加载库存报表数据
  const fetchInventoryReportData = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // 库存摘要数据
      const inventoryResponse = await fetch("/api/reports/inventory-summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!inventoryResponse.ok) {
        throw new Error("获取库存报表数据失败");
      }

      const inventoryData = await inventoryResponse.json();
      setInventorySummary(inventoryData.data.categorySummary || []);
      setInventoryValue(inventoryData.data.totalValue || 0);
      setLowStockCount(inventoryData.data.lowStockCount || 0);

    } catch (error) {
      console.error("获取库存报表数据失败:", error);
      setError("获取报表数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 当标签或日期范围变化时加载数据
  useEffect(() => {
    if (activeTab === "sales") {
      fetchSalesReportData();
    } else if (activeTab === "inventory") {
      fetchInventoryReportData();
    }
  }, [activeTab, dateRange, customStartDate, customEndDate]);

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount);
  };

  // 导出报表数据
  const handleExportReport = (reportType: string) => {
    // 在实际应用中，这里应该调用API导出数据，或者生成CSV文件
    alert(`导出${reportType}报表`);
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          报表中心
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          查看销售统计、库存分析等业务报表
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 报表导航 */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("sales")}
            className={`pb-3 pt-2 font-medium text-sm ${
              activeTab === "sales"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              销售报表
            </div>
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 pt-2 font-medium text-sm ${
              activeTab === "inventory"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              库存报表
            </div>
          </button>
        </div>
      </div>

      {/* 日期范围选择 - 仅销售报表显示 */}
      {activeTab === "sales" && (
        <div className="flex flex-wrap items-center gap-4 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
            <span className="text-sm font-medium mr-2">时间范围:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateRange("today")}
              className={`px-3 py-1 text-sm rounded-md ${
                dateRange === "today"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600"
              }`}
            >
              今天
            </button>
            <button
              onClick={() => setDateRange("week")}
              className={`px-3 py-1 text-sm rounded-md ${
                dateRange === "week"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600"
              }`}
            >
              近7天
            </button>
            <button
              onClick={() => setDateRange("month")}
              className={`px-3 py-1 text-sm rounded-md ${
                dateRange === "month"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600"
              }`}
            >
              近30天
            </button>
            <button
              onClick={() => setDateRange("year")}
              className={`px-3 py-1 text-sm rounded-md ${
                dateRange === "year"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600"
              }`}
            >
              近一年
            </button>
            <button
              onClick={() => setDateRange("custom")}
              className={`px-3 py-1 text-sm rounded-md ${
                dateRange === "custom"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600"
              }`}
            >
              自定义
            </button>
          </div>

          {/* 自定义日期选择 */}
          {dateRange === "custom" && (
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1 text-sm border rounded-md dark:bg-neutral-700 dark:border-neutral-600"
              />
              <span className="text-neutral-500">至</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1 text-sm border rounded-md dark:bg-neutral-700 dark:border-neutral-600"
              />
            </div>
          )}

          <div className="ml-auto">
            <button
              onClick={() => handleExportReport(activeTab === "sales" ? "销售" : "库存")}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500"
            >
              <Download className="h-4 w-4" />
              导出报表
            </button>
          </div>
        </div>
      )}

      {/* 加载指示器 */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
          <span className="text-neutral-600 dark:text-neutral-300">加载报表数据中...</span>
        </div>
      )}

      {/* 销售报表内容 */}
      {!loading && activeTab === "sales" && (
        <div className="space-y-6">
          {/* 销售统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">总销售额</p>
              <h3 className="text-2xl font-bold mt-1 text-neutral-900 dark:text-white">
                {formatAmount(totalSales.amount)}
              </h3>
              <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
                {getDateRange().startDate} ~ {getDateRange().endDate}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">订单总数</p>
              <h3 className="text-2xl font-bold mt-1 text-neutral-900 dark:text-white">
                {totalSales.count} 单
              </h3>
              <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
                平均订单金额: {formatAmount(totalSales.count ? totalSales.amount / totalSales.count : 0)}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">销售走势</p>
              <div className="h-12 mt-2">
                {salesByDate.length > 0 ? (
                  <div className="flex items-end h-full gap-1">
                    {salesByDate.map((day, i) => {
                      const max = Math.max(...salesByDate.map(d => d.salesAmount));
                      const height = max ? (day.salesAmount / max * 100) : 0;
                      return (
                        <div 
                          key={i} 
                          className="bg-blue-500 rounded-sm w-full" 
                          style={{ height: `${height}%` }}
                          title={`${day.date}: ${formatAmount(day.salesAmount)}`}
                        ></div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-500">
                    无数据
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 销售趋势图表 */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">销售趋势</h3>
            </div>
            <div className="h-64">
              {salesByDate.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="flex-grow flex items-end gap-1">
                    {salesByDate.map((day, i) => {
                      const max = Math.max(...salesByDate.map(d => d.salesAmount));
                      const height = max ? (day.salesAmount / max * 100) : 0;
                      return (
                        <div key={i} className="flex flex-col items-center flex-1">
                          <div 
                            className="w-full bg-blue-500 rounded-t-sm" 
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-6 mt-1 flex">
                    {salesByDate.map((day, i) => (
                      <div key={i} className="flex-1 text-center text-xs text-neutral-500">
                        {new Date(day.date).getDate()}日
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-500">
                  没有销售数据可显示
                </div>
              )}
            </div>
          </div>

          {/* 热销商品和分类 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 热销商品 */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white">热销商品</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-neutral-500 dark:border-neutral-800">
                      <th className="pb-2 text-xs font-medium uppercase tracking-wider">商品名称</th>
                      <th className="pb-2 text-xs font-medium uppercase tracking-wider text-right">销售量</th>
                      <th className="pb-2 text-xs font-medium uppercase tracking-wider text-right">销售额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-neutral-500">
                          没有商品销售数据
                        </td>
                      </tr>
                    ) : (
                      topProducts.map((product, i) => (
                        <tr key={i} className="border-b last:border-0 dark:border-neutral-800">
                          <td className="py-2 text-sm">{product.productName}</td>
                          <td className="py-2 text-sm text-right">{product.totalQuantity}</td>
                          <td className="py-2 text-sm text-right font-medium">
                            {formatAmount(product.totalAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 销售分类 */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white">销售分类</h3>
              </div>
              <div className="h-48 flex items-center justify-center">
                {topCategories.length === 0 ? (
                  <div className="text-neutral-500">没有分类销售数据</div>
                ) : (
                  <div className="w-full">
                    {topCategories.map((category, i) => {
                      const totalAmount = topCategories.reduce((sum, cat) => sum + cat.totalAmount, 0);
                      const percentage = totalAmount ? (category.totalAmount / totalAmount * 100).toFixed(1) : 0;
                      return (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{category.categoryName}</span>
                            <span>{formatAmount(category.totalAmount)} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 库存报表内容 */}
      {!loading && activeTab === "inventory" && (
        <div className="space-y-6">
          {/* 库存统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">库存总价值</p>
              <h3 className="text-2xl font-bold mt-1 text-neutral-900 dark:text-white">
                {formatAmount(inventoryValue)}
              </h3>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">低库存商品</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">
                {lowStockCount} 种
              </h3>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">库存分布</p>
              <div className="h-12 mt-2">
                {inventorySummary.length > 0 ? (
                  <div className="flex items-center h-full">
                    {inventorySummary.map((category, i) => {
                      const totalValue = inventorySummary.reduce((sum, cat) => sum + cat.totalValue, 0);
                      const width = totalValue ? (category.totalValue / totalValue * 100) : 0;
                      
                      // 生成一组固定的颜色
                      const colors = [
                        "bg-blue-500",
                        "bg-green-500",
                        "bg-amber-500",
                        "bg-purple-500",
                        "bg-red-500",
                        "bg-indigo-500",
                        "bg-pink-500",
                        "bg-teal-500"
                      ];
                      
                      return (
                        <div
                          key={i}
                          className={`h-full ${colors[i % colors.length]}`}
                          style={{ width: `${width}%` }}
                          title={`${category.categoryName}: ${formatAmount(category.totalValue)}`}
                        ></div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-500">
                    无数据
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 库存分类表格 */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">库存分类明细</h3>
              <button
                onClick={() => handleExportReport("库存")}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
              >
                <FileText className="h-4 w-4" />
                导出明细
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-neutral-500 dark:border-neutral-800">
                    <th className="pb-3 pt-1 px-4 text-sm font-medium whitespace-nowrap">分类名称</th>
                    <th className="pb-3 pt-1 px-4 text-sm font-medium text-right whitespace-nowrap">商品数量</th>
                    <th className="pb-3 pt-1 px-4 text-sm font-medium text-right whitespace-nowrap">低库存数量</th>
                    <th className="pb-3 pt-1 px-4 text-sm font-medium text-right whitespace-nowrap">库存总值</th>
                  </tr>
                </thead>
                <tbody>
                  {inventorySummary.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 px-4 text-center text-neutral-500">
                        没有库存数据可显示
                      </td>
                    </tr>
                  ) : (
                    inventorySummary.map((category, i) => (
                      <tr key={i} className="border-b last:border-0 dark:border-neutral-800">
                        <td className="py-3 px-4 text-sm">{category.categoryName}</td>
                        <td className="py-3 px-4 text-sm text-right">{category.totalProducts} 种</td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className={category.lowStockCount > 0 ? "text-amber-600" : ""}>
                            {category.lowStockCount} 种
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium">
                          {formatAmount(category.totalValue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {inventorySummary.length > 0 && (
                  <tfoot>
                    <tr className="border-t dark:border-neutral-700 font-medium">
                      <td className="pt-3 px-4 text-sm">总计</td>
                      <td className="pt-3 px-4 text-sm text-right">
                        {inventorySummary.reduce((sum, cat) => sum + cat.totalProducts, 0)} 种
                      </td>
                      <td className="pt-3 px-4 text-sm text-right">
                        <span className={lowStockCount > 0 ? "text-amber-600" : ""}>
                          {lowStockCount} 种
                        </span>
                      </td>
                      <td className="pt-3 px-4 text-sm text-right">
                        {formatAmount(inventoryValue)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}