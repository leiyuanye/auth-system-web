<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Tickets /></el-icon>
            <span style="margin-left: 8px;">备用手机卡</span>
          </div>
          <div>
            <el-input v-model="searchKeyword" placeholder="搜索卡号/代理商" style="width: 240px; margin-right: 10px;" clearable :prefix-icon="Search" />
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('phone:backup:add')">
              新增备用卡
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredList" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="cardNumber" label="卡号" width="160" />
        <el-table-column prop="agent" label="代理商" width="140">
          <template #default="{ row }">
            <el-tag>{{ row.agent || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phoneNumber" label="手机号" width="140" />
        <el-table-column prop="package" label="套餐" width="120" />
        <el-table-column prop="stockStatus" label="库存状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.stockStatus === '库存' ? 'success' : 'info'">{{ row.stockStatus || '库存' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
        <el-table-column prop="createTime" label="入库时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" v-if="userStore.hasPermission('phone:backup:edit')" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" v-if="userStore.hasPermission('phone:backup:delete')" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination v-model:current-page="page" :page-size="10" :total="filteredList.length" layout="total, prev, pager, next" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="卡号" prop="cardNumber">
          <el-input v-model="form.cardNumber" placeholder="请输入卡号" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="代理商">
              <el-select v-model="form.agent" placeholder="选择代理商" style="width: 100%;">
                <el-option label="XX科技有限公司" value="XX科技有限公司" />
                <el-option label="YY通信服务中心" value="YY通信服务中心" />
                <el-option label="ZZ网络科技" value="ZZ网络科技" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="form.phoneNumber" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="套餐">
              <el-input v-model="form.package" placeholder="如 59元/月" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存状态">
              <el-select v-model="form.stockStatus" style="width: 100%;">
                <el-option label="库存" value="库存" />
                <el-option label="已借出" value="已借出" />
                <el-option label="报废" value="报废" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Tickets, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const searchKeyword = ref('')
const page = ref(1)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增备用手机卡')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const defaultForm = () => ({ id: null, cardNumber: '', agent: '', phoneNumber: '', package: '', stockStatus: '库存', remark: '' })
const form = ref(defaultForm())
const rules = { cardNumber: [{ required: true, message: '请输入卡号', trigger: 'blur' }] }

const mockList = [
  { id: 1, cardNumber: '89860987654321001', agent: 'XX科技有限公司', phoneNumber: '13811112222', package: '39元/月', stockStatus: '库存', remark: '备用卡-01', createTime: '2024-02-01 09:00:00' },
  { id: 2, cardNumber: '89860987654321002', agent: 'YY通信服务中心', phoneNumber: '18611113333', package: '49元/月', stockStatus: '库存', remark: '备用卡-02', createTime: '2024-02-02 10:00:00' },
  { id: 3, cardNumber: '89860987654321003', agent: 'ZZ网络科技', phoneNumber: '13311114444', package: '59元/月', stockStatus: '已借出', remark: '已借给市场部', createTime: '2024-02-03 11:00:00' }
]
const listData = ref([])

const filteredList = computed(() => {
  const kw = searchKeyword.value.toLowerCase()
  if (!kw) return listData.value
  return listData.value.filter(item =>
    (item.cardNumber || '').toLowerCase().includes(kw) || (item.agent || '').toLowerCase().includes(kw)
  )
})

onMounted(() => { loading.value = true; setTimeout(() => { listData.value = [...mockList]; loading.value = false }, 300) })

function handleAdd() { isEdit.value = false; dialogTitle.value = '新增备用手机卡'; form.value = defaultForm(); dialogVisible.value = true }
function handleEdit(row) { isEdit.value = true; dialogTitle.value = '编辑备用手机卡'; form.value = { ...row }; dialogVisible.value = true }

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  setTimeout(() => {
    if (isEdit.value) { const idx = listData.value.findIndex(i => i.id === form.value.id); if (idx !== -1) listData.value[idx] = { ...form.value }; ElMessage.success('更新成功') }
    else { form.value.id = Date.now(); form.value.createTime = new Date().toLocaleString(); listData.value.unshift({ ...form.value }); ElMessage.success('新增成功') }
    dialogVisible.value = false; submitting.value = false
  }, 300)
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除 "${row.cardNumber}" 吗？`, '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }).catch(() => { throw new Error('cancel') })
  listData.value = listData.value.filter(i => i.id !== row.id)
  ElMessage.success('删除成功')
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
