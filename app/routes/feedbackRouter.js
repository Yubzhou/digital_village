import express from "express";
import { executeSql, querySql } from "../utils/dbTools.js";
import jsondata from "../utils/jsondata.js";
import adminAuthMiddleware from "../middlewares/adminAuthMiddleware.js";

const router = express.Router();

// 默认分页参数
const defaultOptions = {
  part: true,
  page: 1,
  size: 10,
};

// 获取留言总数
async function getTotal() {
  const sql = "SELECT COUNT(*) AS `total` FROM `feedbacks`";
  const result = await querySql(sql);
  return result.length > 0 ? result[0].total : 0;
}

// 批量获取留言，需要管理员权限
router.get("/feedbacks", adminAuthMiddleware, async (req, res) => {
  let { part, page, size } = Object.assign(defaultOptions, req.query);
  part = (part === "true");
  page = parseInt(page);
  size = parseInt(size);

  const [offset, limit] = [(page - 1) * size, size];

  // 获取留言总数
  const total = await getTotal();
  try {
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
      result = await executeSql(sql);
    }

    result = {
      total,
      feedbacks: result,
    };
    res.json(jsondata("0000", "获取留言成功", result));
  } catch (error) {
    return res.json(jsondata("0001", "获取留言失败", error));
  }
});

export default router;
