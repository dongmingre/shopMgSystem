"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  User, 
  Building, 
  Tag,
  Coins,
  HardDrive,
  Printer,
  Shield,
  Bell,
  Save,
  Loader2
} from "lucide-react";

interface SystemSettings {
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
    logo: string | null;
  };
  pos: {
    enableAutomaticDiscount: boolean;
    defaultTaxRate: number;
    allowNegativeInventory: boolean;
    requireCustomerForSale: boolean;
    receiptFooter: string;
  };
  inventory: {
    lowStockThreshold: number;
    enableStockNotifications: boolean;
    trackProductSerials: boolean;
    defaultSupplier: number | null;
  };
  security: {
    passwordExpiryDays: number;
    sessionTimeoutMinutes: number;
    loginAttempts: number;
    requireStrongPasswords: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    lowStockAlerts: boolean;
    salesReports: boolean;
    reportFrequency: "daily" | "weekly" | "monthly";
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [settings, setSettings] = useState<SystemSettings>({
    company: {
      name: "",
      address: "",
      phone: "",
      email: "",
      taxId: "",
      logo: null
    },
    pos: {
      enableAutomaticDiscount: false,
      defaultTaxRate: 13,
      allowNegativeInventory: false,
      requireCustomerForSale: false,
      receiptFooter: ""
    },
    inventory: {
      lowStockThreshold: 5,
      enableStockNotifications: true,
      trackProductSerials: false,
      defaultSupplier: null
    },
    security: {
      passwordExpiryDays: 90,
      sessionTimeoutMinutes: 30,
      loginAttempts: 5,
      requireStrongPasswords: true
    },
    notifications: {
      emailNotifications: true,
      lowStockAlerts: true,
      salesReports: true,
      reportFrequency: "weekly"
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 加载设置数据
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError("");
      
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("未找到身份验证令牌，请重新登录");
          setLoading(false);
          return;
        }
        
        const response = await fetch("/api/settings", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data) {
            setSettings(data.data);
          } else {
            setError(data.message || "获取系统设置失败");
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || "获取系统设置失败");
        }
      } catch (error) {
        console.error("获取系统设置失败:", error);
        setError("获取系统设置失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // 保存设置
  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("未找到身份验证令牌，请重新登录");
        setSaving(false);
        return;
      }
      
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setSuccess("系统设置已成功保存");
          
          // 清除成功消息
          setTimeout(() => {
            setSuccess("");
          }, 5000);
        } else {
          setError(data.message || "保存系统设置失败");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "保存系统设置失败");
      }
    } catch (error) {
      console.error("保存系统设置失败:", error);
      setError("保存系统设置失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  // 处理输入变更
  const handleChange = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            系统设置
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            配置系统的全局设置参数
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving || loading}
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
              保存设置
            </>
          )}
        </button>
      </div>

      {/* 错误和成功提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* 设置导航和内容 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* 侧边导航 */}
        <div className="lg:col-span-1">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("company")}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeTab === "company"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              <Building className="mr-3 h-5 w-5" />
              <span>公司信息</span>
            </button>
            <button
              onClick={() => setActiveTab("pos")}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeTab === "pos"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              <Tag className="mr-3 h-5 w-5" />
              <span>POS 设置</span>
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeTab === "inventory"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              <HardDrive className="mr-3 h-5 w-5" />
              <span>库存设置</span>
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeTab === "security"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              <Shield className="mr-3 h-5 w-5" />
              <span>安全设置</span>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeTab === "notifications"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              <Bell className="mr-3 h-5 w-5" />
              <span>通知设置</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeTab === "users"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              <User className="mr-3 h-5 w-5" />
              <span>用户管理</span>
            </button>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* 公司信息设置 */}
                {activeTab === "company" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      公司信息
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          公司名称
                        </label>
                        <input
                          type="text"
                          value={settings.company.name}
                          onChange={(e) => handleChange("company", "name", e.target.value)}
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          公司地址
                        </label>
                        <textarea
                          value={settings.company.address}
                          onChange={(e) => handleChange("company", "address", e.target.value)}
                          rows={3}
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            联系电话
                          </label>
                          <input
                            type="tel"
                            value={settings.company.phone}
                            onChange={(e) => handleChange("company", "phone", e.target.value)}
                            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            电子邮箱
                          </label>
                          <input
                            type="email"
                            value={settings.company.email}
                            onChange={(e) => handleChange("company", "email", e.target.value)}
                            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          税号
                        </label>
                        <input
                          type="text"
                          value={settings.company.taxId}
                          onChange={(e) => handleChange("company", "taxId", e.target.value)}
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          公司 Logo
                        </label>
                        <div className="flex items-center gap-3">
                          {settings.company.logo ? (
                            <div className="h-16 w-16 rounded-md border bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700">
                              <img
                                src={settings.company.logo}
                                alt="公司 Logo"
                                className="h-full w-full rounded-md object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:border-neutral-700">
                              <Building className="h-8 w-8" />
                            </div>
                          )}
                          <button
                            type="button"
                            className="rounded-md border px-3 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          >
                            上传 Logo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* POS 设置 */}
                {activeTab === "pos" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      POS 设置
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">启用自动折扣</p>
                          <p className="text-sm text-neutral-500">是否在POS中自动应用商品折扣</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.pos.enableAutomaticDiscount}
                            onChange={(e) => handleChange("pos", "enableAutomaticDiscount", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          默认税率 (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          max="100"
                          value={settings.pos.defaultTaxRate}
                          onChange={(e) => handleChange("pos", "defaultTaxRate", parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">允许库存为负</p>
                          <p className="text-sm text-neutral-500">是否允许库存商品数量为负数</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.pos.allowNegativeInventory}
                            onChange={(e) => handleChange("pos", "allowNegativeInventory", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">销售必须选择客户</p>
                          <p className="text-sm text-neutral-500">是否要求每笔销售指定客户信息</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.pos.requireCustomerForSale}
                            onChange={(e) => handleChange("pos", "requireCustomerForSale", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          收据页脚文本
                        </label>
                        <textarea
                          value={settings.pos.receiptFooter}
                          onChange={(e) => handleChange("pos", "receiptFooter", e.target.value)}
                          rows={3}
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                          placeholder="例如: 感谢您的惠顾，欢迎再次光临！"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 库存设置 */}
                {activeTab === "inventory" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      库存设置
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          低库存阈值
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={settings.inventory.lowStockThreshold}
                          onChange={(e) => handleChange("inventory", "lowStockThreshold", parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        />
                        <p className="text-xs text-neutral-500 mt-1">当商品库存低于此值时，系统将显示库存不足警告</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">启用库存通知</p>
                          <p className="text-sm text-neutral-500">当商品达到低库存阈值时发送通知</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.inventory.enableStockNotifications}
                            onChange={(e) => handleChange("inventory", "enableStockNotifications", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">跟踪产品序列号</p>
                          <p className="text-sm text-neutral-500">为产品记录唯一的序列号或批次号</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.inventory.trackProductSerials}
                            onChange={(e) => handleChange("inventory", "trackProductSerials", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 安全设置 */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      安全设置
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          密码有效期（天）
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={settings.security.passwordExpiryDays}
                          onChange={(e) => handleChange("security", "passwordExpiryDays", parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        />
                        <p className="text-xs text-neutral-500 mt-1">设置为0表示密码永不过期</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          会话超时时间（分钟）
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={settings.security.sessionTimeoutMinutes}
                          onChange={(e) => handleChange("security", "sessionTimeoutMinutes", parseInt(e.target.value) || 30)}
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          最大登录尝试次数
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={settings.security.loginAttempts}
                          onChange={(e) => handleChange("security", "loginAttempts", parseInt(e.target.value) || 5)}
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        />
                        <p className="text-xs text-neutral-500 mt-1">超过此次数账户将被锁定</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">要求使用强密码</p>
                          <p className="text-sm text-neutral-500">包含大小写字母、数字和特殊字符</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.security.requireStrongPasswords}
                            onChange={(e) => handleChange("security", "requireStrongPasswords", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 通知设置 */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      通知设置
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">邮件通知</p>
                          <p className="text-sm text-neutral-500">启用系统邮件通知</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.emailNotifications}
                            onChange={(e) => handleChange("notifications", "emailNotifications", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">低库存提醒</p>
                          <p className="text-sm text-neutral-500">当商品库存低于阈值时接收提醒</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.lowStockAlerts}
                            onChange={(e) => handleChange("notifications", "lowStockAlerts", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">销售报表</p>
                          <p className="text-sm text-neutral-500">定期接收销售报表摘要</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.salesReports}
                            onChange={(e) => handleChange("notifications", "salesReports", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          报表发送频率
                        </label>
                        <select
                          value={settings.notifications.reportFrequency}
                          onChange={(e) => handleChange("notifications", "reportFrequency", e.target.value as "daily" | "weekly" | "monthly")}
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        >
                          <option value="daily">每日</option>
                          <option value="weekly">每周</option>
                          <option value="monthly">每月</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 用户管理 */}
                {activeTab === "users" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      用户管理
                    </h2>
                    <div className="text-center py-6">
                      <User className="h-12 w-12 text-neutral-400 mx-auto" />
                      <p className="mt-3 text-neutral-600 dark:text-neutral-400">用户管理功能需要在单独的页面实现</p>
                      <button
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30"
                      >
                        前往用户管理
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}