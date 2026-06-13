<template>
  <div class="about-page">
    <el-card class="about-card" shadow="never">
      <div class="article-container">
        <div class="article-header">
          <h1 class="article-title">
            <el-icon :size="28" color="#409EFF"><InfoFilled /></el-icon>
            <span style="margin-left: 12px;">关于基建部门</span>
          </h1>
          <div class="article-subtitle">基础设施 &amp; 运维团队</div>
        </div>

        <div class="article-content">
          <h2 class="section-title"><span class="title-bar"></span>部门简介</h2>
          <p class="section-paragraph">
            基建部门（基础设施部）是公司技术体系的基石，负责承载公司所有核心业务系统的底层基础设施。
            我们致力于构建高可用、高性能、易维护的技术底座，为业务发展提供稳定、高效的基础支撑。
          </p>

          <div class="highlight-box">
            <el-icon :size="20"><Warning /></el-icon>
            <div style="flex: 1; margin-left: 8px;">
              <strong>本系统</strong>主要用于管理基建部门的各类资源，包括手机卡、服务器、企微主体等，
              方便团队统一维护和追踪各类资产。
            </div>
          </div>

          <h2 class="section-title"><span class="title-bar"></span>核心职责</h2>
          <div class="grid-2">
            <div class="feature-card">
              <div class="feature-icon feature-icon-blue">
                <el-icon :size="24"><Monitor /></el-icon>
              </div>
              <h3 class="feature-title">服务器运维</h3>
              <p class="feature-desc">
                负责物理服务器、云服务器的采购、部署、监控和日常维护，保障系统 7&times;24 小时稳定运行。
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon feature-icon-green">
                <el-icon :size="24"><Tools /></el-icon>
              </div>
              <h3 class="feature-title">通信资源管理</h3>
              <p class="feature-desc">
                管理各类手机号码、SIM 卡资源，实名登记，确保合规使用，并为业务系统提供通信能力支持。
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon feature-icon-orange">
                <el-icon :size="24"><OfficeBuilding /></el-icon>
              </div>
              <h3 class="feature-title">企微主体管理</h3>
              <p class="feature-desc">
                维护各企微主体信息、企业认证、外部联系人额度，支持业务在企业微信生态内的合规运营。
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon feature-icon-purple">
                <el-icon :size="24"><DataLine /></el-icon>
              </div>
              <h3 class="feature-title">数据统计与分析</h3>
              <p class="feature-desc">
                定期产出资源使用统计报告，为部门决策提供数据支持，推动资源合理利用和成本优化。
              </p>
            </div>
          </div>

          <h2 class="section-title"><span class="title-bar"></span>部门文化</h2>
          <p class="section-paragraph">
            我们倡导 <strong style="color:#409EFF;">稳定、专业、高效、协作</strong> 的团队文化。
            每一位成员都以「守土有责」的态度对待每一台服务器、每一个号码、每一个企业主体。
          </p>
          <ul class="culture-list">
            <li><el-icon><CircleCheck /></el-icon> 稳定性优先：稳定性高于一切，不因追求速度而牺牲系统可靠</li>
            <li><el-icon><CircleCheck /></el-icon> 持续学习：关注行业前沿技术，持续提升团队技术深度</li>
            <li><el-icon><CircleCheck /></el-icon> 自动化优先：能自动化的绝不手动，减少人为失误</li>
            <li><el-icon><CircleCheck /></el-icon> 透明沟通：信息透明，文档完善，让每一次变更都可追溯</li>
          </ul>

          <h2 class="section-title"><span class="title-bar"></span>常用链接</h2>
          <div class="link-grid">
            <a class="link-card" href="https://www.aliyun.com" target="_blank">
              <el-icon :size="22" color="#FF6A00"><Link /></el-icon>
              <div class="link-info">
                <div class="link-name">阿里云控制台</div>
                <div class="link-hint">yun.aliyun.com</div>
              </div>
            </a>
            <a class="link-card" href="https://console.cloud.tencent.com" target="_blank">
              <el-icon :size="22" color="#00A4FF"><Link /></el-icon>
              <div class="link-info">
                <div class="link-name">腾讯云控制台</div>
                <div class="link-hint">cloud.tencent.com</div>
              </div>
            </a>
            <a class="link-card" href="https://www.huaweicloud.com" target="_blank">
              <el-icon :size="22" color="#C7000B"><Link /></el-icon>
              <div class="link-info">
                <div class="link-name">华为云控制台</div>
                <div class="link-hint">www.huaweicloud.com</div>
              </div>
            </a>
            <a class="link-card" href="https://work.weixin.qq.com" target="_blank">
              <el-icon :size="22" color="#1AAD19"><Link /></el-icon>
              <div class="link-info">
                <div class="link-name">企业微信管理</div>
                <div class="link-hint">work.weixin.qq.com</div>
              </div>
            </a>
          </div>

          <h2 class="section-title"><span class="title-bar"></span>联系方式</h2>
          <div class="contact-box">
            <div class="contact-item">
              <div class="contact-label">负责人</div>
              <div class="contact-value">基础设施部-技术总监</div>
            </div>
            <div class="contact-item">
              <div class="contact-label">邮箱</div>
              <div class="contact-value"><a href="mailto:infrastructure@company.com">infrastructure@company.com</a></div>
            </div>
            <div class="contact-item">
              <div class="contact-label">办公地址</div>
              <div class="contact-value">公司总部 · 数据中心 B 座 5 层</div>
            </div>
            <div class="contact-item">
              <div class="contact-label">问题反馈</div>
              <div class="contact-value">
                如发现系统 Bug 或有改进建议，请通过内部工单系统提交，我们会在 <strong>24 小时</strong>内响应。
              </div>
            </div>
          </div>

          <div class="footer-note">
            <el-icon :size="14" color="#999"><Document /></el-icon>
            <span>本页面为基建部门介绍文档 · 内容由部门统一维护</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import {
  InfoFilled, Warning, Monitor, Tools, OfficeBuilding, DataLine,
  Link, CircleCheck, Document
} from '@element-plus/icons-vue'
</script>

