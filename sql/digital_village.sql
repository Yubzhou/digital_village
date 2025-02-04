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
    `avatar`               VARCHAR(255) COMMENT '用户上传的头像url，如果没有则使用默认头像',
    `created_at`           TIMESTAMP             DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`           TIMESTAMP             DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    `is_admin`             BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否为管理员',
    `is_volunteer`         BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否注册为志愿者',
    `has_new_notification` BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否有新的通知'
);

# refresh_tokens表结构
CREATE TABLE IF NOT EXISTS `refresh_tokens`
(
    `id`      INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键id',
    `user_id` INT COMMENT '用户id',
    `iat`     VARCHAR(20) COMMENT '签发时间/s',
    `exp`     VARCHAR(20) COMMENT '过期时间/s',
    UNIQUE KEY `user_id_unique` (`user_id`) COMMENT '用户id唯一索引',
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE # 级联删除或更新
);

# 图片验证码
CREATE TABLE IF NOT EXISTS `captcha`
(
    `captcha_id`   INT AUTO_INCREMENT PRIMARY KEY COMMENT '会话ID',
    `captcha_code` CHAR(4) NOT NULL COMMENT '4位验证码',
    `update_time`  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
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
    `id`                INT          NOT NULL AUTO_INCREMENT COMMENT '自增键',
    `candidate_id`      INT          NOT NULL COMMENT '候选人id，只能确保在某场活动中的唯一性',
    `candidate_name`    VARCHAR(255) NOT NULL COMMENT '候选人姓名',
    `candidate_profile` VARCHAR(255) COMMENT '候选人的头像url，如果没有则使用默认头像',
    `vote_activity_id`  INT          NOT NULL COMMENT '投票活动id，表示是哪场活动',
    `vote_count`        INT          NOT NULL DEFAULT 0 COMMENT '获得的投票数量',
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_candidate_activity` (`candidate_id`, `vote_activity_id`),
    FOREIGN KEY (`vote_activity_id`) REFERENCES `vote_activities` (`activity_id`) ON DELETE CASCADE ON UPDATE CASCADE # 级联删除或更新
);


# 记录投票活动信息
CREATE TABLE IF NOT EXISTS `vote_activities`
(
    `activity_id`    INT          NOT NULL AUTO_INCREMENT COMMENT '投票活动id',
    `activity_name`  VARCHAR(255) NOT NULL COMMENT '投票活动名字',
    `description`    TEXT         NOT NULL COMMENT '投票活动的描述',
    `activity_cover` VARCHAR(255) COMMENT '用户上传的活动封面url，如果没有则使用默认封面',
    `start_time`     DATETIME     NOT NULL COMMENT '开始时间',
    `end_time`       DATETIME     NOT NULL COMMENT '结束时间',
    `is_ended`       BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '活动是否结束，默认未结束',
    PRIMARY KEY (`activity_id`)
);


# 记录用户投票活动的表
CREATE TABLE IF NOT EXISTS `user_vote_records`
(
    `record_id`        INT AUTO_INCREMENT PRIMARY KEY,
    `user_id`          INT      NOT NULL COMMENT '用户id',
    `vote_activity_id` INT      NOT NULL COMMENT '投票活动id',
    `vote_time`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '投票时间',
    UNIQUE KEY `unique_user_vote` (`user_id`, `vote_activity_id`),
    FOREIGN KEY (`vote_activity_id`) REFERENCES `vote_activities` (`activity_id`) ON DELETE CASCADE ON UPDATE CASCADE # 级联删除或更新
);


