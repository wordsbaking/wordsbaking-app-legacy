declare module '@xkeshi/image-compressor' {
  interface ImageCompressorOptions {
    checkOrientation?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    width?: number;
    height?: number;
    quality?: number;
    mimeType?: string;
    convertSize?: number;
    success?(result: Blob): void;
    error?(err: Error): void;
  }

  class ImageCompressor {
    constructor(file?: Blob, options?: ImageCompressorOptions);
    compress(file: Blob, options?: ImageCompressorOptions): Promise<Blob>;
  }

  namespace ImageCompressor {

  }

  export = ImageCompressor;
}
