import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

// ============================================================================
// GET /api/finance/summary - Finansal ozet
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "read", "finance");

    const { searchParams } = request.nextUrl;
    const dateFromStr = searchParams.get("dateFrom");
    const dateToStr = searchParams.get("dateTo");

    const where: Prisma.TransactionWhereInput = {
      farmId: session.user.farmId,
      deletedAt: null,
    };

    if (dateFromStr || dateToStr) {
      where.date = {};
      if (dateFromStr) {
        where.date.gte = new Date(dateFromStr);
      }
      if (dateToStr) {
        where.date.lte = new Date(dateToStr);
      }
    }

    // Toplam gelir ve gider
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: "INCOME" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: "EXPENSE" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount ?? 0);
    const totalExpense = Number(expenseAgg._sum.amount ?? 0);
    const profit = totalIncome - totalExpense;

    // Kategori bazinda dagılım
    const categoryBreakdown = await prisma.transaction.groupBy({
      by: ["type", "category"],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: {
        _sum: { amount: "desc" },
      },
    });

    const incomeByCategory = categoryBreakdown
      .filter((item) => item.type === "INCOME")
      .map((item) => ({
        category: item.category,
        total: Number(item._sum.amount ?? 0),
        count: item._count,
      }));

    const expenseByCategory = categoryBreakdown
      .filter((item) => item.type === "EXPENSE")
      .map((item) => ({
        category: item.category,
        total: Number(item._sum.amount ?? 0),
        count: item._count,
      }));

    // Son 6 aylik aylik trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        farmId: session.user.farmId,
        deletedAt: null,
        date: { gte: sixMonthsAgo },
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
    });

    // Aylara gore grupla
    const monthlyTrend: Record<string, { income: number; expense: number }> = {};
    for (const tx of monthlyTransactions) {
      const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyTrend[key]) {
        monthlyTrend[key] = { income: 0, expense: 0 };
      }
      if (tx.type === "INCOME") {
        monthlyTrend[key].income += Number(tx.amount);
      } else {
        monthlyTrend[key].expense += Number(tx.amount);
      }
    }

    const monthlyData = Object.entries(monthlyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense,
      }));

    return apiSuccess({
      totalIncome,
      totalExpense,
      profit,
      incomeCount: incomeAgg._count,
      expenseCount: expenseAgg._count,
      incomeByCategory,
      expenseByCategory,
      monthlyTrend: monthlyData,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Finansal ozet hatasi:", error);
    return apiError("Finansal özet yüklenirken bir hata oluştu", 500);
  }
}
