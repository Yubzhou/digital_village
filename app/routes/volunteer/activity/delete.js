// 删除志愿活动

import { querySql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

// 根据status生成不同提示信息
function generateMessage(status) {
  switch (status) {
    case 0:
      return ["0000", "删除活动成功", ""];
    case 1:
      return ["1001", "删除活动失败", "志愿活动正在进行，禁止删除"];
    default:
      return ["1002", "删除活动失败", "未知错误"];
  }
}

/*
  调用存储函数的SQL语句，删除不处于正在进行的活动，即删除活动开始前和活动结束后的活动
  如果活动处于正在进行的状态，则不允许删除
  否则，调用存储函数DeleteVolunteerActivity(activityId)，删除指定活动
  调用存储函数并获取返回值
*/
async function deleteActivity(req, res) {
  const { id: activityId } = req.params;
  // 参数为活动id
  const callFunction = "SELECT DeleteVolunteerActivity(?) AS status";
  try {
    const result = await querySql(callFunction, [activityId]);
    // console.log(result); // [ { status: 0 } ]
    // 返回状态码, 0表示成功，其他表示失败, 如果result?.[0]?.status为undefined or null，则返回-1
    const status = result?.[0]?.status ?? -1;
    const response = generateMessage(status);
    return res.json(jsondata(...response));
  } catch (error) {
    return res.json(jsondata("1003", `服务器错误: ${error.message}`, error));
  }
}

export default deleteActivity;
