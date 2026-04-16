// Client-side helpers to convert unstructured files into either text or image data URLs
// before sending to the AI extraction edge function.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.js?url';
import mammoth from 'mammoth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

export const UNSTRUCTURED_EXTENSIONS = [
  '.pdf', '.docx', '.txt', '.md', '.png', '.jpg', '.jpeg', '.webp',
];

export const UNSTRUCTURED_ACCEPT = UNSTRUCTURED_EXTENSIONS.join(',');

export type UnstructuredPayload =
  | { kind: 'text'; text: string }
  | { kind: 'image'; imageDataUrl: string };

const getExt = (name: string) => name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const fileToText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const extractPdfText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let allText = '';
  const maxPages = Math.min(pdf.numPages, 30); // safety cap
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    allText += `\n--- Page ${i} ---\n${text}\n`;
  }
  return allText.trim();
};

const extractDocxText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const isUnstructuredFile = (fileName: string) =>
  UNSTRUCTURED_EXTENSIONS.includes(getExt(fileName));

export const prepareUnstructured = async (file: File): Promise<UnstructuredPayload> => {
  const ext = getExt(file.name);

  if (ext === '.pdf') {
    const text = await extractPdfText(file);
    if (text && text.replace(/\s/g, '').length > 50) {
      return { kind: 'text', text };
    }
    // PDF with no extractable text (scanned) → fallback to image of first page would
    // require rendering. For now, return empty text and let AI report no data.
    return { kind: 'text', text };
  }

  if (ext === '.docx') {
    const text = await extractDocxText(file);
    return { kind: 'text', text };
  }

  if (ext === '.txt' || ext === '.md') {
    const text = await fileToText(file);
    return { kind: 'text', text };
  }

  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    const imageDataUrl = await fileToDataUrl(file);
    return { kind: 'image', imageDataUrl };
  }

  throw new Error(`Unsupported unstructured file type: ${ext}`);
};
