// 检查数据是否为空，形参为数组
export function checkEmpty(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (!arr[i]) return false;
  }
  return true;
}

// 检查 account 是否符合手机号、邮箱、用户名格式
export function checkAccount(account) {
  // 手机号为11位数字
  const phoneRegex = /^1[3-9]\d{9}$/;
  // 正则表达式用于匹配邮箱
  const emailRegex = /^[\w]+(\.[\w]+)*@[\w]+(\.[\w])+$/;
  // 正则表达式用于匹配用户名
  // 用户名只能为字母、数字、下划线，且长度在 4-20 之间，且不能以数字和下划线开头
  const usernameRegex = /^[a-zA-Z]\w{3,19}$/;

  // 检查 account 是否符合手机号格式
  if (phoneRegex.test(account)) {
    return "phone";
  }
  // 检查 account 是否符合邮箱格式
  if (emailRegex.test(account)) {
    return "email";
  }
  // 检查 account 是否符合用户名格式
  if (usernameRegex.test(account)) {
    return "username";
  }
  // 如果以上都不是，则返回false
  return false;
}

// 检查密码是否符合要求
export function checkPassword(password) {
  // 密码为ASCII可见字符（除空格），长度6-15位
  const passwordRegex = /^[!-~]{6,15}$/;
  if (!passwordRegex.test(password)) {
    return false;
  }
  return true;
}

// 检查图片验证码是否符合要求
export function checkCaptcha(code) {
  // 验证码为4位字母或数字
  const codeRegex = /^[a-zA-Z0-9]{4}$/;
  if (!codeRegex.test(code)) {
    return false;
  }
  return true;
}
