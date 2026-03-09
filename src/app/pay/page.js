"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function PayRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const vendor = params.get("vendor");
    if (vendor) {
      router.replace(`/pay/${vendor}`);
    } else {
      router.replace("/scan");
    }
  }, [params, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[--color-primary]" />
        </div>
      }
    >
      <PayRedirect />
    </Suspense>
  );
}
