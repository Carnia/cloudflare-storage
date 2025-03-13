# 基于cloudflare workers和R2存储实现的文件服务器

用于存储个人文件，支持文件上传、下载、删除
支持凭据鉴权
## 部署
1. 首先你得有cloudflare账号，并且开启R2存储
2. 在cloudflare新建一个worker，将此仓库的index.js拷贝进worker并部署
3. 在此worker的设置选项中内新建环境变量`AUTH_KEY_SECRET`，并设置一个你记得住的密码（用于网页或者接口鉴权，放在请求头`X-Custom-Auth-Key`里）
4. 在cloudflare新建一个R2存储桶，在worker中绑定此R2存储桶，并赋予此桶变量名`FILE_BUCKET`
5. 再次部署worker

此时在打开cloudflare给你的域名，就可以看到web管理界面。

同时还支持直接通过api上传、下载、删除。


## API
### 不需要鉴权
查看文件列表：
`curl <https://your-worker.your-subdomain.workers.dev/>`

下载文件：
`curl <https://your-worker.your-subdomain.workers.dev/filename.txt>`

### 需要鉴权
上传文件：
`curl -X PUT <https://your-worker.your-subdomain.workers.dev/filename.txt>  --data-binary @filename.txt -H "X-Custom-Auth-Key: your-auth-key"`


删除文件：
`curl -X DELETE <https://your-worker.your-subdomain.workers.dev/filename.txt> -H "X-Custom-Auth-Key: your-auth-key"`


## 示例：作为证书分发的中转站
如

**服务器A** 申请完证书，通过此接口将证书加密压缩后上传到cloudflare的R2存储：
```sh
#!/bin/bash

# 配置参数
AUTH_KEY="your-auth-key"
WORKER_URL="https://your-worker.your-subdomain.workers.dev"
CERT_DIR="/cert"
OUTPUT_FILE="certs.tar.gz"
ENCRYPT_KEY="your-encryption-key"

# 1. 压缩并加密
tar -czf - $CERT_DIR | openssl enc -aes-256-cbc -salt -pass pass:$ENCRYPT_KEY -out $OUTPUT_FILE

# 2. 上传
curl -X PUT "$WORKER_URL/$OUTPUT_FILE" --data-binary @$OUTPUT_FILE -H "X-Custom-Auth-Key: $AUTH_KEY"

# 清理临时文件
rm -f $OUTPUT_FILE
```

**服务器B** 定期从cloudflare下载证书，解密解压后，重启依赖证书的应用
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
