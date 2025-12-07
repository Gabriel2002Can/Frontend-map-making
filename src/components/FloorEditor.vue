<template>
  <div class="floor-editor-container">
    <div class="floor-editor-card">
      <!-- Back Button -->
      <div class="editor-header">
        <button @click="goBack" class="back-button">← Back to Maps</button>
        <h1 class="editor-title">Floor Editor</h1>
        <div class="header-spacer"></div>
      </div>

      <!-- Floor Information -->
      <div class="floor-info">
        <div class="info-card">
          <span class="info-label">Floor Name:</span>
          <span class="info-value">{{ floor.name }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Floor #:</span>
          <span class="info-value">{{ floor.number }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Size:</span>
          <span class="info-value">{{ floor.dimensionX }}×{{ floor.dimensionY }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Total:</span>
          <span class="info-value">{{ totalCells }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Filled:</span>
          <span class="info-value highlight-filled">{{ filledCells.length }}</span>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="toolbar-group">
            <label class="zoom-label">Zoom:</label>
            <div class="zoom-controls">
              <button @click="zoomOut" class="zoom-button" :disabled="zoomLevel <= 0.5">−</button>
              <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
              <button @click="zoomIn" class="zoom-button" :disabled="zoomLevel >= 2">+</button>
            </div>
          </div>

          <!-- Edit Mode Indicator -->
          <div class="edit-mode-indicator" v-if="currentEditMode !== 'default'">
            <span class="mode-dot" :class="currentEditMode"></span>
            <span class="mode-text">{{ editModeLabel }}</span>
          </div>
        </div>

        <div class="toolbar-right">
          <div class="toolbar-group quick-actions">
            <button
              @click="fillAll"
              class="action-button fill-all"
              :disabled="isSaving || currentEditMode !== 'default'"
              title="Fill all cells"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6H9z" fill="currentColor" />
              </svg>
              Fill All
            </button>
            <button
              @click="clearAll"
              class="action-button clear-all"
              :disabled="isSaving || currentEditMode !== 'default'"
              title="Clear all cells, icons, and room assignments"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
              Clear All
            </button>
          </div>
        </div>
      </div>

      <!-- Selection Control Panel -->
      <transition name="slide-down">
        <div
          v-if="selectedArea.size > 0 && !roomAssignmentMode && !iconAssignmentMode"
          class="selection-control-panel"
        >
          <div class="selection-info">
            <div class="selection-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 12h8" />
              </svg>
              <span class="selection-count">{{ selectedArea.size }}</span>
            </div>
            <div class="selection-text-group">
              <span class="selection-text">cells selected</span>
              <span class="selection-hint">Drag to select more • Right-click to clear cell</span>
            </div>
          </div>
          <div class="selection-actions">
            <button
              @click="fillSelectedArea"
              class="action-btn fill-btn"
              title="Fill selected cells (Enter)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6H9z" fill="currentColor" />
              </svg>
              Fill
              <span class="kbd-hint">↵</span>
            </button>
            <button
              @click="clearSelectedArea"
              class="action-btn clear-btn"
              title="Clear selected cells (Delete)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
              Clear
              <span class="kbd-hint">Del</span>
            </button>
            <button
              @click="cancelSelection"
              class="action-btn cancel-btn"
              title="Cancel selection (Escape)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Cancel
              <span class="kbd-hint">Esc</span>
            </button>
          </div>
        </div>
      </transition>

      <!-- Room Assignment Control Panel -->
      <transition name="slide-down">
        <div v-if="roomAssignmentMode" class="room-assignment-panel">
          <div class="assignment-info">
            <span
              class="assignment-color"
              :style="{
                backgroundColor: rooms.find((r) => r.id === activeRoomId)?.color || '#3b82f6',
              }"
            ></span>
            <div class="assignment-text-group">
              <span class="assignment-text">
                <strong>Assigning:</strong>
                {{ rooms.find((r) => r.id === activeRoomId)?.name || 'Unknown' }}
              </span>
              <span class="assignment-hint">
                Click filled cells to assign • {{ selectedArea.size }} cells selected
              </span>
            </div>
          </div>
          <div class="assignment-actions">
            <button
              @click="saveRoomAssignment"
              class="action-btn save-assign-btn"
              title="Save room assignment"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
              </svg>
              Save
            </button>
            <button
              @click="cancelRoomAssignment"
              class="action-btn cancel-btn"
              title="Cancel (Escape)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Cancel
              <span class="kbd-hint">Esc</span>
            </button>
          </div>
        </div>
      </transition>

      <!-- Editing Area -->
      <div class="editor-wrapper" :class="`device-${deviceType}`">
        <!-- Grid -->
        <div class="grid-wrapper">
          <div v-if="isLoadingCells" class="loading-overlay">Loading cells…</div>
          <div
            class="grid-container"
            :style="gridStyle"
            @mouseleave="handleMouseLeave"
            @mouseup="handleMouseUp"
          >
            <div
              v-for="cell in allCells"
              :key="`${cell.x}-${cell.y}`"
              :class="getCellClass(cell)"
              :style="getCellBorderStyle(cell)"
              @mousedown="handleMouseDown(cell, $event)"
              @mouseenter="handleCellMouseEnter(cell, $event)"
              @mousemove="handleCellMouseMove(cell, $event)"
              @mouseleave="handleCellMouseLeave"
              @contextmenu.prevent="handleCellRightClick(cell, $event)"
            >
              <span class="cell-text">{{ cell.x + 1 }},{{ cell.y + 1 }}</span>
              <span
                v-if="getCellIcon(cell)"
                class="cell-icon"
                v-html="getCellIcon(cell).svg"
              ></span>
            </div>
          </div>

          <!-- Custom Room Tooltip -->
          <transition name="tooltip-fade">
            <div v-if="tooltipVisible && tooltipRoom" class="room-tooltip" :style="tooltipStyle">
              <span class="tooltip-color" :style="{ backgroundColor: tooltipRoom.color }"></span>
              <span class="tooltip-name">{{ tooltipRoom.name }}</span>
            </div>
          </transition>
        </div>

        <!-- Right Panel -->
        <div v-if="deviceType === 'desktop'" class="editor-sidebar">
          <!-- Filled Cells List -->
          <div class="filled-cells-section">
            <h3 class="section-title">Filled Cells {{ filledCells.length }}/{{ totalCells }}</h3>
            <div class="filled-cells-list">
              <div v-if="filledCells.length === 0" class="empty-state">
                <p>No cells filled</p>
              </div>
              <div v-else class="cells-tags">
                <span
                  v-for="(cell, idx) in filledCells"
                  :key="idx"
                  class="cell-tag"
                  @click="removeCell(cell)"
                >
                  ({{ cell.x + 1 }}, {{ cell.y + 1 }}) ✕
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile summary -->
        <div v-else class="mobile-summary">
          <div class="summary-card">
            <span class="summary-label">Filled:</span>
            <span class="summary-value">{{ filledCells.length }} / {{ totalCells }}</span>
          </div>
        </div>
      </div>

      <!-- Room Manager -->
      <div class="room-manager-card">
        <div class="room-manager-header">
          <div class="room-header-left">
            <h3 class="section-title">
              <svg
                class="room-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Room Manager
            </h3>
            <p class="room-subtitle">Define and organize spaces on this floor</p>
          </div>
          <div class="room-header-stats">
            <span class="room-stat">
              <span class="stat-number">{{ rooms.length }}</span>
              <span class="stat-label">Rooms</span>
            </span>
            <span class="room-stat">
              <span class="stat-number">{{ totalAssignedCells }}</span>
              <span class="stat-label">Assigned</span>
            </span>
          </div>
        </div>

        <div class="room-columns">
          <!-- Room List -->
          <div class="room-list-section">
            <div class="room-list-header">
              <span class="list-title">Your Rooms</span>
              <button
                v-if="rooms.length > 0"
                type="button"
                class="collapse-all-btn"
                @click="collapseAllRooms"
              >
                {{ expandedRooms.size > 0 ? 'Collapse All' : 'Expand All' }}
              </button>
            </div>

            <div ref="roomListRef" class="room-list" v-if="rooms.length > 0">
              <div
                v-for="room in rooms"
                :key="room.id || room.name"
                :ref="el => setRoomCardRef(room.id, el)"
                class="room-card"
                :class="{
                  'room-card-expanded': expandedRooms.has(room.id),
                  'room-card-editing': selectedRoomId === room.id,
                  'room-card-assigning': activeRoomId === room.id,
                }"
              >
                <div class="room-card-header" @click="toggleRoomExpand(room.id)">
                  <div class="room-card-left">
                    <span
                      class="room-color-indicator"
                      :style="{ backgroundColor: room.color || '#3b82f6' }"
                    ></span>
                    <div class="room-card-info">
                      <div class="room-card-name">{{ room.name || 'Untitled room' }}</div>
                      <div class="room-card-meta">
                        <span class="room-cell-count">{{ getRoomCellCount(room.id) }} cells</span>
                        <span v-if="activeRoomId === room.id" class="room-status-badge assigning"
                          >Assigning</span
                        >
                        <span
                          v-else-if="selectedRoomId === room.id"
                          class="room-status-badge editing"
                          >Editing</span
                        >
                      </div>
                    </div>
                  </div>
                  <button class="room-expand-btn" :class="{ expanded: expandedRooms.has(room.id) }">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

                <transition name="expand">
                  <div v-if="expandedRooms.has(room.id)" class="room-card-body">
                    <p class="room-card-desc">
                      {{ room.description || 'No description provided' }}
                    </p>
                    <div class="room-card-actions">
                      <button
                        type="button"
                        class="room-action-btn assign"
                        :class="{ active: activeRoomId === room.id }"
                        @click.stop="activateRoomAssignment(room)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        {{ activeRoomId === room.id ? 'Assigning...' : 'Assign Cells' }}
                      </button>
                      <button
                        type="button"
                        class="room-action-btn edit"
                        @click.stop="startEditRoom(room)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        type="button"
                        class="room-action-btn delete"
                        :disabled="isRoomSaving"
                        @click.stop="confirmDeleteRoom(room)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <div v-else class="empty-room-state">
              <svg
                class="empty-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="3" y1="9" x2="21" y2="9" />
              </svg>
              <p class="empty-title">No rooms yet</p>
              <p class="empty-hint">Create your first room using the form</p>
            </div>
          </div>

          <!-- Room Form -->
          <div class="room-form-section">
            <div class="room-form-header">
              <span class="form-title">{{ selectedRoomId ? 'Edit Room' : 'Create New Room' }}</span>
              <button
                v-if="selectedRoomId"
                type="button"
                class="form-cancel-btn"
                @click="resetRoomForm"
              >
                Cancel Edit
              </button>
            </div>

            <form class="room-form" @submit.prevent="submitRoom">
              <div class="form-group">
                <label class="form-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7" />
                    <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                    <path d="M3 7l9-4 9 4" />
                  </svg>
                  Room Name
                </label>
                <input
                  class="form-input"
                  v-model="roomForm.name"
                  type="text"
                  placeholder="e.g., Living Room, Kitchen, Office..."
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  Color
                </label>
                <div class="color-picker-row">
                  <input class="color-picker" v-model="roomForm.color" type="color" />
                  <div class="color-presets">
                    <button
                      v-for="color in colorPresets"
                      :key="color"
                      type="button"
                      class="color-preset"
                      :class="{ selected: roomForm.color === color }"
                      :style="{ backgroundColor: color }"
                      @click="roomForm.color = color"
                    ></button>
                  </div>
                  <input
                    class="color-text-input"
                    v-model="roomForm.color"
                    type="text"
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="17" y1="10" x2="3" y2="10" />
                    <line x1="21" y1="6" x2="3" y2="6" />
                    <line x1="21" y1="14" x2="3" y2="14" />
                    <line x1="17" y1="18" x2="3" y2="18" />
                  </svg>
                  Description <span class="optional-tag">(optional)</span>
                </label>
                <textarea
                  class="form-textarea"
                  v-model="roomForm.description"
                  rows="2"
                  placeholder="What is this room used for?"
                ></textarea>
              </div>

              <div class="form-actions">
                <button type="submit" class="submit-btn" :disabled="isRoomSaving">
                  <svg
                    v-if="!isRoomSaving"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      v-if="selectedRoomId"
                      d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                    />
                    <polyline v-if="selectedRoomId" points="17 21 17 13 7 13 7 21" />
                    <polyline v-if="selectedRoomId" points="7 3 7 8 15 8" />
                    <circle v-if="!selectedRoomId" cx="12" cy="12" r="10" />
                    <line v-if="!selectedRoomId" x1="12" y1="8" x2="12" y2="16" />
                    <line v-if="!selectedRoomId" x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span v-if="isRoomSaving" class="spinner"></span>
                  {{ isRoomSaving ? 'Saving...' : selectedRoomId ? 'Save Changes' : 'Create Room' }}
                </button>
                <button
                  type="button"
                  class="reset-btn"
                  :disabled="isRoomSaving"
                  @click="resetRoomForm"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                  Clear
                </button>
              </div>

              <transition name="message-fade">
                <div v-if="roomMessage" :class="['form-message', roomMessage.type]">
                  <svg
                    v-if="roomMessage.type === 'success'"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {{ roomMessage.text }}
                </div>
              </transition>
            </form>
          </div>
        </div>
      </div>

      <!-- Icon Manager -->
      <div class="icon-manager-card">
        <div class="icon-manager-header">
          <div class="icon-header-left">
            <h3 class="section-title">
              <svg
                class="icon-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Icon Manager
            </h3>
            <p class="icon-subtitle">Add icons to filled cells (stairs, elevators, doors, etc.)</p>
          </div>
          <div class="icon-header-actions">
            <button
              v-if="cellIcons.size > 0"
              class="clear-icons-btn"
              @click="clearAllIcons"
              title="Clear all icons"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                />
              </svg>
              Clear All
            </button>
            <span class="icon-stat">
              <span class="stat-number">{{ cellIcons.size }}</span>
              <span class="stat-label">Icons</span>
            </span>
          </div>
        </div>

        <!-- Icon Assignment Control Panel -->
        <transition name="slide-down">
          <div v-if="iconAssignmentMode" class="icon-assignment-panel">
            <div class="assignment-info">
              <span
                class="assignment-icon"
                v-html="iconOptions.find((i) => i.value === selectedIconType)?.svg"
              ></span>
              <div class="assignment-text-group">
                <span class="assignment-text">
                  <strong>Placing:</strong> {{ getIconLabel(selectedIconType) }}
                </span>
                <span class="assignment-hint">
                  Click filled cells to add/remove • Right-click to remove icon
                </span>
              </div>
            </div>
            <div class="assignment-actions">
              <button
                @click="cancelIconAssignment"
                class="action-btn done-btn"
                title="Done (Escape)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Done
                <span class="kbd-hint">Esc</span>
              </button>
            </div>
          </div>
        </transition>

        <div class="icon-grid">
          <button
            v-for="iconOption in iconOptions"
            :key="iconOption.value"
            :class="[
              'icon-btn',
              { active: iconAssignmentMode && selectedIconType === iconOption.value },
            ]"
            @click="startIconAssignment(iconOption.value)"
            :title="`Place ${iconOption.label} icon`"
          >
            <span class="icon-symbol" v-html="iconOption.svg"></span>
            <span class="icon-label">{{ iconOption.label }}</span>
            <span v-if="getIconCount(iconOption.value) > 0" class="icon-count-badge">
              {{ getIconCount(iconOption.value) }}
            </span>
          </button>
        </div>

        <div v-if="cellIcons.size > 0" class="icon-summary">
          <div class="summary-header">
            <span class="summary-title">Placed Icons</span>
            <span class="summary-total">{{ cellIcons.size }} total</span>
          </div>
          <div class="icon-tags">
            <div
              v-for="iconOption in iconOptions"
              :key="iconOption.value"
              class="icon-tag-item"
              v-show="getIconCount(iconOption.value) > 0"
            >
              <span v-html="iconOption.svg" class="tag-icon"></span>
              <span class="tag-label">{{ iconOption.label }}</span>
              <span class="tag-count">{{ getIconCount(iconOption.value) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="icon-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <p>No icons placed yet</p>
          <span>Select an icon above and click on filled cells to place it</span>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <transition name="modal-fade">
        <div v-if="deleteConfirmRoom" class="modal-overlay" @click.self="deleteConfirmRoom = null">
          <div class="delete-modal">
            <div class="modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 class="modal-title">Delete Room?</h3>
            <p class="modal-text">
              Are you sure you want to delete <strong>{{ deleteConfirmRoom?.name }}</strong
              >? This will also remove all cell assignments for this room.
            </p>
            <div class="modal-actions">
              <button class="modal-btn cancel" @click="deleteConfirmRoom = null">Cancel</button>
              <button class="modal-btn confirm" @click="executeDeleteRoom">Delete Room</button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Bottom Buttons -->
      <div class="editor-footer">
        <button @click="saveChanges" class="save-button" :disabled="isSaving">
          <span v-if="isSaving">Saving...</span>
          <span v-else>Save Changes</span>
        </button>
        <button @click="goBack" class="cancel-button">Go Back</button>
      </div>

      <!-- Action Message -->
      <transition name="fade">
        <div v-if="actionMessage" :class="['action-message', actionMessage.type]">
          {{ actionMessage.text }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  createRoom,
  editRoom,
  getRoomsByFloorId,
  getFloorById,
  deleteRoom,
  IconType,
} from '@/api/backend'

// Define emitted events
const emit = defineEmits(['save-cells', 'back'])

// Receive props
const props = defineProps({
  floor: {
    type: Object,
    required: true,
  },
})

// Reactive data
const zoomLevel = ref(1)
const isSaving = ref(false)
const isLoadingCells = ref(false)
const actionMessage = ref(null)
const filledCellsData = ref([])
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

// Rooms state
const rooms = ref(Array.isArray(props.floor.rooms) ? props.floor.rooms : [])
const roomForm = ref({
  name: '',
  color: '#2563eb',
  description: '',
})
const selectedRoomId = ref(null)
const roomMessage = ref(null)
const isRoomSaving = ref(false)

// Room assignment state
const activeRoomId = ref(null) // Room being assigned to cells
const roomAssignmentMode = ref(false) // Whether we're in room assignment mode
const cellsWithRooms = ref(new Map()) // Map of 'x-y' -> roomId
const cellIcons = ref(new Map()) // Map of 'x-y' -> IconType value

// Icon assignment state
const iconAssignmentMode = ref(false)
const selectedIconType = ref(null)

// Selection state
const isSelecting = ref(false)
const isDragging = ref(false)
const selectedArea = ref(new Set())
const selectionStart = ref(null)
const mouseDownCell = ref(null)
const dragThreshold = 5
const mouseDownPosition = ref({ x: 0, y: 0 })
const currentDragArea = ref(new Set())

// Tooltip state
const tooltipVisible = ref(false)
const tooltipRoom = ref(null)
const tooltipCell = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })
let tooltipTimeout = null

// UI state for room manager
const expandedRooms = ref(new Set())
const roomListRef = ref(null)
const roomCardRefs = ref(new Map())

const setRoomCardRef = (roomId, el) => {
  if (el) {
    roomCardRefs.value.set(roomId, el)
  } else {
    roomCardRefs.value.delete(roomId)
  }
}
const deleteConfirmRoom = ref(null)

// Color presets for room form
const colorPresets = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
]

