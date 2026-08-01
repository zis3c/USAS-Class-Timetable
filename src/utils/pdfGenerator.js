import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates an official printable PDF file (A4 Portrait or Landscape)
 */
export async function generateTimetablePdf(elementRef, orientation = 'portrait', fileName = 'Jadual_Kuliah_USAS.pdf') {
  if (!elementRef) {
    throw new Error('Element template not found for PDF export.');
  }

  const canvas = await html2canvas(elementRef, {
    scale: 2, // High DPI clarity
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF'
  });

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
 * Generates a high-resolution PNG image for Device Lock Screen / Phone Wallpaper
 */
export async function generateLockscreenImage(elementRef, fileName = 'Jadual_USAS_Lockscreen.png') {
  if (!elementRef) {
    throw new Error('Lock screen template element not found.');
  }

  const canvas = await html2canvas(elementRef, {
    scale: 3, // Ultra-sharp resolution for smartphone lock screens
    useCORS: true,
    logging: false,
    backgroundColor: null // Preserve background gradient/theme
  });

  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
