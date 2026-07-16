# import json

# # 读取 Markdown 文件内容
# with open('input.md', 'r', encoding='utf-8') as file:
#     content = file.read()

# # 定义正则表达式模式来匹配每个问题条目
# import re
# pattern = r'- "id": (\d+),\s+- "question": "([^"]+)",\s+- "answer": "([^"]+)",\s+- "keyword": "([^"]+)",\s+- "frequency": (\d+),\s+- "top": (\w+)'
# matches = re.findall(pattern, content)

# data = []
# for match in matches:
#     entry = {
#         "id": int(match[0]),
#         "question": match[1],
#         "answer": match[2],
#         "keyword": match[3],
#         "frequency": int(match[4]),
#         "top": match[5].lower() == 'true'
#     }
#     data.append(entry)

# # 将数据保存为 JSON 文件
# with open('input.json', 'w', encoding='utf-8') as json_file:
#     json.dump(data, json_file, indent=2, ensure_ascii=False)



# import json
# import re

# # 读取 Markdown 文件内容
# with open('input.md', 'r', encoding='utf-8') as file:
#     content = file.read()

# # 定义正则表达式模式来匹配每个问题条目
# entry_pattern = r'- "id": (\d+),\s+- "question": "([^"]+)",\s+- "answer":([\s\S]*?)- "keyword": "([^"]+)",\s+- "frequency": (\d+),\s+- "top": (\w+)'
# entries = re.findall(entry_pattern, content)

# data = []
# for entry in entries:
#     id_num = int(entry[0])
#     question = entry[1]
#     answer_md = entry[2].strip()
#     keyword = entry[3]
#     frequency = int(entry[4])
#     top = entry[5].lower() == 'true'

#     # 处理 answer 中的 Markdown 列表
#     if answer_md.startswith('- '):
#         lines = answer_md.splitlines()
#         list_items = []
#         for line in lines:
#             if line.strip().startswith('- '):
#                 item = line.strip()[2:]
#                 list_items.append(item)
#         answer_html = '<ol>'
#         for item in list_items:
#             answer_html += f'<li>{item}</li>'
#         answer_html += '</ol>'
#     else:
#         # 移除首尾引号
#         answer_html = answer_md.strip('"')

#     entry_data = {
#         "id": id_num,
#         "question": question,
#         "answer": answer_html,
#         "keyword": keyword,
#         "frequency": frequency,
#         "top": top
#     }
#     data.append(entry_data)

# # 将数据保存为 JSON 文件
# with open('input3.json', 'w', encoding='utf-8') as json_file:
#     json.dump(data, json_file, indent=2, ensure_ascii=False)




# import json
# import re

# # 读取 Markdown 文件内容
# with open('input.md', 'r', encoding='utf-8') as file:
#     content = file.read()

# # 定义正则表达式模式来匹配每个问题条目
# entry_pattern = r'- "id": (\d+),\s+- "question": "([^"]+)",\s+- "answer":([\s\S]*?)- "keyword": "([^"]+)",\s+- "frequency": (\d+),\s+- "top": (\w+)'
# entries = re.findall(entry_pattern, content)

# data = []
# for entry in entries:
#     id_num = int(entry[0])
#     question = entry[1]
#     answer_md = entry[2].strip()
#     keyword = entry[3]
#     frequency = int(entry[4])
#     top = entry[5].lower() == 'true'

#     # 处理 Markdown 加粗格式为 HTML 标签
#     answer_md = re.sub(r'\*\*([^\*]+)\*\*', r'<strong>\1</strong>', answer_md)

#     # 处理 answer 中的 Markdown 列表
#     if answer_md.startswith('- '):
#         lines = answer_md.splitlines()
#         list_items = []
#         for line in lines:
#             if line.strip().startswith('- '):
#                 item = line.strip()[2:]
#                 list_items.append(item)
#         answer_html = '<ol>'
#         for item in list_items:
#             answer_html += f'<li>{item}</li>'
#         answer_html += '</ol>'
#     else:
#         # 移除首尾引号
#         answer_html = answer_md.strip('"')

#     entry_data = {
#         "id": id_num,
#         "question": question,
#         "answer": answer_html,
#         "keyword": keyword,
#         "frequency": frequency,
#         "top": top
#     }
#     data.append(entry_data)

# # 将数据保存为 JSON 文件
# with open('output.json', 'w', encoding='utf-8') as json_file:
#     json.dump(data, json_file, indent=2, ensure_ascii=False)



import json
import re

# 读取 Markdown 文件内容
with open('input.md', 'r', encoding='utf-8') as file:
    content = file.read()

# 定义正则表达式模式来匹配每个问题条目
entry_pattern = r'- "id": (\d+),\s+- "question": "([^"]+)",\s+- "answer":([\s\S]*?)- "keyword": "([^"]+)",\s+- "frequency": (\d+),\s+- "top": (\w+)'
entries = re.findall(entry_pattern, content)

data = []
for entry in entries:
    id_num = int(entry[0])
    question = entry[1]
    answer_md = entry[2].strip()
    keyword = entry[3]
    frequency = int(entry[4])
    top = entry[5].lower() == 'true'

    # 处理 Markdown 加粗格式为 HTML 标签
    answer_md = re.sub(r'\*\*([^\*]+)\*\*', r'<strong>\1</strong>', answer_md)
    # 处理 Markdown 斜体格式为 HTML 标签
    answer_md = re.sub(r'\*([^\*]+)\*', r'<em>\1</em>', answer_md)
    # 处理 Markdown 链接格式为 HTML 标签
    answer_md = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<a href="\2">\1</a>', answer_md)
    # 处理 Markdown 代码块格式为 HTML 标签
    answer_md = re.sub(r'`([^`]+)`', r'<code>\1</code>', answer_md)

    # 处理 answer 中的 Markdown 列表
    if answer_md.startswith('- '):
        lines = answer_md.splitlines()
        list_items = []
        for line in lines:
            if line.strip().startswith('- '):
                item = line.strip()[2:]
                list_items.append(item)
        answer_html = '<ol>'
        for item in list_items:
            answer_html += f'<li>{item}</li>'
        answer_html += '</ol>'
    else:
        # 移除首尾引号
        answer_html = answer_md.strip('"')

    entry_data = {
        "id": id_num,
        "question": question,
        "answer": answer_html,
        "keyword": keyword,
        "frequency": frequency,
        "top": top
    }
    data.append(entry_data)

# 将数据保存为 JSON 文件
with open('output.json', 'w', encoding='utf-8') as json_file:
    json.dump(data, json_file, indent=2, ensure_ascii=False)