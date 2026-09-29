import React, { useMemo, useState } from 'react';
import type { DriveFolderFile } from '../lib/driveFolder';
import { normalizeVocabularyKey, saveVocabularyContent, type ManagedVocabularyItem } from '../lib/pageContent';
import { grade1VocabList } from '../data/grade1VocabData';
import { grade2VocabList } from '../data/grade2VocabData';
import { grade3VocabList } from '../data/grade3VocabData';
import { grade4VocabList } from '../data/grade4VocabData';
import { grade5VocabList } from '../data/grade5VocabData';

interface Props { items: ManagedVocabularyItem[]; authorized: boolean; folderFiles: DriveFolderFile[]; onMessage: (message: string) => void; }

const emptyDraft = { word: '', meaningVi: '', phonetic: '', grade: 1, icon: '📘', example: '' };

export const VocabularyContentAdmin: React.FC<Props> = ({ items, authorized, folderFiles, onMessage }) => {
  const [draft, setDraft] = useState(emptyDraft);
  const [working, setWorking] = useState<ManagedVocabularyItem[]>(items);
  const [bulkText, setBulkText] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  React.useEffect(() => setWorking(items), [items]);

  const enabledCount = useMemo(() => working.filter(item => item.enabled).length, [working]);
  const visibleItems = useMemo(() => {
    const key = normalizeVocabularyKey(query);
    return working.map((item, index) => ({ item, index })).filter(({ item }) =>
      (gradeFilter === 'all' || item.grade === Number(gradeFilter)) &&
      (!key || normalizeVocabularyKey(`${item.word} ${item.meaningVi} ${item.example || ''}`).includes(key))
    );
  }, [working, query, gradeFilter]);
  const loadExisting = () => {
    const lists = [grade1VocabList, grade2VocabList, grade3VocabList, grade4VocabList, grade5VocabList];
    const existing = lists.flatMap((list, gradeIndex) => list.map((item, order): ManagedVocabularyItem => ({
      id: `grade-${gradeIndex + 1}-${item.id}`, word: item.word, label: item.label, phonetic: item.phonetic,
      meaningVi: item.meaningVi, example: item.example, grade: (gradeIndex + 1) as 1|2|3|4|5,
      icon: item.icon, colorTheme: item.colorTheme, enabled: true, order,
    })));
    setWorking(existing); onMessage(`Đã nạp ${existing.length} từ vựng đang có vào bản nháp. Hãy kiểm tra rồi bấm lưu Firebase.`);
  };
  const add = () => {
    if (!draft.word.trim() || !draft.meaningVi.trim()) return onMessage('Nhập từ tiếng Anh và nghĩa tiếng Việt.');
    setWorking(current => [...current, {
      id: crypto.randomUUID(), word: draft.word.trim(), label: draft.word.trim(), phonetic: draft.phonetic.trim(),
      meaningVi: draft.meaningVi.trim(), example: draft.example.trim(), grade: draft.grade as 1 | 2 | 3 | 4 | 5,
      icon: draft.icon.trim() || '📘', enabled: true, order: current.length,
    }]);
    setDraft(emptyDraft); onMessage('Đã thêm vào bản nháp từ vựng.');
  };
  const importBulk = () => {
    try {
      const parsed = JSON.parse(bulkText);
      if (!Array.isArray(parsed)) throw new Error();
      const additions: ManagedVocabularyItem[] = parsed.map((raw, index) => ({
        id: crypto.randomUUID(), word: String(raw.word || '').trim(), label: String(raw.label || raw.word || '').trim(),
        phonetic: String(raw.phonetic || '').trim(), meaningVi: String(raw.meaningVi || '').trim(), example: String(raw.example || '').trim(),
        grade: ([1, 2, 3, 4, 5].includes(Number(raw.grade)) ? Number(raw.grade) : 1) as 1 | 2 | 3 | 4 | 5,
        icon: String(raw.icon || '📘').slice(0, 16), imageDriveId: raw.imageDriveId || undefined, audioDriveId: raw.audioDriveId || undefined,
        colorTheme: raw.colorTheme || 'blue', enabled: raw.enabled !== false, order: working.length + index,
      })).filter(item => item.word && item.meaningVi);
      if (!additions.length || working.length + additions.length > 1500) throw new Error();
      setWorking(current => [...current, ...additions]); setBulkText(''); onMessage(`Đã nhập ${additions.length} từ vào bản nháp.`);
    } catch { onMessage('JSON không hợp lệ. Cần mảng gồm word, meaningVi, grade, icon và các trường tùy chọn.'); }
  };
  const autoMatchDrive = () => {
    let matches = 0;
    const next = working.map(item => {
      const wordKey = normalizeVocabularyKey(item.word);
      const matching = folderFiles.filter(file => {
        const fileKey = normalizeVocabularyKey(file.name);
        return fileKey === wordKey || fileKey.startsWith(`${wordKey} `);
      });
      const image = matching.find(file => file.kind === 'image');
      const audio = matching.find(file => file.kind === 'audio');
      if (image || audio) matches += 1;
      return { ...item, imageDriveId: image?.id || item.imageDriveId, audioDriveId: audio?.id || item.audioDriveId };
    });
    setWorking(next); onMessage(`Đã ghép tệp Drive cho ${matches} từ theo tên tệp.`);
  };
  const save = async () => {
    setSaving(true);
    try { await saveVocabularyContent(working.map((item, order) => ({ ...item, order }))); onMessage(`Đã lưu ${working.length} từ vựng lên Firebase.`); }
    catch (error) { onMessage(error instanceof Error ? error.message : 'Không lưu được từ vựng.'); }
    finally { setSaving(false); }
  };

  const updateItem = (index: number, patch: Partial<ManagedVocabularyItem>) =>
    setWorking(value => value.map((entry, current) => current === index ? { ...entry, ...patch } : entry));
  const mediaId = (value: string) => value.trim().match(/\/d\/([A-Za-z0-9_-]+)/)?.[1] || value.trim().match(/[?&]id=([A-Za-z0-9_-]+)/)?.[1] || value.trim();

  return <section className="rounded-xl border border-violet-200 bg-violet-50 p-3">
    <h3 className="font-bold text-violet-950">Dữ liệu chuyên biệt · {enabledCount}/{working.length} từ đang hiển thị</h3>
    <div className="mt-3 grid gap-2 sm:grid-cols-6">
      <input value={draft.word} onChange={e => setDraft(v => ({...v, word: e.target.value}))} placeholder="English word" className="rounded-lg border p-2 sm:col-span-2" />
      <input value={draft.meaningVi} onChange={e => setDraft(v => ({...v, meaningVi: e.target.value}))} placeholder="Nghĩa tiếng Việt" className="rounded-lg border p-2 sm:col-span-2" />
      <input value={draft.phonetic} onChange={e => setDraft(v => ({...v, phonetic: e.target.value}))} placeholder="Phiên âm" className="rounded-lg border p-2" />
      <select value={draft.grade} onChange={e => setDraft(v => ({...v, grade: Number(e.target.value)}))} className="rounded-lg border p-2 bg-white">{[1,2,3,4,5].map(g => <option key={g} value={g}>Lớp {g}</option>)}</select>
      <input value={draft.icon} onChange={e => setDraft(v => ({...v, icon: e.target.value}))} placeholder="Icon/sticker" className="rounded-lg border p-2" />
      <input value={draft.example} onChange={e => setDraft(v => ({...v, example: e.target.value}))} placeholder="Câu ví dụ" className="rounded-lg border p-2 sm:col-span-4" />
      <button type="button" onClick={add} disabled={!authorized} className="rounded-lg bg-violet-700 p-2 font-semibold text-white disabled:opacity-50">Thêm một từ</button>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={loadExisting} disabled={!authorized} className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Nạp toàn bộ từ vựng đang có</button>
      <button type="button" onClick={autoMatchDrive} disabled={!authorized || folderFiles.length === 0} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Tự ghép ảnh/audio Drive theo tên</button>
      <button type="button" onClick={() => setWorking(current => current.map(item => ({...item, enabled: true})))} disabled={!authorized} className="rounded-lg border bg-white px-3 py-2 text-sm">Bật tất cả</button>
      <button type="button" onClick={() => setWorking(current => current.map(item => ({...item, enabled: false})))} disabled={!authorized} className="rounded-lg border bg-white px-3 py-2 text-sm">Ẩn tất cả</button>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px_auto]">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm từ, nghĩa hoặc câu ví dụ…" className="rounded-lg border p-2" />
      <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value as typeof gradeFilter)} className="rounded-lg border bg-white p-2"><option value="all">Tất cả lớp</option>{[1,2,3,4,5].map(g => <option key={g} value={g}>Lớp {g}</option>)}</select>
      <span className="self-center text-sm font-semibold text-slate-600">{visibleItems.length} kết quả</span>
    </div>
    <div className="mt-3 max-h-[34rem] space-y-2 overflow-y-auto">{visibleItems.map(({ item, index }) => <details key={item.id} className="rounded-lg border bg-white p-2 text-sm">
      <summary className="grid cursor-pointer items-center gap-2 sm:grid-cols-[42px_1.1fr_1.1fr_70px_70px_auto]">
        <span className="text-center text-xl">{item.icon || '📘'}</span><b>{item.word}</b><span>{item.meaningVi}</span><span>L{item.grade}</span><span>{item.enabled ? 'Đang hiện' : 'Đang ẩn'}</span><span className="text-violet-700">Chỉnh sửa</span>
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input value={item.icon} onChange={e => updateItem(index, { icon:e.target.value })} placeholder="Icon / sticker" className="rounded border p-2" />
        <input value={item.word} onChange={e => updateItem(index, { word:e.target.value, label:e.target.value })} placeholder="Từ tiếng Anh" className="rounded border p-2" />
        <input value={item.meaningVi} onChange={e => updateItem(index, { meaningVi:e.target.value })} placeholder="Nghĩa tiếng Việt" className="rounded border p-2" />
        <input value={item.phonetic} onChange={e => updateItem(index, { phonetic:e.target.value })} placeholder="Phiên âm" className="rounded border p-2" />
        <input value={item.example || ''} onChange={e => updateItem(index, { example:e.target.value })} placeholder="Câu ví dụ" className="rounded border p-2 sm:col-span-2" />
        <input value={item.imageDriveId || ''} onChange={e => updateItem(index, { imageDriveId:mediaId(e.target.value) || undefined })} placeholder="ID hoặc link ảnh Google Drive" className="rounded border p-2" />
        <input value={item.audioDriveId || ''} onChange={e => updateItem(index, { audioDriveId:mediaId(e.target.value) || undefined })} placeholder="ID hoặc link audio Google Drive" className="rounded border p-2" />
        <select value={item.grade} onChange={e => updateItem(index, { grade:Number(e.target.value) as 1|2|3|4|5 })} className="rounded border bg-white p-2">{[1,2,3,4,5].map(g => <option key={g} value={g}>Lớp {g}</option>)}</select>
        <label className="flex items-center gap-2 rounded border p-2"><input type="checkbox" checked={item.enabled} onChange={e => updateItem(index, { enabled:e.target.checked })} />Hiển thị từ này</label>
        <button type="button" onClick={() => setWorking(v => v.filter((_,i) => i !== index))} className="rounded border border-red-200 bg-red-50 p-2 text-red-700 sm:col-span-2">Xóa từ</button>
      </div>
    </details>)}</div>
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
      <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={4} placeholder='Nhập JSON hàng loạt: [{"word":"apple","meaningVi":"quả táo","grade":1,"icon":"🍎"}]' className="rounded-lg border p-2 text-xs" />
      <button type="button" onClick={importBulk} disabled={!authorized || !bulkText.trim()} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Nhập JSON</button>
    </div>
    <button type="button" onClick={save} disabled={!authorized || saving} className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu toàn bộ từ vựng lên Firebase'}</button>
  </section>;
};
