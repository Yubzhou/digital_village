import express from "express";
import axios from "axios";
import KEYS from "../../config/keys.js";
import jsondata from "../../utils/jsondata.js";

const router = express.Router();

router.get("/weather/district", async (req, res) => {
  try {
    let { keywords, subdistrict, offset } = req.query;
    if (!keywords) {
      return res.status(400).json(jsondata("1001", "缺少参数 keywords", null));
    }
    subdistrict = subdistrict || 0; // 默认值为 0
    offset = offset || 10; // 默认值为 10
    const result = await axios.get("https://restapi.amap.com/v3/config/district", {
      params: {
        key: KEYS.AMAP_API_KEY, // 高德地图 API 密钥
        keywords, // 城市名称
        subdistrict, // 显示下级行政区层数
        offset, // 最外层返回数据个数
      },
    });
    if (result.status === 200) {
      return res.json(jsondata("0000", "获取行政区信息成功", result.data));
    }
    return res.status(500).json(jsondata("1002", "获取行政区信息失败", null));
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsondata("1003", `获取行政区信息失败：${error.message}`, null));
  }
});

router.get("/weather/weatherInfo", async (req, res) => {
  try {
    let { city, extensions, output } = req.query;
    if (!city) {
      return res.status(400).json(jsondata("1001", "缺少参数 city", null));
    }
    extensions = extensions || "base"; // 默认值为 base
    output = output || "JSON"; // 默认值为 JSON

    const result = await axios.get("https://restapi.amap.com/v3/weather/weatherInfo", {
      params: {
        key: KEYS.AMAP_API_KEY, // 高德地图 API 密钥
        city, // 城市的 adcode
        extensions, // 返回结果控制，默认只返回基本信息（base为只返回基本信息，all为返回全部信息）
        output, // 返回结果格式，默认JSON格式（JSON、XML）
      },
    });
    if (result.status === 200) {
      return res.json(jsondata("0000", "获取天气信息成功", result.data));
    }
    return res.status(500).json(jsondata("1002", "获取天气信息失败", null));
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsondata("1003", `获取天气信息失败：${error.message}`, null));
  }
});

// 导出路由
export default router;
