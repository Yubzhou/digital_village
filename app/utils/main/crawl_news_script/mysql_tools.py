import mysql.connector
from mysql.connector import Error


def connect_mysql() -> tuple:
    """
    连接MySQL
    :return: 返回连接对象 和 游标
    """
    try:
        # 创建 MySQL 连接
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="your password",
        )
        # 创建游标
        cursor = connection.cursor()
    except Error as e:
        print(f"error in function connect_mysql: \nError: {e}\n")
    else:
        print("info: 连接MySQL成功！")
        return connection, cursor


def create_database(cursor, database_name: str) -> None:
    """
    创建数据库
    :param cursor: 游标对象，用来执行语句
    :param database_name: 要创建的数据库名
    :return: None
    """
    try:
        # 创建数据库（如果不存在）
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name};")
    except Error as e:
        print(f"error in function create_database: \nError: {e}\n")
    else:
        print(f"info: 数据库 {database_name} 创建成功！")


def use_database(cursor, database_name: str) -> None:
    """
    使用数据库
    :param cursor: 游标对象，用来执行语句
    :param database_name: 要使用的数据库名
    :return: None
    """
    try:
        # 选择要使用的数据库
        cursor.execute(f"USE {database_name};")
    except Error as e:
        print(f"error in function use_database: \nError: {e}\n")
    else:
        print(f"info: 已切换到 {database_name} 数据库！")


def create_table(cursor, table_name: str, create_table_sql: str) -> None:
    """
    创建表
    :param cursor: 游标对象，用来执行语句
    :param table_name: 要创建的表名
    :param create_table_sql: 建表sql语句
    :return: None
    """
    try:
        # 在新选择的数据库中创建表
        cursor.execute(create_table_sql)
    except Error as e:
        print(f"error in function create_table: \nError: {e}\n")
    else:
        print(f"info: 表 {table_name} 创建成功！")




def insert_data_detail(cursor, insert_sql: str, data: dict) -> int:
    """
    插入数据详细操作
    :param cursor: 游标
    :param insert_sql: 插入的sql语句
    :param data: 待插入数据
    :return: 返回影响的行数
    """
    # 记录最终影响的行数
    rowcount = 0

    # 新闻类别
    category = data['category']

    # 批量插入数据
    for news in data['news']:
        row = (
            news['title'],
            news['url'],
            news['date'],
            category
        )
        try:
            cursor.execute(insert_sql, row)
            rowcount += 1
        except Error as e:
            print(f"error in function insert_data: \nError: {e}")
    return rowcount


def insert_data(connection, cursor, table_name: str, insert_sql: str, insert_function, data: dict | list) -> None:
    """
    插入数据
    :param connection: 连接数据库对象
    :param cursor: 游标对象，用来执行语句
    :param table_name: 待插入数据的表名
    :param insert_sql: 插入数据sql语句
    :param data: 待插入的数据
    :return: None
    """
    # 记录最终影响的行数
    rowcount = 0

    # 启用自动提交
    connection.autocommit = True
    # 批量插入数据
    rowcount = insert_function(cursor, insert_sql, data)
    # 关闭自动提交
    connection.autocommit = False

    # 打印受影响的行数
    if rowcount > 0:
        print(f"info: {rowcount} 条记录被成功插入表 {table_name} 中！")
    print()


def save_news_to_mysql(data_to_insert: dict) -> None:
    # 连接MySQL, 获取 连接和游标
    connection, cursor = connect_mysql()

    # 使用数据库
    database_name = "digital_village"
    use_database(cursor, database_name)

    # 待插入数据的表名
    table_name = "news"
    insert_sql = f"""
        INSERT INTO {table_name} (news_title, news_url, news_date, news_category)
        VALUES (%s, %s, %s, %s)
    """

    # 批量插入数据
    insert_data(connection, cursor, table_name, insert_sql, insert_data_detail, data_to_insert)

    # 关闭游标和连接
    cursor.close()
    connection.close()


# 使用__all__来指定哪些名称应该被导出
__all__ = ['save_news_to_mysql']
