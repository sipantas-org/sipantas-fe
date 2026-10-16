import { createRouter, createWebHistory } from 'vue-router'
import { ROLES, applyTheme, isRole } from '@/lib/theme'
import type { Role } from '@/lib/theme'

declare module 'vue-router' {
  interface RouteMeta {
    role?: Role
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
      path: '/:pathMatch(.*)*',
      redirect: { name: 'login', params: { role: DEFAULT_LOGIN_ROLE } },
    },
  ],
})

router.beforeEach((to) => {
  const role = to.params.role ?? to.meta.role
  applyTheme(typeof role === 'string' && isRole(role) ? role : null)
})

export default router
