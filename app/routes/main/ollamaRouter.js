import express from "express";
// 导入ollama库
import ollama from "ollama";

const router = express.Router();

const MODEL_NAME = "HuatuoGPT2-7B.Q4_K_S"; // 选择使用的模型
const KEEP_ALIVE_TIME = "1h"; // 设置模型在内存中保留的时间

// 路由处理流式大模型响应
router.post("/ollama/chat", async (req, res) => {
  const { messages } = req.body;
  try {
    // 设置stream为true以启用流式响应
    const response = await ollama.chat({
      model: MODEL_NAME,
      messages: messages,
      stream: true,
      keep_alive: KEEP_ALIVE_TIME,
    });
    // 设置响应头，响应普通文本，并启用流式传输
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    // 异步迭代器遍历模型的响应
    for await (const part of response) {
      // 将模型的响应部分发送到客户端
      res.write(part.message.content);
    }
  } catch (error) {
    // 发生错误时发送错误信息
    res.status(500).send(error.message);
  } finally {
    // 响应结束
    res.end();
  }
});

async function loadModel(modelName, keepAliveTime) {
  try {
    await ollama.chat({
      model: modelName,
      messages: [], // 空数组表示仅加载模型
      keep_alive: keepAliveTime, // 设置模型在内存中保留的时间
    });
    console.log(`Model "${modelName}" loaded successfully.`);
  } catch (error) {
    console.error(`Error loading model "${modelName}":${error.message}`);
  }
}

async function unloadModel(modelName) {
  try {
    await ollama.chat({
      model: modelName,
      messages: [], // 空数组表示仅卸载模型
      keep_alive: 0, // 设置为 0 表示立即卸载模型
    });
    console.log(`Model "${modelName}" unloaded successfully.`);
  } catch (error) {
    console.error(`Error unloading model "${modelName}":${error.message}`);
  }
}

async function unloadModels() {
  await unloadModel(MODEL_NAME);
}

// 获取当前运行中的模型列表
// await ollama.ps();

// 加载模型
loadModel(MODEL_NAME, KEEP_ALIVE_TIME);

export { router, unloadModels };
