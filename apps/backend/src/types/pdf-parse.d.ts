declare module "pdf-parse" {
  export class PDFParse {
    constructor(input: { data?: Buffer; url?: string });
    destroy(): Promise<void>;
    getText(): Promise<{ text: string }>;
  }
}
