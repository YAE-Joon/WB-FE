<template>
  <div class="dashboard">
    <!-- 헤더 영역 -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>손수레</h1>
        <div class="user-info">
          <span>안녕하세요! {{ auth.user?.id || 'User' }}님</span>
          <button @click="logout" class="logout-btn">로그아웃</button>
        </div>
      </div>
      <!-- 네비게이션 메뉴 -->
      <nav class="nav-menu">
        <button 
          class="nav-item"
          :class="{ active: activeTab === 'today' }"
          @click="setActiveTab('today')"
        >
          오늘의 업무
        </button>
        <button 
          class="nav-item"
          :class="{ active: activeTab === 'project' }"
          @click="setActiveTab('project')"
        >
          프로젝트
        </button>
        <button 
          class="nav-item"
          :class="{ active: activeTab === 'third' }"
          @click="setActiveTab('third')"
        >
          나의 업무일지
        </button>
      </nav>
    </header>

    <!-- 메인 컨텐츠 영역 -->
    <main class="dashboard-main">
      <!-- 오늘의 업무 섹션 -->
      <div v-show="activeTab === 'today'">
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
          <template v-for="category in todayCategoryHierarchy" :key="category.id">
            <!-- 최상위 카테고리 (업무가 있는 경우만 표시) -->
            <template v-if="hasWorksInCategory(category)">
              <div class="category-row top-level" @click="toggleCategory(category.id)">
                <div class="table-cell category-cell">
                  <div class="category-indicator-wrapper">
                    <div class="hierarchy-indicator level-0"></div>
                  </div>
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
                    :class="getDeadlineStatus(work)"
                  >
                    <div class="table-cell work-category">
                      <span class="work-indent">　</span>
                      <span class="work-indicator">┗</span>
                    </div>
                    <div class="table-cell work-name-cell" @click="editWork(work)">
                      {{ work.name }}
                    </div>
                    <div class="table-cell status-cell">
                      <div class="status-dropdown-wrapper">
                        <button 
                          class="status-badge" 
                          :class="[getStatusClass(work.status), { 'loading': work.statusLoading }]"
                          @click.stop="toggleStatusDropdown(work.id)"
                        >
                          {{ work.statusLoading ? '변경중...' : work.status }}
                        </button>
                        <div 
                          class="status-dropdown" 
                          :class="{ 'show': openDropdownId === work.id }"
                        >
                          <div 
                            v-for="status in statusOptions" 
                            :key="status.value"
                            class="dropdown-item"
                            :class="{ 'selected': work.status === status.value }"
                            @click="changeWorkStatus(work, status.value, status.class)"
                          >
                            <div class="status-dot" :class="status.class"></div>
                            {{ status.value }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="table-cell">{{ formatDate(work.startDate) }}</div>
                    <div class="table-cell">{{ formatDate(work.endDate) }}</div>
                    <div class="table-cell my-work-cell">
                      <input 
                        type="checkbox" 
                        :checked="work.isMyWork" 
                        class="my-work-checkbox readonly"
                        readonly
                        @click.prevent
                      >
                      <button 
                        v-if="work.isMyWork"
                        @click="deleteWork(work)"
                        class="delete-btn"
                        title="업무 삭제"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </template>
              </template>
              
              <!-- 하위 카테고리들 (확장된 경우) -->
              <template v-if="category.expanded">
                <!-- 1단계 카테고리에 직속으로 연결된 업무들 먼저 표시 -->
                <template v-if="hasDirectWorksInCategory(category)">
                  <draggable
                    v-model="getCategoryWorks(category.id).value"
                    group="works"
                    @change="updateWorkOrder"
                    item-key="id"
                    tag="div"
                    :filter="'.no-drag'"
                  >
                    <template #item="{ element: work }">
                      <div 
                        class="table-row work-row draggable-item"
                        :class="getDeadlineStatus(work)"
                      >
                      <div class="table-cell work-category">
                        <span class="work-indent">　</span>
                        <span class="work-indicator">┗</span>
                      </div>
                      <div class="table-cell work-name-cell no-drag" @click="editWork(work)">
                        {{ work.name }}
                      </div>
                      <div class="table-cell status-cell no-drag">
                      <div class="status-dropdown-wrapper">
                      <button 
                          class="status-badge" 
                            :class="[getStatusClass(work.status), { 'loading': work.statusLoading }]"
                                  @click.stop="toggleStatusDropdown(work.id)"
                                >
                                  {{ work.statusLoading ? '변경중...' : work.status }}
                                </button>
                                <div 
                                  class="status-dropdown" 
                                  :class="{ 'show': openDropdownId === work.id }"
                                >
                                  <div 
                                    v-for="status in statusOptions" 
                                    :key="status.value"
                                    class="dropdown-item"
                                    :class="{ 'selected': work.status === status.value }"
                                    @click="changeWorkStatus(work, status.value, status.class)"
                                  >
                                    <div class="status-dot" :class="status.class"></div>
                                    {{ status.value }}
                                  </div>
                                </div>
                              </div>
                            </div>
                      <div class="table-cell">{{ formatDate(work.startDate) }}</div>
                      <div class="table-cell">{{ formatDate(work.endDate) }}</div>
                      <div class="table-cell my-work-cell">
                        <input 
                          type="checkbox" 
                          :checked="work.isMyWork" 
                          class="my-work-checkbox readonly"
                          readonly
                          @click.prevent
                        >
                        <button 
                          v-if="work.isMyWork"
                          @click="deleteWork(work)"
                          class="delete-btn"
                          title="업무 삭제"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    </template>
                  </draggable>
                </template>
                
                <!-- 그 다음 하위 카테고리들과 그들의 업무들 표시 -->
                <template v-for="subCategory in category.children" :key="subCategory.id">
                  <template v-if="hasWorksInCategory(subCategory)">
                    <!-- 2단계 카테고리 -->
                    <div class="category-row sub-level-1">
                      <div class="table-cell category-cell">
                        <div class="category-indicator-wrapper">
                          <div class="hierarchy-indicator level-1"></div>
                        </div>
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
                      <draggable
                        v-model="getCategoryWorks(subCategory.id).value"
                        group="works"
                        @change="updateWorkOrder"
                        item-key="id"
                        tag="div"
                        :filter="'.no-drag'"
                      >
                        <template #item="{ element: work }">
                          <div 
                          class="table-row work-row draggable-item"
                          :class="getDeadlineStatus(work)"
                          >
                            <div class="table-cell work-category">
                            <span class="work-indent">　</span>
                          <span class="work-indicator">┗</span>
                          </div>
                          <div class="table-cell work-name-cell no-drag" @click="editWork(work)">
                            {{ work.name }}
                              </div>
                            <div class="table-cell status-cell no-drag">
                              <div class="status-dropdown-wrapper">
                                <button 
                                  class="status-badge" 
                                  :class="[getStatusClass(work.status), { 'loading': work.statusLoading }]"
                                  @click.stop="toggleStatusDropdown(work.id)"
                                >
                                  {{ work.statusLoading ? '변경중...' : work.status }}
                                </button>
                                <div 
                                  class="status-dropdown" 
                                  :class="{ 'show': openDropdownId === work.id }"
                                >
                                  <div 
                                    v-for="status in statusOptions" 
                                    :key="status.value"
                                    class="dropdown-item"
                                    :class="{ 'selected': work.status === status.value }"
                                    @click="changeWorkStatus(work, status.value, status.class)"
                                  >
                                    <div class="status-dot" :class="status.class"></div>
                                    {{ status.value }}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class="table-cell">{{ formatDate(work.startDate) }}</div>
                            <div class="table-cell">{{ formatDate(work.endDate) }}</div>
                            <div class="table-cell my-work-cell">
                              <input 
                                type="checkbox" 
                                :checked="work.isMyWork" 
                                class="my-work-checkbox readonly"
                                readonly
                                @click.prevent
                              >
                              <button 
                                v-if="work.isMyWork"
                                @click="deleteWork(work)"
                                class="delete-btn"
                                title="업무 삭제"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </template>
                      </draggable>
                    </template>
                    
                    <!-- 3단계 카테고리들 (2단계에 직속 업무가 없거나 확장된 경우) -->
                    <template v-if="!hasDirectWorksInCategory(subCategory) || subCategory.expanded">
                      <template v-for="subSubCategory in subCategory.children" :key="subSubCategory.id">
                        <template v-if="hasWorksInCategory(subSubCategory)">
                          <!-- 3단계 카테고리 -->
                          <div class="category-row sub-level-2">
                            <div class="table-cell category-cell">
                              <div class="category-indicator-wrapper">
                                <div class="hierarchy-indicator level-2"></div>
                              </div>
                              <span class="category-name">{{ subSubCategory.name }}</span>
                            </div>
                            <div class="table-cell"></div>
                            <div class="table-cell"></div>
                            <div class="table-cell"></div>
                            <div class="table-cell"></div>
                            <div class="table-cell"></div>
                          </div>
                          
                          <!-- 해당 카테고리의 업무들 -->
                          <draggable
                            v-model="getCategoryWorks(subSubCategory.id).value"
                            group="works"
                            @change="updateWorkOrder"
                            item-key="id"
                            tag="div"
                            :filter="'.no-drag'"
                          >
                            <template #item="{ element: work }">
                              <div 
                                class="table-row work-row draggable-item"
                                :class="getDeadlineStatus(work)"
                              >
                                <div class="table-cell work-category">
                                  <span class="work-indent">　</span>
                                  <span class="work-indicator">┗</span>
                                </div>
                                <div class="table-cell work-name-cell no-drag" @click="editWork(work)">
                                  {{ work.name }}
                                </div>
                                <div class="table-cell status-cell no-drag">
                                  <div class="status-dropdown-wrapper">
                                    <button 
                                      class="status-badge" 
                                      :class="[getStatusClass(work.status), { 'loading': work.statusLoading }]"
                                      @click.stop="toggleStatusDropdown(work.id)"
                                    >
                                      {{ work.statusLoading ? '변경중...' : work.status }}
                                    </button>
                                    <div 
                                      class="status-dropdown" 
                                      :class="{ 'show': openDropdownId === work.id }"
                                    >
                                      <div 
                                        v-for="status in statusOptions" 
                                        :key="status.value"
                                        class="dropdown-item"
                                        :class="{ 'selected': work.status === status.value }"
                                        @click="changeWorkStatus(work, status.value, status.class)"
                                      >
                                        <div class="status-dot" :class="status.class"></div>
                                        {{ status.value }}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div class="table-cell">{{ formatDate(work.startDate) }}</div>
                                <div class="table-cell">{{ formatDate(work.endDate) }}</div>
                                <div class="table-cell my-work-cell">
                                  <input 
                                    type="checkbox" 
                                    :checked="work.isMyWork" 
                                    class="my-work-checkbox readonly"
                                    readonly
                                    @click.prevent
                                  >
                                  <button 
                                    v-if="work.isMyWork"
                                    @click="deleteWork(work)"
                                    class="delete-btn"
                                    title="업무 삭제"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </template>
                          </draggable>
                        </template>
                      </template>
                    </template>
                  </template>
                </template>
              </template>
            </template>
          </template>
          
          <!-- 빈 상태 -->
          <div v-if="activeTodayWorks.length === 0" class="empty-state">
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
              <!-- 완료된 업무들 표시 -->
              <div 
                v-for="work in getCompletedWorksForCell(category.id, day.fullDate)"
                :key="work.id"
                class="completed-work-tag"
                :title="`${work.title}${work.content ? ' - ' + work.content : ''}`"
                :style="{ backgroundColor: getWorkTagColor(work) }"
                @click.stop="viewCompletedWorkDetail(work)"
              >
                <span class="work-tag-text">{{ truncateText(work.title, 15) }}</span>
                <span class="work-tag-time">완료</span>
                <button 
                  v-if="work.myjob"
                  @click.stop="deleteWork(work)"
                  class="tag-delete-btn"
                  title="업무 삭제"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      <!-- 프로젝트 섹션 -->
      <div v-show="activeTab === 'project'">
        <section class="project-section">
          <div class="section-header">
            <h2>연간 계획</h2>
            <div class="header-controls">
              <button @click="addProject" class="add-btn">+ 프로젝트 추가</button>
              <div class="year-selector">
                <button @click="changeYear(-1)" class="year-btn">◀</button>
                <span class="current-year">{{ currentYear }}</span>
                <button @click="changeYear(1)" class="year-btn">▶</button>
              </div>
            </div>
          </div>
          
          <!-- 연간 달력 및 프로젝트 타임라인 -->
          <div class="project-timeline">
            <!-- 월별 헤더 -->
            <div class="timeline-header">
              <div class="project-name-col">프로젝트</div>
              <div class="project-description-col">설명</div>
              <div class="months-grid">
                <div 
                  v-for="month in months" 
                  :key="month" 
                  class="month-header"
                >
                  {{ month }}월
                </div>
              </div>
            </div>
            
            <!-- 프로젝트 목록 및 타임라인 -->
            <div class="timeline-body">
              <template v-for="project in topLevelProjects" :key="project.id">
                <div class="project-row" @click="viewProjectDetail(project)">
                  <div class="project-name-cell">
                    <div class="hierarchy-indicator level-0"></div>
                    <div class="project-name">{{ project.name }}</div>
                    <button 
                      class="project-delete-btn"
                      @click.stop="confirmDeleteProject(project)"
                      title="프로젝트 삭제"
                    >
                      ×
                    </button>
                  </div>
                  <div class="project-description-cell">
                    <div class="project-description">{{ project.content }}</div>
                  </div>
                  <div class="timeline-grid">
                    <div 
                      v-for="month in 12" 
                      :key="month" 
                      class="timeline-cell"
                    >
                      <div 
                        v-if="isProjectActiveInMonth(project, month)"
                        class="project-bar"
                        :style="getProjectBarStyle(project, month, 0)"
                      ></div>
                    </div>
                  </div>
                </div>
                
                <!-- 하위 프로젝트들 -->
                <template v-for="subProject in project.children" :key="`sub-${subProject.id}`">
                  <div class="project-row sub-project" @click="viewProjectDetail(subProject)">
                    <div class="project-name-cell">
                      <div class="hierarchy-indicator level-1"></div>
                      <div class="project-name">{{ subProject.name }}</div>
                      <button 
                        class="project-delete-btn"
                        @click.stop="confirmDeleteProject(subProject)"
                        title="프로젝트 삭제"
                      >
                        ×
                      </button>
                    </div>
                    <div class="project-description-cell">
                      <div class="project-description">{{ subProject.content }}</div>
                    </div>
                    <div class="timeline-grid">
                      <div 
                        v-for="month in 12" 
                        :key="month" 
                        class="timeline-cell"
                      >
                        <div 
                          v-if="isProjectActiveInMonth(subProject, month)"
                          class="project-bar"
                          :style="getProjectBarStyle(subProject, month, 1)"
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 3차 레벨 프로젝트들 -->
                  <template v-for="subSubProject in subProject.children" :key="`subsub-${subSubProject.id}`">
                    <div class="project-row sub-project" @click="viewProjectDetail(subSubProject)">
                      <div class="project-name-cell">
                        <div class="hierarchy-indicator level-2"></div>
                        <div class="project-name">{{ subSubProject.name }}</div>
                        <button 
                          class="project-delete-btn"
                          @click.stop="confirmDeleteProject(subSubProject)"
                          title="프로젝트 삭제"
                        >
                          ×
                        </button>
                      </div>
                      <div class="project-description-cell">
                        <div class="project-description">{{ subSubProject.content }}</div>
                      </div>
                      <div class="timeline-grid">
                        <div 
                          v-for="month in 12" 
                          :key="month" 
                          class="timeline-cell"
                        >
                          <div 
                            v-if="isProjectActiveInMonth(subSubProject, month)"
                            class="project-bar"
                            :style="getProjectBarStyle(subSubProject, month, 2)"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </template>
                </template>
              </template>
            </div>
          </div>
        </section>
      </div>

      <!-- 나의 업무일지 섹션 -->
      <div v-show="activeTab === 'third'">
        <section class="diary-section">
          <div class="section-header">
            <h2>나의 업무일지</h2>
          </div>
          <div class="diary-content">
            <p>나의 업무일지 내용 개발 예정</p>
          </div>
        </section>
      </div>
    </main>

    <!-- 프로젝트 상세 모달 -->
    <div v-if="showProjectDetailModal" class="modal-overlay" @click="closeProjectDetailModal">
      <div class="modal-content" @click.stop>
        <!-- 모달 헤더 -->
        <div class="modal-header">
          <div class="modal-header-content">
            <h3 class="modal-title">
              <div class="title-icon">📊</div>
              <span>프로젝트 상세</span>
            </h3>
            <button @click="closeProjectDetailModal" class="close-btn">×</button>
          </div>
        </div>

        <!-- 모달 바디 -->
        <div class="modal-body project-detail-body">
          <div class="project-detail-content">
            <!-- 프로젝트명 -->
            <div class="project-info-item">
              <div class="project-info-label">
                <span class="label-icon">🎯</span>
                <span class="label-text">프로젝트명</span>
              </div>
              <div class="project-info-content">
                <input 
                  v-if="isProjectDetailEditMode"
                  v-model="currentProjectDetail.name"
                  type="text"
                  class="form-input"
                  placeholder="프로젝트명을 입력하세요"
                />
                <span v-else>{{ currentProjectDetail.name }}</span>
              </div>
            </div>


            <!-- 프로젝트 기간 -->
            <div class="project-info-item">
              <div class="project-info-label">
                <span class="label-icon">📅</span>
                <span class="label-text">프로젝트 기간</span>
              </div>
              <div class="project-info-content">
                <div v-if="isProjectDetailEditMode" class="date-input-group">
                  <input 
                    v-model="currentProjectDetail.startDate"
                    type="date"
                    class="form-input date-input"
                  />
                  <span class="date-separator">~</span>
                  <input 
                    v-model="currentProjectDetail.endDate"
                    type="date"
                    class="form-input date-input"
                  />
                </div>
                <div v-else class="period-value">
                  <span class="date-badge">{{ formatDate(currentProjectDetail.startDate) }}</span>
                  <span class="date-separator">~</span>
                  <span class="date-badge">{{ formatDate(currentProjectDetail.endDate) }}</span>
                </div>
              </div>
            </div>

            <!-- 프로젝트 설명 -->
            <div class="project-info-item">
              <div class="project-info-label">
                <span class="label-icon">📝</span>
                <span class="label-text">프로젝트 설명</span>
              </div>
              <div class="project-info-content">
                <textarea 
                  v-if="isProjectDetailEditMode"
                  v-model="currentProjectDetail.content"
                  class="form-textarea"
                  placeholder="프로젝트 설명을 입력하세요"
                  rows="4"
                ></textarea>
                <div v-else class="project-detail-description">
                  {{ currentProjectDetail.content || '설명이 없습니다.' }}
                </div>
              </div>
            </div>
          </div>

          <!-- 하위 프로젝트 목록 -->
          <div v-if="currentProjectDetail.children && currentProjectDetail.children.length > 0" class="sub-projects-section">
            <div class="project-info-item">
              <div class="project-info-label">
                <span class="label-icon">🌟</span>
                <span class="label-text">하위 프로젝트</span>
              </div>
              <div class="sub-projects-list">
              <div 
                v-for="subProject in currentProjectDetail.children" 
                :key="subProject.id"
                class="sub-project-item"
                @click="viewProjectDetail(subProject)"
              >
                <div class="sub-project-header">
                  <div class="hierarchy-indicator level-1"></div>
                  <div class="sub-project-name">{{ subProject.name }}</div>
                  <div class="sub-project-period">
                    <span class="period-icon">📅</span>
                    {{ formatDate(subProject.startDate) }} ~ {{ formatDate(subProject.endDate) }}
                  </div>
                </div>
                <div class="sub-project-description">{{ subProject.content }}</div>
              </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 모달 푸터 -->
        <div class="modal-footer">
          <div></div>
          <div class="button-group">
            <button v-if="!isProjectDetailEditMode" @click="enableProjectDetailEdit" class="btn btn-primary">편집</button>
            <button v-if="isProjectDetailEditMode" @click="saveProjectDetail" class="btn btn-success">저장</button>
            <button v-if="isProjectDetailEditMode" @click="cancelProjectDetailEdit" class="btn btn-secondary">취소</button>
            <button v-if="!isProjectDetailEditMode" @click="closeProjectDetailModal" class="btn btn-secondary">닫기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 프로젝트 삭제 확인 모달 -->
    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click="closeDeleteConfirmModal">
      <div class="modal-content delete-confirm-modal" @click.stop>
        <!-- 모달 헤더 -->
        <div class="modal-header">
          <div class="modal-header-content">
            <h3 class="modal-title">
              <div class="title-icon">⚠️</div>
              <span>프로젝트 삭제 확인</span>
            </h3>
            <button @click="closeDeleteConfirmModal" class="close-btn">×</button>
          </div>
        </div>
        
        <!-- 모달 바디 -->
        <div class="modal-body">
          <div class="delete-warning">
            <div v-if="projectToDelete?.children && projectToDelete.children.length > 0">
              <p>❌ 삭제할 수 없습니다</p>
              <div class="project-to-delete">
                <strong>{{ projectToDelete?.name }}</strong>
              </div>
              <p class="error-text">⚠️ 하위 프로젝트 {{ projectToDelete.children.length }}개가 있어서 삭제할 수 없습니다.</p>
              <p class="info-text">💡 하위 프로젝트를 먼저 삭제해주세요.</p>
            </div>
            <div v-else>
              <p>다음 프로젝트를 삭제하시겠습니까?</p>
              <div class="project-to-delete">
                <strong>{{ projectToDelete?.name }}</strong>
              </div>
              <p class="warning-text">⚠️ 이 작업은 되돌릴 수 없습니다.</p>
            </div>
          </div>
        </div>
        
        <!-- 모달 푸터 -->
        <div class="modal-footer">
          <div></div>
          <div class="button-group">
            <button @click="closeDeleteConfirmModal" class="btn btn-secondary">
              {{ (projectToDelete?.children && projectToDelete.children.length > 0) ? '확인' : '취소' }}
            </button>
            <button 
              v-if="!(projectToDelete?.children && projectToDelete.children.length > 0)"
              @click="deleteProject" 
              class="btn btn-danger"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 프로젝트 추가 모달 -->
    <div v-if="showProjectModal" class="modal-overlay" @click="closeProjectModal">
      <div class="modal-content" @click.stop>
        <!-- 모달 헤더 -->
        <div class="modal-header">
          <div class="modal-header-content">
            <h3 class="modal-title">
              <div class="title-icon">📊</div>
              <span>프로젝트 추가</span>
            </h3>
            <button @click="closeProjectModal" class="close-btn">×</button>
          </div>
        </div>

        <!-- 모달 바디 -->
        <div class="modal-body">
          <!-- 상위 프로젝트 선택 -->
          <div class="form-group">
            <label class="form-label">상위 프로젝트 (선택사항)</label>
            <div class="parent-project-selection">
              <select 
                v-model="currentProject.parentId"
                class="form-select"
              >
                <option value="">상위 프로젝트 없음</option>
                <template v-for="project in flatProjectList" :key="project.id">
                  <option :value="project.id">
                    {{ getProjectIndentText(project.level) }}{{ project.name }}
                  </option>
                </template>
              </select>
            </div>
          </div>

          <!-- 프로젝트 이름 -->
          <div class="form-group">
            <label class="form-label">프로젝트 이름 (필수)</label>
            <input 
              v-model="currentProject.name"
              type="text" 
              placeholder="프로젝트 이름을 입력하세요" 
              class="form-input"
            />
          </div>

          <!-- 프로젝트 설명 -->
          <div class="form-group">
            <label class="form-label">프로젝트 설명</label>
            <textarea 
              v-model="currentProject.content"
              placeholder="프로젝트에 대한 상세 설명을 입력하세요"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <!-- 시작일 -->
          <div class="form-group">
            <label class="form-label">시작일</label>
            <input 
              v-model="currentProject.startDate"
              type="date" 
              class="form-input"
            />
          </div>

          <!-- 종료일 -->
          <div class="form-group">
            <label class="form-label">종료일</label>
            <input 
              v-model="currentProject.endDate"
              type="date" 
              class="form-input"
            />
          </div>
        </div>

        <!-- 모달 푸터 -->
        <div class="modal-footer">
          <div></div>
          <div class="button-group">
            <button @click="closeProjectModal" class="btn btn-secondary">취소</button>
            <button @click="saveProject" class="btn btn-primary">저장</button>
          </div>
        </div>
      </div>
    </div>

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
                <span class="status-badge modal-status-badge" :class="getStatusClass(currentWork.status)">
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
                <div v-if="currentWork.status !== '완료'" class="date-item">
                  <div class="detail-label">마감일</div>
                  <div class="date-value">{{ formatDateKorean(currentWork.endDate) }}</div>
                </div>
                <div v-if="currentWork.status === '완료'" class="date-item">
                  <div class="detail-label">완료일</div>
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
            <!-- 프로젝트 선택 (추가/편집 모드 공통) -->
            <div class="project-selection">
              <label class="selection-label">
                <span v-if="!isEditMode" class="step-indicator">1</span>
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
                <select 
                  v-model="currentWork.status" 
                  class="form-select"
                  :disabled="currentWork.status === '완료'"
                  :class="{ 'disabled': currentWork.status === '완료' }"
                >
                  <option value="예정">예정</option>
                  <option value="진행중">진행중</option>
                  <option value="검토중">검토중</option>
                  <option value="반려">반려</option>
                  <option value="완료">완료</option>
                  <option value="취소">취소</option>
                </select>
                <div v-if="currentWork.status === '완료'" class="status-notice">
                  완료된 업무의 상태는 변경할 수 없습니다.
                </div>
              </div>
              
              <div class="form-group">
                <label>시작일</label>
                <input 
                  v-model="currentWork.startDate" 
                  type="date" 
                  class="form-input"
                >
              </div>
              
              <div v-if="currentWork.status !== '완료'" class="form-group">
                <label>마감일</label>
                <input 
                  v-model="currentWork.endDate" 
                  type="date" 
                  class="form-input"
                >
              </div>
              
              <div v-if="currentWork.status === '완료'" class="form-group">
                <label>완료일</label>
                <input 
                  :value="currentWork.endDate" 
                  type="date" 
                  class="form-input"
                  disabled
                  readonly
                >
                <div class="completion-notice">
                  완료일은 변경할 수 없습니다.
                </div>
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
import draggable from 'vuedraggable'
import axios from 'axios'

const auth = useAuthStore()
const router = useRouter()

// 상태 관리
const showWorkModal = ref(false)
const isEditMode = ref(false)
const isDetailMode = ref(false)
const currentWork = ref({})
const currentWeek = ref(new Date())

// 탭 메뉴 관리
const activeTab = ref('today')

// 프로젝트 페이지 관련
const currentYear = ref(new Date().getFullYear())
const topLevelProjects = ref([])
const months = Array.from({ length: 12 }, (_, i) => i + 1)

// 프로젝트 모달 관련
const showProjectModal = ref(false)
const showProjectDetailModal = ref(false)
const showDeleteConfirmModal = ref(false)
const isProjectEditMode = ref(false)
const isProjectDetailEditMode = ref(false)
const currentProject = ref({
  name: '',
  content: '',
  startDate: '',
  endDate: '',
  parentId: null
})
const currentProjectDetail = ref({})
const originalProjectDetail = ref({})
const projectToDelete = ref(null)

// 평면화된 프로젝트 목록 (상위 프로젝트 선택용)
const flatProjectList = computed(() => {
  const flattenProjects = (projects, level = 0) => {
    let result = []
    for (const project of projects) {
      result.push({
        id: project.id,
        name: project.name,
        level: level
      })
      if (project.children && project.children.length > 0) {
        result = result.concat(flattenProjects(project.children, level + 1))
      }
    }
    return result
  }
  return flattenProjects(topLevelProjects.value)
})

// 새로운 프로젝트 선택 관련 변수들
const projectSearchTerm = ref('')
const expandedProjectNodes = ref(new Set())
const selectedProjectForWork = ref(null)

// 상태 드롭다운 관련 변수들
const openDropdownId = ref(null)
const statusOptions = ref([
  { value: '예정', class: 'todo' },
  { value: '진행중', class: 'progress' },
  { value: '검토중', class: 'review' },
  { value: '반려', class: 'rejected' },
  { value: '완료', class: 'completed' },
  { value: '취소', class: 'cancelled' }
])

// 계층형 카테고리 데이터 (동적 로딩 - 업무 추가용)
const hierarchicalCategories = ref([])
const categoryLoadingStates = ref(new Map()) // 로딩 상태 추적

// 오늘의 업무 섹션용 카테고리 계층 (업무 데이터로부터 생성)
const todayCategoryHierarchy = ref([])

// 완료되지 않은 오늘의 업무만 필터링
const activeTodayWorks = computed(() => {
  return todayWorks.value.filter(work => work.status !== '완료')
})

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
const topCategories = ref([])

// 주간 완료 업무 데이터
const weeklyEndWorks = ref([])

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

// 주간 계산: 월요일~일요일 기준 (8/10 일요일 → 8/4~8/10 주간)
const getKoreanMonday = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  
  // 직접 날짜를 계산하여 확인
  
  // 일요일이면 6일 전이 월요일
  const monday = new Date(d)
  if (day === 0) {
    // 일요일: 6일 전
    monday.setDate(d.getDate() - 6)
  } else {
    // 다른 요일: (요일-1)일 전
    monday.setDate(d.getDate() - (day - 1))
  }
  
  
  return monday
}

