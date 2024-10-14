// 获取分页配置工具

import { executeSql, querySql } from "./dbTools.js";

// 根据配置获取查询方式（全部获取还是分页获取）
/*
  options参数结构如下：
  {
    part: true/false/字符串（字符串为true/false）, // 是否分页获取
    page: 页码,
    size: 每页数量
  }
*/
function getOptions(options) {
  // 默认分页配置
  const defaultOptions = {
    part: true,
    page: 1,
    size: 10,
  };
  let { part, page, size } = Object.assign(defaultOptions, options);
  // 如果part为字符串，则转为布尔值
  if (typeof part === "string") part = part.toLowerCase() === "true";
  if (part) {
    page = parseInt(page);
    size = parseInt(size);
    const [offset, limit] = [(page - 1) * size, size];
    return { part, offset, limit };
  } else {
    return { part };
  }
}

// 获取列表总数
async function getTotal(tableName) {
  const sql = "SELECT COUNT(*) AS total FROM `" + tableName + "`";
  const result = await executeSql(sql);
  return result.length > 0 ? result[0].total : 0;
}

// 获取列表数据
async function getList(baseSql, tableName, options) {
  // 获取分页配置
  const { part, offset, limit } = getOptions(options);

  try {
    // 获取活动列表总数
    const total = await getTotal(tableName);
    let result, sql;
    if (part) {
      // 如果是分页获取
      sql = baseSql + " LIMIT ?, ?";
      // LIMIT ?, ? 语法只能使用querySql方法，不能使用executeSql方法
      result = await querySql(sql, [offset, limit]);
    } else {
      // 如果是全部获取
      sql = baseSql;
      result = await executeSql(sql);
    }
    result = {
      total,
      list: result,
    };
    return result;
  } catch (error) {
    throw error;
  }
}

export { getOptions, getTotal, getList };
