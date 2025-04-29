import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { withAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// 获取系统设置
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // 验证用户权限
      if (user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: "无权访问系统设置" },
          { status: 403 }
        );
      }
      
      // 获取系统设置
      const settingsData = await db
        .select()
        .from(settings)
        .limit(1);
      
      if (settingsData.length === 0) {
        // 如果没有设置数据，返回默认设置
        return NextResponse.json({
          success: true,
          data: {
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
          }
        });
      }
      
      // 返回设置数据
      return NextResponse.json({
        success: true,
        data: JSON.parse(settingsData[0].settingsData)
      });
    } catch (error) {
      console.error("获取系统设置失败:", error);
      return NextResponse.json(
        { success: false, message: "获取系统设置失败" },
        { status: 500 }
      );
    }
  });
}

// 更新系统设置
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // 验证用户权限
      if (user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: "无权修改系统设置" },
          { status: 403 }
        );
      }
      
      // 获取请求体
      const { settings: newSettings } = await request.json();
      
      if (!newSettings) {
        return NextResponse.json(
          { success: false, message: "设置数据不能为空" },
          { status: 400 }
        );
      }
      
      // 检查是否已有设置记录
      const existingSettings = await db
        .select({ id: settings.id })
        .from(settings)
        .limit(1);
      
      const settingsData = JSON.stringify(newSettings);
      const now = new Date().getTime();
      
      if (existingSettings.length === 0) {
        // 如果没有设置记录，创建新记录
        await db.insert(settings).values({
          settingsData,
          updatedBy: user.id,
          updatedAt: now
        });
      } else {
        // 如果有设置记录，更新已有记录
        await db
          .update(settings)
          .set({
            settingsData,
            updatedBy: user.id,
            updatedAt: now
          })
          .where(eq(settings.id, existingSettings[0].id));
      }
      
      return NextResponse.json({
        success: true,
        message: "系统设置已更新"
      });
    } catch (error) {
      console.error("更新系统设置失败:", error);
      return NextResponse.json(
        { success: false, message: "更新系统设置失败" },
        { status: 500 }
      );
    }
  });
}