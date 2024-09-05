function accountType(account) {
  // 正则表达式用于匹配手机号
  const phoneRegex = /^(\+?\d{1,4}[- ]?)?(\(?\d{1,3}\)?[- ]?)?[\d -]{6,14}\d$/;

  // 正则表达式用于匹配邮箱
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // 正则表达式用于匹配用户名
  // 用户名只能为字母、数字、下划线，且长度在 4-20 之间，且不能以数字和下划线开头
  const usernameRegex = /^[a-zA-Z]\w{3,19}$/;

  // 检查 account 是否符合手机号格式
  if (phoneRegex.test(account)) {
    return 'phone';
  }

  // 检查 account 是否符合邮箱格式
  if (emailRegex.test(account)) {
    return 'email';
  }

  // 检查 account 是否符合用户名格式
  if (usernameRegex.test(account)) {
    return 'username';
  }

  // 如果以上都不是，则返回无效
  return 'invalid';
}
export default accountType;