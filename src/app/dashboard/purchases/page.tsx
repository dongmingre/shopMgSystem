"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Calendar,
  Loader2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  userId: number;
  userName: string;
  orderDate: number;
  expectedDeliveryDate: number | null;
  status: 'pending' | 'delivered' | 'cancelled';
  totalAmount: number;
  notes: string;
  itemCount: number;
  createdAt: number;
}

interface PurchaseItem {
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

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // 分页状态
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // 加载采购数据
  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const queryParams = new URLSearchParams();

        if (search) queryParams.set("search", search);
        if (dateFilter) queryParams.set("date", dateFilter);
        if (statusFilter) queryParams.set("status", statusFilter);
        queryParams.set("page", pagination.page.toString());
        queryParams.set("limit", pagination.limit.toString());

        const response = await fetch(`/api/purchases?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPurchases(data.data.purchases || []);
            if (data.data.pagination) {
              setPagination(data.data.pagination);
            }
          } else {
            setPurchases([]);
            setError(data.message || "获取采购数据失败");
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || "获取采购数据失败");
        }
      } catch (error) {
        console.error("获取采购数据失败:", error);
        setError("获取采购数据失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [search, dateFilter, statusFilter, pagination.page, pagination.limit]);

  // 获取采购详情
  const fetchPurchaseDetails = async (purchaseId: number) => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/purchases/${purchaseId}/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPurchaseItems(data.data || []);
        } else {
          setPurchaseItems([]);
          setError(data.message || "获取采购详情失败");
        }
      } else {
        setPurchaseItems([]);
        const errorData = await response.json();
        setError(errorData.message || "获取采购详情失败");
      }
    } catch (error) {
      console.error("获取采购详情失败:", error);
      setError("获取采购详情失败，请稍后重试");
      setPurchaseItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // 处理查看采购详情
  const handleViewPurchaseDetail = (purchase: PurchaseOrder) => {
    setSelectedPurchase(purchase);
    setShowDetailModal(true);
    fetchPurchaseDetails(purchase.id);
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

  // 更新订单状态
  const handleUpdateStatus = async (id: number, newStatus: 'pending' | 'delivered' | 'cancelled') => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/purchases/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setPurchases(prev =>
          prev.map(purchase =>
            purchase.id === id ? { ...purchase, status: newStatus } : purchase
          )
        );

        if (selectedPurchase?.id === id) {
          setSelectedPurchase(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "更新状态失败");
      }
    } catch (error) {
      console.error("更新状态失败:", error);
      setError("更新状态失败，请稍后重试");
    }
  };

  // 格式化日期
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "未设置";
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

  // 获取订单状态显示
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center text-amber-600">
            <Clock className="h-4 w-4 mr-1" />
            待处理
          </span>
        );
      case "delivered":
        return (
          <span className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            已完成
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center text-red-600">
            <XCircle className="h-4 w-4 mr-1" />
            已取消
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            采购管理
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            查看和管理采购订单记录
          </p>
        </div>
        <Link
          href="/dashboard/purchases/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" />
          新建采购
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
              placeholder="搜索供应商或订单号"
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="pl-3 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
            >
              <option value="">所有状态</option>
              <option value="pending">待处理</option>
              <option value="delivered">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 采购列表 */}
      <div className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">订单号</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => {/* 添加排序逻辑 */}}
                    className="inline-flex items-center gap-1"
                  >
                    订单日期
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">供应商</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">创建人</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">预计交货</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => {/* 添加排序逻辑 */}}
                    className="inline-flex items-center gap-1"
                  >
                    金额
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">状态</th>
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
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-neutral-500">
                    没有找到采购记录
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-b last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      <span className="flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-1 text-blue-600" />
                        {purchase.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(purchase.orderDate)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {purchase.supplierName}
                    </td>
                    <td className="px-6 py-4 text-sm">{purchase.userName}</td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(purchase.expectedDeliveryDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {formatAmount(purchase.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusDisplay(purchase.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() => handleViewPurchaseDetail(purchase)}
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
      {purchases.length > 0 && (
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

      {/* 采购详情模态框 */}
      {showDetailModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                采购订单详情
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
                  订单号
                </p>
                <p className="font-medium">{selectedPurchase.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  订单日期
                </p>
                <p className="font-medium">
                  {formatDateTime(selectedPurchase.orderDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  供应商
                </p>
                <p className="font-medium">
                  {selectedPurchase.supplierName}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  创建人
                </p>
                <p className="font-medium">{selectedPurchase.userName}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  预计交货日期
                </p>
                <p className="font-medium">
                  {formatDate(selectedPurchase.expectedDeliveryDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  状态
                </p>
                <p className="font-medium">
                  {getStatusDisplay(selectedPurchase.status)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  总金额
                </p>
                <p className="font-medium text-blue-600">
                  {formatAmount(selectedPurchase.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  备注
                </p>
                <p className="font-medium">{selectedPurchase.notes || "-"}</p>
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
                      {purchaseItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-neutral-500">
                            没有商品明细
                          </td>
                        </tr>
                      ) : (
                        purchaseItems.map((item) => (
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
                        <td colSpan={3} className="px-4 py-3 text-sm text-right font-bold">
                          合计:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">
                          {formatAmount(selectedPurchase.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex justify-between mt-6">
              <div className="space-x-2">
                {selectedPurchase.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedPurchase.id, 'delivered')}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
                    >
                      标记为已完成
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedPurchase.id, 'cancelled')}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                    >
                      取消订单
                    </button>
                  </>
                )}
                {selectedPurchase.status === 'cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPurchase.id, 'pending')}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
                  >
                    恢复为待处理
                  </button>
                )}
              </div>
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