// Icon options with SVG symbols
const iconOptions = [
  {
    value: IconType.Stairs,
    label: 'Stairs',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4v-4h4v-4h4v-4h4"/></svg>',
  },
  {
    value: IconType.Elevator,
    label: 'Elevator',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><polyline points="8 12 12 8 16 12"/><polyline points="8 12 12 16 16 12"/></svg>',
  },
  {
    value: IconType.Door,
    label: 'Door',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="1"/><circle cx="15" cy="12" r="1.5"/></svg>',
  },
  {
    value: IconType.Toilet,
    label: 'Toilet',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="17" cy="7" r="3"/><path d="M21 21v-2a3 3 0 0 0-3-3h-1"/></svg>',
  },
]

// Icon helper functions
const getIconLabel = (iconType) => {
  const option = iconOptions.find((opt) => opt.value === iconType)
  return option ? option.label : 'Unknown'
}

const getIconCount = (iconType) => {
  let count = 0
  cellIcons.value.forEach((value) => {
    if (value === iconType) count++
  })
  return count
}

const startIconAssignment = (iconType) => {
  if (iconAssignmentMode.value && selectedIconType.value === iconType) {
    // Toggle off if clicking same icon
    cancelIconAssignment()
    return
  }
  selectedIconType.value = iconType
  iconAssignmentMode.value = true
  showMessage(`Icon mode: ${getIconLabel(iconType)}. Click cells to add/remove.`, 'info')
}

