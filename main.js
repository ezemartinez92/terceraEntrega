//Arranco tomando los datos del JSON
fetch("./zapatos.json")
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: No se pudo cargar zapatos.json`);
    }

    return response.json().catch(() => {
      throw new Error("El archivo zapatos.json tiene un formato inválido.");
    });
  })
  .then(zapatos => {
    try {
      console.log("JSON cargado:", zapatos); //Aca ya entré

      // Selectores del DOM
      const seccionProductos = document.getElementById("seccionProductos");
      const listaCarrito = document.getElementById("listaCarrito");
      const seccionTotal = document.getElementById("totalCarrito");
      const botonVaciar = document.getElementById("btnVaciarCarrito");
      const btnPagar = document.getElementById("btnPagar");
      const contadorCarrito = document.getElementById("contadorCarrito");
      const buscador = document.getElementById("buscador");
      const ordenSelect = document.getElementById("ordenSelect");
      const modoOscuroBtn = document.getElementById("modoOscuroBtn");

      const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
      const checkoutForm = document.getElementById('checkoutForm');
      const checkoutResumen = document.getElementById('checkoutResumen');
      const metodoPago = document.getElementById('metodoPago');
      const detallesPago = document.getElementById('detallesPago');

      // Carrito en localStorage
      let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

      let productosVisibles = [...zapatos];

      // Inicialización
      renderProductos(productosVisibles);
      renderCarrito();
      inicializarModoOscuro();
      activarEventosPrincipales();

      // Render productos
      function renderProductos(productos) {
        seccionProductos.innerHTML = "";
        if (productos.length === 0) {
          seccionProductos.innerHTML = `<div class="col-12"><p class="text-muted">No se encontraron productos.</p></div>`;
          return;
        }
        productos.forEach(zapato => {
          const col = document.createElement('div');
          col.className = "col-sm-6 col-md-6 col-lg-6 col-xl-6";

          col.innerHTML = `
        <article class="product-card">
          <img class="product-img" src="${zapato.imagen}" alt="${escapeHtml(zapato.nombre)}" />
          <div class="product-meta">
            <h3 class="product-title">${escapeHtml(zapato.nombre)}</h3>
            <p class="product-desc">${escapeHtml(zapato.descripcion)}</p>
          </div>
          <div class="product-bottom">
            <div>
              <div class="price">$${numeroConComa(zapato.precio)}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <input type="number" min="1" value="1" class="form-control form-control-sm qty-input" style="width:84px;" data-id="${zapato.id}">
              <button class="btn btn-sm btn-primary btn-add" data-id="${zapato.id}">
                <i class="bi bi-cart-plus"></i> Agregar
              </button>
            </div>
          </div>
        </article>
      `;
          seccionProductos.appendChild(col);

          const btnAgregar = col.querySelector('.btn-add');
          const qtyInput = col.querySelector('.qty-input');

          btnAgregar.addEventListener('click', () => {
            const qty = Math.max(1, parseInt(qtyInput.value || 1));
            agregarAlCarritoPorId(zapato.id, qty);
          });
        });
      }

      // Agregar al carrito
      function agregarAlCarritoPorId(id, cantidad = 1) {
        const producto = zapatos.find(p => p.id === id);
        if (!producto) return;

        const existente = carrito.find(item => item.id === id);
        if (existente) {
          existente.cantidad += cantidad;
        } else {
          carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad
          });
        }

        localStorage.setItem('carrito', JSON.stringify(carrito));
        renderCarrito();
        mostrarToast(`${producto.nombre} agregado al carrito (${cantidad})`);
      }

      // Render carrito
      function renderCarrito() {
        listaCarrito.innerHTML = "";

        if (carrito.length === 0) {
          listaCarrito.innerHTML = `<p class="text-muted">Tu carrito está vacío.</p>`;
          seccionTotal.innerHTML = "";
          contadorCarrito.textContent = "0";
          return;
        }

        carrito.forEach((item, index) => {
          const div = document.createElement('div');
          div.className = "item-carrito";

          div.innerHTML = `
          <div>
            <div class="nombre">${escapeHtml(item.nombre)}</div>
            <div class="text-muted small">Precio unitario: $${numeroConComa(item.precio)}</div>
          </div>

          <div class="cantidad-control">
            <button class="qty-btn btn-decrease" data-index="${index}" title="Disminuir"><i class="bi bi-dash"></i></button>
            <div class="qty-num">${item.cantidad}</div>
            <button class="qty-btn btn-increase" data-index="${index}" title="Aumentar"><i class="bi bi-plus"></i></button>
            <button class="qty-btn btn-remove text-danger ms-2" data-index="${index}" title="Eliminar"><i class="bi bi-trash"></i></button>
          </div>
        `;
          listaCarrito.appendChild(div);
        });

        document.querySelectorAll('.btn-decrease').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = Number(e.currentTarget.getAttribute('data-index'));
            cambiarCantidad(idx, carrito[idx].cantidad - 1);
          });
        });
        document.querySelectorAll('.btn-increase').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = Number(e.currentTarget.getAttribute('data-index'));
            cambiarCantidad(idx, carrito[idx].cantidad + 1);
          });
        });
        document.querySelectorAll('.btn-remove').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = Number(e.currentTarget.getAttribute('data-index'));
            eliminarProducto(idx);
          });
        });

        renderTotal();
        contadorCarrito.textContent = carrito.reduce((s, it) => s + it.cantidad, 0);
      }

      function cambiarCantidad(index, nuevaCantidad) {
        if (nuevaCantidad <= 0) {
          Swal.fire({
            title: 'Eliminar producto?',
            text: 'La cantidad es 0. ¿Deseas eliminarlo?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
          }).then(result => {
            if (result.isConfirmed) eliminarProducto(index);
          });
          return;
        }
        carrito[index].cantidad = nuevaCantidad;
        localStorage.setItem('carrito', JSON.stringify(carrito));
        renderCarrito();
      }

      function eliminarProducto(index) {
        const prod = carrito[index];
        carrito.splice(index, 1);
        localStorage.setItem('carrito', JSON.stringify(carrito));
        renderCarrito();
        mostrarToast(`${prod.nombre} eliminado`, 'info');
      }

      // Vaciar carrito
      botonVaciar.addEventListener('click', () => {
        if (carrito.length === 0) {
          mostrarToast('El carrito ya está vacío', 'info');
          return;
        }

        Swal.fire({
          title: 'Vaciar carrito',
          text: '¿Estás seguro?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, vaciar',
          cancelButtonText: 'Cancelar'
        }).then(result => {
          if (result.isConfirmed) {
            carrito = [];
            localStorage.removeItem('carrito');
            renderCarrito();
            mostrarToast('Carrito vaciado', 'success');
          }
        });
      });

      // Total
      function renderTotal() {
        const total = carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);
        seccionTotal.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <div class="small text-muted">Total a pagar</div>
            <div class="h5 mb-0">$${numeroConComa(total)}</div>
          </div>
        </div>
      `;
      }

      // Filtro y orden
      buscador.addEventListener('input', aplicarFiltroYOrden);
      ordenSelect.addEventListener('change', aplicarFiltroYOrden);

      function aplicarFiltroYOrden() {
        const q = buscador.value.trim().toLowerCase();
        productosVisibles = zapatos.filter(p => {
          return p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q);
        });

        const orden = ordenSelect.value;
        if (orden === 'precio-asc') productosVisibles.sort((a,b) => a.precio - b.precio);
        else if (orden === 'precio-desc') productosVisibles.sort((a,b) => b.precio - a.precio);
        else if (orden === 'nombre-asc') productosVisibles.sort((a,b) => a.nombre.localeCompare(b.nombre));
        else if (orden === 'nombre-desc') productosVisibles.sort((a,b) => b.nombre.localeCompare(a.nombre));

        renderProductos(productosVisibles);
      }

      // Checkout
      btnPagar.addEventListener('click', () => {
        actualizarResumenCheckout();
        checkoutModal.show();
      });

      function actualizarResumenCheckout() {
        if (carrito.length === 0) {
          checkoutResumen.innerHTML = `<p class="text-muted">Tu carrito está vacío.</p>`;
        } else {
          const filas = carrito.map(it =>
            `<li>${escapeHtml(it.nombre)} x ${it.cantidad} — $${numeroConComa(it.precio * it.cantidad)}</li>`
          ).join('');

          const total = carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);
          checkoutResumen.innerHTML = `
          <div>
            <strong>Resumen:</strong>
            <ul class="mb-0" style="padding-left:18px;">${filas}</ul>
            <div class="mt-2"><strong>Total:</strong> $${numeroConComa(total)}</div>
          </div>
        `;
        }
      }

      metodoPago.addEventListener('change', (e) => {
        const val = e.target.value;
        detallesPago.innerHTML = "";
        if (val === 'tarjeta') {
          detallesPago.innerHTML = `
          <div class="mb-2">
            <label class="form-label">Número de tarjeta</label>
            <input class="form-control" required minlength="12" maxlength="19" name="numTarjeta">
          </div>
          <div class="row g-2">
            <div class="col-6">
              <label class="form-label">Vto (MM/AA)</label>
              <input class="form-control" required name="vto">
            </div>
            <div class="col-6">
              <label class="form-label">CVV</label>
              <input class="form-control" required minlength="3" maxlength="4" name="cvv">
            </div>
          </div>
        `;
        } else if (val === 'mercadopago') {
          detallesPago.innerHTML = `
          <div class="mb-2">
            <label class="form-label">Usuario MercadoPago</label>
            <input class="form-control" required name="mpUser">
          </div>
        `;
        } else if (val === 'transferencia') {
          detallesPago.innerHTML = `
          <div class="mb-2">
            <label class="form-label">Titular</label>
            <input class="form-control" required name="titular">
          </div>
          <div class="mb-2">
            <label class="form-label">CBU / Alias</label>
            <input class="form-control" required name="cbu">
          </div>
        `;
        }
      });

      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkoutForm.checkValidity()) {
          checkoutForm.classList.add('was-validated');
          return;
        }

        if (carrito.length === 0) {
          Swal.fire('Carrito vacío', 'Agrega productos antes de pagar.', 'info');
          return;
        }

        Swal.fire({
          title: 'Procesando pago...',
          html: 'No cierres esta ventana',
          didOpen: () => Swal.showLoading(),
          allowOutsideClick: false,
          allowEscapeKey: false
        });

        setTimeout(() => {
          Swal.close();
          const total = carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);

          Swal.fire({
            icon: 'success',
            title: 'Pago realizado',
            html: `<p>Gracias por tu compra. Total: <strong>$${numeroConComa(total)}</strong></p><p>Orden generada.</p>`
          });

          carrito = [];
          localStorage.removeItem('carrito');
          renderCarrito();

          const modalEl = document.getElementById('checkoutModal');
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();

          checkoutForm.reset();
          checkoutForm.classList.remove('was-validated');
        }, 1200);
      });

      function inicializarModoOscuro() {
        const modo = localStorage.getItem('modoOscuro');
        if (modo === 'true') document.body.classList.add('dark');

        modoOscuroBtn.addEventListener('click', () => {
          document.body.classList.toggle('dark');
          localStorage.setItem('modoOscuro', document.body.classList.contains('dark'));
        });
      }

      function mostrarToast(message, icon = 'success') {
        Swal.fire({
          toast: true,
          position: 'top-end',
          timer: 2000,
          showConfirmButton: false,
          icon,
          title: message
        });
      }

      function numeroConComa(x) {
        if (typeof x !== 'number') x = Number(x) || 0;
        return x.toLocaleString('es-AR');
      }

      function escapeHtml(unsafe) {
        return (unsafe + '').replace(/[&<"'>]/g, function(m) {
          return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
          }[m];
        });
      }

      function activarEventosPrincipales() {
        document.getElementById('checkoutModal').addEventListener('hidden.bs.modal', () => {
          checkoutForm.reset();
          detallesPago.innerHTML = "";
          checkoutForm.classList.remove('was-validated');
        });

        document.querySelectorAll('[data-bs-target="#checkoutModal"]').forEach(btn => {
          btn.addEventListener('click', () => {
            actualizarResumenCheckout();
          });
        });
      }

    } catch (error) {
      console.error("Error interno en la inicialización:", error);

      Swal.fire({
        icon: "error",
        title: "Error interno",
        text: "Ocurrió un problema inicializando la tienda. Revisá la consola.",
      });
    }
  })
  .catch(error => {
    console.error("Error al cargar JSON:", error);

    Swal.fire({
      icon: "error",
      title: "Error al cargar productos",
      html: `
        <p>No se pudo cargar <strong>zapatos.json</strong>.</p>
        <p style="font-size: 0.9rem;">${error.message}</p>
      `,
    });

    const seccionProductos = document.getElementById("seccionProductos");
    if (seccionProductos) {
      seccionProductos.innerHTML = `
        <div class="alert alert-danger text-center">
          No se pudieron cargar los productos. Intenta más tarde.
        </div>
      `;
    }
  });
