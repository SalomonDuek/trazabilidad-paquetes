<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { QrcodeStream } from 'vue-qrcode-reader'

const pedidos = ref([])
const loading = ref(true)
const error = ref('')

// Variables para el escáner
const mostrarEscaner = ref(false)
const errorEscaner = ref('')

// Funciones para el escáner
const onDetect = (detectedCodes) => {
  if (detectedCodes.length > 0) {
    const codigoLeido = detectedCodes[0].rawValue // Captura el texto del código de barras/QR
    mostrarEscaner.value = false
    procesarCodigoEscaneado(codigoLeido)
  }
}

const procesarCodigoEscaneado = (codigo) => {
  // Buscamos el pedido en la memoria (los que están actualmente en el tablero)
  const pedido = pedidos.value.find(p => p.tienda_nube_id === codigo)
  
  if (pedido) {
    // Si lo encuentra, usamos un confirm nativo para avanzar de estado
    const confirmar = confirm(`Paquete: ${codigo}\nCliente: ${pedido.cliente_nombre}\nEstado: ${pedido.estado.toUpperCase()}\n\n¿Quieres avanzar este paquete al siguiente estado?`)
    if (confirmar) {
      let siguienteEstado = ''
      if (pedido.estado === 'pendiente' || pedido.estado === 'en_armado') siguienteEstado = 'para_control'
      else if (pedido.estado === 'para_control') siguienteEstado = 'para_facturar'
      else if (pedido.estado === 'para_facturar') siguienteEstado = 'para_despacho'
      else if (pedido.estado === 'para_despacho') siguienteEstado = 'despachado'
      
      if (siguienteEstado) cambiarEstado(pedido.id, siguienteEstado)
    }
  } else {
    alert(`El pedido ${codigo} no está activo en el tablero. Puede estar despachado, cancelado o mal tipeado.`)
  }
}

const onInitError = (err) => {
  if (err.name === 'NotAllowedError') errorEscaner.value = 'Debes dar permiso para usar la cámara.'
  else if (err.name === 'NotFoundError') errorEscaner.value = 'No se detectó ninguna cámara en el dispositivo.'
  else errorEscaner.value = 'Error al iniciar la cámara: ' + err.message
}

// Obtenemos los pedidos al montar el componente
const fetchPedidos = async () => {
  try {
    loading.value = true
    const { data, error: fetchError } = await supabase
      .from('pedidos')
      .select('*')
      .neq('estado', 'cancelado')
      .neq('estado', 'despachado')
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError
    pedidos.value = data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Función para avanzar (o retroceder) el estado del paquete
const cambiarEstado = async (id, nuevoEstado) => {
  try {
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', id)

    if (updateError) throw updateError
    
    await fetchPedidos()
  } catch (err) {
    alert('Error al cambiar el estado: ' + err.message)
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
      <div>
        <button @click="mostrarEscaner = true" class="btn-scan">📷 Escanear</button>
        <button @click="fetchPedidos" class="btn-refresh" style="margin-left: 10px;">Actualizar</button>
      </div>
    </header>

    <!-- Modal del escáner -->
    <div v-if="mostrarEscaner" class="modal-escaner">
      <div class="modal-contenido">
        <h3>Escaneando paquete...</h3>
        <p v-if="errorEscaner" class="error">{{ errorEscaner }}</p>
        
        <qrcode-stream 
          v-if="!errorEscaner"
          @detect="onDetect" 
          @error="onInitError"
          :formats="['qr_code', 'code_128', 'ean_13']"
        ></qrcode-stream>
        
        <button @click="mostrarEscaner = false" class="btn-cerrar">Cerrar Cámara</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Cargando paquetes...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div class="kanban-board" v-if="!loading && !error">
      
      <!-- Estante 1: Armado -->
      <div class="estante">
        <h3>Zona Armado ({{ estanteArmado.length }})</h3>
        <div v-for="pedido in estanteArmado" :key="pedido.id" class="tarjeta-pedido">
          <strong>{{ pedido.tienda_nube_id }}</strong>
          <span>{{ pedido.cliente_nombre }}</span>
          <button @click="cambiarEstado(pedido.id, 'para_control')" class="btn-accion btn-armado">
            Mandar a Control
          </button>
        </div>
      </div>

      <!-- Estante 2: Control -->
      <div class="estante">
        <h3>Mesa Control ({{ estanteControl.length }})</h3>
        <div v-for="pedido in estanteControl" :key="pedido.id" class="tarjeta-pedido">
          <strong>{{ pedido.tienda_nube_id }}</strong>
          <span>{{ pedido.cliente_nombre }}</span>
          <button @click="cambiarEstado(pedido.id, 'para_facturar')" class="btn-accion btn-control">
            Control OK (A Facturar)
          </button>
          <button @click="cambiarEstado(pedido.id, 'en_armado')" class="btn-accion btn-rechazo">
            Falta prenda (Rechazar)
          </button>
        </div>
      </div>

      <!-- Estante 3: Facturación -->
      <div class="estante">
        <h3>Facturación ({{ estanteFacturacion.length }})</h3>
        <div v-for="pedido in estanteFacturacion" :key="pedido.id" class="tarjeta-pedido">
          <strong>{{ pedido.tienda_nube_id }}</strong>
          <span>{{ pedido.cliente_nombre }}</span>
          <button @click="cambiarEstado(pedido.id, 'para_despacho')" class="btn-accion btn-facturar">
            Marcar Facturado
          </button>
        </div>
      </div>

      <!-- Estante 4: Despacho -->
      <div class="estante">
        <h3>Despacho ({{ estanteDespacho.length }})</h3>
        <div v-for="pedido in estanteDespacho" :key="pedido.id" class="tarjeta-pedido">
          <strong>{{ pedido.tienda_nube_id }}</strong>
          <span>Envío: {{ pedido.metodo_envio.replace('_', ' ').toUpperCase() }}</span>
          <button @click="cambiarEstado(pedido.id, 'despachado')" class="btn-accion btn-despacho">
            Entregar a Logística
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
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
.btn-refresh {
  padding: 8px 16px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-accion {
  margin-top: 10px;
  padding: 8px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-weight: bold;
}
.btn-armado { background-color: #f39c12; }
.btn-control { background-color: #3498db; }
.btn-rechazo { background-color: #e74c3c; margin-top: 5px; }
.btn-facturar { background-color: #9b59b6; }
.btn-despacho { background-color: #2ecc71; }

/* Estilos nuevos para el Escáner */
.btn-scan {
  padding: 8px 16px;
  background: #34495e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.modal-escaner {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.9);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-contenido {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  text-align: center;
}
.btn-cerrar {
  margin-top: 15px;
  padding: 10px 20px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}
</style>