const cancelIconAssignment = () => {
  iconAssignmentMode.value = false
  selectedIconType.value = null
}

const toggleCellIcon = (cell) => {
  if (!iconAssignmentMode.value || selectedIconType.value == null) return

  // Validate: only allow icons on filled cells
  const isFilled = isCellFilled(cell)
  if (!isFilled) {
    showMessage('Icons can only be placed on filled cells', 'error')
    return
  }

  const cellKey = `${cell.x}-${cell.y}`
  const currentIcon = cellIcons.value.get(cellKey)

  if (currentIcon === selectedIconType.value) {
    // Remove icon if same type
    const newCellIcons = new Map(cellIcons.value)
    newCellIcons.delete(cellKey)
    cellIcons.value = newCellIcons
    showMessage(`Removed ${getIconLabel(selectedIconType.value)} icon`, 'info')
  } else {
    // Set or replace icon
    const newCellIcons = new Map(cellIcons.value)
    newCellIcons.set(cellKey, selectedIconType.value)
    cellIcons.value = newCellIcons
    const action = currentIcon != null ? 'Replaced with' : 'Added'
    showMessage(`${action} ${getIconLabel(selectedIconType.value)} icon`, 'success')
  }
}

const getCellIcon = (cell) => {
  const cellKey = `${cell.x}-${cell.y}`
  const iconType = cellIcons.value.get(cellKey)
  if (iconType == null) return null
  return iconOptions.find((opt) => opt.value === iconType)
}

// Initialize filled cells from props (fallback)
if (props.floor.cells && Array.isArray(props.floor.cells)) {
  filledCellsData.value = props.floor.cells.filter((cell) => cell.isFilled)
}

const syncRoomsFromPayload = (floorPayload, options = { resetIfMissing: false }) => {
  if (floorPayload && Array.isArray(floorPayload.rooms)) {
    rooms.value = floorPayload.rooms
  } else if (options.resetIfMissing) {
    rooms.value = []
  }
}

syncRoomsFromPayload(props.floor, { resetIfMissing: true })

const loadRooms = async (options = { resetOnFailure: false }) => {
  try {
    console.log('Loading rooms for floor:', props.floor.id)
    const roomList = await getRoomsByFloorId(props.floor.id)
    console.log('Received rooms:', roomList)
    if (Array.isArray(roomList)) {
      rooms.value = roomList
      console.log('Rooms set to:', rooms.value)
    } else if (options.resetOnFailure) {
      rooms.value = []
    }
    return true
  } catch (err) {
    console.error('Failed to load rooms:', err)
    if (options.resetOnFailure) {
      rooms.value = []
    }
    roomMessage.value = { text: err?.message || 'Failed to load rooms', type: 'error' }
    return false
  }
}

// Load filled cells from API to ensure we show the persisted state
const loadInitialCells = async () => {
  isLoadingCells.value = true
  try {
    console.log('=== Loading initial data ===')
    const roomsLoaded = await loadRooms({ resetOnFailure: true })
    console.log('Rooms loaded:', roomsLoaded, 'Current rooms count:', rooms.value.length)

    const fullFloor = await getFloorById(props.floor.id)
    if (fullFloor && Array.isArray(fullFloor.cells)) {
      filledCellsData.value = fullFloor.cells
        .filter((c) => c.isFilled)
        .map((c) => ({ x: c.x, y: c.y, isFilled: true }))

      // Load room assignments
      const newCellsWithRooms = new Map()
      const newCellIcons = new Map()
      fullFloor.cells.forEach((c) => {
        if (c.roomId != null) {
          newCellsWithRooms.set(`${c.x}-${c.y}`, c.roomId)
        }
        if (c.icon != null) {
          newCellIcons.set(`${c.x}-${c.y}`, c.icon)
        }
      })
      cellsWithRooms.value = newCellsWithRooms
      cellIcons.value = newCellIcons
      console.log('Loaded room assignments:', cellsWithRooms.value.size, 'cells')
      console.log('Loaded icon assignments:', cellIcons.value.size, 'cells')
    }
  } catch (err) {
    console.error('Failed to load floor cells:', err)
  } finally {
    isLoadingCells.value = false
  }
}

const refreshRoomsFromApi = async () => {
  return loadRooms({ resetOnFailure: false })
}

const upsertLocalRoom = (roomLike) => {
  if (!roomLike) return

  const id = roomLike.id ?? Date.now()
  const existingIdx = rooms.value.findIndex((r) => r.id === id)
  const next = {
    id,
    name: roomLike.name || 'Untitled room',
    color: roomLike.color || '#2563eb',
    description: roomLike.description || '',
    floorId: roomLike.floorId ?? props.floor.id,
  }

  if (existingIdx >= 0) {
    rooms.value.splice(existingIdx, 1, next)
  } else {
    rooms.value.push(next)
  }
}

const resetRoomForm = (clearMessage = true) => {
  selectedRoomId.value = null
  roomForm.value = {
    name: '',
    color: '#2563eb',
    description: '',
  }
  if (clearMessage) {
    roomMessage.value = null
  }
}

const startEditRoom = (room) => {
  if (!room || room.id == null) {
    roomMessage.value = { text: 'Room id is required to edit.', type: 'error' }
    return
  }

  selectedRoomId.value = room.id
  roomForm.value = {
    name: room.name || '',
    color: room.color || '#2563eb',
    description: room.description || '',
  }
  roomMessage.value = null
}

const activateRoomAssignment = (room) => {
  if (!room || room.id == null) {
    roomMessage.value = { text: 'Room id is required to assign cells.', type: 'error' }
    return
  }

  activeRoomId.value = room.id
  roomAssignmentMode.value = true
  selectedArea.value.clear()

  // Pre-select cells that already belong to this room
  cellsWithRooms.value.forEach((roomId, cellKey) => {
    if (roomId === room.id) {
      selectedArea.value.add(cellKey)
    }
  })

  showMessage(`Room assignment mode: ${room.name}. Select cells to assign/unassign.`, 'info')
}

const cancelRoomAssignment = () => {
  activeRoomId.value = null
  roomAssignmentMode.value = false
  selectedArea.value.clear()
  showMessage('Room assignment cancelled', 'info')
}

const saveRoomAssignment = () => {
  if (!activeRoomId.value) return

  // Update cellsWithRooms map based on selection
  const activeRoom = rooms.value.find((r) => r.id === activeRoomId.value)

  if (!activeRoom) {
    roomMessage.value = { text: 'Active room not found', type: 'error' }
    return
  }

  // Remove all previous assignments for this room
  const newCellsWithRooms = new Map()
  cellsWithRooms.value.forEach((roomId, cellKey) => {
    if (roomId !== activeRoomId.value) {
      newCellsWithRooms.set(cellKey, roomId)
    }
  })

  // Add new assignments from selection
  selectedArea.value.forEach((cellKey) => {
    newCellsWithRooms.set(cellKey, activeRoomId.value)
  })

  cellsWithRooms.value = newCellsWithRooms

  showMessage(`Assigned ${selectedArea.value.size} cells to ${activeRoom.name}`, 'success')
  cancelRoomAssignment()
}

const submitRoom = async () => {
  if (isRoomSaving.value) return

  const trimmedName = roomForm.value.name ? roomForm.value.name.trim() : ''
  if (!trimmedName) {
    roomMessage.value = { text: 'Room name is required', type: 'error' }
    return
  }

  isRoomSaving.value = true
  roomMessage.value = null

  try {
    const prevRooms = [...rooms.value]

    if (selectedRoomId.value) {
      await editRoom(selectedRoomId.value, {
        name: trimmedName,
        color: roomForm.value.color || '#2563eb',
        description: roomForm.value.description || '',
      })
      roomMessage.value = { text: 'Room updated successfully', type: 'success' }
      upsertLocalRoom({
        id: selectedRoomId.value,
        name: trimmedName,
        color: roomForm.value.color,
        description: roomForm.value.description,
      })
    } else {
      await createRoom({
        name: trimmedName,
        color: roomForm.value.color || '#2563eb',
        description: roomForm.value.description || '',
        floorId: props.floor.id,
      })
      roomMessage.value = { text: 'Room created successfully', type: 'success' }
      upsertLocalRoom({
        name: trimmedName,
        color: roomForm.value.color,
        description: roomForm.value.description,
        floorId: props.floor.id,
      })
      resetRoomForm()
    }

    const refreshed = await refreshRoomsFromApi()
    if (!refreshed) {
      roomMessage.value = {
        text: 'Room saved. Backend did not return rooms list; showing local state.',
        type: 'info',
      }
    }

    // If backend returned an empty list but we had optimistic data, keep it visible and warn
    if (rooms.value.length === 0 && prevRooms.length > 0) {
      rooms.value = prevRooms
      roomMessage.value = {
        text: 'Backend returned no rooms; showing local state. Verify backend persistence.',
        type: 'info',
      }
    }
  } catch (err) {
    roomMessage.value = { text: err?.message || 'Failed to save room', type: 'error' }
  } finally {
    isRoomSaving.value = false
    setTimeout(() => {
      roomMessage.value = null
    }, 3500)
  }
}

