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
      <!-- 오늘의 업무 섹션 -->
      <section class="today-work-section">
        <div class="section-header">
          <h2>오늘의 업무</h2>
          <button @click="addWork" class="add-btn">+ 업무 추가</button>
        </div>
        
        <div class="work-table">
          <!-- 테이블 헤더 -->
          <div class="table-header">
            <div class="header-cell">프로젝트</div>
            <div class="header-cell">업무명</div>
            <div class="header-cell">상태</div>
            <div class="header-cell">시작일</div>
            <div class="header-cell">마감일</div>
            <div class="header-cell">내 업무</div>
          </div>
          
          <!-- 업무 목록 (계층형) -->
          <template v-for="category in hierarchicalCategories" :key="category.id">
            <!-- 최상위 카테고리 (업무가 있는 경우만 표시) -->
            <template v-if="hasWorksInCategory(category)">
              <div class="category-row top-level" @click="toggleCategory(category.id)">
                <div class="table-cell category-cell">
                  <span class="dropdown-icon" :class="{ 'expanded': category.expanded }">▶</span>
                  <span class="category-name">{{ category.name }}</span>
                </div>
                <div class="table-cell"></div>
                <div class="table-cell"></div>
                <div class="table-cell"></div>
                <div class="table-cell"></div>
                <div class="table-cell"></div>
              </div>
              
              <!-- 최상위 카테고리의 업무들 (드롭다운 안 한 경우 - 하위 카테고리 업무 포함) -->
              <template v-if="!category.expanded">
                <template v-for="work in getWorksForTopCategory(category.id)" :key="work.id">
                  <div 
                    class="table-row work-row"
                    @click="editWork(work)"
                  >
                    <div class="table-cell work-category">
                      <span class="work-indent">　</span>
                      <span class="work-indicator">┗</span>
                    </div>
                    <div class="table-cell">{{ work.name }}</div>
                    <div class="table-cell">
                      <span class="status-badge" :class="getStatusClass(work.status)">
                        {{ work.status }}
                      </span>
                    </div>
                    <div class="table-cell">{{ formatDate(work.startDate) }}</div>
                    <div class="table-cell">{{ formatDate(work.endDate) }}</div>
                    <div class="table-cell">
                      <input 
                        type="checkbox" 
                        :checked="work.isMyWork" 
                        class="my-work-checkbox readonly"
                        readonly
                        @click.prevent
                      >
                    </div>
                  </div>
                </template>
              </template>
              
              <!-- 하위 카테고리들 (확장된 경우) -->
              <template v-if="category.expanded">
                <template v-for="subCategory in category.children" :key="subCategory.id">
                  <template v-if="hasWorksInCategory(subCategory)">
                    <!-- 2단계 카테고리 -->
                    <div class="category-row sub-level-1">
                      <div class="table-cell category-cell">
                        <span class="tree-connector">┗　　</span>
                        <span class="category-name">{{ subCategory.name }}</span>
                      </div>
                      <div class="table-cell"></div>
                      <div class="table-cell"></div>
                      <div class="table-cell"></div>
                      <div class="table-cell"></div>
                      <div class="table-cell"></div>
                    </div>
                    
                    <!-- 2단계에 직속 업무가 있으면 표시 -->
                    <template v-if="hasDirectWorksInCategory(subCategory)">
                      <template v-for="work in getWorksForCategory(subCategory.id)" :key="work.id">
                        <div 
                          class="table-row work-row"
                          @click="editWork(work)"
                        >
                          <div class="table-cell work-category">
                            <span class="work-indent">　</span>
                            <span class="work-indicator">┗</span>
                          </div>
                          <div class="table-cell">{{ work.name }}</div>
                          <div class="table-cell">
                            <span class="status-badge" :class="getStatusClass(work.status)">
                              {{ work.status }}
                            </span>
                          </div>
                          <div class="table-cell">{{ formatDate(work.startDate) }}</div>
                          <div class="table-cell">{{ formatDate(work.endDate) }}</div>
                          <div class="table-cell">
                            <input 
                              type="checkbox" 
                              :checked="work.isMyWork" 
                              class="my-work-checkbox readonly"
                              readonly
                              @click.prevent
                            >
                          </div>
                        </div>
                      </template>
                    </template>
                    
                    <!-- 3단계 카테고리들 (2단계에 직속 업무가 없거나 확장된 경우) -->
                    <template v-if="!hasDirectWorksInCategory(subCategory) || subCategory.expanded">
                      <template v-for="subSubCategory in subCategory.children" :key="subSubCategory.id">
                        <template v-if="hasWorksInCategory(subSubCategory)">
                          <!-- 3단계 카테고리 -->
                          <div class="category-row sub-level-2">
                            <div class="table-cell category-cell">
                              <span class="tree-connector">　　┗　　</span>
                              <span class="category-name">{{ subSubCategory.name }}</span>
                            </div>
                            <div class="table-cell"></div>
                            <div class="table-cell"></div>
                            <div class="table-cell"></div>
                            <div class="table-cell"></div>
                            <div class="table-cell"></div>
                          </div>
                          
                          <!-- 해당 카테고리의 업무들 -->
                          <template v-for="work in getWorksForCategory(subSubCategory.id)" :key="work.id">
                            <div 
                              class="table-row work-row"
                              @click="editWork(work)"
                            >
                              <div class="table-cell work-category">
                                <span class="work-indent">　</span>
                                <span class="work-indicator">┗</span>
                              </div>
                              <div class="table-cell">{{ work.name }}</div>
                              <div class="table-cell">
                                <span class="status-badge" :class="getStatusClass(work.status)">
                                  {{ work.status }}
                                </span>
                              </div>
                              <div class="table-cell">{{ formatDate(work.startDate) }}</div>
                              <div class="table-cell">{{ formatDate(work.endDate) }}</div>
                              <div class="table-cell">
                                <input 
                                  type="checkbox" 
                                  :checked="work.isMyWork" 
                                  class="my-work-checkbox readonly"
                                  readonly
                                  @click.prevent
                                >
                              </div>
                            </div>
                          </template>
                        </template>
                      </template>
                    </template>
                  </template>
                </template>
              </template>
            </template>
          </template>
          
          <!-- 빈 상태 -->
          <div v-if="todayWorks.length === 0" class="empty-state">
            <p>오늘 진행할 업무가 없습니다.</p>
            <button @click="addWork" class="add-first-btn">첫 업무 추가하기</button>
          </div>
        </div>
      </section>

      <!-- 주간 테이블 섹션 -->
      <section class="weekly-section">
        <div class="section-header">
          <h2>주간 업무</h2>
          <div class="week-navigation">
            <button @click="prevWeek" class="nav-btn">‹</button>
            <span class="week-title">{{ currentWeekTitle }}</span>
            <button @click="nextWeek" class="nav-btn">›</button>
          </div>
        </div>
        
        <div class="weekly-table">
          <!-- 요일 헤더 -->
          <div class="weekly-header">
            <div class="category-column">프로젝트</div>
            <div 
              v-for="day in weekDays" 
              :key="day.date"
              class="day-column"
              :class="{ 'today': day.isToday }"
            >
              <div class="day-name">{{ day.dayName }}</div>
              <div class="day-date">{{ day.date }}</div>
            </div>
          </div>
          
          <!-- 프로젝트별 행 -->
          <div 
            v-for="category in topCategories" 
            :key="category.id"
            class="weekly-row"
          >
            <div class="category-cell" :style="{ backgroundColor: category.color }">
              {{ category.name }}
            </div>
            <div 
              v-for="day in weekDays" 
              :key="`${category.id}-${day.date}`"
              class="work-cell"
              :class="{ 'today': day.isToday }"
              @click="addWorkToCell(category.id, day.date)"
            >
              <!-- 업무가 있으면 표시, 없으면 빈 칸 -->
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 업무 추가/수정 모달 -->
    <div v-if="showWorkModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditMode ? '업무 수정' : '새 업무 추가' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <!-- 1단계: 프로젝트 선택 (새 업무 추가일 때만) -->
          <div v-if="!isEditMode" class="project-selection">
            <label class="selection-label">
              <span class="step-indicator">1</span>
              프로젝트 선택 (필수)
            </label>
            
            <!-- 검색 -->
            <div class="search-container">
              <input 
                v-model="projectSearchTerm"
                type="text" 
                placeholder="프로젝트 검색..." 
                class="search-input"
              />
            </div>
            
            <!-- 트리 컨테이너 -->
            <div class="tree-container">
              <template v-if="filteredCategories.length === 0">
                <div class="empty-state">
                  <p>프로젝트가 없습니다.</p>
                </div>
              </template>
              <template v-else>
                <TreeNode 
                  v-for="category in filteredCategories" 
                  :key="category.id"
                  :node="category"
                  :expanded-nodes="expandedProjectNodes"
                  :selected-project="selectedProjectForWork"
                  @toggle-expand="toggleProjectExpand"
                  @select-project="selectProjectForWork"
                />
              </template>
            </div>
            
            <!-- 선택된 프로젝트 표시 -->
            <div v-if="selectedProjectForWork" class="selected-project-display">
              <div class="selected-project-info">
                <div class="selected-project-name">{{ selectedProjectForWork.name }}</div>
                <div class="selected-project-path">{{ getSelectedProjectPath() }}</div>
              </div>
              <button @click="clearProjectSelection" class="clear-selection-btn">×</button>
            </div>
          </div>

          <!-- 수정 모드일 때는 기존 드롭다운 -->
          <div v-if="isEditMode" class="form-group">
            <label>프로젝트</label>
            <select v-model="currentWork.categoryId" class="form-select">
              <option value="">프로젝트를 선택하세요</option>
              <template v-for="category in flattenedCategories" :key="category.id">
                <option :value="category.id">
                  {{ '　'.repeat(category.level) }}{{ category.name }}
                </option>
              </template>
            </select>
          </div>

          <!-- 2단계: 업무 상세 정보 -->
          <div class="work-details-form" :class="{ 'enabled': isEditMode || selectedProjectForWork }">
            <div class="form-group">
              <label>
                <span v-if="!isEditMode" class="step-indicator">2</span>
                업무명
              </label>
              <input 
                v-model="currentWork.name" 
                type="text" 
                placeholder="업무명을 입력하세요"
                class="form-input"
              >
            </div>
            
            <div class="form-group">
              <label>상태</label>
              <select v-model="currentWork.status" class="form-select">
                <option value="예정">예정</option>
                <option value="진행중">진행중</option>
                <option value="완료">완료</option>
                <option value="보류">보류</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>시작일</label>
              <input 
                v-model="currentWork.startDate" 
                type="date" 
                class="form-input"
              >
            </div>
            
            <div class="form-group">
              <label>마감일</label>
              <input 
                v-model="currentWork.endDate" 
                type="date" 
                class="form-input"
              >
            </div>
            
            <div class="form-group">
              <label>내 업무</label>
              <div class="checkbox-group">
                <input 
                  type="checkbox" 
                  v-model="currentWork.isMyWork" 
                  id="my-work-checkbox"
                  class="form-checkbox"
                >
                <label for="my-work-checkbox" class="checkbox-label">
                  내가 담당하는 업무입니다
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button v-if="isEditMode" @click="deleteWork" class="delete-btn">삭제</button>
          <div class="button-group">
            <button @click="closeModal" class="cancel-btn">취소</button>
            <button @click="saveWork" class="save-btn">저장</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import TreeNode from '../components/TreeNode.vue'

