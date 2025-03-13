#!/bin/bash

# 配置参数
AUTH_KEY="your-auth-key"
WORKER_URL="https://your-worker.your-subdomain.workers.dev"
CERT_DIR="/cert"
OUTPUT_FILE="certs_.tar.gz"
ENCRYPT_KEY="your-encryption-key"

# 1. 压缩并加密
tar -czf - $CERT_DIR | openssl enc -aes-256-cbc -salt -pass pass:$ENCRYPT_KEY -out $OUTPUT_FILE

# 2. 上传
curl -X PUT "$WORKER_URL/$OUTPUT_FILE" --data-binary @$OUTPUT_FILE -H "X-Custom-Auth-Key: $AUTH_KEY"

# 清理临时文件
rm -f $OUTPUT_FILE