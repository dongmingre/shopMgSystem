"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowUpDown, 
  AlertTriangle, 
  ChevronDown,
  Loader2,
  RefreshCw
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface InventoryItem {
  id: number;
  productId: number;
  name: string;
  barcode: string;
  categoryName: string;
  quantity: number;
  minStock: number;
  purchasePrice: number;
  sellingPrice: number;
  image: string;
  lastRestocked: number;
  updatedAt: number;
}

interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  type: 'purchase' | 'sale' | 'adjustment' | 'return';
  notes: string;
  userName: string;
  timestamp: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockStatus, setStockStatus] = useState("all"); // all, low, outOfStock
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [movementTab, setMovementTab] = useState(false);
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  
  // 加载库存数据
  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      setError("");
      
      try {
        const token = localStorage.getItem("token");
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (categoryFilter) queryParams.set("category", categoryFilter);
        if (stockStatus !== "all") queryParams.set("status", stockStatus);
        
        const response = await fetch(`/api/inventory?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setInventory(data.data);
          } else {
            setError(data.message || "获取库存数据失败");
            setInventory([]);
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || "获取库存数据失败");
        }
      } catch (error) {
        console.error("获取库存数据失败:", error);
        setError("获取库存数据失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventory();
  }, [search, categoryFilter, stockStatus]);
  
  // 获取库存变动记录
  const fetchMovements = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/inventory/movements", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMovements(data.data);
        }
      }
    } catch (error) {
      console.error("获取库存变动记录失败:", error);
    }
  };
  
  // 当切换到变动记录选项卡时加载数据
  useEffect(() => {
    if (movementTab) {
      fetchMovements();
    }
  }, [movementTab]);
  
  // 处理库存调整
  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustmentReason) return;
    
    setAdjustmentLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedItem.productId,
          quantity: adjustQuantity,
          notes: adjustmentReason
        })
      });
      
      if (response.ok) {
        // 更新本地库存数据
        setInventory(prev => 
          prev.map(item => 
            item.productId === selectedItem.productId 
              ? { ...item, quantity: item.quantity + adjustQuantity } 
              : item
          )
        );
        
        // 如果正在显示变动记录，刷新变动数据
        if (movementTab) {
          fetchMovements();
        }
        
        // 重置表单并关闭模态框
        setShowAdjustModal(false);
        setAdjustQuantity(0);
        setAdjustmentReason("");
        setSelectedItem(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "库存调整失败");
      }
    } catch (error) {
      console.error("库存调整失败:", error);
      setError("库存调整失败，请稍后重试");
    } finally {
      setAdjustmentLoading(false);
    }
  };
  
  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 搜索已通过useEffect触发
  };
  
  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            库存管理
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            管理商品库存、查看库存变动记录
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setMovementTab(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              !movementTab 
                ? "bg-blue-600 text-white" 
                : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            库存状态
          </button>
          <button
            onClick={() => setMovementTab(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              movementTab 
                ? "bg-blue-600 text-white" 
                : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            变动记录
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {!movementTab ? (
        <>
          {/* 库存状态视图 */}
          <div className="flex flex-wrap gap-4 items-end">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="搜索商品名称或条码"
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
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                >
                  <option value="">全部分类</option>
                  {/* 分类选项将由API数据填充 */}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  className="pl-3 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                >
                  <option value="all">所有库存</option>
                  <option value="low">库存不足</option>
                  <option value="outOfStock">缺货</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 库存列表 */}
          <div className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">商品名称</th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">分类</th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">
                      <button className="inline-flex items-center gap-1">
                        当前库存
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">最低库存</th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">售价(¥)</th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">最近更新</th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          加载中...
                        </div>
                      </td>
                    </tr>
                  ) : inventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">
                        没有找到库存数据
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                      >
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="h-5 w-5 text-neutral-400">📦</div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                {item.name}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {item.barcode || "无条码"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center">
                            {item.quantity < item.minStock ? (
                              <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                            ) : null}
                            <span 
                              className={
                                item.quantity <= 0 
                                  ? "text-red-600" 
                                  : item.quantity < item.minStock 
                                  ? "text-amber-600" 
                                  : ""
                              }
                            >
                              {item.quantity}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {item.minStock}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          ¥{item.sellingPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowAdjustModal(true);
                            }}
                            className="rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          >
                            调整库存
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 库存变动记录视图 */}
          <div className="flex justify-end">
            <button
              onClick={fetchMovements}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
          </div>
          
          <div className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">操作时间</th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">商品</th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">数量变化</th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">类型</th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">原因/备注</th>
                    <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">操作人</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                        没有库存变动记录
                      </td>
                    </tr>
                  ) : (
                    movements.map((movement) => (
                      <tr
                        key={movement.id}
                        className="border-b last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                      >
                        <td className="px-6 py-3 text-sm">
                          {new Date(movement.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium">
                          {movement.productName}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <span className={movement.quantity > 0 ? "text-green-600" : "text-red-600"}>
                            {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs ${
                            movement.type === 'purchase' 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : movement.type === 'sale'
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : movement.type === 'adjustment'
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          }`}>
                            {movement.type === 'purchase' ? '采购入库' :
                             movement.type === 'sale' ? '销售出库' :
                             movement.type === 'adjustment' ? '手动调整' : '退货'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {movement.notes || "-"}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {movement.userName}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* 库存调整模态框 */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              调整库存 - {selectedItem.name}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                当前库存: <span className="font-semibold">{selectedItem.quantity}</span>
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                调整数量
              </label>
              <input
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                placeholder="输入正数增加库存，负数减少库存"
              />
              <p className="mt-1 text-sm text-neutral-500">
                调整后库存将变为: <span className="font-semibold">{selectedItem.quantity + adjustQuantity}</span>
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                调整原因
              </label>
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                placeholder="请输入库存调整的原因"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedItem(null);
                  setAdjustQuantity(0);
                  setAdjustmentReason("");
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                取消
              </button>
              <button
                onClick={handleAdjustStock}
                disabled={adjustQuantity === 0 || !adjustmentReason || adjustmentLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none disabled:opacity-70"
              >
                {adjustmentLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    处理中...
                  </div>
                ) : (
                  "确认调整"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}