# 记录消息通知
CREATE TABLE IF NOT EXISTS `notifications`
(
    `id`                INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键',
    `user_id`           INT          NOT NULL COMMENT '用户id',
    `notification_type` TINYINT      NOT NULL COMMENT '通知类型，比如是问政回复的通知（目前1：问政回复，2：志愿活动报名审核结果）',
    `item_id`           INT          NOT NULL COMMENT '具体类型的id，比如是哪篇问政文章的id',
    `title`             VARCHAR(25)  NOT NULL COMMENT '通知标题',
    `message`           VARCHAR(255) NOT NULL COMMENT '通知消息，如：你的xx问政已回复',
    `time`              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通知时间',
    `is_read`           BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否已读',
    UNIQUE KEY `unique_notification_index` (`user_id`, `notification_type`, `item_id`)
);

# 志愿者信息表
CREATE TABLE IF NOT EXISTS `volunteers`
(
    `id`                  INT AUTO_INCREMENT COMMENT '自增键',
    `user_id`             INT         NOT NULL COMMENT '用户id',
    `phone_number`        CHAR(11)    NOT NULL COMMENT '联系电话',
    `real_name`           VARCHAR(50) NOT NULL COMMENT '志愿者真实姓名',
    `id_number`           CHAR(18)    NOT NULL COMMENT '证件号码（身份证）',
    `gender`              TINYINT(1)  NOT NULL COMMENT '性别（0表示女，1表示男）',
    `birth_date`          DATE        NOT NULL COMMENT '出生日期',
    `school_or_workplace` VARCHAR(255) COMMENT '学校/工作单位',
    `volunteer_number`    CHAR(18)    NOT NULL COMMENT '志愿者编号（与身份证长度相同，由后端使用算法生成）',
    `service_minutes`     INT         NOT NULL DEFAULT 0 COMMENT '服务时长（单位：分钟）',
    `registration_time`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册成为志愿者的时间',
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE, # 级联删除或更新
    UNIQUE KEY `user_id_unique` (`user_id`) COMMENT '用户id唯一性约束',
    UNIQUE KEY `volunteer_number_unique` (`volunteer_number`) COMMENT '志愿者编号唯一性约束'
) COMMENT ='志愿者信息表';


# 志愿活动表
CREATE TABLE IF NOT EXISTS `volunteer_activities`
(
    `activity_id`                INT          NOT NULL AUTO_INCREMENT COMMENT '志愿活动id',
    `activity_number`            CHAR(13)     NOT NULL COMMENT '志愿活动编号（由后端使用算法生成）',
    `activity_name`              VARCHAR(255) NOT NULL COMMENT '志愿活动名字',
    `activity_content`           TEXT         NOT NULL COMMENT '志愿活动内容',
    `activity_cover`             VARCHAR(255) COMMENT '用户上传的活动封面url，如果没有则使用默认封面',
    `activity_location`          VARCHAR(255) NOT NULL COMMENT '活动地点',
    `number_of_recruits`         INT COMMENT '计划志愿者招募人数',
    `current_number_of_recruits` INT          NOT NULL DEFAULT 0 COMMENT '当前已招募人数',
    `contact_name`               VARCHAR(50)  NOT NULL COMMENT '活动联系人姓名',
    `contact_phone`              CHAR(11)     NOT NULL COMMENT '联系人手机号',
    `start_time`                 DATETIME     NOT NULL COMMENT '开始时间',
    `end_time`                   DATETIME     NOT NULL COMMENT '结束时间',
    `publish_time`               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '志愿活动发布时间',
    `update_time`                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '志愿活动修改时间',
    `is_ended`                   BOOLEAN      NOT NULL DEFAULT FALSE COMMENT ' 活动是否结束，默认未结束 ',
    PRIMARY KEY (`activity_id`),
    UNIQUE KEY `activity_number_unique` (`activity_number`) COMMENT '活动编号唯一性约束'
) COMMENT '志愿活动表';