// Listen to window size
const handleResize = () => {
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth
  }
}

// Keyboard shortcuts handler
const handleKeyDown = (e) => {
  // Escape key: exit current mode
  if (e.key === 'Escape') {
    if (iconAssignmentMode.value) {
      cancelIconAssignment()
      showMessage('Icon placement cancelled', 'info')
    } else if (roomAssignmentMode.value) {
      cancelRoomAssignment()
      showMessage('Room assignment cancelled', 'info')
    } else if (selectedArea.value.size > 0) {
      cancelSelection()
      showMessage('Selection cleared', 'info')
    }
  }

  // Delete/Backspace: clear selected area
  if (
    (e.key === 'Delete' || e.key === 'Backspace') &&
    selectedArea.value.size > 0 &&
    !iconAssignmentMode.value &&
    !roomAssignmentMode.value
  ) {
    clearSelectedArea()
  }

  // Enter: fill selected area
  if (
    e.key === 'Enter' &&
    selectedArea.value.size > 0 &&
    !iconAssignmentMode.value &&
    !roomAssignmentMode.value
  ) {
    fillSelectedArea()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('keydown', handleKeyDown)
  // Fetch latest cells for this floor
  loadInitialCells()
})

// Keep rooms list in sync if the parent provides a floor with rooms attached
watch(
  () => props.floor,
  (nextFloor) => {
    syncRoomsFromPayload(nextFloor)
  },
  { deep: false },
)

// If the floor ID changes while this component is mounted, reload cells
watch(
  () => props.floor.id,
  () => {
    loadInitialCells()
  },
)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('keydown', handleKeyDown)
})

// Compute device type
// mobile: < 640px
// tablet: 640px - 1024px
// desktop: >= 1024px
const deviceType = computed(() => {
  if (windowWidth.value < 640) return 'mobile'
  if (windowWidth.value < 1024) return 'tablet'
  return 'desktop'
})

// Current edit mode indicator
const currentEditMode = computed(() => {
  if (iconAssignmentMode.value) return 'icon'
  if (roomAssignmentMode.value) return 'room'
  if (selectedArea.value.size > 0) return 'selection'
  return 'default'
})

const editModeLabel = computed(() => {
  switch (currentEditMode.value) {
    case 'icon':
      return `Placing: ${getIconLabel(selectedIconType.value)}`
    case 'room': {
      const room = rooms.value.find((r) => r.id === activeRoomId.value)
      return `Assigning: ${room?.name || 'Room'}`
    }
    case 'selection':
      return `${selectedArea.value.size} cells selected`
    default:
      return ''
  }
})

// Computed properties
const totalCells = computed(() => {
  return props.floor.dimensionX * props.floor.dimensionY
})

const filledCells = computed(() => {
  return filledCellsData.value
})

// Computed: total cells assigned to any room
const totalAssignedCells = computed(() => {
  return cellsWithRooms.value.size
})

// Get cell count for a specific room
const getRoomCellCount = (roomId) => {
  let count = 0
  cellsWithRooms.value.forEach((rid) => {
    if (rid === roomId) count++
  })
  return count
}

// Tooltip style computed
const tooltipStyle = computed(() => {
  return {
    left: `${tooltipPosition.value.x}px`,
    top: `${tooltipPosition.value.y}px`,
  }
})

