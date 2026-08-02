import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ExportElement = HTMLElement & {
  getAttribute?: (name: string) => string | null;
};

async function captureElement(elementRef: ExportElement | null, scale = 2, backgroundColor = '#FFFFFF') {
  if (!elementRef) {
    throw new Error('Element template not found for export.');
  }

  const exportRootId = elementRef.getAttribute?.('data-export-root');

  return html2canvas(elementRef, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor,
    scrollX: 0,
    scrollY: 0,
    width: elementRef.scrollWidth || elementRef.offsetWidth || undefined,
    height: elementRef.scrollHeight || elementRef.offsetHeight || undefined,
    windowWidth: elementRef.scrollWidth || elementRef.offsetWidth || window.innerWidth,
    windowHeight: elementRef.scrollHeight || elementRef.offsetHeight || window.innerHeight,
    onclone: (clonedDoc) => {
      if (!exportRootId) return;
      const clonedRoot = clonedDoc.querySelector(`[data-export-root="${exportRootId}"]`) as HTMLElement | null;
      if (!clonedRoot) return;
      clonedRoot.style.transform = 'none';
      clonedRoot.style.transition = 'none';
      clonedRoot.style.animation = 'none';
      clonedRoot.style.overflow = 'visible';
      clonedRoot.style.width = `${elementRef.scrollWidth || elementRef.offsetWidth || clonedRoot.scrollWidth}px`;
      clonedRoot.style.height = 'auto';
    }
  });
}

/**
 * Generates an official printable PDF file (A4 Portrait or Landscape)
 */
export async function generateTimetablePdf(
  elementRef: ExportElement | null,
  orientation: 'portrait' | 'landscape' = 'portrait',
  fileName = 'Jadual_Kuliah_USAS.pdf',
) {
  const canvas = await captureElement(elementRef, 2, '#FFFFFF');

  const imgData = canvas.toDataURL('image/png');
  const isLandscape = orientation === 'landscape';

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
  pdf.save(fileName);
}

/**
 * Generates a downloadable PNG from the given element.
 */
export async function generateElementPng(
  elementRef: ExportElement | null,
  fileName = 'Jadual_Kuliah_USAS.png',
  scale = 3,
  backgroundColor = '#FFFFFF',
) {
  const canvas = await captureElement(elementRef, scale, backgroundColor);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Generates a high-resolution PNG image for Device Lock Screen / Phone Wallpaper
 */
export async function generateLockscreenImage(elementRef: ExportElement | null, fileName = 'Jadual_USAS_Lockscreen.png') {
  await generateElementPng(elementRef, fileName, 3, null);
}
