import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import DataBindingView from '@/views/DataBindingView.vue'
import ConditionView from '@/views/ConditionView.vue'
import EventView from '@/views/EventView.vue'
import FormView from '@/views/FormView.vue'
import ComponentsView from '@/views/ComponentsView.vue'
import ReactiveView from '@/views/ReactiveView.vue'
import PatternView from '@/views/PatternView.vue'
import ProtoView from '@/views/ProtoView.vue'
import OrgView from '@/views/OrgView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/data-binding', name: 'dataBinding', component: DataBindingView },
    { path: '/condition', name: 'condition', component: ConditionView },
    { path: '/event', name: 'event', component: EventView },
    { path: '/form', name: 'form', component: FormView },
    { path: '/components', name: 'components', component: ComponentsView },
    { path: '/reactive', name: 'reactive', component: ReactiveView },
    { path: '/pattern', name: 'pattern', component: PatternView },
    { path: '/proto', name: 'proto', component: ProtoView },
    { path: '/org', name: 'org', component: OrgView },
  ],
})

export default router
