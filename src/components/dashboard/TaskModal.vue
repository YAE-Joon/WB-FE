<template>
  <div class="task-modal-overlay" @click="closeModal">
    <div class="task-modal" @click.stop>
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <h3>{{ modalTitle }}</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <!-- 모달 내용 -->
      <div class="modal-content">
        <!-- 오늘할일 전용 폼 -->
        <div v-if="projectName === '오늘할일'" class="today-task-form">
          <!-- 연간사업 선택 -->
          <div class="form-group">
            <label for="annual-project">연간사업</label>
            <select 
              id="annual-project"
              v-model="formData.annualProject"
              class="form-select"
            >
              <option value="">연간사업을 선택하세요</option>
              <option 
                v-for="project in annualProjects" 
                :key="project.id" 
                :value="project.id"
              >
                {{ project.name }}
              </option>
            </select>
          </div>
          
          <!-- 중간주제 선택 -->
          <div class="form-group">
            <label for="middle-topic">중간주제</label>
            <select 
              id="middle-topic"
              v-model="formData.middleTopic"
              class="form-select"
              :disabled="!formData.annualProject"
            >
              <option value="">중간주제를 선택하세요</option>
              <option 
                v-for="topic in filteredMiddleTopics" 
                :key="topic.id" 
                :value="topic.id"
              >
                {{ topic.name }}
              </option>
            </select>
          </div>
          
          <!-- 해야할 일 -->
          <div class="form-group">
            <label for="todo-task">해야할 일</label>
            <input 
              type="text"
              id="todo-task"
              v-model="formData.todoTask"
              class="form-input"
              placeholder="해야할 일을 입력하세요"
            />
          </div>
          
          <!-- 세부내용 -->
          <div class="form-group">
            <label for="detail-content">세부내용</label>
            <textarea 
              id="detail-content"
              v-model="formData.detailContent"
              class="form-textarea"
              rows="4"
              placeholder="세부내용을 입력하세요"
            ></textarea>
          </div>
          
          <!-- 마감일 -->
          <div class="form-group">
            <label for="deadline">마감일</label>
            <input 
              type="date"
              id="deadline"
              v-model="formData.deadline"
              class="form-input"
            />
          </div>
          
          <!-- 내 일 체크박스 -->
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input 
                type="checkbox"
                v-model="formData.isMyJob"
                class="form-checkbox"
              />
              <span class="checkbox-text">내 일</span>
            </label>
          </div>
        </div>
        
        <!-- 기존 할일 목록 폼 (다른 프로젝트용) -->
        <div v-else class="project-task-form">
          <!-- 할일 목록 -->
          <div class="tasks-list">
            <div 
              v-for="(task, index) in tasks" 
              :key="index"
              class="task-item"
            >
              <div class="task-row">
                <input 
                  type="checkbox" 
                  v-model="task.completed"
                  class="task-checkbox"
                />
                <input 
                  type="text"
                  v-model="task.text"
                  class="task-input"
                  placeholder="할일을 입력하세요"
                  @keyup.enter="addNewTask"
                />
                <button @click="removeTask(index)" class="remove-btn">
                  🗑️
                </button>
              </div>
            </div>
          </div>
          
          <!-- 새 할일 추가 버튼 -->
          <button @click="addNewTask" class="add-task-btn">
            ➕ 할일 추가
          </button>
          
          <!-- 메모 영역 -->
          <div class="memo-section">
            <label for="memo">메모</label>
            <textarea 
              id="memo"
              v-model="memo"
              class="memo-textarea"
              placeholder="추가 메모를 입력하세요"
              rows="4"
            ></textarea>
          </div>
        </div>
      </div>
      
      <!-- 모달 푸터 -->
      <div class="modal-footer">
        <button @click="closeModal" class="cancel-btn">취소</button>
        <button @click="saveTasks" class="save-btn">저장</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  dayName: {
    type: String,
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  initialData: {
    type: Object,
    default: () => ({ tasks: [], memo: '' })
  }
})

const emit = defineEmits(['close', 'save'])

// 상태 - 기존 할일 목록용
const tasks = ref([])
const memo = ref('')

// 상태 - 오늘할일 폼용
const todayTasks = ref([])
const editingIndex = ref(-1)
const formData = ref({
  annualProject: '',
  middleTopic: '',
  todoTask: '',
  detailContent: '',
  deadline: '',
  isMyJob: false
})

// 샘플 데이터 (추후 API에서 가져올 예정)
const annualProjects = ref([
  { id: 1, name: '디지털 전환 프로젝트', color: '#FF6B6B' },
  { id: 2, name: '고객 만족도 향상', color: '#4ECDC4' },
  { id: 3, name: '업무 효율성 개선', color: '#45B7D1' },
  { id: 4, name: '신제품 개발', color: '#96CEB4' },
  { id: 5, name: '마케팅 전략 수립', color: '#FFEAA7' }
])

const middleTopics = ref([
  { id: 1, name: 'UI/UX 개선', projectId: 1 },
  { id: 2, name: '시스템 자동화', projectId: 1 },
  { id: 3, name: '데이터 분석 도구', projectId: 1 },
  { id: 4, name: '고객 서비스 개선', projectId: 2 },
  { id: 5, name: '피드백 시스템', projectId: 2 },
  { id: 6, name: '프로세스 최적화', projectId: 3 },
  { id: 7, name: '협업 도구 도입', projectId: 3 },
  { id: 8, name: '시장 조사', projectId: 4 },
  { id: 9, name: '프로토타입 개발', projectId: 4 },
  { id: 10, name: 'SNS 마케팅', projectId: 5 },
  { id: 11, name: '브랜드 전략', projectId: 5 }
])

