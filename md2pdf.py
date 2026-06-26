#!/usr/bin/env python3
import markdown
from weasyprint import HTML, CSS
import os
import re
import base64

README_PATH = '/workspace/README.md'
OUTPUT_PATH = '/workspace/亲子守护App文档.pdf'
SCREENSHOTS_DIR = '/workspace/parenting-guardian-h5/screenshots'

def image_to_base64(image_path):
    if not os.path.exists(image_path):
        return None
    ext = os.path.splitext(image_path)[1].lower()
    mime = 'image/png'
    if ext in ('.jpg', '.jpeg'):
        mime = 'image/jpeg'
    elif ext == '.gif':
        mime = 'image/gif'
    with open(image_path, 'rb') as f:
        data = base64.b64encode(f.read()).decode('utf-8')
    return f'data:{mime};base64,{data}'

def main():
    print('正在读取 README.md...')
    with open(README_PATH, 'r', encoding='utf-8') as f:
        md_content = f.read()

    print('正在替换图片路径为本地 base64...')
    pattern = r'!\[(.*?)\]\(https://raw\.githubusercontent\.com/killknight/parenting-guardian/master/parenting-guardian-h5/screenshots/(page-[^)]+\.png)\)'
    
    def replace_img(match):
        alt = match.group(1)
        filename = match.group(2)
        local_path = os.path.join(SCREENSHOTS_DIR, filename)
        b64 = image_to_base64(local_path)
        if b64:
            size_kb = os.path.getsize(local_path) / 1024
            print(f'  ✓ {filename} ({size_kb:.1f} KB)')
            return f'![{alt}]({b64})'
        else:
            print(f'  ✗ {filename} 不存在')
            return match.group(0)
    
    md_content = re.sub(pattern, replace_img, md_content)

    print('正在转换 Markdown 为 HTML...')
    html_content = markdown.markdown(md_content, extensions=[
        'tables',
        'fenced_code',
        'toc',
        'nl2br',
        'sane_lists'
    ])

    css = CSS(string='''
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: "Noto Sans CJK SC", "WenQuanYi Micro Hei", "Microsoft YaHei", sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            font-size: 24px;
            color: #1a1a1a;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 8px;
            margin-top: 30px;
        }
        h2 {
            font-size: 20px;
            color: #2d2d2d;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            margin-top: 25px;
        }
        h3 {
            font-size: 16px;
            color: #374151;
            margin-top: 20px;
        }
        h4 {
            font-size: 14px;
            color: #4B5563;
            margin-top: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        th, td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
        }
        th {
            background-color: #f3f4f6;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        img {
            max-width: 100%;
            height: auto;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
        }
        code {
            background-color: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-family: monospace;
        }
        pre {
            background-color: #1f2937;
            color: #e5e7eb;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 10px;
        }
        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        blockquote {
            border-left: 4px solid #4F46E5;
            padding-left: 15px;
            margin: 15px 0;
            color: #6b7280;
            background-color: #f9fafb;
            padding: 10px 15px;
            border-radius: 0 6px 6px 0;
        }
        ul, ol {
            padding-left: 25px;
        }
        li {
            margin: 5px 0;
        }
        a {
            color: #4F46E5;
            text-decoration: none;
        }
        hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 20px 0;
        }
        strong {
            color: #1f2937;
        }
    ''')

    full_html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>亲子守护App文档</title>
    </head>
    <body>
    {html_content}
    </body>
    </html>
    '''

    print('正在生成 PDF...')
    HTML(string=full_html).write_pdf(OUTPUT_PATH, stylesheets=[css])
    
    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f'✅ PDF 生成成功: {OUTPUT_PATH}')
    print(f'📄 文件大小: {size_kb:.2f} KB')

if __name__ == '__main__':
    main()