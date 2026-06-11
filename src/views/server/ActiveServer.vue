<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Cpu /></el-icon>
            <span style="margin-left: 8px;">在用服务器</span>
          </div>
          <div>
            <el-input v-model="searchKeyword" placeholder="搜索服务器名/IP" style="width: 240px; margin-right: 10px;" clearable :prefix-icon="Search" />
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('server:active:add')">
              新增服务器
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredList" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="serverName" label="服务器名称" width="160" />
        <el-table-column prop="ipAddress" label="IP地址" width="150" />
        <el-table-column prop="serverType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.serverType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="所在机房" width="120" />
        <el-table-column prop="specs" label="配置" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '运行中' ? 'success' : row.status === '维护中' ? 'warning' : 'danger'">
              {{ row.status || '运行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="上线时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" v-if="userStore.hasPermission('server:active:edit')" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" v-if="userStore.hasPermission('server:active:delete')" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination v-model:current-page="page" :page-size="10" :total="filteredList.length" layout="total, prev, pager, next" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="服务器名" prop="serverName">
              <el-input v-model="form.serverName" placeholder="请输入服务器名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="IP地址" prop="ipAddress">
              <el-input v-model="form.ipAddress" placeholder="如 192.168.1.100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="类型">
              <el-select v-model="form.serverType" style="width: 100%;">
                <el-option label="物理服务器" value="物理服务器" />
                <el-option label="云服务器" value="云服务器" />
                <el-option label="虚拟服务器" value="虚拟服务器" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所在机房">
              <el-input v-model="form.location" placeholder="如 北京机房-A区" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="配置">
              <el-input v-model="form.specs" placeholder="如 16核32G/500G SSD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option label="运行中" value="运行中" />
                <el-option label="维护中" value="维护中" />
                <el-option label="已下线" value="已下线" />
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
import { Cpu, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const searchKeyword = ref('')
const page = ref(1)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增在用服务器')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const defaultForm = () => ({ id: null, serverName: '', ipAddress: '', serverType: '', location: '', specs: '', status: '运行中', remark: '' })
const form = ref(defaultForm())
const rules = {
  serverName: [{ required: true, message: '请输入服务器名称', trigger: 'blur' }],
  ipAddress: [{ required: true, message: '请输入IP地址', trigger: 'blur' }]
}

const mockList = [
  { id: 1, serverName: 'DB-Master-01', ipAddress: '192.168.1.101', serverType: '物理服务器', location: '北京机房-A区', specs: '64核128G/2T SSD', status: '运行中', remark: '主数据库服务器', createTime: '2023-06-01 08:00:00' },
  { id: 2, serverName: 'APP-Server-01', ipAddress: '192.168.1.102', serverType: '云服务器', location: '阿里云-华北', specs: '8核16G/200G SSD', status: '运行中', remark: '应用服务器', createTime: '2023-07-15 10:00:00' },
  { id: 3, serverName: 'Cache-Server-01', ipAddress: '192.168.1.103', serverType: '物理服务器', location: '北京机房-B区', specs: '32核64G/500G SSD', status: '维护中', remark: '缓存服务器', createTime: '2023-08-01 09:00:00' },
  { id: 4, serverName: 'Backup-Server-01', ipAddress: '192.168.1.104', serverType: '物理服务器', location: '上海机房', specs: '16核32G/8T HDD', status: '运行中', remark: '备份服务器', createTime: '2023-09-01 11:00:00' }
]
const listData = ref([])

const filteredList = computed(() => {
  const kw = searchKeyword.value.toLowerCase()
  if (!kw) return listData.value
  return listData.value.filter(item =>
    (item.serverName || '').toLowerCase().includes(kw) || (item.ipAddress || '').toLowerCase().includes(kw)
  )
})

onMounted(() => { loading.value = true; setTimeout(() => { listData.value = [...mockList]; loading.value = false }, 300) })

function handleAdd() { isEdit.value = false; dialogTitle.value = '新增在用服务器'; form.value = defaultForm(); dialogVisible.value = true }
function handleEdit(row) { isEdit.value = true; dialogTitle.value = '编辑在用服务器'; form.value = { ...row }; dialogVisible.value = true }

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
  await ElMessageBox.confirm(`确定删除 "${row.serverName}" 吗？`, '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }).catch(() => { throw new Error('cancel') })
  listData.value = listData.value.filter(i => i.id !== row.id)
  ElMessage.success('删除成功')
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
