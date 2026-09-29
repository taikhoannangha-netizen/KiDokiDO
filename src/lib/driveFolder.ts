import { GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { MEDIA_FOLDER_ID, mediaKindFromMime, type MediaKind } from './driveMedia';
import { isTrustedAdmin } from './adminAccess';

export interface DriveFolderFile { id: string; name: string; kind: MediaKind }

/** Admin-only, consented lookup. OAuth access token stays in memory for this request. */
export async function listMediaFolder(): Promise<DriveFolderFile[]> {
  const current = auth.currentUser;
  if (!current || !(await isTrustedAdmin(current))) {
    throw new Error('Cần đăng nhập Google bằng tài khoản có quyền Firebase admin.');
  }
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
  provider.setCustomParameters({ prompt: 'consent select_account' });
  const credential = GoogleAuthProvider.credentialFromResult(await reauthenticateWithPopup(current, provider));
  if (!credential?.accessToken) throw new Error('Google không cấp quyền đọc danh sách tệp Drive.');

  const files: DriveFolderFile[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', `'${MEDIA_FOLDER_ID}' in parents and trashed = false`);
    url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType)');
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${credential.accessToken}` } });
    if (!response.ok) throw new Error(response.status === 403
      ? 'Không đọc được thư mục. Kiểm tra quyền truy cập và bật Google Drive API trong Google Cloud của dự án.'
      : `Google Drive trả về lỗi ${response.status}.`);
    const data = await response.json() as { files?: Array<{ id?: string; name?: string; mimeType?: string }>; nextPageToken?: string };
    for (const file of data.files || []) {
      if (file.id && file.name && file.mimeType && file.mimeType !== 'application/vnd.google-apps.folder') {
        files.push({ id: file.id, name: file.name, kind: mediaKindFromMime(file.mimeType, file.name) });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken && files.length < 500);
  return files;
}
