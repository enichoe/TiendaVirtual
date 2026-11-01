/**
 * App.jsx — Componente raiz de la tienda virtual Ferreteria Norte
 *
 * FLUJO PRINCIPAL:
 *   1. Se cargan productos y categorias (desde Supabase o datos de muestra)
 *   2. El usuario navega y filtra productos
 *   3. Agrega articulos al carrito (persiste en localStorage)
 *   4. En el checkout llena sus datos
 *   5. Se genera un enlace de WhatsApp con el pedido formateado
 *
 * ESTADO GLOBAL (useState):
 *   products       – lista de productos
 *   categories     – lista de categorias
 *   activeCategory – categoria seleccionada para filtrar
 *   query          – texto del buscador
 *   sort           – criterio de ordenamiento
 *   cart           – items en el carrito [{product, quantity}]
 *   cartOpen       – visibilidad del drawer del carrito
 *   checkoutOpen   – visibilidad del modal de checkout
 *   productOpen    – producto actualmente en el modal de detalle
 *   notice         – mensaje del toast de notificacion
 *   loading        – indicador de carga de datos remotos
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight,
  Check, ChevronDown,
  Menu, Minus,
  PackageCheck, Plus,
  Search, ShieldCheck, ShoppingBag,
  Truck, X, Zap, Heart,
} from 'lucide-react';

// Datos de muestra (se reemplazan si Supabase esta configurado)
import { sampleCategories, sampleProducts } from './data/products';
// Metodos de pago del negocio
import { paymentDetails } from './data/paymentDetails';
// Cliente de Supabase (puede ser null si no esta configurado)
import { supabase } from './lib/supabase';
// Funcion que construye el URL de WhatsApp con el pedido formateado
import { buildWhatsAppUrl } from './lib/whatsapp';

/* ─── Utilidades ──────────────────────────────────────────── */

/** Formatea un numero como moneda peruana (S/ 1,234.56) */
const money = (n) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n || 0);

/** Nombre de la tienda, configurable desde variables de entorno (.env) */
const storeName = import.meta.env.VITE_STORE_NAME || 'Ferreteria Norte';

/* ─── Componente principal ────────────────────────────────── */

