import express from "express";
import { querySql } from "../utils/dbTools.js";
import jsondata from "../utils/jsondata.js";

const router = express.Router();

const defaultOptions = {
  part: true,
  page: 1,
  size: 10,
};

async function getTotal() {
  const sql = "SELECT COUNT(*) AS `total` FROM `feedbacks`";
  const result = await querySql(sql);
  return result.length > 0 ? result[0].total : 0;
}

router.post("/feedbacks", async (req, res) => {
  const { part, page, size } = Object.assign(defaultOptions, req.body);
  const [offset, limit] = [(page - 1) * size, size];
  
  // 获取留言总数
  const total = await getTotal();
  let result;
  if (part) {
    // 如果是分段获取
    const sql = "SELECT `user_id`, `username`, `message`, `publish_time` FROM `feedbacks` ORDER BY `id` DESC LIMIT ?, ?";
    // 只能使用querySql方法，不能使用executeSql方法
    result = await querySql(sql, [offset, limit]);
  } else {
    // 如果是全部获取
    const sql = "SELECT `user_id`, `username`, `message`, `publish_time` FROM `feedbacks` ORDER BY `id` DESC";
    // 只能使用querySql方法，不能使用executeSql方法
    result = await querySql(sql);
  }

  result = {
    total,
    feedbacks: result,
  };

  res.json(jsondata("0000", "获取留言成功", result));
});

export default router;
