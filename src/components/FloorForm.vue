<template>
  <div class="floor-form-container">
    <div class="floor-form-card">
      <!-- 标题 / Title -->
      <h1 class="floor-form-title">Create New Floor</h1>

      <!-- 返回按钮 / Back Button -->
      <div class="back-button-container">
        <button @click="goBack" class="back-button">
          ← Back to Map
        </button>
      </div>

      <!-- 表单区域 / Form Section -->
      <form @submit.prevent="submitForm" class="form-section">
        <!-- 楼层名称 / Floor Name -->
        <div class="form-group">
          <label for="floor-name" class="form-label">
            Floor Name (楼层名称) *
          </label>
          <input
            id="floor-name"
            v-model="formData.name"
            type="text"
            placeholder="e.g., Ground Floor, First Floor"
            class="form-input"
            required
          />
          <span class="form-help">Give your floor a descriptive name</span>
        </div>

        <!-- 楼层编号 / Floor Number -->
        <div class="form-group">
          <label for="floor-number" class="form-label">
            Floor Number (楼层编号) *
          </label>
          <input
            id="floor-number"
            v-model.number="formData.number"
            type="number"
            placeholder="e.g., 1, 2, 3"
            class="form-input"
            required
          />
          <span class="form-help">Numeric identifier for the floor</span>
        </div>

        <!-- 维度信息 / Dimensions Section -->
        <div class="form-section-title">Floor Dimensions (楼层尺寸)</div>

        <div class="form-row">
          <!-- X维度 (宽度) / X Dimension (Width) -->
          <div class="form-group">
            <label for="dimension-x" class="form-label">
              Width (X Dimension - 宽度) *
            </label>
            <input
              id="dimension-x"
              v-model.number="formData.dimensionX"
              type="number"
              min="1"
              max="50"
              placeholder="e.g., 10"
              class="form-input"
              required
            />
            <span class="form-help">Grid width (1-50)</span>
          </div>

          <!-- Y维度 (高度) / Y Dimension (Height) -->
          <div class="form-group">
            <label for="dimension-y" class="form-label">
              Height (Y Dimension - 高度) *
            </label>
            <input
              id="dimension-y"
              v-model.number="formData.dimensionY"
              type="number"
              min="1"
              max="50"
              placeholder="e.g., 10"
              class="form-input"
              required
            />
            <span class="form-help">Grid height (1-50)</span>
          </div>
        </div>

        <!-- 预览区 / Preview Section -->
        <div class="preview-section">
          <h3 class="preview-title">Preview (预览)</h3>
          <div class="preview-content">
            <p><strong>Floor Name:</strong> {{ formData.name || 'Not set' }}</p>
            <p><strong>Floor Number:</strong> {{ formData.number || 'Not set' }}</p>
            <p><strong>Grid Size:</strong> {{ formData.dimensionX }} × {{ formData.dimensionY }} cells</p>
            <p><strong>Total Cells:</strong> {{ formData.dimensionX * formData.dimensionY }} cells</p>
          </div>
        </div>

        <!-- 提交按钮 / Submit Buttons -->
        <div class="form-buttons">
          <button type="submit" class="submit-button" :disabled="!isFormValid">
            Create Floor
          </button>
          <button type="button" @click="resetForm" class="reset-form-button">
            Reset Form
          </button>
        </div>

        <!-- 验证消息 / Validation Message -->
        <p v-if="!isFormValid" class="validation-error">
          ⚠️ Please fill all required fields and ensure dimensions are between 1-50
        </p>

        <!-- 提交结果 / Submission Result -->
        <div v-if="submitMessage" :class="['submit-message', submitMessage.type]">
          {{ submitMessage.text }}
        </div>
      </form>

      <!-- JSON预览 / JSON Preview -->
      <div class="json-preview">
        <h3 class="json-preview-title">Request Payload (将要发送的数据 / JSON Preview)</h3>
        <div class="json-content">
          <pre>{{ JSON.stringify(generatePayload(), null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 定义发射事件 / Define emitted events
const emit = defineEmits(['create-floor', 'back']);

// 表单数据 / Form data
const formData = ref({
  name: '',
  number: 1,
  dimensionX: 10,
  dimensionY: 10,
  mapId: 1 // 假设mapId为1 / Assume mapId is 1
});

// 提交消息 / Submission message
const submitMessage = ref(null);

// 验证表单 / Validate form
const isFormValid = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.number > 0 &&
    formData.value.dimensionX >= 1 && formData.value.dimensionX <= 50 &&
    formData.value.dimensionY >= 1 && formData.value.dimensionY <= 50
  );
});

