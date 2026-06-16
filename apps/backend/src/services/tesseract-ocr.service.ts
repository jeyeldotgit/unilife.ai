export async function extractScheduleTextWithTesseract(buffer: Buffer) {
  try {
    const tesseract = (await import("tesseract.js")) as unknown as {
      default?: { recognize?: (image: Buffer, langs?: string) => Promise<{ data: { text: string } }> };
      recognize?: (image: Buffer, langs?: string) => Promise<{ data: { text: string } }>;
    };
    const api = tesseract.recognize ? tesseract : tesseract.default;
    if (!api?.recognize) {
      throw new Error("Tesseract recognize API is unavailable.");
    }
    const result = await api.recognize(buffer, "eng");
    return result.data.text;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tesseract OCR failed.";
    throw new Error(`Tesseract OCR failed: ${message}`);
  }
}
