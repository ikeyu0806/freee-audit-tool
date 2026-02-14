"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "~/trpc/react";

export default function Page() {
  const { data: session } = useSession();

  const { data, isLoading } = api.freee.getFixedCosts.useQuery();

  if (!session) {
    return (
      <div>
        <button onClick={() => signIn("freee")}>
          Login with freee
        </button>
      </div>
    );
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => signOut()}>Logout</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
