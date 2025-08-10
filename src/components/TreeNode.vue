<template>
  <div class="tree-node">
    <div 
      :class="['node-content', { 'selected': selectedProject?.id === node.id }]"
      :style="{ paddingLeft: (node.level * 20 + 16) + 'px' }"
    >
      <!-- 확장/축소 버튼 -->
      <button 
        v-if="hasChildren"
        :class="['expand-btn', { 'expanded': expandedNodes.has(node.id) }]"
        @click.stop="$emit('toggle-expand', node.id)"
      >
        ▶
      </button>
      <span v-else class="leaf-spacer"></span>
      
      <!-- 체크박스 -->
      <input
        type="checkbox"
        :checked="selectedProject?.id === node.id"
        @change="handleSelect"
        class="node-checkbox"
      />
      
      <!-- 프로젝트 이름 -->
      <span 
        class="node-name"
        @click="handleSelect"
      >
        {{ node.name }}
      </span>
    </div>
    
    <!-- 자식 노드들 -->
    <div v-if="hasChildren && expandedNodes.has(node.id)" class="children-container">
      <TreeNode 
        v-for="child in node.children"
        :key="child.id" 
        :node="child"
        :expanded-nodes="expandedNodes"
        :selected-project="selectedProject"
        @toggle-expand="$emit('toggle-expand', $event)"
        @select-project="$emit('select-project', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  expandedNodes: {
    type: Set,
    required: true
  },
  selectedProject: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['toggle-expand', 'select-project'])

// Computed
const hasChildren = computed(() => {
  // 동적 로딩을 위해 hasChildren 속성을 우선 확인
  if (props.node.hasChildren !== undefined) {
    return props.node.hasChildren
  }
  // 기존 로직도 유지 (하위 호환성)
  return props.node.children && props.node.children.length > 0
})

// Methods
const handleSelect = () => {
  if (props.selectedProject?.id === props.node.id) {
    emit('select-project', null)
  } else {
    emit('select-project', props.node)
  }
}
</script>

<style scoped>
.tree-node {
  border-bottom: 1px solid #f1f3f4;
}

.tree-node:last-child {
  border-bottom: none;
}

.node-content {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  background: white;
}

.node-content:hover {
  background: #f8f9ff;
}

.node-content.selected {
  background: #667eea;
  color: white;
}

.expand-btn {
  background: none;
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem;
  margin-right: 0.5rem;
  border-radius: 3px;
  transition: all 0.2s;
  color: #667eea;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.expand-btn.expanded {
  transform: rotate(90deg);
}

.leaf-spacer {
  width: 20px;
  margin-right: 0.5rem;
}

.node-checkbox {
  width: 18px;
  height: 18px;
  margin-right: 0.75rem;
  accent-color: #667eea;
  cursor: pointer;
}

.node-content.selected .node-checkbox {
  accent-color: white;
}

.node-name {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
}

.children-container {
  background: #f8f9fa;
}
</style>
