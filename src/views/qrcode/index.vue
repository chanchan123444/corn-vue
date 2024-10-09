<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.name" placeholder="请输入设备id" style="width: 200px;margin-right: 10px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        搜索
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="success" icon="el-icon-document-add" @click="handleCreate">
        批量添加
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleUpdate(temp)">
        批量修改
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-box" @click="handleBatchExport">
        批量导出
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="danger" icon="el-icon-delete" @click="handleBatchDelete">
        批量删除
      </el-button>
    </div>
    <el-table :key="tableKey" v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%;" @sort-change="sortChange">
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="批次编号" width="100px">
        <template slot-scope="{row}">
          <span>{{ row.info_id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="批次信息(名称 型号 编号 检验日期 下次检验日期 状态 检验员)" min-width="150px">
        <template slot-scope="{row}">
          <span>{{ row.name }} | {{ row.type }} | {{ row.serial_number }}-{{ row.rank_id }} | {{ row.check_data | parseTime('{y}-{m}-{d} {h}:{i}') }} | {{ row.check_data | parseTime('{y}-{m}-{d} {h}:{i}') }} | {{ ['异常','正常'][row.status] }} | {{ row.pepole }}</span>
        </template>
      </el-table-column>
      <el-table-column label="二维码" min-width="100px">
        <template slot-scope="{row}">
          <!-- <span>{{ row.info_id }}</span> -->
          <div class="qr-code-box">
            <qrcode :url="domain + '/code/' + row.id"></qrcode>
            <qrcode class="big" :url="domain + '/code/' + row.id"></qrcode>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            Edit
          </el-button>
          <el-button v-if="row.status!='deleted'" size="mini" type="danger" @click="handleDelete(row,$index)">
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="right" label-width="120px" style="margin: 0 50px 0;">
        <el-form-item v-if="dialogStatus == 'create'" label="添加数量" prop="create_num">
          <el-input v-model="temp.create_num" />
        </el-form-item>
        <el-form-item v-if="dialogStatus != 'create'" label="起始ID" prop="start_id">
          <el-input v-model="temp.start_id" />
        </el-form-item>
        <el-form-item v-if="dialogStatus != 'create'" label="结束ID" prop="end_id">
          <el-input v-model="temp.end_id" />
        </el-form-item>
        <el-form-item v-if="dialogStatus != 'delete' && dialogStatus != 'export'" label="批次选择" prop="info_id">
          <el-select v-model="temp.info_id" placeholder="请选择">
            <el-option v-for="item in selectOptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button v-if="dialogStatus != 'delete' && dialogStatus != 'export'" type="primary" @click="dialogStatus==='create'?createData():updateData()">
          确定
        </el-button>
        <el-button v-if="dialogStatus == 'delete'" type="danger" @click="sureBatchDelete">
          删除
        </el-button>
        <el-button v-if="dialogStatus == 'export'" type="primary" @click="sureBatchExport">
          确定
        </el-button>

      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel" />
        <el-table-column prop="pv" label="Pv" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { MessageBox } from 'element-ui'
import { fetchList, fetchInfoList, fetchPv, createArticle, updateArticle, delArticle, exportArticle } from '@/api/qrcode'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import Qrcode from '@/components/Qrcode'

const calendarTypeOptions = [
  { key: 'CN', display_name: 'China' },
  { key: 'US', display_name: 'USA' },
  { key: 'JP', display_name: 'Japan' },
  { key: 'EU', display_name: 'Eurozone' }
]

// arr to obj, such as { CN : "China", US : "USA" }
const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'ComplexTable',
  components: { Pagination, Qrcode },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        1: 'success',
        0: 'danger'
      }
      return statusMap[status]
    },
    typeFilter(type) {
      return calendarTypeKeyValue[type]
    }
  },
  data() {
    return {
      domain:process.env.VUE_APP_BASE_API,
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20,
        importance: undefined,
        name: undefined,
        type: undefined,
        sort: '+id'
      },
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      sortOptions: [{ label: 'ID Ascending', key: '+id' }, { label: 'ID Descending', key: '-id' }],
      statusOptions: ['异常', '正常'],
      showReviewer: false,
      temp: {
        id: undefined,
        create_num: 1,
        start_id: 0,
        end_id: 0,
        info_id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        type: '',
        serial_number: '',
        check_data: new Date(),
        next_check_data: new Date(),
        pepole: '',
        status: 1
      },
      selectOptions: [//info选项
      ],
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        export: '导出',
        delete: '删除',
        update: '编辑',
        create: '添加'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        name: [{ required: true, message: '样品名称不能为空', trigger: 'blur' }],
        type: [{ required: true, message: '规格型号不能为空', trigger: 'blur' }],
        serial_number: [{ required: true, message: '样品编号不能为空', trigger: 'blur' }],
        check_data: [{ type: 'date', required: true, message: '检验日期不能为空', trigger: 'change' }],
        next_check_data: [{ type: 'date', required: true, message: '下次检验日期不能为空', trigger: 'change' }],
        pepole: [{ required: true, message: '检验员不能为空', trigger: 'blur' }],
        create_num: [{ required: true, message: '添加数量不能为空', trigger: 'blur' }],
        start_id: [{ required: true, message: '起始id不能为空', trigger: 'blur' }],
        end_id: [{ required: true, message: '结束id不能为空', trigger: 'blur' }],
        info_id: [{ required: true, message: '请选择批次', trigger: 'blur' }],
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList();
    this.getInfo();
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchList(this.listQuery).then(response => {
        this.list = response.data.rows
        this.total = response.data.count

        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },
    getInfo() {
      fetchInfoList({
        limit: 1000,
        page: 1
      }).then(response => {
        console.log(response.data)
        response.data.rows.forEach(item => {
          this.selectOptions.push({
            label: `No.${item.id} | ${item.name} | ${item.type} | ${item.serial_number} | ${item.serial_number} | ${['异常', '正常'][item.status]} | ${item.pepole}`,
            value: item.id,
          })
        });
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作Success',
        type: 'success'
      })
      row.status = status
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        create_num: 1,
        start_id: 0,
        end_id: 0,
        info_id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        type: '',
        serial_number: '',
        check_data: new Date(),
        next_check_data: new Date(),
        pepole: '',
        status: 1
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    handleBatchDelete() {
      this.resetTemp()
      this.dialogStatus = 'delete'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    handleBatchExport() {
      this.resetTemp()
      this.dialogStatus = 'export'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    sureBatchDelete() {
      const tempData = Object.assign({}, this.temp)
      MessageBox.confirm('删除后无法恢复！确定要删除吗', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        delArticle(tempData).then(() => {
          this.dialogFormVisible = false
          this.$notify({
            title: '成功',
            message: '删除成功',
            type: 'success',
            duration: 2000
          })
          this.getList();
        })
      })
    },
    sureBatchExport() {
      const tempData = Object.assign({}, this.temp)
      exportArticle(tempData).then((res) => {
         console.log(res)
         window.open(this.domain + '/public/exports/' + res.data.filename, '_blank');
        this.dialogFormVisible = false
        this.$notify({
          title: '成功',
          message: '导出成功',
          type: 'success',
          duration: 2000
        })
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          console.log(this.temp);
          if (typeof this.temp.check_data === 'object') {
            this.temp.check_data = this.temp.check_data.getTime();
          }
          if (typeof this.temp.next_check_data === 'object') {
            this.temp.next_check_data = this.temp.next_check_data.getTime();
          }
          createArticle(this.temp).then(() => {
            this.getList();
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Created Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.temp.timestamp = new Date(this.temp.timestamp)
      this.temp.start_id = this.temp.id
      this.temp.end_id = this.temp.id
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          tempData.timestamp = +new Date(tempData.timestamp) // change Thu Nov 30 2017 16:41:05 GMT+0800 (CST) to 1512031311464
          console.log(tempData);
          updateArticle(tempData).then(() => {
            this.getList();
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDelete(row, index) {
      row.start_id = row.id
      row.end_id = row.id
      MessageBox.confirm('删除后无法恢复！确定要删除吗', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        delArticle(row).then(() => {
          this.$notify({
            title: '成功',
            message: '删除成功',
            type: 'success',
            duration: 2000
          })
          this.list.splice(index, 1)
        })
      })
    },
    handleFetchPv(pv) {
      fetchPv(pv).then(response => {
        this.pvData = response.data.pvData
        this.dialogPvVisible = true
      })
    },
    handleDownload() {
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = ['timestamp', 'title', 'type', 'importance', 'status']
        const filterVal = ['timestamp', 'title', 'type', 'importance', 'status']
        const data = this.formatJson(filterVal)
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: 'table-list'
        })
        this.downloadLoading = false
      })
    },
    formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          return parseTime(v[j])
        } else {
          return v[j]
        }
      }))
    },
    getSortClass: function (key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    }
  }
}
</script>
<style>
.qr-code-box {
  position: relative;
  height: 50px;
}
.qr-code-box canvas.qrcode-img {
  width: 50px !important;
  height: 50px !important;
}
.qr-code-box canvas.qrcode-img.big {
  width: 200px !important;
  height: 200px !important;
  position: absolute;
  top: 0;
  left: 60px;
  z-index: 999999;
  display: none;
}
.qr-code-box:hover canvas.qrcode-img.big {
  display: block;
}
.el-table__body-wrapper,
.el-table,
.el-table .cell {
  overflow: visible;
}
.el-select {
  min-width: 100%;
}
</style>