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

export { executeSql, querySql };
