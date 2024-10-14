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
    `has_new_notification` BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否有新的通知'
);

# ALTER TABLE `users`
#     ADD COLUMN `has_new_notification` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否有新的通知';

-- ALTER TABLE `users`
--     CHANGE `profile` `avatar` VARCHAR(255) NULL COMMENT '用户上传的头像url，如果没有则使用默认头像';


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

-- ALTER TABLE `vote_info`
--     ADD `candidate_profile` VARCHAR(255) COMMENT '候选人的头像url，如果没有则使用默认头像' AFTER `candidate_name`;

# # 添加外键
# ALTER TABLE `vote_info`
#     ADD CONSTRAINT `fk_vote_activity1`
#         FOREIGN KEY (`vote_activity_id`)
#             REFERENCES `vote_activities` (`activity_id`)
#             ON DELETE CASCADE
#             ON UPDATE CASCADE;
#
# # 删除外键
# ALTER TABLE `vote_info`
#     DROP FOREIGN KEY `fk_vote_activity1`;


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

# 将`activity_cover`字段添加到`description`字段后面
# ALTER TABLE `vote_activities`
#     ADD `activity_cover` VARCHAR(255) COMMENT '用户上传的活动封面url，如果没有则使用默认封面' AFTER `description`;

# UPDATE `vote_activities`
# SET `is_ended` = 1
# WHERE `activity_id` IN (1, 2, 3);


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

ALTER TABLE `user_vote_records`
    ADD `vote_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '投票时间';

# 添加外键
# ALTER TABLE `user_vote_records`
#     ADD CONSTRAINT `fk_vote_activity2`
#         FOREIGN KEY (`vote_activity_id`)
#             REFERENCES `vote_activities` (`activity_id`)
#             ON DELETE CASCADE
#             ON UPDATE CASCADE;

# 统计已结束活动中每个活动的投票总数
-- SELECT uv.vote_activity_id AS activity_id,
--        COUNT(*)            AS total_votes
-- FROM user_vote_records uv
--          INNER JOIN
--      vote_activities va ON uv.vote_activity_id = va.activity_id
-- WHERE va.is_ended = 1
-- GROUP BY uv.vote_activity_id;


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
    `is_read`           BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否已读',
    UNIQUE KEY `unique_notification_index` (`user_id`, `notification_type`, `item_id`)
);

# 当组合唯一键冲突时，更新指定字段值
# INSERT INTO notifications (user_id, notification_type, item_id, title, message)
# VALUES (?, ?, ?, ?, ?)
# ON DUPLICATE KEY UPDATE title   = VALUES(title),
#                         message = VALUES(message),
#                         time    = CURRENT_TIMESTAMP(),
#                         is_read = FALSE;


# UPDATE `notifications`
# SET `is_read` = TRUE
# WHERE user_id = 3
#   AND `is_read` = FALSE;
#
# UPDATE `notifications`
# SET `is_read`= TRUE
# WHERE id = 2;


# 城市编码表
# CREATE TABLE IF NOT EXISTS `city_codes`
# (
#     `adcode`   INT PRIMARY KEY COMMENT '区域编码',
#     `name`     VARCHAR(255) COMMENT '名字'
# );


# # 医院信息表
# CREATE TABLE hospitals
# (
#     id                 INT AUTO_INCREMENT PRIMARY KEY, -- 唯一标识符
#     hospital_name      VARCHAR(255) NOT NULL,          -- 医院名称
#     province           VARCHAR(50)  NOT NULL,          -- 省份
#     city               VARCHAR(50)  NOT NULL,          -- 城市
#     hospital_level     TINYINT,                        -- 医院等级（31、32、33、21、22、23、11、12、13分别表示三级甲等、三级乙等、三级丙等、二级甲等、二级乙等、二级丙等、一级甲等、一级乙等、一级丙等）
#     expertise_diseases TEXT,                           -- 擅长病症，可能包含多个，用TEXT类型存储较长的文本
#     address            VARCHAR(255),                   -- 医院地址，可允许为空
#     phone_number       VARCHAR(255),                   -- 医院电话，可允许为空（多个电话用逗号分隔）
#     email              VARCHAR(255),                   -- 医院邮箱，可允许为空（多个邮箱用逗号分隔）
#     website            VARCHAR(255),                   -- 医院网站，可允许为空
#     INDEX (province),                                  -- 为省份字段创建索引，便于基于省份的查询
#     INDEX (city),                                      -- 为城市字段创建索引，便于基于城市的查询
#     INDEX (hospital_level)                             -- 为医院等级字段创建索引，便于基于等级的查询
# )


# 志愿者信息表
CREATE TABLE IF NOT EXISTS `volunteers`
(
    `volunteer_id`        INT          NOT NULL AUTO_INCREMENT COMMENT '志愿者ID（自增主键）',
    `phone_number`        CHAR(11)     NOT NULL COMMENT '联系电话（作为登录账号）',
    `hashed_password`     VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    `real_name`           VARCHAR(50)  NOT NULL COMMENT '志愿者真实姓名',
    `id_number`           CHAR(18)     NOT NULL COMMENT '证件号码（身份证）',
    `gender`              TINYINT(1)   NOT NULL COMMENT '性别（0表示女，1表示男）',
    `birth_date`          DATE         NOT NULL COMMENT '出生日期',
    `school_or_workplace` VARCHAR(255) COMMENT '学校/工作单位',
    `volunteer_number`    CHAR(18)     NOT NULL COMMENT '志愿者编号（与身份证长度相同，由后端使用算法生成）',
    `service_minutes`     INT          NOT NULL DEFAULT 0 COMMENT '服务时长（单位：分钟）',
    `registration_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    `is_admin`            BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '是否为管理员',
    PRIMARY KEY (`volunteer_id`),
    UNIQUE KEY `phone_number_unique` (`phone_number`) COMMENT '联系电话（账号）唯一性约束',
    UNIQUE KEY `volunteer_number_unique` (`volunteer_number`) COMMENT '志愿者编号唯一性约束'
) COMMENT ='志愿者信息表';

