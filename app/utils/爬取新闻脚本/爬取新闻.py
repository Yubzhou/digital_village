import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from mysql_tools import save_news_to_mysql


def crawl_news(category: str, baseurl: str) -> dict:
    r = requests.get(baseurl + 'index.htm')
    # 设置编码方式
    r.encoding = 'utf-8'

    bs = BeautifulSoup(r.text, 'lxml')
    lis = bs.select('ul.commonlist > li')

    result = {'category': category, 'news': []}
    for idx, li in enumerate(lis):
        if idx >= 10:
            break
        # print(li.a['href'], li.a.text, li.span.text)
        href, title, date = li.a['href'], li.a.text, li.span.text
        url = urljoin(baseurl, href)
        # print(url, title, date)
        result['news'].append({'title': title, 'url': url, 'date': date})

    return result


def save_news(categorys: list, baseurls: list) -> None:
    for i in range(3):
        result = crawl_news(categorys[i], baseurls[i])
        save_news_to_mysql(result)


def do_work():
    # 新闻类型
    categorys = ['政策', '政策解读', '农事指导']
    # url基地址
    baseurls = ['http://www.moa.gov.cn/gk/zcfg/qnhnzc/', 'http://www.moa.gov.cn/gk/zcjd/',
                'http://www.moa.gov.cn/gk/nszd_1/']
    save_news(categorys, baseurls)


if __name__ == '__main__':
    do_work()