// Room expansion toggle
const toggleRoomExpand = (roomId) => {
  if (expandedRooms.value.has(roomId)) {
    expandedRooms.value.delete(roomId)
  } else {
    expandedRooms.value.add(roomId)
    // Scroll the room card into view after expansion animation
    setTimeout(() => {
      const cardEl = roomCardRefs.value.get(roomId)
      if (cardEl && roomListRef.value) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 50)
  }
}

const collapseAllRooms = () => {
  if (expandedRooms.value.size > 0) {
    expandedRooms.value.clear()
  } else {
    rooms.value.forEach((r) => expandedRooms.value.add(r.id))
  }
}

// Delete confirmation
const confirmDeleteRoom = (room) => {
  deleteConfirmRoom.value = room
}

const executeDeleteRoom = async () => {
  if (!deleteConfirmRoom.value) return
  const room = deleteConfirmRoom.value
  deleteConfirmRoom.value = null

  if (!room || room.id == null) {
    roomMessage.value = { text: 'Room id is required to delete.', type: 'error' }
    return
  }

  if (isRoomSaving.value) return
  isRoomSaving.value = true

  try {
    await deleteRoom(room.id)
    rooms.value = rooms.value.filter((r) => r.id !== room.id)

    // Remove cell assignments for this room
    const newCellsWithRooms = new Map()
    cellsWithRooms.value.forEach((roomId, cellKey) => {
      if (roomId !== room.id) {
        newCellsWithRooms.set(cellKey, roomId)
      }
    })
    cellsWithRooms.value = newCellsWithRooms

    const refreshed = await refreshRoomsFromApi()
    if (!refreshed) {
      roomMessage.value = {
        text: 'Room deleted successfully',
        type: 'success',
      }
    } else {
      roomMessage.value = { text: 'Room deleted successfully', type: 'success' }
    }
  } catch (err) {
    roomMessage.value = { text: err?.message || 'Failed to delete room', type: 'error' }
  } finally {
    isRoomSaving.value = false
    setTimeout(() => {
      roomMessage.value = null
    }, 3500)
  }
}

// Tooltip handlers
const handleCellMouseEnter = (cell) => {
  handleMouseEnter(cell)

  const room = getCellRoom(cell)
  if (room) {
    clearTimeout(tooltipTimeout)
    tooltipTimeout = setTimeout(() => {
      tooltipRoom.value = room
      tooltipCell.value = cell
      tooltipVisible.value = true
    }, 300)
  }
}

const handleCellMouseMove = (cell, event) => {
  if (tooltipVisible.value || tooltipTimeout) {
    const rect = event.target.closest('.grid-wrapper').getBoundingClientRect()
    tooltipPosition.value = {
      x: event.clientX - rect.left + 15,
      y: event.clientY - rect.top - 10,
    }
  }
}

const handleCellMouseLeave = () => {
  clearTimeout(tooltipTimeout)
  tooltipTimeout = null
  tooltipVisible.value = false
  tooltipRoom.value = null
  tooltipCell.value = null
}

const allCells = computed(() => {
  const cells = []
  const filledMap = new Map(filledCells.value.map((cell) => [`${cell.x}-${cell.y}`, true]))

  for (let y = 0; y < props.floor.dimensionY; y++) {
    for (let x = 0; x < props.floor.dimensionX; x++) {
      cells.push({
        x,
        y,
        isFilled: filledMap.has(`${x}-${y}`),
      })
    }
  }

  return cells
})

//  Key: compute cell size based on device type and grid size (in px)
const gridStyle = computed(() => {
  const cols = props.floor.dimensionX
  const rows = props.floor.dimensionY

  let baseCellSize = 40

  // Adjust base cell size for different device types
  if (deviceType.value === 'mobile') {
    // mobile: prefer showing full grid
    if (rows > 20) {
      baseCellSize = 24
    } else if (rows > 15) {
      baseCellSize = 28
    } else if (rows > 12) {
      baseCellSize = 32
    } else if (rows > 8) {
      baseCellSize = 38
    } else {
      baseCellSize = 44
    }
  } else if (deviceType.value === 'tablet') {
    // tablet: balance visibility and operability
    if (rows > 20) {
      baseCellSize = 34
    } else if (rows > 15) {
      baseCellSize = 42
    } else if (rows > 12) {
      baseCellSize = 50
    } else if (rows > 8) {
      baseCellSize = 60
    } else {
      baseCellSize = 72
    }
  } else {
    // desktop: larger cells for precise editing
    if (rows > 20) {
      baseCellSize = 44
    } else if (rows > 15) {
      baseCellSize = 56
    } else if (rows > 12) {
      baseCellSize = 68
    } else if (rows > 8) {
      baseCellSize = 84
    } else {
      baseCellSize = 100
    }
  }

  // Apply zoom
  const finalCellSize = baseCellSize * zoomLevel.value

  return {
    gridTemplateColumns: `repeat(${cols}, ${finalCellSize}px)`,
    gap: '0',
  }
})

const isCellFilled = (cell) => {
  return filledCellsData.value.findIndex((c) => c.x === cell.x && c.y === cell.y) !== -1
}

const isInSelection = (cell) => {
  return selectedArea.value.has(`${cell.x}-${cell.y}`)
}

const isInCurrentDrag = (cell) => {
  return currentDragArea.value.has(`${cell.x}-${cell.y}`)
}

const getCellRoom = (cell) => {
  const cellKey = `${cell.x}-${cell.y}`
  const roomId = cellsWithRooms.value.get(cellKey)
  if (roomId == null) return null
  return rooms.value.find((r) => r.id === roomId)
}

// Validation: only allow adding filled, adjacent cells to a room selection
const isCellAdjacentToActiveRoom = (x, y) => {
  if (!activeRoomId.value) return false

  // Treat already selected cells as part of the active room group
  const selectedHas = (xx, yy) => selectedArea.value.has(`${xx}-${yy}`)
  const assignedHas = (xx, yy) => cellsWithRooms.value.get(`${xx}-${yy}`) === activeRoomId.value

  // Count how many cells are already assigned to this room
  let assignedCount = 0
  cellsWithRooms.value.forEach((rid) => {
    if (rid === activeRoomId.value) assignedCount++
  })

  // If no cells are assigned yet AND no cells selected, allow first cell freely
  if (assignedCount === 0 && selectedArea.value.size === 0) {
    return true
  }

  // Check four-neighborhood adjacency
  return (
    selectedHas(x, y - 1) ||
    assignedHas(x, y - 1) ||
    selectedHas(x, y + 1) ||
    assignedHas(x, y + 1) ||
    selectedHas(x - 1, y) ||
    assignedHas(x - 1, y) ||
    selectedHas(x + 1, y) ||
    assignedHas(x + 1, y)
  )
}

const getCellBorderStyle = (cell) => {
  const cellRoom = getCellRoom(cell)

  if (!cellRoom) {
    // Non-room cells get standard borders and margin
    return {
      margin: '2px',
      border: '2px solid #4b5563',
      boxSizing: 'border-box',
      borderRadius: '4px',
    }
  }

  const roomId = cellRoom.id
  const x = cell.x
  const y = cell.y

  // Check if adjacent cells have the same room
  const hasTop = cellsWithRooms.value.get(`${x}-${y - 1}`) === roomId
  const hasBottom = cellsWithRooms.value.get(`${x}-${y + 1}`) === roomId
  const hasLeft = cellsWithRooms.value.get(`${x - 1}-${y}`) === roomId
  const hasRight = cellsWithRooms.value.get(`${x + 1}-${y}`) === roomId

  const borderColor = cellRoom.color
  const borderWidth = '3px'

  // Use same color as background for internal borders (makes them invisible)
  const internalBorder = `${borderWidth} solid ${cellRoom.color}`
  const externalBorder = `${borderWidth} solid ${borderColor}`

  // Calculate border radius for corners
  const cornerRadius = '6px'
  const noRadius = '0px'

  // Determine which corners should be rounded
  const topLeft = !hasTop && !hasLeft ? cornerRadius : noRadius
  const topRight = !hasTop && !hasRight ? cornerRadius : noRadius
  const bottomLeft = !hasBottom && !hasLeft ? cornerRadius : noRadius
  const bottomRight = !hasBottom && !hasRight ? cornerRadius : noRadius

  return {
    borderTop: hasTop ? internalBorder : externalBorder,
    borderBottom: hasBottom ? internalBorder : externalBorder,
    borderLeft: hasLeft ? internalBorder : externalBorder,
    borderRight: hasRight ? internalBorder : externalBorder,
    borderRadius: `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`,
    backgroundColor: cellRoom.color,
    margin: '0',
    padding: '0',
    boxSizing: 'border-box',
  }
}

const getCellClass = (cell) => {
  const classes = ['grid-cell']
  const cellRoom = getCellRoom(cell)
  const hasIcon = getCellIcon(cell) !== null

  // Icon assignment mode
  if (iconAssignmentMode.value) {
    if (hasIcon) {
      classes.push('grid-cell-has-icon')
    }
    if (cell.isFilled) {
      classes.push('grid-cell-icon-target')
      if (cellRoom) {
        classes.push('grid-cell-has-room')
      } else {
        classes.push('grid-cell-filled')
      }
    } else {
      classes.push('grid-cell-empty')
      classes.push('grid-cell-icon-disabled')
    }
    return classes
  }

  // Room assignment mode takes priority for visual feedback
  if (roomAssignmentMode.value) {
    // Show drag selection visual feedback during drag
    if (isDragging.value && isInCurrentDrag(cell)) {
      if (cell.isFilled) {
        classes.push('grid-cell-room-dragging')
      } else {
        classes.push('grid-cell-empty')
        classes.push('grid-cell-room-drag-invalid')
      }
    } else if (isInSelection(cell)) {
      classes.push('grid-cell-room-selected')
    } else if (cellRoom && cellRoom.id === activeRoomId.value) {
      classes.push('grid-cell-room-current')
    } else if (cellRoom) {
      classes.push('grid-cell-has-room')
    } else if (cell.isFilled) {
      classes.push('grid-cell-filled')
    } else {
      classes.push('grid-cell-empty')
    }
    return classes
  }

  // Normal selection mode
  if (isDragging.value && isInCurrentDrag(cell)) {
    if (isInSelection(cell)) {
      classes.push('grid-cell-removing')
    } else {
      if (isCellFilled(cell)) {
        classes.push('grid-cell-selecting-filled')
      } else {
        classes.push('grid-cell-selecting')
      }
    }
  } else if (isInSelection(cell)) {
    if (isCellFilled(cell)) {
      classes.push('grid-cell-selecting-filled')
    } else {
      classes.push('grid-cell-selecting')
    }
  } else {
    // Show room color if cell has a room assignment
    if (cellRoom) {
      classes.push('grid-cell-has-room')
    } else if (cell.isFilled) {
      classes.push('grid-cell-filled')
    } else {
      classes.push('grid-cell-empty')
    }
  }

  // Add icon indicator class
  if (hasIcon) {
    classes.push('grid-cell-has-icon')
  }

  return classes
}

const handleMouseDown = (cell, event) => {
  if (isLoadingCells.value) return

  event.preventDefault()
  isSelecting.value = true
  isDragging.value = false
  mouseDownCell.value = cell
  selectionStart.value = cell
  mouseDownPosition.value = { x: event.clientX, y: event.clientY }

  currentDragArea.value.clear()
}

const handleGlobalMouseMove = (event) => {
  if (!isSelecting.value || isDragging.value) return

  const deltaX = Math.abs(event.clientX - mouseDownPosition.value.x)
  const deltaY = Math.abs(event.clientY - mouseDownPosition.value.y)

  if (deltaX > dragThreshold || deltaY > dragThreshold) {
    isDragging.value = true
    if (selectionStart.value) {
      currentDragArea.value.add(`${selectionStart.value.x}-${selectionStart.value.y}`)
    }
  }
}

const handleMouseEnter = (cell) => {
  if (!isSelecting.value || !isDragging.value || !selectionStart.value) return

  const minX = Math.min(selectionStart.value.x, cell.x)
  const maxX = Math.max(selectionStart.value.x, cell.x)
  const minY = Math.min(selectionStart.value.y, cell.y)
  const maxY = Math.max(selectionStart.value.y, cell.y)

  currentDragArea.value.clear()
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      currentDragArea.value.add(`${x}-${y}`)
    }
  }
}

const handleMouseUp = () => {
  if (!isSelecting.value) return

  if (!isDragging.value && mouseDownCell.value) {
    const cellKey = `${mouseDownCell.value.x}-${mouseDownCell.value.y}`
    const x = mouseDownCell.value.x
    const y = mouseDownCell.value.y

    // Icon assignment mode: toggle icon on cell
    if (iconAssignmentMode.value) {
      toggleCellIcon(mouseDownCell.value)
    }
    // Room assignment mode: enforce adjacency and filled-only additions
    else if (roomAssignmentMode.value) {
      const filled = isCellFilled(mouseDownCell.value)
      if (!filled) {
        showMessage('Only filled cells can be added to rooms', 'error')
      } else if (selectedArea.value.has(cellKey)) {
        // Allow removing any selected cell
        selectedArea.value.delete(cellKey)
        showMessage('Cell removed from selection', 'info')
      } else if (isCellAdjacentToActiveRoom(x, y)) {
        selectedArea.value.add(cellKey)
        showMessage('Cell added to room selection', 'success')
      } else {
        showMessage('Select cells adjacent to the room or existing selection', 'error')
      }
    } else {
      // Normal mode: toggle fill
      if (selectedArea.value.size > 0) {
        if (selectedArea.value.has(cellKey)) {
          selectedArea.value.delete(cellKey)
          showMessage('Cell removed from selection', 'info')
        } else {
          selectedArea.value.add(cellKey)
          showMessage('Cell added to selection', 'info')
        }
      } else {
        toggleCell(mouseDownCell.value)
      }
    }
  } else if (isDragging.value) {
    if (roomAssignmentMode.value) {
      // Apply adjacency + filled validation per cell in drag area, process in order
      const cellsToProcess = Array.from(currentDragArea.value)
      let addedCount = 0

      // Sort cells to process adjacent ones first
      for (const cellKey of cellsToProcess) {
        const [x, y] = cellKey.split('-').map(Number)
        const filled = filledCellsData.value.findIndex((c) => c.x === x && c.y === y) !== -1

        if (selectedArea.value.has(cellKey)) {
          selectedArea.value.delete(cellKey)
        } else if (filled && isCellAdjacentToActiveRoom(x, y)) {
          selectedArea.value.add(cellKey)
          addedCount++
        }
      }

      if (addedCount > 0) {
        showMessage(`Added ${addedCount} cells to selection`, 'success')
      }
    } else {
      currentDragArea.value.forEach((cellKey) => {
        if (selectedArea.value.has(cellKey)) {
          selectedArea.value.delete(cellKey)
        } else {
          selectedArea.value.add(cellKey)
        }
      })
    }

    if (currentDragArea.value.size > 0) {
      showMessage(`Selection updated: ${selectedArea.value.size} cells selected`, 'info')
    }
  }

  isSelecting.value = false
  isDragging.value = false
  mouseDownCell.value = null
  selectionStart.value = null
  currentDragArea.value.clear()
}

const handleMouseLeave = () => {}

// Handle right-click on cell (context menu)
const handleCellRightClick = (cell) => {
  const cellKey = `${cell.x}-${cell.y}`

  // If cell has an icon, clear it
  if (cellIcons.value.has(cellKey)) {
    clearCellIcon(cellKey)
    showMessage('Icon removed from cell', 'info')
    return
  }

  // If cell is filled, option to unfill it
  const filled = isCellFilled(cell)
  if (filled) {
    const idx = filledCellsData.value.findIndex((c) => c.x === cell.x && c.y === cell.y)
    if (idx !== -1) {
      // Clear any room assignment too
      cellsWithRooms.value.delete(cellKey)
      filledCellsData.value.splice(idx, 1)
      showMessage('Cell cleared', 'info')
    }
  }
}

