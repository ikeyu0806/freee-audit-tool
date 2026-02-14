"use client";

import { signIn } from "next-auth/react";
import { api } from "~/trpc/react";

export default function Page() {
  const { data } = api.freee.getDeals.useQuery(undefined, {
    enabled: false,
  });

  return (
    <div>
      <button onClick={() => signIn("freee")}>
        freeeでログイン
      </button>

      <pre>{data}</pre>
    </div>
  );
}
