import { DemoPersonaPicker } from "@/components/demo-persona-picker";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function DemoEntryPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <div className="mb-8">
          <p className="eyebrow">完整体验 · 浏览器隔离 Demo</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">选择示例身份</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8">无需密码。选择普通用户或管理员，体验各自完整流程；刷新页面仍保留本次会话状态，关闭浏览器会话后自动清除。</p>
        </div>
        <div className="mb-5 border border-dashed border-border bg-card p-3 text-sm">
          此入口绝不会创建真实账户、取得管理员权限、发送邮件或写入服务器数据库。
        </div>
        <DemoPersonaPicker />
      </main>
      <SiteFooter />
    </>
  );
}
