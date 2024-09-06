<template>
  <div class="pass-container">
    <el-form>
      <el-form-item label="旧密码">
        <el-input placeholder="请输入旧密码" type="password" v-model="oldPass" show-password />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input placeholder="请输入新密码" type="password" v-model="pass" show-password />
      </el-form-item>
      <el-form-item label="重复密码">
        <el-input placeholder="请输入重复密码" type="password" v-model="repass" show-password />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">修改</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>

import { changePass } from '@/api/user'
export default {
  name: 'Pass',
  data() {
    return {
      oldPass: '',
      pass: '',
      repass: '',
    }
  },
  created() {
  },
  methods: {
    submit() {
      changePass({ old_pass: this.oldPass, password: this.pass, repass: this.repass }).then(async () => {
        this.$message({
          message: '修改成功',
          type: 'success',
          duration: 5 * 1000
        })
        await this.$store.dispatch('user/logout')
        this.$router.push(`/login?redirect=${this.$route.fullPath}`)
      })

    }
  }
}
</script>
<style scoped>
.pass-container {
  padding: 50px 0 0 50px;
  width: 80%;
  max-width: 800px;
}
</style>