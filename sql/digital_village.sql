CREATE DATABASE IF NOT EXISTS `digital_village`;

USE `digital_village`;


# 用户表
CREATE TABLE IF NOT EXISTS `users`
(
    `user_id`              INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户id',
    `username`             VARCHAR(25) UNIQUE COMMENT '用户名',
    `phone_number`         VARCHAR(20) UNIQUE COMMENT '手机号',
    `email`                VARCHAR(255) UNIQUE COMMENT '邮箱',
    `hashed_password`      VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    `profile`              VARCHAR(255) COMMENT '用户上传的头像url，如果没有则使用默认头像',
    `created_at`           TIMESTAMP             DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`           TIMESTAMP             DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    `is_admin`             BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否为管理员',
    `has_new_notification` BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否有新的通知'
);

# ALTER TABLE `users`
#     ADD COLUMN `has_new_notification` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否有新的通知';


# 用户详情表
# CREATE TABLE IF NOT EXISTS `user_details`
# (
#     `user_id`     INT PRIMARY KEY COMMENT '用户id',
#     `nickname`    VARCHAR(50)  NOT NULL COMMENT '昵称',
#     `address`     VARCHAR(255) NULL DEFAULT '' COMMENT '地址',
#     `city`        VARCHAR(100) NULL DEFAULT '' COMMENT '城市',
#     `province`    VARCHAR(100) NULL DEFAULT '' COMMENT '省',
#     `postal_code` VARCHAR(20)  NULL DEFAULT '' COMMENT '邮政编码',
#     `country`     VARCHAR(100) NULL DEFAULT '' COMMENT '国家',
#     `created_at`  TIMESTAMP         DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
#     `updated_at`  TIMESTAMP         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
#     FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE # 级联删除或修改
# );

# 定义触发器
# DELIMITER //
# CREATE TRIGGER `insert_user_details`
#     AFTER INSERT
#     ON `users`
#     FOR EACH ROW
# BEGIN
#     INSERT INTO `user_details` (`user_id`, `nickname`)
#     VALUES (NEW.user_id, CONCAT('用户', CAST(NEW.user_id AS CHAR)));
# END//
# DELIMITER ;


# refresh_tokens表结构
CREATE TABLE IF NOT EXISTS `refresh_tokens`
(
    `id`      INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键id',
    `user_id` INT UNIQUE COMMENT '用户id',
    `iat`     VARCHAR(20) COMMENT '签发时间/s',
    `exp`     VARCHAR(20) COMMENT '过期时间/s',
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE # 级联删除或更新
);


# 图片验证码
CREATE TABLE IF NOT EXISTS `captcha`
(
    `captcha_id`   INT AUTO_INCREMENT PRIMARY KEY COMMENT '会话ID',
    `captcha_code` CHAR(4) NOT NULL COMMENT '4位验证码'
);


# 新闻
CREATE TABLE IF NOT EXISTS `news`
(
    `news_id`       INT AUTO_INCREMENT PRIMARY KEY COMMENT '新闻ID',
    `news_title`    VARCHAR(255) NOT NULL COMMENT '新闻标题',
    `news_url`      VARCHAR(255) NOT NULL COMMENT '新闻链接',
    `news_date`     DATE         NOT NULL COMMENT '发布日期',
    `news_category` VARCHAR(25)  NOT NULL COMMENT '新闻类别'
);


# 留言反馈
CREATE TABLE IF NOT EXISTS `feedbacks`
(
    `id`           INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键',
    `user_id`      INT          NOT NULL COMMENT '用户id',
    `username`     VARCHAR(25)  NOT NULL COMMENT '用户名',
    `title`        VARCHAR(255) NOT NULL COMMENT '标题',
    `content`      TEXT         NOT NULL COMMENT '留言内容',
    `publish_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间'
);


# 问政
CREATE TABLE IF NOT EXISTS `e_participation`
(
    `id`           INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键',
    `user_id`      INT          NOT NULL COMMENT '用户id',
    `username`     VARCHAR(25)  NOT NULL COMMENT '用户名',
    `title`        VARCHAR(255) NOT NULL COMMENT '标题',
    `content`      TEXT         NOT NULL COMMENT '内容',
    `location`     VARCHAR(255) NOT NULL COMMENT '地址（省市区）',
    `address`      VARCHAR(255) NOT NULL COMMENT '详细地址（不包括省市区，只包括手动填写的详细地址）',
    `images`       TEXT         NOT NULL COMMENT '多张图片地址url（使用,分隔）',
    `status`       TINYINT  DEFAULT 0 COMMENT '文章状态：0为待回复，1为已回复',
    `reply`        TEXT COMMENT '回复内容',
    `reply_time`   DATETIME COMMENT '回复时间',
    `publish_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间'
);


# 投票表
CREATE TABLE IF NOT EXISTS `vote_info`
(
    `id`               INT          NOT NULL AUTO_INCREMENT COMMENT '自增键',
    `candidate_id`     INT          NOT NULL COMMENT '候选人id，只能确保在某场活动中的唯一性',
    `candidate_name`   VARCHAR(255) NOT NULL COMMENT '候选人姓名',
    `vote_activity_id` INT          NOT NULL COMMENT '投票活动id，表示是哪场活动',
    `vote_count`       INT          NOT NULL DEFAULT 0 COMMENT '获得的投票数量',
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_candidate_activity` (`candidate_id`, `vote_activity_id`)
);

# 记录投票活动信息
CREATE TABLE IF NOT EXISTS `vote_activities`
(
    `activity_id`   INT          NOT NULL AUTO_INCREMENT COMMENT '投票活动id',
    `activity_name` VARCHAR(255) NOT NULL COMMENT '投票活动名字',
    `description`   TEXT         NOT NULL COMMENT '投票活动的描述',
    `start_time`    DATETIME     NOT NULL COMMENT '开始时间',
    `end_time`      DATETIME     NOT NULL COMMENT '结束时间',
    `is_ended`      BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '活动是否结束，默认未结束',
    PRIMARY KEY (`activity_id`)
);

# 记录用户投票活动的表
CREATE TABLE IF NOT EXISTS `user_vote_records`
(
    `record_id`        INT AUTO_INCREMENT PRIMARY KEY,
    `user_id`          INT NOT NULL COMMENT '用户id',
    `vote_activity_id` INT NOT NULL COMMENT '投票活动id',
    UNIQUE KEY `unique_user_vote` (`user_id`, `vote_activity_id`)
);


# 记录消息通知
CREATE TABLE IF NOT EXISTS `notifications`
(
    `id`                INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键',
    `user_id`           INT          NOT NULL COMMENT '用户id',
    `notification_type` TINYINT      NOT NULL COMMENT '通知类型，比如是问政回复的通知',
    `item_id`           INT          NOT NULL COMMENT '具体类型的id，比如是哪篇问政文章的id',
    `title`             VARCHAR(25)  NOT NULL COMMENT '通知标题',
    `message`           VARCHAR(255) NOT NULL COMMENT '通知消息，如：你的xx问政已回复',
    `time`              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通知时间',
    `is_read`           BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否已读'
);

-- SELECT uv.vote_activity_id AS activity_id,
--        COUNT(*)            AS total_votes
-- FROM user_vote_records uv
--          INNER JOIN
--      vote_activities va ON uv.vote_activity_id = va.activity_id
-- WHERE va.is_ended = 1
-- GROUP BY uv.vote_activity_id;

