import { SiteFooter, SiteHeader } from "@/components/site-header";
import { UserAccount } from "@/components/user-account";
import { requireUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function UserPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, params] = await Promise.all([requireUser(), searchParams]);
  const initialView = params.view === "profile" ? "profile" : "overview";

  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <div className="mb-8">
          <p className="eyebrow">用戶帳戶</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">我的帳戶</h1>
          <p className="mt-3 max-w-2xl text-lg leading-8">查看帳戶資料並管理登入安全。</p>
        </div>
        <UserAccount
          initialView={initialView}
          user={{
            publicId: session.user.publicId,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image ?? null,
            role: session.user.role,
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