const auth = useAuthStore()
const router = useRouter()

// 상태 관리
const showWorkModal = ref(false)
const isEditMode = ref(false)
const currentWork = ref({})
const currentWeek = ref(new Date())

// 새로운 프로젝트 선택 관련 변수들
const projectSearchTerm = ref('')
const expandedProjectNodes = ref(new Set([1, 11]))
const selectedProjectForWork = ref(null)

// 계층형 카테고리 데이터
const hierarchicalCategories = ref([
  {
    id: 1,
    name: '웹사이트 리뉴얼',
    expanded: false,
    level: 0,
    children: [
      {
        id: 11,
        name: 'UI/UX 디자인',
        expanded: false,
        level: 1,
        parentId: 1,
        children: [
          { id: 111, name: '메인 페이지', expanded: false, level: 2, parentId: 11, children: [] },
          { id: 112, name: '상품 페이지', expanded: false, level: 2, parentId: 11, children: [] },
          { id: 113, name: '결제 페이지', expanded: false, level: 2, parentId: 11, children: [] }
        ]
      },
      {
        id: 12,
        name: '프론트엔드 개발',
        expanded: false,
        level: 1,
        parentId: 1,
        children: [
          { id: 121, name: 'React 컴포넌트', expanded: false, level: 2, parentId: 12, children: [] },
          { id: 122, name: 'API 연동', expanded: false, level: 2, parentId: 12, children: [] }
        ]
      },
      {
        id: 13,
        name: '백엔드 개발',
        expanded: false,
        level: 1,
        parentId: 1,
        children: [
          { id: 131, name: 'API 설계', expanded: false, level: 2, parentId: 13, children: [] },
          { id: 132, name: '데이터베이스', expanded: false, level: 2, parentId: 13, children: [] }
        ]
      }
    ]
  },
  {
    id: 2,
    name: '모바일 앱 개발',
    expanded: false,
    level: 0,
    children: [
      {
        id: 21,
        name: 'iOS 앱',
        expanded: false,
        level: 1,
        parentId: 2,
        children: [
          { id: 211, name: 'Swift UI', expanded: false, level: 2, parentId: 21, children: [] },
          { id: 212, name: '앱스토어 배포', expanded: false, level: 2, parentId: 21, children: [] }
        ]
      },
      {
        id: 22,
        name: 'Android 앱',
        expanded: false,
        level: 1,
        parentId: 2,
        children: [
          { id: 221, name: 'Kotlin 개발', expanded: false, level: 2, parentId: 22, children: [] },
          { id: 222, name: '플레이스토어 배포', expanded: false, level: 2, parentId: 22, children: [] }
        ]
      }
    ]
  },
  {
    id: 3,
    name: '마케팅 캠페인',
    expanded: false,
    level: 0,
    children: [
      {
        id: 31,
        name: '디지털 마케팅',
        expanded: false,
        level: 1,
        parentId: 3,
        children: [
          { id: 311, name: 'SNS 광고', expanded: false, level: 2, parentId: 31, children: [] },
          { id: 312, name: '검색 광고', expanded: false, level: 2, parentId: 31, children: [] }
        ]
      },
      {
        id: 32,
        name: '콘텐츠 제작',
        expanded: false,
        level: 1,
        parentId: 3,
        children: [
          { id: 321, name: '블로그 포스팅', expanded: false, level: 2, parentId: 32, children: [] },
          { id: 322, name: '동영상 제작', expanded: false, level: 2, parentId: 32, children: [] }
        ]
      }
    ]
  }
])

