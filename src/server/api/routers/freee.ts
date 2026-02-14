import { createTRPCRouter, protectedProcedure } from "../trpc";
import { env } from "~/env";

export const freeeRouter = createTRPCRouter({
  getDeals: protectedProcedure.query(async ({ ctx }) => {
    // ① セッション確認
    if (!ctx.session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // ② DBからfreeeのアクセストークン取得
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

    // ③ freee API 呼び出し
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

    return res.json();
  }),
});