<style scoped>
.about-page {
  min-height: calc(100vh - 32px);
  background: #f0f2f5;
}

.about-card {
  border: none;
  background: transparent;
}

.article-container {
  max-width: 960px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 40px 50px;
}

.article-header {
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 32px;
}

.article-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.article-subtitle {
  font-size: 14px;
  color: #909399;
  letter-spacing: 2px;
}

.article-content {
  line-height: 1.8;
  color: #303133;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 32px 0 16px 0;
  padding-left: 0;
  display: flex;
  align-items: center;
}

.title-bar {
  display: inline-block;
  width: 4px;
  height: 18px;
  background: #409EFF;
  border-radius: 2px;
  margin-right: 10px;
}

.section-paragraph {
  font-size: 15px;
  color: #4c4d4f;
  margin: 0 0 12px 0;
  text-indent: 2em;
}

.highlight-box {
  display: flex;
  align-items: flex-start;
  background: #ecf5ff;
  border-left: 4px solid #409EFF;
  padding: 16px 20px;
  border-radius: 4px;
  margin: 20px 0;
  color: #303133;
  font-size: 14px;
  line-height: 1.8;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.feature-card {
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.25s;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  border-color: #a0cfff;
  background: #fff;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: #fff;
}

.feature-icon-blue   { background: linear-gradient(135deg, #409EFF, #1a7cff); }
.feature-icon-green  { background: linear-gradient(135deg, #67C23A, #4caf50); }
.feature-icon-orange { background: linear-gradient(135deg, #E6A23C, #f39c12); }
.feature-icon-purple { background: linear-gradient(135deg, #A56AFF, #8156e0); }

.feature-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.feature-desc {
  font-size: 13px;
  color: #606266;
  margin: 0;
  line-height: 1.7;
}

.culture-list {
  list-style: none;
  padding: 0;
  margin: 12px 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.culture-list li {
  font-size: 14px;
  color: #4c4d4f;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.culture-list li :deep(.el-icon) {
  color: #67C23A;
  flex-shrink: 0;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.link-card {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  text-decoration: none;
  color: #303133;
  transition: all 0.2s;
}

.link-card:hover {
  background: #fff;
  border-color: #a0cfff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
}

.link-info {
  margin-left: 12px;
}

.link-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.link-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.contact-box {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px 24px;
  margin: 20px 0;
}

.contact-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px dashed #ebeef5;
  font-size: 14px;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-label {
  width: 96px;
  color: #909399;
  flex-shrink: 0;
}

.contact-value {
  color: #303133;
  flex: 1;
}

.contact-value a {
  color: #409EFF;
  text-decoration: none;
}

.contact-value a:hover {
  text-decoration: underline;
}

.footer-note {
  text-align: center;
  padding: 24px 0 8px;
  color: #909399;
  font-size: 12px;
  border-top: 1px solid #ebeef5;
  margin-top: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

@media (max-width: 768px) {
  .article-container { padding: 24px 16px; }
  .grid-2 { grid-template-columns: 1fr; }
  .link-grid { grid-template-columns: 1fr; }
  .culture-list { grid-template-columns: 1fr; }
  .article-title { font-size: 22px; }
}
</style>
