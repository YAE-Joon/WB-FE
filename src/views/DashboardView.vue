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
                <!-- 1단계 카테고리에 직속으로 연결된 업무들 먼저 표시 -->
                <template v-if="hasDirectWorksInCategory(category)">
                  <template v-for="work in getWorksForCategory(category.id)" :key="work.id">
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
                
                <!-- 그 다음 하위 카테고리들과 그들의 업무들 표시 -->
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
        <!-- 모달 헤더 -->
        <div class="modal-header">
          <div class="modal-header-content">
            <h3 class="modal-title">
              <div class="title-icon">📋</div>
              <span v-if="isDetailMode">업무 상세</span>
              <span v-else>{{ isEditMode ? '업무 수정' : '새 업무 추가' }}</span>
            </h3>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
        </div>
        
        <!-- 모달 바디 -->
        <div class="modal-body">
          <div v-if="isDetailMode" class="work-detail">
            <!-- 프로젝트 계층 -->
            <div class="detail-item">
              <div class="detail-label">프로젝트</div>
              <div class="project-hierarchy">
                <div class="project-breadcrumb">
                  <span class="project-item project-root">
                    <span class="project-icon">🏗️</span>
                    {{ getProjectHierarchy().root }}
                  </span>
                  <span v-if="getProjectHierarchy().sub" class="breadcrumb-separator">›</span>
                  <span v-if="getProjectHierarchy().sub" class="project-item project-sub">
                    <span class="project-icon">🎨</span>
                    {{ getProjectHierarchy().sub }}
                  </span>
                  <span v-if="getProjectHierarchy().leaf" class="breadcrumb-separator">›</span>
                  <span v-if="getProjectHierarchy().leaf" class="project-item project-leaf">
                    <span class="project-icon">📱</span>
                    {{ getProjectHierarchy().leaf }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- 업무명 -->
            <div class="detail-item">
              <div class="detail-label">업무명</div>
              <div class="work-title">{{ currentWork.name }}</div>
            </div>
            
            <!-- 상태 -->
            <div class="detail-item">
              <div class="detail-label">상태</div>
              <div class="detail-value">
                <span class="status-badge" :class="getStatusClass(currentWork.status)">
                  <span class="status-icon"></span>
                  {{ currentWork.status }}
                </span>
              </div>
            </div>
            
            <!-- 업무 내용 -->
            <div class="detail-item">
              <div class="detail-label">업무 내용</div>
              <div class="content-box">
                <div class="content-text">{{ currentWork.content || '내용이 없습니다.' }}</div>
              </div>
            </div>
            
            <!-- 날짜 정보 -->
            <div class="detail-item">
              <div class="detail-label">일정</div>
              <div class="date-container">
                <div class="date-item">
                  <div class="detail-label">시작일</div>
                  <div class="date-value">{{ formatDateKorean(currentWork.startDate) }}</div>
                </div>
                <div class="date-item">
                  <div class="detail-label">마감일</div>
                  <div class="date-value">{{ formatDateKorean(currentWork.endDate) }}</div>
                </div>
              </div>
            </div>
            
            <!-- 담당자 -->
            <div class="detail-item">
              <div class="detail-label">담당</div>
              <div class="detail-value">
                <span class="my-work-indicator" :class="currentWork.isMyWork ? 'my-work-yes' : 'my-work-no'">
                  <span class="indicator-dot"></span>
                  {{ currentWork.isMyWork ? '내 업무' : '다른 사람 업무' }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 편집/추가 폼은 기존 코드 유지 -->
          <div v-else>
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
                <label>업무 내용</label>
                <textarea 
                  v-model="currentWork.content" 
                  placeholder="업무 내용을 입력하세요"
                  class="form-textarea"
                  rows="4"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label>상태</label>
                <select v-model="currentWork.status" class="form-select">
                  <option value="예정">예정</option>
                  <option value="진행중">진행중</option>
                  <option value="검토중">검토중</option>
                  <option value="반려">반려</option>
                  <option value="완료">완료</option>
                  <option value="취소">취소</option>
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
        </div>
        
        <!-- 모달 푸터 -->
        <div class="modal-footer">
          <div></div>
          <div class="button-group">
            <button @click="closeModal" class="btn btn-secondary">닫기</button>
            <button v-if="isDetailMode" @click="editCurrentWork" class="btn btn-primary">편집</button>
            <button v-else @click="saveWork" class="btn btn-primary">저장</button>
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
const isDetailMode = ref(false)
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
    case '예정': return 'status-todo'
    case '진행중': return 'status-progress'
    case '검토중': return 'status-review'
    case '반려': return 'status-rejected'
    case '완료': return 'status-completed'
    case '취소': return 'status-cancelled'
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
    content: '',
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
  isEditMode.value = false
  isDetailMode.value = true
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
  isDetailMode.value = false
  selectedProjectForWork.value = null
  projectSearchTerm.value = ''
}

const saveWork = async () => {
  if (!currentWork.value.name.trim()) {
    alert('업무명을 입력해주세요.')
    return
  }
  
  const categoryId = isEditMode.value ? currentWork.value.categoryId : selectedProjectForWork.value?.id
  if (!categoryId) {
    alert('프로젝트를 선택해주세요.')
    return
  }
  
  try {
    if (isEditMode.value) {
      // 수정 모드 - PUT 요청
      const updateData = {
        title: currentWork.value.name,
        content: currentWork.value.content || null,
        user_id: 1, // 임시 사용자 ID
        category_id: categoryId,
        current_status: currentWork.value.status,
        started_at: currentWork.value.startDate ? new Date(currentWork.value.startDate + 'T00:00:00').toISOString() : null,
        deadline: currentWork.value.endDate ? new Date(currentWork.value.endDate + 'T23:59:59').toISOString() : null,
        myjob: currentWork.value.isMyWork
      }
      
      const response = await fetch(`http://127.0.0.1:8000/api/v1/work/${currentWork.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (response.ok) {
        // 로컬 데이터 업데이트
        const workIndex = todayWorks.value.findIndex(w => w.id === currentWork.value.id)
        if (workIndex > -1) {
          todayWorks.value[workIndex] = {
            ...currentWork.value,
            categoryId: categoryId
          }
        }
        console.log('✅ 업무 수정 성공')
      } else {
        console.error('❌ 업무 수정 실패:', response.statusText)
        alert('업무 수정에 실패했습니다.')
        return
      }
    } else {
      // 새 업무 추가 - POST 요청
      const newWorkData = {
        title: currentWork.value.name,
        content: currentWork.value.content || null,
        user_id: 1, // 임시 사용자 ID
        category_id: categoryId,
        current_status: currentWork.value.status,
        started_at: currentWork.value.startDate ? new Date(currentWork.value.startDate + 'T00:00:00').toISOString() : null,
        deadline: currentWork.value.endDate ? new Date(currentWork.value.endDate + 'T23:59:59').toISOString() : null,
        myjob: currentWork.value.isMyWork
      }
      
      console.log('📡 새 업무 데이터:', newWorkData)
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newWorkData)
      })
      
      if (response.ok) {
        const createdWork = await response.json()
        console.log('✅ 새 업무 생성 성공:', createdWork)
        
        // 로컬 데이터에 추가 (화면에서 바로 보이도록)
        const newWork = {
          id: createdWork.id,
          name: currentWork.value.name,
          content: currentWork.value.content,
          categoryId: categoryId,
          status: currentWork.value.status,
          startDate: currentWork.value.startDate,
          endDate: currentWork.value.endDate,
          isMyWork: currentWork.value.isMyWork
        }
        todayWorks.value.push(newWork)
      } else {
        console.error('❌ 업무 생성 실패:', response.statusText)
        alert('업무 생성에 실패했습니다.')
        return
      }
    }
  } catch (error) {
    console.error('💥 API 호출 에러:', error)
    alert('네트워크 오류가 발생했습니다.')
    return
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

// 젼직 버튼 클릭 시 편집 모드로 전환
const editCurrentWork = () => {
  isDetailMode.value = false
  isEditMode.value = true
}

// 한국어 날짜 포맷팅
const formatDateKorean = (dateString) => {
  if (!dateString) return '미정'
  const date = new Date(dateString)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

// 프로젝트 계층 구조 파싱
const getProjectHierarchy = () => {
  if (!currentWork.value.categoryId) return { root: '', sub: '', leaf: '' }
  
  const findHierarchy = (categories, targetId, path = []) => {
    for (const category of categories) {
      const newPath = [...path, category.name]
      if (category.id === targetId) {
        return {
          root: newPath[0] || '',
          sub: newPath[1] || '',
          leaf: newPath[2] || ''
        }
      }
      if (category.children) {
        const found = findHierarchy(category.children, targetId, newPath)
        if (found) return found
      }
    }
    return { root: '', sub: '', leaf: '' }
  }
  
  return findHierarchy(hierarchicalCategories.value, currentWork.value.categoryId)
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
        content: work.content,
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

.status-todo { background: #ed8936; }        /* 예정 - 주황색 */
.status-progress { background: #4299e1; }    /* 진행중 - 파란색 */
.status-review { background: #9f7aea; }      /* 검토중 - 보라색 */
.status-rejected { background: #f56565; }    /* 반려 - 빨간색 */
.status-completed { background: #48bb78; }   /* 완료 - 녹색 */
.status-cancelled { background: #a0aec0; }   /* 취소 - 회색 */
.status-default { background: #cbd5e0; }     /* 기본 - 연회색 */

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

/* 프로젝트 선택 스타일 */
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

/* 폼 스타일 */
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
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.5;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

/* 상세보기 전용 스타일 */
/* 모달 오버레이 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 모달 컨테이너 */
.modal-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 모달 헤더 */
.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px;
  position: relative;
  overflow: hidden;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3e%3cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.1'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23grid)' /%3e%3c/svg%3e");
  pointer-events: none;
}

.modal-header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* 모달 바디 */
.modal-body {
  padding: 32px;
  max-height: 60vh;
  overflow-y: auto;
}

/* 상세보기 스타일 */
.work-detail {
  display: grid;
  gap: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
  color: #1f2937;
  line-height: 1.6;
}

.work-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  gap: 6px;
}

.status-progress { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.status-todo { background: linear-gradient(135deg, #f59e0b, #d97706); }
.status-completed { background: linear-gradient(135deg, #10b981, #059669); }
.status-review { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.status-rejected { background: linear-gradient(135deg, #ef4444, #dc2626); }
.status-cancelled { background: linear-gradient(135deg, #6b7280, #4b5563); }
.status-default { background: linear-gradient(135deg, #9ca3af, #6b7280); }

.status-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.content-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #667eea;
  position: relative;
  overflow: hidden;
}

.content-box::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea20, transparent);
  border-radius: 0 12px 0 60px;
}

.content-text {
  white-space: pre-wrap;
  line-height: 1.7;
  color: #374151;
  position: relative;
  z-index: 1;
}

.date-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.date-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
}

.date-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.date-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-top: 4px;
}

.my-work-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 500;
}

.my-work-yes {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.my-work-no {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

/* 프로젝트 계층 스타일 */
.project-hierarchy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.project-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  position: relative;
}

.project-root {
  background: linear-gradient(135deg, #fef3c7, #fed7aa);
  color: #92400e;
  border: 1px solid #fbbf24;
}

.project-sub {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
  border: 1px solid #60a5fa;
}

.project-leaf {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  color: #166534;
  border: 1px solid #4ade80;
}

.project-icon {
  font-size: 14px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
}

.breadcrumb-separator {
  color: #9ca3af;
  font-weight: 600;
  font-size: 1.1rem;
}

/* 모달 푸터 */
.modal-footer {
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.button-group {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

/* 스크롤바 스타일링 */
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
}

/* 반응형 */
@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    margin: 10px;
  }

  .modal-header {
    padding: 20px 24px;
  }

  .modal-body {
    padding: 24px;
  }

  .modal-footer {
    padding: 20px 24px;
    flex-direction: column;
    gap: 16px;
  }

  .button-group {
    width: 100%;
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .date-container {
    grid-template-columns: 1fr;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .project-breadcrumb {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .breadcrumb-separator {
    display: none;
  }

  .project-item {
    width: 100%;
    justify-content: flex-start;
  }
}

/* 기존 반응형 스타일 */
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