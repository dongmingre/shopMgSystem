import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { desc, eq, like, or } from "drizzle-orm";

// 获取供应商列表
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const url = new URL(request.url);
      const search = url.searchParams.get("search") || "";
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const offset = (page - 1) * limit;
      
      // 构建查询条件
      let query = db.select({
        id: suppliers.id,
        name: suppliers.name,
        contactPerson: suppliers.contactPerson,
        phone: suppliers.phone,
        email: suppliers.email,
        address: suppliers.address,
        notes: suppliers.notes,
        createdAt: suppliers.createdAt
      }).from(suppliers);
      
      // 添加搜索条件
      if (search) {
        query = query.where(
          or(
            like(suppliers.name, `%${search}%`),
            like(suppliers.contactPerson, `%${search}%`)
          )
        );
      }
      
      // 按创建时间降序排序
      query = query.orderBy(desc(suppliers.createdAt));
      
      // 获取总数
      const countQuery = db
        .select({ count: count() })
        .from(suppliers);
      
      if (search) {
        countQuery.where(
          or(
            like(suppliers.name, `%${search}%`),
            like(suppliers.contactPerson, `%${search}%`)
          )
        );
      }
      
      const [{ count: total }] = await countQuery;
      
      // 查询分页数据
      const supplierData = await query.limit(limit).offset(offset);
      
      const totalPages = Math.ceil(total / limit);
      
      return NextResponse.json({
        success: true,
        data: {
          suppliers: supplierData,
          pagination: {
            total,
            page,
            limit,
            totalPages
          }
        }
      });
    } catch (error) {
      console.error("获取供应商列表失败:", error);
      return NextResponse.json(
        { success: false, message: "获取供应商列表失败" },
        { status: 500 }
      );
    }
  });
}

// 创建供应商
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { name, contactPerson, phone, email, address, notes } = await request.json();
      
      // 验证必填字段
      if (!name || !contactPerson || !phone) {
        return NextResponse.json(
          { 
            success: false, 
            message: "供应商名称、联系人和联系电话为必填项" 
          },
          { status: 400 }
        );
      }
      
      // 检查是否已存在同名供应商
      const existingSupplier = await db
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(eq(suppliers.name, name))
        .limit(1);
      
      if (existingSupplier.length > 0) {
        return NextResponse.json(
          { success: false, message: "已存在同名供应商" },
          { status: 400 }
        );
      }
      
      const timestamp = Date.now();
      
      // 创建供应商
      const result = await db.insert(suppliers).values({
        name,
        contactPerson,
        phone,
        email: email || null,
        address: address || null,
        notes: notes || null,
        createdAt: timestamp,
        updatedAt: timestamp
      }).returning();
      
      return NextResponse.json({
        success: true,
        message: "供应商创建成功",
        data: result[0]
      });
    } catch (error) {
      console.error("创建供应商失败:", error);
      return NextResponse.json(
        { success: false, message: "创建供应商失败" },
        { status: 500 }
      );
    }
  });
}

import { count } from "drizzle-orm";