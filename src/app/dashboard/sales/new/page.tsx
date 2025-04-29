"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Save,
  Search,
  User,
  Phone,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  name: string;
  sellingPrice?: number;
  purchasePrice?: number;
  price?: number;
  stock?: number;
  quantity?: number;
}

interface SaleItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function NewSalePage() {
  const router = useRouter();
  
  // 商品数据
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 表单数据
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [nextItemId, setNextItemId] = useState(1);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  
  // 状态
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  
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
          
          // 确保设置的是数组
          if (data.success) {
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
    
    // 检查库存是否足够
    const stockAmount = product.stock ?? product.quantity ?? 0;
    if (stockAmount <= 0) {
      setError(`商品 "${product.name}" 库存不足`);
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    // 检查是否已存在
    const existingItem = items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // 如果已存在，检查库存是否足够增加
      if (existingItem.quantity >= stockAmount) {
        setError(`商品 "${product.name}" 库存不足`);
        setTimeout(() => setError(""), 3000);
        return;
      }
      
      // 更新现有商品的数量
      setItems(items.map(item => {
        if (item.productId === product.id) {
          const newQuantity = item.quantity + 1;
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: parseFloat((item.unitPrice * newQuantity).toFixed(2))
          };
        }
        return item;
      }));
    } else {
      // 确定商品价格 - 优先使用sellingPrice，其次是price
      const unitPrice = product.sellingPrice ?? product.price ?? 0;
      
      const newItem: SaleItem = {
        id: nextItemId,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice * 1
      };
      
      setItems([...items, newItem]);
      setNextItemId(nextItemId + 1);
    }
    
    setSearchTerm("");
  };
  
  // 更新商品数量
  const updateItemQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) return;
    
    setItems(items.map(item => {
      if (item.id === itemId) {
        // 查找对应产品，检查库存
        const product = products.find(p => p.id === item.productId);
        const stockAmount = product?.stock ?? product?.quantity ?? 0;
        
        if (quantity > stockAmount) {
          setError(`商品 "${item.productName}" 库存不足，最大可售 ${stockAmount} 个`);
          setTimeout(() => setError(""), 3000);
          return item;
        }
        
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
  
  // 计算商品总金额
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };
  
  // 计算最终金额（减去折扣）
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - (discount || 0)).toFixed(2);
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
    if (items.length === 0) {
      setError("销售单至少需要一件商品");
      return false;
    }
    
    // 检查折扣金额是否合理
    const subtotal = calculateSubtotal();
    if (discount && discount > subtotal) {
      setError("折扣金额不能大于商品总金额");
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
      const saleData = {
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        items: items.map(({ productId, quantity, unitPrice }) => ({
          productId,
          quantity,
          unitPrice
        })),
        discount,
        paymentMethod,
        notes
      };
      
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(saleData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          router.push("/dashboard/sales");
        } else {
          setError(data.message || "创建销售单失败");
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
            href="/dashboard/sales"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">新建销售单</h1>
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
          {/* 客户信息 */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
              <h3 className="text-lg font-medium mb-4">客户信息</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="customerName">
                    客户姓名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      id="customerName"
                      type="text"
                      className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                      placeholder="输入客户姓名（可选）"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="customerPhone">
                    联系电话
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      id="customerPhone"
                      type="text"
                      className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                      placeholder="输入联系电话（可选）"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="paymentMethod">
                    支付方式
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <select
                      id="paymentMethod"
                      className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={saving}
                    >
                      <option value="cash">现金</option>
                      <option value="wechat">微信</option>
                      <option value="alipay">支付宝</option>
                      <option value="card">银行卡</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="notes">
                    备注
                  </label>
                  <textarea
                    id="notes"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    placeholder="添加备注信息（可选）"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
              <h3 className="text-lg font-medium mb-4">销售结算</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between font-medium">
                  <span>商品数量:</span>
                  <span>{items.length} 项</span>
                </div>
                
                <div className="flex justify-between font-medium">
                  <span>商品总额:</span>
                  <span>¥{calculateSubtotal().toFixed(2)}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="discount">
                    折扣金额
                  </label>
                  <input
                    id="discount"
                    type="number"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    disabled={saving}
                  />
                </div>
                
                <div className="flex justify-between text-lg font-bold">
                  <span>应收金额:</span>
                  <span className="text-blue-600">¥{calculateTotal()}</span>
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
                      完成销售
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
              <p className="text-sm text-neutral-500 mb-4">搜索并添加商品到销售单</p>
              
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
                      {filteredProducts.map((product) => {
                        const stock = product.stock ?? product.quantity ?? 0;
                        return (
                          <li 
                            key={product.id}
                            className={`p-3 flex items-center justify-between ${
                              stock > 0 
                                ? "hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer" 
                                : "opacity-50 cursor-not-allowed"
                            }`}
                            onClick={() => stock > 0 && addItem(product)}
                          >
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-neutral-500">
                                售价: ¥{(product.sellingPrice || product.price || 0).toFixed(2)} | 
                                库存: {stock} {stock === 0 ? "(无库存)" : ""}
                              </p>
                            </div>
                            {stock > 0 && (
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
                            )}
                          </li>
                        );
                      })}
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
              <h3 className="text-lg font-medium mb-4">销售明细</h3>
              
              {items.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  <p className="mb-2">暂无销售商品</p>
                  <p className="text-sm">在上方搜索并添加商品到销售单</p>
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
                          小计
                        </td>
                        <td className="pt-4 text-right font-bold">
                          ¥{calculateSubtotal().toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="font-medium">
                        <td className="pt-2" colSpan={3}>
                          折扣
                        </td>
                        <td className="pt-2 text-right font-bold text-red-500">
                          -¥{discount.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="font-medium">
                        <td className="pt-2" colSpan={3}>
                          应收金额
                        </td>
                        <td className="pt-2 text-right text-blue-600 font-bold">
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