// 계산된 속성
const modalTitle = computed(() => {
  return `${props.dayName} - ${props.projectName}`
})

const filteredMiddleTopics = computed(() => {
  if (!formData.value.annualProject) return []
  return middleTopics.value.filter(topic => topic.projectId == formData.value.annualProject)
})

// 유틸리티 함수
const getProjectColor = (projectId) => {
  const project = annualProjects.value.find(p => p.id == projectId)
  return project ? project.color : '#999999'
}

// 메서드 - 오늘할일용
const addOrUpdateTask = () => {
  if (!formData.value.todoTask.trim()) return
  
  const taskData = { ...formData.value }
  
  if (editingIndex.value !== -1) {
    // 수정 모드
    todayTasks.value[editingIndex.value] = taskData
    editingIndex.value = -1
  } else {
    // 추가 모드
    todayTasks.value.push(taskData)
  }
  
  // 폼 리셋
  resetForm()
}

const editTask = (index) => {
  editingIndex.value = index
  formData.value = { ...todayTasks.value[index] }
}

const removeExistingTask = (index) => {
  todayTasks.value.splice(index, 1)
  if (editingIndex.value === index) {
    cancelEdit()
  }
}

const cancelEdit = () => {
  editingIndex.value = -1
  resetForm()
}

const resetForm = () => {
  formData.value = {
    annualProject: '',
    middleTopic: '',
    todoTask: '',
    detailContent: '',
    deadline: '',
    isMyJob: false
  }
}

// 메서드 - 기존 할일 목록용
const addNewTask = () => {
  tasks.value.push({
    text: '',
    completed: false
  })
}

const removeTask = (index) => {
  tasks.value.splice(index, 1)
}

const closeModal = () => {
  emit('close')
}

const saveTasks = () => {
  if (props.projectName === '오늘할일') {
    // 오늘할일 데이터 저장
    const data = {
      type: 'today-task',
      formData: { ...formData.value }
    }
    emit('save', data)
  } else {
    // 기존 할일 목록 데이터 저장
    const validTasks = tasks.value.filter(task => task.text.trim() !== '')
    const data = {
      type: 'task-list',
      tasks: validTasks,
      memo: memo.value
    }
    emit('save', data)
  }
}

// 초기 데이터 설정
const initializeData = () => {
  if (props.projectName === '오늘할일') {
    // 오늘할일 폼 초기화
    if (props.initialData.type === 'today-task' && props.initialData.formData) {
      formData.value = { ...props.initialData.formData }
    } else {
      formData.value = {
        annualProject: '',
        middleTopic: '',
        todoTask: '',
        detailContent: '',
        deadline: '',
        isMyJob: false
      }
    }
  } else {
    // 기존 할일 목록 초기화
    if (props.initialData.tasks && props.initialData.tasks.length > 0) {
      tasks.value = [...props.initialData.tasks]
    } else {
      tasks.value = [{ text: '', completed: false }]
    }
    memo.value = props.initialData.memo || ''
  }
}

// 연간사업 변경 시 중간주제 초기화
watch(() => formData.value.annualProject, () => {
  formData.value.middleTopic = ''
})

// props 변경 감지
watch(() => props.initialData, initializeData, { immediate: true, deep: true })
</script>

<style scoped>
.task-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.task-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.modal-content {
  padding: 2rem;
}

/* 오늘할일 폼 스타일 */
.today-task-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.existing-tasks h4,
.new-task-form h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e1e5e9;
}

/* 기존 할일 태그들 */
.tasks-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.task-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
  font-weight: 500;
  max-width: 200px;
}

.task-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.task-tag-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.task-tag-remove:hover {
  background: rgba(255,255,255,0.3);
}

/* 새 할일 폼 */
.new-task-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-select:disabled {
  background: #f8f9fa;
  color: #999;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
  margin: 0;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-text {
  color: #555;
  font-size: 0.9rem;
}

.add-update-btn,
.cancel-edit-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-update-btn {
  background: #667eea;
  color: white;
}

.add-update-btn:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.cancel-edit-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
  margin-top: 0.5rem;
}

.cancel-edit-btn:hover {
  background: #e9ecef;
  color: #333;
}

/* 기존 프로젝트 할일 폼 스타일 */
.project-task-form {
  display: flex;
  flex-direction: column;
}

.tasks-list {
  margin-bottom: 1.5rem;
}

.task-item {
  margin-bottom: 0.75rem;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.task-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.task-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.task-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
  font-size: 0.9rem;
}

.remove-btn:hover {
  background: #ffe8e8;
}

.add-task-btn {
  width: 100%;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 2px dashed #ddd;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  margin-bottom: 1.5rem;
}

.add-task-btn:hover {
  background: #e9ecef;
  border-color: #667eea;
  color: #667eea;
}

.memo-section {
  margin-bottom: 1rem;
}

.memo-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.memo-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}

.memo-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e1e5e9;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background: #e9ecef;
  color: #333;
}

.save-btn {
  background: #667eea;
  color: white;
}

.save-btn:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

@media (max-width: 640px) {
  .task-modal {
    margin: 0.5rem;
    max-width: none;
  }
  
  .modal-header,
  .modal-content,
  .modal-footer {
    padding: 1rem;
  }
  
  .today-task-form {
    gap: 1rem;
  }
  
  .new-task-form {
    gap: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .cancel-btn,
  .save-btn {
    width: 100%;
  }
  
  .tasks-grid {
    gap: 0.5rem;
  }
  
  .task-tag {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }
}
</style>
