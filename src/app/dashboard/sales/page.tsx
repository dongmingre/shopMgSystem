"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Receipt,
  ArrowUpDown,
  Calendar,
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Sale {
  id: number;
  invoiceNumber: string;
  userName: string;
  customerName: string;
  customerPhone: string;
  saleDate: number;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  notes: string;
  itemCount: number;
}

interface SaleItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // 分页状态
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // 加载销售数据
  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const queryParams = new URLSearchParams();

        if (search) queryParams.set("search", search);
        if (dateFilter) queryParams.set("date", dateFilter);
        if (paymentFilter) queryParams.set("payment", paymentFilter);
        queryParams.set("page", pagination.page.toString());
        queryParams.set("limit", pagination.limit.toString());

        const response = await fetch(`/api/sales?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSales(data.data.sales || []);
            if (data.data.pagination) {
              setPagination(data.data.pagination);
            }
          } else {
            setSales([]);
            setError(data.message || "获取销售数据失败");
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || "获取销售数据失败");
        }
      } catch (error) {
        console.error("获取销售数据失败:", error);
        setError("获取销售数据失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [search, dateFilter, paymentFilter, pagination.page, pagination.limit]);

  // 获取销售详情
  const fetchSaleDetails = async (saleId: number) => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/sales/${saleId}/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSaleItems(data.data || []);
        } else {
          setSaleItems([]);
          setError(data.message || "获取销售详情失败");
        }
      } else {
        setSaleItems([]);
        const errorData = await response.json();
        setError(errorData.message || "获取销售详情失败");
      }
    } catch (error) {
      console.error("获取销售详情失败:", error);
      setError("获取销售详情失败，请稍后重试");
      setSaleItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // 处理查看销售详情
  const handleViewSaleDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
    fetchSaleDetails(sale.id);
  };

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 })); // 重置到第一页
  };

  // 处理页码变化
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // 格式化时间
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  // 获取支付方式显示
  const getPaymentMethod = (method: string) => {
    switch (method) {
      case "cash":
        return (
          <span className="flex items-center">
            <Banknote className="h-4 w-4 mr-1" />
            现金
          </span>
        );
      case "card":
        return (
          <span className="flex items-center">
            <CreditCard className="h-4 w-4 mr-1" />
            刷卡
          </span>
        );
      case "mobile":
        return (
          <span className="flex items-center">
            <Smartphone className="h-4 w-4 mr-1" />
            移动支付
          </span>
        );
      default:
        return method;
    }
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            销售管理
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            查看和管理销售记录
          </p>
        </div>
        <Link
          href="/dashboard/sales/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" />
          新建销售
        </Link>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 搜索和过滤 */}
      <div className="flex flex-wrap gap-4 items-end">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="搜索客户名或发票号"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 w-64"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline-none"
          >
            搜索
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="pl-3 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="pl-3 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
            >
              <option value="">所有支付方式</option>
              <option value="cash">现金</option>
              <option value="card">刷卡</option>
              <option value="mobile">移动支付</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 销售列表 */}
      <div className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">发票号</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => {/* 添加排序逻辑 */}}
                    className="inline-flex items-center gap-1"
                  >
                    销售日期
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">客户</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">销售员</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">商品数量</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => {/* 添加排序逻辑 */}}
                    className="inline-flex items-center gap-1"
                  >
                    金额
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">支付方式</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-neutral-500">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      加载中...
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-neutral-500">
                    没有找到销售记录
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      <span className="flex items-center">
                        <Receipt className="h-4 w-4 mr-1 text-blue-600" />
                        {sale.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p>{sale.customerName || "匿名客户"}</p>
                        {sale.customerPhone && (
                          <p className="text-xs text-neutral-500">{sale.customerPhone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{sale.userName}</td>
                    <td className="px-6 py-4 text-sm">{sale.itemCount}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {formatAmount(sale.finalAmount)}
                      {sale.discount > 0 && (
                        <span className="text-xs text-green-600 block">
                          已优惠: {formatAmount(sale.discount)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getPaymentMethod(sale.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() => handleViewSaleDetail(sale)}
                        className="inline-flex items-center rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页控件 */}
      {sales.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border disabled:opacity-50 dark:border-neutral-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              // 显示当前页及其附近的页码
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else {
                const start = Math.max(
                  1,
                  pagination.page - 2 + (pagination.page + 2 > pagination.totalPages ? pagination.totalPages - pagination.page : 0)
                );
                pageNum = start + i;
              }
              
              if (pageNum > pagination.totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    pageNum === pagination.page
                      ? "bg-blue-600 text-white"
                      : "border hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-md border disabled:opacity-50 dark:border-neutral-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 销售详情模态框 */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                销售详情
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  发票号
                </p>
                <p className="font-medium">{selectedSale.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  销售日期
                </p>
                <p className="font-medium">
                  {formatDateTime(selectedSale.saleDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  客户
                </p>
                <p className="font-medium">
                  {selectedSale.customerName || "匿名客户"}
                  {selectedSale.customerPhone && (
                    <span className="block text-sm font-normal">
                      {selectedSale.customerPhone}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  销售员
                </p>
                <p className="font-medium">{selectedSale.userName}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  支付方式
                </p>
                <p className="font-medium">
                  {getPaymentMethod(selectedSale.paymentMethod)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  备注
                </p>
                <p className="font-medium">{selectedSale.notes || "-"}</p>
              </div>
            </div>
            
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mb-4">
              <h4 className="font-medium mb-3">商品明细</h4>
              
              {detailLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  加载中...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                        <th className="px-4 py-2 text-sm font-medium">商品</th>
                        <th className="px-4 py-2 text-sm font-medium text-right">单价</th>
                        <th className="px-4 py-2 text-sm font-medium text-right">数量</th>
                        <th className="px-4 py-2 text-sm font-medium text-right">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-neutral-500">
                            没有商品明细
                          </td>
                        </tr>
                      ) : (
                        saleItems.map((item) => (
                          <tr key={item.id} className="border-b last:border-0 dark:border-neutral-800">
                            <td className="px-4 py-3 text-sm">
                              {item.productName}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatAmount(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {formatAmount(item.totalPrice)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t dark:border-neutral-700">
                        <td colSpan={3} className="px-4 py-3 text-sm text-right font-medium">
                          小计:
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {formatAmount(selectedSale.totalAmount)}
                        </td>
                      </tr>
                      {selectedSale.discount > 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-1 text-sm text-right font-medium text-green-600">
                            优惠:
                          </td>
                          <td className="px-4 py-1 text-sm text-right font-medium text-green-600">
                            -{formatAmount(selectedSale.discount)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm text-right font-bold">
                          合计:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">
                          {formatAmount(selectedSale.finalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}