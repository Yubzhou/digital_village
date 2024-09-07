// 网络问政路由
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
// 导入自定义模块
import { executeSql, querySql } from "../utils/dbTools.js";
import jsondata from "../utils/jsondata.js";
import adminAuthMiddleware from "../middlewares/adminAuthMiddleware.js";

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
  const { userID, username, title, content, location, address } = req.body;
  // console.log(req.body);
  // console.log(req.files);
  const images = req.files.map((file) => "/public/uploads/e-participation/" + file.filename).join(",");
  const params = [userID, username, title, content, location, address, images];
  try {
    const result = await saveInfoToMySQL(req, res, params);
    return res.json(jsondata("0000", "提交成功", result));
  } catch (error) {
    console.log(error);
    return res.json(jsondata("1001", "提交失败", error));
  }
});

// ================================================================

// 默认分页配置
const defaultOptions = {
  part: true,
  page: 1,
  size: 10,
};

// 获取数据库总问政文章总数
async function getTotal() {
  const sql = "SELECT COUNT(*) AS `total` FROM `e_participation`";
  const result = await querySql(sql);
  return result.length > 0 ? result[0].total : 0;
}

// 获取问政信息列表
router.get("/e-participation/all", adminAuthMiddleware, async (req, res) => {
  let { part, page, size } = Object.assign(defaultOptions, req.query);
  part = part === "true";
  page = parseInt(page);
  size = parseInt(size);
  const [offset, limit] = [(page - 1) * size, size];

  // 获取问政总数
  const total = await getTotal();
  try {
    let result;
    if (part) {
      const sql = "SELECT `id`, `username`, `title`, `content`, `location`, `address`, `images`, `status`, `publish_time` FROM `e_participation` ORDER BY `id` DESC LIMIT ?, ?";
      result = await querySql(sql, [offset, limit]);
    } else {
      const sql = "SELECT `id`, `username`, `title`, `content`, `location`, `address`, `images`, `status`, `publish_time` FROM `e_participation` ORDER BY `id` DESC";
      result = await querySql(sql);
    }

    result = {
      total,
      list: result,
    };
    return res.json(jsondata("0000", "获取成功", result));
  } catch (error) {
    return res.json(jsondata("1001", "获取失败", error));
  }
});

// 获取指定用户发布的问政信息, 按最新发布时间排序
router.get("/e-participation/self", async (req, res) => {
  // console.log(req.headers.authorization);
  // console.log(req.auth);
  // 获取当前用户id
  const { sub: userID } = req.auth;
  try {
    const sql = "SELECT `id`, `username`, `title`, `content`, `location`, `address`, `images`, `status`, `publish_time` FROM `e_participation` WHERE `user_id`=? ORDER BY `id` DESC";
    const result = await executeSql(sql, [userID]);
    return res.json(jsondata("0000", "获取成功", result));
  } catch (error) {
    return res.json(jsondata("1001", "获取失败", error));
  }
});

// 删除指定id的问政信息
router.delete("/e-participation/delete/:id", async (req, res) => {
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
      return res.json(jsondata("1002", "删除失败，问政信息不存在。请检查id是否正确。", ''));
    }
    return res.json(jsondata("0000", "删除成功"));
  } catch (error) {
    return res.json(jsondata("1001", "删除失败", error));
  }
});

export default router;