// 生成API负载 / Generate API payload
const generatePayload = () => {
  return {
    name: formData.value.name,
    number: formData.value.number,
    dimensionX: formData.value.dimensionX,
    dimensionY: formData.value.dimensionY,
    mapId: formData.value.mapId
  };
};

// 提交表单 / Submit form
const submitForm = () => {
  if (!isFormValid.value) return;

  // 模拟API调用 / Simulate API call
  // 在实际应用中，这里会调用 POST /api/floor
  // In actual implementation, this would call POST /api/floor
  const payload = generatePayload();

  // 发射事件 / Emit event with floor data
  emit('create-floor', payload);

  // 显示成功消息 / Show success message
  submitMessage.value = {
    type: 'success',
    text: `✓ Floor "${formData.value.name}" created successfully! (Ready to send to backend)`
  };

  // 3秒后清除消息 / Clear message after 3 seconds
  setTimeout(() => {
    submitMessage.value = null;
  }, 3000);

  // 重置表单 / Reset form
  setTimeout(() => {
    resetForm();
  }, 1500);
};

// 重置表单 / Reset form
const resetForm = () => {
  formData.value = {
    name: '',
    number: 1,
    dimensionX: 10,
    dimensionY: 10,
    mapId: 1
  };
  submitMessage.value = null;
};

// 返回上一页 / Go back
const goBack = () => {
  emit('back');
};
</script>

<style scoped>
.floor-form-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.floor-form-card {
  background-color: #1f2937;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  padding: 2.5rem;
  max-width: 600px;
  width: 100%;
  border: 1px solid #374151;
}

.floor-form-title {
  font-size: 2rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1.5rem;
  text-align: center;
}

.back-button-container {
  margin-bottom: 1.5rem;
}

.back-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #60a5fa;
  background-color: transparent;
  border: 1px solid #60a5fa;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.3s;
}

.back-button:hover {
  background-color: #60a5fa;
  color: #1f2937;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e5e7eb;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #374151;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  color: #d1d5db;
  font-size: 0.95rem;
  font-weight: 600;
}

.form-input {
  padding: 0.75rem;
  font-size: 1rem;
  color: white;
  background-color: #374151;
  border: 2px solid #4b5563;
  border-radius: 0.5rem;
  outline: none;
  transition: all 0.3s;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: #453f5c;
}

.form-help {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.preview-section {
  background-color: #374151;
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  border-radius: 0.5rem;
}

.preview-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #60a5fa;
  margin-bottom: 0.75rem;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #d1d5db;
  font-size: 0.9rem;
}

.preview-content p {
  margin: 0;
}

.form-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1.5rem;
}

.submit-button {
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #10b981;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
}

.submit-button:hover:not(:disabled) {
  background-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 15px 20px -3px rgba(16, 185, 129, 0.4);
}

.submit-button:disabled {
  background-color: #6b7280;
  cursor: not-allowed;
  box-shadow: none;
}

.reset-form-button {
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #6b7280;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-form-button:hover {
  background-color: #4b5563;
}

.validation-error {
  color: #fca5a5;
  background-color: #7f1d1d;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid #ef4444;
  font-size: 0.9rem;
}

.submit-message {
  padding: 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-align: center;
}

.submit-message.success {
  background-color: #10b981;
  color: white;
  border-left: 4px solid #059669;
}

.submit-message.error {
  background-color: #ef4444;
  color: white;
  border-left: 4px solid #dc2626;
}

.json-preview {
  margin-top: 2rem;
  background-color: #111827;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #374151;
}

.json-preview-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #60a5fa;
  margin-bottom: 0.75rem;
}

.json-content {
  background-color: #0f172a;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
}

.json-content pre {
  color: #10b981;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-buttons {
    grid-template-columns: 1fr;
  }

  .floor-form-card {
    padding: 1.5rem;
  }
}
</style>