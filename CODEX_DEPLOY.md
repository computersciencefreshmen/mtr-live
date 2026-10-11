# MTR Live：本地 Codex 部署任务

在解压后的 `mtr-live-vercel` 目录中执行。这个目录就是 GitHub 仓库根目录；不要把它作为额外的一层目录上传。

## 目标

将当前源码保存在用户电脑，上传至用户的公开 GitHub 仓库，并连接 Vercel 生产项目，提供稳定生产网址。后续向 `main` 推送应能触发 Vercel 部署。保留当前界面与实时数据逻辑，不重新设计网站。

预期 GitHub 账号：`computersciencefreshmen`。建议仓库名和 Vercel 项目名：`mtr-live`。实际 Vercel 域名由平台返回；不要在部署前承诺具体网址。

## 执行顺序

1. **检查目录和工具。** 确认 `package.json`、`app/`、`lib/`、`public/` 都在当前目录。使用 Node.js **24.x**、npm、Git、GitHub CLI 和 Vercel CLI。缺少工具时使用各平台官方安装方式；不要为了部署更改已锁定的框架版本。

2. **本地验证。** 执行：
   ```sh
   npm ci
   npm run typecheck
   node scripts/check-verified-arrivals.mjs
   npm run build
   npm start
   ```
   验证首页、手机选站、海洋公园、金钟两个组以及中英文切换。用真实网络请求验证：
   - `/api/next-train?line=SIL&sta=OCP`
   - 金钟的 `TWL`、`ISL`、`SIL`、`EAL` 四个 `sta=ADM` 接口
   正常服务时响应应为 HTTP 200、官方 `status=1`、来源时间有效且未超过 45 秒。若官方正处于非服务时段或没有预报，应如实记录，不能把它报告为“列车到站验证通过”。

3. **使用用户电脑上的授权。** 先检查 `gh auth status`、GitHub 当前账号和 `vercel whoami`。缺少登录时使用 `gh auth login` 或 `vercel login` 的官方浏览器登录，让用户在浏览器完成验证。不要要求用户把密码、验证码或 token 贴进聊天，也不要输出已有凭据。账号与预期不一致时先核实归属。

4. **创建公开 GitHub 仓库。** 新目录初始化 `main` 分支，审查暂存内容并提交。沿用当前 `.gitignore`，不要提交 `node_modules`、`.next`、`.env*`、`.vercel` 或任何凭据。确认目标仓库不存在后，可执行：
   ```sh
   gh repo create computersciencefreshmen/mtr-live --public --source=. --remote=origin --push
   ```
   若目标仓库已存在，先读取其内容和远程分支，判断是否属于本项目再同步；不要删除仓库、强制推送或覆盖已有工作。保留用户已有 Git 作者配置，不猜测姓名或邮箱。最后确认仓库可见性为 PUBLIC、远程提交与本地提交一致。保留 README 对独立项目和第三方 MTR 标志归属的说明。

5. **连接并部署 Vercel。** 在正确的个人空间或用户指定团队创建/关联 `mtr-live` 项目；若存在同名项目，先核实是否属于此网站。使用 Next.js preset、仓库根目录、Node.js 24.x、`npm run build`。这个项目不需要 MTR API key、数据库或额外运行环境变量。
   - 可通过 Vercel 的 Import Git Repository 导入刚创建的仓库。
   - CLI 路径先用 `vercel link` 关联正确项目，再用 `vercel git connect` 连接 GitHub，最后执行 `vercel --prod`。
   - 若 Vercel GitHub App 尚未获准访问此仓库，让用户在官方授权界面完成必要授权。
   - 以实际部署返回结果为准，等待部署到 Ready，并检查 Git 连接及生产分支 `main`。不要把 CLI 一次部署成功误报为 Git 自动部署已经连接。

6. **域名。** 用户未提供自有域名时，先交付 Vercel 自动分配的稳定 `*.vercel.app` 生产网址；不要购买域名。用户提供自有域名后，在此项目的 Domains 中添加该完整域名，并根据该项目实际返回的 A/CNAME/TXT 要求设置 DNS。不要复制别的项目的 DNS 值，不要迁移整个 DNS 区域或改动邮箱记录。只有 DNS、证书和匿名 HTTPS 访问全部通过，才报告自有域名绑定完成。缺少域名或 DNS 权限时仍应先完成 GitHub 和默认生产网址。

7. **生产验证。** 匿名访问稳定生产域名，确认首页、MTR 图标及上述真实 API 正常。检查实际列车目的地、官方站台、预计时间和 `timeType`；确认错误/过期数据没有变成列车行。站点应公开可访问；若观察到部署保护导致访客需登录，记录具体状态并按用户公开发布的要求调整适用配置。不要绕过验证码或安全检查。

8. **交付。** 提供本地目录、公开仓库实际 URL、稳定 Vercel 生产 URL、部署对应 commit SHA、Git 自动部署连接状态、真实接口验证结果，以及自有域名状态（如有）。没有完成的步骤要明确说明，不能只报告“命令已执行”。

## 必须保留的业务约束

- 仅使用港铁官方实时接口 `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php`，同源服务端路由为 `/api/next-train`。
- 10 秒取新数据，1 秒更新显示时间；没有模拟数据、录制数据或失败后的虚假兜底。
- 先过滤过时/无效记录，再取每方向最多两班；没有有效预报就不显示列车行。
- 预计 60 秒内到站可显示“即將抵達”；这是 ETA 估算。官方 `timeType=D` 必须保留出发语义，不得误标为到站。
- 默认常驻海洋公园；覆盖官方 Next Train API 支持的 10 条铁路线路。
- 金钟入口统一显示荃湾线＋港岛线、南港岛线＋东铁线两组，12 秒轮播并支持手动切换；列车站台来自官方接口。
- 保留手机自定义搜索选站弹层。

## 官方操作参考

- [GitHub CLI 创建仓库](https://cli.github.com/manual/gh_repo_create)
- [Vercel Git 连接](https://vercel.com/docs/cli/git)
- [Vercel 生产部署](https://vercel.com/docs/cli/deploy)
- [Vercel 自有域名设置](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

