export type ReadCall = (path: string) => string | ArrayBuffer;
export type _Data = { [key: string]: any };
export type _File = {
  name: string,
  buffer: string | ArrayBuffer,
  fileName: string
}
