import request from '@/utils/request'

// ============ 用户管理 ============

/**
 * 分页查询用户列表
 * @param {Object} params - { keyword, status, page, size }
 */
export function getUserList(params) {
  return request({
    url: '/sys/users',
    method: 'get',
    params
  })
}

/**
 * 获取用户详情
 */
export function getUser(id) {
  return request({
    url: `/sys/users/${id}`,
    method: 'get'
  })
}

/**
 * 新增用户
 * @param {Object} data - { username, password, realName, email, phone, status }
 */
export function addUser(data) {
  return request({
    url: '/sys/users',
    method: 'post',
    data
  })
}

/**
 * 更新用户（不含密码）
 */
export function updateUser(id, data) {
  return request({
    url: `/sys/users/${id}`,
    method: 'put',
    data
  })
}

/**
 * 重置用户密码
 */
export function resetUserPassword(id, password) {
  return request({
    url: `/sys/users/${id}/password`,
    method: 'put',
    data: { password }
  })
}

/**
 * 删除用户
 */
export function deleteUser(id) {
  return request({
    url: `/sys/users/${id}`,
    method: 'delete'
  })
}

/**
 * 获取用户已分配的角色ID列表
 */
export function getUserRoleIds(userId) {
  return request({
    url: `/sys/users/${userId}/roles`,
    method: 'get'
  })
}

/**
 * 给用户分配角色
 * @param {Object} data - { roleIds: [1,2,3] }
 */
export function assignUserRoles(userId, roleIds) {
  return request({
    url: `/sys/users/${userId}/roles`,
    method: 'post',
    data: { roleIds }
  })
}

// ============ 角色管理 ============

/**
 * 分页查询角色列表
 */
export function getRoleList(params) {
  return request({
    url: '/sys/roles',
    method: 'get',
    params
  })
}

/**
 * 获取所有角色（下拉选择用）
 */
export function getAllRoles() {
  return request({
    url: '/sys/roles/all',
    method: 'get'
  })
}

/**
 * 获取角色详情
 */
export function getRole(id) {
  return request({
    url: `/sys/roles/${id}`,
    method: 'get'
  })
}

/**
 * 新增角色
 */
export function addRole(data) {
  return request({
    url: '/sys/roles',
    method: 'post',
    data
  })
}

/**
 * 更新角色
 */
export function updateRole(id, data) {
  return request({
    url: `/sys/roles/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除角色
 */
export function deleteRole(id) {
  return request({
    url: `/sys/roles/${id}`,
    method: 'delete'
  })
}

/**
 * 获取角色已分配的菜单ID列表
 */
export function getRoleMenuIds(roleId) {
  return request({
    url: `/sys/roles/${roleId}/menus`,
    method: 'get'
  })
}

/**
 * 给角色分配菜单
 */
export function assignRoleMenus(roleId, menuIds) {
  return request({
    url: `/sys/roles/${roleId}/menus`,
    method: 'post',
    data: { menuIds }
  })
}

// ============ 操作日志 ============

/**
 * 分页查询操作日志
 * @param {Object} params - { moduleName, operateType, operator, page, size }
 */
export function getLogList(params) {
  return request({
    url: '/system/logs',
    method: 'get',
    params
  })
}

/**
 * 获取所有已记录的模块名称（distinct）
 */
export function getLogModules() {
  return request({
    url: '/system/logs/modules',
    method: 'get'
  })
}

// ============ 菜单管理 ============

/**
 * 查询所有菜单（带条件筛选）
 */
export function getMenuList(params) {
  return request({
    url: '/sys/menus',
    method: 'get',
    params
  })
}

/**
 * 获取菜单树
 */
export function getMenuTree() {
  return request({
    url: '/sys/menus/tree',
    method: 'get'
  })
}

/**
 * 获取菜单详情
 */
export function getMenu(id) {
  return request({
    url: `/sys/menus/${id}`,
    method: 'get'
  })
}

/**
 * 新增菜单
 */
export function addMenu(data) {
  return request({
    url: '/sys/menus',
    method: 'post',
    data
  })
}

/**
 * 更新菜单
 */
export function updateMenu(id, data) {
  return request({
    url: `/sys/menus/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除菜单
 */
export function deleteMenu(id) {
  return request({
    url: `/sys/menus/${id}`,
    method: 'delete'
  })
}
