"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Package,
  TrendingDown,
  AlertTriangle,
  CreditCard,
  CalendarDays,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  monthlySales: number;
  totalSales: number;
  topSellingProducts: Array<{
    productId: number;
    productName: string;
    totalQuantity: number;
    totalSales: number;
  }>;
  lowStockProductsList: Array<{
    id: number;
    name: string;
    quantity: number;
    minStock: number;
  }>;
}

interface RecentSale {
  id: number;
  invoiceNumber: string;
  amount: number;
  discount: number;
  saleDate: number;
  customerName: string;
  cashier: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");

  // 在客户端设置当前日期
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("zh-CN", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  // 获取仪表盘统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          // 没有 token，重定向到登录页面
          router.push("/auth");
          return;
        }

        // 获取统计数据
        const statsResponse = await fetch("/api/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (statsResponse.status === 401) {
          // token 无效或过期，清除本地 token 并重定向到登录页面
          localStorage.removeItem("token");
          router.push("/auth");
          return;
        }

        if (!statsResponse.ok) {
          throw new Error("获取统计数据失败");
        }

        const statsData = await statsResponse.json();
        setStats(statsData.data);

        // 获取最近销售数据
        const salesResponse = await fetch("/api/dashboard/recent-sales?limit=5", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!salesResponse.ok) {
          throw new Error("获取销售数据失败");
        }

        const salesData = await salesResponse.json();
        setRecentSales(salesData.data);

        setLoading(false);
      } catch (err) {
        console.error("仪表盘数据获取失败:", err);
        setError("获取数据失败，请刷新重试");
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  // 格式化金额
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-neutral-300 border-t-neutral-700 mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-300">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">仪表盘</h1>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {currentDate}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* 商品总数 */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">商品总数</p>
              <h3 className="text-2xl font-bold mt-1 text-neutral-900 dark:text-white">{stats?.totalProducts || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/products" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              查看所有商品
            </Link>
          </div>
        </div>

        {/* 低库存商品 */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">低库存商品</p>
              <h3 className="text-2xl font-bold mt-1 text-neutral-900 dark:text-white">{stats?.lowStockProducts || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/inventory" className="text-sm text-amber-600 dark:text-amber-400 hover:underline">
              查看低库存商品
            </Link>
          </div>
        </div>

        {/* 今日销售额 */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">今日销售额</p>
              <h3 className="text-2xl font-bold mt-1 text-neutral-900 dark:text-white">{formatCurrency(stats?.todaySales || 0)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/sales" className="text-sm text-green-600 dark:text-green-400 hover:underline">
              查看今日销售
            </Link>
          </div>
        </div>

        {/* 本月销售额 */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">本月销售额</p>
              <h3 className="text-2xl font-bold mt-1 text-neutral-900 dark:text-white">{formatCurrency(stats?.monthlySales || 0)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/reports" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
              查看报表详情
            </Link>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近销售 */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">最近销售</h3>
              <Link href="/dashboard/sales" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看全部
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    订单号
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    客户
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    日期
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                        {sale.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                        {sale.customerName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                        {formatCurrency(sale.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {formatDate(sale.saleDate)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      暂无销售记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 热销商品 */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">热销商品</h3>
              <Link href="/dashboard/reports" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看详情
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    销量
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    销售额
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {stats?.topSellingProducts && stats.topSellingProducts.length > 0 ? (
                  stats.topSellingProducts.slice(0, 5).map((product) => (
                    <tr key={product.productId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                        {product.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                        {product.totalQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                        {formatCurrency(product.totalSales)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      暂无销售数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 低库存商品警告 */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">低库存商品警告</h3>
              <Link href="/dashboard/inventory" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看所有
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    当前库存
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    最低库存
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {stats?.lowStockProductsList && stats.lowStockProductsList.length > 0 ? (
                  stats.lowStockProductsList.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                        {product.quantity ?? 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-300">
                        {product.minStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          库存不足
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      暂无低库存商品
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}