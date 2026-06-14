<template>
  <div class="home-page">
    <el-card class="home-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="18" color="#409EFF"><Iphone /></el-icon>
            <span class="title-text">设备信息</span>
            <el-tag size="small" type="info" effect="plain">共 {{ total }} 台</el-tag>
          </div>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索编号 / 昵称 / 位置"
              style="width: 260px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="loadData"
            />
            <el-button type="primary" @click="loadData">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%;" stripe border v-loading="loading" empty-text="暂无设备">
        <el-table-column prop="phoneNo" label="手机编号" width="140" fixed="left" />
        <el-table-column prop="wechatNickname" label="企微昵称" width="160" show-overflow-tooltip />
        <el-table-column label="主体简称" min-width="200">
          <template #default="{ row }">
            <span class="entity-tags">
              <el-tag
                v-for="(name, idx) in parseMulti(row.entityName).slice(0, 2)"
                :key="idx"
                type="warning"
                size="small"
                effect="plain"
                class="entity-tag-inline"
              >{{ name }}</el-tag>
              <span v-if="parseMulti(row.entityName).length > 2" class="entity-more">
                +{{ parseMulti(row.entityName).length - 2 }}
              </span>
              <span v-if="parseMulti(row.entityName).length === 0">-</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="wechatPerson" label="企微实名人" width="120" show-overflow-tooltip />
        <el-table-column prop="wechatPhone" label="企微手机号" width="140" />
        <el-table-column prop="phoneLocation" label="手机位置" width="180" show-overflow-tooltip />
        <el-table-column label="企微状态" width="100">
          <template #default="{ row }">
            <el-tag :type="wechatStatusTagType(row.wechatStatus)" size="small">
              {{ dictLabel(wechatStatusOptions, row.wechatStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用状态" width="100">
          <template #default="{ row }">
            <el-tag :type="useStatusTagType(row.useStatus)" size="small" effect="plain">
              {{ dictLabel(useStatusOptions, row.useStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detail.visible" title="设备详情" width="900px" destroy-on-close>
      <el-descriptions v-if="detail.data" :column="2" border>
        <el-descriptions-item label="手机编号">{{ detail.data.phoneNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机类型">
          <el-tag type="success" size="small" effect="plain">{{ dictLabel(phoneTypeOptions, detail.data.phoneType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机位置" :span="2">{{ detail.data.phoneLocation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用状态">
          <el-tag :type="useStatusTagType(detail.data.useStatus)" size="small" effect="plain">
            {{ dictLabel(useStatusOptions, detail.data.useStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="使用部门">
          <el-tag type="primary" size="small" effect="plain">{{ dictLabel(deptOptions, detail.data.dept) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="主体简称" :span="2">
          <el-tag
            v-for="(name, idx) in parseMulti(detail.data.entityName)"
            :key="idx"
            type="warning"
            size="small"
            effect="plain"
            style="margin: 2px;"
          >{{ name }}</el-tag>
          <span v-if="parseMulti(detail.data.entityName).length === 0">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="企微对外昵称" :span="2">{{ detail.data.wechatNickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微实名人">{{ detail.data.wechatPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微手机号">{{ detail.data.wechatPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微状态">
          <el-tag :type="wechatStatusTagType(detail.data.wechatStatus)" size="small">
            {{ dictLabel(wechatStatusOptions, detail.data.wechatStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="企微用途">
          <el-tag type="info" size="small">{{ dictLabel(wechatUsageOptions, detail.data.wechatUsage) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信实名人">{{ detail.data.wxRealname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信手机号">{{ detail.data.wxPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信状态">
          <el-tag :type="Number(detail.data.wxStatus) === 2 ? 'danger' : 'success'" size="small">
            {{ dictLabel(wxStatusOptions, detail.data.wxStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信用途">
          <el-tag size="small" effect="plain">{{ dictLabel(wxUsageOptions, detail.data.wxUsage) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信密码" :span="2">
          <span style="letter-spacing: 1px;">{{ detail.showPassword ? (detail.data.wxPassword || '') : maskText(detail.data.wxPassword) }}</span>
          <el-button link type="primary" size="small" style="margin-left: 10px;" @click="detail.showPassword = !detail.showPassword">
            {{ detail.showPassword ? '隐藏' : '显示' }}
          </el-button>
        </el-descriptions-item>
        <el-descriptions-item label="最近修改时间">{{ formatDateTime(detail.data.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(detail.data.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.data.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Iphone, Search } from '@element-plus/icons-vue'
import { getDictByType } from '@/api/dict'
import { getPhoneDeviceList } from '@/api/phoneDevice'

const loading = ref(false)
const listData = ref([])
const total = ref(0)
const searchKeyword = ref('')

const wechatStatusOptions = ref([])
const useStatusOptions = ref([])
const deptOptions = ref([])
const wechatUsageOptions = ref([])
const wxStatusOptions = ref([])
const wxUsageOptions = ref([])
const phoneTypeOptions = ref([])

const detail = reactive({
  visible: false,
  data: null,
  showPassword: false
})

function dictLabel(list, value) {
  if (value === null || value === undefined || !list) return '-'
  const item = list.find(i => String(i.dictKey) === String(value))
  return item ? item.dictValue : String(value)
}

function parseMulti(str) {
  if (!str) return []
  return String(str).split(',').map(s => s.trim()).filter(Boolean)
}

function maskText(val) {
  if (!val) return '-'
  const s = String(val)
  if (s.length <= 2) return s.substring(0, 1) + '*'
  return s.substring(0, 2) + '*'.repeat(Math.min(s.length - 2, 10))
}

function wechatStatusTagType(status) {
  const s = Number(status)
  if (s === 1) return 'success'
  if (s === 2) return 'info'
  if (s === 3) return 'danger'
  if (s === 4) return 'warning'
  return 'info'
}

function useStatusTagType(status) {
  const s = Number(status)
  if (s === 1) return 'success'
  if (s === 2) return 'warning'
  if (s === 4) return 'info'
  return 'info'
}

function formatDateTime(val) {
  if (!val) return '-'
  if (typeof val === 'string') return val
  try {
    const d = new Date(val)
    const pad = n => String(n).padStart(2, '0')
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
           pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  } catch (e) {
    return String(val)
  }
}

async function loadData() {
  loading.value = true
  try {
    const params = { page: 1, size: 20 }
    if (searchKeyword.value && searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    const data = await getPhoneDeviceList(params)
    listData.value = (data && data.list) || (data && data.records) || []
    total.value = (data && data.total) || 0
  } catch (e) {
    console.error('加载设备数据失败', e)
    listData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadDicts() {
  const types = [
    ['phone_device_wechat_status', wechatStatusOptions],
    ['phone_device_use_status', useStatusOptions],
    ['phone_device_dept', deptOptions],
    ['phone_device_wechat_usage', wechatUsageOptions],
    ['phone_device_wx_status', wxStatusOptions],
    ['phone_device_wx_usage', wxUsageOptions],
    ['phone_device_phone_type', phoneTypeOptions]
  ]
  for (const [type, target] of types) {
    try {
      const res = await getDictByType(type)
      if (Array.isArray(res)) target.value = res
    } catch (e) {
      console.warn('字典 ' + type + ' 加载失败', e)
    }
  }
}

function handleView(row) {
  detail.data = row
  detail.showPassword = false
  detail.visible = true
}

onMounted(async () => {
  await loadDicts()
  loadData()
})
</script>

<style scoped>
.home-page {
  padding: 0;
}
.home-card {
  background: #fff;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.entity-tags {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
}
.entity-tag-inline {
  margin-right: 4px;
}
.entity-more {
  display: inline-block;
  padding: 0 8px;
  height: 24px;
  line-height: 22px;
  background: #303133;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}
</style>
