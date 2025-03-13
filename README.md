# 基于cloudflare workers和R2存储实现的文件服务器

用于存储个人文件，支持文件上传、下载、删除
支持凭据鉴权

## API
### 不需要鉴权
查看文件列表：
curl <https://your-worker.your-subdomain.workers.dev/>

下载文件：
curl <https://your-worker.your-subdomain.workers.dev/filename.txt>

### 需要鉴权
上传文件：
curl -X PUT <https://your-worker.your-subdomain.workers.dev/filename.txt>  --data-binary @filename.txt -H "X-Custom-Auth-Key: your-auth-key"


删除文件：
curl -X DELETE <https://your-worker.your-subdomain.workers.dev/filename.txt> -H "X-Custom-Auth-Key: your-auth-key"


## 示例：作为证书分发的中转站
如 服务器A用来申请证书，并通过此接口上传到cloudflare的R2存储：
```sh
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
```

服务器B定期从cloudflare下载证书，并重启依赖证书的应用
```sh
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
systemctl restart nginx # 可选
docker restart x-ui # 可选

# 清理临时文件
rm -f $FILE_NAME
```
