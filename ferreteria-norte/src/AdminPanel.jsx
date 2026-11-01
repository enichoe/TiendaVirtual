/**
 * ============================================================
 * AdminPanel.jsx — Panel de Administración de Productos (CRUD)
 * ============================================================
 *
 * PROPÓSITO:
 * Proporcionar una interfaz administrativa moderna, rápida y amigable
 * para que el dueño de la ferretería o negocio pueda:
 *   1. Ver el inventario completo y estadísticas rápidas.
 *   2. Crear nuevos productos con fotos, precios y stock.
 *   3. Editar cualquier producto existente en tiempo real.
 *   4. Eliminar productos con confirmación.
 *   5. Ajustar stock (+ / -) con un solo clic.
 *
 * ARQUITECTURA DE PERSISTENCIA DUAL:
 * - Si Supabase está conectado: guarda directamente en la base de datos PostgreSQL en la nube.
 * - Si funciona offline o en modo demo: actualiza el estado local de React.
 *
 * SEGURIDAD:
 * Se protege mediante un PIN numérico (por defecto '1234' o configurable
 * mediante import.meta.env.VITE_ADMIN_PIN). La sesión se almacena en
 * sessionStorage mientras el navegador esté abierto.
 */

import React, { useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Search, X, Check,
  AlertTriangle, Package, DollarSign, TrendingUp,
  Image as ImageIcon, Eye, EyeOff, ShieldCheck,
  ArrowLeft, RefreshCw, Layers
} from 'lucide-react';
import { supabase } from './lib/supabase';

// Formateador de moneda en Soles Peruanos (PEN)
const money = (n) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n || 0);

// PIN administrativo configurable (por defecto '1234')
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

/**
 * Componente principal del Panel de Administración
 *
 * @param {Object} props
 * @param {Array} props.products - Lista actual de productos
 * @param {Function} props.setProducts - Setter para actualizar productos en la app
 * @param {Array} props.categories - Lista de categorías
 * @param {Function} props.onClose - Función para regresar a la vista de tienda
 * @param {Function} props.showNotice - Función para disparar toasts en pantalla
 */
