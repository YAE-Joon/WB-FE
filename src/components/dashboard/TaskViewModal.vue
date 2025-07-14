<template>
  <div class="view-modal-overlay" @click="closeModal">
    <div class="view-modal" @click.stop>
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <h3>{{ modalTitle }}</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <!-- 모달 내용 -->
      <div class="modal-content">
        <div class="task-detail">
          <!-- 연간사업 -->
          <div class="detail-row">
            <label>연간사업</label>
            <div class="detail-value">
              <span 
                class="project-badge" 
                :style="{ backgroundColor: getProjectColor(taskData.annualProject) }"
              >
                {{ getProjectName(taskData.annualProject) }}
              </span>
            </div>
          </div>
          
          <!-- 중간주제 -->
          <div class="detail-row" v-if="taskData.middleTopic">
            <label>중간주제</label>
            <div class="detail-value">{{ getTopicName(taskData.middleTopic) }}</div>
          </div>
          
          <!-- 해야할 일 -->
          <div class="detail-row">
            <label>해야할 일</label>
            <div class="detail-value highlight">{{ taskData.todoTask }}</div>
          </div>
          
          <!-- 세부내용 -->
          <div class="detail-row" v-if="taskData.detailContent">
            <label>세부내용</label>
            <div class="detail-value detail-content">{{ taskData.detailContent }}</div>
          </div>
          
          <!-- 마감일 -->
          <div class="detail-row" v-if="taskData.deadline">
            <label>마감일</label>
            <div class="detail-value">
              <span :class="{ 'overdue': isOverdue }">
                {{ formatDate(taskData.deadline) }}
              </span>
            </div>
          </div>
          
          <!-- 내 일 여부 -->
          <div class="detail-row">
            <label>담당</label>
            <div class="detail-value">
              <span :class="{ 'my-job': taskData.isMyJob, 'not-my-job': !taskData.isMyJob }">
                {{ taskData.isMyJob ? '내 일' : '다른 사람 일' }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 모달 푸터 -->
      <div class="modal-footer">
        <button @click="editTask" class="edit-btn">수정</button>
        <button @click="deleteTask" class="delete-btn">삭제</button>
        <button @click="closeModal" class="close-btn-footer">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  dayName: {
    type: String,
    required: true
  },
  taskData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'edit', 'delete'])

// 샘플 데이터 (TaskModal과 동일)
const annualProjects = [
  { id: 1, name: '디지털 전환 프로젝트', color: '#FF6B6B' },
  { id: 2, name: '고객 만족도 향상', color: '#4ECDC4' },
  { id: 3, name: '업무 효율성 개선', color: '#45B7D1' },
  { id: 4, name: '신제품 개발', color: '#96CEB4' },
  { id: 5, name: '마케팅 전략 수립', color: '#FFEAA7' }
]

const middleTopics = [
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
]

// 계산된 속성
const modalTitle = computed(() => {
  return `${props.dayName} - 할일 상세`
})

const isOverdue = computed(() => {
  if (!props.taskData.deadline) return false
  return new Date(props.taskData.deadline) < new Date()
})

// 유틸리티 함수
const getProjectName = (projectId) => {
  const project = annualProjects.find(p => p.id == projectId)
  return project ? project.name : '알 수 없음'
}

const getProjectColor = (projectId) => {
  const project = annualProjects.find(p => p.id == projectId)
  return project ? project.color : '#999999'
}

const getTopicName = (topicId) => {
  const topic = middleTopics.find(t => t.id == topicId)
  return topic ? topic.name : '알 수 없음'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 메서드
const closeModal = () => {
  emit('close')
}

const editTask = () => {
  emit('edit')
}

const deleteTask = () => {
  if (confirm('정말 이 할일을 삭제하시겠습니까?')) {
    emit('delete')
  }
}
</script>

<style scoped>
.view-modal-overlay {
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

.view-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
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

.task-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  color: #333;
  font-size: 1rem;
  line-height: 1.5;
}

.detail-value.highlight {
  font-weight: 600;
  font-size: 1.1rem;
  color: #667eea;
}

.detail-value.detail-content {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #667eea;
  white-space: pre-wrap;
}

.project-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.overdue {
  color: #ff6b6b;
  font-weight: 600;
}

.my-job {
  color: #667eea;
  font-weight: 600;
}

.not-my-job {
  color: #999;
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

.edit-btn,
.delete-btn,
.close-btn-footer {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  background: #667eea;
  color: white;
}

.edit-btn:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.delete-btn {
  background: #ff6b6b;
  color: white;
}

.delete-btn:hover {
  background: #ff5252;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
}

.close-btn-footer {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
}

.close-btn-footer:hover {
  background: #e9ecef;
  color: #333;
}

@media (max-width: 640px) {
  .view-modal {
    margin: 0.5rem;
    max-width: none;
  }
  
  .modal-header,
  .modal-content,
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .edit-btn,
  .delete-btn,
  .close-btn-footer {
    width: 100%;
  }
}
</style>
