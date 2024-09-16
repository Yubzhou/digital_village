// 活动封面上传路由，仅允许上传一张图片

import express from "express";
import getCustomImageUploadMiddleware from "../../middlewares/imageUploadMiddleware.js";

import { executeSql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";

const router = express.Router();

// 图片上传中间件, 限制上传图片数量为1张，大小不超过10M
const upload = getCustomImageUploadMiddleware("public/uploads/vote", 1, 1024 * 1024 * 10);

router.post("/upload/activity-cover", upload.single("cover"), (req, res) => {
  const { activityId } = req.body;
  const cover = req.file;
  // if (!cover) {
  //   return res.json(jsondata("1001", "上传图片失败", "上传的图片不存在 or 未选择图片"));
  // }
  let url = "";
  if (cover) {
    url = "/public/uploads/vote/" + cover.filename;
  }
  // console.log(url);

  // 保存图片路径到数据库
  const sql = `UPDATE activity SET cover =? WHERE id =?`;
});

export default router;
