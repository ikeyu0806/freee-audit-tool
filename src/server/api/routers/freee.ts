import { createTRPCRouter, protectedProcedure } from "../trpc";
import { env } from "~/env";

export const freeeRouter = createTRPCRouter({
  getDeals: protectedProcedure.query(async ({ ctx }) => {
    // 🔐 セッション確認（protectedProcedureなので基本不要だが安全のため）
    if (!ctx.session?.accessToken) {
      throw new Error("No access token found in session");
    }

    const companyId = env.FREEE_COMPANY_ID;

    console.log("session:", ctx.session);
    console.log("accessToken:", ctx.session.accessToken);
    console.log("companyId:", companyId);

    const res = await fetch(
      `https://api.freee.co.jp/api/1/deals?company_id=${companyId}`,
      {
        headers: {
          Authorization: `Bearer ${ctx.session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("freee API error:", errorText);
      throw new Error("Failed to fetch freee deals");
    }

    return res.json();
  }),
});
