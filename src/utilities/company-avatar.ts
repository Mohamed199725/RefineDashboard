const STORAGE_PREFIX = "refine-company-avatar:";

export const getCompanyAvatarOverride = (companyId?: string) => {
  if (!companyId) return undefined;
  return window.localStorage.getItem(`${STORAGE_PREFIX}${companyId}`) || undefined;
};

export const setCompanyAvatarOverride = (companyId: string, image: string) => {
  window.localStorage.setItem(`${STORAGE_PREFIX}${companyId}`, image);
};

export const resizeCompanyImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Unable to read the selected image"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Unable to process the selected image"));
      image.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Unable to process the selected image"));
          return;
        }

        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
};
