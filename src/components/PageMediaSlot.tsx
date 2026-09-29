import React, { useEffect, useState } from 'react';
import { driveOpenUrl, drivePreviewUrl, driveThumbnailUrl, type MediaPosition, type PageMediaItem } from '../lib/driveMedia';

const DriveMediaCard: React.FC<{ item: PageMediaItem }> = ({ item }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const link = driveOpenUrl(item.driveId);
  return (
    <article className={`min-w-0 border border-sky-200 bg-white shadow-sm ${item.display === 'banner' ? 'rounded-xl p-2 md:col-span-2' : 'rounded-2xl p-3'}`}>
      <h3 className="mb-2 text-base font-bold text-slate-800 break-words">{item.icon && <span className="mr-2 text-xl" aria-hidden="true">{item.icon}</span>}{item.title}</h3>
      {item.description && <p className="mb-3 whitespace-pre-wrap text-sm text-slate-600">{item.description}</p>}
      {item.kind === 'text' ? null : item.kind === 'image' && !imageFailed ? (
        <img
          src={driveThumbnailUrl(item.driveId)}
          alt={item.title}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="w-full max-h-[26rem] rounded-xl object-contain bg-slate-50"
        />
      ) : item.kind !== 'image' ? (
        <iframe
          title={item.title}
          src={drivePreviewUrl(item.driveId)}
          loading="lazy"
          allow="autoplay; fullscreen"
          className="w-full h-48 rounded-xl border border-slate-200 bg-slate-50"
        />
      ) : (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Không tải được ảnh. Kiểm tra quyền chia sẻ trên Drive.</p>
      )}
      {item.kind !== 'text' && <a href={link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-700 underline underline-offset-2">
        Mở tệp trên Google Drive
      </a>}
      {item.actionUrl && <a href={item.actionUrl} target="_blank" rel="noopener noreferrer" className="ml-3 mt-2 inline-block rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white">Xem thêm</a>}
    </article>
  );
};

export const PageMediaSlot: React.FC<{ items: PageMediaItem[]; position: MediaPosition }> = ({ items, position }) => {
  const visible = items.filter((item) => item.position === position && item.display !== 'popup');
  if (!visible.length) return null;
  return <section aria-label="Tư liệu học tập" className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
    {visible.map((item) => <DriveMediaCard key={item.id} item={item} />)}
  </section>;
};

export const PageMediaPopup: React.FC<{ pageKey: string; items: PageMediaItem[] }> = ({ pageKey, items }) => {
  const item = items.find((entry) => entry.display === 'popup');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!item) return setOpen(false);
    const key = `KIDO_POPUP_SEEN_${pageKey}_${item.id}`;
    if (!sessionStorage.getItem(key)) setOpen(true);
  }, [item, pageKey]);
  if (!item || !open) return null;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={item.title}>
    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6">
      <button type="button" aria-label="Đóng popup" onClick={() => { sessionStorage.setItem(`KIDO_POPUP_SEEN_${pageKey}_${item.id}`, '1'); setOpen(false); }} className="absolute right-3 top-3 z-10 rounded-full bg-slate-900 px-3 py-1.5 text-white">✕</button>
      <DriveMediaCard item={item} />
    </div>
  </div>;
};