// 현재 주 제목
const currentWeekTitle = computed(() => {
  const monday = getKoreanMonday(currentWeek.value)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  const startMonth = monday.getMonth() + 1
  const startDay = monday.getDate()
  const endMonth = sunday.getMonth() + 1
  const endDay = sunday.getDate()
  
  return `${startMonth}/${startDay} - ${endMonth}/${endDay}`
})

// 주간 날짜들 (월요일부터 일요일까지)
const weekDays = computed(() => {
  const monday = getKoreanMonday(currentWeek.value)
  const days = []
  const today = new Date()
  const weekdays = ['월', '화', '수', '목', '금', '토', '일']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    
    const dayData = {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      dayName: weekdays[i],
      fullDate: date.toISOString().split('T')[0],
      isToday: date.toDateString() === today.toDateString()
    }
    
    days.push(dayData)
  }
  
  return days
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 탭 전환 함수
const setActiveTab = (tab) => {
  activeTab.value = tab
  if (tab === 'project') {
    loadTopLevelProjects()
  }
}

// 프로젝트 레벨 들여쓰기 텍스트 생성
const getProjectIndentText = (level) => {
  return '　'.repeat(level * 2) + (level > 0 ? '└ ' : '')
}

// 프로젝트 path 생성 함수
const getProjectPath = (projectId) => {
  if (!projectId) return ''
  
  const findProjectPath = (projects, targetId, currentPath = []) => {
    for (const project of projects) {
      const newPath = [...currentPath, project.id]
      
      if (project.id === targetId) {
        return newPath
      }
      
      if (project.children && project.children.length > 0) {
        const found = findProjectPath(project.children, targetId, newPath)
        if (found) return found
      }
    }
    return null
  }
  
  const pathArray = findProjectPath(topLevelProjects.value, projectId)
  return pathArray ? '/' + pathArray.join('/') : ''
}

// 선택한 프로젝트의 level 가져오는 함수
const getProjectLevel = (projectId) => {
  if (!projectId) return 0
  
  const targetProject = flatProjectList.value.find(project => project.id === projectId)
  return targetProject ? targetProject.level : 0
}

// 프로젝트 추가 함수
const addProject = () => {
  currentProject.value = {
    name: '',
    content: '',
    startDate: '',
    endDate: '',
    parentId: null
  }
  showProjectModal.value = true
}

// 프로젝트 모달 닫기
const closeProjectModal = () => {
  showProjectModal.value = false
}

// 프로젝트 상세 보기
const viewProjectDetail = (project) => {
  currentProjectDetail.value = { ...project }
  showProjectDetailModal.value = true
}

// 프로젝트 상세 모달 닫기
const closeProjectDetailModal = () => {
  showProjectDetailModal.value = false
  isProjectDetailEditMode.value = false
}

// 프로젝트 상세 편집 모드 활성화
const enableProjectDetailEdit = () => {
  isProjectDetailEditMode.value = true
  originalProjectDetail.value = { ...currentProjectDetail.value }
}

// 프로젝트 상세 편집 취소
const cancelProjectDetailEdit = () => {
  currentProjectDetail.value = { ...originalProjectDetail.value }
  isProjectDetailEditMode.value = false
}

// 프로젝트 상세 저장
const saveProjectDetail = async () => {
  try {
    const projectId = currentProjectDetail.value.id
    
    // 수정된 데이터만 전송
    const updateData = {}
    
    // 변경된 필드만 포함
    if (currentProjectDetail.value.name !== originalProjectDetail.value.name) {
      updateData.name = currentProjectDetail.value.name
    }
    if (currentProjectDetail.value.content !== originalProjectDetail.value.content) {
      updateData.content = currentProjectDetail.value.content
    }
    if (currentProjectDetail.value.startDate !== originalProjectDetail.value.startDate) {
      updateData.started_at = currentProjectDetail.value.startDate || null
    }
    if (currentProjectDetail.value.endDate !== originalProjectDetail.value.endDate) {
      updateData.end_at = currentProjectDetail.value.endDate || null
    }
    
    // 변경사항이 있는 경우에만 API 호출
    if (Object.keys(updateData).length > 0) {
      console.log('전송할 수정 데이터:', updateData)
      
      const response = await axios.put(`http://127.0.0.1:8000/api/v1/category/category/${projectId}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('프로젝트 수정 성공', response.data)
      loadTopLevelProjects() // 프로젝트 목록 새로고침
    }
    
    isProjectDetailEditMode.value = false
  } catch (error) {
    console.error('프로젝트 수정 실패:', error)
  }
}

// 프로젝트 저장
const saveProject = async () => {
  try {
    const parentId = currentProject.value.parentId || null
    
    // 프로젝트 데이터 준비
    const projectData = {
      name: currentProject.value.name,
      content: currentProject.value.content,
      parent_id: parentId,
      path: parentId ? getProjectPath(parentId) + '/' + parentId : '',
      level: parentId ? getProjectLevel(parentId) + 1 : 0,
      started_at: currentProject.value.startDate || null,
      end_at: currentProject.value.endDate || null
    }
    
    console.log('전송할 프로젝트 데이터:', projectData)
    
    // API 호출 로직
    const response = await axios.post('http://127.0.0.1:8000/api/v1/category/', projectData, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('프로젝트 추가 성공', response.data)
    closeProjectModal()
    loadTopLevelProjects() // 프로젝트 목록 새로고침
  } catch (error) {
    console.error('프로젝트 추가 실패:', error)
  }
}

// 프로젝트 관련 함수들
const changeYear = (direction) => {
  currentYear.value += direction
  loadTopLevelProjects()
}

const loadTopLevelProjects = async () => {
  try {
    // 기존 데이터 초기화
    topLevelProjects.value = []
    
    // 새로운 categories API 호출
    console.log(`📡 연간 프로젝트 API 호출 - 연도: ${currentYear.value}`)
    console.log(`🔗 API URL: http://127.0.0.1:8000/api/v1/category/categories?year=${currentYear.value}`)
    
    const response = await axios.get('http://127.0.0.1:8000/api/v1/category/categories', {
      params: {
        year: currentYear.value
      }
    })
    
    const categories = response.data
    console.log('✅ 카테고리 데이터 로드 성공:', categories)
    
    // 각 카테고리의 level 값 확인
    categories.forEach(cat => console.log(`카테고리 ${cat.name}: level=${cat.level}, parent_id=${cat.parent_id}`))
    
    // level0 카테고리만 필터링하여 최상위 프로젝트로 설정 (parent_id가 null인 카테고리도 포함)
    const topLevelCategories = categories.filter(category => category.level === 0 || category.parent_id === null)
    
    console.log('🎯 최상위 카테고리:', topLevelCategories)
    
    // CategoryResponse 구조에 맞게 데이터 매핑
    topLevelProjects.value = topLevelCategories.map(category => ({
      id: category.id,
      name: category.name,
      content: category.content,
      startDate: category.started_at ? category.started_at.split('T')[0] : null,
      endDate: category.end_at ? category.end_at.split('T')[0] : null,
      children: buildCategoryHierarchy(categories, category.id)
    }))
    
    console.log('🔄 매핑된 프로젝트 데이터:', topLevelProjects.value)
    
  } catch (error) {
    console.error('💥 연간 프로젝트 로드 에러:', error)
    // 에러 시 빈 배열로 설정
    topLevelProjects.value = []
  }
}

// 카테고리 계층구조 빌드 함수
const buildCategoryHierarchy = (allCategories, parentId) => {
  const children = allCategories.filter(category => category.parent_id === parentId)
  
  return children.map(category => ({
    id: category.id,
    name: category.name,
    content: category.content,
    startDate: category.started_at ? category.started_at.split('T')[0] : null,
    endDate: category.end_at ? category.end_at.split('T')[0] : null,
    children: buildCategoryHierarchy(allCategories, category.id)
  }))
}


const isProjectActiveInMonth = (project, month) => {
  if (!project.startDate || !project.endDate) return false
  
  const startDate = new Date(project.startDate)
  const endDate = new Date(project.endDate)
  const targetMonth = new Date(currentYear.value, month - 1, 1)
  const nextMonth = new Date(currentYear.value, month, 0)
  
  return startDate <= nextMonth && endDate >= targetMonth
}

const getProjectBarForMonth = (project, month) => {
  return isProjectActiveInMonth(project, month)
}

const getProjectBarStyle = (project, month, level = 0) => {
  if (!project.startDate || !project.endDate) return {}
  
  const startDate = new Date(project.startDate)
  const endDate = new Date(project.endDate)
  const monthStart = new Date(currentYear.value, month - 1, 1)
  const monthEnd = new Date(currentYear.value, month, 0)
  
  // 프로젝트가 이달에 시작하거나 끝나는지 확인
  const projectStartMonth = startDate.getMonth() + 1
  const projectStartYear = startDate.getFullYear()
  const projectEndMonth = endDate.getMonth() + 1
  const projectEndYear = endDate.getFullYear()
  
  const startsThisMonth = (projectStartYear === currentYear.value && projectStartMonth === month)
  const endsThisMonth = (projectEndYear === currentYear.value && projectEndMonth === month)
  
  
  // 레벨별 색상 및 높이 설정
  const levelStyles = {
    0: { backgroundColor: '#667eea', height: '12px' }, // 보라색
    1: { backgroundColor: '#48bb78', height: '10px' }, // 초록색
    2: { backgroundColor: '#ed8936', height: '8px' },  // 주황색
    3: { backgroundColor: '#e53e3e', height: '6px' }   // 빨간색
  }
  
  let style = {
    width: 'calc(100% + 1px)',
    margin: '2px 0',
    ...levelStyles[level] || levelStyles[0]
  }
  
  // 시작과 끝에 따른 모서리 처리 - 연속적인 막대 모양
  if (startsThisMonth && endsThisMonth) {
    // 이달에 시작하고 끝남
    style.borderRadius = '6px'
    style.width = '100%'
  } else if (startsThisMonth && !endsThisMonth) {
    // 이달에 시작하지만 다음달로 계속
    style.borderRadius = '6px 0 0 6px'
    style.marginRight = '-1px'
  } else if (!startsThisMonth && endsThisMonth) {
    // 이전달에서 시작해서 이달에 끝남
    style.borderRadius = '0 6px 6px 0'
    style.marginLeft = '-1px'
    style.width = '100%'
  } else if (!startsThisMonth && !endsThisMonth) {
    // 중간 달 (양쪽 모두 연결)
    style.borderRadius = '0'
    style.marginLeft = '-1px'
    style.marginRight = '-1px'
  }
  
  return style
}

// 날짜 비교를 위한 포맷팅 함수 (YYYY-MM-DD)
const formatDateForComparison = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

// 특정 날짜와 카테고리에 해당하는 완료 업무 필터링
const getCompletedWorksForCell = (categoryId, targetDate) => {
  
  const filteredWorks = weeklyEndWorks.value.filter(work => {
    if (!work.end_at || !work.root_category_id) {
      return false
    }
    
    const workEndDate = work.end_at.split('T')[0] // YYYY-MM-DD 형식으로 변환
    const categoryMatch = work.root_category_id === categoryId
    const dateMatch = workEndDate === targetDate
    
    
    return categoryMatch && dateMatch
  })
  
  return filteredWorks
}

// 업무 태그 색상 생성
const getWorkTagColor = (work) => {
  // 업무 우선순위나 카테고리에 따른 색상
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  
  // 업무 ID를 기반으로 일관된 색상 할당
  const colorIndex = work.id % colors.length
  return colors[colorIndex]
}

// 완료 시간 포맷팅
const formatCompletedTime = (endAt) => {
  if (!endAt) return ''
  const date = new Date(endAt)
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 텍스트 길이 제한 함수
const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 마감일 상태 확인 함수
const getDeadlineStatus = (work) => {
  if (!work.endDate) return 'normal'
  
  const today = new Date()
  today.setHours(0, 0, 0, 0) // 시간을 00:00:00으로 설정
  
  const endDate = new Date(work.endDate)
  endDate.setHours(0, 0, 0, 0) // 시간을 00:00:00으로 설정
  
  if (endDate < today) {
    return 'overdue' // 마감일 지남
  } else if (endDate.getTime() === today.getTime()) {
    return 'due-today' // 오늘이 마감일
  } else {
    return 'normal' // 일반
  }
}

// ID 기반 일관된 색상 생성 함수
const generateConsistentColor = (id) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ]
  // ID를 기반으로 일관된 색상 인덱스 생성
  const hash = id.toString().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  return colors[Math.abs(hash) % colors.length]
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
  toggleCategoryInList(todayCategoryHierarchy.value)
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

// 특정 카테고리까지의 경로를 모두 확장하는 함수
const expandPathToCategory = (categoryId, categories = hierarchicalCategories.value) => {
  console.log('🔍 경로 확장 중 - 찾는 카테고리 ID:', categoryId)
  console.log('🔍 검색할 카테고리 목록:', categories.map(c => ({ id: c.id, name: c.name })))
  
  for (const category of categories) {
    if (category.id === categoryId) {
      console.log('✅ 목표 카테고리 찾음:', category.name)
      return true // 목표 카테고리를 찾았음
    }
    if (category.children) {
      const found = expandPathToCategory(categoryId, category.children)
      if (found) {
        // 자식에서 목표를 찾았으므로 현재 카테고리를 확장
        console.log('🔓 카테고리 확장:', category.name)
        category.expanded = true
        return true
      }
    }
  }
  console.log('❌ 카테고리를 찾을 수 없음')
  return false
}

// 업무 편집 시 필요한 카테고리 경로를 동적으로 로드하는 함수
const loadCategoryPath = async (categories) => {
  console.log('📡 카테고리 경로 로드 시작:', categories)
  
  // 레벨별로 정렬
  const sortedCategories = categories.sort((a, b) => a.level - b.level)
  
  // 각 레벨별로 카테고리 로드
  for (const category of sortedCategories) {
    let parentId = null
    
    // 상위 레벨 카테고리가 있는지 확인
    const parentCategory = sortedCategories.find(c => c.level === category.level - 1)
    if (parentCategory) {
      parentId = parentCategory.category_id
    }
    
    console.log(`📡 레벨 ${category.level} 카테고리 로드 중... (부모: ${parentId})`)
    
    try {
      const childCategories = await loadCategories(parentId, category.level)
      console.log(`✅ 레벨 ${category.level} 카테고리 로드 완료:`, childCategories)
      
      // hierarchicalCategories에 추가/업데이트
      if (parentId === null) {
        // 최상위 레벨은 직접 추가
        childCategories.forEach(child => {
          const existing = hierarchicalCategories.value.find(c => c.id === child.id)
          if (!existing) {
            hierarchicalCategories.value.push(child)
          }
        })
      } else {
        // 하위 레벨은 부모 카테고리에 추가
        const parent = findCategoryById(parentId)
        if (parent && !parent.loaded) {
          parent.children = childCategories
          parent.loaded = true
        }
      }
    } catch (error) {
      console.error(`❌ 레벨 ${category.level} 카테고리 로드 실패:`, error)
    }
  }
}

// 새로운 카테고리 구조용 함수들
const getWorksForCategory = (categoryId) => {
  const category = findCategoryInHierarchy(todayCategoryHierarchy.value, categoryId)
  if (!category || !category.works) return []
  // 완료되지 않은 업무만 반환
  return category.works.filter(work => work.status !== '완료')
}

// 카테고리별 작업 목록을 위한 computed 속성들
const categoryWorkLists = ref(new Map())

// 드래그 앤 드롭용 카테고리 업무 가져오기
const getCategoryWorks = (categoryId) => {
  if (!categoryWorkLists.value.has(categoryId)) {
    const category = findCategoryInHierarchy(todayCategoryHierarchy.value, categoryId)
    if (category && category.works) {
      const filteredWorks = category.works.filter(work => work.status !== '완료')
      categoryWorkLists.value.set(categoryId, ref(filteredWorks))
    } else {
      categoryWorkLists.value.set(categoryId, ref([]))
    }
  }
  return categoryWorkLists.value.get(categoryId)
}

// 업무 순서 변경 핸들러
const updateWorkOrder = (event) => {
  console.log('업무 순서가 변경되었습니다:', event)
  
  if (event.moved) {
    const { oldIndex, newIndex, element } = event.moved
    console.log(`업무 "${element.name}"이 ${oldIndex}에서 ${newIndex}로 이동했습니다.`)
    
    // 필요시 서버에 순서 변경 API 호출
    // updateWorkOrderAPI(element.id, newIndex)
  }
}

// 드롭다운 전에 최상위에서 보여줄 업무들 (하위 카테고리 업무 포함)
const getWorksForTopCategory = (categoryId) => {
  const category = findCategoryInHierarchy(todayCategoryHierarchy.value, categoryId)
  if (!category) return []
  
  const getAllWorks = (cat) => {
    let works = [...(cat.works || [])]
    if (cat.children) {
      for (const child of cat.children) {
        works = works.concat(getAllWorks(child))
      }
    }
    return works
  }
  
  const allWorks = getAllWorks(category)
  // 완료되지 않은 업무만 반환
  return allWorks.filter(work => work.status !== '완료')
}

const hasWorksInCategory = (category) => {
  const hasWorksRecursively = (cat) => {
    if (cat.works && cat.works.length > 0) return true
    if (cat.children) {
      return cat.children.some(child => hasWorksRecursively(child))
    }
    return false
  }
  
  return hasWorksRecursively(category)
}

// todayCategoryHierarchy에서 카테고리 찾기
const findCategoryInHierarchy = (categories, categoryId) => {
  for (const category of categories) {
    if (category.id === categoryId) {
      return category
    }
    if (category.children) {
      const found = findCategoryInHierarchy(category.children, categoryId)
      if (found) return found
    }
  }
  return null
}

// 해당 카테고리에 직속으로 업무가 있는지 확인 (하위 카테고리 제외)
const hasDirectWorksInCategory = (category) => {
  return category.works && category.works.length > 0
}

const getCategoryName = (categoryId) => {
  const category = findCategoryById(categoryId)
  return category ? category.name : ''
}

// 이벤트 핸들러
// 주간 완료 업무 API 호출
const getWeekendWorks = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams({
      start: startDate,
      end: endDate
    })
    
    const response = await axios.get(`http://127.0.0.1:8000/api/v1/work/weekend?${params}`)
    return response.data
  } catch (error) {
    console.error('💥 주간 완료 업무 API 호출 에러:', error)
    return []
  }
}

// 주간 데이터 업데이트
const updateWeeklyData = async () => {
  const monday = getKoreanMonday(currentWeek.value)
  monday.setHours(0, 0, 0, 0) // 월요일 00:00:00.000으로 설정
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  console.log(`📅 주간 데이터 업데이트: ${monday.toISOString().split('T')[0]} ~ ${sunday.toISOString().split('T')[0]}`)
  console.log(`📅 API 호출 범위: ${monday.toISOString()} ~ ${sunday.toISOString()}`)
  
  weeklyEndWorks.value = await getWeekendWorks(
    monday.toISOString(),
    sunday.toISOString()
  )
}

const prevWeek = async () => {
  const newWeek = new Date(currentWeek.value)
  newWeek.setDate(newWeek.getDate() - 7)
  currentWeek.value = newWeek
  await updateWeeklyData() // 주간 데이터 업데이트
}

const nextWeek = async () => {
  const newWeek = new Date(currentWeek.value)
  newWeek.setDate(newWeek.getDate() + 7)
  currentWeek.value = newWeek
  await updateWeeklyData() // 주간 데이터 업데이트
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

const viewCompletedWorkDetail = (work) => {
  
  // 완료된 업무 데이터를 모달에 맞는 형식으로 변환
  currentWork.value = {
    id: work.id,
    name: work.title,
    content: work.content || '',
    categoryId: work.root_category_id,
    status: '완료',
    startDate: work.started_at ? work.started_at.split('T')[0] : '',
    endDate: work.end_at ? work.end_at.split('T')[0] : '',
    isMyWork: work.myjob || false,
    categories: work.categories || []
  }
  
  isEditMode.value = false
  isDetailMode.value = true
  showWorkModal.value = true
}

const addWorkToCell = (categoryId, date) => {
  // 추후 구현: 해당 카테고리와 날짜로 업무 추가 기능
  // console.log(`카테고리 ${categoryId}에 ${date} 날짜로 업무 추가`)
}

const closeModal = () => {
  showWorkModal.value = false
  currentWork.value = {}
  isEditMode.value = false
  isDetailMode.value = false
  selectedProjectForWork.value = null
  projectSearchTerm.value = ''
}

// 오늘의 업무 데이터 새로고침 함수
const refreshTodayData = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/v1/work/today')
    const data = response.data
    
    // 데이터 매핑 및 화면 업데이트
    const mappedWorks = data.map(work => ({
      id: work.id,
      name: work.title,
      content: work.content,
      categoryId: work.category_id,
      status: work.current_status,
      startDate: work.started_at ? work.started_at.split('T')[0] : '',
      endDate: work.deadline ? work.deadline.split('T')[0] : '',
      isMyWork: work.myjob,
      categories: work.categories || []
    }))
    
    todayWorks.value = mappedWorks
    
    // 업무들로부터 카테고리 계층구조 생성
    const categoryHierarchy = buildCategoryHierarchyFromWorks(mappedWorks)
    todayCategoryHierarchy.value = categoryHierarchy
    
    // 카테고리별 작업 목록 초기화
    categoryWorkLists.value.clear()
    
    console.log('✅ 오늘의 업무 데이터 새로고침 완료')
  } catch (error) {
    console.error('💥 오늘의 업무 데이터 새로고침 에러:', error)
  }
}

