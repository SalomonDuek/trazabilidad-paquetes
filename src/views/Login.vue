<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const handleLogin = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    
    // Llamada nativa a la API de Supabase para autenticación
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    
    if (error) throw error
    
    // Si el login es exitoso, redirige al tablero del depósito
    router.push('/dashboard')
  } catch (error) {
    // Supabase devuelve el mensaje de error si las credenciales son inválidas
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="max-width: 400px; margin: 50px auto; padding: 20px; font-family: sans-serif;">
    <h2>Ingreso al Sistema</h2>
    
    <!-- El modificador .prevent evita que la página se recargue al enviar el formulario -->
    <form @submit.prevent="handleLogin" style="display: flex; flex-direction: column; gap: 15px;">
      <div>
        <label style="display: block; margin-bottom: 5px;">Email</label>
        <input type="email" v-model="email" required style="width: 100%; padding: 8px;" />
      </div>
      
      <div>
        <label style="display: block; margin-bottom: 5px;">Contraseña</label>
        <input type="password" v-model="password" required style="width: 100%; padding: 8px;" />
      </div>
      
      <button type="submit" :disabled="loading" style="padding: 10px; background: #2c3e50; color: white; border: none; cursor: pointer;">
        {{ loading ? 'Validando credenciales...' : 'Ingresar' }}
      </button>
      
      <p v-if="errorMessage" style="color: #e74c3c; font-weight: bold;">
        {{ errorMessage }}
      </p>
    </form>
  </div>
</template>