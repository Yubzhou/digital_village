import fs from 'fs';

function createDirectory(dir) {
  // 使用fs.mkdir递归创建目录
  fs.mkdir(dir, { recursive: true }, (err) => {
    if (err) {
      // 如果目录已存在，则忽略错误
      if (err.code === 'EEXIST') {
        console.log('Directory already exists:', dir);
      } else {
        // 其他错误打印出来
        console.error('Error creating directory:', err);
      }
    } else {
      // 目录创建成功
      console.log('Directory created:', dir);
    }
  });
}

// 定义要创建的目录路径
// 问政图片上传目录
let dirPath = './app/public/uploads/e-participation';
createDirectory(dirPath);
// 用户头像上传目录
dirPath = './app/public/uploads/avatar';
createDirectory(dirPath);
// 投票图片上传目录
dirPath = './app/public/uploads/vote';
createDirectory(dirPath);
// 志愿者模块上传目录
dirPath = './app/public/uploads/volunteer';
createDirectory(dirPath);