"use client";

import { api } from "~/trpc/react";

export default function Page() {
  const { data, isLoading } = api.freee.getDeals.useQuery({
    companyId: 1816694,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  );
}
