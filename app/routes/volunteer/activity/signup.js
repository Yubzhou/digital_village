// 报名志愿活动

import { querySql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

/*
  调用存储过程的SQL语句，插入志愿者报名信息
  如果用户报名时间在该活动开始时间之后，则不允许报名
  如果该活动已满人，则不允许报名
  如果已报名参加过该活动，则不允许报名
  否则插入新的报名记录
  调用存储函数并获取返回值
*/
async function signupActivityHandler(params) {
  // 参数分别为：活动ID，志愿者ID，自我介绍
  const callFunction = "SELECT RegisterVolunteerActivity(?, ?, ?) AS status";
  try {
    const result = await querySql(callFunction, params);
    // console.log(result); // [ { status: 0 } ]
    // 返回状态码, 0表示成功，其他表示失败, 如果result?.[0]?.status为undefined or null，则返回-1
    return result?.[0]?.status ?? -1;
  } catch (error) {
    throw error;
  }
}

// 根据status生成不同提示信息
function generateMessage(status) {
  switch (status) {
    case 0:
      return ["0000", "报名成功", ""];
    case 1:
      return ["1001", "报名失败", "志愿活动已经开始，禁止报名"];
    case 2:
      return ["1002", "报名失败", "志愿活动已经结束，禁止报名"];
    case 3:
      return ["1003", "报名失败", "志愿活动人数已满，禁止报名"];
    case 4:
      return ["1004", "报名失败", "您已报名参加过该活动，请勿重复报名"];
    default:
      return ["1005", "报名失败", "未知错误"];
  }
}

async function signupActivity(req, res) {
  try {
    // 获取志愿者ID和活动ID
    const { id: activityID } = req.params;
    const { sub: userID } = req.auth;
    const { self_introduction } = req.body;
    // 向数据库插入数据
    const params = [activityID, userID, self_introduction];
    const status = await signupActivityHandler(params);
    const response = generateMessage(status);
    // console.log(status, response);
    return res.json(jsondata(...response));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1001", `服务器错误: ${error.message}`, error));
  }
}

export default signupActivity;
