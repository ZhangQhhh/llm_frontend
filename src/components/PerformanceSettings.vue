<template>
  <el-dialog
    v-model="showDialog"
    title="性能设置"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="performance-settings">
      <el-alert
        title="低配模式说明"
        type="info"
        :closable="false"
        class="mb-4"
      >
        <template #default>
          <p>如果您的电脑配置较低或页面卡顿，建议开启低配模式。</p>
          <p>低配模式将自动禁用动画、3D背景等消耗性能的特效。</p>
        </template>
      </el-alert>

      <el-form label-width="140px">
        <el-form-item label="低配模式">
          <el-switch
            v-model="lowPerformanceMode"
            active-text="开启"
            inactive-text="关闭"
          />
          <el-tag v-if="lowPerformanceMode" type="success" size="small" class="ml-2">
            推荐低配电脑
          </el-tag>
        </el-form-item>

        <el-divider />

        <el-form-item label="禁用动画效果">
          <el-switch
            v-model="disableAnimations"
            :disabled="lowPerformanceMode"
          />
        </el-form-item>

        <el-form-item label="禁用3D背景">
          <el-switch
            v-model="disable3DBackground"
            :disabled="lowPerformanceMode"
          />
        </el-form-item>

        <el-form-item label="减少视觉特效">
          <el-switch
            v-model="reduceEffects"
            :disabled="lowPerformanceMode"
          />
        </el-form-item>

        <el-form-item label="简化UI界面">
          <el-switch
            v-model="simplifyUI"
            :disabled="lowPerformanceMode"
          />
        </el-form-item>
      </el-form>

      <el-alert
        v-if="needsReload"
        title="需要刷新页面"
        type="warning"
        :closable="false"
        class="mt-4"
      >
        部分设置需要刷新页面后生效
      </el-alert>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showDialog = false">取消</el-button>
        <el-button v-if="needsReload" type="primary" @click="handleReload">
          刷新页面
        </el-button>
        <el-button v-else type="primary" @click="showDialog = false">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'PerformanceSettings',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const store = useStore();
    const needsReload = ref(false);

    const showDialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    // 使用 computed 从 store 获取当前设置，确保响应式
    const lowPerformanceMode = computed({
      get: () => store.state.performance.lowPerformanceMode,
      set: (value: boolean) => {
        store.commit('performance/setLowPerformanceMode', value);
        needsReload.value = true;
      }
    });
    
    const disableAnimations = computed({
      get: () => store.state.performance.disableAnimations,
      set: (value: boolean) => {
        store.commit('performance/setDisableAnimations', value);
        needsReload.value = true;
      }
    });
    
    const disable3DBackground = computed({
      get: () => store.state.performance.disable3DBackground,
      set: (value: boolean) => {
        store.commit('performance/setDisable3DBackground', value);
        needsReload.value = true;
      }
    });
    
    const reduceEffects = computed({
      get: () => store.state.performance.reduceEffects,
      set: (value: boolean) => {
        store.commit('performance/setReduceEffects', value);
        needsReload.value = true;
      }
    });
    
    const simplifyUI = computed({
      get: () => store.state.performance.simplifyUI,
      set: (value: boolean) => {
        store.commit('performance/setSimplifyUI', value);
        needsReload.value = true;
      }
    });

    const handleReload = () => {
      window.location.reload();
    };

    return {
      showDialog,
      lowPerformanceMode,
      disableAnimations,
      disable3DBackground,
      reduceEffects,
      simplifyUI,
      needsReload,
      handleReload,
    };
  },
});
</script>

<style scoped>
.performance-settings {
  padding: 10px 0;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
