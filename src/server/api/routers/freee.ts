import { createTRPCRouter, protectedProcedure } from "../trpc";
import { env } from "~/env";

type FixedCostItem = {
  month: string;
  category: string;
  totalAmount: number;
};

export const freeeRouter = createTRPCRouter({
  getFixedCosts: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const account = await ctx.db.account.findFirst({
      where: {
        userId: ctx.session.user.id,
        provider: "freee",
      },
    });

    if (!account?.access_token) {
      throw new Error("No access token found");
    }

    const accessToken = account.access_token;

    // freeeから取引取得
    const res = await fetch(
      `https://api.freee.co.jp/api/1/deals?company_id=${env.FREEE_COMPANY_ID}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      throw new Error("Failed to fetch freee deals");
    }

    const data = await res.json();

    const deals = data.deals ?? [];

    // 🎯 固定費に含めたいキーワード
    const FIXED_COST_KEYWORDS = [
      "地代家賃",
      "家賃",
      "電気",
      "水道",
      "ガス",
      "通信",
      "インターネット",
    ];

    const monthlyMap: Record<string, Record<string, number>> = {};

    for (const deal of deals) {
      if (deal.type !== "expense") continue;

      const month = deal.issue_date.slice(0, 7);

      for (const detail of deal.details ?? []) {
        const description = detail.description ?? "";

        const matchedCategory = FIXED_COST_KEYWORDS.find((keyword) =>
          description.includes(keyword)
        );

        if (!matchedCategory) continue;

        if (!monthlyMap[month]) {
          monthlyMap[month] = {};
        }

        if (!monthlyMap[month][matchedCategory]) {
          monthlyMap[month][matchedCategory] = 0;
        }

        monthlyMap[month][matchedCategory] += detail.amount;
      }
    }

    // 🎯 整形して配列化
    const result: FixedCostItem[] = [];

    for (const [month, categoryMap] of Object.entries(monthlyMap)) {
    for (const [category, totalAmount] of Object.entries(categoryMap)) {
        result.push({
        month,
        category,
        totalAmount,
        });
    }
    }

    return result.sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }),
});
