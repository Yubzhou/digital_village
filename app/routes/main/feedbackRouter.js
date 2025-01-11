import express from "express";
import { executeSql, querySql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";
import adminAuthMiddleware from "../../middlewares/adminAuthMiddleware.js";
import { getOptions } from "../../utils/paginationTools.js";

const router = express.Router();

// 获取留言总数
async function getTotal() {
  const sql = "SELECT COUNT(*) AS `total` FROM `feedbacks`";
  const result = await querySql(sql);
  return result.length > 0 ? result[0].total : 0;
}


// 批量获取留言，需要管理员权限
router.get("/feedbacks", adminAuthMiddleware, async (req, res) => {
  const { part, offset, limit } = getOptions(req.query);

  // 获取留言总数
  const total = await getTotal();
  try {
    let result;
    if (part) {
      // 如果是分段获取
      const sql = "SELECT `id`, `username`, `title`, `content`, `publish_time` FROM `feedbacks` ORDER BY `id` DESC LIMIT ?, ?";
      // LIMIT ?, ? 语法只能使用querySql方法，不能使用executeSql方法
      result = await querySql(sql, [offset, limit]);
    } else {
      // 如果是全部获取
      const sql = "SELECT `id`, `username`, `title`, `content`, `publish_time` FROM `feedbacks` ORDER BY `id` DESC";
      result = await executeSql(sql);
    }
    result = {
      total,
      feedbacks: result,
    };
    return res.json(jsondata("0000", "获取留言成功", result));
  } catch (error) {
    return res.json(jsondata("0001", `获取留言失败: ${error.message}`, error));
  }
});

// 发布新留言
router.post("/feedbacks", async (req, res) => {
  const { sub: userID, username } = req.auth;
  const { title, content } = req.body;

  const sql = "INSERT INTO `feedbacks` (`user_id`, `username`, `title`, `content`) VALUES (?,?,?,?)";
  try {
    const result = await executeSql(sql, [userID, username, title, content]);
    return res.json(jsondata("0000", "发布留言成功", result));
  } catch (error) {
    return res.json(jsondata("0001", `发布留言失败: ${error.message}`, error));
  }
});

export default router;
