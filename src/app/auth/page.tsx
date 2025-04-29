"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AuthPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 保存令牌和用户信息
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // 重定向到仪表盘
        router.push("/dashboard");
      } else {
        setError(data.message || "登录失败，请检查用户名和密码");
      }
    } catch (err) {
      console.error("登录请求失败:", err);
      setError("登录请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 items-center justify-center flex bg-gradient-to-r from-gray-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="z-10 w-full max-w-md space-y-8 px-8">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-neutral-100 p-2 shadow-sm">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                className="h-full w-full text-neutral-800"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter text-neutral-900 dark:text-neutral-50">
              超市商品进销存管理
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mx-auto max-w-sm">
              高效的超市运营管理系统，数据驱动决策
            </p>
          </div>

          <div className="grid gap-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-700 dark:text-neutral-200" htmlFor="username">
                    用户名
                  </label>
                  <input
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                    id="username"
                    placeholder="管理员账号"
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-700 dark:text-neutral-200" htmlFor="password">
                      密码
                    </label>
                    <Link
                      className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50"
                      href="#"
                    >
                      忘记密码?
                    </Link>
                  </div>
                  <input
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                    id="password"
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-neutral-900 px-8 text-sm font-medium text-neutral-50 shadow transition-colors hover:bg-neutral-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 dark:focus-visible:ring-neutral-300"
                  disabled={loading}
                >
                  {loading ? "登录中..." : "登录"}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-4 text-center text-sm text-neutral-500">
            <p>默认管理员账号: admin / 密码: admin123</p>
          </div>
        </div>
        {/* 背景装饰 */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--background))_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,hsl(var(--background))_0%,transparent_50%)]"></div>
      </div>
    </div>
  );
}