"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Save,
  Calendar,
  Search
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  purchasePrice?: number;
  sellingPrice?: number;
  price?: number;
  stock?: number;
  quantity?: number;
}

interface PurchaseItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  
  // 供应商数据
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  
  // 商品数据 - 确保总是初始化为空数组
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 表单数据
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [nextItemId, setNextItemId] = useState(1);
  
  // 状态
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  
  // 获取供应商列表
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const token = localStorage.getItem("token");
        const response = await fetch("/api/suppliers", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.suppliers) {
            setSuppliers(data.data.suppliers || []);
          } else {
            console.error("获取供应商失败:", data.message);
            setSuppliers([]);
          }
        } else {
          console.error("获取供应商请求失败");
          setSuppliers([]);
        }
      } catch (error) {
        console.error("获取供应商出错:", error);
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    
    fetchSuppliers();
  }, []);
  
  // 获取商品列表
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const token = localStorage.getItem("token");
        const response = await fetch("/api/products?includeStock=true", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("API返回的商品数据:", data); // 调试日志
          
          // 确保设置的是数组
          if (data.success) {
            // 处理不同的数据结构可能性
            if (data.data && Array.isArray(data.data)) {
              setProducts(data.data);
            } else if (data.data && data.data.products && Array.isArray(data.data.products)) {
              setProducts(data.data.products);
            } else {
              console.error("API返回的商品数据结构不符合预期");
              setProducts([]);
            }
          } else {
            console.error("获取商品失败:", data.message);
            setProducts([]);
          }
        } else {
          console.error("获取商品请求失败");
          setProducts([]);
        }
      } catch (error) {
        console.error("获取商品出错:", error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // 添加商品到列表
  const addItem = (product: Product) => {
    // 安全性检查
    if (!product || typeof product !== 'object') {
      setError("无效的商品数据");
      return;
    }
    
    // 检查是否已存在
    const existingItem = items.find(item => item.productId === product.id);
    
    if (existingItem) {
      setError("该商品已在采购清单中");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    // 确定商品价格 - 优先使用purchasePrice，其次是price，再次是sellingPrice
    const unitPrice = product.purchasePrice ?? product.price ?? product.sellingPrice ?? 0;
    
    const newItem: PurchaseItem = {
      id: nextItemId,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice,
      totalPrice: unitPrice * 1
    };
    
    setItems([...items, newItem]);
    setNextItemId(nextItemId + 1);
    setSearchTerm("");
  };
  
  // 更新商品数量
  const updateItemQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) return;
    
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          totalPrice: parseFloat((item.unitPrice * quantity).toFixed(2))
        };
      }
      return item;
    }));
  };
  
  // 更新商品单价
  const updateItemPrice = (itemId: number, unitPrice: number) => {
    if (unitPrice < 0) return;
    
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          unitPrice,
          totalPrice: parseFloat((unitPrice * item.quantity).toFixed(2))
        };
      }
      return item;
    }));
  };
  
  // 移除商品
  const removeItem = (itemId: number) => {
    setItems(items.filter(item => item.id !== itemId));
  };
  
  // 计算总金额
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2);
  };
  
  // 过滤商品 - 安全地处理products
  const getFilteredProducts = () => {
    // 确保products是数组并且searchTerm有值
    if (!Array.isArray(products) || !searchTerm) {
      return [];
    }
    
    try {
      // 安全地尝试过滤
      return products.filter(product => 
        product && 
        product.name && 
        typeof product.name === 'string' && 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error("过滤商品时出错:", error);
      return [];
    }
  };
  
  // 安全地获取过滤后的商品
  const filteredProducts = getFilteredProducts();
  
  // 表单验证
  const validateForm = () => {
    if (!supplierId) {
      setError("请选择供应商");
      return false;
    }
    
    if (items.length === 0) {
      setError("采购单至少需要一件商品");
      return false;
    }
    
    return true;
  };
  
  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      
      // 准备提交数据
      const purchaseData = {
        supplierId,
        expectedDeliveryDate: expectedDeliveryDate 
          ? new Date(expectedDeliveryDate).getTime() 
          : null,
        notes,
        items: items.map(({ productId, quantity, unitPrice }) => ({
          productId,
          quantity,
          unitPrice
        }))
      };
      
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(purchaseData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          router.push("/dashboard/purchases");
        } else {
          setError(data.message || "创建采购单失败");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "请求失败");
      }
    } catch (error) {
      console.error("提交表单失败:", error);
      setError("提交表单时出错，请重试");
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/purchases"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">新建采购单</h1>
        </div>
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* 采购信息 */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
              <h3 className="text-lg font-medium mb-4">采购信息</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="supplierId">
                    供应商 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="supplierId"
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    value={supplierId || ""}
                    onChange={(e) => setSupplierId(e.target.value ? parseInt(e.target.value) : null)}
                    disabled={loadingSuppliers || saving}
                  >
                    <option value="">选择供应商</option>
                    {Array.isArray(suppliers) && suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="expectedDeliveryDate">
                    预计交货日期
                  </label>
                  <div className="relative">
                    <input
                      id="expectedDeliveryDate"
                      type="date"
                      className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      disabled={saving}
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="notes">
                    备注
                  </label>
                  <textarea
                    id="notes"
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
              <h3 className="text-lg font-medium mb-4">采购总结</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between font-medium">
                  <span>商品数量:</span>
                  <span>{items.length} 项</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>总金额:</span>
                  <span>¥{calculateTotal()}</span>
                </div>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存采购单
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* 商品列表和搜索 */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
              <h3 className="text-lg font-medium">添加商品</h3>
              <p className="text-sm text-neutral-500 mb-4">搜索并添加商品到采购单</p>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="搜索商品名称..."
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loadingProducts || saving}
                />
              </div>
              
              {searchTerm && (
                <div className="mt-2 rounded-md border max-h-60 overflow-y-auto bg-white dark:bg-neutral-900 dark:border-neutral-800">
                  {loadingProducts ? (
                    <div className="p-3 text-center text-neutral-500">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      <p className="mt-1 text-sm">加载商品...</p>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <ul className="divide-y dark:divide-neutral-800">
                      {filteredProducts.map((product) => (
                        <li 
                          key={product.id}
                          className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between"
                          onClick={() => addItem(product)}
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-neutral-500">
                              单价: ¥{(product.purchasePrice || product.price || product.sellingPrice || 0).toFixed(2)} | 
                              库存: {product.stock || product.quantity || 0}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="p-1 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              addItem(product);
                            }}
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-3 text-center text-neutral-500">
                      没有找到匹配的商品
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
              <h3 className="text-lg font-medium mb-4">采购明细</h3>
              
              {items.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  <p className="mb-2">暂无采购商品</p>
                  <p className="text-sm">在上方搜索并添加商品到采购单</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-neutral-500 dark:border-neutral-800">
                        <th className="pb-3 text-sm font-medium">商品名称</th>
                        <th className="pb-3 text-sm font-medium text-right">单价 (¥)</th>
                        <th className="pb-3 text-sm font-medium text-right">数量</th>
                        <th className="pb-3 text-sm font-medium text-right">小计 (¥)</th>
                        <th className="pb-3 text-sm font-medium text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-neutral-800">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 text-sm">{item.productName}</td>
                          <td className="py-3 text-right">
                            <input
                              type="number"
                              className="w-20 text-right border rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                              value={item.unitPrice}
                              onChange={(e) => 
                                updateItemPrice(item.id, parseFloat(e.target.value) || 0)
                              }
                              min="0"
                              step="0.01"
                              disabled={saving}
                            />
                          </td>
                          <td className="py-3 text-right">
                            <input
                              type="number"
                              className="w-16 text-right border rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                              value={item.quantity}
                              onChange={(e) => 
                                updateItemQuantity(item.id, parseInt(e.target.value) || 1)
                              }
                              min="1"
                              disabled={saving}
                            />
                          </td>
                          <td className="py-3 text-sm font-medium text-right">
                            {item.totalPrice.toFixed(2)}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              disabled={saving}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-full dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-medium">
                        <td className="pt-4" colSpan={3}>
                          总计
                        </td>
                        <td className="pt-4 text-right text-blue-600 font-bold">
                          ¥{calculateTotal()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}