<template>
  <div class="page-container">
    <el-card v-loading="loading" element-loading-text="加载中..." shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <div>
            <span style="font-size: 18px; font-weight: 600;">
              {{ corp.subjectFull || '企业法人信息' }}
            </span>
            <el-tag
              v-if="corp.corpStatus"
              :type="statusTagType(corp.corpStatus)"
              effect="light"
              style="margin-left: 12px;">
              {{ statusLabel(corp.corpStatus) }}
            </el-tag>
          </div>
          <div>
            <el-button :icon="ArrowLeft" @click="goBack">返回列表</el-button>
            <el-button type="primary" :icon="Edit" @click="handleEdit">编辑法人信息</el-button>
          </div>
        </div>
      </template>

      <div class="detail-layout">
        <!-- 企业基本信息 -->
        <div class="detail-block">
          <div class="block-title">
            <el-icon><OfficeBuilding /></el-icon>
            <span>企业基本信息</span>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="主体简称">{{ corp.subjectShort || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业全称">{{ corp.subjectFull || '-' }}</el-descriptions-item>
            <el-descriptions-item label="客户类型">
              <el-tag
                v-for="(t, idx) in splitTag(corp.customerType)"
                :key="idx"
                type="success"
                effect="light"
                style="margin-right: 6px;">{{ t }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="主体状态">
              <el-tag :type="statusTagType(corp.corpStatus)" effect="light">
                {{ statusLabel(corp.corpStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建人">{{ corp.creator || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号码">{{ corp.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业认证到期">{{ corp.certExpire || '-' }}</el-descriptions-item>
            <el-descriptions-item label="外部联系人有效期">{{ corp.contactValidDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="规模额度">{{ calcTotal(corp) }}</el-descriptions-item>
            <el-descriptions-item label="已用额度">{{ calcUsed(corp) }}</el-descriptions-item>
            <el-descriptions-item label="剩余额度">{{ calcRemaining(corp) }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ corp.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 法人信息 -->
        <div class="detail-block">
          <div class="block-title">
            <el-icon><User /></el-icon>
            <span>法人信息</span>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="法人姓名">{{ corp.legalName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="法人身份证号">{{ corp.legalIdCard || '-' }}</el-descriptions-item>
            <el-descriptions-item label="法人联系电话">{{ corp.legalPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="注册资本">{{ corp.registerCapital || '-' }}</el-descriptions-item>
            <el-descriptions-item label="注册日期">{{ corp.registerDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="注册地址">{{ corp.registerAddress || '-' }}</el-descriptions-item>
            <el-descriptions-item label="经营范围" :span="2">{{ corp.businessScope || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 时间信息 -->
        <div class="detail-block">
          <div class="block-title">
            <el-icon><Calendar /></el-icon>
            <span>时间信息</span>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="创建时间">{{ corp.createTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ corp.updateTime || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑法人信息" width="680px" @close="editClosed">
      <el-form :model="editForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="法人姓名">
              <el-input v-model="editForm.legalName" placeholder="请输入法人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人身份证号">
              <el-input v-model="editForm.legalIdCard" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="法人联系电话">
              <el-input v-model="editForm.legalPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册资本">
              <el-input v-model="editForm.registerCapital" placeholder="如：1000万" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="注册日期">
              <el-date-picker
                v-model="editForm.registerDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体状态">
              <el-select v-model="editForm.corpStatus" placeholder="请选择主体状态" style="width: 100%;">
                <el-option
                  v-for="item in statusOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="item.dictKey" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="注册地址">
              <el-input v-model="editForm.registerAddress" placeholder="请输入注册地址" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="经营范围">
              <el-input
                v-model="editForm.businessScope"
                type="textarea"
                :rows="3"
                placeholder="请输入经营范围" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Edit, OfficeBuilding, User, Calendar } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getWeCorpDetail, updateWeCorp } from '@/api/wecorp'
import { useDictStore } from '@/store/dict'

const dictStore = useDictStore()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const corp = ref({})
const statusOptions = ref([])
const editVisible = ref(false)
const editForm = ref({})

function splitTag(v) {
  if (!v) return []
  return String(v).split(',').map(s => s.trim()).filter(Boolean)
}
function calcTotal(c) { return (c.quotaTotal != null) ? c.quotaTotal : 0 }
function calcUsed(c) { return (c.quotaUsed != null) ? c.quotaUsed : 0 }
function calcRemaining(c) { return calcTotal(c) - calcUsed(c) }

function statusLabel(key) {
  const dict = statusOptions.value.find(o => o.dictKey === key)
  return dict ? dict.dictValue : (key || '-')
}
function statusTagType(key) {
  switch (key) {
    case 'active': return 'success'
    case 'cancelled': return 'info'
    case 'frozen': return 'danger'
    default: return 'primary'
  }
}

async function loadDetail() {
  loading.value = true
  try {
    const id = route.params.id
    if (!id) {
      ElMessage.error('缺少主体ID')
      return
    }
    let res = await getWeCorpDetail(id)
    res = res && typeof res === 'object' ? res : {}
    // 把下划线字段拷贝到驼峰字段，避免 MyBatis 命名策略导致的值丢失
    if (res.corp_status !== undefined && res.corpStatus === undefined) res.corpStatus = res.corp_status
    if (res.legal_name !== undefined && res.legalName === undefined) res.legalName = res.legal_name
    if (res.legal_id_card !== undefined && res.legalIdCard === undefined) res.legalIdCard = res.legal_id_card
    if (res.legal_phone !== undefined && res.legalPhone === undefined) res.legalPhone = res.legal_phone
    if (res.register_capital !== undefined && res.registerCapital === undefined) res.registerCapital = res.register_capital
    if (res.register_date !== undefined && res.registerDate === undefined) res.registerDate = res.register_date
    if (res.business_scope !== undefined && res.businessScope === undefined) res.businessScope = res.business_scope
    if (res.register_address !== undefined && res.registerAddress === undefined) res.registerAddress = res.register_address
    if (res.customer_type !== undefined && res.customerType === undefined) res.customerType = res.customer_type
    if (res.cert_expire !== undefined && res.certExpire === undefined) res.certExpire = res.cert_expire
    if (res.contact_valid_date !== undefined && res.contactValidDate === undefined) res.contactValidDate = res.contact_valid_date
    if (res.quota_total !== undefined && res.quotaTotal === undefined) res.quotaTotal = res.quota_total
    if (res.quota_used !== undefined && res.quotaUsed === undefined) res.quotaUsed = res.quota_used
    if (res.subject_short !== undefined && res.subjectShort === undefined) res.subjectShort = res.subject_short
    if (res.subject_full !== undefined && res.subjectFull === undefined) res.subjectFull = res.subject_full
    corp.value = res
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function loadDicts() {
  try {
    statusOptions.value = await dictStore.getDict('we_corp_status')
  } catch (e) {}
}

// 监听字典缓存变更（其他页面修改字典后自动刷新）
watch(() => dictStore.lastCleared, () => {
  loadDicts()
})

function goBack() {
  router.push('/wecorp/list')
}

function handleEdit() {
  editForm.value = {
    id: corp.value.id,
    legalName: corp.value.legalName || '',
    legalIdCard: corp.value.legalIdCard || '',
    legalPhone: corp.value.legalPhone || '',
    registerCapital: corp.value.registerCapital || '',
    registerDate: corp.value.registerDate || '',
    registerAddress: corp.value.registerAddress || '',
    businessScope: corp.value.businessScope || '',
    corpStatus: corp.value.corpStatus || 'active'
  }
  editVisible.value = true
}

function editClosed() {
  editForm.value = {}
}

async function handleSave() {
  saving.value = true
  try {
    await updateWeCorp(corp.value.id, editForm.value)
    ElMessage.success('保存成功')
    editVisible.value = false
    loadDetail()
  } catch (e) {
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadDicts()
  loadDetail()
})
</script>

<style scoped>
.page-container { padding: 16px; }
.main-card { background: #fff; }
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}
.detail-block {
  margin-bottom: 24px;
}
</style>
