import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth";

// 获取单个商品详情
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;  // 使用await获取params属性
  
  return withAuth(request, async (req, user) => {
    try {
      const productId = parseInt(id);
      
      if (isNaN(productId)) {
        return NextResponse.json(
          { message: "无效的商品ID" },
          { status: 400 }
        );
      }
      
      // 查询数据库获取商品详情
      const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      
      if (!product || product.length === 0) {
        return NextResponse.json(
          { message: "未找到商品" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ data: product[0] });
    } catch (error) {
      console.error("获取商品详情失败:", error);
      return NextResponse.json(
        { message: "获取商品详情时发生服务器错误" },
        { status: 500 }
      );
    }
  });
}

// 更新商品信息
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;  // 使用await获取params属性
  
  return withAuth(request, async (req, user) => {
    try {
      const productId = parseInt(id);
      
      if (isNaN(productId)) {
        return NextResponse.json(
          { message: "无效的商品ID" },
          { status: 400 }
        );
      }
      
      // 解析请求体
      const productData = await request.json();
      
      // 检查商品是否存在
      const existingProduct = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      
      if (!existingProduct || existingProduct.length === 0) {
        return NextResponse.json(
          { message: "未找到商品" },
          { status: 404 }
        );
      }
      
      // 更新商品
      await db.update(products)
        .set({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          barcode: productData.barcode,
          image: productData.image,
          categoryId: productData.categoryId,
          minStock: productData.minStock,
          status: productData.status,
        })
        .where(eq(products.id, productId));
      
      return NextResponse.json({ message: "商品更新成功" });
    } catch (error) {
      console.error("更新商品失败:", error);
      return NextResponse.json(
        { message: "更新商品时发生服务器错误" },
        { status: 500 }
      );
    }
  });
}

// 删除商品
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;  // 使用await获取params属性
  
  return withAuth(request, async (req, user) => {
    try {
      const productId = parseInt(id);
      
      if (isNaN(productId)) {
        return NextResponse.json(
          { message: "无效的商品ID" },
          { status: 400 }
        );
      }
      
      // 检查商品是否存在
      const existingProduct = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      
      if (!existingProduct || existingProduct.length === 0) {
        return NextResponse.json(
          { message: "未找到商品" },
          { status: 404 }
        );
      }
      
      // 删除商品
      await db.delete(products).where(eq(products.id, productId));
      
      return NextResponse.json({ message: "商品删除成功" });
    } catch (error) {
      console.error("删除商品失败:", error);
      return NextResponse.json(
        { message: "删除商品时发生服务器错误" },
        { status: 500 }
      );
    }
  });
}