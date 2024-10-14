// 网络问政路由
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
// 导入自定义模块
import { executeSql, querySql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";
import adminAuthMiddleware from "../../middlewares/adminAuthMiddleware.js";
import { saveNotification } from "../../utils/main/notificationTools.js";
import { getOptions } from "../../utils/paginationTools.js";
// 导入配置文件
import { NOTIFICATION_TYPE } from "../../config/config.js";

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
  const sql = "INSERT INTO e_participation (`user_id`, `username`, `title`, `content`, `location`, `address`, `images`) VALUES (?,?,?,?,?,?,?)";
  try {
    const result = await executeSql(sql, params);
    return result;
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

// post提交多个问政信息, array 表示接受多个文件，input name="pic"
router.post("/e-participation/post", upload.array("pic", 9), async (req, res) => {
  // 获取当前用户id
  const { sub: userID, username } = req.auth;
  const { title, content, location, address } = req.body;
  // 如果未上传图片，则req.files为空数组
  const images = req.files.map((file) => "/public/uploads/e-participation/" + file.filename).join(",");
  // console.log(req.body);
  // console.log(req.files);
  const params = [userID, username, title, content, location, address, images];
  try {
    const result = await saveInfoToMySQL(req, res, params);
    return res.json(jsondata("0000", "提交成功", result));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1001", `提交失败: ${error.message}`, error));
  }
});

// ================================================================

// 获取数据库总问政文章总数
async function getTotal(queryCondition = "") {
  const sql = "SELECT COUNT(*) AS `total` FROM `e_participation`" + queryCondition;
  const result = await querySql(sql, []);
  return result.length > 0 ? result[0].total : 0;
}

// 批量获取问政信息列表
router.get("/e-participation/batch", async (req, res) => {
  const { part, offset, limit } = getOptions(req.query);

  // 获取问政总数
  const total = await getTotal();
  try {
    let result;
    if (part) {
      const sql = "SELECT `id`, `username`, `title`, `content`, `location`, `address`, `images`, `status`, `reply`, `publish_time`, `reply_time` FROM `e_participation` ORDER BY `id` DESC LIMIT ?, ?";
      result = await querySql(sql, [offset, limit]);
    } else {
      const sql = "SELECT `id`, `username`, `title`, `content`, `location`, `address`, `images`, `status`, `reply`, `publish_time`, `reply_time` FROM `e_participation` ORDER BY `id` DESC";
      result = await executeSql(sql);
    }

    result = {
      total,
      list: result,
    };
    return res.json(jsondata("0000", "获取成功", result));
  } catch (error) {
    return res.json(jsondata("1001", `获取失败: ${error.message}`, error));
  }
});

// 获取指定userID的问政信息
async function getArticleByUserID(userID, options) {
  const { part, offset, limit } = getOptions(options);

  // 获取问政总数
  const total = await getTotal(" WHERE `user_id`=" + userID);
  try {
    let result;
    if (part) {
      const sql =
        "SELECT `id`, `username`, `title`, `content`, `location`, `address`, `images`, `status`, `reply`, `publish_time`, `reply_time` FROM `e_participation` WHERE `user_id`=? ORDER BY `id` DESC LIMIT ?, ?";
      result = await querySql(sql, [userID, offset, limit]);
    } else {
      const sql =
        "SELECT `id`, `username`, `title`, `content`, `location`, `address`, `images`, `status`, `reply`, `publish_time`, `reply_time` FROM `e_participation` WHERE `user_id`=? ORDER BY `id` DESC";
      result = await executeSql(sql, [userID]);
    }
    return {
      total,
      list: result,
    };
  } catch (error) {
    throw error;
  }
}

// 获取用户自己发布的问政信息, 按最新发布时间排序
router.get("/e-participation/self", async (req, res) => {
  // 获取当前用户id
  const { sub: userID } = req.auth;
  try {
    const result = await getArticleByUserID(userID, req.query);
    return res.json(jsondata("0000", "获取成功", result));
  } catch (error) {
    return res.json(jsondata("1001", `获取失败: ${error.message}`, error));
  }
});

// 获取指定userID的问政信息，按最新发布时间排序，需要管理员权限
router.get("/e-participation/:userID(\\d+)", adminAuthMiddleware, async (req, res) => {
  // 获取问政用户id
  const { userID } = req.params;
  try {
    const result = await getArticleByUserID(userID, req.query);
    return res.json(jsondata("0000", "获取成功", result));
  } catch (error) {
    return res.json(jsondata("1001", `获取失败: ${error.message}`, error));
  }
});

// 获取问政文章详情
router.get("/e-participation/detail/:id(\\d+)", async (req, res) => {
  // 获取问政文章id
  const { id } = req.params;
  try {
    const sql = "SELECT `title`, `content`, `location`, `address`, `images`, `status`, `reply`, `publish_time`, `reply_time` FROM `e_participation` WHERE `id`=? LIMIT 1";
    const result = await querySql(sql, [id]);
    if (result.length === 0) {
      return res.json(jsondata("1002", "问政信息不存在。请检查id是否正确。", ""));
    }
    return res.json(jsondata("0000", "获取成功", result[0]));
  } catch (error) {
    return res.json(jsondata("1001", `获取失败: ${error.message}`, error));
  }
});

// 按status筛选问政信息，按最新发布时间排序，且status只能是0或1
router.get("/e-participation/filter/:status(0|1)", async (req, res) => {
  const { part, offset, limit } = getOptions(req.query);
  const { status } = req.params;
  console.log(status);

  // 获取总数
  const total = await getTotal(" WHERE `status`=" + status);
  try {
    let result;
    if (part) {
      const sql = "SELECT * FROM `e_participation` WHERE `status`=? ORDER BY `id` DESC LIMIT ?, ?";
      result = await querySql(sql, [status, offset, limit]);
    } else {
      const sql = "SELECT * FROM `e_participation` WHERE `status`=? ORDER BY `id` DESC";
      result = await executeSql(sql, [status]);
    }
    result = {
      total,
      list: result,
    };
    return res.json(jsondata("0000", "获取成功", result));
  } catch (error) {
    return res.json(jsondata("1001", `获取失败: ${error.message}`, error));
  }
});

// ================================================================

// 删除指定id的问政信息
router.delete("/e-participation/delete/:id(\\d+)", async (req, res) => {
  // 获取问政文章id
  const { id } = req.params;
  // 获取当前用户id，以及是否为管理员
  const { sub: userID, isAdmin } = req.auth;

  try {
    let result;
    if (isAdmin) {
      // 如果是管理员，则可以删除任意用户的问政信息
      const sql = "DELETE FROM `e_participation` WHERE `id`=? LIMIT 1";
      result = await executeSql(sql, [id]);
    } else {
      // 如果不是管理员，则只能删除自己的问政信息
      const sql = "DELETE FROM `e_participation` WHERE `id`=? AND `user_id`=? LIMIT 1";
      result = await executeSql(sql, [id, userID]);
    }
    if (result.affectedRows === 0) {
      return res.json(jsondata("1002", "删除失败，问政信息不存在。请检查id是否正确。", ""));
    }
    return res.json(jsondata("0000", "删除成功", ""));
  } catch (error) {
    return res.json(jsondata("1001", `删除失败: ${error.message}`, error));
  }
});

// ================================================================

// 回复问政信息，需要管理员权限
router.patch("/e-participation/reply", adminAuthMiddleware, async (req, res) => {
  // 获取问政文章id, 回复内容
  const { id, reply } = req.body;
  try {
    const sql = "UPDATE `e_participation` SET `reply`=?, `status`=?, `reply_time`=CURRENT_TIMESTAMP() WHERE `id`=? LIMIT 1";
    const result = await executeSql(sql, [reply, 1, id]);
    if (result.affectedRows === 0) {
      return res.json(jsondata("1002", "回复失败，问政信息不存在。请检查id是否正确。", ""));
    }
    // 查询用户ID，异步保存通知到数据库
    const sql2 = "SELECT `user_id` FROM `e_participation` WHERE `id`=? LIMIT 1";
    const result2 = await executeSql(sql2, [id]);
    const userID = result2[0].user_id;
    saveNotification(userID, NOTIFICATION_TYPE.E_PARTICIPATION, id);
    return res.json(jsondata("0000", "回复成功", ""));
  } catch (error) {
    return res.json(jsondata("1001", `回复失败: ${error.message}`, error));
  }
});

export default router;
