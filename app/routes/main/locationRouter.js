// 根据经纬度获取位置信息（区级及其行政编码）

import express from "express";

// 导入获取经纬度的函数
import getDistrict from "../../utils/main/getLocation.js";
import jsondata from "../../utils/jsondata.js";

const router = express.Router();

// 根据经纬度获取位置信息，返回区级及其行政编码
router.get("/location", async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    const result = await getDistrict(longitude, latitude);
    if (!result) return res.json(jsondata("1002", "获取位置信息失败", ""));
    return res.json(jsondata("0000", "获取位置信息成功", result));
  } catch (error) {
    console.log(error);
    res.json(jsondata("1001", `获取位置信息失败：${error.message}`, error));
  }
});

// 导出路由
export default router;