const fillSelectedArea = () => {
  if (selectedArea.value.size === 0) return

  let addedCount = 0
  selectedArea.value.forEach((cellKey) => {
    const [x, y] = cellKey.split('-').map(Number)
    const exists = filledCellsData.value.findIndex((c) => c.x === x && c.y === y)

    if (exists === -1) {
      filledCellsData.value.push({ x, y, isFilled: true })
      addedCount++
    }
  })

  showMessage(`Filled ${addedCount} cells in selected area`, 'success')
  cancelSelection()
}

const clearSelectedArea = () => {
  if (selectedArea.value.size === 0) return

  let removedCount = 0
  let iconsRemoved = 0
  let roomsRemoved = 0

  selectedArea.value.forEach((cellKey) => {
    const [x, y] = cellKey.split('-').map(Number)
    const index = filledCellsData.value.findIndex((c) => c.x === x && c.y === y)

    if (index !== -1) {
      filledCellsData.value.splice(index, 1)
      removedCount++
    }

    // Also remove icons and room assignments when clearing cells
    if (cellIcons.value.has(cellKey)) {
      cellIcons.value.delete(cellKey)
      iconsRemoved++
    }
    if (cellsWithRooms.value.has(cellKey)) {
      cellsWithRooms.value.delete(cellKey)
      roomsRemoved++
    }
  })

  let message = `Cleared ${removedCount} cells`
  if (iconsRemoved > 0) message += `, ${iconsRemoved} icons`
  if (roomsRemoved > 0) message += `, ${roomsRemoved} room assignments`
  showMessage(message, 'success')
  cancelSelection()
}

const cancelSelection = () => {
  selectedArea.value.clear()
  currentDragArea.value.clear()
  selectionStart.value = null
  isSelecting.value = false
  isDragging.value = false
}

// Methods
const toggleCell = (cell) => {
  if (isLoadingCells.value) return
  const index = filledCellsData.value.findIndex((c) => c.x === cell.x && c.y === cell.y)

  if (index !== -1) {
    filledCellsData.value.splice(index, 1)
  } else {
    filledCellsData.value.push({
      x: cell.x,
      y: cell.y,
      isFilled: true,
    })
  }
}

const removeCell = (cell) => {
  if (isLoadingCells.value) return
  const index = filledCellsData.value.findIndex((c) => c.x === cell.x && c.y === cell.y)

  if (index !== -1) {
    filledCellsData.value.splice(index, 1)
  }
}

const fillAll = () => {
  if (isLoadingCells.value) return
  filledCellsData.value = []
  for (let y = 0; y < props.floor.dimensionY; y++) {
    for (let x = 0; x < props.floor.dimensionX; x++) {
      filledCellsData.value.push({
        x,
        y,
        isFilled: true,
      })
    }
  }
  showMessage('All cells filled!', 'success')
}

const clearAll = () => {
  if (isLoadingCells.value) return
  if (filledCells.value.length === 0) {
    showMessage('No cells to clear', 'info')
    return
  }

  const cellCount = filledCellsData.value.length
  const iconCount = cellIcons.value.size
  const roomAssignCount = cellsWithRooms.value.size

  filledCellsData.value = []
  cellIcons.value = new Map()
  cellsWithRooms.value = new Map()

  let message = `Cleared ${cellCount} cells`
  if (iconCount > 0) message += `, ${iconCount} icons`
  if (roomAssignCount > 0) message += `, ${roomAssignCount} room assignments`
  showMessage(message, 'success')
}

// Clear all icons
const clearAllIcons = () => {
  if (cellIcons.value.size === 0) {
    showMessage('No icons to clear', 'info')
    return
  }
  const count = cellIcons.value.size
  cellIcons.value = new Map()
  showMessage(`Cleared ${count} icons`, 'success')
}

// Clear icon from specific cell
const clearCellIcon = (cellKey) => {
  if (cellIcons.value.has(cellKey)) {
    const newCellIcons = new Map(cellIcons.value)
    newCellIcons.delete(cellKey)
    cellIcons.value = newCellIcons
    return true
  }
  return false
}

const zoomIn = () => {
  if (zoomLevel.value < 2) {
    zoomLevel.value += 0.2
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value -= 0.2
  }
}

const generatePayload = () => {
  // Create full list of cells with filled status, room assignments, and icons
  const allCellsWithStatus = []
  const filledMap = new Map(filledCells.value.map((c) => [`${c.x}-${c.y}`, true]))

  // Generate full grid with filled status, room assignments, and icons
  for (let y = 0; y < props.floor.dimensionY; y++) {
    for (let x = 0; x < props.floor.dimensionX; x++) {
      const cellKey = `${x}-${y}`
      const cellData = {
        x,
        y,
        isFilled: filledMap.has(cellKey),
      }

      // Handle room assignment with clearRoom flag
      const roomId = cellsWithRooms.value.get(cellKey)
      if (roomId != null) {
        cellData.roomId = roomId
        cellData.clearRoom = false
      } else {
        // If no roomId, set clearRoom to true to clear any existing assignment
        cellData.clearRoom = true
      }

      // Handle icon assignment with clearIcon flag
      const iconType = cellIcons.value.get(cellKey)
      if (iconType != null) {
        cellData.icon = iconType
        cellData.clearIcon = false
      } else {
        // If no icon, set clearIcon to true to clear any existing icon
        cellData.clearIcon = true
      }

      allCellsWithStatus.push(cellData)
    }
  }

  return {
    floorId: props.floor.id,
    cells: allCellsWithStatus,
  }
}

const saveChanges = async () => {
  isSaving.value = true
  const payload = generatePayload()

  try {
    emit('save-cells', payload)
    showMessage('Changes saved successfully!', 'success')
  } catch (err) {
    console.error('Save failed:', err)
    showMessage('Failed to save changes', 'error')
  } finally {
    setTimeout(() => {
      isSaving.value = false
    }, 500)
  }
}

const showMessage = (text, type = 'info') => {
  actionMessage.value = { text, type }
  setTimeout(() => {
    actionMessage.value = null
  }, 3000)
}

const goBack = () => {
  emit('back')
}
</script>

<style scoped>
.floor-editor-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.floor-editor-card {
  background-color: #1f2937;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  padding: 1.5rem;
  max-width: 1600px;
  width: 100%;
  border: 1px solid #374151;
}

/* Header */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
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
  white-space: nowrap;
}

.back-button:hover {
  background-color: #60a5fa;
  color: #1f2937;
}

.editor-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: white;
  text-align: center;
  flex: 1;
  margin: 0;
}

.header-spacer {
  width: 100px;
}

