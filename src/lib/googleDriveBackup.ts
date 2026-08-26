import { google } from "googleapis";
import { Readable } from "stream";

// 直近30回分(日次実行なら約1ヶ月分)のバックアップだけドライブに残し、古いものは削除する
const RETENTION_COUNT = 30;

function getDriveClient() {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!base64) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64が設定されていません");

  const key = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    // drive.fileだと「共有」で渡されたフォルダは見えない(アプリ自身が作成/pickerで開いたファイルのみ)ため、
    // 通常の共有フォルダにアクセスできるdriveスコープを使う。
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

export async function uploadBackupToDrive(json: string, filename: string) {
  const folderId = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID;
  if (!folderId) throw new Error("GOOGLE_DRIVE_BACKUP_FOLDER_IDが設定されていません");

  const drive = getDriveClient();

  // 対象フォルダが共有ドライブ内にある場合、supportsAllDrivesを付けないと
  // 通常のマイドライブ扱いになり「見つからない」エラーになる。
  const created = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType: "application/json",
      body: Readable.from([json]),
    },
    fields: "id, name, createdTime",
    supportsAllDrives: true,
  });

  // 保持件数を超えた古いバックアップを削除する
  const list = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, createdTime)",
    orderBy: "createdTime desc",
    pageSize: 1000,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "allDrives",
  });
  const files = list.data.files ?? [];
  const toDelete = files.slice(RETENTION_COUNT);
  for (const file of toDelete) {
    if (file.id) await drive.files.delete({ fileId: file.id, supportsAllDrives: true });
  }

  return { file: created.data, deletedCount: toDelete.length };
}
