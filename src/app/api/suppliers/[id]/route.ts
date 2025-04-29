import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers, purchaseOrders } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// 获取单个供应商
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const supplierId = parseInt(params.id);
      
      if (isNaN(supplierId)) {
        return NextResponse.json(
          { success: false, message: "无效的供应商ID" },
          { status: 400 }
        );
      }
      
      const supplierData = await db
        .select({
          id: suppliers.id,
          name: suppliers.name,
          contactPerson: suppliers.contactPerson,
          phone: suppliers.phone,
          email: suppliers.email,
          address: suppliers.address,
          notes: suppliers.notes,
          createdAt: suppliers.createdAt,
          updatedAt: suppliers.updatedAt
        })
        .from(suppliers)
        .where(eq(suppliers.id, supplierId))
        .limit(1);
      
      if (supplierData.length === 0) {
        return NextResponse.json(
          { success: false, message: "供应商不存在" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: supplierData[0]
      });
    } catch (error) {
      console.error("获取供应商详情失败:", error);
      return NextResponse.json(
        { success: false, message: "获取供应商详情失败" },
        { status: 500 }
      );
    }
  });
}

// 更新供应商
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const supplierId = parseInt(params.id);
      
      if (isNaN(supplierId)) {
        return NextResponse.json(
          { success: false, message: "无效的供应商ID" },
          { status: 400 }
        );
      }
      
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
      
      // 检查供应商是否存在
      const existingSupplier = await db
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(eq(suppliers.id, supplierId))
        .limit(1);
      
      if (existingSupplier.length === 0) {
        return NextResponse.json(
          { success: false, message: "供应商不存在" },
          { status: 404 }
        );
      }
      
      // 检查是否有其他供应商使用了相同的名称
      const duplicateSupplier = await db
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(eq(suppliers.name, name))
        .limit(1);
      
      if (duplicateSupplier.length > 0 && duplicateSupplier[0].id !== supplierId) {
        return NextResponse.json(
          { success: false, message: "已存在同名供应商" },
          { status: 400 }
        );
      }
      
      // 更新供应商
      await db.update(suppliers)
        .set({
          name,
          contactPerson,
          phone,
          email: email || null,
          address: address || null,
          notes: notes || null,
          updatedAt: Date.now()
        })
        .where(eq(suppliers.id, supplierId));
      
      return NextResponse.json({
        success: true,
        message: "供应商更新成功"
      });
    } catch (error) {
      console.error("更新供应商失败:", error);
      return NextResponse.json(
        { success: false, message: "更新供应商失败" },
        { status: 500 }
      );
    }
  });
}

// 删除供应商
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const supplierId = parseInt(params.id);
      
      if (isNaN(supplierId)) {
        return NextResponse.json(
          { success: false, message: "无效的供应商ID" },
          { status: 400 }
        );
      }
      
      // 检查供应商是否存在
      const existingSupplier = await db
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(eq(suppliers.id, supplierId))
        .limit(1);
      
      if (existingSupplier.length === 0) {
        return NextResponse.json(
          { success: false, message: "供应商不存在" },
          { status: 404 }
        );
      }
      
      // 检查是否有采购订单关联到该供应商
      const relatedPurchases = await db
        .select({ id: purchaseOrders.id })
        .from(purchaseOrders)
        .where(eq(purchaseOrders.supplierId, supplierId))
        .limit(1);
      
      if (relatedPurchases.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: "该供应商已有相关采购订单，无法删除" 
          },
          { status: 400 }
        );
      }
      
      // 删除供应商
      await db.delete(suppliers).where(eq(suppliers.id, supplierId));
      
      return NextResponse.json({
        success: true,
        message: "供应商删除成功"
      });
    } catch (error) {
      console.error("删除供应商失败:", error);
      return NextResponse.json(
        { success: false, message: "删除供应商失败" },
        { status: 500 }
      );
    }
  });
}