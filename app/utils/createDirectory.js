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
let dirPath = './app/public/uploads/e-participation';
createDirectory(dirPath);