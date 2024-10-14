// 活动图片上传路由

import express from "express";
import fs from "fs/promises";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";
import adminAuthMiddleware from "../../../middlewares/adminAuthMiddleware.js";

const router = express.Router();

// 自定义__filename和__dirname, 因为type：module（使用ES模块），所以不能使用__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 自定义上传文件存储配置
const dir = path.resolve(__dirname, "../../../public/uploads/vote");
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

// 限制上传文件
const regex = /^(cover|profile\d+)$/;
// 限制上传文件类型
function fileFilter(req, file, cb) {
  const isImage = file.mimetype.startsWith("image/");
  if (!isImage) return cb(new Error("Only image files are allowed."));
  // 检查文件fieldName是否包含cover或者profile
  regex.test(file.fieldname) ? cb(null, true) : cb(null, false);
}

// 图片上传中间件, 限制上传图片数量为1张，大小不超过10M
const upload = multer({
  storage, // 存储位置
  fileFilter, // 限制上传文件类型
  limits: {
    // 限制上传文件大小 及 上传文件数量
    fileSize: 10 * 1024 * 1024, // 限制上传文件大小（10MB）, 单位：字节
    // files: 1, // 限制上传文件数量
  },
});

/*
  cover {
    fieldname: 'cover',
    originalname: 'avatar3.png',
    encoding: '7bit',
    mimetype: 'image/png',
    destination: 'D:\\Codes\\vscode\\digital_village\\app\\public\\uploads\\vote',
    filename: 'cover-1726559771985-fjc0zuvc827.png',
    path: 'D:\\Codes\\vscode\\digital_village\\app\\public\\uploads\\vote\\cover-1726559771985-fjc0zuvc827.png',
    size: 53868
  }
*/

// 异步删除文件
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log("文件删除成功");
  } catch (error) {
    console.log("文件删除失败: ", error.message);
  }
}

// 保存图片路径到数据库
async function savePictureUrl(files, activityId) {
  // 保存活动封面
  const sql1 = "UPDATE `vote_activities` SET `activity_cover` =? WHERE `activity_id` =?";
  // 保存候选人头像
  const sql2 = "UPDATE `vote_info` SET `candidate_profile` =? WHERE `vote_activity_id` =? AND `candidate_id` =?";
  try {
    for (const file of files) {
      const { fieldname, filename } = file;
      const url = "/public/uploads/vote/" + filename;
      if (fieldname === "cover") {
        await executeSql(sql1, [url, activityId]);
      } else {
        const candidateId = parseInt(fieldname.replace("profile", ""));
        await executeSql(sql2, [url, activityId, candidateId]);
      }
    }
  } catch (error) {
    throw error;
  }
}

// 上传活动图片, 需要管理员权限
router.post("/upload/activity-picture", adminAuthMiddleware, upload.any(), async (req, res) => {
  const { activityId } = req.body;
  // console.log(req.files);
  if (!req.files || req.files.length === 0) {
    return res.json(jsondata("1001", "上传图片失败", "图片不能为空"));
  }

  try {
    // 保存图片路径到数据库
    await savePictureUrl(req.files, activityId);
    // 更新成功
    return res.json(jsondata("0000", "上传图片成功", ""));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1002", `上传图片失败: ${error.message}`, error));
  }
});

export default router;
