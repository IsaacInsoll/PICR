declare module 'decompress' {
  export interface DecompressFile {
    path: string;
    data: Buffer;
    mode?: number;
    mtime?: Date;
    type?: string;
  }

  export interface DecompressOptions {
    strip?: number;
    filter?: (file: DecompressFile) => boolean;
  }

  export default function decompress(
    input: string,
    output?: string,
    options?: DecompressOptions,
  ): Promise<DecompressFile[]>;
}
