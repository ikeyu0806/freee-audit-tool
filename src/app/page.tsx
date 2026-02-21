"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "~/trpc/react";

type FixedCostItem = {
  month: string;
  category: string;
  totalAmount: number;
};

export default function Page() {
  const { data: session } = useSession();
  const { data, isLoading } = api.freee.getFixedCosts.useQuery();

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <button
          onClick={() => signIn("freee")}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-white shadow hover:bg-emerald-700 transition"
        >
          freeeでログイン
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const grouped =
    data?.reduce<Record<string, FixedCostItem[]>>((acc, item) => {
      (acc[item.month] ??= []).push(item);
      return acc;
    }, {}) ?? {};


  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          固定費一覧
        </h1>
        <button
          onClick={() => signOut()}
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 transition"
        >
          Logout
        </button>
      </div>

      {/* Month groups */}
      <div className="space-y-10">
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <h2 className="mb-4 text-2xl font-semibold text-gray-700">
              {month}
            </h2>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.category}
                  className="
                    border border-gray-200
                    bg-white
                    rounded-lg
                    p-6
                    shadow-md
                    hover:shadow-lg
                    transition
                    ease-in-out
                  "
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-gray-800">
                      {item.category}
                    </p>
                  </div>

                  <p className="mt-4 text-3xl font-bold text-indigo-600">
                    ¥{item.totalAmount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
