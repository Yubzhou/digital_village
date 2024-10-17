import { executeSql } from "../../utils/dbTools.js";

// 初始化sharedVariable的值
async function initSharedData() {
  const sql = "SELECT `activity_id`, `end_time` FROM `volunteer_activities` WHERE `is_ended` = 0 ORDER BY `end_time` LIMIT 1";
  const result = await executeSql(sql);
  return result?.[0] || { activity_id: null, end_time: null };
}

class Singleton {
  constructor(id, timestamp) {
    if (!Singleton.instance) {
      Singleton.instance = this;
      this.sharedVariable = { lastActivityId: id, lastEndTime: timestamp };
      console.log("单例实例创建成功: ", this);
    }
    return Singleton.instance;
  }

  set(value) {
    this.sharedVariable = value;
  }

  get() {
    return this.sharedVariable;
  }

  updateData(id, timeStr) {
    if (!id || !timeStr) return;
    // 解构获取当前存储的最后结束时间，并将其转换为时间戳
    const { lastEndTime } = this.sharedVariable;
    const newEndTime = new Date(timeStr).getTime();
    // 只有当新的结束时间早于当前存储的最后结束时间，或者当前没有存储时间时，才更新
    if (!lastEndTime || newEndTime < lastEndTime) {
      this.sharedVariable.lastActivityId = parseInt(id);
      this.sharedVariable.lastEndTime = newEndTime;
    }
  }
}

// 异步创建单例实例
async function createSingletonInstance() {
  const data = await initSharedData();
  // 如果data为null，说明数据库中没有活动，则不设置lastActivityId和lastEndTime
  // 如果data不为null，则设置lastActivityId，且将时间字符串转换为时间戳格式
  return new Singleton(data.activity_id, new Date(data.end_time).getTime());
}

async function getSingletonInstance(params) {
  const singletonInstance = await createSingletonInstance();
  return singletonInstance;
}

// 导出函数
export { getSingletonInstance, initSharedData };
