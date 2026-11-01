export type PostFormDataOptions = {
  url: string;
  formData: FormData;
  onProgress?: (percent: number) => void;
  createXhr?: () => XMLHttpRequest;
};

export function postFormDataWithProgress<T>(options: PostFormDataOptions): Promise<T> {
  const { url, formData, onProgress, createXhr = () => new XMLHttpRequest() } = options;

  return new Promise((resolve, reject) => {
    const xhr = createXhr();
    xhr.upload.addEventListener("progress", (event) => {
      if (onProgress && event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new Error("Invalid response"));
        }
      } else {
        reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}
