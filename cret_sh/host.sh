#!/bin/bash

# 配置参数
AUTH_KEY="your-auth-key"
WORKER_URL="https://your-worker.your-subdomain.workers.dev"
CERT_DIR="/cert"
OUTPUT_FILE="certs_.tar.gz"
ENCRYPT_KEY="your-encryption-key"


# 1. 压缩并加密
tar -czf - -C "$CERT_DIR" . | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 1000000 -pass pass:"$ENCRYPT_KEY" -out "$OUTPUT_FILE"

# 通知（可选）
NOTICE_URL="https://6069.push.ft07.com/send/sctp6069thjxbtce25kyxga7zjao9nk.send"

# 2. 上传

# 定义临时文件存储响应和错误
RESPONSE_FILE=$(mktemp)
ERROR_FILE=$(mktemp)
trap 'rm -f "$RESPONSE_FILE" "$ERROR_FILE"' EXIT

# 执行上传操作
HTTP_CODE=$(curl -X PUT -s -w "%{http_code}" \
  --data-binary @"$OUTPUT_FILE" \
  -H "X-Custom-Auth-Key: $AUTH_KEY" \
  -o "$RESPONSE_FILE" \
  "$WORKER_URL/$OUTPUT_FILE" 2>"$ERROR_FILE")
CURL_EXIT=$?

# 判断失败条件
if [[ $CURL_EXIT -ne 0 || $HTTP_CODE -ge 400 ]]; then
    # 读取错误信息
    RESPONSE_BODY=$(<"$RESPONSE_FILE")
    CURL_ERROR=$(<"$ERROR_FILE")
    
    # 发送通知
    curl -G "$NOTICE_URL" \
         --data-urlencode "title=证书上传失败警报！" \
         --data-urlencode "desp=文件: $OUTPUT_FILE 上传失败，HTTP状态码: ${HTTP_CODE}，CURL错误: ${CURL_ERROR}，响应内容: ${RESPONSE_BODY}"
    
    exit 1
fi

# 清理临时文件
rm -f $OUTPUT_FILE
curl -G "$NOTICE_URL" \
     --data-urlencode "title=证书（已加密）上传成功！" \
     --data-urlencode "desp=地址：${WORKER_URL}/${OUTPUT_FILE}"