// 오늘의 업무 데이터 (실제 위치에 배치)
const todayWorks = ref([
  {
    id: 1,
    name: '메인 페이지 디자인 검토',
    categoryId: 111, // UI/UX 디자인 > 메인 페이지 (최하위)
    status: '진행중',
    startDate: '2025-07-21',
    endDate: '2025-07-23',
    isMyWork: true
  },
  {
    id: 2,
    name: 'UI 컴포넌트 개발',
    categoryId: 121, // 프론트엔드 개발 > React 컴포넌트 (최하위)
    status: '예정',
    startDate: '2025-07-22',
    endDate: '2025-07-25',
    isMyWork: false
  },
  {
    id: 3,
    name: '소셜미디어 콘텐츠 작성',
    categoryId: 311, // 디지털 마케팅 > SNS 광고 (최하위)
    status: '완료',
    startDate: '2025-07-19',
    endDate: '2025-07-21',
    isMyWork: true
  },
  {
    id: 4,
    name: 'API 설계 문서 작성',
    categoryId: 131, // 백엔드 개발 > API 설계 (최하위)
    status: '진행중',
    startDate: '2025-07-20',
    endDate: '2025-07-24',
    isMyWork: true
  },
  {
    id: 5,
    name: '로고 디자인 시안 제작',
    categoryId: 1, // 웹사이트 리뉴얼 (최상위 직속)
    status: '예정',
    startDate: '2025-07-23',
    endDate: '2025-07-26',
    isMyWork: true
  }
])

