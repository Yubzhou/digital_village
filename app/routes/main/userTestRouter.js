import express from "express";
const router = express.Router();

import jsondata from "../../utils/jsondata.js";
import { executeSql, querySql } from "../../utils/dbTools.js";

// 成功响应码
const SUCCESS_MESSAGE = "0000";
// 服务器错误
const SERVER_ERROR = "5000";

// 数据库表名
const TABLE_NAME = "`user_test`";

// 获取用户信息
async function getUserById(id) {
  const sql = `SELECT * FROM ${TABLE_NAME} WHERE \`id\`=?`;
  const result = await executeSql(sql, [id]);
  return result;
}

// 查询所有用户信息
router.get("/users", async (req, res) => {
  const sql = `SELECT * FROM ${TABLE_NAME}`;
  try {
    const result = await executeSql(sql);
    return res.json(jsondata(SUCCESS_MESSAGE, "查询成功", result));
  } catch (error) {
    return res.status(500).json(jsondata(SERVER_ERROR, `服务器错误: ${error.message}`, error));
  }
});

// 查询单个用户信息
router.get("/users/:id(\\d+)", async (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM ${TABLE_NAME} WHERE \`id\`=?`;
  try {
    const result = await executeSql(sql, [id]);
    return res.json(jsondata(SUCCESS_MESSAGE, "查询成功", result));
  } catch (error) {
    return res.status(500).json(jsondata(SERVER_ERROR, `服务器错误: ${error.message}`, error));
  }
});

// 添加用户信息
router.post("/users", async (req, res) => {
  const { name, age, gender } = req.body;
  const sql = `INSERT INTO ${TABLE_NAME} (\`name\`, \`age\`, \`gender\`) VALUES (?, ?, ?)`;
  try {
    const result = await executeSql(sql, [name, age, gender]);
    const user = await getUserById(result.insertId);
    return res.json(jsondata(SUCCESS_MESSAGE, "添加成功", user));
  } catch (error) {
    return res.status(500).json(jsondata(SERVER_ERROR, `服务器错误: {error.message}`, error));
  }
});

// 更新用户信息
router.put("/users/:id(\\d+)", async (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE ${TABLE_NAME} SET ? WHERE \`id\`=?`;
  try {
    await querySql(sql, [req.body, id]);
    const user = await getUserById(id);
    return res.json(jsondata(SUCCESS_MESSAGE, "更新成功", user));
  } catch (error) {
    return res.status(500).json(jsondata(SERVER_ERROR, `服务器错误: ${error.message}`, error));
  }
});

// 部分更新用户信息
router.patch("/users/:id(\\d+)", async (req, res) => {
  const { id } = req.params;
  // console.log(req.body);
  const sql = `UPDATE ${TABLE_NAME} SET ? WHERE \`id\`= ?`;
  try {
    // 使用简便语法只能使用query方法
    await querySql(sql, [req.body, id]);
    const user = await getUserById(id);
    return res.json(jsondata(SUCCESS_MESSAGE, "更新成功", user));
  } catch (error) {
    return res.status(500).json(jsondata(SERVER_ERROR, `服务器错误: ${error.message}`, error));
  }
});

// 删除用户信息
router.delete("/users/:id(\\d+)", async (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM ${TABLE_NAME} WHERE \`id\`=?`;
  try {
    await executeSql(sql, [id]);
    return res.json(jsondata(SUCCESS_MESSAGE, "删除成功", null));
  } catch (error) {
    return res.status(500).json(jsondata(SERVER_ERROR, `服务器错误: ${error.message}`, error));
  }
});

// 导出路由
export default router;
