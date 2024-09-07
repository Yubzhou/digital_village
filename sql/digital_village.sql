CREATE DATABASE `digital_village`;

USE `digital_village`;


# 用户表
CREATE TABLE `users`
(
    `user_id`         INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户id',
    `username`        VARCHAR(25) UNIQUE COMMENT '用户名',
    `phone_number`    VARCHAR(20) UNIQUE COMMENT '手机号',
    `email`           VARCHAR(255) UNIQUE COMMENT '邮箱',
    `hashed_password` VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    `created_at`      TIMESTAMP             DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`      TIMESTAMP             DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    `is_admin`        BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否为管理员'
);


# 用户详情表
CREATE TABLE `user_details`
(
    `user_id`     INT PRIMARY KEY COMMENT '用户id',
    `nickname`    VARCHAR(50)  NOT NULL COMMENT '昵称',
    `address`     VARCHAR(255) NULL DEFAULT '' COMMENT '地址',
    `city`        VARCHAR(100) NULL DEFAULT '' COMMENT '城市',
    `province`    VARCHAR(100) NULL DEFAULT '' COMMENT '省',
    `postal_code` VARCHAR(20)  NULL DEFAULT '' COMMENT '邮政编码',
    `country`     VARCHAR(100) NULL DEFAULT '' COMMENT '国家',
    `created_at`  TIMESTAMP         DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  TIMESTAMP         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE # 级联删除或修改
);

# 定义触发器
DELIMITER //
CREATE TRIGGER `insert_user_details`
    AFTER INSERT
    ON `users`
    FOR EACH ROW
BEGIN
    INSERT INTO `user_details` (`user_id`, `nickname`)
    VALUES (NEW.user_id, CONCAT('用户', CAST(NEW.user_id AS CHAR)));
END//
DELIMITER ;


# refresh_tokens表结构
CREATE TABLE `refresh_tokens`
(
    `id`      INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键id',
    `user_id` INT UNIQUE COMMENT '用户id',
    `iat`     VARCHAR(20) COMMENT '签发时间/s',
    `exp`     VARCHAR(20) COMMENT '过期时间/s',
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE # 级联删除或更新
);


# 图片验证码
CREATE TABLE `captcha`
(
    `captcha_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '会话ID',
    `captcha_code`       CHAR(4) NOT NULL COMMENT '4位验证码'
);


# 新闻
CREATE TABLE `news`
(
    `news_id`       INT AUTO_INCREMENT PRIMARY KEY COMMENT '新闻ID',
    `news_title`    VARCHAR(255) NOT NULL COMMENT '新闻标题',
    `news_url`      VARCHAR(255) NOT NULL COMMENT '新闻链接',
    `news_date`     DATE         NOT NULL COMMENT '发布日期',
    `news_category` VARCHAR(25)  NOT NULL COMMENT '新闻类别'
);


# 留言反馈
CREATE TABLE `feedbacks`
(
    `id`           INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键',
    `user_id`      INT         NOT NULL COMMENT '用户id',
    `username`     VARCHAR(25) NOT NULL COMMENT '用户名',
    `message`      TEXT        NOT NULL COMMENT '留言内容',
    `publish_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间'
);


# 问政
CREATE TABLE `e_participation`
(
    `id`           INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键',
    `user_id`      INT          NOT NULL COMMENT '用户id',
    `username`     VARCHAR(25)  NOT NULL COMMENT '用户名',
    `title`        VARCHAR(255) NOT NULL COMMENT '标题',
    `content`      TEXT         NOT NULL COMMENT '内容',
    `location`     VARCHAR(255) NOT NULL COMMENT '地址',
    `address`      VARCHAR(255) NOT NULL COMMENT '详细地址（不包括省市区，只包括手动填写的详细地址）',
    `images`       TEXT         NOT NULL COMMENT '多张图片地址url（使用,分隔）',
    `status`       TINYINT  DEFAULT 1 COMMENT '文章状态：1为待回复，2为已回复',
    `publish_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间'
);



# UPDATE `captcha` SET `captcha_code`='sni7' WHERE `captcha_id` = 1;

DELETE FROM `e_participation` WHERE `id`=37 LIMIT 1;