-- 将`service_hours`字段改为`service_minutes`
-- ALTER TABLE `volunteers`
--    CHANGE COLUMN `service_hours` `service_minutes` INT NOT NULL DEFAULT 0 COMMENT '服务时长（单位：分钟）';


# refresh_tokens_volunteers表结构 -志愿者账号表的
CREATE TABLE IF NOT EXISTS `refresh_tokens_volunteers`
(
    `id`           INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键id',
    `volunteer_id` INT COMMENT '志愿者id',
    `iat`          VARCHAR(20) COMMENT '签发时间/s',
    `exp`          VARCHAR(20) COMMENT '过期时间/s',
    UNIQUE KEY `volunteer_id_unique` (`volunteer_id`) COMMENT '用户id唯一索引',
    FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers` (`volunteer_id`) ON DELETE CASCADE ON UPDATE CASCADE # 级联删除或更新
);


# 志愿活动表
CREATE TABLE IF NOT EXISTS `volunteer_activities`
(
    `activity_id`       INT          NOT NULL AUTO_INCREMENT COMMENT '志愿活动id',
    `activity_name`     VARCHAR(255) NOT NULL COMMENT '志愿活动名字',
    `activity_content`  TEXT         NOT NULL COMMENT '志愿活动内容',
    `activity_cover`    VARCHAR(255) COMMENT '用户上传的活动封面url，如果没有则使用默认封面',
    `activity_location` VARCHAR(255) NOT NULL COMMENT '活动地点',
    `number_of_recuits` INT COMMENT '志愿者招募人数',
    `contact_name`      VARCHAR(50)  NOT NULL COMMENT '活动联系人姓名',
    `contact_phone`     CHAR(11)     NOT NULL COMMENT '联系人手机号',
    `start_time`        DATETIME     NOT NULL COMMENT '开始时间',
    `end_time`          DATETIME     NOT NULL COMMENT '结束时间',
    `publish_time`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '志愿活动发布时间',
    `update_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '志愿活动更新时间',
    `is_ended`          BOOLEAN      NOT NULL DEFAULT FALSE COMMENT ' 活动是否结束，默认未结束 ',
    PRIMARY KEY (`activity_id`)
) COMMENT '志愿活动表';

-- 添加update_time字段
-- ALTER TABLE `volunteer_activities`
--     ADD COLUMN `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '志愿活动更新时间';


# 志愿活动报名表
CREATE TABLE IF NOT EXISTS `volunteer_activity_registration`
(
    `id`                INT AUTO_INCREMENT PRIMARY KEY COMMENT '自增键',
    `activity_id`       INT          NOT NULL COMMENT '志愿者活动id',
    `user_id`           INT          NOT NULL COMMENT '用户id',
    `real_name`         VARCHAR(25)  NOT NULL COMMENT '真实姓名',
    `phone_number`      VARCHAR(20)  NOT NULL COMMENT '联系电话',
    `work_unit`         VARCHAR(255) NOT NULL COMMENT '工作单位',
    `registration_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    `status`            TINYINT      NOT NULL DEFAULT 1 COMMENT '1, 2, 3, 4, 5分别表示pending, approved, rejected, completed, incomplete',
    `comment`           TEXT COMMENT '管理员给志愿者此次活动的备注，比如设置status为incomplete的原因'
) COMMENT '志愿活动报名表';


--    CREATE TABLE IF NOT EXISTS `test`
--    (
--        id          INT,
--        name        VARCHAR(255),
--        update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
--    );
--
--    INSERT INTO test (id, name)
--    VALUES (1, 'test1');
--
--    UPDATE test
--    SET name = 'test2'
--    WHERE id = 1;
