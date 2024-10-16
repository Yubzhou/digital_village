// 获取分页配置工具

import { executeSql, querySql } from "./dbTools.js";

// 筛选出对象非空属性，并返回一个新对象（只包含part、page、size属性）
function filterOptions(options) {
  if (!options) return {};
  const fields = ["part", "page", "size"];
  const newOptions = {};
  fields.forEach((field) => {
    if (options?.[field]) {
      newOptions[field] = options[field];
    }
  });
  return newOptions;
}

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
  const notNullOptions = filterOptions(options);
  let { part, page, size } = Object.assign(defaultOptions, notNullOptions);
  // console.log("getOptions", { part, page, size });

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

// 截取sql语句，从from开始截取全部
function subSql(baseSql) {
  // 找到'FROM'关键字的位置
  const idx = baseSql.toUpperCase().indexOf("FROM");
  // 检查'FROM'是否存在
  if (idx !== -1) {
    // 使用slice方法截取'FROM'及其后面的字符串
    return baseSql.slice(idx);
  } else {
    console.log('The SQL string does not contain "FROM".');
    return "";
  }
}

// 获取列表总数
async function getTotal(baseSql) {
  const sql = "SELECT COUNT(*) AS total " + subSql(baseSql);
  const result = await executeSql(sql);
  return result.length > 0 ? result[0].total : 0;
}

// 获取列表数据
async function getList(baseSql, options) {
  // 获取分页配置
  const { part, offset, limit } = getOptions(options);

  try {
    // 获取活动列表总数
    const total = await getTotal(baseSql);
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
