// 发布投票活动

import { executeSql } from "../../../utils/dbTools";

function publishActivity(sql, params) {
  const activity = {
    title: "活动标题",
    description: "活动描述",
    start_time: "2022-01-01 00:00:00",
    end_time: "2022-01-01 23:59:59",
    location: "活动地点",
    organizer: "活动组织者",
    participants: [],
    status: "未开始", // 未开始、进行中、已结束
    type: "投票", // 投票、竞赛、其他
    options: [
      {
        name: "选项1",
        votes: 0,
      },
      {
        name: "选项2",
        votes: 0,
      },
      {
        name: "选项3",
        votes: 0,
      },
    ],
  };
  console.log(activity);
}

publishActivity();
