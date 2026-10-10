import { DemoUserWorkspace } from "@/components/demo-user-workspace";
import { SiteFooter, SiteHeader } from "@/components/site-header";

const views = new Set(["overview", "favorites", "custom", "profile"] as const);
type View = "overview" | "favorites" | "custom" | "profile";

export default async function UserPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requested = typeof params.view === "string" ? params.view : "overview";
  const initialView: View = views.has(requested as View) ? (requested as View) : "overview";

  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <div className="mb-8">
          <p className="eyebrow">02 · 普通用戶後台 · 安全 Demo</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">普通用戶後台</h1>
          <p className="mt-3 max-w-2xl text-lg leading-8">收藏與自訂添加集中在私人空間，和公開工具列表保持分開。</p>
        </div>
        <DemoUserWorkspace initialView={initialView} />
      </main>
      <SiteFooter />
    </>
  );
}
