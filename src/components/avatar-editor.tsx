"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlusIcon, UploadIcon, UserRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const previewSize = 256;

export function AvatarEditor({ image, name, targetPublicId }: {
  image: string | null;
  name: string;
  targetPublicId?: string;
}) {
  const router = useRouter();
  const { refetch } = authClient.useSession();
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const selection = useRef(0);
  const drag = useRef<{ x: number; y: number; horizontal: number; vertical: number } | null>(null);
  const [selected, setSelected] = useState<HTMLImageElement | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(50);
  const [vertical, setVertical] = useState(50);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const currentImage = uploadedImage ?? image;
  const scale = selected ? Math.max(previewSize / selected.width, previewSize / selected.height) * zoom : 1;
  const width = selected ? selected.width * scale : previewSize;
  const height = selected ? selected.height * scale : previewSize;

  useEffect(() => {
    if (!selected || !canvas.current) return;
    const context = canvas.current.getContext("2d");
    context?.clearRect(0, 0, previewSize, previewSize);
    context?.drawImage(selected, (previewSize - width) * horizontal / 100, (previewSize - height) * vertical / 100, width, height);
    if (!dialog.current?.open) dialog.current?.showModal();
  }, [height, horizontal, selected, vertical, width]);

  function chooseFile(file?: File) {
    if (!file) return;
    setStatus("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setStatus("請選擇 8 MB 以下的 PNG、JPEG 或 WebP 圖片。");
      return;
    }
    const request = ++selection.current;
    const source = URL.createObjectURL(file);
    const picture = new window.Image();
    picture.onload = () => {
      URL.revokeObjectURL(source);
      if (request !== selection.current) return;
      if (picture.width > 8192 || picture.height > 8192 || picture.width * picture.height > 16_777_216) {
        setStatus("圖片尺寸過大，請選擇較小的圖片。");
        return;
      }
      setZoom(1);
      setHorizontal(50);
      setVertical(50);
      setSelected(picture);
    };
    picture.onerror = () => {
      URL.revokeObjectURL(source);
      if (request === selection.current) setStatus("無法開啟這張圖片，請換一張再試。");
    };
    picture.src = source;
  }

  function moveCrop(event: PointerEvent<HTMLCanvasElement>) {
    if (pending || !drag.current) return;
    const ratio = previewSize / event.currentTarget.getBoundingClientRect().width;
    const clamp = (value: number) => Math.min(100, Math.max(0, value));
    if (width > previewSize) setHorizontal(clamp(drag.current.horizontal - (event.clientX - drag.current.x) * ratio / (width - previewSize) * 100));
    if (height > previewSize) setVertical(clamp(drag.current.vertical - (event.clientY - drag.current.y) * ratio / (height - previewSize) * 100));
  }

  async function saveAvatar() {
    if (!selected) return;
    setPending(true);
    setStatus("");
    try {
      const output = document.createElement("canvas");
      output.width = output.height = 512;
      output.getContext("2d")!.drawImage(selected, (previewSize - width) * horizontal / 100 * 2, (previewSize - height) * vertical / 100 * 2, width * 2, height * 2);
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob((value) => value ? resolve(value) : reject(new Error("無法裁切圖片，請重試。")), "image/png"));
      const form = new FormData();
      form.set("avatar", blob, "avatar.png");
      if (targetPublicId) form.set("targetPublicId", targetPublicId);
      const response = await fetch("/api/account/avatar", { method: "POST", body: form });
      const result = await response.json() as { image?: string; error?: string };
      if (!response.ok || !result.image) {
        setStatus(result.error || "無法儲存頭像，請稍後重試。");
        return;
      }
      setUploadedImage(result.image);
      dialog.current?.close();
      setStatus("頭像已更新。");
      if (!targetPublicId) await refetch();
      router.refresh();
    } catch {
      setStatus("無法儲存頭像，請稍後重試。");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="soft-surface p-4" aria-label="頭像管理">
      <h3 className="font-semibold">頭像</h3>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          aria-label="選擇新的頭像"
          className="group relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-secondary-foreground"
          onClick={() => input.current?.click()}
        >
          {currentImage ? <Image src={currentImage} alt={`${name} 的頭像`} width={96} height={96} unoptimized className="size-full object-cover" /> : <UserRoundIcon className="size-10" />}
          <span className="absolute inset-x-0 bottom-0 flex justify-center bg-foreground/70 py-1 text-white"><ImagePlusIcon className="size-4" /></span>
        </button>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="選擇頭像圖片"
          className="sr-only"
          onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = ""; }}
        />
        <button
          type="button"
          aria-label="上傳頭像圖片"
          className={`min-w-0 flex-1 basis-48 rounded-lg border-2 border-dashed p-4 text-left text-sm ${dragging ? "border-primary bg-secondary" : "border-border bg-muted/40"}`}
          onClick={() => input.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (event.dataTransfer.files.length !== 1) setStatus("請每次選擇一張圖片。");
            else chooseFile(event.dataTransfer.files[0]);
          }}
        >
          <UploadIcon className="mb-2 size-5 text-primary" />
          <span className="block font-semibold">將圖片拖到這裡，或點擊選擇圖片</span>
          <span className="mt-1 block text-xs text-muted-foreground">PNG、JPEG、WebP，最多 8 MB；上傳前可裁切與縮放。</span>
        </button>
      </div>
      {status ? <p className="mt-3 text-sm" role="status">{status}</p> : null}
      <dialog
        ref={dialog}
        aria-labelledby="avatar-crop-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-border bg-card p-5 text-foreground shadow-xl backdrop:bg-foreground/25"
        onCancel={(event) => { if (pending) event.preventDefault(); }}
        onClose={() => { setSelected(null); drag.current = null; selection.current++; }}
      >
        <h3 id="avatar-crop-title" className="text-xl font-bold">裁切頭像</h3>
        <p className="mt-2 text-sm text-muted-foreground">拖曳預覽調整位置，或使用下方滑桿。頭像會儲存為正方形圖片。</p>
        <canvas
          ref={canvas}
          width={previewSize}
          height={previewSize}
          role="img"
          aria-label="頭像裁切預覽"
          className="mx-auto mt-5 block max-w-full touch-none rounded-full border border-border bg-muted"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, horizontal, vertical };
          }}
          onPointerMove={moveCrop}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
        />
        <div className="mt-5 grid gap-3 text-sm">
          <label className="grid gap-1">縮放<input aria-label="頭像縮放" type="range" min="1" max="3" step="0.01" value={zoom} disabled={pending} onChange={(event) => setZoom(Number(event.target.value))} /></label>
          <label className="grid gap-1">水平位置<input aria-label="頭像水平位置" type="range" min="0" max="100" value={horizontal} disabled={pending || width <= previewSize} onChange={(event) => setHorizontal(Number(event.target.value))} /></label>
          <label className="grid gap-1">垂直位置<input aria-label="頭像垂直位置" type="range" min="0" max="100" value={vertical} disabled={pending || height <= previewSize} onChange={(event) => setVertical(Number(event.target.value))} /></label>
        </div>
        {status ? <p className="mt-3 text-sm text-destructive" role="alert">{status}</p> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={() => dialog.current?.close()}>取消</Button>
          <Button type="button" disabled={pending || !selected} onClick={saveAvatar}>{pending ? "儲存中…" : "儲存頭像"}</Button>
        </div>
      </dialog>
    </section>
  );
}
