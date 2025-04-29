"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Box,
  ClipboardList,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 检查用户是否已登录
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      // 未登录，重定向到登录页面
      router.push("/auth");
    } else if (userData) {
      // 已登录，获取用户信息
      try {
        const user = JSON.parse(userData);
        setUsername(user.name || user.username);
        setRole(user.role);
      } catch (error) {
        console.error("解析用户数据失败:", error);
      }
    }
  }, [router]);

  const handleLogout = () => {
    // 清除本地存储的令牌和用户信息
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // 重定向到登录页面
    router.push("/auth");
  };

  // 导航项
  const navItems = [
    { href: "/dashboard", label: "仪表盘", icon: <Home size={20} /> },
    { href: "/dashboard/products", label: "商品管理", icon: <Package size={20} /> },
    { href: "/dashboard/inventory", label: "库存管理", icon: <Box size={20} /> },
    { href: "/dashboard/sales", label: "销售管理", icon: <ShoppingCart size={20} /> },
    { href: "/dashboard/purchases", label: "采购管理", icon: <Truck size={20} /> },
    { href: "/dashboard/suppliers", label: "供应商", icon: <Users size={20} /> },
    { href: "/dashboard/reports", label: "报表", icon: <BarChart3 size={20} /> },
    { href: "/dashboard/settings", label: "系统设置", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-neutral-950">
      {/* 侧边栏 - 桌面版 */}
      <div className="hidden md:flex flex-col w-64 bg-white dark:bg-neutral-900 border-r dark:border-neutral-800">
        <div className="flex items-center justify-center h-16 border-b dark:border-neutral-800">
          <span className="text-xl font-bold dark:text-white">超市商品管理</span>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname === item.href
                    ? "bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-white"
                    : "text-gray-600 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t dark:border-neutral-800">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{username}</p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {role === "admin" ? "超级管理员" : role === "manager" ? "管理人员" : "普通员工"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center px-4 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut size={20} />
            <span className="ml-3">退出登录</span>
          </button>
        </div>
      </div>

      {/* 移动版菜单按钮 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-neutral-900 border-b dark:border-neutral-800 p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold dark:text-white">超市商品管理</span>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 dark:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* 移动版侧边栏 */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-neutral-900 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between h-16 border-b dark:border-neutral-800 px-4">
              <span className="text-lg font-bold dark:text-white">超市商品管理</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-600 dark:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="px-2 py-4 space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm rounded-md ${
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-white"
                      : "text-gray-600 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t dark:border-neutral-800">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{username}</p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    {role === "admin" ? "超级管理员" : role === "manager" ? "管理人员" : "普通员工"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center px-4 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut size={20} />
                <span className="ml-3">退出登录</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col md:ml-0 mt-16 md:mt-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-neutral-950">
          {children}
        </main>
      </div>
    </div>
  );
}