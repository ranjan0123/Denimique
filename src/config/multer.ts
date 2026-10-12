import multer from "multer";
import path from "path";

// Store files in memory so we can stream to Cloudinary
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// Single file upload
export const uploadSingle = upload.single("image");

// Multiple files upload (up to 10 images)
export const uploadMultiple = upload.array("images", 10);

// Product images upload (up to 5 images)
export const uploadProductImages = upload.array("images", 5);

// Blog featured image upload (single file: "file")
export const uploadBlogImage = upload.single("file");

// Hero images upload (allow "images" or "sliderImages")
export const uploadHeroImages = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "sliderImages", maxCount: 10 },
]);
