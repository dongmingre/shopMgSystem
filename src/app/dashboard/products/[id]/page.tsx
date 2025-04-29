"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  AlertTriangle,
  Loader2,
  Tag,
  X
} from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  barcode: string;
  image: string;
  categoryId: number;
  minStock: number;
  status: string;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);

  // 加载商品详情
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("未找到身份验证令牌，请重新登录");
          setLoading(false);
          return;
        }

        // 获取商品详情
        const response = await fetch(`/api/products/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProduct(data.data || data);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "获取商品详情失败");
        }
      } catch (error) {
        console.error("获取商品详情失败:", error);
        setError("获取商品详情失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    // 获取分类列表
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/categories", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error("获取分类失败:", error);
      }
    };
    
    fetchProduct();
    fetchCategories();
  }, [productId]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    try {
      setSaving(true);
      setError("");
      
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        // 更新成功，返回商品列表页
        router.push("/dashboard/products");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "更新商品信息失败");
      }
    } catch (error) {
      console.error("更新商品信息失败:", error);
      setError("更新商品信息失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  // 处理输入变更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!product) return;
    
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]: name === "price" || name === "minStock" ? parseFloat(value) : value
    });
  };

  // 显示加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div className="space-y-4">
        <Link 
          href="/dashboard/products" 
          className="inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          返回商品列表
        </Link>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
          <p className="text-sm mt-2">错误代码: 404 - 商品不存在或已被删除</p>
        </div>
      </div>
    );
  }

  // 商品不存在
  if (!product) {
    return (
      <div className="space-y-4">
        <Link 
          href="/dashboard/products" 
          className="inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          返回商品列表
        </Link>
        
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>未找到商品信息</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/dashboard/products" 
            className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回商品列表
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            编辑商品
          </h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline-none disabled:opacity-70"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              保存修改
            </>
          )}
        </button>
      </div>
      
      {/* 错误信息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* 编辑表单 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                商品名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={product.name || ""}
                onChange={handleChange}
                required
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                商品描述
              </label>
              <textarea
                name="description"
                value={product.description || ""}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  价格 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={product.price || ""}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  条码
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={product.barcode || ""}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                商品图片URL
              </label>
              <input
                type="text"
                name="image"
                value={product.image || ""}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
              />
              {product.image && (
                <div className="mt-2 h-32 w-32 rounded-md border bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img 
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/128x128?text=No+Image";
                    }}
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                商品分类 <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={product.categoryId || ""}
                onChange={handleChange}
                required
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
              >
                <option value="">选择分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                最低库存
              </label>
              <input
                type="number"
                name="minStock"
                value={product.minStock || "0"}
                onChange={handleChange}
                min="0"
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                状态
              </label>
              <select
                name="status"
                value={product.status || "active"}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
              >
                <option value="active">已启用</option>
                <option value="inactive">已停用</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}