/* Floor Info */
.floor-info {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-card {
  background-color: #374151;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid #3b82f6;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  color: #9ca3af;
  font-size: 0.8rem;
  font-weight: 500;
}

.info-value {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.info-value.highlight-filled {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(145deg, #1f2937 0%, #374151 100%);
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  border: 1px solid #4b5563;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.toolbar-group.quick-actions {
  gap: 0.5rem;
}

.zoom-label {
  color: #d1d5db;
  font-weight: 500;
  white-space: nowrap;
  font-size: 0.85rem;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background-color: #1f2937;
  padding: 0.25rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
}

.zoom-button {
  padding: 0.35rem 0.6rem;
  color: white;
  background-color: #4b5563;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  font-size: 1rem;
}

.zoom-button:hover:not(:disabled) {
  background-color: #3b82f6;
}

.zoom-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-level {
  color: #d1d5db;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
  font-size: 0.85rem;
}

/* Edit Mode Indicator */
.edit-mode-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mode-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.mode-dot.icon {
  background-color: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

.mode-dot.room {
  background-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.mode-dot.selection {
  background-color: #8b5cf6;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.9);
  }
}

.mode-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #e5e7eb;
}

/* Action buttons in toolbar */
.action-button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button svg {
  width: 16px;
  height: 16px;
}

.action-button.fill-all {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.action-button.fill-all:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.action-button.clear-all {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.action-button.clear-all:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* Selection Control Panel */
.selection-control-panel {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.selection-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
}

.selection-badge svg {
  width: 20px;
  height: 20px;
}

.selection-count {
  font-size: 1.25rem;
  font-weight: 700;
}

.selection-text-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.selection-text {
  font-size: 0.95rem;
  font-weight: 600;
}

.selection-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.selection-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.action-btn .kbd-hint {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 0.25rem;
  opacity: 0.8;
  margin-left: 0.25rem;
}

.fill-btn {
  background-color: #10b981;
  color: white;
}

.fill-btn:hover {
  background-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.clear-btn {
  background-color: #ef4444;
  color: white;
}

.clear-btn:hover {
  background-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.cancel-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* Panel Animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

/* Room Assignment Panel */
.room-assignment-panel {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.assignment-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: white;
}

.assignment-text {
  font-size: 1rem;
  font-weight: 500;
}

.assignment-text strong {
  font-weight: 700;
  font-size: 1.1rem;
}

.assignment-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.assignment-actions {
  display: flex;
  gap: 0.75rem;
}

.save-assign-btn {
  background-color: #fbbf24;
  color: #1f2937;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 700;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.save-assign-btn:hover {
  background-color: #f59e0b;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(251, 191, 36, 0.4);
}

.action-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
  white-space: nowrap;
}

.action-button.fill-all {
  background-color: #10b981;
}

.action-button.fill-all:hover {
  background-color: #059669;
}

.action-button.clear-all {
  background-color: #ef4444;
}

.action-button.clear-all:hover {
  background-color: #dc2626;
}

/* Editor Wrapper - responsive */
.editor-wrapper {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* mobile: single column */
.editor-wrapper.device-mobile {
  grid-template-columns: 1fr;
}

/* tablet: single column */
.editor-wrapper.device-tablet {
  grid-template-columns: 1fr;
}

/* desktop: two columns (grid main, sidebar 300px) */
.editor-wrapper.device-desktop {
  grid-template-columns: 1fr 300px;
}

/* Grid Wrapper */
.grid-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background-color: #111827;
  padding: 1.5rem;
  border-radius: 0.5rem;
  overflow: auto;
  border: 1px solid #374151;
  min-height: 500px;
  position: relative;
}

.grid-container {
  display: inline-grid;
  gap: 0;
  padding: 0.5rem;
  background-color: #1f2937;
  border-radius: 0.375rem;
  place-self: start center;
}

/* Grid Cell */
.grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
  border-radius: 0;
  border: none;
  cursor: pointer;
  transition:
    background-color 0.2s,
    filter 0.2s;
  position: relative;
  min-width: 30px;
  min-height: 30px;
  box-sizing: border-box;
}

.grid-cell:hover {
  transform: scale(1.08);
}

.grid-cell-filled {
  background: linear-gradient(145deg, #3b82f6 0%, #2563eb 100%);
  color: rgba(255, 255, 255, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 2px 4px rgba(37, 99, 235, 0.3);
}

.grid-cell-filled:hover {
  background: linear-gradient(145deg, #60a5fa 0%, #3b82f6 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 4px 8px rgba(37, 99, 235, 0.4);
}

.grid-cell-empty {
  background-color: #374151;
  color: #6b7280;
}

.grid-cell-empty:hover {
  background-color: #4b5563;
  color: #9ca3af;
}

/* Selection Highlight */
.grid-cell-selecting {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%) !important;
  color: white !important;
  box-shadow:
    0 0 20px rgba(139, 92, 246, 0.6),
    inset 0 0 10px rgba(255, 255, 255, 0.2) !important;
  transform: scale(1.05);
  z-index: 5;
  animation: selecting-pulse 1.5s ease-in-out infinite;
}

@keyframes selecting-pulse {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(139, 92, 246, 0.6),
      inset 0 0 10px rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow:
      0 0 30px rgba(139, 92, 246, 0.8),
      inset 0 0 15px rgba(255, 255, 255, 0.3);
  }
}

.grid-cell-removing {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
  color: #fca5a5 !important;
  box-shadow:
    0 0 20px rgba(239, 68, 68, 0.6),
    inset 0 0 10px rgba(0, 0, 0, 0.3) !important;
  transform: scale(1.05);
  z-index: 5;
  animation: removing-pulse 1.5s ease-in-out infinite;
}

@keyframes removing-pulse {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(239, 68, 68, 0.6),
      inset 0 0 10px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow:
      0 0 30px rgba(239, 68, 68, 0.8),
      inset 0 0 15px rgba(0, 0, 0, 0.5);
  }
}

.grid-cell-selecting-filled {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%) !important;
  color: white !important;
  box-shadow:
    0 0 20px rgba(249, 115, 22, 0.6),
    inset 0 0 10px rgba(255, 255, 255, 0.2) !important;
  transform: scale(1.05);
  z-index: 5;
  animation: selecting-pulse-orange 1.5s ease-in-out infinite;
}

@keyframes selecting-pulse-orange {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(249, 115, 22, 0.6),
      inset 0 0 10px rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow:
      0 0 30px rgba(249, 115, 22, 0.8),
      inset 0 0 15px rgba(255, 255, 255, 0.3);
  }
}

/* Room-assigned cell styles - Clean and Natural */
.grid-cell-has-room {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.grid-cell-has-room:hover {
  filter: brightness(1.15);
  z-index: 10;
}

/* Room assignment mode cell states */
.grid-cell-room-selected {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
  color: #1f2937 !important;
  box-shadow:
    0 0 0 2px rgba(251, 191, 36, 0.5),
    0 4px 12px rgba(251, 191, 36, 0.4) !important;
  transform: scale(1.02);
  z-index: 5;
  font-weight: 800;
}

/* Visual feedback during drag in room assignment mode */
.grid-cell-room-dragging {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%) !important;
  color: white !important;
  box-shadow:
    0 0 0 2px rgba(16, 185, 129, 0.5),
    0 4px 12px rgba(16, 185, 129, 0.4) !important;
  transform: scale(1.05);
  z-index: 6;
  animation: room-drag-pulse 0.8s ease-in-out infinite;
}

.grid-cell-room-drag-invalid {
  opacity: 0.4;
  cursor: not-allowed !important;
}

@keyframes room-drag-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 2px rgba(16, 185, 129, 0.5),
      0 4px 12px rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow:
      0 0 0 3px rgba(16, 185, 129, 0.7),
      0 6px 16px rgba(16, 185, 129, 0.5);
  }
}

.grid-cell-room-current {
  opacity: 0.7;
  position: relative;
}

.grid-cell-room-current::before {
  content: '';
  position: absolute;
  inset: -2px;
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: inherit;
  pointer-events: none;
}

/* Icon assignment mode styles */
.grid-cell-icon-target {
  cursor: crosshair !important;
  position: relative;
}

.grid-cell-icon-target::after {
  content: '';
  position: absolute;
  inset: 2px;
  border: 2px dashed rgba(168, 85, 247, 0.7);
  border-radius: 4px;
  pointer-events: none;
  animation: icon-target-pulse 1.5s ease-in-out infinite;
}

.grid-cell-icon-target:hover {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%) !important;
  transform: scale(1.1);
  z-index: 10;
}

.grid-cell-icon-disabled {
  cursor: not-allowed !important;
  opacity: 0.4;
  filter: grayscale(0.5);
}

.grid-cell-icon-disabled:hover {
  transform: none !important;
}

@keyframes icon-target-pulse {
  0%,
  100% {
    border-color: rgba(168, 85, 247, 0.5);
  }
  50% {
    border-color: rgba(168, 85, 247, 1);
  }
}

/* Cell icon display */
.cell-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  height: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 3;
}

.cell-icon svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.cell-text {
  display: none;
}

.grid-cell:hover .cell-text {
  display: block;
  font-size: 0.5rem;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: #e5e7eb;
  font-weight: 600;
  z-index: 2;
}

/* Sidebar (desktop only) */
.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filled-cells-section,
.json-section {
  background-color: #374151;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #4b5563;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #60a5fa;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #4b5563;
  margin: 0 0 0.75rem 0;
}

.filled-cells-list {
  max-height: 250px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  color: #9ca3af;
  padding: 1rem 0;
}

.cells-tags {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cell-tag {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #2563eb;
}

.cell-tag:hover {
  background-color: #1d4ed8;
  border-color: #1e40af;
}

.json-output {
  background-color: #111827;
  padding: 0.75rem;
  border-radius: 0.375rem;
  max-height: 300px;
  overflow-y: auto;
}

.json-output pre {
  color: #10b981;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.4;
}

/* Room Manager - Redesigned */
.room-manager-card {
  margin: 1.5rem 0;
  background: linear-gradient(145deg, #111827 0%, #1a2332 100%);
  border-radius: 1rem;
  border: 1px solid #2d3748;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.room-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #2d3748;
}

.room-header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.room-manager-header .section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
  padding: 0;
  border: none;
}

.room-icon {
  width: 24px;
  height: 24px;
  color: #60a5fa;
}

.room-subtitle {
  color: #94a3b8;
  margin: 0;
  font-size: 0.85rem;
}

.room-header-stats {
  display: flex;
  gap: 1rem;
}

.room-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #1f2937;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #374151;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #60a5fa;
}

.stat-label {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.room-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* Room List Section */
.room-list-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.room-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.collapse-all-btn {
  font-size: 0.75rem;
  color: #60a5fa;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.collapse-all-btn:hover {
  background-color: rgba(96, 165, 250, 0.1);
}

.room-list {
  background-color: #1a2332;
  border: 1px solid #2d3748;
  border-radius: 0.75rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: calc(100vh - 400px);
  min-height: 150px;
  overflow-y: auto;
  overflow-x: visible;
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1a2332;
}

.room-list::-webkit-scrollbar {
  width: 8px;
}

.room-list::-webkit-scrollbar-track {
  background: #1a2332;
  border-radius: 4px;
}

.room-list::-webkit-scrollbar-thumb {
  background-color: #4b5563;
  border-radius: 4px;
}

.room-list::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}

/* Room Card */
.room-card {
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  overflow: visible;
  transition: all 0.2s;
  flex-shrink: 0;
}

.room-card:hover {
  border-color: #4b5563;
}

.room-card-editing {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.room-card-assigning {
  border-color: #10b981;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3);
}

.room-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.room-card-header:hover {
  background-color: #2d3748;
}

.room-card-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.room-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.room-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.room-card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f1f5f9;
}

.room-card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.room-cell-count {
  font-size: 0.75rem;
  color: #94a3b8;
}

.room-status-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 9999px;
  font-weight: 600;
  text-transform: uppercase;
}

.room-status-badge.editing {
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.room-status-badge.assigning {
  background-color: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.room-expand-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
}

.room-expand-btn:hover {
  background-color: #374151;
  color: #f1f5f9;
}

.room-expand-btn svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.room-expand-btn.expanded svg {
  transform: rotate(180deg);
}

.room-card-body {
  padding: 0 0.75rem 0.75rem;
  border-top: 1px solid #2d3748;
}

.room-card-desc {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0.75rem 0;
  line-height: 1.4;
}

.room-card-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.room-action-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.room-action-btn svg {
  width: 14px;
  height: 14px;
}

.room-action-btn.assign {
  background-color: #065f46;
  color: #34d399;
}

.room-action-btn.assign:hover {
  background-color: #047857;
}

.room-action-btn.assign.active {
  background-color: #10b981;
  color: white;
}

.room-action-btn.edit {
  background-color: #1e40af;
  color: #93c5fd;
}

.room-action-btn.edit:hover {
  background-color: #1d4ed8;
}

.room-action-btn.delete {
  background-color: #7f1d1d;
  color: #fca5a5;
}

.room-action-btn.delete:hover:not(:disabled) {
  background-color: #991b1b;
}

.room-action-btn.delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty Room State */
.empty-room-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #1a2332;
  border: 2px dashed #374151;
  border-radius: 0.75rem;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #4b5563;
  margin-bottom: 0.75rem;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: #94a3b8;
  margin: 0 0 0.25rem;
}

