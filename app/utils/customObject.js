// // 自定义对象类
// class CustomObject {
//   constructor() {
//     this.data = {};
//   }

//   // 方法根据key获取属性值
//   get(key) {
//     return this.data[key] !== undefined ? this.data[key] : undefined;
//   }

//   // 方法根据key设置属性值
//   set(key, value) {
//     this.data[key] = value;
//   }

//   // 方法用于判断是否为自有属性
//   has(key) {
//     return this.data.hasOwnProperty(key);
//   }

//   // 方法用于获取属性值，如果不存在则返回默认值
//   getDefault(key, defaultValue) {
//     return this.has(key) ? this.get(key) : defaultValue;
//   }

//   // 方法用于删除属性值
//   delete(key) {
//     if (this.has(key)) {
//       delete this.data[key];
//       return true;
//     }
//     return false;
//   }
// }

class CustomObject {
  // 使用#前缀声明私有属性
  #data = {};

  constructor() {
    // 构造函数可以包含其他初始化代码
  }

  get(key) {
    return this.#data[key] !== undefined ? this.#data[key] : undefined;
  }

  set(key, value) {
    this.#data[key] = value;
  }

  has(key) {
    return this.#data.hasOwnProperty(key);
  }

  getDefault(key, defaultValue) {
    return this.has(key) ? this.get(key) : defaultValue;
  }

  delete(key) {
    if (this.has(key)) {
      delete this.#data[key];
      return true;
    }
    return false;
  }

  // 获取私有属性，普通的对象
  getNormalObject() {
    return { ...this.#data };
  }

  // 公共方法用于遍历，传入回调函数，同步方法
  async forEachAsync(callback) {
    for (const key in this.#data) {
      if (this.has(key)) {
        await callback(key, this.get(key));
      }
    }
  }
}
// 导出自定义对象类
export default CustomObject;
