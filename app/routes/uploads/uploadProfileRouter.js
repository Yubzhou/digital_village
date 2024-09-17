// 上传用户头像接口，仅允许上传一张图片

import express from "express";
import fs from "fs/promises";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import { executeSql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";

const router = express.Router();

// 自定义__filename和__dirname, 因为type：module（使用ES模块），所以不能使用__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 自定义上传文件存储配置
const dir = path.resolve(__dirname, "../../public/uploads/profile");
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

// 图片上传中间件, 限制上传图片数量为1张，大小不超过10M
const upload = multer({
  storage, // 存储位置
  fileFilter, // 限制上传文件类型
  limits: {
    // 限制上传文件大小 及 上传文件数量
    fileSize: 10 * 1024 * 1024, // 限制上传文件大小（10MB）, 单位：字节
    files: 1, // 限制上传文件数量
  },
});

// 异步删除文件
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log("文件删除成功");
  } catch (error) {
    console.log("文件删除失败: ", error.message);
  }
}

// 上传用户头像接口，仅允许上传一张图片, 且上传图片的name属性必须为profile
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

  // 删除原来的头像
  const user = await executeSql("SELECT `profile` FROM `users` WHERE `user_id` =?", [userID]);
  const oldProfile = user[0]?.profile;
  if (oldProfile) {
    // 获取原有图片的文件名
    const oldProfileFileName = oldProfile.split("/").pop();
    // 获取文件的绝对路径
    const oldFilePath = path.join(dir, oldProfileFileName);
    console.log("oldFilePath: ", oldFilePath);
    deleteFile(oldFilePath); // 异步删除文件
  } else {
    console.log("没有找到原有图片");
  }

  // 更新用户头像
  const sql = "UPDATE `users` SET `profile`=? WHERE `user_id`=?";
  try {
    const result = await executeSql(sql, [url, userID]);
    if (result.affectedRows === 0) {
      return res.json(jsondata("1002", "更新用户头像失败", "该用户不存在"));
    }
    return res.json(jsondata("0000", "更新用户头像成功", { profile: url }));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1003", `更新用户头像失败: ${error.message}`, error));
  }
});

export default router;
