import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { isTrustedAdmin } from './adminAccess';
import type { ActiveTab } from '../types';

export interface CustomPage {
  id: ActiveTab;
  slug: string;
  menuLabel: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface MenuConfig {
  brandName: string;
  slogan: string;
  logo: string;
  labels: Record<string, string>;
  icons: Record<string, string>;
  hidden: string[];
}

export const DEFAULT_MENU_CONFIG: MenuConfig = {
  brandName: 'KIDOEnglish', slogan: 'LEARN • PLAY • GROW', logo: '🦖', labels: {}, icons: {}, hidden: [],
};

const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function customPageId(slug: string): ActiveTab {
  return `custom-${slug}` as ActiveTab;
}

function validPage(value: unknown): value is CustomPage {
  if (!value || typeof value !== 'object') return false;
  const page = value as CustomPage;
  return typeof page.slug === 'string' && validSlug.test(page.slug) &&
    page.id === customPageId(page.slug) && page.menuLabel.length > 0 && page.menuLabel.length <= 40 &&
    page.title.length > 0 && page.title.length <= 100 && page.description.length <= 1000 && page.icon.length <= 8;
}

export function subscribeCustomPages(onChange: (pages: CustomPage[]) => void): () => void {
  return onSnapshot(doc(db, 'siteContent', 'pages'), (snapshot) => {
    const pages = snapshot.data()?.pages;
    onChange(Array.isArray(pages) ? pages.filter(validPage).slice(0, 30) : []);
  }, () => onChange([]));
}

export async function saveCustomPages(pages: CustomPage[]): Promise<void> {
  if (!(await isTrustedAdmin(auth.currentUser))) throw new Error('Chỉ Admin mới được tạo hoặc sửa menu.');
  if (pages.length > 30 || !pages.every(validPage)) throw new Error('Thông tin trang không hợp lệ.');
  await setDoc(doc(db, 'siteContent', 'pages'), { pages, updatedAt: serverTimestamp() });
}

export function subscribeMenuConfig(onChange: (config: MenuConfig) => void): () => void {
  return onSnapshot(doc(db, 'siteContent', 'menu'), (snapshot) => {
    const data = snapshot.data();
    onChange(data ? {
      brandName: String(data.brandName || DEFAULT_MENU_CONFIG.brandName).slice(0, 40),
      slogan: String(data.slogan || DEFAULT_MENU_CONFIG.slogan).slice(0, 80),
      logo: String(data.logo || DEFAULT_MENU_CONFIG.logo).slice(0, 300),
      labels: typeof data.labels === 'object' && data.labels ? data.labels : {},
      icons: typeof data.icons === 'object' && data.icons ? data.icons : {},
      hidden: Array.isArray(data.hidden) ? data.hidden.filter((id) => typeof id === 'string').slice(0, 100) : [],
    } : DEFAULT_MENU_CONFIG);
  }, () => onChange(DEFAULT_MENU_CONFIG));
}

export async function saveMenuConfig(config: MenuConfig): Promise<void> {
  if (!(await isTrustedAdmin(auth.currentUser))) throw new Error('Chỉ Admin mới được sửa menu.');
  await setDoc(doc(db, 'siteContent', 'menu'), {
    brandName: config.brandName.trim().slice(0, 40) || DEFAULT_MENU_CONFIG.brandName,
    slogan: config.slogan.trim().slice(0, 80), logo: config.logo.trim().slice(0, 300) || DEFAULT_MENU_CONFIG.logo,
    labels: config.labels, icons: config.icons, hidden: config.hidden, updatedAt: serverTimestamp(),
  });
}
