import express from "express";

const router = express.Router();

// 发布志愿者活动
router.post("/activity/publish", (req, res) => {
  res.send("发布志愿者活动");
});

// 编辑志愿者活动
router.patch("/activity/edit", (req, res) => {
  res.send("编辑志愿者活动");
});

// 志愿者活动列表
router.get("/activity/list", (req, res) => {
  res.send("志愿者活动列表");
});

// 志愿者活动详情
router.get("/activity/detail", (req, res) => {
  res.send("志愿者活动详情");
});

export default router;
