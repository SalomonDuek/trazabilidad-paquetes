import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import { supabase } from '../lib/supabase'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true } // Marcamos esta ruta como protegida
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Interceptor de rutas (Navigation Guard)
router.beforeEach(async (to, from, next) => {
  // Si la ruta a la que quiere ir está protegida...
  if (to.meta.requiresAuth) {
    // Consultamos a Supabase si hay una sesión activa en el navegador
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      next() // Tiene token, lo dejamos pasar
    } else {
      next('/') // No tiene token, lo pateamos al Login
    }
  } else {
    next() // Es una ruta pública (como el Login), lo dejamos pasar
  }
})

export default router