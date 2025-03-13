# 基于cloudflare workers和R2存储实现的文件服务器

用于存储个人文件，支持文件上传、下载、删除
支持凭据鉴权

## 可以通过接口使用，作为证书分发的中转站

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