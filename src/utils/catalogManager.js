import { clearDraft } from './draftStore';

export default {
  async fetchData() {
    try {
      if (window.electronAPI && typeof window.electronAPI.getCategories === 'function') {
        this.categories = await window.electronAPI.getCategories();
        this.products = await window.electronAPI.getProducts();
        this.tvaRates = await window.electronAPI.getTvaRates();
      } else {
        console.warn('window.electronAPI not found. Loading browser mock data...');
        this.loadBrowserMocks();
      }
    } catch (err) {
      console.error('Failed to load catalogue data:', err);
    }
  },
  getCategoryAndDescendantIds(catId) {
    const ids = [catId];
    const findChildren = (parentId) => {
      const children = this.categories.filter((c) => c.parent_id === parentId);
      for (const child of children) {
        ids.push(child.id);
        findChildren(child.id);
      }
    };
    findChildren(catId);
    return ids;
  },
  async handleProductCreated(newProduct) {
    clearDraft();
    this.isCreatingProduct = false;
    this.focusedProduct = null;
    await this.fetchData();
    this.selectedCategoryId = newProduct.category_id;
  },
  async handleProductUpdated(prodId) {
    await this.fetchData();
    this.focusedProduct = this.products.find((p) => p.id === prodId) || null;
  },
  async deleteFocusedProduct() {
    if (this.focusedProduct) {
      await this.deleteProduct(this.focusedProduct);
    }
  },
  async deleteProduct(product) {
    if (!product) return;

    let confirmed = false;
    if (window.electronAPI && typeof window.electronAPI.confirmDeleteProduct === 'function') {
      confirmed = await window.electronAPI.confirmDeleteProduct(product.name);
    } else {
      confirmed = window.confirm(`Voulez-vous vraiment supprimer le produit "${product.name}" ?`);
    }

    if (confirmed) {
      try {
        if (window.electronAPI && typeof window.electronAPI.deleteProduct === 'function') {
          await window.electronAPI.deleteProduct(product.id);
        } else {
          console.log('Mock: Product deleted', product.id);
          const idx = this.products.findIndex((p) => p.id === product.id);
          if (idx !== -1) {
            this.products.splice(idx, 1);
          }
        }
        if (this.focusedProduct && this.focusedProduct.id === product.id) {
          this.focusedProduct = null;
        }
        await this.fetchData();
      } catch (err) {
        console.error('Error deleting product:', err);
        alert(`Erreur lors de la suppression: ${err.message}`);
      }
    }
  },

  async deleteCategory(category) {
    if (!category) return;

    let confirmed = false;
    if (window.electronAPI && typeof window.electronAPI.confirmDeleteCategory === 'function') {
      confirmed = await window.electronAPI.confirmDeleteCategory(category.name);
    } else {
      confirmed = window.confirm(
        `Voulez-vous vraiment supprimer la catégorie "${category.name}" ?\n\nAucun article ne sera supprimé, ils seront déplacés vers la catégorie parente.`
      );
    }

    if (confirmed) {
      try {
        if (window.electronAPI && typeof window.electronAPI.deleteCategory === 'function') {
          await window.electronAPI.deleteCategory(category.id);
        } else {
          console.log('Mock: Category deleted', category.id);
          const idx = this.categories.findIndex((c) => c.id === category.id);
          if (idx !== -1) this.categories.splice(idx, 1);
        }
        // If the user was viewing the deleted category, navigate to its parent
        if (this.selectedCategoryId === category.id) {
          this.selectedCategoryId = category.parent_id ?? null;
        }
        await this.fetchData();
      } catch (err) {
        console.error('Error deleting category:', err);
        alert(`Erreur lors de la suppression: ${err.message}`);
      }
    }
  },
};
