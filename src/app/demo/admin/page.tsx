import { DemoAdminWorkspace } from "@/components/demo-admin-workspace";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function DemoAdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <div className="mb-8">
          <p className="eyebrow">03 · 管理員後台 · 隔离 Demo</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">管理員後台</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8">体验用户与内容管理流程；所有操作只改变当前浏览器的虚构沙盒数据。</p>
        </div>
        <div className="mb-5 border border-dashed border-border bg-card p-3 text-sm">
          无真实管理员权限 · 不连接管理 API · 不读取真实账户或凭据
        </div>
        <DemoAdminWorkspace />
      </main>
      <SiteFooter />
    </>
  );
}