export default function AdminPanel({
  products,
  setProducts,
  categories,
  onClose,
  showNotice,
}) {
  // Estado de autenticación del panel
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Filtros de búsqueda en el panel admin
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Todas');

  // Estado del modal de creación / edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = nuevo producto

  // Estado de confirmación de eliminación
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Formulario de producto
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    precio_anterior: '',
    categoria_id: categories[0]?.id || 'herramientas',
    stock: 10,
    imagen_url: '',
    destacado: false,
    etiqueta: '',
    activo: true,
  });

  /* ─── Manejo de Autenticación ───────────────────────────── */

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      setPinError(false);
      showNotice('Sesión de administrador iniciada');
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    onClose();
  };

  /* ─── Estadísticas del Inventario ───────────────────────── */

  const stats = useMemo(() => {
    const totalItems = products.length;
    const featuredItems = products.filter((p) => p.destacado).length;
    const lowStockItems = products.filter((p) => (p.stock || 0) < 5).length;
    const inventoryValue = products.reduce(
      (acc, p) => acc + (p.precio || 0) * (p.stock || 0),
      0
    );
    return { totalItems, featuredItems, lowStockItems, inventoryValue };
  }, [products]);

  /* ─── Filtrado de productos en la tabla ─────────────────── */

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = `${p.nombre} ${p.descripcion || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchCat =
        selectedCat === 'Todas' || p.categoria_id === selectedCat;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCat]);

  /* ─── Abrir Modal: Crear o Editar ───────────────────────── */

  const openNewModal = () => {
    setEditingProduct(null);
    setForm({
      nombre: '',
      descripcion: '',
      precio: '',
      precio_anterior: '',
      categoria_id: categories[0]?.id || 'herramientas',
      stock: 10,
      imagen_url: '',
      destacado: false,
      etiqueta: '',
      activo: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      precio: product.precio ?? '',
      precio_anterior: product.precio_anterior ?? '',
      categoria_id: product.categoria_id || categories[0]?.id || 'herramientas',
      stock: product.stock ?? 10,
      imagen_url: product.imagen_url || '',
      destacado: Boolean(product.destacado),
      etiqueta: product.etiqueta || '',
      activo: product.activo !== false,
    });
    setModalOpen(true);
  };

  /* ─── Guardar Producto (Create / Update) ────────────────── */

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);

    const parsedPrice = parseFloat(form.precio);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      alert('Ingresa un precio válido');
      setSaving(false);
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: parsedPrice,
      precio_anterior: form.precio_anterior ? parseFloat(form.precio_anterior) : null,
      categoria_id: form.categoria_id,
      stock: parseInt(form.stock, 10) || 0,
      imagen_url: form.imagen_url.trim() || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
      destacado: Boolean(form.destacado),
      etiqueta: form.etiqueta.trim() || null,
      activo: Boolean(form.activo),
    };

    try {
      if (editingProduct) {
        // --- MODO ACTUALIZAR ---
        if (supabase) {
          const { error } = await supabase
            .from('productos')
            .update(payload)
            .eq('id', editingProduct.id);
          if (error) throw error;
        }

        // Actualizamos en memoria
        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingProduct.id ? { ...item, ...payload } : item
          )
        );
        showNotice(`Producto "${payload.nombre}" actualizado`);
      } else {
        // --- MODO CREAR NUEVO ---
        const newId = supabase ? undefined : `local-${Date.now()}`;
        if (supabase) {
          const { data, error } = await supabase
            .from('productos')
            .insert([payload])
            .select();
          if (error) throw error;
          if (data && data.length) {
            setProducts((prev) => [data[0], ...prev]);
          }
        } else {
          setProducts((prev) => [{ id: newId, ...payload }, ...prev]);
        }
        showNotice(`Nuevo producto "${payload.nombre}" creado exitosamente`);
      }

      setModalOpen(false);
    } catch (err) {
      console.error('Error al guardar en Supabase:', err);
      alert(`Error al guardar: ${err.message || 'Verifica las políticas en Supabase'}`);
    } finally {
      setSaving(false);
    }
  };

  /* ─── Ajuste Rápido de Stock (+ / -) ────────────────────── */

  const handleQuickStock = async (product, delta) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    
    // Actualización optimista en interfaz
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
    );

    if (supabase) {
      try {
        await supabase
          .from('productos')
          .update({ stock: newStock })
          .eq('id', product.id);
      } catch (err) {
        console.error('Error al actualizar stock:', err);
      }
    }
  };

  /* ─── Eliminar Producto ─────────────────────────────────── */

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    setSaving(true);

    try {
      if (supabase) {
        const { error } = await supabase
          .from('productos')
          .delete()
          .eq('id', deletingProduct.id);
        if (error) throw error;
      }

      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      showNotice(`Producto "${deletingProduct.nombre}" eliminado`);
      setDeletingProduct(null);
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert(`No se pudo eliminar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  /* ─── Si no está autenticado: Pantalla de Login con PIN ──── */

  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <div className="admin-login-card">
          <div className="admin-login-icon">
            <ShieldCheck size={40} />
          </div>
          <h2 className="admin-login-title">Acceso Administrativo</h2>
          <p className="admin-login-subtitle">
            Ingresa tu PIN de seguridad para gestionar el inventario, catálogo y precios.
          </p>

          {/* Caja informativa de credenciales */}
          <div className="admin-credentials-banner">
            <div className="admin-credentials-info">
              <span>PIN por defecto:</span>
              <code className="admin-credentials-code">1234</code>
            </div>
            <button
              type="button"
              className="btn-quick-pin"
              onClick={() => {
                setPinInput('1234');
                setPinError(false);
              }}
              title="Copiar PIN por defecto al campo"
            >
              Autocompletar
            </button>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="admin-input-group">
              <label htmlFor="admin-pin-input">PIN de Administrador</label>
              <div className="admin-pin-input-wrapper">
                <input
                  id="admin-pin-input"
                  type={showPin ? 'text' : 'password'}
                  maxLength={12}
                  placeholder="Ej. 1234"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(false);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-toggle-pin"
                  onClick={() => setShowPin(!showPin)}
                  title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                  aria-label="Alternar visibilidad del PIN"
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {pinError && (
                <span className="admin-error-text">
                  PIN incorrecto. El PIN configurado actualmente es "{ADMIN_PIN}".
                </span>
              )}
            </div>

            <div className="admin-login-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
              >
                Volver a la Tienda
              </button>
              <button type="submit" className="btn btn-primary">
                Ingresar al Panel
              </button>
            </div>
          </form>

          <p className="admin-login-footer-hint">
            Configurable en <code>.env.local</code> mediante <code>VITE_ADMIN_PIN</code>
          </p>
        </div>
      </div>
    );
  }

  /* ─── Pantalla Principal del Dashboard de Administración ── */

  return (
    <div className="admin-dashboard-container">
      {/* Barra superior de navegación del Admin */}
      <header className="admin-nav-header">
        <div className="admin-nav-left">
          <button
            onClick={onClose}
            className="btn btn-ghost admin-back-btn"
            title="Regresar a la tienda"
          >
            <ArrowLeft size={20} />
            <span>Volver a la Tienda</span>
          </button>
          <div className="admin-brand-tag">
            <Layers size={18} />
            <span>Panel de Control</span>
          </div>
        </div>

        <div className="admin-nav-right">
          <button onClick={openNewModal} className="btn btn-primary">
            <Plus size={18} />
            <span>Nuevo Producto</span>
          </button>
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ padding: '0.5rem 0.85rem' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Grid de Estadísticas Rápidas */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon icon-blue">
            <Package size={24} />
          </div>
          <div>
            <span className="admin-stat-label">Total Productos</span>
            <div className="admin-stat-value">{stats.totalItems}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon icon-amber">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="admin-stat-label">Destacados</span>
            <div className="admin-stat-value">{stats.featuredItems}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon icon-red">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="admin-stat-label">Stock Crítico (&lt; 5)</span>
            <div className="admin-stat-value">{stats.lowStockItems}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon icon-green">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="admin-stat-label">Valor en Inventario</span>
            <div className="admin-stat-value">{money(stats.inventoryValue)}</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="admin-clear-search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="admin-category-selector">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="Todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icono} {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Foto</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th style={{ width: '150px' }}>Stock</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty-table">
                  No se encontraron productos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const categoryObj = categories.find((c) => c.id === p.categoria_id);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-product-thumb">
                        <img
                          src={p.imagen_url || 'https://via.placeholder.com/60'}
                          alt={p.nombre}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=120&q=80';
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="admin-product-name-cell">
                        <strong className="admin-product-title">{p.nombre}</strong>
                        {p.etiqueta && (
                          <span className="badge badge-accent" style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>
                            {p.etiqueta}
                          </span>
                        )}
                        {p.destacado && (
                          <span className="badge badge-primary" style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }}>
                            ★ Destacado
                          </span>
                        )}
                      </div>
                      <p className="admin-product-desc-preview">{p.descripcion}</p>
                    </td>
                    <td>
                      <span className="admin-category-badge">
                        {categoryObj?.icono} {categoryObj?.nombre || p.categoria_id}
                      </span>
                    </td>
                    <td>
                      <div className="admin-price-cell">
                        <span className="admin-current-price">{money(p.precio)}</span>
                        {p.precio_anterior && (
                          <span className="admin-old-price">{money(p.precio_anterior)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="admin-stock-control">
                        <button
                          onClick={() => handleQuickStock(p, -1)}
                          disabled={(p.stock || 0) <= 0}
                          className="btn-stock-adjust"
                          title="Restar 1 unidad"
                        >
                          -
                        </button>
                        <span className={`admin-stock-pill ${(p.stock || 0) < 5 ? 'stock-low' : 'stock-ok'}`}>
                          {p.stock ?? 0}
                        </span>
                        <button
                          onClick={() => handleQuickStock(p, +1)}
                          className="btn-stock-adjust"
                          title="Sumar 1 unidad"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${p.activo !== false ? 'status-active' : 'status-inactive'}`}>
                        {p.activo !== false ? 'Activo' : 'Oculto'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-action-buttons">
                        <button
                          onClick={() => openEditModal(p)}
                          className="btn-admin-action btn-edit"
                          title="Editar producto"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(p)}
                          className="btn-admin-action btn-delete"
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Modal Crear / Editar Producto ─────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
              <button
                className="btn-close"
                onClick={() => setModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="admin-modal-form">
              <div className="admin-form-grid">
                {/* Nombre */}
                <div className="form-group full-width">
                  <label>Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Taladro percutor 650W"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>

                {/* Categoría */}
                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    value={form.categoria_id}
                    onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icono} {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock */}
                <div className="form-group">
                  <label>Unidades en Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>

                {/* Precio Venta */}
                <div className="form-group">
                  <label>Precio de Venta (S/) *</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    placeholder="0.00"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  />
                </div>

                {/* Precio Anterior (Tachado) */}
                <div className="form-group">
                  <label>Precio Anterior (Opcional tachado)</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    placeholder="Para mostrar oferta"
                    value={form.precio_anterior}
                    onChange={(e) => setForm({ ...form, precio_anterior: e.target.value })}
                  />
                </div>

                {/* URL de la Imagen */}
                <div className="form-group full-width">
                  <label>URL de la Imagen *</label>
                  <div className="admin-img-input-row">
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={form.imagen_url}
                      onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
                    />
                    {form.imagen_url && (
                      <div className="admin-img-preview-box">
                        <img src={form.imagen_url} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Etiqueta Opcional */}
                <div className="form-group">
                  <label>Insignia / Badge (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. 'Más vendido' o 'Oferta'"
                    value={form.etiqueta}
                    onChange={(e) => setForm({ ...form, etiqueta: e.target.value })}
                  />
                </div>

                {/* Checkboxes de Opciones */}
                <div className="form-group checkbox-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.destacado}
                      onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
                    />
                    <span>Producto Destacado</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                    <span>Visible en catálogo</span>
                  </label>
                </div>

                {/* Descripción */}
                <div className="form-group full-width">
                  <label>Descripción / Ficha Técnica</label>
                  <textarea
                    rows={3}
                    placeholder="Describe los detalles, especificaciones y usos del producto..."
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Confirmar Eliminación ────────────────────── */}
      {deletingProduct && (
        <div className="modal-overlay" onClick={() => setDeletingProduct(null)}>
          <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-confirm-icon">
              <Trash2 size={32} />
            </div>
            <h3>¿Eliminar este producto?</h3>
            <p>
              Estás a punto de borrar <strong>"{deletingProduct.nombre}"</strong> del catálogo. Esta acción no se puede deshacer.
            </p>
            <div className="admin-confirm-actions">
              <button
                className="btn btn-outline"
                onClick={() => setDeletingProduct(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={saving}
              >
                {saving ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