const saveWork = async () => {
  if (!currentWork.value.name.trim()) {
    alert('업무명을 입력해주세요.')
    return
  }
  
  const categoryId = selectedProjectForWork.value?.id
  if (!categoryId) {
    alert('프로젝트를 선택해주세요.')
    return
  }
  
  try {
    if (isEditMode.value) {
      // 수정 모드 - PUT 요청
      let response
      
      if (currentWork.value.status === '완료') {
        // 완료 처리용 API 호출
        console.log(`📡 모달에서 업무 완료 API 호출 - 업무 ID: ${currentWork.value.id}`)
        
        response = await axios.put(`http://127.0.0.1:8000/api/v1/work/end/${currentWork.value.id}`, null, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } else {
        // 일반 수정 API 호출
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
        
        console.log('📋 업무 수정 전송 데이터:', updateData)
        console.log('📋 업무 수정 JSON 문자열:', JSON.stringify(updateData, null, 2))
        
        response = await axios.put(`http://127.0.0.1:8000/api/v1/work/work/${currentWork.value.id}`, updateData, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('📡 업무 수정 응답 상태:', response.status)
      }
      
      console.log('✅ 업무 수정 성공')
      
      // 서버에서 최신 오늘의 업무 데이터를 다시 불러와서 동기화
      await refreshTodayData()
      console.log('🔄 업무 수정 후 오늘의 업무 데이터 새로고침 완료')
      
      // 완료 처리 시 주간 데이터도 업데이트
      if (currentWork.value.status === '완료') {
        await updateWeeklyData()
        console.log('🔄 모달에서 주간 완료 업무 데이터 업데이트됨')
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
      
      const response = await axios.post('http://127.0.0.1:8000/api/v1/work', newWorkData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const createdWork = response.data
      console.log('✅ 새 업무 생성 성공:', createdWork)
      
      // 서버에서 최신 오늘의 업무 데이터를 다시 불러와서 동기화
      await refreshTodayData()
      console.log('🔄 새 업무 추가 후 오늘의 업무 데이터 새로고침 완료')
    }
  } catch (error) {
    console.error('💥 API 호출 에러:', error)
    alert('네트워크 오류가 발생했습니다.')
    return
  }
  
  closeModal()
}

const deleteWork = async (work) => {
  // 삭제 확인 경고창 (work.name 또는 work.title 둘 다 지원)
  const workName = work.name || work.title || '이 업무'
  const confirmed = confirm(`"${workName}" 업무를 정말 삭제하시겠습니까?\n\n삭제된 업무는 복구할 수 없습니다.`)
  
  if (!confirmed) {
    return // 사용자가 취소한 경우
  }
  
  try {
    // API 호출 - PUT 방식으로 삭제
    console.log(`📡 업무 삭제 API 호출 - 업무 ID: ${work.id}`)
    
    const response = await axios.put(`http://127.0.0.1:8000/api/v1/work/delete/${work.id}`, null, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('✅ 업무 삭제 성공')
    
    // 오늘의 업무 데이터 새로고침
    await refreshTodayData()
    console.log('🔄 업무 삭제 후 오늘의 업무 데이터 새로고침 완료')
    
    // 주간업무 데이터도 새로고침 (완료된 업무가 삭제될 수 있으므로)
    await updateWeeklyData()
    console.log('🔄 업무 삭제 후 주간업무 데이터 새로고침 완료')
    
  } catch (error) {
    console.error('💥 업무 삭제 API 에러:', error)
    alert('업무 삭제 중 오류가 발생했습니다.')
  }
}

// 편집 버튼 클릭 시 편집 모드로 전환
const editCurrentWork = async () => {
  isDetailMode.value = false
  isEditMode.value = true
  
  console.log('🔍 편집 모드 - 현재 업무:', currentWork.value)
  
  // 현재 업무의 카테고리를 selectedProjectForWork에 설정
  let categoryId = null
  
  // categoryId 직접 확인
  if (currentWork.value.categoryId) {
    categoryId = currentWork.value.categoryId
  } 
  // categories 배열에서 최하위 레벨 카테고리 추출
  else if (currentWork.value.categories && currentWork.value.categories.length > 0) {
    const sortedCategories = currentWork.value.categories.sort((a, b) => b.level - a.level)
    categoryId = sortedCategories[0].category_id // 가장 높은 레벨(최하위) 카테고리
  }
  
  console.log('🎯 추출된 카테고리 ID:', categoryId)
  
  if (categoryId) {
    let category = findCategoryById(categoryId)
    console.log('🔍 찾은 카테고리:', category)
    
    if (category) {
      selectedProjectForWork.value = category
      // 선택된 카테고리까지의 경로를 모두 확장
      expandPathToCategory(categoryId)
      console.log('✅ 카테고리 선택 및 경로 확장 완료')
    } else {
      console.warn('⚠️ hierarchicalCategories에서 카테고리를 찾을 수 없음:', categoryId)
      
      // categories 배열에서 직접 카테고리 정보 가져와서 생성하고 계층에 추가
      if (currentWork.value.categories) {
        const targetCategory = currentWork.value.categories.find(cat => cat.category_id === categoryId)
        if (targetCategory) {
          console.log('✅ work.categories에서 카테고리 정보 찾음:', targetCategory)
          
          // 임시로 카테고리 객체 생성
          const tempCategory = {
            id: targetCategory.category_id,
            name: targetCategory.category_name,
            level: targetCategory.level,
            expanded: false,
            hasChildren: false,
            loaded: true,
            children: []
          }
          
          // 편집 시에만 사용할 수 있도록 hierarchicalCategories에 임시 추가
          await loadCategoryPath(currentWork.value.categories)
          
          // 다시 검색해보기
          category = findCategoryById(categoryId)
          if (category) {
            selectedProjectForWork.value = category
            expandPathToCategory(categoryId)
            console.log('✅ 경로 로드 후 카테고리 선택 완료')
          } else {
            // 여전히 찾을 수 없다면 임시 카테고리 사용
            selectedProjectForWork.value = tempCategory
            console.log('✅ 임시 카테고리 선택 완료:', tempCategory)
          }
        } else {
          console.error('❌ work.categories에서도 카테고리를 찾을 수 없음')
        }
      }
    }
  } else {
    console.warn('⚠️ 카테고리 ID가 없음')
  }
}

// 한국어 날짜 포맷팅
const formatDateKorean = (dateString) => {
  if (!dateString) return '미정'
  const date = new Date(dateString)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

// 프로젝트 계층 구조 파싱
const getProjectHierarchy = () => {
  // categories 배열이 있는 경우 (완료된 업무 등)
  if (currentWork.value.categories && currentWork.value.categories.length > 0) {
    const sortedCategories = currentWork.value.categories.sort((a, b) => a.level - b.level)
    return {
      root: sortedCategories[0]?.category_name || '',
      sub: sortedCategories[1]?.category_name || '',
      leaf: sortedCategories[2]?.category_name || ''
    }
  }
  
  // categoryId가 없는 경우
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

// 업무 데이터로부터 카테고리 계층구조 생성
const buildCategoryHierarchyFromWorks = (works) => {
  const categoryMap = new Map()
  
  // 모든 업무의 카테고리 정보를 수집
  works.forEach(work => {
    if (work.categories && work.categories.length > 0) {
      // categories 배열을 level 순으로 정렬
      const sortedCategories = work.categories.sort((a, b) => a.level - b.level)
      
      sortedCategories.forEach(category => {
        if (!categoryMap.has(category.category_id)) {
          categoryMap.set(category.category_id, {
            id: category.category_id,
            name: category.category_name,
            level: category.level,
            expanded: false,
            children: [],
            works: [] // 이 카테고리에 속한 업무들
          })
        }
        
        // 해당 카테고리에 업무 추가 (최하위 레벨에만)
        const isLowestLevel = !sortedCategories.some(c => c.level > category.level)
        if (isLowestLevel) {
          categoryMap.get(category.category_id).works.push(work)
        }
      })
    }
  })
  
  // 계층구조 구성
  const rootCategories = []
  const categories = Array.from(categoryMap.values())
  
  // level 순으로 정렬한 후 같은 레벨 내에서는 ID 순으로 정렬
  categories.sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level
    }
    return a.id - b.id
  })
  
  // 부모-자식 관계 설정
  categories.forEach(category => {
    if (category.level === 0) {
      rootCategories.push(category)
    } else {
      // 부모 카테고리 찾기
      const parentCategory = categories.find(parent => {
        // 같은 업무의 카테고리에서 level이 하나 작은 것 찾기
        return parent.level === category.level - 1 && 
               works.some(work => 
                 work.categories && 
                 work.categories.some(c => c.category_id === parent.id) &&
                 work.categories.some(c => c.category_id === category.id)
               )
      })
      
      if (parentCategory && !parentCategory.children.some(child => child.id === category.id)) {
        parentCategory.children.push(category)
      }
    }
  })
  
  return rootCategories
}

// 카테고리 동적 로딩 함수
const loadCategories = async (parentId = null, level = 0) => {
  const endpoint = level === 0 
    ? 'http://127.0.0.1:8000/api/v1/category/level0'
    : `http://127.0.0.1:8000/api/v1/category/level1/${parentId}`
  
  console.log(`📡 카테고리 로드 요청 - parentId: ${parentId}, level: ${level}, endpoint: ${endpoint}`)
  
  try {
    categoryLoadingStates.value.set(parentId || 'root', true)
    const response = await axios.get(endpoint)
    const data = response.data
    
    const mappedData = data.map(cat => ({
      id: cat.id,
      name: cat.name,
      level: level,
      parentId: cat.parent_id || null,
      expanded: false,
      children: [], // 초기에는 빈 배열
      hasChildren: cat.has_children !== false, // API에서 has_children 필드가 없으면 true로 가정
      loaded: false // 하위 카테고리 로드 여부
    }))
    
    console.log('✅ 매핑된 카테고리 데이터:', mappedData)
    return mappedData
  } catch (error) {
    console.error('💥 카테고리 로드 실패:', error)
  } finally {
    categoryLoadingStates.value.set(parentId || 'root', false)
  }
  return []
}

// 새로운 프로젝트 선택 관련 함수들
const toggleProjectExpand = async (nodeId) => {
  console.log('🔄 toggleProjectExpand 호출됨, nodeId:', nodeId)
  
  if (expandedProjectNodes.value.has(nodeId)) {
    console.log('📂 카테고리 닫기:', nodeId)
    expandedProjectNodes.value.delete(nodeId)
  } else {
    console.log('📂 카테고리 열기:', nodeId)
    expandedProjectNodes.value.add(nodeId)
    
    // 하위 카테고리를 아직 로드하지 않았다면 로드
    const category = findCategoryById(nodeId)
    console.log('🔍 찾은 카테고리:', category)
    
    if (category) {
      console.log('✅ 카테고리 상태 - loaded:', category.loaded, ', hasChildren:', category.hasChildren)
      
      if (!category.loaded && category.hasChildren) {
        console.log('📡 하위 카테고리 로드 중...', nodeId)
        const childCategories = await loadCategories(nodeId, category.level + 1)
        console.log('✅ 하위 카테고리 로드됨:', childCategories)
        category.children = childCategories
        category.loaded = true
      } else if (!category.hasChildren) {
        console.log('ℹ️ 하위 카테고리가 없음')
      } else if (category.loaded) {
        console.log('ℹ️ 이미 로드됨')
      }
    } else {
      console.error('❌ 카테고리를 찾을 수 없음:', nodeId)
    }
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

// 상태 드롭다운 관련 함수들
const toggleStatusDropdown = (workId) => {
  if (openDropdownId.value === workId) {
    openDropdownId.value = null
  } else {
    openDropdownId.value = workId
    // 드롭다운 위치 조정을 위한 nextTick 사용
    setTimeout(() => adjustDropdownPosition(workId), 10)
  }
}

// 드롭다운 위치 자동 조정 (fixed position 버전)
const adjustDropdownPosition = (workId) => {
  const statusButton = document.querySelector(`[data-work-id="${workId}"] .status-badge`)
  const dropdown = document.querySelector(`[data-work-id="${workId}"] .status-dropdown`)
  
  if (!statusButton || !dropdown) {
    // fallback: workId로 찾기
    const allDropdowns = document.querySelectorAll('.status-dropdown.show')
    if (allDropdowns.length > 0) {
      const activeDropdown = allDropdowns[0]
      const activeButton = activeDropdown.parentElement.querySelector('.status-badge')
      if (activeButton) {
        positionDropdown(activeButton, activeDropdown)
      }
    }
    return
  }
  
  positionDropdown(statusButton, dropdown)
}

const positionDropdown = (button, dropdown) => {
  const buttonRect = button.getBoundingClientRect()
  const dropdownHeight = 240 // 예상 드롭다운 높이
  const dropdownWidth = 140
  
  let top = buttonRect.bottom + 4
  let left = buttonRect.left + (buttonRect.width / 2) - (dropdownWidth / 2)
  
  // 아래쪽 공간 부족 시 위로 표시
  if (top + dropdownHeight > window.innerHeight - 20) {
    top = buttonRect.top - dropdownHeight - 4
  }
  
  // 왼쪽 경계 조정
  if (left < 20) {
    left = 20
  }
  
  // 오른쪽 경계 조정
  if (left + dropdownWidth > window.innerWidth - 20) {
    left = window.innerWidth - dropdownWidth - 20
  }
  
  dropdown.style.top = `${top}px`
  dropdown.style.left = `${left}px`
}

const changeWorkStatus = async (work, newStatus, statusClass) => {
  // 드롭다운 닫기
  openDropdownId.value = null
  
  // 현재 상태와 같으면 리턴
  if (work.status === newStatus) return
  
  // 완료로 변경할 때 확인 창 표시
  if (newStatus === '완료') {
    const confirmed = confirm(`"${work.name}" 업무를 완료하시겠습니까?\n\n완료된 업무는 오늘의 업무 목록에서 제거되고 주간 업무 표에 표시됩니다.`)
    if (!confirmed) {
      return // 사용자가 취소한 경우 함수 종료
    }
  }
  
  // 로딩 상태 설정
  work.statusLoading = true
  
  try {
    let response
    
    if (newStatus === '완료') {
      // 완료 처리용 API 호출
      console.log(`📡 업무 완료 API 호출 - 업무 ID: ${work.id}`)
      
      response = await axios.put(`http://127.0.0.1:8000/api/v1/work/end/${work.id}`, null, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } else {
      // 카테고리 ID 추출 (categories 배열에서 최하위 레벨 카테고리)
      let categoryId = work.categoryId
      if (!categoryId && work.categories && work.categories.length > 0) {
        const sortedCategories = work.categories.sort((a, b) => b.level - a.level)
        categoryId = sortedCategories[0].category_id
      }
      
      console.log('🔍 상태 변경용 카테고리 ID:', categoryId)
      console.log('🔍 업무 객체:', work)
      
      // 일반 상태 변경 API 호출
      const updateData = {
        title: work.name,
        content: work.content || null,
        user_id: 1, // 임시 사용자 ID
        category_id: categoryId,
        current_status: newStatus,
        started_at: work.startDate ? new Date(work.startDate + 'T00:00:00').toISOString() : null,
        deadline: work.endDate ? new Date(work.endDate + 'T23:59:59').toISOString() : null,
        myjob: work.isMyWork
      }
      
      console.log(`📡 상태 변경 API 호출 - 업무 ID: ${work.id}, 새 상태: ${newStatus}`)
      console.log('📋 전송 데이터:', updateData)
      console.log('📋 JSON 문자열:', JSON.stringify(updateData, null, 2))
      
      response = await axios.put(`http://127.0.0.1:8000/api/v1/work/work/${work.id}`, updateData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📡 응답 상태:', response.status)
      console.log('📡 응답 헤더:', response.headers)
    }
    
    // 성공 시 로컬 상태 업데이트
    work.status = newStatus
    console.log(`✅ 상태 변경 성공: ${work.name} → ${newStatus}`)
    
    // 완료 처리 시 주간 데이터도 업데이트
    if (newStatus === '완료') {
      await updateWeeklyData()
      console.log('🔄 주간 완료 업무 데이터 업데이트됨')
    }
  } catch (error) {
    console.error('💥 상태 변경 API 에러:', error)
    alert('네트워크 오류가 발생했습니다.')
  } finally {
    // 로딩 상태 해제
    work.statusLoading = false
  }
}

const logout = () => {
  auth.logout()
  router.push('/')
}

onMounted(async () => {
  console.log('대시보드 로드됨')
  console.log('🔍 User 객체 구조:', auth.user)
  
  // 외부 클릭 시 드롭다운 닫기
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.status-dropdown-wrapper')) {
      openDropdownId.value = null
    }
  })
  
  try {
    // 오늘의 업무 데이터 가져오기
    const response = await axios.get('http://127.0.0.1:8000/api/v1/work/today')
    const data = response.data
    
    // 데이터 매핑 및 화면 업데이트
      const mappedWorks = data.map(work => ({
        id: work.id,
        name: work.title,
        content: work.content,
        categoryId: work.category_id,
        status: work.current_status,
        startDate: work.started_at ? work.started_at.split('T')[0] : '',
        endDate: work.deadline ? work.deadline.split('T')[0] : '',
        isMyWork: work.myjob,
        categories: work.categories || [] // 새로 추가된 카테고리 정보
      }))
      
      todayWorks.value = mappedWorks
      
      // 업무들로부터 카테고리 계층구조 생성
      const categoryHierarchy = buildCategoryHierarchyFromWorks(mappedWorks)
      
      // 오늘의 업무 섹션용 카테고리 설정 (기존 hierarchicalCategories와 별도)
      todayCategoryHierarchy.value = categoryHierarchy
      
      // 카테고리별 작업 목록 초기화
      categoryWorkLists.value.clear()
      
      // 프로젝트 선택용 최상위 카테고리 로드
      const loadedCategories = await loadCategories(null, 0)
      hierarchicalCategories.value = loadedCategories
    
    // 주간 테이블용 최상위 카테고리 가져오기
    const topCategoryResponse = await axios.get('http://127.0.0.1:8000/api/v1/category/level0')
    const topCategoryData = topCategoryResponse.data
    
    // 주간 테이블용 데이터 매핑
    const mappedTopCategories = topCategoryData
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color || generateConsistentColor(cat.id) // 색상이 없으면 ID 기반 일관된 색상 생성
      }))
      .sort((a, b) => a.id - b.id) // ID 순으로 정렬하여 일관성 유지
    
    topCategories.value = mappedTopCategories // 주간 테이블 업데이트
    
    // 초기 주간 완료 업무 데이터 로드
    await updateWeeklyData()
    
  } catch (error) {
    console.error('💥 API 호출 에러:', error)
  }
})

// 프로젝트 삭제 확인 모달 열기
const confirmDeleteProject = (project) => {
  projectToDelete.value = project
  showDeleteConfirmModal.value = true
}

// 프로젝트 삭제 확인 모달 닫기
const closeDeleteConfirmModal = () => {
  showDeleteConfirmModal.value = false
  projectToDelete.value = null
}

// 프로젝트 삭제 실행
const deleteProject = async () => {
  try {
    // 하위 프로젝트가 있으면 삭제 방지
    if (projectToDelete.value.children && projectToDelete.value.children.length > 0) {
      console.warn('⚠️ 하위 프로젝트가 있어서 삭제할 수 없습니다')
      return
    }
    
    const projectId = projectToDelete.value.id
    console.log(`🗑️ 프로젝트 삭제 요청 - ID: ${projectId}`)
    
    const response = await axios.put(`http://127.0.0.1:8000/api/v1/category/delete/${projectId}`, {}, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('✅ 프로젝트 삭제 성공', response.data)
    closeDeleteConfirmModal()
    loadTopLevelProjects() // 프로젝트 목록 새로고침
  } catch (error) {
    console.error('❌ 프로젝트 삭제 실패:', error)
    
    // 하위 프로젝트 존재로 인한 삭제 실패 처리
    if (error.response && error.response.status === 400) {
      alert('하위 프로젝트가 있어서 삭제할 수 없습니다. 하위 프로젝트를 먼저 삭제해주세요.')
    } else {
      alert('프로젝트 삭제 중 오류가 발생했습니다.')
    }
  }
}
</script>

<style scoped>
/* 새로운 프로젝트 선택 스타일 */

/* 기존 스타일들 */
.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
  overflow: visible; /* 전체 컨테이너도 visible로 설정 */
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

/* 네비게이션 메뉴 스타일 */
.nav-menu {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  gap: 0;
}

.nav-item {
  background: none;
  border: none;
  padding: 1rem 2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #64748b;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  position: relative;
}

.nav-item:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.nav-item.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
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

/* 프로젝트 페이지 스타일 */
.project-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 2rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.year-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.year-btn:hover {
  background: #5a67d8;
}

.current-year {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
  min-width: 60px;
  text-align: center;
}

.project-timeline {
  margin-top: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.timeline-header {
  display: grid;
  grid-template-columns: 300px 500px 1fr;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.project-name-col {
  padding: 1rem;
  font-weight: 600;
  color: #2d3748;
  background: #edf2f7;
  border-right: 1px solid #e2e8f0;
}

.project-description-col {
  padding: 1rem;
  font-weight: 600;
  color: #2d3748;
  background: #edf2f7;
  border-right: 1px solid #e2e8f0;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
}

.month-header {
  padding: 1rem 0.25rem;
  text-align: center;
  font-weight: 500;
  color: #4a5568;
  font-size: 0.8rem;
  border-right: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-header:last-child {
  border-right: none;
}


.timeline-body {
  background: white;
}

.project-row {
  display: grid;
  grid-template-columns: 300px 500px 1fr;
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.2s;
}

.project-row:hover {
  background: #f7fafc;
  cursor: pointer;
}

.project-row.sub-project {
  background: #f8fafc;
}

.project-row.sub-project:hover {
  background: #edf2f7;
}

.project-name-cell {
  padding: 1rem;
  border-right: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

/* 프로젝트 삭제 버튼 스타일 */
.project-delete-btn {
  position: absolute;
  right: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 16px;
  color: #ff4757;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.9), -1px -1px 2px rgba(255, 255, 255, 0.9);
}

.project-delete-btn:hover {
  color: #ff3742;
  transform: scale(1.2);
  text-shadow: 1px 1px 3px rgba(255, 255, 255, 1), -1px -1px 3px rgba(255, 255, 255, 1);
}

.project-row:hover .project-delete-btn {
  opacity: 1;
}

.project-description-cell {
  padding: 1rem;
  border-right: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-start;
  max-height: 200px;
  overflow-y: auto;
}

/* 설명 칸 커스텀 스크롤바 - 투명하고 호버시에만 표시 */
.project-description-cell::-webkit-scrollbar {
  width: 6px;
}

.project-description-cell::-webkit-scrollbar-track {
  background: transparent;
}

.project-description-cell::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.project-description-cell:hover::-webkit-scrollbar-thumb {
  background: rgba(160, 174, 192, 0.6);
}

.project-description-cell::-webkit-scrollbar-thumb:hover {
  background: rgba(160, 174, 192, 0.8);
}

.hierarchy-indicator {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.hierarchy-indicator.level-0 {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: 2px solid #667eea;
}

.hierarchy-indicator.level-1 {
  background: transparent;
  border: 2px solid #48bb78;
  margin-left: 20px;
}

.hierarchy-indicator.level-2 {
  background: transparent;
  border: 2px solid #ed8936;
  margin-left: 40px;
}

.hierarchy-indicator.level-3 {
  background: transparent;
  border: 2px solid #e53e3e;
  margin-left: 60px;
}

/* 카테고리 인디케이터 래퍼 */
.category-indicator-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 1rem;
}

/* 프로젝트 상세 모달 스타일 */
.project-detail-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.project-detail-content {
  background: white;
  padding: 2rem;
}

.project-info-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.project-info-item:hover {
  background: #f7fafc;
  border-color: #667eea;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.1);
}

.project-info-label {
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.05), transparent);
  border-left: 3px solid #667eea;
  padding-left: 0.75rem;
  border-radius: 0 4px 4px 0;
}

.label-icon {
  font-size: 1.1rem;
  opacity: 0.8;
  transition: all 0.2s ease;
  transform: scale(1);
}

.project-info-item:hover .label-icon {
  opacity: 1;
  transform: scale(1.1);
}

.label-text {
  flex: 1;
}

.project-info-content {
  color: #2d3748;
  font-weight: 500;
}

.sub-projects-section {
  margin-top: 1.5rem;
}

.sub-projects-count {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: auto;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.info-header,
.description-header,
.sub-projects-header {
  background: transparent;
  color: #2d3748;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-icon {
  font-size: 1.2rem;
  opacity: 0.9;
}

.info-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.count-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}



.period-value {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.date-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
  transition: all 0.2s ease;
}

.date-badge:hover {
  background: linear-gradient(135deg, #764ba2, #667eea);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.date-separator {
  color: #718096;
  font-weight: 600;
}

.description-content {
  padding: 1.5rem;
}

.project-detail-description {
  white-space: pre-line;
  line-height: 1.7;
  color: #4a5568;
  font-size: 0.95rem;
  background: transparent;
  padding: 0;
  border-radius: 0;
  margin: 0;
}

.sub-projects-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  padding-left: 1rem;
}

.sub-project-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sub-project-item:hover {
  background: #f7fafc;
  border-color: #667eea;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.1);
}

.sub-project-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.sub-project-name {
  font-weight: 600;
  color: #2d3748;
  flex: 1;
}

.sub-project-period {
  font-size: 0.85rem;
  color: #718096;
  background: #edf2f7;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.sub-project-description {
  color: #4a5568;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-left: 1.75rem;
}

.project-name {
  font-weight: 600;
  color: #2d3748;
  font-size: 1rem;
  line-height: 1.3;
}

.sub-project .project-name {
  font-size: 0.9rem;
  color: #4a5568;
}

.project-description {
  color: #4a5568;
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre-line;
  word-wrap: break-word;
  flex: 1;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.timeline-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  align-items: center;
  position: relative;
}

.timeline-grid::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-image: repeating-linear-gradient(
    to right,
    transparent 0,
    transparent calc(100% / 12 - 1px),
    #e2e8f0 calc(100% / 12 - 1px),
    #e2e8f0 calc(100% / 12)
  );
  pointer-events: none;
  z-index: 0;
}

.timeline-cell {
  padding: 0;
  min-height: 50px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: visible;
}

.project-bar {
  border-radius: 6px;
  margin: 0;
  position: relative;
  z-index: 1;
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
  overflow: visible; /* 드롭다운이 잘리지 않도록 */
}

.work-table {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: visible; /* 기존 hidden에서 visible로 변경 */
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

/* 마감일 상태별 스타일 */
.table-row.overdue {
  background: #fff5f5 !important; /* 연한 빨간색 배경 */
  box-shadow: inset 4px 0 0 #f56565; /* 왼쪽 빨간색 테두리 (box-shadow로 변경) */
}

.table-row.overdue:hover {
  background: #fed7d7 !important; /* 호버 시 더 진한 빨간색 */
}

.table-row.due-today {
  background: #fffbf0 !important; /* 연한 주황색 배경 */
  box-shadow: inset 4px 0 0 #ed8936; /* 왼쪽 주황색 테두리 (box-shadow로 변경) */
}

.table-row.due-today:hover {
  background: #feebc8 !important; /* 호버 시 더 진한 주황색 */
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

.work-name-cell {
  justify-content: flex-start !important;
  text-align: left !important;
  cursor: pointer;
  transition: all 0.2s;
}

.work-name-cell:hover {
  color: #667eea;
  font-weight: 600;
  background: rgba(102, 126, 234, 0.05);
}

/* 상태 드롭다운 스타일 */
.status-cell {
  position: relative;
  padding: 0.5rem !important;
}

.status-dropdown-wrapper {
  position: relative;
  width: 100%;
}

.status-badge {
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  width: 100%;
  text-align: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.status-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

/* 삼각형 화살표 제거 */
/* .status-badge::after {
  content: '▼';
  font-size: 0.7rem;
  opacity: 0.7;
} */

.status-badge.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.status-badge.loading::after {
  content: '⟳';
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 드롭다운 메뉴 - fixed position으로 변경 */
.status-dropdown {
  position: fixed;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 140px;
  max-width: 200px;
}

.status-dropdown.show {
  opacity: 1;
  visibility: visible;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #f8f9ff;
}

.dropdown-item.selected {
  background: #667eea;
  color: white;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.todo { background: #ed8936; }
.status-dot.progress { background: #4299e1; }
.status-dot.review { background: #9f7aea; }
.status-dot.rejected { background: #f56565; }
.status-dot.completed { background: #48bb78; }
/* 모달 전용 상태 배지 - 테이블 상태와 분리 */
.modal-status-badge {
  padding: 6px 16px !important;
  border-radius: 20px !important;
  font-size: 0.85rem !important;
  font-weight: 600 !important;
  color: white !important;
  cursor: default !important; /* 클릭 불가능 */
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  width: auto !important; /* 전체 너비 사용 안함 */
  text-align: center !important;
  justify-content: center !important;
  border: none !important;
  transform: none !important; /* 호버 효과 제거 */
  box-shadow: none !important; /* 호버 그림자 제거 */
}

.modal-status-badge:hover {
  transform: none !important; /* 호버 시 변화 없음 */
  box-shadow: none !important;
  cursor: default !important;
}

.modal-status-badge::after {
  display: none !important; /* 화살표 숨김 */
}

.modal-status-badge.loading::after {
  display: none !important; /* 로딩 아이콘도 숨김 */
}

/* 테이블용 상태 배지는 기존 스타일 유지 */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
}

.status-todo { background: linear-gradient(135deg, #ed8936, #dd6b20); }        /* 예정 - 주황색 */
.status-progress { background: linear-gradient(135deg, #4299e1, #3182ce); }    /* 진행중 - 파란색 */
.status-review { background: linear-gradient(135deg, #9f7aea, #805ad5); }      /* 검토중 - 보라색 */
.status-rejected { background: linear-gradient(135deg, #f56565, #e53e3e); }    /* 반려 - 빨간색 */
.status-completed { background: linear-gradient(135deg, #48bb78, #38a169); }   /* 완료 - 녹색 */
.status-cancelled { background: linear-gradient(135deg, #a0aec0, #718096); }   /* 취소 - 회색 */
.status-default { background: linear-gradient(135deg, #cbd5e0, #a0aec0); }     /* 기본 - 연회색 */

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
  width: 100%;
  table-layout: fixed; /* 고정 레이아웃으로 컬럼 너비 일정하게 유지 */
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
  padding: 0.5rem;
  border-right: 1px solid #e1e5e9;
  min-height: 80px;
  cursor: pointer;
  transition: background 0.2s;
  background: white;
  overflow: hidden; /* 셀 내용이 넘치지 않도록 */
  display: flex;
  flex-direction: column;
  gap: 2px;
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

/* 완료 업무 태그 스타일 */
.completed-work-tag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  margin: 1px 0;
  border-radius: 10px;
  font-size: 0.7rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 22px; /* 더 작은 고정 높이 */
  width: 100%; /* 셀 너비에 맞춤 */
  overflow: hidden; /* 넘치는 내용 숨기기 */
  box-sizing: border-box; /* 패딩 포함하여 크기 계산 */
}

.completed-work-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  filter: brightness(1.1);
}

.work-tag-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
  font-weight: 500;
  min-width: 0; /* flexbox에서 텍스트가 줄어들 수 있도록 */
  line-height: 1.2; /* 줄 높이 고정 */
}

.work-tag-time {
  font-size: 0.7rem;
  opacity: 0.9;
  flex-shrink: 0; /* "완료" 텍스트가 줄어들지 않도록 */
  white-space: nowrap; /* 줄 바꿈 방지 */
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 400;
  min-width: fit-content;
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

/* 날짜 입력 그룹 스타일 */
.date-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input {
  flex: 1;
  min-width: 0;
}

/* 삭제 확인 모달 스타일 */
.delete-confirm-modal {
  max-width: 400px;
}

.delete-warning {
  text-align: center;
}

.project-to-delete {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-size: 1.1rem;
}

.warning-text {
  color: #ef4444;
  font-weight: 600;
  margin: 0.5rem 0;
}

.error-text {
  color: #ef4444;
  font-weight: 600;
  margin: 0.5rem 0;
}

.info-text {
  color: #3b82f6;
  font-weight: 500;
  margin: 0.5rem 0;
}

.sub-warning {
  color: #f59e0b;
  font-weight: 500;
  margin: 0.5rem 0;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* 비활성화된 form 요소 */
.form-select.disabled,
.form-select:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #dee2e6;
}

/* 상태 변경 불가 안내 메시지 */
.status-notice,
.completion-notice {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* 드래그 앤 드롭 스타일 */
.draggable-item {
  cursor: move;
  transition: all 0.3s ease;
}

.draggable-item:hover {
  background-color: #f8f9ff !important;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.drag-handle {
  margin-left: 8px;
  color: #bbb;
  cursor: grab;
  font-weight: bold;
  user-select: none;
}

.drag-handle:hover {
  color: #667eea;
}

.drag-handle:active {
  cursor: grabbing;
}

/* 드래그 중인 요소 */
.sortable-ghost {
  opacity: 0.5;
  background-color: #667eea !important;
  color: white;
}

.sortable-drag {
  background-color: #667eea !important;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transform: rotate(5deg);
}

/* 드롭 영역 표시 */
.sortable-chosen {
  background-color: #f0f4ff !important;
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

/* 반응형 전 추가 설정 */
.dashboard {
  overflow: visible !important;
}

.dashboard-main {
  overflow: visible !important;
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

/* 내 업무 삭제 버튼 스타일 */
.my-work-cell {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.delete-btn {
  display: none;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: #ff6b7a;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(255, 107, 122, 0.2);
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: #ff4757;
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 4px 8px rgba(255, 107, 122, 0.3);
}

/* SVG 아이콘 사용으로 ::before 불필요 */

/* 주간업무 태그 삭제 버튼 스타일 */
.completed-work-tag {
  position: relative;
}

.tag-delete-btn {
  display: none;
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #ff4757;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 15;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.9), -1px -1px 2px rgba(255, 255, 255, 0.9);
  align-items: center;
  justify-content: center;
}

.tag-delete-btn:hover {
  color: #ff3742;
  transform: scale(1.3);
  text-shadow: 1px 1px 3px rgba(255, 255, 255, 1), -1px -1px 3px rgba(255, 255, 255, 1);
}

.completed-work-tag:hover .tag-delete-btn {
  display: flex;
}

.my-work-cell:hover .delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-row:hover .my-work-cell .delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>