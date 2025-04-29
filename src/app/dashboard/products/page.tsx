"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Tag,
  X,
  Loader2
} from "lucide-react";
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  barcode: string;
  image: string;
  categoryId: number;
  categoryName: string;
  status: string;
  createdAt: number;
  stock: number;
  stockUpdatedAt: number;
  minStock: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // 分页和筛选状态
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // 添加商品表单状态
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    barcode: "",
    image: "",
    categoryId: "",
    status: "active",
    minStock: "10",
    initialStock: "0"
  });
  const [formError, setFormError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);

  // 加载分类列表
  useEffect(() => {
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
    
    fetchCategories();
  }, []);

  // 加载商品列表
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("未找到身份验证令牌，请重新登录");
          setLoading(false);
          return;
        }
        
        // 构建查询参数
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (categoryFilter) queryParams.set("category", categoryFilter);
        if (statusFilter) queryParams.set("status", statusFilter);
        if (sortBy) queryParams.set("sortBy", sortBy);
        if (sortOrder) queryParams.set("sortOrder", sortOrder);
        queryParams.set("page", pagination.page.toString());
        queryParams.set("limit", pagination.limit.toString());
        
        const response = await fetch(`/api/products?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const responseData = await response.json();
          console.log("API返回的完整数据:", responseData);
          
          // 处理API返回的数据，支持多种格式
          if (responseData.data && responseData.data.products && Array.isArray(responseData.data.products)) {
            // 嵌套在data.products中的格式
            setProducts(responseData.data.products);
            
            // 如果API返回了分页信息
            if (responseData.data.pagination) {
              setPagination(responseData.data.pagination);
            }
            
            // 如果API返回了分类列表，也可以更新它
            if (responseData.data.categories && Array.isArray(responseData.data.categories)) {
              setCategories(responseData.data.categories);
            }
          } else if (responseData.data && Array.isArray(responseData.data)) {
            // 直接嵌套在data中的数组格式
            setProducts(responseData.data);
          } else if (Array.isArray(responseData)) {
            // 整个响应就是一个数组
            setProducts(responseData);
          } else {
            console.error("API返回的商品数据格式不支持:", responseData);
            setError("无法解析返回的数据格式");
            setProducts([]);
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || "获取商品列表失败");
        }
      } catch (error) {
        console.error("获取商品列表失败:", error);
        setError("获取商品列表失败，请稍后重试");
        // 确保products始终是数组
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [search, categoryFilter, statusFilter, sortBy, sortOrder, pagination.page, pagination.limit]);

  // 处理搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 })); // 重置到第一页
  };

  // 处理排序变更
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // 如果已经按此字段排序，切换排序方向
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // 否则，按新字段排序，默认升序
      setSortBy(field);
      setSortOrder("asc");
    }
    setPagination(prev => ({ ...prev, page: 1 })); // 重置到第一页
  };

  // 添加新商品
  const handleAddProduct = async () => {
    setFormError("");
    setSaveLoading(true);
    
    try {
      const token = localStorage.getItem("token");

      // 在验证前记录表单状态，便于调试
      console.log("表单提交时的状态:", {
        name: newProduct.name,
        price: newProduct.price,
        categoryId: newProduct.categoryId,
        categories: displayCategories
      });
      
      // 验证必填字段
      if (!newProduct.name || !newProduct.name.trim()) {
        setFormError("商品名称为必填项");
        setSaveLoading(false);
        return;
      }
      
      if (!newProduct.price || newProduct.price.trim() === '') {
        setFormError("价格为必填项");
        setSaveLoading(false);
        return;
      }
      
      if (!newProduct.categoryId) {
        setFormError("请选择商品分类");
        setSaveLoading(false);
        return;
      }
      
      // 验证价格和库存是数字
      if (isNaN(parseFloat(newProduct.price)) || parseFloat(newProduct.price) <= 0) {
        setFormError("价格必须是大于0的数字");
        setSaveLoading(false);
        return;
      }
      
      if (
        isNaN(parseInt(newProduct.minStock)) || 
        isNaN(parseInt(newProduct.initialStock)) ||
        parseInt(newProduct.minStock) < 0 ||
        parseInt(newProduct.initialStock) < 0
      ) {
        setFormError("最低库存和初始库存必须是非负整数");
        setSaveLoading(false);
        return;
      }
      
      // 发送请求
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          barcode: newProduct.barcode,
          image: newProduct.image,
          categoryId: parseInt(newProduct.categoryId),
          status: newProduct.status,
          minStock: parseInt(newProduct.minStock),
          initialStock: parseInt(newProduct.initialStock)
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // 重置表单并关闭模态框
        setNewProduct({
          name: "",
          description: "",
          price: "",
          barcode: "",
          image: "",
          categoryId: "",
          status: "active",
          minStock: "10",
          initialStock: "0"
        });
        setShowAddModal(false);
        
        // 重新加载商品列表
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        setFormError(data.message || "添加商品失败");
      }
    } catch (error) {
      console.error("添加商品失败:", error);
      setFormError("添加商品失败，请稍后重试");
    } finally {
      setSaveLoading(false);
    }
  };

  // 处理删除商品
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // 从列表中移除已删除的商品
        setProducts(products.filter(p => p.id !== selectedProduct.id));
        setShowDeleteModal(false);
        setSelectedProduct(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "删除商品失败");
      }
    } catch (error) {
      console.error("删除商品失败:", error);
      setError("删除商品失败，请稍后重试");
    }
  };

  // 处理页码变更
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page }));
  };

  // 模拟数据（在API完成前使用）
  const mockCategories = [
    { id: 1, name: "饮料" },
    { id: 2, name: "零食" },
    { id: 3, name: "生鲜" },
    { id: 4, name: "日用品" }
  ];

  // 使用实际数据或模拟数据
  const displayCategories = categories.length > 0 ? categories : mockCategories;

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            商品管理
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            查看和管理所有商品信息
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" />
          添加商品
        </button>
      </div>

      {/* 搜索和过滤 */}
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
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="pl-3 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
            >
              <option value="">全部分类</option>
              {displayCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          </div>
          
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="pl-3 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
            >
              <option value="">所有状态</option>
              <option value="active">已启用</option>
              <option value="inactive">已停用</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 商品列表 */}
      <div className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => handleSort("name")}
                    className="inline-flex items-center gap-1"
                  >
                    商品名称
                    {sortBy === "name" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">分类</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => handleSort("price")}
                    className="inline-flex items-center gap-1"
                  >
                    价格(¥)
                    {sortBy === "price" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">库存</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">状态</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="inline-flex items-center gap-1"
                  >
                    创建日期
                    {sortBy === "createdAt" && (
                      <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-neutral-500">
                    没有找到商品数据
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                  >
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <Tag className="h-5 w-5 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {product.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {product.barcode || "无条码"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {product.price !== undefined && product.price !== null
                        ? `¥${parseFloat(product.price).toFixed(2)}`
                        : product.sellingPrice !== undefined && product.sellingPrice !== null
                        ? `¥${parseFloat(product.sellingPrice).toFixed(2)}`
                        : '¥0.00'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center">
                        {product.stock < product.minStock ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                        ) : null}
                        <span className={product.stock < product.minStock ? "text-amber-600" : ""}>
                          {product.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs ${
                          product.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                      >
                        {product.status === "active" ? "已启用" : "已停用"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="rounded-md bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDeleteModal(true);
                          }}
                          className="rounded-md bg-neutral-100 p-2 text-red-600 hover:bg-red-100 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页控件 */}
      {products.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            共 {pagination.total} 件商品，第 {pagination.page} / {pagination.totalPages} 页
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border disabled:opacity-50 dark:border-neutral-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {/* 页码按钮 */}
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

      {/* 添加商品模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                添加新商品
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {formError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  商品名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="输入商品名称"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  商品描述
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="输入商品描述"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    价格 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    条码
                  </label>
                  <input
                    type="text"
                    value={newProduct.barcode}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, barcode: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    placeholder="商品条码"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  商品图片URL
                </label>
                <input
                  type="text"
                  value={newProduct.image}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, image: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="输入图片URL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  商品分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newProduct.categoryId}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, categoryId: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                >
                  <option value="">选择分类</option>
                  {displayCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    最低库存
                  </label>
                  <input
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, minStock: e.target.value })
                    }
                    min="0"
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    placeholder="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    初始库存
                  </label>
                  <input
                    type="number"
                    value={newProduct.initialStock}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, initialStock: e.target.value })
                    }
                    min="0"
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  状态
                </label>
                <select
                  value={newProduct.status}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, status: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                >
                  <option value="active">已启用</option>
                  <option value="inactive">已停用</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                取消
              </button>
              <button
                onClick={handleAddProduct}
                disabled={saveLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none disabled:opacity-70"
              >
                {saveLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    保存中...
                  </div>
                ) : (
                  "保存"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 删除确认模态框 */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                确认删除
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                您确定要删除商品"{selectedProduct.name}"吗？此操作无法撤销。
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                取消
              </button>
              <button
                onClick={handleDeleteProduct}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}