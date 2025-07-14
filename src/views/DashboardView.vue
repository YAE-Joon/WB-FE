<template>
  <div class="dashboard">
    <!-- 헤더 영역 -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>손수레</h1>
        <div class="user-info">
          <span>안녕하세요! 사용자님</span>
          <button @click="logout" class="logout-btn">로그아웃</button>
        </div>
      </div>
    </header>

    <!-- 메인 컨텐츠 영역 -->
    <main class="dashboard-main">
      <!-- 왼쪽: 월간 달력 -->
      <section class="calendar-section">
        <div class="calendar-container">
          <div class="calendar-header">
            <button @click="prevMonth" class="nav-btn">‹</button>
            <h2>{{ currentMonth }}</h2>
            <button @click="nextMonth" class="nav-btn">›</button>
          </div>
          
          <!-- 요일 헤더 -->
          <div class="weekdays-header">
            <div v-for="day in weekdays" :key="day" class="weekday-cell">{{ day }}</div>
          </div>
          
          <!-- 달력 그리드 -->
          <div class="calendar-grid">
            <!-- 날짜 셀들 -->
            <div 
              v-for="day in calendarDays" 
              :key="day.date" 
              class="date-cell"
              :class="{
                'other-month': !day.isCurrentMonth,
                'today': day.isToday,
                'selected-week': day.isInSelectedWeek
              }"
              @click="selectDate(day)"
            >
              <span class="date-number">{{ day.day }}</span>
            </div>
            
            <!-- 일정 바들 - 별도 레이어 -->
            <div class="events-overlay">
              <div 
              v-for="eventBar in eventBars" 
              :key="`${eventBar.schedule.id}-${eventBar.week}-${eventBar.start}`"
              class="event-bar"
              :style="{
              backgroundColor: eventBar.schedule.color,
              left: `${eventBar.left}%`,
              width: `${eventBar.width}%`,
              top: `${eventBar.top}px`
              }"
              >
              <span v-if="eventBar.showName" class="event-name">{{ eventBar.schedule.name }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 일정추가 버튼 -->
        <div class="calendar-footer">
          <button @click="openScheduleModal" class="add-schedule-btn">
            <span class="plus-icon">+</span>
            일정추가
          </button>
        </div>
      </section>
      
      <!-- 오른쪽: 주간 할일 정리 -->
      <section class="right-section">
        <div class="weekly-tasks">
          <div class="weekly-header">
            <button @click="prevWeek" class="week-nav">‹</button>
            <h3 class="week-title">{{ currentWeekTitle }}</h3>
            <button @click="nextWeek" class="week-nav">›</button>
          </div>
          
          <!-- 주간 테이블 -->
          <div class="weekly-table">
            <!-- 요일/날짜 헤더 -->
            <div class="table-header">
              <div class="header-spacer"></div>
              <div 
                v-for="(day, index) in weekDays" 
                :key="day.date" 
                class="day-header-cell"
                :class="{ 'today': day.isToday }"
              >
                <div class="day-name">{{ day.dayName }}</div>
                <div class="day-date">{{ day.dateNum }}</div>
              </div>
            </div>
            
            <!-- 오늘할일 행 -->
            <div class="table-row">
              <div class="row-title">오늘할일</div>
              <div 
                v-for="(day, index) in weekDays" 
                :key="`today-${day.date}`" 
                class="task-cell today-task-cell"
                :class="{ 'today': day.isToday }"
                @click="openTodayTaskModal(day)"
              >
                <div class="task-display">
                  <!-- 할일 태그들 표시 -->
                  <div v-if="todayTasks[day.date] && todayTasks[day.date].length > 0" class="task-tags">
                    <div 
                      v-for="task in todayTasks[day.date]" 
                      :key="task.id"
                      class="task-tag"
                      @click.stop="openTaskEditModal(day, task)"
                    >
                      {{ task.name }}
                    </div>
                  </div>
                  <!-- 빈 상태일 때 플레이스홀더 -->
                  <div v-else class="task-placeholder">
                    할일을 입력하세요
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 일정바 프로젝트별 행들 -->
            <div 
              v-for="project in projects" 
              :key="project.id"
              class="table-row"
            >
              <div class="row-title project-title" :style="{ backgroundColor: project.color }">
                {{ project.name }}
              </div>
              <div 
                v-for="(day, index) in weekDays" 
                :key="`${project.id}-${day.date}`" 
                class="task-cell"
                :class="{ 'today': day.isToday }"
              >
                <div class="task-display">
                  <div class="task-placeholder">
                    {{ project.name }} 관련 작업
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 할일 모달 -->
    <div v-if="showTaskModal" class="modal-overlay" @click="closeTaskModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditMode ? '할일 수정' : '새 할일 추가' }}</h3>
          <button @click="closeTaskModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="task-project">연간 사업</label>
            <select 
              id="task-project"
              v-model="currentTask.projectId" 
              class="form-select"
              :disabled="isLoadingProjects"
            >
              <option value="null">
                {{ isLoadingProjects ? '로딩 중...' : '연간 사업을 선택하세요' }}
              </option>
              <option 
                v-for="project in yearlyProjects" 
                :key="project.id" 
                :value="project.id"
              >
                {{ project.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="task-subject">주제</label>
            <select 
              id="task-subject"
              v-model="currentTask.subjectId" 
              class="form-select"
              :disabled="!currentTask.projectId || isLoadingSubjects"
            >
              <option value="null">
                {{ !currentTask.projectId 
                  ? '먼저 연간사업을 선택하세요' 
                  : isLoadingSubjects 
                    ? '주제 로딩 중...' 
                    : '주제를 선택하세요' 
                }}
              </option>
              <option 
                v-for="subject in projectSubjects" 
                :key="subject.id" 
                :value="subject.id"
              >
                {{ subject.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="task-name">할 일</label>
            <input 
              id="task-name"
              type="text" 
              v-model="currentTask.name" 
              placeholder="할일 이름을 입력하세요"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="task-content">세부 내용</label>
            <textarea 
              id="task-content"
              v-model="currentTask.content" 
              placeholder="세부 내용을 입력하세요"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="task-deadline">마감일</label>
            <input 
              id="task-deadline"
              type="date" 
              v-model="currentTask.deadline" 
              class="form-input"
            >
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="currentTask.myTask" 
                class="form-checkbox"
              >
              <span class="checkbox-text">내 할일</span>
            </label>
          </div>
        </div>
        
        <div class="modal-footer">
          <button v-if="isEditMode" @click="deleteTask" class="delete-btn">삭제</button>
          <div class="button-group">
            <button @click="closeTaskModal" class="cancel-btn">취소</button>
            <button @click="saveTask" class="save-btn">저장</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 일정추가 모달 -->
    <div v-if="showScheduleModal" class="modal-overlay" @click="closeScheduleModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>일정 추가</h3>
          <button @click="closeScheduleModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="schedule-project">연간 사업</label>
            <select 
              id="schedule-project"
              v-model="currentSchedule.projectId" 
              class="form-select"
              :disabled="isLoadingProjects"
            >
              <option value="null">
                {{ isLoadingProjects ? '로딩 중...' : '연간 사업을 선택하세요' }}
              </option>
              <option 
                v-for="project in yearlyProjects" 
                :key="project.id" 
                :value="project.id"
              >
                {{ project.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="schedule-name">일정</label>
            <input 
              id="schedule-name"
              type="text" 
              v-model="currentSchedule.scheduleName" 
              placeholder="일정 이름을 입력하세요"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="schedule-content">세부내용</label>
            <textarea 
              id="schedule-content"
              v-model="currentSchedule.content" 
              placeholder="세부 내용을 입력하세요"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="schedule-start">시작일</label>
            <input 
              id="schedule-start"
              type="date" 
              v-model="currentSchedule.startDate" 
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="schedule-end">마감일</label>
            <input 
              id="schedule-end"
              type="date" 
              v-model="currentSchedule.endDate" 
              class="form-input"
            >
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="button-group">
            <button @click="closeScheduleModal" class="cancel-btn">취소</button>
            <button @click="saveSchedule" class="save-btn">저장</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

// API 호출 함수
const fetchYearlyProjects = async () => {
  console.log('확인: 연간사업 API 호출 시작...')
  isLoadingProjects.value = true
  
  try {
    const apiUrl = 'http://localhost:8000/api/v1/category/level0'
    console.log('확인: API URL:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 필요시 인증 헤더 추가
        // 'Authorization': `Bearer ${auth.token}`
      }
    })
    
    console.log('확인: Response status:', response.status)
    console.log('확인: Response ok:', response.ok)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('확인: 원본 응답 데이터:', data)
    
    // API 응답 데이터 변환
    let transformedData
    
    if (Array.isArray(data)) {
      // 배열인 경우
      if (typeof data[0] === 'string') {
        // 문자열 배열인 경우
        transformedData = data.map((name, index) => ({
          id: index + 1,
          name: name
        }))
      } else {
        // 이미 객체 배열인 경우
        transformedData = data
      }
    } else if (typeof data === 'object' && data !== null) {
      // 객체인 경우 (key-value 쌍)
      transformedData = Object.entries(data).map(([id, name]) => ({
        id: parseInt(id),
        name: name
      }))
      console.log('확인: 객체를 배열로 변환:', transformedData)
    } else {
      transformedData = []
    }
    
    yearlyProjects.value = transformedData
    console.log('연간사업 목록 조회 성공:', transformedData)
  } catch (error) {
    console.error('연간사업 목록 조회 실패:', error)
    console.error('에러 세부정보:', {
      message: error.message,
      stack: error.stack
    })
    
    // 테스트용 기본 데이터 사용
    console.log('확인: 테스트용 기본 데이터 사용')
    yearlyProjects.value = [
      { id: 1, name: '[테스트] 웹사이트 리뉴얼' },
      { id: 2, name: '[테스트] 모바일 앱 개발' },
      { id: 3, name: '[테스트] 마케팅 캠페인' }
    ]
  } finally {
    isLoadingProjects.value = false
    console.log('확인: API 호출 완료, 로딩 상태:', isLoadingProjects.value)
  }
}

// 연간사업별 주제 목록 조회 함수
const fetchSubjectsByProject = async (projectId) => {
  if (!projectId) {
    projectSubjects.value = []
    return
  }
  
  console.log(`확인: 연간사업 ${projectId}의 주제 목록 조회 시작...`)
  isLoadingSubjects.value = true
  
  try {
    const apiUrl = `http://localhost:8000/api/v1/category/level1/${projectId}`
    console.log('확인: 주제 API URL:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('확인: 주제 Response status:', response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('확인: 주제 원본 응답 데이터:', data)
    
    // API 응답에서 name 필드만 추출하여 표시
    projectSubjects.value = data
    console.log('주제 목록 조회 성공:', data)
    
  } catch (error) {
    console.error('주제 목록 조회 실패:', error)
    console.error('에러 세부정보:', {
      message: error.message,
      stack: error.stack
    })
    
    // 에러 시 빈 배열
    projectSubjects.value = []
  } finally {
    isLoadingSubjects.value = false
    console.log('확인: 주제 API 호출 완료, 로딩 상태:', isLoadingSubjects.value)
  }
}

// 일정바 데이터 조회 함수
const fetchScheduleData = async () => {
  console.log('확인: 일정바 데이터 API 호출 시작...')
  console.log('확인: 기본 테스트 데이터가 이미 설정됨:', scheduleData.value)
  
  // API 호출은 나중에 구현
  try {
    const apiUrl = 'http://localhost:8000/api/v1/category/level1'
    console.log('확인: 일정바 API URL:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('확인: 일정바 원본 데이터:', data)
    
    // 일정바 데이터 변환 및 색상 할당
    const transformedSchedules = data.map((schedule, index) => {
      // parent_id를 기준으로 색상 할당
      const colorIndex = schedule.parent_id ? (schedule.parent_id - 1) % colors.length : index % colors.length
      
      return {
        id: schedule.id,
        name: schedule.name,
        started_at: schedule.started_at || schedule.start_date,
        end_at: schedule.end_at || schedule.end_date,
        parent_id: schedule.parent_id,
        color: colors[colorIndex]
      }
    })
    
    scheduleData.value = transformedSchedules
    console.log('일정바 데이터 조회 성공:', transformedSchedules)
    
  } catch (error) {
    console.error('일정바 데이터 조회 실패:', error)
    console.log('확인: API 실패, 기본 테스트 데이터 사용')
  }
}

// 날짜 관련 상태
const currentDate = ref(new Date())
const selectedDate = ref(new Date())
const currentWeek = ref(new Date())

// 모달 관련 상태
const showTaskModal = ref(false)
const selectedDay = ref(null)
const currentTask = ref(null)
const isEditMode = ref(false)

// 일정 모달 관련 상태
const showScheduleModal = ref(false)
const currentSchedule = ref(null)

// 할일 데이터
const todayTasks = ref({
  // 예시 데이터
  '2025-07-08': [
    { 
      id: 1, 
      name: '회의', 
      content: '오전 10시 프로젝트 모임',
      projectId: 1,
      subjectId: 1,
      deadline: '2025-07-08',
      myTask: true
    },
    { 
      id: 2, 
      name: '이메일', 
      content: '고객 문의 답변',
      projectId: 2,
      subjectId: 2,
      deadline: '2025-07-09',
      myTask: false
    }
  ],
  '2025-07-09': [
    { 
      id: 3, 
      name: '문서작성', 
      content: '기획서 작성',
      projectId: 1,
      subjectId: 3,
      deadline: '2025-07-10',
      myTask: true
    }
  ]
})

// 연간 사업 목록 (API에서 가져올 데이터)
const yearlyProjects = ref([])
const isLoadingProjects = ref(false)

// 주제 목록 (연간사업별로 동적 조회)
const projectSubjects = ref([])
const isLoadingSubjects = ref(false)

// 일정바 데이터 (본격 테스트 데이터)
const scheduleData = ref([
  {
    id: 1,
    name: '[테스트] 웹사이트 리뉴얼 계획',
    started_at: '2025-07-01',
    end_at: '2025-07-15',
    parent_id: 1,
    color: '#FF6B6B'
  },
  {
    id: 2,
    name: '[테스트] 모바일 앱 개발',
    started_at: '2025-07-08',
    end_at: '2025-07-25',
    parent_id: 2,
    color: '#4ECDC4'
  },
  {
    id: 3,
    name: '[테스트] 마케팅 캐페인',
    started_at: '2025-06-28',
    end_at: '2025-07-10',
    parent_id: 3,
    color: '#45B7D1'
  },
  {
    id: 4,
    name: '[테스트] 데이터 분석',
    started_at: '2025-07-12',
    end_at: '2025-07-30',
    parent_id: 1,
    color: '#FF6B6B'
  },
  {
    id: 5,
    name: '[테스트] UI/UX 디자인',
    started_at: '2025-07-03',
    end_at: '2025-07-18',
    parent_id: 2,
    color: '#4ECDC4'
  }
])

// parent_id별 색상 배열
const colors = [
  '#FF6B6B', // 빨간
  '#4ECDC4', // 청록
  '#45B7D1', // 파란
  '#96CEB4', // 연초록
  '#FFEAA7', // 노란
  '#DDA0DD', // 보라
  '#98D8C8', // 민트
  '#F7DC6F', // 금색
  '#BB8FCE', // 라벤더
  '#85C1E9'  // 하늘색
]

// 주제 목록 (DB에서 가져올 데이터)
const subjects = ref([
  { id: 1, name: '기획' },
  { id: 2, name: '개발' },
  { id: 3, name: '디자인' },
  { id: 4, name: '마케팅' },
  { id: 5, name: '운영' },
  { id: 6, name: '분석' }
])

// 요일 배열
const weekdays = ['월', '화', '수', '목', '금', '토', '일']

// 연간사업별 색상 할당을 위한 computed
const projects = computed(() => {
  return yearlyProjects.value.map((project, index) => ({
    id: project.id,
    name: project.name,
    color: colors[index % colors.length]
  }))
})

// 현재 월 표시
const currentMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}년 ${month}월`
})

// 현재 주 제목
const currentWeekTitle = computed(() => {
  const startOfWeek = getWeekStart(currentWeek.value)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  const startMonth = startOfWeek.getMonth() + 1
  const startDay = startOfWeek.getDate()
  const endMonth = endOfWeek.getMonth() + 1
  const endDay = endOfWeek.getDate()
  
  return `${startMonth}/${startDay} - ${endMonth}/${endDay}`
})

// 주간 날짜들
const weekDays = computed(() => {
  const startOfWeek = getWeekStart(currentWeek.value)
  const days = []
  const today = new Date()
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    
    days.push({
      date: date.toISOString().split('T')[0],
      dateNum: date.getDate(),
      dayName: weekdays[i],
      isToday: date.toDateString() === today.toDateString()
    })
  }
  
  return days
})

// 유틸리티 함수
const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const result = new Date(d.setDate(diff))
  result.setHours(0, 0, 0, 0)
  return result
}

// 달력 날짜들 생성
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(firstDay)
  const firstDayOfWeek = firstDay.getDay()
  const mondayOffset = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek
  startDate.setDate(firstDay.getDate() + mondayOffset)
  
  const days = []
  const today = new Date()
  
  // 선택된 주의 시작일과 마지막일 계산
  const selectedWeekStart = getWeekStart(currentWeek.value)
  const selectedWeekEnd = new Date(selectedWeekStart)
  selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6)
  
  selectedWeekStart.setHours(0, 0, 0, 0)
  selectedWeekEnd.setHours(23, 59, 59, 999)
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    date.setHours(0, 0, 0, 0)
    
    // 선택된 주인지 확인
    const isInSelectedWeek = date >= selectedWeekStart && date <= selectedWeekEnd
    
    days.push({
      date: date.toISOString().split('T')[0],
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString(),
      isInSelectedWeek: isInSelectedWeek
    })
  }
  
  return days
})

// 일정 바들 계산 (level1 API 데이터 사용)
const eventBars = computed(() => {
  console.log('확인: eventBars computed 실행, scheduleData.value:', scheduleData.value)
  console.log('확인: scheduleData 길이:', scheduleData.value.length)
  
  const bars = []
  
  if (calendarDays.value.length === 0) {
    console.log('확인: calendarDays가 비어있음')
    return bars
  }
  
  const calendarStart = new Date(calendarDays.value[0].date)
  const calendarEnd = new Date(calendarDays.value[41].date)
  
  console.log('확인: 달력 범위:', calendarStart.toISOString().split('T')[0], '~', calendarEnd.toISOString().split('T')[0])
  
  // 각 주별로 일정 바 생성
  for (let week = 0; week < 6; week++) {
    const weekStart = week * 7
    const weekEnd = weekStart + 6
    const weekSchedules = []
    
    console.log(`확인: 주 ${week} 처리 시작`)
    
    // 이 주에 있는 일정들 찾기
    scheduleData.value.forEach((schedule, scheduleIndex) => {
      console.log(`확인: 일정 ${scheduleIndex} 처리:`, {
        name: schedule.name,
        started_at: schedule.started_at,
        end_at: schedule.end_at,
        전체: schedule
      })
      
      if (!schedule.started_at || !schedule.end_at) {
        console.log('확인: 날짜가 없는 일정 스킵:', schedule.name)
        return
      }
      
      const scheduleStart = new Date(schedule.started_at)
      const scheduleEnd = new Date(schedule.end_at)
      
      console.log(`확인: 일정 "${schedule.name}" 날짜 검사:`)
      console.log('  - scheduleStart:', scheduleStart.toISOString().split('T')[0], scheduleStart)
      console.log('  - scheduleEnd:', scheduleEnd.toISOString().split('T')[0], scheduleEnd)
      console.log('  - calendarStart:', calendarStart.toISOString().split('T')[0], calendarStart)
      console.log('  - calendarEnd:', calendarEnd.toISOString().split('T')[0], calendarEnd)
      
      // 날짜 비교 로직
      const isInRange = scheduleEnd >= calendarStart && scheduleStart <= calendarEnd
      console.log('  - 달력 범위에 포함되나?', isInRange)
      
      if (isInRange) {
        console.log('확인: 일정이 달력 범위에 포함됨:', schedule.name)
        let barStart = -1
        let barEnd = -1
        
        for (let day = weekStart; day <= weekEnd; day++) {
          if (day >= calendarDays.value.length) break
          const currentDate = new Date(calendarDays.value[day].date)
          
          console.log(`    - 날 ${day} 검사:`, currentDate.toISOString().split('T')[0])
          
          if (currentDate >= scheduleStart && currentDate <= scheduleEnd) {
            console.log(`      -> 일정 범위에 포함됨`)
            if (barStart === -1) barStart = day - weekStart
            barEnd = day - weekStart
          }
        }
        
        if (barStart !== -1) {
          console.log(`확인: 주 ${week}에 일정바 추가:`, schedule.name, 'start:', barStart, 'end:', barEnd)
          weekSchedules.push({
            schedule,
            start: barStart,
            end: barEnd,
            originalIndex: scheduleIndex
          })
        } else {
          console.log(`확인: 주 ${week}에서 일정바 생성 실패:`, schedule.name)
        }
      } else {
        console.log('확인: 일정이 달력 범위에 포함되지 않음:', schedule.name)
      }
    })
    
    console.log(`확인: 주 ${week} weekSchedules:`, weekSchedules)
    
    // 이 주의 일정들을 레이어별로 배치 (겹치지 않도록)
    const layers = []
    weekSchedules.forEach(sched => {
      let assignedLayer = -1
      
      // 기존 레이어에서 겹치지 않는 자리 찾기
      for (let layer = 0; layer < layers.length; layer++) {
        let canPlace = true
        for (const existingSched of layers[layer]) {
          // 겹치는지 확인
          if (!(sched.end < existingSched.start || sched.start > existingSched.end)) {
            canPlace = false
            break
          }
        }
        if (canPlace) {
          assignedLayer = layer
          break
        }
      }
      
      // 새 레이어 생성
      if (assignedLayer === -1) {
        assignedLayer = layers.length
        layers.push([])
      }
      
      layers[assignedLayer].push(sched)
      
      // 바 생성
      const left = (sched.start / 7) * 100
      const width = ((sched.end - sched.start + 1) / 7) * 100
      const top = 32 + week * 140 + assignedLayer * 26
      
      // 너비가 100%를 넘지 않도록 제한
      const maxWidth = 100 - left
      const finalWidth = Math.min(width, maxWidth)
      
      const bar = {
        schedule: sched.schedule,
        week,
        start: sched.start,
        end: sched.end,
        left,
        width: finalWidth,
        top,
        layer: assignedLayer,
        showName: sched.start === 0 || week === 0 // 첫 번째 날이나 첫 번째 주에 이름 표시
      }
      
      console.log('확인: 일정바 생성됨:', bar)
      bars.push(bar)
    })
  }
  
  console.log('확인: 총 일정바 개수:', bars.length)
  console.log('확인: 생성된 모든 일정바:', bars)
  return bars
})

// 메서드들
const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const prevWeek = () => {
  const newWeek = new Date(currentWeek.value)
  newWeek.setDate(newWeek.getDate() - 7)
  currentWeek.value = newWeek
}

const nextWeek = () => {
  const newWeek = new Date(currentWeek.value)
  newWeek.setDate(newWeek.getDate() + 7)
  currentWeek.value = newWeek
}

const selectDate = (day) => {
  selectedDate.value = new Date(day.date)
  currentWeek.value = new Date(day.date)
}

// 연간사업 선택 변경 감지
watch(() => currentTask.value?.projectId, (newProjectId, oldProjectId) => {
  if (newProjectId !== oldProjectId) {
    // 연간사업이 변경되면 주제 초기화 및 새로운 주제 목록 조회
    if (currentTask.value) {
      currentTask.value.subjectId = null
    }
    fetchSubjectsByProject(newProjectId)
  }
})

// 할일 모달 관련 메서드
const openTodayTaskModal = (day) => {
  selectedDay.value = day
  currentTask.value = { 
    name: '', 
    content: '', 
    projectId: null, 
    subjectId: null, 
    deadline: day.date,
    myTask: false
  }
  isEditMode.value = false
  showTaskModal.value = true
}

const openTaskEditModal = (day, task) => {
  selectedDay.value = day
  currentTask.value = { ...task }
  isEditMode.value = true
  showTaskModal.value = true
}

const closeTaskModal = () => {
  showTaskModal.value = false
  selectedDay.value = null
  currentTask.value = null
  isEditMode.value = false
}

const saveTask = () => {
  if (!currentTask.value.name.trim() || !selectedDay.value) return
  
  const dateKey = selectedDay.value.date
  
  if (!todayTasks.value[dateKey]) {
    todayTasks.value[dateKey] = []
  }
  
  if (isEditMode.value) {
    // 수정 모드
    const taskIndex = todayTasks.value[dateKey].findIndex(t => t.id === currentTask.value.id)
    if (taskIndex > -1) {
      todayTasks.value[dateKey][taskIndex] = { ...currentTask.value }
    }
  } else {
    // 새 할일 추가
    const newTask = {
      id: Date.now(),
      name: currentTask.value.name,
      content: currentTask.value.content,
      projectId: currentTask.value.projectId,
      subjectId: currentTask.value.subjectId,
      deadline: currentTask.value.deadline,
      myTask: currentTask.value.myTask
    }
    todayTasks.value[dateKey].push(newTask)
  }
  
  closeTaskModal()
}

const deleteTask = () => {
  if (!isEditMode.value || !selectedDay.value || !currentTask.value) return
  
  const dateKey = selectedDay.value.date
  const taskIndex = todayTasks.value[dateKey].findIndex(t => t.id === currentTask.value.id)
  
  if (taskIndex > -1) {
    todayTasks.value[dateKey].splice(taskIndex, 1)
  }
  
  closeTaskModal()
}

// 일정 모달 관련 메서드
const openScheduleModal = () => {
  currentSchedule.value = {
    projectId: null,
    scheduleName: '',
    content: '',
    startDate: '',
    endDate: ''
  }
  showScheduleModal.value = true
}

const closeScheduleModal = () => {
  showScheduleModal.value = false
  currentSchedule.value = null
}

const saveSchedule = async () => {
  if (!currentSchedule.value.scheduleName.trim()) {
    alert('일정 이름을 입력해주세요.')
    return
  }
  
  if (!currentSchedule.value.projectId) {
    alert('연간 사업을 선택해주세요.')
    return
  }
  
  try {
    // 선택된 연간사업 이름 찾기
    const selectedProject = yearlyProjects.value.find(p => p.id === currentSchedule.value.projectId)
    const projectName = selectedProject ? selectedProject.name : ''
    
    // path 생성: "/연간사업이름/일정"
    const path = `/${projectName}/${currentSchedule.value.scheduleName}`
    
    const requestData = {
      path: path,
      name: currentSchedule.value.scheduleName,
      content: currentSchedule.value.content || '',
      started_at: currentSchedule.value.startDate || null,
      end_at: currentSchedule.value.endDate || null
    }
    
    console.log('일정 저장 요청 데이터:', requestData)
    
    const response = await fetch('http://localhost:8000/api/v1/category', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 필요시 인증 헤더 추가
        // 'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify(requestData)
    })
    
    console.log('일정 저장 응답 상태:', response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('일정 저장 성공:', result)
    
    alert('일정이 성공적으로 저장되었습니다.')
    closeScheduleModal()
    
    // 일정 다시 조회하여 달력에 반영
    await fetchScheduleData()
    
  } catch (error) {
    console.error('일정 저장 실패:', error)
    alert('일정 저장에 실패했습니다. 다시 시도해주세요.')
  }
}

const logout = () => {
  auth.logout()
  router.push('/')
}

// 컴포넌트 마운트 시 API 호출
onMounted(() => {
  console.log('확인: 컴포넌트 마운트 완료')
  fetchYearlyProjects()
  fetchScheduleData()
})

// 디버깅용 전역 함수 (브라우저 콘솔에서 사용 가능)
if (typeof window !== 'undefined') {
  window.testApiConnection = async () => {
    console.log('테스트: Backend 연결 확인 시작...')
    
    try {
      // 1. Health check 또는 기본 API 테스트
      const testUrl = 'http://localhost:8000/api/v1/category/level0'
      console.log('테스트: 요청 URL:', testUrl)
      
      const response = await fetch(testUrl)
      console.log('테스트: 응답 상태코드:', response.status)
      console.log('테스트: 응답 헤더:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log('테스트: 성공! 데이터:', data)
        return data
      } else {
        console.log('테스트: 실패 - HTTP', response.status)
        const text = await response.text()
        console.log('테스트: 에러 내용:', text)
      }
    } catch (error) {
      console.error('테스트: 네트워크 에러:', error)
    }
  }
  
  console.log('확인: window.testApiConnection() 함수가 등록되었습니다.')
  console.log('확인: 브라우저 콘솔에서 "window.testApiConnection()" 실행하여 연결 테스트 가능')
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
}

.dashboard-header {
  background: white;
  border-bottom: 1px solid #e1e5e9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #ff5252;
}

.dashboard-main {
  max-width: 1800px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 600px 1fr;
  gap: 2rem;
  height: calc(100vh - 80px);
}

/* 달력 섹션 */
.calendar-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  height: fit-content;
  display: flex;
  flex-direction: column;
}

/* 일정추가 버튼 영역 */
.calendar-footer {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.add-schedule-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.add-schedule-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.plus-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.calendar-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #667eea;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: #f0f4ff;
}

/* 요일 헤더 */
.weekdays-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 2px solid #e1e5e9;
  margin-bottom: 0;
}

.weekday-cell {
  text-align: center;
  padding: 0.8rem 0.5rem;
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
  background: #f8f9fa;
}

/* 달력 그리드 */
.calendar-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 140px);
  border: 1px solid #e1e5e9;
  border-top: none;
  overflow: hidden;
}

/* 날짜 셀 */
.date-cell {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0.5rem;
  border-right: 1px solid #e1e5e9;
  border-bottom: 1px solid #e1e5e9;
  background: white;
  cursor: pointer;
  transition: background 0.2s;
}

.date-cell:nth-child(7n) {
  border-right: none;
}

.date-cell:nth-child(n+36):nth-child(-n+42) {
  border-bottom: none;
}

.date-cell:hover {
  background: #f0f4ff;
}

.date-cell.today {
  background: #667eea;
  color: white;
}

.date-cell.other-month {
  opacity: 0.3;
  background: #fafafa;
}

.date-cell.selected-week {
  background: #e3f2fd;
}

.date-cell.selected-week.today {
  background: #667eea;
  color: white;
}

.date-number {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.date-cell.today .date-number {
  color: white;
}

/* 일정 바들 오버레이 */
.events-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
}

/* 일정 바 */
.event-bar {
  position: absolute;
  height: 14px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  padding: 0 0.4rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: all 0.2s;
  margin-bottom: 2px;
}

.event-bar:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  z-index: 20;
}

.event-name {
  font-size: 0.6rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 0 2px rgba(0,0,0,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 오른쪽 섹션 - 주간 할일 */
.right-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.weekly-tasks {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 주간 헤더 */
.weekly-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.week-title {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.week-nav {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #667eea;
  transition: background 0.2s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.week-nav:hover {
  background: #e3f2fd;
}

/* 주간 테이블 */
.weekly-table {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 테이블 헤더 */
.table-header {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
  border-bottom: 2px solid #e1e5e9;
  flex-shrink: 0;
}

/* 헤더 스페이서 */
.header-spacer {
  background: #f8f9fa;
  border-right: 1px solid #e1e5e9;
}

/* 테이블 행 */
.table-row {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
  border-bottom: 1px solid #e1e5e9;
}

/* 행 제목 */
.row-title {
  padding: 1rem 0.75rem;
  background: #f8f9fa;
  border-right: 1px solid #e1e5e9;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

/* 프로젝트 제목 */
.project-title {
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  font-weight: 700;
  text-align: center;
  font-size: 0.8rem;
  line-height: 1.2;
}

/* 작업 셀 */
.task-cell {
  padding: 0.75rem;
  border-right: 1px solid #e1e5e9;
  background: white;
  height: 120px;
  cursor: pointer;
  transition: all 0.2s;
  overflow-y: auto;
}

/* 스크롤바 숨기기 */
.task-cell::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.task-cell::-webkit-scrollbar-thumb {
  background: transparent;
}

.task-cell {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE */
}

.task-cell:last-child {
  border-right: none;
}

.task-cell.today {
  background: #f0f4ff;
}

.task-cell:hover {
  background: #f8f9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.task-cell.today:hover {
  background: #e8f0fe;
}

/* 작업 표시 영역 */
.task-display {
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0;
  border-radius: 4px;
  transition: all 0.2s;
}

.task-summary {
  color: #667eea;
  font-weight: 600;
  font-size: 0.85rem;
  text-align: center;
}

.task-placeholder {
  color: #aaa;
  font-size: 0.8rem;
  text-align: center;
  font-style: italic;
}

.day-header-cell {
  padding: 1rem 0.75rem;
  text-align: center;
  border-right: 1px solid #e1e5e9;
  background: #f8f9fa;
  transition: all 0.2s;
}

.day-header-cell:last-child {
  border-right: none;
}

.day-header-cell.today {
  background: #667eea;
  color: white;
}

.day-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.25rem;
}

.day-date {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
}

.day-header-cell.today .day-name,
.day-header-cell.today .day-date {
  color: white;
}

@media (max-width: 1200px) {
  .dashboard-main {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .calendar-section {
    order: 2;
  }
  
  .right-section {
    order: 1;
  }
}

/* 할일 태그 스타일 */
.task-tags {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  padding: 0.2rem;
}

/* 태그 영역 스크롤바 숨기기 */
.task-tags::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.task-tags::-webkit-scrollbar-thumb {
  background: transparent;
}

.task-tags {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE */
}

.task-tag {
  background: #667eea;
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.task-tag:hover {
  background: #5a67d8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.today-task-cell {
  cursor: pointer;
}

.today-task-cell:hover {
  background: #f8f9ff !important;
}

/* 모달 스타일 */
.modal-overlay {
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem 2rem 1rem 2rem;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f1f3f4;
  color: #333;
}

.modal-body {
  padding: 1.5rem 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
  background: white;
}

/* 스크롤 형식 select */
.form-select[size] {
  height: auto;
  overflow-y: auto;
  padding: 0;
}

.form-select[size] option {
  padding: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
}

.form-select[size] option:hover {
  background: #f8f9ff;
}

.form-select[size] option:checked {
  background: #667eea;
  color: white;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

/* 체크박스 스타일 */
.checkbox-group {
  margin-bottom: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: #333;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  margin-right: 0.75rem;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-text {
  font-size: 0.9rem;
  user-select: none;
}

.modal-footer {
  padding: 1rem 2rem 1.5rem 2rem;
  border-top: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.button-group {
  display: flex;
  gap: 0.75rem;
}

.save-btn,
.cancel-btn,
.delete-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: #667eea;
  color: white;
}

.save-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e1e5e9;
}

.cancel-btn:hover {
  background: #e9ecef;
  color: #333;
}

.delete-btn {
  background: #ff6b6b;
  color: white;
}

.delete-btn:hover {
  background: #ff5252;
  transform: translateY(-1px);
}

@media (max-width: 1200px) {
  .dashboard-main {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .calendar-section {
    order: 2;
  }
  
  .right-section {
    order: 1;
  }
}

@media (max-width: 768px) {
  .dashboard-main {
    padding: 1rem;
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>