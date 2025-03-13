#!/bin/bash

# 配置参数
WORKER_URL="https://your-worker.your-subdomain.workers.dev"
FILE_NAME="certs.tar.gz"
ENCRYPT_KEY="your-encryption-key"
CERT_DIR="/cert"

# 1. 下载
curl -o $FILE_NAME "$WORKER_URL/$FILE_NAME"

# 2. 解密并解压
openssl enc -d -aes-256-cbc -pass pass:$ENCRYPT_KEY -in $FILE_NAME | tar -xzf - -C /

# 3. 执行nginx重启和refresh脚本
# systemctl restart nginx
# ~/refresh.sh

# 清理临时文件
rm -f $FILE_NAME