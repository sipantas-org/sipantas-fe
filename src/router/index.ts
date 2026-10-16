import { createRouter, createWebHistory } from 'vue-router'
import { ROLES, applyTheme, isRole } from '@/lib/theme'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/lib/theme'

declare module 'vue-router' {
  interface RouteMeta {
    role?: Role
    title?: string
    requiresAuth?: boolean
    roles?: readonly Role[]
  }
}

const DEFAULT_LOGIN_ROLE = 'admin'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: `/login/:role(${ROLES.join('|')})`,
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { role: 'surveyor' },
    },
    {
      path: '/app',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      redirect: { name: 'dashboard' },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: 'Dashboard' },
        },
        {
          path: 'master/a',
          name: 'master-a',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Master A', roles: ['admin'] },
        },
        {
          path: 'master/b',
          name: 'master-b',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Master B', roles: ['admin'] },
        },
        {
          path: 'surveyors',
          name: 'surveyors',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Data Surveyor', roles: ['admin'] },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Profil' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'login', params: { role: DEFAULT_LOGIN_ROLE } },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.role)
    return { name: 'login', params: { role: DEFAULT_LOGIN_ROLE } }

  if ((to.name === 'login' || to.name === 'register') && auth.role)
    return { name: 'dashboard' }

  if (to.meta.roles && auth.role && !to.meta.roles.includes(auth.role))
    return { name: 'dashboard' }

  const role = to.params.role ?? to.meta.role ?? (to.meta.requiresAuth ? auth.role : null)
  applyTheme(typeof role === 'string' && isRole(role) ? role : null)
})

export default router
