## Express+TS+Mongoose+Redis

这是一个纯后端项目, 并不包含前端页面

#### 技术构成

开发语言: **Typescript**  
后端框架: **Express.js**  
数据库: **MongoDB**  
ORM: **Mongoose**  
基础权限管理: **admin 和 user 两种权限**  
参数校验方案: **Joi**  
接口限流方案: **基于 Redis 对 IP 进行限制**  
错误处理方案: **定制 HTTP ERROR**  
邮件通知方案: **阿里云邮件推送服务**  
缓存方案: **Redis + ioredis**

- redis 主要用在用户登录状态的维护, 至于博客以及评论的缓存, 暂未支持

身份验证方案+: **JWT(refresh + access) Token**

- 无感刷新 token 需要在前端做, 后端只实现接口

用户头像方案: **gravatar**

- 一个用户公共头像方案 [Gravatar 官网地址](https://gravatar.com/)

#### 基本模块

- [x] 用户模块
  - 用户管理
  - 头像使用`gavatar`
- [x] 文章模块

  - 文章管理
  - 文章标签管理(tag 或者 category)
  - 文章点赞管理

- [x] 评论模块
- [x] 标签模块
- [x] 友链模块
- [x] 用户留言模块
  - [x] 阿里云邮件服务通知

> 图片上传有多种方案, 服务器本地存储, 阿里云 OSS, 腾讯云 OSS, 七牛云等, 推荐用户使用图床更方便.

实现了博客的核心模块, 搭建了一个博客后台 Api 开发的基本框架, 如果有更多的 Entity, 可以基于此项目进行扩展.

### Todo

- [ ] 打赏模块
- [ ] 图片上传
- [ ] redis 缓存评论
- [ ] redis 缓存文章
- [ ] QQ 邮件服务通知

#### 使用须知

- 未提供 Docker 镜像
- 未提供 Docker Compose 部署支持
- 未提供 pm2 部署支持
- 本项目可以作为博客项目后台接口的学习样例, 生产环境使用并不成熟

#### 项目运行

测试开发需要在项目目录下新增一个`.env`文件, 文件内包含的环境变量和`.env.dev`中一样

```ini
PORT=4000  # 项目运行端口
MONGODB_URL=  # mongo数据库url, 如: mongodb://root:12345@localhost:27017/test?authSource=admin
ACCESS_TOKEN_SECRET=12345 # 签名 access_token 秘钥,生产环境请使用更长的字符, 24, 36字节等
REFRESH_TOKEN_SECRET=12345 # 签名 refresh_token 秘钥
REDIS_HOST=ali  # redis 服务器 host
REDIS_PWD=12345 # redis 服务器 密码, 如果如本地 redis, 未设置密码, 可以置空
REDIS_PORT=6379 # redis 端口, 可以默认不填
ALI_EMAIL_USER= # 阿里云邮件发送服务 账号, 具体参考阿里云文档
ALI_EMAIL_PASS= # 阿里云邮件发送服务 密码, 具体参考阿里云文档
```

[阿里云邮件发送 Node.js 示例文档](https://help.aliyun.com/zh/direct-mail/smtp-nodejs)

#### 接口清单

Todo