# 志愿活动报名表
CREATE TABLE IF NOT EXISTS `volunteer_activity_registration`
(
    `id`                INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键',
    `activity_id`       INT      NOT NULL COMMENT '志愿活动id',
    `user_id`           INT      NOT NULL COMMENT '用户id',
    `self_introduction` TEXT COMMENT '志愿者报名自我介绍',
    `registration_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    `status`            TINYINT  NOT NULL DEFAULT 1 COMMENT '1, 2, 3, 4, 5分别表示pending, approved, rejected, completed, incomplete',
    `comment`           TEXT COMMENT '管理员给志愿者此次活动的备注，比如设置status为incomplete的原因'
) COMMENT '志愿活动报名表';



-- 创建存储过程（报名志愿活动）
-- 如果用户报名时间在该活动开始时间之后，则不允许报名
-- 如果该活动已满人，则不允许报名
-- 如果已报名参加过该活动，则不允许报名
-- 否则插入新的报名记录
DELIMITER //
CREATE FUNCTION RegisterVolunteerActivity(
    act_id INT,
    u_id INT,
    intro TEXT
) RETURNS TINYINT
    DETERMINISTIC -- 确定性函数，返回值只依赖于输入参数
BEGIN
    DECLARE act_start_time DATETIME;
    DECLARE act_number_of_recruits INT;
    DECLARE act_current_number_of_recruits INT;
    DECLARE act_is_ended BOOLEAN;
    DECLARE status TINYINT DEFAULT 0;

    -- 获取活动信息
    SELECT `start_time`, `number_of_recruits`, `current_number_of_recruits`, `is_ended`
    INTO act_start_time, act_number_of_recruits, act_current_number_of_recruits, act_is_ended
    FROM `volunteer_activities`
    WHERE `activity_id` = act_id;

    -- 检查活动是否已经开始
    IF act_start_time <= NOW() THEN
        SET status = 1;
        RETURN status; -- 立即返回，并终止函数执行
    END IF;

    -- 检查活动是否已经结束（无论是手动结束还是时间过期）
    IF act_is_ended = 1 THEN
        SET status = 2;
        RETURN status; -- 立即返回，并终止函数执行
    END IF;

    -- 检查是否还有招募名额
    IF act_number_of_recruits IS NOT NULL AND act_current_number_of_recruits >= act_number_of_recruits THEN
        SET status = 3;
        RETURN status; -- 立即返回，并终止函数执行
    END IF;

    -- 检查志愿者是否已经报名此活动
    IF EXISTS (SELECT *
               FROM `volunteer_activity_registration`
               WHERE `activity_id` = act_id
                 AND `user_id` = u_id) THEN
        SET status = 4;
        RETURN status; -- 立即返回，并终止函数执行
    END IF;

    -- 插入新的报名记录
    INSERT INTO `volunteer_activity_registration` (activity_id, user_id, self_introduction)
    VALUES (act_id, u_id, intro);
    SET status = 0;

    RETURN status; -- 返回最终状态消息
END //
DELIMITER ;

-- SELECT RegisterVolunteerActivity(2, 3, '测试报名') AS status;


-- 创建存储过程（删除志愿活动）
-- 如果活动正在进行，则不允许删除
-- 否则删除活动记录
DELIMITER //
CREATE FUNCTION DeleteVolunteerActivity(
    act_id INT
) RETURNS TINYINT
    DETERMINISTIC -- 确定性函数，返回值只依赖于输入参数
BEGIN
    DECLARE act_start_time DATETIME;
    DECLARE act_end_time DATETIME;
    DECLARE status TINYINT DEFAULT 0;
    -- 获取活动信息
    SELECT `start_time`, `end_time`
    INTO act_start_time, act_end_time
    FROM `volunteer_activities`
    WHERE `activity_id` = act_id;

    -- 检查活动是否正在进行
    IF act_start_time <= NOW() AND act_end_time >= NOW() THEN
        SET status = 1;
        RETURN status; -- 如果活动正在进行，立即返回，并终止函数执行
    END IF;

    -- 如果活动不正在进行，允许删除活动记录
    DELETE FROM `volunteer_activities` WHERE `activity_id` = act_id;
    RETURN status; -- 返回最终状态消息
END //
DELIMITER ;

-- SELECT DeleteVolunteerActivity(3) AS status;