// Ambient declaration for pdf-parse, which ships without TypeScript types.
declare module "pdf-parse" {
  const pdfParse: (buffer: Buffer | Uint8Array) => Promise<{ text: string; numpages: number; info: unknown }>;
  export default pdfParse;
}
