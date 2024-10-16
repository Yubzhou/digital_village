import { executeSql } from "../../utils/dbTools.js";

// 初始化sharedVariable的lastEndTime的值
async function initLastEndTime() {
  const sql = "SELECT `end_time` FROM `volunteer_activities` WHERE `is_ended` = 0 ORDER BY `end_time` LIMIT 1";
  const result = await executeSql(sql);
  return result?.[0]?.end_time || null;
}

class Singleton {
  constructor(initData) {
    if (!Singleton.instance) {
      Singleton.instance = this;
      this.sharedVariable = { lastEndTime: initData };
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

  updateLastEndTime(timeStr) {
    if (!timeStr) return;
    // 解构获取当前存储的最后结束时间，并将其转换为时间戳
    const { lastEndTime } = this.sharedVariable;
    const newEndTime = new Date(timeStr).getTime();
    // 只有当新的结束时间早于当前存储的最后结束时间，或者当前没有存储时间时，才更新
    if (!lastEndTime || newEndTime < lastEndTime) {
      this.set({ lastEndTime: newEndTime });
    }
  }
}

// 异步创建单例实例
async function createSingletonInstance() {
  let initData = await initLastEndTime();
  // 如果initData为null，说明数据库中没有活动，则不设置lastEndTime
  // 如果initData不为null，则将其转换为时间戳格式
  initData && (initData = new Date(initData).getTime());
  return new Singleton(initData);
}

async function getSingletonInstance(params) {
  const singletonInstance = await createSingletonInstance();
  return singletonInstance;
}

// 立即执行异步函数以创建单例实例，并在创建完成后导出
export { getSingletonInstance, initLastEndTime };
