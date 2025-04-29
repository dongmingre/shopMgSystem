import { Metadata } from "next"

export const metadata: Metadata = {
  title: "API文档 - 超市商品进销存管理系统",
  description: "超市商品进销存管理系统API文档",
}

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">超市商品进销存管理系统 API 文档</h1>
      
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">API 概述</h2>
        <p className="text-neutral-700 dark:text-neutral-300 mb-4">
          本文档提供超市商品进销存管理系统的 API 接口说明，便于前端与后端交互。所有 API 遵循 RESTful 设计原则，返回 JSON 格式数据。
        </p>
        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md mb-4">
          <p className="font-medium">基础 URL</p>
          <p className="font-mono text-sm mt-2 text-neutral-800 dark:text-neutral-300">https://[域名]/api</p>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md">
          <p className="font-medium">响应格式</p>
          <pre className="font-mono text-sm mt-2 overflow-auto p-2 bg-white dark:bg-neutral-900 rounded-md">
{`{
  "success": true|false,
  "data": [...], // 成功时返回的数据
  "error": "错误信息", // 失败时返回的错误信息
  "metadata": { // 分页等元数据信息
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}`}
          </pre>
        </div>
      </div>
      
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">认证</h2>
        <p className="text-neutral-700 dark:text-neutral-300 mb-4">
          所有API需要在请求头中包含授权令牌（token）进行身份验证（登录API除外）。
        </p>
        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md">
          <p className="font-medium">请求头示例</p>
          <pre className="font-mono text-sm mt-2 overflow-auto p-2 bg-white dark:bg-neutral-900 rounded-md">
{`Authorization: Bearer <your_token>`}
          </pre>
        </div>
      </div>
      
      {/* 商品管理API */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">商品管理 API</h2>
        
        <div className="border dark:border-neutral-700 rounded-md mb-8">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-t-md flex items-center justify-between">
            <div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-md mr-2">GET</span>
              <span className="font-mono text-sm">/api/products</span>
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">获取商品列表</span>
          </div>
          <div className="p-4">
            <h4 className="font-medium mb-2">查询参数</h4>
            <table className="w-full mb-6">
              <thead>
                <tr className="border-b dark:border-neutral-700">
                  <th className="text-left py-2 font-medium text-sm">参数名</th>
                  <th className="text-left py-2 font-medium text-sm">类型</th>
                  <th className="text-left py-2 font-medium text-sm">必填</th>
                  <th className="text-left py-2 font-medium text-sm">描述</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b dark:border-neutral-700">
                  <td className="py-2 font-mono text-sm">page</td>
                  <td className="py-2 text-sm">number</td>
                  <td className="py-2 text-sm">否</td>
                  <td className="py-2 text-sm">页码，默认为1</td>
                </tr>
                <tr className="border-b dark:border-neutral-700">
                  <td className="py-2 font-mono text-sm">limit</td>
                  <td className="py-2 text-sm">number</td>
                  <td className="py-2 text-sm">否</td>
                  <td className="py-2 text-sm">每页条数，默认为10</td>
                </tr>
                <tr className="border-b dark:border-neutral-700">
                  <td className="py-2 font-mono text-sm">search</td>
                  <td className="py-2 text-sm">string</td>
                  <td className="py-2 text-sm">否</td>
                  <td className="py-2 text-sm">商品名称搜索关键词</td>
                </tr>
                <tr className="border-b dark:border-neutral-700">
                  <td className="py-2 font-mono text-sm">categoryId</td>
                  <td className="py-2 text-sm">number</td>
                  <td className="py-2 text-sm">否</td>
                  <td className="py-2 text-sm">商品类别ID</td>
                </tr>
              </tbody>
            </table>
            
            <h4 className="font-medium mb-2">响应示例</h4>
            <pre className="font-mono text-sm overflow-auto p-2 bg-neutral-50 dark:bg-neutral-900 rounded-md">
{`{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "矿泉水 550ml",
      "barcode": "6901234567890",
      "description": "纯净水，无污染",
      "purchasePrice": 1.0,
      "sellingPrice": 2.0,
      "unit": "瓶",
      "minStock": 20,
      "image": null,
      "status": "active",
      "category": {
        "id": 1,
        "name": "饮料"
      }
    },
    // ...更多商品
  ],
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}`}
            </pre>
          </div>
        </div>
        
        <div className="border dark:border-neutral-700 rounded-md mb-8">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-t-md flex items-center justify-between">
            <div>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-md mr-2">POST</span>
              <span className="font-mono text-sm">/api/products</span>
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">创建新商品</span>
          </div>
          <div className="p-4">
            <h4 className="font-medium mb-2">请求体</h4>
            <pre className="font-mono text-sm overflow-auto p-2 bg-neutral-50 dark:bg-neutral-900 rounded-md mb-6">
{`{
  "name": "商品名称",
  "barcode": "商品条码",
  "description": "商品描述",
  "categoryId": 1,
  "purchasePrice": 10.0,
  "sellingPrice": 15.0,
  "unit": "个",
  "minStock": 10,
  "image": "图片URL",
  "status": "active"
}`}
            </pre>
            
            <h4 className="font-medium mb-2">响应示例</h4>
            <pre className="font-mono text-sm overflow-auto p-2 bg-neutral-50 dark:bg-neutral-900 rounded-md">
{`{
  "success": true,
  "data": {
    "id": 101,
    "name": "商品名称",
    "barcode": "商品条码",
    "description": "商品描述",
    "categoryId": 1,
    "purchasePrice": 10.0,
    "sellingPrice": 15.0,
    "unit": "个",
    "minStock": 10,
    "image": "图片URL",
    "status": "active",
    "createdAt": "2025-04-28T19:30:00.000Z",
    "updatedAt": "2025-04-28T19:30:00.000Z"
  }
}`}
            </pre>
          </div>
        </div>
      </div>
      
      {/* 库存管理API */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">库存管理 API</h2>
        
        <div className="border dark:border-neutral-700 rounded-md mb-8">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-t-md flex items-center justify-between">
            <div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-md mr-2">GET</span>
              <span className="font-mono text-sm">/api/inventory</span>
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">获取库存列表</span>
          </div>
          <div className="p-4">
            <p className="mb-4 text-neutral-700 dark:text-neutral-300">
              获取所有商品的库存信息，支持分页和筛选。
            </p>
            <h4 className="font-medium mb-2">查询参数</h4>
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b dark:border-neutral-700">
                  <th className="text-left py-2 font-medium text-sm">参数名</th>
                  <th className="text-left py-2 font-medium text-sm">类型</th>
                  <th className="text-left py-2 font-medium text-sm">必填</th>
                  <th className="text-left py-2 font-medium text-sm">描述</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b dark:border-neutral-700">
                  <td className="py-2 font-mono text-sm">page</td>
                  <td className="py-2 text-sm">number</td>
                  <td className="py-2 text-sm">否</td>
                  <td className="py-2 text-sm">页码，默认为1</td>
                </tr>
                <tr className="border-b dark:border-neutral-700">
                  <td className="py-2 font-mono text-sm">limit</td>
                  <td className="py-2 text-sm">number</td>
                  <td className="py-2 text-sm">否</td>
                  <td className="py-2 text-sm">每页条数，默认为10</td>
                </tr>
                <tr className="border-b dark:border-neutral-700">
                  <td className="py-2 font-mono text-sm">lowStock</td>
                  <td className="py-2 text-sm">boolean</td>
                  <td className="py-2 text-sm">否</td>
                  <td className="py-2 text-sm">是否只返回低库存商品</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* 更多API文档... */}
      <div className="text-center text-neutral-500 dark:text-neutral-400 py-6">
        <p>API文档持续更新中...</p>
      </div>
    </div>
  )
}