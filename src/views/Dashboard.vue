<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const pedidos = ref([])
const loading = ref(true)
const error = ref('')

// Obtenemos los pedidos al montar el componente
const fetchPedidos = async () => {
  try {
    loading.value = true
    // Traemos todos los pedidos que no estén cancelados ni despachados (archivos históricos)
    const { data, error: fetchError } = await supabase
      .from('pedidos')
      .select('*')
      .neq('estado', 'cancelado').neq('estado', 'despachado')
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError
    pedidos.value = data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Clasificamos los pedidos en memoria para los estantes
const estanteArmado = computed(() => pedidos.value.filter(p => p.estado === 'pendiente' || p.estado === 'en_armado'))
const estanteControl = computed(() => pedidos.value.filter(p => p.estado === 'para_control'))
const estanteFacturacion = computed(() => pedidos.value.filter(p => p.estado === 'para_facturar'))
const estanteDespacho = computed(() => pedidos.value.filter(p => p.estado === 'para_despacho'))

onMounted(() => {
  fetchPedidos()
})
</script>

<template>
  <div class="dashboard-container">
    <header class="header">
      <h2>Tablero de Depósito (Estantes)</h2>
      <button @click="fetchPedidos" class="btn-refresh">Actualizar</button>
    </header>

    <div v-if="loading" class="loading">Cargando paquetes...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div class="kanban-board" v-if="!loading && !error">
      
      <!-- Estante 1: Armado -->
      <div class="estante">
        <h3>Zona Armado ({{ estanteArmado.length }})</h3>
        <div v-for="pedido in estanteArmado" :key="pedido.id" class="tarjeta-pedido">
          <strong>{{ pedido.tienda_nube_id }}</strong>
          <span>{{ pedido.cliente_nombre }}</span>
          <span class="estado-badge">{{ pedido.estado.replace('_', ' ').toUpperCase() }}</span>
        </div>
      </div>

      <!-- Estante 2: Control -->
      <div class="estante">
        <h3>Mesa Control ({{ estanteControl.length }})</h3>
        <div v-for="pedido in estanteControl" :key="pedido.id" class="tarjeta-pedido">
          <strong>{{ pedido.tienda_nube_id }}</strong>
          <span>{{ pedido.cliente_nombre }}</span>
        </div>
      </div>

      <!-- Estante 3: Facturación -->
      <div class="estante">
        <h3>Facturación ({{ estanteFacturacion.length }})</h3>
        <div v-for="pedido in estanteFacturacion" :key="pedido.id" class="tarjeta-pedido">
          <strong>{{ pedido.tienda_nube_id }}</strong>
          <span>{{ pedido.cliente_nombre }}</span>
        </div>
      </div>

      <!-- Estante 4: Despacho -->
      <div class="estante">
        <h3>Despacho ({{ estanteDespacho.length }})</h3>
        <div v-for="pedido in estanteDespacho" :key="pedido.id" class="tarjeta-pedido">
          <strong>{{ pedido.tienda_nube_id }}</strong>
          <span>{{ pedido.cliente_nombre }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* CSS Grid para estructurar los 4 estantes lado a lado */
.dashboard-container {
  padding: 20px;
  font-family: sans-serif;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.kanban-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
.estante {
  background-color: #f4f6f8;
  border-radius: 8px;
  padding: 15px;
  min-height: 70vh;
}
.estante h3 {
  margin-top: 0;
  font-size: 1.1rem;
  color: #2c3e50;
  border-bottom: 2px solid #bdc3c7;
  padding-bottom: 10px;
}
.tarjeta-pedido {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.estado-badge {
  font-size: 0.8rem;
  background: #3498db;
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  align-self: flex-start;
}
.btn-refresh {
  padding: 8px 16px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>