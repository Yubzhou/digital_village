import express from "express";
import { executeSql } from "../utils/dbTools.js";
import jsondata from "../utils/jsondata.js";

const router = express.Router();

router.get("/news", async (req, res) => {
  const { category } = req.params;
  // 查询数据库获取新闻列表
  const sql = "SELECT `news_title`, `news_url`, `news_date` FROM `news` ORDER BY `news_id` LIMIT 30";
  const result = await executeSql(sql);
  const avgLength = Math.floor(result.length / 3);

  // 创建一个数组，包含三个数字，表示要创建的对象的键
  // const keys = ["政策", "政策解读", "农事指导"];
  const keys = ["policy", "interpretation", "guidance"];

  // 使用reduce方法，将keys数组与result数组进行配对，将result数组平均分为三个数组，并以键值对的形式存储在newsObj对象中
  const newsObj = keys.reduce((acc, key, index) => {
    acc[key] = result.slice(index * avgLength, (index + 1) * avgLength);
    return acc;
  }, {});

  // 返回新闻列表
  res.json(jsondata("0000", "获取新闻列表成功", newsObj));
});

export default router;
