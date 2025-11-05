<template>
  <div class="floor-form-container">
    <div class="floor-form-card">
      <!-- Title -->
      <h1 class="floor-form-title">Create New Floor</h1>

      <!-- Back Button -->
      <div class="back-button-container">
        <button @click="goBack" class="back-button">← Back to Map</button>
      </div>

      <!-- Form Section -->
      <form @submit.prevent="submitForm" class="form-section">
        <!-- Floor Name -->
        <div class="form-group">
          <label for="floor-name" class="form-label"> Floor Name * </label>
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

        <!-- Floor Number -->
        <div class="form-group">
          <label for="floor-number" class="form-label"> Floor Number * </label>
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

        <!-- Dimensions Section -->
        <div class="form-section-title">Floor Dimensions</div>

        <div class="form-row">
          <!-- X Dimension (Width) -->
          <div class="form-group">
            <label for="dimension-x" class="form-label"> Width (X Dimension) * </label>
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

          <!-- Y Dimension (Height) -->
          <div class="form-group">
            <label for="dimension-y" class="form-label"> Height (Y Dimension) * </label>
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

        <!-- Preview Section -->
        <div class="preview-section">
          <h3 class="preview-title">Preview</h3>
          <div class="preview-content">
            <p><strong>Floor Name:</strong> {{ formData.name || 'Not set' }}</p>
            <p><strong>Floor Number:</strong> {{ formData.number || 'Not set' }}</p>
            <p>
              <strong>Grid Size:</strong> {{ formData.dimensionX }} ×
              {{ formData.dimensionY }} cells
            </p>
            <p>
              <strong>Total Cells:</strong> {{ formData.dimensionX * formData.dimensionY }} cells
            </p>
          </div>
        </div>

        <!-- Submit Buttons -->
        <div class="form-buttons">
          <button type="submit" class="submit-button" :disabled="!isFormValid || isSubmitting">
            {{ isSubmitting ? 'Creating…' : 'Create Floor' }}
          </button>
          <button type="button" @click="resetForm" class="reset-form-button">Reset Form</button>
        </div>

        <!-- Validation Message -->
        <p v-if="!isFormValid" class="validation-error">
          ⚠️ Please fill all required fields and ensure dimensions are between 1-50
        </p>

        <!-- Submission Result -->
        <div v-if="submitMessage" :class="['submit-message', submitMessage.type]">
          {{ submitMessage.text }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { createFloor as apiCreateFloor } from '@/api/backend'

// Define emitted events
const emit = defineEmits(['create-floor', 'back'])

// Props
const props = defineProps({
  mapId: { type: Number, default: 1 },
})

// Form data
const formData = ref({
  name: '',
  number: 1,
  dimensionX: 10,
  dimensionY: 10,
  mapId: props.mapId,
})

// Submission message
const submitMessage = ref(null)
const isSubmitting = ref(false)

// Validate form
const isFormValid = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.number > 0 &&
    formData.value.dimensionX >= 1 &&
    formData.value.dimensionX <= 50 &&
    formData.value.dimensionY >= 1 &&
    formData.value.dimensionY <= 50
  )
})

// Submit form
const submitForm = async () => {
  if (!isFormValid.value || isSubmitting.value) return
  isSubmitting.value = true
  submitMessage.value = null

  try {
    const created = await apiCreateFloor({
      name: formData.value.name,
      number: formData.value.number,
      dimensionX: formData.value.dimensionX,
      dimensionY: formData.value.dimensionY,
      mapId: formData.value.mapId,
    })

    // Notify parent with real API response
    emit('create-floor', created)

    submitMessage.value = {
      type: 'success',
      text: `✓ Floor "${created.name}" (id: ${created.id}) created successfully`,
    }

    // Optionally reset the form after a short delay
    setTimeout(() => {
      resetForm()
    }, 1200)
  } catch (err) {
    const msg = err && err.message ? err.message : 'Failed to create floor'
    submitMessage.value = { type: 'error', text: `✕ ${msg}` }
  } finally {
    // Clear message after a while
    setTimeout(() => {
      submitMessage.value = null
    }, 3500)
    isSubmitting.value = false
  }
}

// Reset form
const resetForm = () => {
  formData.value = {
    name: '',
    number: 1,
    dimensionX: 10,
    dimensionY: 10,
    mapId: props.mapId,
  }
  submitMessage.value = null
}

// Go back
const goBack = () => {
  emit('back')
}
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
