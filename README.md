# 权限管理系统 - 前端 (auth-system-web)

基于 Vue 3 + Element Plus + Vite 的权限管理系统前端。

## 技术栈

- **Vue 3.4** (Composition API)
- **Vue Router 4** 路由
- **Pinia** 状态管理
- **Element Plus 2.4** UI 组件库
- **Element Plus Icons** 图标库
- **Axios** HTTP 请求库
- **ECharts 5** 数据可视化
- **Vite 5** 构建工具
- **Sass** CSS 预处理器

## 功能特性

- ✅ 登录/登出 + Token 持久化
- ✅ 基于角色的动态菜单（从后端获取）
- ✅ 按钮级权限控制 `v-if="userStore.hasPermission('perm:code')"`
- ✅ 路由守卫（未登录自动跳转，已登录禁访问登录页）
- ✅ Axios 请求/响应拦截器（自动注入 token、统一错误处理）
- ✅ Element Plus 全局中文国际化
- ✅ 数据可视化图表（ECharts）

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
yarn
# 或
pnpm install
```

### 2. 启动开发服务器

```bash
npm run dev
# 访问 http://localhost:5173
```

> Vite 代理配置: `/api` → `http://localhost:8080`

### 3. 构建生产版本

```bash
npm run build
# 产物: dist/

# 预览生产构建
npm run preview
```

## 默认账号

| 用户名 | 密码 | 角色 | 权限 |
|---|---|---|---|
| admin | admin123 | 超级管理员 | 全部菜单+全部按钮 |
| operator | admin123 | 运营员 | 手机卡管理+运营数据（含编辑） |
| viewer | admin123 | 查看员 | 所有菜单（仅查看，无编辑按钮） |

## 项目结构

```
src/
├── main.js                 # 入口（注册 Element Plus / Router / Pinia）
├── App.vue                 # 根组件
├── router/index.js         # 路由配置 + beforeEach 守卫
├── store/user.js           # Pinia 用户状态（token/菜单/权限）
├── utils/request.js        # Axios 封装（请求/响应拦截器）
├── api/
│   ├── auth.js             # 认证接口
│   └── menu.js             # 菜单/权限接口
├── styles/index.scss       # 全局样式
└── views/
    ├── Login.vue           # 登录页
    ├── Layout.vue          # 主布局（侧边栏+顶栏+内容区）
    ├── Home.vue            # 首页（用户信息+ECharts）
    ├── system/
    │   ├── UserList.vue    # 用户管理
    │   ├── RoleList.vue    # 角色管理
    │   └── MenuList.vue    # 菜单管理
    ├── phone/
    │   └── PhoneList.vue   # 手机卡管理
    └── operation/
        ├── ReportSummary.vue  # 数据概览
        └── DailyReport.vue    # 日报表
```

## 权限控制示例

```vue
<script setup>
import { useUserStore } from '@/store/user'
const userStore = useUserStore()
</script>

<template>
  <!-- 菜单级权限：菜单本身由后端根据角色返回 -->
  <!-- 按钮级权限：通过 permCode 控制显示 -->
  <el-button
    v-if="userStore.hasPermission('phone:list:edit')"
    type="primary"
  >
    编辑
  </el-button>

  <el-button
    v-if="userStore.hasPermission('phone:list:delete')"
    type="danger"
  >
    删除
  </el-button>
</template>
```

## API 响应约定

```json
{
  "code": 200,       // 200 = 成功
  "message": "ok",    // 提示信息
  "data": {}          // 响应数据
}
```

## 环境变量

| 文件 | 说明 |
|---|---|
| `.env.development` | 开发环境配置 |
| `.env.production` | 生产环境配置 |