function App() {
  /* --- Estado de datos del catalogo --- */
  const [products, setProducts]     = useState(sampleProducts);   // Lista de productos
  const [categories, setCategories] = useState(sampleCategories); // Lista de categorias
  const [loading, setLoading]       = useState(Boolean(supabase)); // true mientras carga remoto

  /* --- Estado de UI de filtros y busqueda --- */
  const [activeCategory, setActiveCategory] = useState('Todas'); // Categoria activa
  const [query, setQuery]                   = useState('');       // Texto del buscador
  const [sort, setSort]                     = useState('featured'); // Criterio de orden

  /* --- Estado del carrito (persiste en localStorage) ---
     Se inicializa leyendo del localStorage para mantener el carrito entre sesiones */
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ferreteria-norte-cart') || '[]');
    } catch {
      return []; // Si hay un error de parseo, empieza con carrito vacio
    }
  });

  /* --- Estado de paneles y modales --- */
  const [cartOpen,     setCartOpen]     = useState(false); // Drawer del carrito
  const [checkoutOpen, setCheckoutOpen] = useState(false); // Modal de checkout
  const [productOpen,  setProductOpen]  = useState(null);  // Modal de detalle (null = cerrado)

  /* --- Estado de notificaciones --- */
  const [notice, setNotice] = useState(''); // Mensaje del toast

  /* --- Referencia al header para agregar clase .scrolled al hacer scroll --- */
  const headerRef = useRef(null);

  /* ─── Efectos secundarios ─────────────────────────────── */

  /**
   * Persiste el carrito en localStorage cada vez que cambia.
   * Dependencia: [cart]
   */
  useEffect(() => {
    localStorage.setItem('ferreteria-norte-cart', JSON.stringify(cart));
  }, [cart]);

  /**
   * Carga datos remotos desde Supabase si esta configurado.
   * Solo se ejecuta una vez al montar el componente.
   * Si Supabase no esta configurado (supabase === null), usa datos de muestra.
   */
  useEffect(() => {
    if (!supabase) return; // Sin Supabase, usar datos de muestra

    let mounted = true; // Bandera para evitar actualizar estado si el componente se desmonto

    Promise.all([
      // Trae categorias activas ordenadas por el campo 'orden'
      supabase.from('categorias').select('id,nombre,icono').eq('activa', true).order('orden'),
      // Trae productos activos, los mas recientes primero
      supabase.from('productos')
        .select('id,nombre,descripcion,precio,precio_anterior,imagen_url,categoria_id,stock,destacado,etiqueta')
        .eq('activo', true)
        .order('created_at', { ascending: false }),
    ])
      .then(([cats, prods]) => {
        if (!mounted) return;
        // Solo reemplaza si la respuesta no tiene error y trae datos
        if (!cats.error  && cats.data?.length)  setCategories(cats.data);
        if (!prods.error && prods.data?.length)  setProducts(prods.data);
        setLoading(false);
      })
      .catch(() => setLoading(false)); // Si falla, igual quita el loading

    // Cleanup: evita actualizar estado si el componente se desmonta antes de que termine
    return () => { mounted = false; };
  }, []);

  /**
   * Agrega clase .scrolled al header cuando el usuario hace scroll.
   * Esto activa una sombra adicional en el CSS.
   */
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const handleScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ─── Datos derivados (memoizados) ───────────────────────── */

  /**
   * Lista filtrada y ordenada de productos.
   * Se recalcula solo cuando cambian: products, categories, activeCategory, query, sort.
   */
  const filtered = useMemo(() => {
    // Encuentra el ID de la categoria activa (si no es "Todas")
    const categoryId = categories.find((c) => c.nombre === activeCategory)?.id;

    // Filtra por categoria y por texto de busqueda
    let rows = products.filter((p) =>
      (activeCategory === 'Todas' || p.categoria_id === categoryId) &&
      `${p.nombre} ${p.descripcion || ''}`.toLowerCase().includes(query.toLowerCase())
    );

    // Ordena segun el criterio seleccionado
    if (sort === 'low')      rows = [...rows].sort((a, b) => a.precio - b.precio);
    if (sort === 'high')     rows = [...rows].sort((a, b) => b.precio - a.precio);
    if (sort === 'featured') rows = [...rows].sort((a, b) => Number(b.destacado) - Number(a.destacado));

    return rows;
  }, [products, categories, activeCategory, query, sort]);

  /** Total de items en el carrito (suma de cantidades) */
  const cartCount = cart.reduce((sum, row) => sum + row.quantity, 0);

  /** Subtotal del carrito (precio * cantidad de cada item) */
  const total = cart.reduce((sum, row) => sum + row.product.precio * row.quantity, 0);

  /* ─── Acciones del carrito ────────────────────────────────── */

  /**
   * Agrega un producto al carrito.
   * Si ya existe, incrementa su cantidad respetando el stock disponible.
   *
   * @param {Object} product  - Objeto del producto a agregar
   * @param {number} quantity - Cantidad a agregar (por defecto 1)
   */
  function addToCart(product, quantity = 1) {
    setCart((old) => {
      const found = old.find((row) => row.product.id === product.id);

      if (found) {
        // Ya existe: incrementar cantidad sin superar el stock
        return old.map((row) =>
          row.product.id === product.id
            ? { ...row, quantity: Math.min(row.quantity + quantity, product.stock || 99) }
            : row
        );
      }

      // No existe: agregar como nueva entrada
      return [...old, { product, quantity: Math.min(quantity, product.stock || 99) }];
    });

    // Mostrar notificacion toast por 2.2 segundos
    setNotice('Agregado a tu carrito');
    setTimeout(() => setNotice(''), 2200);
  }

  /**
   * Cambia la cantidad de un producto en el carrito.
   * Si la cantidad llega a 0, elimina el producto del carrito.
   *
   * @param {string} id     - ID del producto
   * @param {number} amount - Cantidad a agregar (positivo) o quitar (negativo)
   */
  function changeQty(id, amount) {
    setCart((old) =>
      old
        .map((row) =>
          row.product.id === id ? { ...row, quantity: row.quantity + amount } : row
        )
        .filter((row) => row.quantity > 0) // Elimina si queda en 0
    );
  }

  /* ─── Checkout y WhatsApp ─────────────────────────────────── */

  /**
   * Procesa el formulario de checkout.
   * Construye un mensaje de WhatsApp con los datos del cliente y el pedido,
   * y abre WhatsApp en una nueva pestana.
   *
   * @param {Event} event - Evento de submit del formulario
   */
  function placeOrder(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const customer = {
      nombre:    form.get('nombre'),
      direccion: form.get('direccion'),
      telefono:  form.get('telefono'),
    };

    try {
      // buildWhatsAppUrl genera el URL completo con el mensaje codificado
      const url = buildWhatsAppUrl({
        customer,
        items: cart,
        total,
        phone: import.meta.env.VITE_WHATSAPP_NUMBER,
        storeName,
      });

      // Abre WhatsApp en nueva pestana de forma segura (noopener evita ataques)
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      // Muestra el error (ej: numero de WhatsApp no configurado)
      setNotice(error.message);
      setTimeout(() => setNotice(''), 4000);
    }
  }

  /* ─── Helpers de UI ────────────────────────────────────────── */

  /**
   * Navega a la seccion de productos y activa una categoria.
   * Util para los botones de la barra de navegacion.
   *
   * @param {string} catName - Nombre de la categoria
   */
  function goToCategory(catName) {
    setActiveCategory(catName);
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
  }

  /* ─── Renderizado ──────────────────────────────────────────── */

  return (
    <>
      {/* ══════════════════════════════════════════════════
          ANNOUNCEMENT BAR
          Barra superior con informacion de envios y enlace
          ══════════════════════════════════════════════════ */}
      <div className="announcement">
        <span>Despacho en Lima Metropolitana</span>
        <span className="announcement-dot">✦</span>
        <span>Consulta cobertura y tarifa con un asesor</span>
        <a href="#ayuda">
          Ver mas <ArrowUpRight size={12} />
        </a>
      </div>

      {/* ══════════════════════════════════════════════════
          HEADER PRINCIPAL
          Logo + buscador + acciones + barra de navegacion
          ref={headerRef} permite agregar clase .scrolled via JS
          ══════════════════════════════════════════════════ */}
      <header className="site-header" ref={headerRef}>
        <div className="header-main wrap">

          {/* Logo / Marca */}
          <a href="#inicio" className="brand" aria-label={`${storeName} - inicio`}>
            <span className="brand-icon">🔧</span>
            <span className="brand-name">
              <span>
                ferreteria<em>norte</em>
              </span>
              <small>HERRAMIENTAS · DESDE 1998</small>
            </span>
          </a>

          {/* Buscador de productos */}
          <label className="searchbox" aria-label="Buscar productos">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Que necesitas para tu proyecto?"
              aria-label="Campo de busqueda"
            />
            <kbd>⌕</kbd>
          </label>

          {/* Acciones del header */}
          <div className="header-actions">

            {/* Enlace de ayuda (oculto en mobile) */}
            <a className="help-link" href="#ayuda">
              ¿Necesitas ayuda?
              <b>Estamos para orientarte</b>
            </a>

            {/* Boton de menu movil (visible solo en mobile) */}
            <button
              className="mobile-menu"
              aria-label="Ir a categorias"
              onClick={() => document.querySelector('.category-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Menu size={20} />
            </button>

            {/* Boton del carrito con badge de conteo */}
            <button
              className="cart-trigger"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir carrito, ${cartCount} productos`}
            >
              <ShoppingBag size={18} />
              <span>Carrito</span>
              <i>{cartCount}</i>
            </button>
          </div>
        </div>

        {/* Barra de navegacion secundaria con categorias rapidas */}
        <nav className="nav-bar" aria-label="Navegacion principal">
          <div className="wrap nav-inner">
            <div className="nav-categories">
              {/* Enlace "Todas las categorias" */}
              <a className="all-cats" href="#productos">
                <Menu size={15} />
                Todas las categorias
                <ChevronDown size={13} />
              </a>

              {/* Primeras 4 categorias como acceso rapido */}
              {categories.slice(0, 4).map((cat) => (
                <button key={cat.id} onClick={() => goToCategory(cat.nombre)}>
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Enlace a seccion de medios de pago */}
            <a href="#pagos">
              Medios de pago <ArrowUpRight size={12} />
            </a>
          </div>
        </nav>
      </header>

      {/* ══════════════════════════════════════════════════
          CONTENIDO PRINCIPAL
          ══════════════════════════════════════════════════ */}
      <main id="inicio">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HERO SECTION
            Seccion de bienvenida con texto destacado e imagen
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="hero wrap">
          {/* Texto del hero */}
          <div className="hero-copy">
            <p className="eyebrow">TODO PARA HACERLO BIEN</p>
            <h1>
              Tu proximo<br />
              <em>proyecto</em> empieza aqui.
            </h1>
            <p className="hero-sub">
              Herramientas, materiales y buenos consejos para construir a tu manera.
            </p>
            <a className="primary-btn" href="#productos">
              Explorar productos <ArrowRight size={15} />
            </a>
            {/* Indicador de pagina (decorativo) */}
            <div className="hero-foot">
              <span>01 <i>/</i> 03</span>
              <span className="hero-line" />
              <span>Lo esencial, bien elegido.</span>
            </div>
          </div>

          {/* Panel visual del hero con imagen */}
          <div className="hero-art">
            {/* Badge flotante en la esquina superior derecha */}
            <div className="hero-stamp">
              <span>CASA</span>
              <strong>N° 01</strong>
              <span>PARA HACER<br />QUE PASE</span>
            </div>

            {/* Imagen principal del hero (herramientas) */}
            <img
              src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1500&q=90"
              alt="Herramientas profesionales para proyectos en casa"
            />

            {/* Etiqueta en la parte inferior */}
            <div className="hero-caption">
              <span>01 — HERRAMIENTAS</span>
              <strong>Manos a la obra.</strong>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SERVICE STRIP (Beneficios)
            Los 4 puntos diferenciadores del negocio
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="service-strip wrap" aria-label="Beneficios de comprar con nosotros">
          <div>
            <Truck />
            <span>
              <b>Envios coordinados</b>
              <small>Consulta cobertura en Lima</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <b>Compra con confianza</b>
              <small>Te asesoramos por WhatsApp</small>
            </span>
          </div>
          <div>
            <PackageCheck />
            <span>
              <b>Stock actualizado</b>
              <small>Confirmamos antes de despachar</small>
            </span>
          </div>
          <div>
            <Zap />
            <span>
              <b>Pago facil y seguro</b>
              <small>Yape, Plin y transferencia</small>
            </span>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECCION DE CATEGORIAS
            Grid de tarjetas para filtrar por categoria.
            La categoria activa tiene clase 'active'.
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="category-section wrap">
          <div className="section-head">
            <div>
              <p className="eyebrow">ENCUENTRA LO QUE BUSCAS</p>
              <h2>¿Que tienes entre manos?</h2>
            </div>
            <a
              href="#productos"
              onClick={() => setActiveCategory('Todas')}
            >
              Ver todo el catalogo <ArrowRight size={14} />
            </a>
          </div>

          <div className="category-list">
            {/* Tarjeta "Todo el catalogo" */}
            <button
              className={activeCategory === 'Todas' ? 'category active' : 'category'}
              onClick={() => setActiveCategory('Todas')}
            >
              <span className="cat-icon">✦</span>
              <span>Todo el catalogo</span>
              <ArrowUpRight size={13} />
            </button>

            {/* Tarjeta por cada categoria */}
            {categories.map((cat) => (
              <button
                className={activeCategory === cat.nombre ? 'category active' : 'category'}
                key={cat.id}
                onClick={() => setActiveCategory(cat.nombre)}
              >
                <span className="cat-icon">{cat.icono || '◈'}</span>
                <span>{cat.nombre}</span>
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECCION DE PRODUCTOS
            Grid principal con todas las tarjetas de producto.
            Filtrado y ordenado por el estado derivado 'filtered'.
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="productos" className="products-section wrap">
          {/* Encabezado con titulo dinamico y controles de orden */}
          <div className="products-head">
            <div>
              <p className="eyebrow">SELECCION DE LA CASA</p>
              <h2>
                {activeCategory === 'Todas'
                  ? 'Lo que necesitas, y un poco mas.'
                  : activeCategory}
              </h2>
            </div>
            <div className="sort-control">
              <span>{filtered.length} productos</span>
              <label>
                Ordenar&nbsp;
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Ordenar productos"
                >
                  <option value="featured">Destacados</option>
                  <option value="low">Menor precio</option>
                  <option value="high">Mayor precio</option>
                </select>
              </label>
            </div>
          </div>

          {/* Indicador de carga mientras conecta con Supabase */}
          {loading && (
            <div className="loading-note">Conectando el catalogo…</div>
          )}

          {/* Grid de tarjetas de producto */}
          <div className="product-grid">
            {filtered.map((product) => (
              <article className="product-card" key={product.id}>

                {/* Imagen del producto (boton para abrir modal de detalle) */}
                <button
                  className="product-image"
                  onClick={() => setProductOpen(product)}
                  aria-label={`Ver detalle de ${product.nombre}`}
                >
                  <img
                    loading="lazy"
                    src={product.imagen_url}
                    alt={product.nombre}
                  />

                  {/* Etiqueta opcional (ej: "Mas vendido") */}
                  {product.etiqueta && (
                    <span className="product-tag">{product.etiqueta}</span>
                  )}

                  {/* Tooltip de "Ver detalles" que aparece en hover */}
                  <span className="quick-view">
                    Ver detalles <ArrowUpRight size={12} />
                  </span>

                  {/* Boton de favorito (actualmente decorativo, extensible) */}
                  <span className="heart-button" role="button" aria-label="Guardar en favoritos">
                    <Heart size={16} />
                  </span>
                </button>

                {/* Metadatos: categoria + indicador de stock */}
                <div className="product-meta">
                  <span>
                    {categories.find((c) => c.id === product.categoria_id)?.nombre || 'Ferreteria'}
                  </span>
                  <span className={product.stock > 0 ? 'in-stock' : 'out-stock'}>
                    <i />
                    {product.stock > 0 ? 'Disponible' : 'Consultar'}
                  </span>
                </div>

                {/* Nombre del producto (boton para abrir modal) */}
                <button
                  className="product-title"
                  onClick={() => setProductOpen(product)}
                >
                  {product.nombre}
                </button>

                {/* Fila inferior: precios y boton agregar */}
                <div className="product-bottom">
                  <div>
                    <strong>{money(product.precio)}</strong>
                    {product.precio_anterior && (
                      <del>{money(product.precio_anterior)}</del>
                    )}
                  </div>
                  <button
                    className="add-button"
                    onClick={() => addToCart(product)}
                    aria-label={`Agregar ${product.nombre} al carrito`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Mensaje cuando la busqueda no tiene resultados */}
          {!filtered.length && !loading && (
            <div className="empty-results">
              <span>⌕</span>
              <h3>No encontramos ese producto</h3>
              <p>Prueba con otra busqueda o revisa todas las categorias.</p>
              <button
                className="text-btn"
                onClick={() => { setQuery(''); setActiveCategory('Todas'); }}
              >
                Ver todo el catalogo <ArrowRight size={14} />
              </button>
            </div>
          )}
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            BANNER DE PROYECTO
            Seccion oscura que invita a contactar para proyectos grandes.
            Enlaza directamente a WhatsApp con un mensaje predefinido.
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="project-banner wrap">
          <div className="project-copy">
            <p className="eyebrow">¿TIENES UN PROYECTO GRANDE?</p>
            <h2>
              Hablemos de<br />lo que necesitas.
            </h2>
            <p>
              Cuentanos tu idea. Un asesor te ayuda a encontrar
              materiales, cantidades y opciones de entrega.
            </p>
            <a
              className="light-btn"
              /* Construye la URL de WhatsApp con numero limpio (solo digitos) */
              href={`https://wa.me/${String(import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')}?text=${encodeURIComponent('Hola, necesito asesoria para mi proyecto.')}`}
              target="_blank"
              rel="noreferrer"
            >
              Conversa con un asesor <ArrowUpRight size={15} />
            </a>
          </div>

          {/* Imagen de fondo con overlay degradado */}
          <div className="project-visual">
            <img
              src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=85"
              alt="Proyecto de construccion en marcha"
            />
            <span>HAGAMOS<br />QUE PASE.</span>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECCION DE PAGOS
            Explica los metodos de pago disponibles.
            Los datos se cargan desde paymentDetails.js
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="pagos" className="payments-section wrap">
          <div>
            <p className="eyebrow">PAGA A TU MANERA</p>
            <h2>
              Opciones claras,<br />compra tranquila.
            </h2>
            <p className="payments-lede">
              El pedido se confirma con nuestro equipo por WhatsApp.
              Te indicaremos el monto final y los datos de pago.
            </p>
          </div>

          <div className="payment-grid">
            {/* Tarjeta: Transferencia bancaria */}
            <div className="payment-card">
              <span className="payment-mark bank-mark">B</span>
              <h3>Transferencia bancaria</h3>
              <div className="bank-list">
                {paymentDetails.banks.map((bank) => (
                  <div key={bank.name}>
                    <b>{bank.name}</b>
                    <span>Cuenta: {bank.account}</span>
                    <span>CCI: {bank.cci}</span>
                  </div>
                ))}
              </div>
              <small>Confirma con el asesor que la cuenta corresponde al negocio antes de transferir.</small>
            </div>

            {/* Tarjeta: Yape / Plin */}
            <div className="payment-card">
              <span className="payment-mark wallet-mark">Y</span>
              <h3>Yape o Plin</h3>
              <div className="wallet-list">
                {paymentDetails.wallets.map((wallet) => (
                  <div key={wallet.name}>
                    <b>{wallet.name}</b>
                    <span>{wallet.phone}</span>
                  </div>
                ))}
              </div>
              <small>Envia la captura del voucher por WhatsApp y espera la confirmacion del asesor.</small>
            </div>

            {/* Nota de seguridad */}
            <div className="payment-note">
              <ShieldCheck size={17} />
              <p>
                Realiza el pago solo despues de confirmar disponibilidad,
                envio y total con el asesor.
              </p>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECCION DE AYUDA (CTA)
            Enlace rapido a WhatsApp para consultas
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="ayuda" className="newsletter wrap">
          <div>
            <p className="eyebrow">CERCA DE TI</p>
            <h2>¿Tienes alguna duda?</h2>
            <p>Estamos listos para ayudarte a elegir bien.</p>
          </div>
          <a
            className="outline-btn"
            href={`https://wa.me/${String(import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')}?text=${encodeURIComponent('Hola, tengo una consulta sobre un producto.')}`}
            target="_blank"
            rel="noreferrer"
          >
            Escribenos por WhatsApp <ArrowUpRight size={15} />
          </a>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════ */}
      <footer className="footer">
        <div className="wrap footer-main">
          {/* Logo del footer */}
          <a href="#inicio" className="brand footer-brand" aria-label="Volver al inicio">
            <span className="brand-icon">🔧</span>
            <span className="brand-name">
              <span>ferreteria<em>norte</em></span>
              <small>HERRAMIENTAS · DESDE 1998</small>
            </span>
          </a>
          <span>Materiales para hacer las cosas bien.</span>
          <a href="#inicio">
            Volver arriba <ArrowDown size={13} style={{ transform: 'rotate(180deg)' }} />
          </a>
        </div>
        <div className="wrap footer-bottom">
          <span>© 2026 {storeName}. Todos los derechos reservados.</span>
          <span>Catalogo sujeto a disponibilidad. Precios en soles (S/).</span>
          <span>Hecho para tus proyectos <span className="footer-star">✦</span></span>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════
          CARRITO (DRAWER LATERAL)
          Se muestra cuando cartOpen === true.
          El overlay oscuro detecta click fuera para cerrarlo.
          ══════════════════════════════════════════════════ */}
      {cartOpen && (
        <div
          className="overlay"
          onMouseDown={(e) => e.target === e.currentTarget && setCartOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Carrito de compras"
        >
          <aside className="cart-drawer">
            {/* Encabezado del carrito */}
            <div className="drawer-head">
              <div>
                <p className="eyebrow">TU SELECCION</p>
                <h2>
                  Tu carrito <span>({cartCount})</span>
                </h2>
              </div>
              <button
                className="close-btn"
                onClick={() => setCartOpen(false)}
                aria-label="Cerrar carrito"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido del carrito */}
            {cart.length ? (
              <>
                {/* Lista de items */}
                <div className="cart-items">
                  {cart.map(({ product, quantity }) => (
                    <div className="cart-row" key={product.id}>
                      <img src={product.imagen_url} alt={product.nombre} />
                      <div className="cart-row-info">
                        <b>{product.nombre}</b>
                        <span>{money(product.precio)}</span>
                        {/* Control de cantidad +/- */}
                        <div className="qty-control">
                          <button
                            onClick={() => changeQty(product.id, -1)}
                            aria-label="Quitar una unidad"
                          >
                            <Minus size={12} />
                          </button>
                          <span>{quantity}</span>
                          <button
                            onClick={() => changeQty(product.id, 1)}
                            aria-label="Agregar una unidad"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      {/* Subtotal de este item */}
                      <strong>{money(product.precio * quantity)}</strong>
                    </div>
                  ))}
                </div>

                {/* Resumen y acciones del carrito */}
                <div className="cart-summary">
                  <div className="subtotal">
                    <span>Subtotal referencial</span>
                    <strong>{money(total)}</strong>
                  </div>
                  <small>El costo de envio se confirma con un asesor.</small>
                  {/* Ir al checkout */}
                  <button
                    className="primary-btn full-btn"
                    onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                  >
                    Continuar con el pedido <ArrowRight size={15} />
                  </button>
                  {/* Seguir comprando */}
                  <button
                    className="continue-btn"
                    onClick={() => setCartOpen(false)}
                  >
                    Seguir comprando
                  </button>
                </div>
              </>
            ) : (
              /* Estado vacio del carrito */
              <div className="cart-empty">
                <span><ShoppingBag size={24} /></span>
                <h3>Tu carrito esta esperando.</h3>
                <p>Encuentra herramientas para empezar tu proximo proyecto.</p>
                <button
                  className="primary-btn"
                  onClick={() => setCartOpen(false)}
                >
                  Explorar catalogo <ArrowRight size={14} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CHECKOUT MODAL
          Formulario para recopilar datos del cliente antes
          de enviar el pedido por WhatsApp.
          ══════════════════════════════════════════════════ */}
      {checkoutOpen && (
        <div
          className="overlay"
          onMouseDown={(e) => e.target === e.currentTarget && setCheckoutOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar pedido"
        >
          <section className="checkout-modal">
            {/* Encabezado */}
            <div className="drawer-head">
              <div>
                <p className="eyebrow">UN ULTIMO PASO</p>
                <h2>Confirma tu pedido</h2>
              </div>
              <button
                className="close-btn"
                onClick={() => setCheckoutOpen(false)}
                aria-label="Cerrar checkout"
              >
                <X size={16} />
              </button>
            </div>

            <p className="checkout-intro">
              Dejanos tus datos. Abriremos WhatsApp con el detalle para
              que un asesor confirme stock, envio y pago.
            </p>

            {/* Formulario de datos del cliente */}
            <form onSubmit={placeOrder} className="checkout-form">
              <label>
                Nombre completo
                <input
                  name="nombre"
                  placeholder="Ej. Maria Perez"
                  required
                  minLength="2"
                  autoComplete="name"
                />
              </label>
              <label>
                Direccion de envio
                <input
                  name="direccion"
                  placeholder="Distrito, calle y numero"
                  required
                  minLength="5"
                  autoComplete="street-address"
                />
              </label>
              <label>
                Telefono de contacto
                <input
                  name="telefono"
                  type="tel"
                  placeholder="Ej. 999 888 777"
                  required
                  minLength="7"
                  autoComplete="tel"
                />
              </label>

              {/* Resumen del total */}
              <div className="checkout-total">
                <span>{cartCount} articulos · Total referencial</span>
                <b>{money(total)}</b>
              </div>

              {/* Nota del metodo de pago */}
              <div className="checkout-payment">
                <Check size={15} />
                <span>Pago coordinado por WhatsApp · Yape, Plin o transferencia</span>
              </div>

              {/* Boton de envio */}
              <button className="primary-btn full-btn" type="submit">
                Confirmar pedido por WhatsApp <ArrowRight size={15} />
              </button>

              <small className="checkout-legal">
                Al continuar, compartiras estos datos con la tienda para gestionar tu pedido.
              </small>
            </form>
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL DE DETALLE DE PRODUCTO
          Se muestra cuando productOpen !== null.
          Muestra imagen, descripcion, precio y boton de agregar.
          ══════════════════════════════════════════════════ */}
      {productOpen && (
        <div
          className="overlay"
          onMouseDown={(e) => e.target === e.currentTarget && setProductOpen(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${productOpen.nombre}`}
        >
          <section className="product-modal">
            {/* Boton de cierre */}
            <button
              className="close-btn modal-close"
              onClick={() => setProductOpen(null)}
              aria-label="Cerrar detalle del producto"
            >
              <X size={16} />
            </button>

            {/* Imagen del producto */}
            <div className="modal-image">
              <img src={productOpen.imagen_url} alt={productOpen.nombre} />
            </div>

            {/* Informacion del producto */}
            <div className="modal-info">
              <p className="eyebrow">
                {categories.find((c) => c.id === productOpen.categoria_id)?.nombre || 'FERRETERIA'}
              </p>
              <h2>{productOpen.nombre}</h2>
              <p className="modal-description">{productOpen.descripcion}</p>

              {/* Precio con tachado si tiene precio anterior */}
              <div className="modal-price">
                {money(productOpen.precio)}
                {productOpen.precio_anterior && (
                  <del>{money(productOpen.precio_anterior)}</del>
                )}
              </div>

              {/* Disponibilidad de stock */}
              <p className="stock-detail">
                <i />
                {productOpen.stock > 0
                  ? `${productOpen.stock} unidades disponibles`
                  : 'Consultar disponibilidad'}
              </p>

              {/* Boton para agregar al carrito y cerrar modal */}
              <button
                className="primary-btn full-btn"
                onClick={() => { addToCart(productOpen); setProductOpen(null); }}
              >
                Agregar al carrito <Plus size={15} />
              </button>

              <small>Stock y precio se confirman al coordinar el pedido.</small>
            </div>
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TOAST DE NOTIFICACION
          Aparece brevemente al agregar productos al carrito.
          Se maneja con el estado 'notice'.
          ══════════════════════════════════════════════════ */}
      {notice && (
        <div className="toast" role="status" aria-live="polite">
          <Check size={15} />
          {notice}
        </div>
      )}
    </>
  );
}

export default App;
