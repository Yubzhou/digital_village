// 审核报名信息

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

async function reviewSignUp(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (![2, 3].includes(status)) {
    return res.json(jsondata("1002", "审核失败", "请选择审核状态: 2-通过, 3-拒绝"));
  }
  const sql = "UPDATE `volunteer_activity_registration` SET `status` =? WHERE `id` =?";
  try {
    const result = await executeSql(sql, [id]);
    if (result.affectedRows === 0) {
      return res.json(jsondata("1002", "审核失败", "未找到该报名信息"));
    }
    return res.json(jsondata("0000", "审核成功", ""));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1001", `审核失败: ${error.message}`, error));
  }
}

export default reviewSignUp;
