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

    // 🔹 freeeアカウント取得
    const account = await ctx.db.account.findFirst({
      where: {
        userId: ctx.session.user.id,
        provider: "freee",
      },
    });

    if (!account?.access_token) {
      throw new Error("No access token found");
    }

    let accessToken = account.access_token;
    const now = Math.floor(Date.now() / 1000);

    // 🔥 期限切れならrefresh
    if (account.expires_at && account.expires_at < now) {
      if (!account.refresh_token) {
        throw new Error("No refresh token found");
      }

      const refreshRes = await fetch(
        "https://accounts.secure.freee.co.jp/public_api/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: account.refresh_token,
            client_id: env.FREEE_CLIENT_ID,
            client_secret: env.FREEE_CLIENT_SECRET,
          }),
        }
      );

      const refreshed = await refreshRes.json();

      if (!refreshRes.ok) {
        console.error(refreshed);
        throw new Error("Failed to refresh token");
      }

      accessToken = refreshed.access_token;

      // 🔐 DB更新
      await ctx.db.account.update({
        where: { id: account.id },
        data: {
          access_token: refreshed.access_token,
          expires_at: now + refreshed.expires_in,
          refresh_token:
            refreshed.refresh_token ?? account.refresh_token,
        },
      });
    }

    // 🔹 freeeから取引取得
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

    // 🎯 固定費キーワード
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

      if (!deal.issue_date) continue;

      const month = deal.issue_date.slice(0, 7);

      for (const detail of deal.details ?? []) {
        const description: string = detail.description ?? "";
        const amount: number = detail.amount ?? 0;

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

        monthlyMap[month][matchedCategory] += amount;
      }
    }

    // 🔹 配列に整形
    const result: FixedCostItem[] = [];

    for (const [month, categoryMap] of Object.entries(monthlyMap)) {
      for (const [category, totalAmount] of Object.entries(categoryMap)) {
        result.push({
          month,
          category,
          totalAmount: totalAmount ?? 0,
        });
      }
    }

    return result.sort((a, b) => a.month.localeCompare(b.month));
  }),
});