// 상위 카테고리 데이터 (주간 테이블용)
const topCategories = ref([
  { id: 1, name: '웹사이트 리뉴얼', color: '#FF6B6B' },
  { id: 2, name: '모바일 앱 개발', color: '#4ECDC4' },
  { id: 3, name: '마케팅 캠페인', color: '#45B7D1' },
  { id: 4, name: '데이터 분석', color: '#96CEB4' },
  { id: 5, name: '운영 관리', color: '#FFEAA7' }
])

// 평면화된 카테고리 목록 (모달 드롭다운용)
const flattenedCategories = computed(() => {
  const flatten = (categories, level = 0) => {
    let result = []
    for (const category of categories) {
      result.push({
        id: category.id,
        name: category.name,
        level: level
      })
      if (category.children && category.children.length > 0) {
        result = result.concat(flatten(category.children, level + 1))
      }
    }
    return result
  }
  return flatten(hierarchicalCategories.value)
})

// 검색 필터링된 카테고리
const filteredCategories = computed(() => {
  if (!projectSearchTerm.value) return hierarchicalCategories.value
  
  const searchTerm = projectSearchTerm.value.toLowerCase()
  const matchingIds = new Set()
  
  // 평면화된 카테고리에서 검색
  const flatList = flattenCategories(hierarchicalCategories.value)
  const matches = flatList.filter(cat => 
    cat.fullPath.toLowerCase().includes(searchTerm)
  )
  
  // 매칭된 항목들과 그 부모들의 ID 수집
  matches.forEach(match => {
    let current = match
    while (current) {
      matchingIds.add(current.id)
      current = flatList.find(cat => 
        cat.children && cat.children.some(child => child.id === current.id)
      )
    }
  })

  // 필터링된 트리 구조 생성
  const filterTree = (nodes) => {
    return nodes.filter(node => matchingIds.has(node.id))
      .map(node => ({
        ...node,
        children: node.children ? filterTree(node.children) : []
      }))
  }

  return filterTree(hierarchicalCategories.value)
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
  const weekdays = ['월', '화', '수', '목', '금', '토', '일']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    
    days.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      dayName: weekdays[i],
      fullDate: date.toISOString().split('T')[0],
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

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const getStatusClass = (status) => {
  switch (status) {
    case '완료': return 'status-completed'
    case '진행중': return 'status-progress'
    case '예정': return 'status-scheduled'
    case '보류': return 'status-hold'
    default: return 'status-default'
  }
}

// 카테고리 관련 함수
const toggleCategory = (categoryId) => {
  const toggleCategoryInList = (categories) => {
    for (const category of categories) {
      if (category.id === categoryId) {
        category.expanded = !category.expanded
        return true
      }
      if (category.children && toggleCategoryInList(category.children)) {
        return true
      }
    }
    return false
  }
  toggleCategoryInList(hierarchicalCategories.value)
}

const findCategoryById = (categoryId, categories = hierarchicalCategories.value) => {
  for (const category of categories) {
    if (category.id === categoryId) {
      return category
    }
    if (category.children) {
      const found = findCategoryById(categoryId, category.children)
      if (found) return found
    }
  }
  return null
}

const getWorksForCategory = (categoryId) => {
  return todayWorks.value.filter(work => work.categoryId === categoryId)
}

// 드롭다운 전에 최상위에서 보여줄 업무들 (하위 카테고리 업무 포함)
const getWorksForTopCategory = (categoryId) => {
  const category = findCategoryById(categoryId)
  if (!category) return []
  
  const getAllChildrenIds = (cat) => {
    let ids = [cat.id]
    if (cat.children) {
      for (const child of cat.children) {
        ids = ids.concat(getAllChildrenIds(child))
      }
    }
    return ids
  }
  
  const allIds = getAllChildrenIds(category)
  return todayWorks.value.filter(work => allIds.includes(work.categoryId))
}

const hasWorksInCategory = (category) => {
  const getAllChildrenIds = (cat) => {
    let ids = [cat.id]
    if (cat.children) {
      for (const child of cat.children) {
        ids = ids.concat(getAllChildrenIds(child))
      }
    }
    return ids
  }
  
  const allIds = getAllChildrenIds(category)
  return todayWorks.value.some(work => allIds.includes(work.categoryId))
}

// 해당 카테고리에 직속으로 업무가 있는지 확인 (하위 카테고리 제외)
const hasDirectWorksInCategory = (category) => {
  return todayWorks.value.some(work => work.categoryId === category.id)
}

const getCategoryName = (categoryId) => {
  const category = findCategoryById(categoryId)
  return category ? category.name : ''
}

// 이벤트 핸들러
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

const addWork = () => {
  currentWork.value = {
    name: '',
    categoryId: '',
    status: '예정',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isMyWork: false
  }
  isEditMode.value = false
  showWorkModal.value = true
}

const editWork = (work) => {
  currentWork.value = { ...work }
  isEditMode.value = true
  showWorkModal.value = true
}

const addWorkToCell = (categoryId, date) => {
  console.log(`카테고리 ${categoryId}에 ${date} 날짜로 업무 추가`)
  // 추후 구현
}

const closeModal = () => {
  showWorkModal.value = false
  currentWork.value = {}
  isEditMode.value = false
}

const saveWork = () => {
  if (!currentWork.value.name.trim()) {
    alert('업무명을 입력해주세요.')
    return
  }
  
  if (!currentWork.value.categoryId) {
    alert('프로젝트를 선택해주세요.')
    return
  }
  
  if (isEditMode.value) {
    // 수정 모드
    const workIndex = todayWorks.value.findIndex(w => w.id === currentWork.value.id)
    if (workIndex > -1) {
      todayWorks.value[workIndex] = {
        ...currentWork.value
      }
    }
  } else {
    // 새 업무 추가
    const newWork = {
      id: Date.now(),
      name: currentWork.value.name,
      categoryId: currentWork.value.categoryId,
      status: currentWork.value.status,
      startDate: currentWork.value.startDate,
      endDate: currentWork.value.endDate,
      isMyWork: currentWork.value.isMyWork
    }
    todayWorks.value.push(newWork)
  }
  
  closeModal()
}

const deleteWork = () => {
  if (!isEditMode.value) return
  
  const workIndex = todayWorks.value.findIndex(w => w.id === currentWork.value.id)
  if (workIndex > -1) {
    todayWorks.value.splice(workIndex, 1)
  }
  
  closeModal()
}

// 새로운 프로젝트 선택 관련 함수들
const toggleProjectExpand = (nodeId) => {
  if (expandedProjectNodes.value.has(nodeId)) {
    expandedProjectNodes.value.delete(nodeId)
  } else {
    expandedProjectNodes.value.add(nodeId)
  }
}

const selectProjectForWork = (project) => {
  selectedProjectForWork.value = project
}

const clearProjectSelection = () => {
  selectedProjectForWork.value = null
  projectSearchTerm.value = ''
}

const getSelectedProjectPath = () => {
  if (!selectedProjectForWork.value) return ''
  const flatList = flattenCategories(hierarchicalCategories.value)
  return flatList.find(cat => cat.id === selectedProjectForWork.value.id)?.fullPath || ''
}

// 유틸리티 함수
const flattenCategories = (categories, path = []) => {
  let result = []
  for (const category of categories) {
    const fullPath = [...path, category.name]
    result.push({
      ...category,
      fullPath: fullPath.join(' > ')
    })
    if (category.children && category.children.length > 0) {
      result = result.concat(flattenCategories(category.children, fullPath))
    }
  }
  return result
}

const logout = () => {
  auth.logout()
  router.push('/')
}

onMounted(async () => {
  console.log('대시보드 로드됨')
  
  try {
    console.log('📡 API 호출 중...')
    const response = await fetch('http://127.0.0.1:8000/api/v1/work/today')
    console.log('📨 응답 받음:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API 응답 데이터:', data)
      
      // 데이터 매핑 및 화면 업데이트
      const mappedWorks = data.map(work => ({
        id: work.id,
        name: work.title,
        categoryId: work.category_id,
        status: work.current_status,
        startDate: work.started_at ? work.started_at.split('T')[0] : '',
        endDate: work.deadline ? work.deadline.split('T')[0] : '',
        isMyWork: work.myjob
      }))
      
      console.log('🔄 매핑된 데이터:', mappedWorks)
      todayWorks.value = mappedWorks  // 화면 업데이트
      
      // 카테고리 데이터도 가져오기 (category_id: 12)
      console.log('📡 카테고리 데이터 요청...')
      const categoryResponse = await fetch('http://127.0.0.1:8000/api/v1/category/categories/12')
      
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json()
        console.log('✅ 카테고리 데이터:', categoryData)
        
        // 카테고리 데이터 매핑
        const mappedCategories = categoryData.map(cat => ({
          id: cat.id,
          name: cat.name,
          level: cat.level,
          parentId: cat.parent_id,
          expanded: false,
          children: []
        }))
        
        // 계층 구조 구성
        const rootCategories = []
        const categoryMap = new Map()
        
        mappedCategories.forEach(cat => {
          categoryMap.set(cat.id, { ...cat, children: [] })
        })
        
        mappedCategories.forEach(cat => {
          if (cat.parentId === null) {
            rootCategories.push(categoryMap.get(cat.id))
          } else {
            const parent = categoryMap.get(cat.parentId)
            if (parent) {
              parent.children.push(categoryMap.get(cat.id))
            }
          }
        })
        
        console.log('🌳 계층형 카테고리:', rootCategories)
        hierarchicalCategories.value = rootCategories
        
      } else {
        console.error('❌ 카테고리 에러:', categoryResponse.statusText)
      }
      
    } else {
      console.error('❌ API 응답 실패:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('💥 API 호출 에러:', error)
  }
})
</script>

<style scoped>
/* 새로운 프로젝트 선택 스타일 */
.project-selection {
  margin-bottom: 2rem;
}

.selection-label {
  display: block;
  margin-bottom: 1rem;
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
}

.step-indicator {
  background: #667eea;
  color: white;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  margin-right: 0.5rem;
}

.search-container {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.tree-container {
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  background: #fafbfc;
}

.selected-project-display {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f4ff;
  border: 1px solid #667eea;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-project-info {
  flex: 1;
}

.selected-project-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.selected-project-path {
  font-size: 0.85rem;
  color: #667eea;
}

.clear-selection-btn {
  background: none;
  border: none;
  color: #ff6b6b;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.clear-selection-btn:hover {
  background: rgba(255, 107, 107, 0.1);
}

.work-details-form {
  opacity: 0.5;
  pointer-events: none;
  transition: all 0.3s;
}

.work-details-form.enabled {
  opacity: 1;
  pointer-events: all;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #a0aec0;
}

/* 기존 스타일들 */
.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 헤더 */
.dashboard-header {
  background: white;
  border-bottom: 1px solid #e1e5e9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-content {
  max-width: 1400px;
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

/* 메인 컨텐츠 */
.dashboard-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 섹션 공통 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
  font-weight: 600;
}

.add-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

/* 오늘의 업무 섹션 */
.today-work-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.work-table {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 0.8fr;
  background: #667eea;
  color: white;
}

.header-cell {
  padding: 1rem;
  font-weight: 600;
  text-align: center;
  border-right: 1px solid rgba(255,255,255,0.2);
}

.header-cell:last-child {
  border-right: none;
}

/* 카테고리 행 스타일 */
.category-row {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 0.8fr;
  border-bottom: 1px solid #e1e5e9;
  cursor: pointer;
  transition: background 0.2s;
}

.category-row:hover {
  background: #f8f9ff;
}

.category-row.top-level {
  background: #f8f9fa;
  font-weight: 600;
  color: #2d3748 !important;
  text-shadow: none !important;
  opacity: 1 !important;
}

.category-row.sub-level-1 {
  background: #fbfbfb;
  font-weight: 500;
  color: #4a5568 !important;
  text-shadow: none !important;
  opacity: 1 !important;
}

.category-row.sub-level-2 {
  background: #fefefe;
  font-weight: 400;
  color: #718096 !important;
  text-shadow: none !important;
  opacity: 1 !important;
}

.category-cell {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-right: 1px solid #e1e5e9;
  color: inherit !important;
  text-shadow: none !important;
  opacity: 1 !important;
}

.dropdown-icon {
  margin-right: 0.5rem;
  font-size: 0.8rem;
  transition: transform 0.2s;
  color: #2d3748 !important;
  width: 12px;
  display: inline-block;
  font-weight: bold;
  text-shadow: none !important;
  opacity: 1 !important;
}

.dropdown-icon.expanded {
  transform: rotate(90deg);
}

.tree-connector {
  color: #1a202c !important;
  font-weight: 900 !important;
  text-shadow: 0.5px 0.5px 0px #1a202c !important;
  opacity: 1 !important;
  font-family: monospace;
  font-size: 1.1em !important;
}

.work-indicator {
  color: #1a202c !important;
  font-weight: 900 !important;
  text-shadow: 0.5px 0.5px 0px #1a202c !important;
  opacity: 1 !important;
  font-family: monospace;
  font-size: 1.1em !important;
}

.category-name {
  flex: 1;
  text-align: left;
  color: inherit !important;
  text-shadow: none !important;
  opacity: 1 !important;
}

/* 들여쓰기 */
.indent-1 {
  width: 20px;
  display: inline-block;
}

.indent-2 {
  width: 40px;
  display: inline-block;
}

.indent-3 {
  width: 60px;
  display: inline-block;
}

/* 업무 행 스타일 */
.table-row {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 0.8fr;
  border-bottom: 1px solid #e1e5e9;
  cursor: pointer;
  transition: background 0.2s;
  background: white;
}

.table-row:hover {
  background: #f0f4ff;
}

.table-row:last-child {
  border-bottom: none;
}

.work-category {
  justify-content: flex-start;
  text-align: left;
}

.table-cell {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-right: 1px solid #e1e5e9;
  color: #2d3748 !important;
  text-shadow: none !important;
  opacity: 1 !important;
}

.table-cell:last-child {
  border-right: none;
}

/* 상태 배지 */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
}

.status-completed { background: #48bb78; }
.status-progress { background: #4299e1; }
.status-scheduled { background: #ed8936; }
.status-hold { background: #a0aec0; }

/* 빈 상태 */
.empty-state {
  padding: 3rem;
  text-align: center;
  color: #666;
}

.empty-state p {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.add-first-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.add-first-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

/* 주간 섹션 */
.weekly-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.week-navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.week-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.weekly-table {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
}

.weekly-header {
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  background: #f8f9fa;
  border-bottom: 2px solid #e1e5e9;
}

.category-column {
  padding: 1rem;
  font-weight: 600;
  color: #333;
  background: #f1f3f4;
  border-right: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-column {
  padding: 1rem 0.5rem;
  text-align: center;
  border-right: 1px solid #e1e5e9;
  transition: background 0.2s;
}

.day-column:last-child {
  border-right: none;
}

.day-column.today {
  background: #667eea;
  color: white;
}

.day-name {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.day-date {
  font-size: 0.8rem;
  opacity: 0.8;
}

.day-column.today .day-name,
.day-column.today .day-date {
  color: white;
}

.weekly-row {
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  border-bottom: 1px solid #e1e5e9;
}

.weekly-row:last-child {
  border-bottom: none;
}

.category-cell {
  padding: 1rem;
  color: white;
  font-weight: 600;
  text-align: center;
  border-right: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.work-cell {
  padding: 1rem;
  border-right: 1px solid #e1e5e9;
  min-height: 80px;
  cursor: pointer;
  transition: background 0.2s;
  background: white;
}

.work-cell:last-child {
  border-right: none;
}

.work-cell:hover {
  background: #f8f9ff;
}

.work-cell.today {
  background: #f0f4ff;
}

/* 체크박스 스타일 */
.my-work-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
}

.my-work-checkbox.readonly {
  cursor: default;
  pointer-events: none;
}

.my-work-checkbox:disabled {
  opacity: 1 !important;
  filter: none !important;
  -webkit-filter: none !important;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-label {
  color: #333;
  font-size: 0.9rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-label:hover {
  color: #667eea;
}

/* 모달 */
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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem 2rem 1rem;
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
}

.modal-body {
  padding: 1.5rem 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
}

.modal-footer {
  padding: 1rem 2rem 1.5rem;
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
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e1e5e9;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.delete-btn {
  background: #ff6b6b;
  color: white;
}

.delete-btn:hover {
  background: #ff5252;
}

/* 반응형 */
@media (max-width: 768px) {
  .dashboard-main {
    padding: 1rem;
  }
  
  .table-header,
  .table-row,
  .category-row {
    grid-template-columns: 1fr;
  }
  
  .table-cell {
    border-right: none;
    border-bottom: 1px solid #e1e5e9;
    justify-content: flex-start;
    text-align: left;
  }
  
  .weekly-header,
  .weekly-row {
    grid-template-columns: 1fr;
  }
  
  .day-column,
  .work-cell {
    border-right: none;
    border-bottom: 1px solid #e1e5e9;
  }
}
</style>