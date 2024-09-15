// 获取分页配置工具

// 根据配置获取查询方式（全部获取还是分页获取）
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

export default getOptions;