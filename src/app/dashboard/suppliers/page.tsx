"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash,
  X,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building,
  Phone,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import Link from "next/link";

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });
  
  // 分页状态
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // 加载供应商数据
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const queryParams = new URLSearchParams();

        if (search) queryParams.set("search", search);
        queryParams.set("page", pagination.page.toString());
        queryParams.set("limit", pagination.limit.toString());

        const response = await fetch(`/api/suppliers?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSuppliers(data.data.suppliers || []);
            if (data.data.pagination) {
              setPagination(data.data.pagination);
            }
          } else {
            setSuppliers([]);
            setError(data.message || "获取供应商数据失败");
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || "获取供应商数据失败");
        }
      } catch (error) {
        console.error("获取供应商数据失败:", error);
        setError("获取供应商数据失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [search, pagination.page, pagination.limit]);

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

  // 打开添加供应商模态框
  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      notes: ""
    });
    setShowAddModal(true);
  };

  // 打开编辑供应商模态框
  const handleOpenEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || ""
    });
    setShowEditModal(true);
  };

  // 打开删除供应商确认模态框
  const handleOpenDeleteModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 添加供应商
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contactPerson || !formData.phone) {
      setError("请填写必要的供应商信息");
      return;
    }

    setFormLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowAddModal(false);
          // 重新加载供应商列表
          const queryParams = new URLSearchParams();
          queryParams.set("page", pagination.page.toString());
          queryParams.set("limit", pagination.limit.toString());
          
          const refreshResponse = await fetch(`/api/suppliers?${queryParams.toString()}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              setSuppliers(refreshData.data.suppliers || []);
              if (refreshData.data.pagination) {
                setPagination(refreshData.data.pagination);
              }
            }
          }
        } else {
          setError(data.message || "添加供应商失败");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "添加供应商失败");
      }
    } catch (error) {
      console.error("添加供应商失败:", error);
      setError("添加供应商失败，请稍后重试");
    } finally {
      setFormLoading(false);
    }
  };

  // 更新供应商
  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    
    if (!formData.name || !formData.contactPerson || !formData.phone) {
      setError("请填写必要的供应商信息");
      return;
    }

    setFormLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowEditModal(false);
          // 更新本地数据
          setSuppliers((prev) =>
            prev.map((supplier) =>
              supplier.id === selectedSupplier.id
                ? {
                    ...supplier,
                    name: formData.name,
                    contactPerson: formData.contactPerson,
                    phone: formData.phone,
                    email: formData.email || null,
                    address: formData.address || null,
                    notes: formData.notes || null,
                  }
                : supplier
            )
          );
        } else {
          setError(data.message || "更新供应商失败");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "更新供应商失败");
      }
    } catch (error) {
      console.error("更新供应商失败:", error);
      setError("更新供应商失败，请稍后重试");
    } finally {
      setFormLoading(false);
    }
  };

  // 删除供应商
  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    setFormLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowDeleteModal(false);
          // 从本地列表中移除
          setSuppliers((prev) =>
            prev.filter((supplier) => supplier.id !== selectedSupplier.id)
          );
          // 更新分页信息
          if (pagination.total > 0) {
            setPagination((prev) => ({
              ...prev,
              total: prev.total - 1,
              totalPages: Math.ceil((prev.total - 1) / prev.limit),
            }));
          }
        } else {
          setError(data.message || "删除供应商失败");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "删除供应商失败");
      }
    } catch (error) {
      console.error("删除供应商失败:", error);
      setError("删除供应商失败，请稍后重试");
    } finally {
      setFormLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            供应商管理
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            查看和管理供应商信息
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" />
          添加供应商
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 搜索 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="搜索供应商名称或联系人"
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

      {/* 供应商列表 */}
      <div className="rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">供应商名称</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">联系人</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">联系电话</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">电子邮箱</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap">地址</th>
                <th className="px-6 py-3 text-sm font-medium whitespace-nowrap text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      加载中...
                    </div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                    没有找到供应商记录
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-neutral-400" />
                        {supplier.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-neutral-400" />
                        {supplier.contactPerson}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-neutral-400" />
                        {supplier.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {supplier.email ? (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-neutral-400" />
                          {supplier.email}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {supplier.address ? (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-neutral-400" />
                          <span className="truncate max-w-xs">{supplier.address}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(supplier)}
                          className="inline-flex items-center rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(supplier)}
                          className="inline-flex items-center rounded-md bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <Trash className="h-4 w-4" />
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
      {suppliers.length > 0 && (
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

      {/* 添加供应商模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                添加供应商
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSupplier}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  供应商名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="供应商名称"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  联系人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="联系人姓名"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="联系电话"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  电子邮箱
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="电子邮箱"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  地址
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="地址"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  备注
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="备注信息"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none disabled:opacity-70"
                >
                  {formLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      处理中...
                    </div>
                  ) : (
                    "添加"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑供应商模态框 */}
      {showEditModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                编辑供应商
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSupplier}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  供应商名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="供应商名称"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  联系人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="联系人姓名"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="联系电话"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  电子邮箱
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="电子邮箱"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  地址
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="地址"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  备注
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                  placeholder="备注信息"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none disabled:opacity-70"
                >
                  {formLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      处理中...
                    </div>
                  ) : (
                    "保存"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除供应商确认模态框 */}
      {showDeleteModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                确认删除
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="mb-6">
              确定要删除供应商 "{selectedSupplier.name}" 吗？此操作无法撤销，可能会影响相关联的采购订单。
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                取消
              </button>
              <button
                onClick={handleDeleteSupplier}
                disabled={formLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none disabled:opacity-70"
              >
                {formLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    处理中...
                  </div>
                ) : (
                  "删除"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}