
import FormDataPolyfill from './FormDataPolyfill'
import mimeMap from './MimeMap'
import { ReadCall, _Data, _File } from './Other'

export default class FormData implements FormDataPolyfill<FormData> {
  constructor(read: ReadCall, data?: _Data, files?: _File[]) {
    this.read = read
    this.data = data || []
    this.files = files || []
  }
  private read: (path: string) => string | ArrayBuffer;
  private data: _Data;
  private files: _File[]

  append(name: string, value: any) {
    this.data[name] = value
    return this;
  }

  appendFile(name: string, path: string, fileName?: string) {
    const buffer = this.read(path);
    this.files.push({
      name: name,
      buffer: buffer,
      fileName: fileName || path.split('.').slice(-2, -1)[0]
    });
    return this
  }

  generate(): [ArrayBufferLike, string] {
    let boundaryKey: string = `wxmpFormBoundary${this._randString()}`;
    let boundary: string = `--${boundaryKey}`;
    let endBoundary: string = `${boundary}--`;
    const { data, files } = this;
    const dataArray = Object.entries(data).reduce<number[]>((pre, [key, value]) => pre.concat(this._formDataArray(boundary, key, value)), [])
    const fileArray = files.reduce<number[]>((pre, file) => pre.concat(this._formDataArray(boundary, file.name, file.buffer, file.fileName)), dataArray)
    return [new Uint8Array(fileArray.concat(this._toUtf8Bytes(endBoundary))).buffer, `multipart/form-data; boundary=${boundaryKey}`]
  }

  private _getFileMime(fileName: string): string {
    let postfix = fileName.split('.').pop()
    return mimeMap[`.${postfix}`]
  }


  private _utf8CodeAt(str: string, i: number): number[] {
    var out: number[] = [], p = 0;
    var c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192;
      out[p++] = (c & 63) | 128;
    } else if (
      ((c & 0xFC00) == 0xD800) && (i + 1) < str.length &&
      ((str.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
      // Surrogate Pair
      c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
      out[p++] = (c >> 18) | 240;
      out[p++] = ((c >> 12) & 63) | 128;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    } else {
      out[p++] = (c >> 12) | 224;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    }
    return out;
  };

  private _toUtf8Bytes(str: string): number[] {
    let bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(...this._utf8CodeAt(str, i));
      if (str.codePointAt(i)! > 0xffff) {
        i++;
      }
    }
    return bytes;
  }

  private _randString() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = 17; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }

  private _formDataArray(boundary: string, name: string, value: any, fileName?: string) {
    let dataString: string = '';

    dataString += `${boundary}\r\n`;
    dataString += `Content-Disposition: form-data; name="${name}"`;
    dataString
    if (fileName) {
      dataString += `; filename="${fileName}"\r\n`;
      dataString += `Content-Type: ${this._getFileMime(fileName)}\r\n\r\n`;
    }
    else {
      dataString += '\r\n\r\n';
      dataString += value;
    }

    var dataArray: number[] = [];
    dataArray.push(...this._toUtf8Bytes(dataString));

    if (fileName) {
      let fileArray = new Uint8Array(value);
      dataArray = dataArray.concat(Array.prototype.slice.call(fileArray));
    }
    dataArray.push(...this._toUtf8Bytes("\r"));
    dataArray.push(...this._toUtf8Bytes("\n"));

    return dataArray;
  }
}
