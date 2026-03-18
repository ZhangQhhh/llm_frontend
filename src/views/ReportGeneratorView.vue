<template>
  <div class="report-generator-deprecated">
    <el-card class="deprecated-card" shadow="hover">
      <el-result
        icon="warning"
        title="&#27492;&#39029;&#38754;&#24050;&#24323;&#29992;"
        sub-title="&#25253;&#34920;&#29983;&#25104;&#21151;&#33021;&#24050;&#20572;&#27490;&#32500;&#25252;&#65292;&#35831;&#25913;&#29992; Excel &#24037;&#20855;&#39029;&#38754;&#12290;"
      >
        <template #extra>
          <el-button type="primary" @click="goToExcelTool">
            &#21069;&#24448; Excel &#24037;&#20855;
          </el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * @deprecated Use ExcelToolView instead.
 */
import { useRouter } from 'vue-router';

const router = useRouter();

const goToExcelTool = () => {
  router.push('/excel-tool');
};
</script>

<style scoped>
.report-generator-deprecated {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.deprecated-card {
  width: min(100%, 720px);
  border-radius: 20px;
}
</style>
