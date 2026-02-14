import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";

export const freeeRouter = createTRPCRouter({
  getDeals: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
        console.log("session:", ctx.session);
        console.log("accessToken:", ctx.session?.accessToken);

      const res = await fetch(
        `https://api.freee.co.jp/api/1/deals?company_id=${input.companyId}`,
        {
          headers: {
            Authorization: `Bearer ${ctx.session.accessToken}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch freee deals");
      }

      return res.json();
    }),
});