.empty-hint {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

/* Room Form Section */
.room-form-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.room-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-cancel-btn {
  font-size: 0.75rem;
  color: #f87171;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.form-cancel-btn:hover {
  background-color: rgba(248, 113, 113, 0.1);
}

.room-form {
  background-color: #1a2332;
  border: 1px solid #2d3748;
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2e8f0;
}

.form-label svg {
  width: 16px;
  height: 16px;
  color: #60a5fa;
}

.optional-tag {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 400;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  color: #f1f5f9;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.form-input::placeholder {
  color: #6b7280;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  color: #f1f5f9;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.form-textarea::placeholder {
  color: #6b7280;
}

/* Color Picker */
.color-picker-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-picker {
  width: 48px;
  height: 48px;
  border: 2px solid #374151;
  border-radius: 0.5rem;
  cursor: pointer;
  background-color: transparent;
  padding: 2px;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 0.35rem;
}

.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  flex: 1;
}

.color-preset {
  width: 24px;
  height: 24px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-preset:hover {
  transform: scale(1.15);
}

.color-preset.selected {
  border-color: white;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.color-text-input {
  width: 90px;
  padding: 0.5rem;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.375rem;
  color: #f1f5f9;
  font-size: 0.8rem;
  font-family: monospace;
}

.color-text-input:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.submit-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn svg {
  width: 18px;
  height: 18px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.reset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.75rem 1rem;
  background-color: #374151;
  color: #d1d5db;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid #4b5563;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover:not(:disabled) {
  background-color: #4b5563;
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-btn svg {
  width: 16px;
  height: 16px;
}

/* Form Message */
.form-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
}

.form-message svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.form-message.success {
  background-color: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.form-message.error {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.form-message.info {
  background-color: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Message Fade Animation */
.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Expand Animation */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Delete Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.delete-modal {
  background: linear-gradient(145deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.modal-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  background-color: rgba(239, 68, 68, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-icon svg {
  width: 28px;
  height: 28px;
  color: #f87171;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.75rem;
}

.modal-text {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

.modal-text strong {
  color: #f1f5f9;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.modal-btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.cancel {
  background-color: #374151;
  color: #d1d5db;
}

.modal-btn.cancel:hover {
  background-color: #4b5563;
}

.modal-btn.confirm {
  background-color: #dc2626;
  color: white;
}

.modal-btn.confirm:hover {
  background-color: #b91c1c;
}

/* Modal Fade Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .delete-modal,
.modal-fade-leave-to .delete-modal {
  transform: scale(0.9);
}

/* Room Tooltip */
.room-tooltip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(145deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
}

.tooltip-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.tooltip-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f1f5f9;
}

/* Tooltip Fade Animation */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

/* Mobile Summary */
.mobile-summary {
  background-color: #374151;
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
}

.summary-card {
  text-align: center;
  color: #d1d5db;
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

.summary-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #10b981;
}

/* Footer */
.editor-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.save-button {
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

.save-button:hover:not(:disabled) {
  background-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 15px 20px -3px rgba(16, 185, 129, 0.4);
}

.save-button:disabled {
  background-color: #6b7280;
  cursor: not-allowed;
  box-shadow: none;
}

.cancel-button {
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

.cancel-button:hover {
  background-color: #4b5563;
}

/* Cell Icon */
.cell-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  height: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}

.cell-icon :deep(svg) {
  width: 100%;
  height: 100%;
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

.grid-cell {
  position: relative;
}

/* Icon Manager */
.icon-manager-card {
  margin: 1.5rem 0;
  background: linear-gradient(145deg, #111827 0%, #1a2332 100%);
  border-radius: 1rem;
  border: 1px solid #2d3748;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.icon-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #2d3748;
}

.icon-header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.icon-manager-header .section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
  padding: 0;
  border: none;
}

.icon-icon {
  width: 24px;
  height: 24px;
  color: #60a5fa;
}

.icon-subtitle {
  color: #94a3b8;
  margin: 0;
  font-size: 0.85rem;
}

.icon-header-stats {
  display: flex;
  gap: 1rem;
}

.icon-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #1f2937;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #374151;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #1f2937;
  border: 2px solid #374151;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background-color: #2d3748;
  border-color: #4b5563;
}

.icon-btn.active {
  background-color: rgba(96, 165, 250, 0.15);
  border-color: #60a5fa;
  box-shadow: 0 0 20px rgba(96, 165, 250, 0.3);
}

.icon-symbol {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-symbol :deep(svg) {
  width: 100%;
  height: 100%;
  color: #e2e8f0;
}

.icon-btn.active .icon-symbol :deep(svg) {
  color: #60a5fa;
}

.icon-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
}

.icon-btn.active .icon-label {
  color: #60a5fa;
}

.icon-assignment-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  border: 2px solid rgba(167, 139, 250, 0.5);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.assignment-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.assignment-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.assignment-icon :deep(svg) {
  width: 100%;
  height: 100%;
  color: white;
}

.assignment-text-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.assignment-text {
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
}

.assignment-text strong {
  font-weight: 700;
}

.assignment-hint {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
}

.assignment-actions {
  display: flex;
  gap: 0.75rem;
}

.done-btn {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
}

.done-btn:hover {
  background-color: rgba(255, 255, 255, 0.3) !important;
}

.icon-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.clear-icons-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  color: #f87171;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-icons-btn svg {
  width: 16px;
  height: 16px;
}

.clear-icons-btn:hover {
  background-color: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
}

.stat-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #60a5fa;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.icon-count-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
}

.icon-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #1f2937;
  border: 2px solid #374151;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-summary {
  background-color: #1f2937;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #374151;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.summary-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
}

.summary-total {
  font-size: 0.75rem;
  color: #60a5fa;
  font-weight: 600;
}

.icon-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.icon-tag-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background-color: #2d3748;
  border-radius: 9999px;
  font-size: 0.8rem;
  color: #e2e8f0;
}

.icon-tag-item .tag-icon {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-tag-item .tag-icon :deep(svg) {
  width: 100%;
  height: 100%;
  color: #60a5fa;
}

.icon-tag-item .tag-label {
  font-weight: 500;
  color: #e2e8f0;
}

.icon-tag-item .tag-count {
  background-color: rgba(96, 165, 250, 0.2);
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #60a5fa;
}

.icon-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: #6b7280;
}

.icon-empty-state svg {
  width: 48px;
  height: 48px;
  color: #4b5563;
  margin-bottom: 0.75rem;
}

.icon-empty-state p {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #94a3b8;
}

.icon-empty-state span {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Action Message */
.action-message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.action-message.success {
  background-color: #10b981;
  color: white;
}

.action-message.error {
  background-color: #ef4444;
  color: white;
}

.action-message.info {
  background-color: #3b82f6;
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Tablet adjustments */
@media (max-width: 1024px) {
  .floor-editor-card {
    padding: 1rem;
  }

  .floor-info {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .info-card {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .editor-title {
    font-size: 1.5rem;
  }

  .grid-wrapper {
    min-height: 400px;
  }

  .room-columns {
    grid-template-columns: 1fr;
  }

  .room-list {
    max-height: calc(100vh - 350px);
    min-height: 200px;
  }
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .floor-editor-container {
    padding: 0.25rem;
  }

  .floor-editor-card {
    padding: 0.75rem;
    border-radius: 0.75rem;
  }

  .editor-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 1rem;
  }

  .editor-title {
    font-size: 1.25rem;
    margin: 0.5rem 0;
  }

  .back-button {
    width: 100%;
    text-align: center;
  }

  .header-spacer {
    display: none;
  }

  .floor-info {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .info-card {
    padding: 0.5rem;
    border-left-width: 3px;
    font-size: 0.8rem;
  }

  .info-label {
    font-size: 0.7rem;
  }

  .info-value {
    font-size: 0.9rem;
  }

  .toolbar {
    padding: 0.75rem;
    margin-bottom: 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .toolbar-group {
    width: 100%;
    justify-content: center;
    gap: 0.5rem;
  }

  .action-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
    flex: 1;
  }

  .grid-wrapper {
    min-height: 300px;
    padding: 0.75rem;
  }

  .editor-footer {
    gap: 0.5rem;
  }

  .save-button,
  .cancel-button {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .action-message {
    top: 1rem;
    right: 1rem;
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
  }

  .selection-control-panel {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .room-assignment-panel {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .selection-info {
    justify-content: center;
  }

  .selection-text {
    font-size: 0.9rem;
  }

  .selection-actions {
    flex-direction: column;
    width: 100%;
  }

  .assignment-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
    padding: 0.5rem;
    font-size: 0.85rem;
  }

  .room-columns {
    grid-template-columns: 1fr;
  }

  .room-header-stats {
    flex-direction: row;
    gap: 0.5rem;
  }

  .room-stat {
    padding: 0.35rem 0.75rem;
  }

  .stat-number {
    font-size: 1rem;
  }

  .room-card-actions {
    flex-direction: column;
  }

  .room-action-btn {
    width: 100%;
    justify-content: center;
  }

  .color-picker-row {
    flex-wrap: wrap;
  }

  .color-presets {
    order: 1;
    width: 100%;
    margin-top: 0.5rem;
  }

  .color-text-input {
    order: 2;
    width: 100%;
    margin-top: 0.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .submit-btn,
  .reset-btn {
    width: 100%;
  }

  .delete-modal {
    padding: 1.5rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
  }
}
</style>
