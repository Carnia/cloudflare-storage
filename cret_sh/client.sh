#!/bin/bash
#  自动注册crontab（每月1号凌晨2点运行）
CRON_JOB="0 2 1 * * $(realpath $0)"
(crontab -l 2>/dev/null | grep -v -F "$(realpath $0)"; echo "$CRON_JOB") | crontab -

# 配置参数
WORKER_URL="https://your-worker.your-subdomain.workers.dev"
FILE_NAME="certs.tar.gz"
ENCRYPT_KEY="your-encryption-key"
CERT_DIR="/cert"

# 通知（可选）
NOTICE_URL="https://4455.push.ft07.com/send/sctpxxxnk.send"

# 通知 定义临时文件存储响应和错误
RESPONSE_FILE=$(mktemp)
ERROR_FILE=$(mktemp)
trap 'rm -f "$RESPONSE_FILE" "$ERROR_FILE"' EXIT  # 退出时自动清理

# 1. 执行下载（不使用 -f 选项，手动处理HTTP状态码）
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$RESPONSE_FILE" "$WORKER_URL/$FILE_NAME" 2>"$ERROR_FILE")
CURL_EXIT=$?

# 判断失败条件：curl自身错误 或 HTTP状态码>=400
if [[ $CURL_EXIT -ne 0 || $HTTP_CODE -ge 400 ]]; then
    # 读取响应内容（可能是JSON）和错误信息
    RESPONSE_BODY=$(<"$RESPONSE_FILE")
    CURL_ERROR=$(<"$ERROR_FILE")
    
    # URL编码并发送通知（使用 --data-urlencode 自动处理编码）
    curl -G "$NOTICE_URL" \
         --data-urlencode "title=法国服务器证书文件下载失败!" \
         --data-urlencode "desp=- HTTP状态码: ${HTTP_CODE},  CURL错误信息: ${CURL_ERROR},  服务器响应: ${RESPONSE_BODY}"
    
    exit 1  # 终止脚本
else
    # 下载成功时移动响应文件到目标位置
    mv "$RESPONSE_FILE" "$FILE_NAME"
fi

# 2. 解密并解压
mkdir -p $CERT_DIR
openssl enc -d -aes-256-cbc -pbkdf2 -iter 1000000 -pass pass:"$ENCRYPT_KEY" -in "$FILE_NAME" | tar -xzf - -C $CERT_DIR

# 3. 执行nginx重启和refresh脚本
docker restart $(docker ps --format "{{.Names}}" | grep "^1Panel-openresty-")
docker restart x-ui

# 4. 清理临时文件
rm -f $FILE_NAME

# 可选 发送通知
curl -G "$NOTICE_URL" \
         --data-urlencode "title=法国服务器证书文件更新成功~" \
         --data-urlencode "desp=nginx,x-ui已重启"
