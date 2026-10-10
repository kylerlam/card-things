"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheckIcon, UserRoundIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { resetDemoAdmin, signInDemoAdmin } from "@/lib/demo-admin-store";
import { resetDemoUser, signInDemoUser } from "@/lib/demo-user-store";
import { cn } from "@/lib/utils";

export function DemoPersonaPicker() {
  const router = useRouter();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="wire-panel flex flex-col p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
          <UserRoundIcon className="size-6" />
        </span>
        <p className="eyebrow mt-6">示例身份 01</p>
        <h2 className="mt-2 text-2xl font-bold">普通用戶 Demo</h2>
        <dl className="mt-5 grid gap-2 text-sm">
          <div><dt className="text-muted-foreground">用戶名</dt><dd className="font-semibold">示例用戶</dd></div>
          <div><dt className="text-muted-foreground">電子郵件</dt><dd className="font-semibold">demo.user@example.test</dd></div>
        </dl>
        <p className="mt-5 flex-1 leading-7 text-muted-foreground">体验收藏、自订工具、资料编辑、空状态、退出与返回流程。</p>
        <Button
          type="button"
          className="mt-6 w-full"
          onClick={() => {
            signInDemoUser({
              id: "CT-DEMO-0001",
              name: "示例用戶",
              email: "demo.user@example.test",
              entry: "demo",
            });
            router.push("/user");
          }}
        >
          以普通用戶 Demo 進入
        </Button>
      </section>

      <section className="wire-panel flex flex-col p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
          <ShieldCheckIcon className="size-6" />
        </span>
        <p className="eyebrow mt-6">示例身份 02</p>
        <h2 className="mt-2 text-2xl font-bold">管理員 Demo</h2>
        <dl className="mt-5 grid gap-2 text-sm">
          <div><dt className="text-muted-foreground">用戶名</dt><dd className="font-semibold">示例管理員</dd></div>
          <div><dt className="text-muted-foreground">電子郵件</dt><dd className="font-semibold">demo.admin@example.test</dd></div>
        </dl>
        <p className="mt-5 flex-1 leading-7 text-muted-foreground">体验用户查找、工具/分类/Tag CRUD、草稿发布状态、个人资料与沙盒重置。</p>
        <Button
          type="button"
          className="mt-6 w-full"
          onClick={() => {
            signInDemoAdmin();
            router.push("/demo/admin");
          }}
        >
          以管理員 Demo 進入
        </Button>
      </section>

      <section className="wire-panel p-5 lg:col-span-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">隔离说明</h2>
            <p className="mt-1 text-sm text-muted-foreground">两种身份都没有真实服务器权限；所有修改只保存在当前浏览器会话。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>先浏览公开工具</Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetDemoUser();
                resetDemoAdmin(false);
                router.refresh();
              }}
            >
              清除两种 Demo 状态
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
