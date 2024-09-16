// 上传用户头像接口，仅允许上传一张图片

import express from "express";
import getCustomImageUploadMiddleware from "../../middlewares/imageUploadMiddleware.js";

import { executeSql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";

const router = express.Router();

// 图片上传中间件, 限制上传图片数量为1张，大小不超过10M
const upload = getCustomImageUploadMiddleware("public/uploads/profile", 1, 1024 * 1024 * 10);

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
