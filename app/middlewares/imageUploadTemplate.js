import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// 自定义__filename和__dirname, 因为type：module（使用ES模块），所以不能使用__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 自定义上传文件存储配置
const dir = path.resolve(__dirname, "../../public/uploads");
console.log("图片上传目录：" + dir);

// 存储位置
const storage = multer.diskStorage({
  // 上传文件保存路径
  destination: function (req, file, cb) {
    cb(null, dir);
  },
  // 上传文件命名
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + "-" + Math.random().toString(36).substring(2) + ext);
  },
});

// 限制上传文件类型
function fileFilter(req, file, cb) {
  const isImage = file.mimetype.startsWith("image/");
  if (!isImage) return cb(new Error("Only image files are allowed."));
  cb(null, true);
}

// 上传文件中间件
const upload = multer({
  storage, // 存储位置
  fileFilter, // 限制上传文件类型
  limits: {
    // 限制上传文件大小 及 上传文件数量
    fileSize: 1024 * 1024, // 限制上传文件大小（1MB）, 单位：字节
    files: 1, // 限制上传文件数量
  },
});
