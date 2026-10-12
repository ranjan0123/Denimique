import fs from "fs";
import path from "path";
import cloudinary from "../config/cloudinary";

const PLACEHOLDER_VALUES = new Set([
  "your_cloud_name",
  "your_api_key",
  "your_api_secret",
]);

const getCloudinaryFolder = (subfolder?: string) => {
  const base = (process.env.CLOUDINARY_FOLDER || "suitablevastra").trim();
  const normalizedBase = base.replace(/\/+$/g, "");
  const normalizedSub =
    subfolder?.trim().replace(/^\/+/g, "").replace(/\/+$/g, "") || "";

  return normalizedSub ? `${normalizedBase}/${normalizedSub}` : normalizedBase;
};

const isCloudinaryConfigured = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  return Boolean(
    cloud_name &&
      api_key &&
      api_secret &&
      !PLACEHOLDER_VALUES.has(cloud_name) &&
      !PLACEHOLDER_VALUES.has(api_key) &&
      !PLACEHOLDER_VALUES.has(api_secret),
  );
};

const ensureCloudinaryConfigured = () => {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }
};

// Falls back to writing uploaded files to local disk (served via
// express.static("uploads")) when Cloudinary has no real credentials
// configured, so product image uploads still work in local development.
const uploadImagesToLocalDisk = (
  files: Express.Multer.File[],
  subfolder?: string,
) => {
  const targetDir = path.join(process.cwd(), "uploads", subfolder || "");
  fs.mkdirSync(targetDir, { recursive: true });

  return files.map((file) => {
    const ext = path.extname(file.originalname) || "";
    const filename = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}${ext}`;
    fs.writeFileSync(path.join(targetDir, filename), file.buffer);
    const urlSubfolder = subfolder ? `/${subfolder}` : "";
    return `/uploads${urlSubfolder}/${filename}`;
  });
};

export const uploadImageToCloudinary = async (
  file: Express.Multer.File,
  folder?: string,
) => {
  if (!isCloudinaryConfigured()) {
    return uploadImagesToLocalDisk([file], folder)[0];
  }

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: getCloudinaryFolder(folder),
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        return resolve(result.secure_url || result.url);
      },
    );

    uploadStream.end(file.buffer);
  });
};

export const uploadImagesToCloudinary = async (
  files: Express.Multer.File[],
  folder?: string,
) => {
  if (!files.length) {
    return [];
  }

  if (!isCloudinaryConfigured()) {
    return uploadImagesToLocalDisk(files, folder);
  }

  const uploads = files.map((file) => uploadImageToCloudinary(file, folder));
  return Promise.all(uploads);
};

export const uploadLocalFileToCloudinary = async (
  filePath: string,
  folder?: string,
) => {
  ensureCloudinaryConfigured();

  const result = await cloudinary.uploader.upload(filePath, {
    folder: getCloudinaryFolder(folder),
    resource_type: "image",
  });

  return result.secure_url || result.url;
};
