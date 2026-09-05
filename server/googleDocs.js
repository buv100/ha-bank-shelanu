/**
 * יצירת דוחות כ-Google Docs אמיתיים, דרך service account (ראו .env.example
 * למשתנה GOOGLE_SERVICE_ACCOUNT_KEY_PATH) — בלי הרשאת משתמש אינטראקטיבית
 * בכל פעם, כמו שסעיף 6 ב-SKILL.md ממליץ לדמו.
 *
 * ממיר "סעיפים" גנריים (כותרת/פסקאות/טבלה) לבקשות batchUpdate של Docs API.
 * זה בכוונה מבנה גנרי ולא 7 פונקציות נפרדות לפי דוח — התוכן והשאילתות
 * לכל דוח מגיעים מהסקיל (references/report-templates.md); הכלי כאן רק
 * "מדפיס" מה שהסוכן בונה.
 */

import { google } from 'googleapis';

/** @typedef {{ auth: import('google-auth-library').JWT }} GoogleDocsAuth */

/**
 * @param {string} keyFilePath
 * @returns {Promise<GoogleDocsAuth>}
 */
export async function loadGoogleDocsAuth(keyFilePath) {
  const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive.file'],
  });

  const client = await auth.getClient();
  return { auth: client };
}

/**
 * @param {{ heading?: string, headingLevel?: number, paragraphs?: string[], table?: { headers: string[], rows: string[][] } }} section
 * @param {{ index: number }} cursor מיקום נוכחי במסמך (מתעדכן תוך כדי)
 * @returns {{ requests: object[] }}
 */
function buildSectionRequests(section, cursor) {
  const requests = [];
  const headingStyle = { 1: 'HEADING_1', 2: 'HEADING_2', 3: 'HEADING_3' }[section.headingLevel || 2];

  if (section.heading) {
    const text = `${section.heading}\n`;
    requests.push({ insertText: { location: { index: cursor.index }, text } });
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: cursor.index, endIndex: cursor.index + text.length },
        paragraphStyle: { namedStyleType: headingStyle },
        fields: 'namedStyleType',
      },
    });
    cursor.index += text.length;
  }

  for (const paragraph of section.paragraphs || []) {
    const text = `${paragraph}\n`;
    requests.push({ insertText: { location: { index: cursor.index }, text } });
    cursor.index += text.length;
  }

  if (section.table && section.table.rows.length > 0) {
    const rows = section.table.rows.length + 1;
    const cols = section.table.headers.length;

    requests.push({
      insertTable: { location: { index: cursor.index }, rows, columns: cols },
    });

    // אחרי insertTable, Docs API מזיז את ה-cursor פנימה לתא הראשון —
    // הדרך היחידה לדעת בוודאות איפה כל תא נמצא היא לשלוף מחדש את המסמך
    // אחרי כל batchUpdate. לכן ממלאים את הטבלה ב-batchUpdate נפרד בהמשך
    // (ראו createGoogleDoc) במקום לנחש אינדקסים כאן.
    cursor.pendingTable = { headers: section.table.headers, rows: section.table.rows };
  }

  return requests;
}

/**
 * ממלא טבלה שכבר נוצרה במסמך, לפי מיקומה (הטבלה האחרונה שנוספה).
 * @param {import('googleapis').docs_v1.Docs} docs
 * @param {string} documentId
 * @param {{ headers: string[], rows: string[][] }} table
 */
async function fillLastTable(docs, documentId, table) {
  const doc = await docs.documents.get({ documentId });
  const content = doc.data.body?.content || [];
  const tableElement = [...content].reverse().find((el) => el.table);

  if (!tableElement || !tableElement.table) {
    return;
  }

  const allRows = [table.headers, ...table.rows];
  const requests = [];

  // ממלאים מהתא האחרון לראשון כדי שאינדקסים קודמים לא יזוזו תוך כדי
  for (let r = allRows.length - 1; r >= 0; r -= 1) {
    for (let c = allRows[r].length - 1; c >= 0; c -= 1) {
      const cell = tableElement.table.tableRows?.[r]?.tableCells?.[c];
      const cellIndex = cell?.content?.[0]?.startIndex;

      if (typeof cellIndex === 'number') {
        requests.push({ insertText: { location: { index: cellIndex }, text: String(allRows[r][c] ?? '') } });
      }
    }
  }

  if (requests.length > 0) {
    await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
  }
}

/**
 * @param {GoogleDocsAuth} auth
 * @param {{ title: string, sections: Array<{ heading?: string, headingLevel?: number, paragraphs?: string[], table?: { headers: string[], rows: string[][] } }> }} input
 * @returns {Promise<string>} קישור לצפייה במסמך
 */
export async function createGoogleDoc(auth, { title, sections }) {
  const docs = google.docs({ version: 'v1', auth: auth.auth });
  const created = await docs.documents.create({ requestBody: { title } });
  const documentId = created.data.documentId;

  if (!documentId) {
    throw new Error('Google Docs לא החזיר documentId');
  }

  const cursor = { index: 1 };

  for (const section of sections) {
    const requests = buildSectionRequests(section, cursor);

    if (requests.length > 0) {
      await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
    }

    if (cursor.pendingTable) {
      await fillLastTable(docs, documentId, cursor.pendingTable);
      // אחרי מילוי הטבלה המסמך גדל — קוראים אותו מחדש כדי לדעת את סוף התוכן
      const refreshed = await docs.documents.get({ documentId });
      const endIndex = refreshed.data.body?.content?.slice(-1)[0]?.endIndex;
      cursor.index = typeof endIndex === 'number' ? endIndex - 1 : cursor.index;
      delete cursor.pendingTable;
    }
  }

  const drive = google.drive({ version: 'v3', auth: auth.auth });
  await drive.permissions.create({
    fileId: documentId,
    requestBody: { role: 'reader', type: 'anyone' },
  }).catch(() => {
    // דמו בלבד — אם אין הרשאה לשתף פומבית, המסמך עדיין קיים ונגיש דרך ה-service account
  });

  return `https://docs.google.com/document/d/${documentId}/edit`;
}
