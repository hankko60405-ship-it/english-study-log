#!/usr/bin/env python3
"""更新「設計閱讀」的文章清單。

從幾本英文設計刊物的公開 RSS 讀取最新文章的「標題、連結、日期」，寫成 design-feed.js。
只存標題、連結與配圖的網址，不存文章內容，也不下載圖片；圖片由刊物的網站提供，閱讀時會連到原站。

用法（在這個資料夾裡執行）：
    python3 update_design.py
"""
import json
import re
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

# (名稱, RSS, 主題, 地區)　地區：jp = 日本，west = 歐美
FEEDS = [
    ("IDEA Magazine", "https://www.idea-mag.com/en/feed/", "日本平面設計與字體雜誌", "jp"),
    ("Gurafiku", "https://gurafiku.tumblr.com/rss", "日本平面設計海報檔案", "jp"),
    ("Spoon & Tamago", "https://www.spoon-tamago.com/category/graphic-design/feed/", "日本平面設計（英文）", "jp"),
    ("PRINT · Poster Design", "https://www.printmag.com/categories/poster-design/feed/", "海報設計", "west"),
    ("PRINT · Typography", "https://www.printmag.com/categories/typography/feed/", "字體與排印", "west"),
    ("Grafik", "https://www.grafik.net/feed", "平面設計", "west"),
    ("People of Print", "https://www.peopleofprint.com/feed/", "印刷與平面", "west"),
    ("Slanted", "https://slanted.de/feed/", "字體與編排", "west"),
    ("Mindsparkle Mag", "https://mindsparklemag.com/feed/", "品牌與平面", "west"),
    ("Typewolf", "https://www.typewolf.com/feed", "字體搭配", "west"),
    ("Creative Review", "https://www.creativereview.co.uk/feed/", "廣告與視覺文化", "west"),
    ("BP&O", "https://bpando.org/feed/", "品牌識別評論", "west"),
    ("Creative Boom", "https://www.creativeboom.com/feed/", "平面、插畫、品牌", "west"),
    ("Abduzeedo", "https://abduzeedo.com/rss.xml", "平面與視覺靈感", "west"),
]
PER_FEED = {'jp': 20, 'west': 5}
UA = "Mozilla/5.0 (feed-reader)"


def text(el, *names):
    for n in names:
        for child in el:
            if child.tag.split('}')[-1] == n:
                if n == 'link' and not (child.text or '').strip():
                    return child.attrib.get('href', '')
                return (child.text or '').strip()
    return ''


def parse_date(raw):
    if not raw:
        return ''
    try:
        return parsedate_to_datetime(raw).astimezone(timezone.utc).strftime('%Y-%m-%d')
    except Exception:
        m = re.match(r'(\d{4}-\d{2}-\d{2})', raw)
        return m.group(1) if m else ''


def image(it):
    """從 RSS 項目找配圖網址：media:content / media:thumbnail / enclosure / 內文第一張 <img>。"""
    for el in it.iter():
        tag = el.tag.split('}')[-1]
        u = el.attrib.get('url', '')
        if tag in ('content', 'thumbnail') and u.startswith('http') and (
                el.attrib.get('medium', 'image') == 'image' and not el.attrib.get('type', 'image').startswith(('video', 'audio'))):
            return u
        if tag == 'enclosure' and u.startswith('http') and el.attrib.get('type', '').startswith('image'):
            return u
    for el in it:
        if el.tag.split('}')[-1] in ('encoded', 'description', 'content', 'summary') and el.text:
            m = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', el.text)
            if m:
                return m.group(1).replace('&amp;', '&')
    return ''


def full_size(u):
    """WordPress 的縮圖網址結尾是 -寬x高，拿掉後就是原圖。"""
    return re.sub(r'-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp|gif))$', r'\1', u, flags=re.I)


def fetch(name, url, topic, region):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read()
    except Exception:
        # macOS 內建的 Python 有時沒有安裝憑證，改用系統的 curl
        raw = subprocess.run(["curl", "-sL", "-m", "25", "-A", UA, url], capture_output=True, check=True).stdout
    root = ET.fromstring(raw)
    items = [e for e in root.iter() if e.tag.split('}')[-1] in ('item', 'entry')]
    out = []
    for it in items:
        title = re.sub(r'\s+', ' ', text(it, 'title'))
        link = text(it, 'link')
        if not title or not link.startswith('http'):
            continue
        out.append({"source": name, "topic": topic, "region": region, "title": title, "link": link,
                    "date": parse_date(text(it, 'pubDate', 'published', 'updated', 'date')), "image": full_size(image(it))})
        if len(out) >= PER_FEED[region]:
            break
    return out


def main():
    here = Path(__file__).resolve().parent
    all_items, report = [], []
    for name, url, topic, region in FEEDS:
        try:
            got = fetch(name, url, topic, region)
            all_items += got
            report.append(f"{name}: {len(got)} 篇")
        except Exception as e:  # 單一來源失敗不影響其他來源
            report.append(f"{name}: 讀取失敗（{type(e).__name__}）")
    if not all_items:
        print("沒有讀到任何文章，保留原本的清單。\n" + "\n".join(report))
        sys.exit(1)
    # 各刊物輪流排列，避免同一本連續出現
    by = {}
    for x in all_items:
        by.setdefault(x["source"], []).append(x)
    mixed, i = [], 0
    while any(by.values()):
        for name in list(by):
            if by[name]:
                mixed.append(by[name].pop(0))
        i += 1
    data = {"updated": datetime.now().strftime('%Y-%m-%d'), "items": mixed}
    (here / "design-feed.js").write_text(
        "// 由 update_design.py 產生，請勿手動編輯\nwindow.DESIGN_FEED = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8")
    print(f"已更新 design-feed.js：共 {len(mixed)} 篇\n" + "\n".join(report))


if __name__ == "__main__":
    main()
