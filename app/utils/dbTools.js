import pool from "../config/dbConfig.js";

// 执行SQL语句
async function executeSql(sql, params) {
  try {
    const [result] = await pool.execute(sql, params || []);
    return result;
  } catch (error) {
    // console.error(`Error executing sql: ${error.message}`);
    throw error;
  }
}

// 执行SQL语句
async function querySql(sql, params) {
  try {
    const [result] = await pool.query(sql, params || []);
    return result;
  } catch (error) {
    // console.error(`Error executing sql: ${error.message}`);
    throw error;
  }
}

// 批量插入多条数据，data为[[[],[],[]]]格式
async function insertMany(sql, data) {
  let connection;
  try {
    // 获取连接
    connection = await pool.getConnection();
    // 开始事务
    await connection.beginTransaction();
    // 执行SQL语句
    const [result] = await connection.query(sql, data);
    // 提交事务
    await connection.commit();
    return result;
  } catch (error) {
    // 如果在事务过程中发生了错误，则回滚事务
    await connection.rollback();
    throw error;
  } finally {
    // 释放连接
    connection.release();
  }
}

// 返回一个连接对象
async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    // console.error(`Error getting connection: ${error.message}`);
    throw error;
  }
}

export { executeSql, querySql, insertMany, getConnection };
