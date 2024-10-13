// 检查数据是否为空，形参为数组
export function checkEmpty(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (!arr[i]) return false;
  }
  return true;
}

// 检查 account 是否符合手机号、邮箱、用户名格式
export function checkAccount(account) {
  // 检查 account 是否符合用户名格式
  if (checkUsername(account)) {
    return "username";
  }
  // 检查 account 是否符合手机号格式
  if (checkPhone(account)) {
    return "phone";
  }
  // 检查 account 是否符合邮箱格式
  if (checkEmail(account)) {
    return "email";
  }
  // 如果以上都不是，则返回false
  return false;
}

// 检查用户名是否符合要求
export function checkUsername(username) {
  // 用户名只能为字母、数字、下划线，且长度在 4-20 之间，且不能以数字和下划线开头
  const usernameRegex = /^[a-zA-Z]\w{3,19}$/;
  return usernameRegex.test(username);
}

// 检查手机号是否符合要求
export function checkPhone(phone) {
  // 手机号为11位数字
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 检查邮箱是否符合要求
export function checkEmail(email) {
  // 正则表达式用于匹配邮箱
  const emailRegex = /^[\w]+(\.[\w]+)*@[\w]+(\.[\w]{2,})+$/;
  return emailRegex.test(email);
}

// 检查密码是否符合要求
export function checkPassword(password) {
  // 密码为ASCII可见字符（除空格），长度6-15位
  const passwordRegex = /^[!-~]{6,15}$/;
  return passwordRegex.test(password);
}

// 检查图片验证码是否符合要求
export function checkCaptcha(code) {
  // 验证码为4位字母或数字
  const codeRegex = /^[a-zA-Z0-9]{4}$/;
  return codeRegex.test(code);
}

// 检查性别是否为男或女
export function checkGender(gender) {
  return ["female", "male"].includes(gender);
}

// ===============================================
// 以下是一些辅助函数
// 该方法的month参数是从1开始的，范围为1-12
function getLastDayOfMonth(year, month) {
  // 由于Date对象中月份是从0开始的，范围为0-11
  // 同时，设置日期为0，将自动转换为前一个月的最后一天
  const lastDay = new Date(year, month, 0);
  return lastDay.getDate(); // 返回这个月的最后一天
}

// value是否处于闭区间 [min, max]
function isBetween(value, min, max) {
  return min <= value && value <= max;
}

// 检查出生日期是否符合要求 yyyy-mm-dd 格式
export function checkBirthday(birthdayStr) {
  // 出生日期格式为yyyy-mm-dd
  const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!birthdayRegex.test(birthdayStr)) return false;

  // 判断月份和日期是否合法
  const [year, month, day] = [...birthdayStr.split("-")].map(Number);
  if (!isBetween(month, 1, 12)) return false;
  if (!isBetween(day, 1, getLastDayOfMonth(year, month - 1))) return false;

  // 出生日期不能大于当前日期
  const birthday = new Date(birthdayStr);
  if (birthday > new Date()) return false;

  return true;
}

// 从身份证号中获取出生日期
function getBirthdayFromIdCard(idCard) {
  const year = idCard.substring(6, 10);
  const month = idCard.substring(10, 12);
  const day = idCard.substring(12, 14);
  return `${year}-${month}-${day}`;
}

// 检查身份证号是否符合要求
export function checkIdCard(idCard) {
  // 身份证号为18位数字
  const idCardRegex = /^\d{17}[0-9Xx]$/;
  if (!idCardRegex.test(idCard)) return 1;

  // 校验出生日期
  const birthday = getBirthdayFromIdCard(idCard);
  if (!checkBirthday(birthday)) return 2;

  return 0;
}
