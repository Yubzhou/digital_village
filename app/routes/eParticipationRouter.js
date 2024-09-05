// 网络问政路由
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
// 导入自定义模块
import { executeSql } from "../utils/dbTools.js";
import jsondata from "../utils/jsondata.js";

const router = express.Router();

// 自定义__filename和__dirname, 因为type：module（使用ES模块），所以不能使用__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "../public/uploads/e-participation"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + "-" + Math.random().toString(36).substring(2) + ext);
  },
});

function fileFilter(req, file, cb) {
  const isImage = file.mimetype.startsWith("image/");
  if (!isImage) return cb(new Error("Only image files are allowed."));
  cb(null, true);
}

const upload = multer({
  storage, // 存储位置
  fileFilter, // 限制上传文件类型
  limits: {
    // 限制上传文件大小 及 上传文件数量
    fileSize: 1024 * 1024 * 10, // 10MB
    files: 9, // 最多上传9个文件
  },
});

// 保存信息到MySQL数据库
async function saveInfoToMySQL(req, res, params) {
  const sql = "INSERT INTO e_participation (`username`, `title`, `content`, `location`, `address`, `images`) VALUES (?,?,?,?,?,?)";
  try {
    const result = await executeSql(sql, params);
    return result;
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

// array 表示接受多个文件，input name="pic"
router.post("/e-participation", upload.array("pic", 9), async (req, res) => {
  const { username, title, content, location, address } = req.body;
  // console.log(req.files);
  const images = req.files.map((file) => "/public/uploads/e-participation/" + file.filename).join(",");
  const params = [username, title, content, location, address, images];
  try {
    const result = await saveInfoToMySQL(req, res, params);
    return res.json(jsondata("0000", "提交成功", result));
  } catch (error) {
    console.log(error);
    return res.json(jsondata("1001", "提交失败", error));
  }
});

export default router;
