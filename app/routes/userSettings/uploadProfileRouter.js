import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import { executeSql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";

const router = express.Router();

// 自定义__filename和__dirname, 因为type：module（使用ES模块），所以不能使用__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "../../public/uploads/profile"));
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
    files: 1, // 最多上传1个文件
  },
});

// 上传用户头像接口，仅允许上传一张图片
router.post("/upload/profile", upload.single("profile"), async (req, res) => {
  // 获取用户ID
  const { sub: userID } = req.auth;
  // 获取上传的图片
  const profile = req.file;
  if (!profile) {
    return res.json(jsondata("1001", "上传图片失败", "上传的图片不存在 or 未选择图片"));
  }
  // console.log("profile: ", profile);
  const url = "/public/uploads/profile/" + profile.filename;
  // console.log(url);

  const sql = "UPDATE `users` SET `profile`=? WHERE `user_id`=?";
  try {
    const result = await executeSql(sql, [url, userID]);
    if (result.affectedRows === 0) {
      return res.json(jsondata("1002", "更新用户头像失败", ""));
    }
    return res.json(jsondata("0000", "更新用户头像成功", { profile: url }));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1003", `更新用户头像失败: ${error.message}`, error));
  }
});

export default router;
