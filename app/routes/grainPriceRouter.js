// 粮食收购价格查询路由

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import jsondata from "../utils/jsondata.js";

const router = express.Router();

// 自定义__filename和__dirname, 因为type：module（使用ES模块），所以不能使用__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从json文件获取粮食收购价格数据
function getGrainPriceData() {
  const priceData = fs.readFileSync(path.resolve(__dirname, "../data/grainPrice.json"), "utf-8");
  return JSON.parse(priceData);
}

const priceData = getGrainPriceData();

// 获取全部日期
router.get("/grain/purchase/dates", (req, res) => {
  const dates = Object.keys(priceData);
  return res.json(jsondata("0000", "获取日期成功", dates));
});

// 获取最新日期及其粮食收购价
function getLatestGrainPrice() {
  const dates = Object.keys(priceData).sort();
  if (dates.length === 0) return null;
  const latestDate = dates[dates.length - 1];
  return { date: latestDate, price: priceData[latestDate] };
}

// 获取粮食收购价
router.get("/grain/purchase", (req, res) => {
  // 如果date为latest，则返回最新日期的收购价
  // 其他必须指定具体日期，如：2024-07-31
  const date = req.query?.date;
  if (!date) {
    return res.json(jsondata("1001", "日期参数不能为空", ""));
  }
  if (date === "latest") {
    // 获取日期及其收购价
    const latestPrice = getLatestGrainPrice();
    return res.json(jsondata("0000", "获取收购价成功", latestPrice));
  }
  // 根据日期获取收购价
  const price = priceData[date];
  if (!price) {
    return res.json(jsondata("1002", "日期参数错误", "日期格式错误 or 日期不存在"));
  }
  return res.json(jsondata("0000", "获取收购价成功", { date, price }));
});

export default router;
