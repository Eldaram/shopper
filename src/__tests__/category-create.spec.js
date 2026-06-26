// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, config } from '@vue/test-utils';
import { i18n } from '../utils/i18n';
import CategoryDetail from '../components/CategoryDetail.vue';
import { getParentCategoryOptions } from '../utils/categoryTreeHelpers.js';

config.global.mocks = config.global.mocks || {};
config.global.mocks.$t = (key) => i18n.t(key);
config.global.mocks.$currentLang = 'fr';

const mockElectronAPI = {
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  selectImage: vi.fn(),
  saveImage: vi.fn(),
  showExitConfirmationDialog: vi.fn(),
  confirmDeleteCategory: vi.fn(),
  setDeleteItemState: vi.fn(),
};

globalThis.window = globalThis.window || {};
globalThis.window.electronAPI = mockElectronAPI;

describe('Category Manual Creation & Edition Tests', () => {
  const categoriesMock = [
    { id: 1, name: 'Épicerie', parent_id: null },
    { id: 2, name: 'Boissons', parent_id: null },
    { id: 3, name: 'Sodas', parent_id: 2 },
    { id: 4, name: 'Colas', parent_id: 3 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getParentCategoryOptions Tree Helper', () => {
    it('should return all categories for creation mode (no current ID)', () => {
      const opts = getParentCategoryOptions(categoriesMock, null);
      expect(opts).toHaveLength(4);
      expect(opts[0].name).toBe('Épicerie');
      expect(opts[1].name).toBe('Boissons');
      expect(opts[2].name).toBe('Sodas');
      expect(opts[3].name).toBe('Colas');
    });

    it('should filter out the current category and its descendants to prevent cycles', () => {
      // If we edit 'Boissons' (ID: 2), its descendants ('Sodas' ID: 3, 'Colas' ID: 4)
      // and 'Boissons' itself must be excluded from the options.
      const opts = getParentCategoryOptions(categoriesMock, 2);
      expect(opts).toHaveLength(1);
      expect(opts[0].id).toBe(1);
      expect(opts[0].name).toBe('Épicerie');
    });

    it('should filter out descendant category only', () => {
      // If we edit 'Sodas' (ID: 3), then 'Sodas' (ID: 3) and its descendant 'Colas' (ID: 4)
      // should be excluded, leaving 'Épicerie' (ID: 1) and 'Boissons' (ID: 2)
      const opts = getParentCategoryOptions(categoriesMock, 3);
      expect(opts).toHaveLength(2);
      expect(opts.map(o => o.id)).toContain(1);
      expect(opts.map(o => o.id)).toContain(2);
    });
  });

  describe('CategoryDetail.vue Component', () => {
    it('should initialize with empty state in create mode', () => {
      const wrapper = mount(CategoryDetail, {
        props: {
          mode: 'create',
          categories: categoriesMock,
          preselectedParentId: 2,
        },
      });

      expect(wrapper.vm.localCategory.name).toBe('');
      expect(wrapper.vm.localCategory.parent_id).toBe(2);
      expect(wrapper.vm.localCategory.image_path).toBeNull();
    });

    it('should initialize with category details in edit mode', () => {
      const wrapper = mount(CategoryDetail, {
        props: {
          mode: 'edit',
          category: { id: 3, name: 'Sodas', parent_id: 2, image_path: 'media://img_sodas.png' },
          categories: categoriesMock,
        },
      });

      expect(wrapper.vm.localCategory.name).toBe('Sodas');
      expect(wrapper.vm.localCategory.parent_id).toBe(2);
      expect(wrapper.vm.localCategory.image_path).toBe('media://img_sodas.png');
    });

    it('should detect dirty state when changes are made', async () => {
      const wrapper = mount(CategoryDetail, {
        props: {
          mode: 'edit',
          category: { id: 3, name: 'Sodas', parent_id: 2, image_path: null },
          categories: categoriesMock,
        },
      });

      expect(wrapper.vm.isFormDirty()).toBe(false);

      wrapper.vm.localCategory.name = 'Super Sodas';
      expect(wrapper.vm.isFormDirty()).toBe(true);
    });

    it('should emit category-created on save in create mode', async () => {
      mockElectronAPI.createCategory.mockResolvedValue(100);
      mockElectronAPI.saveImage.mockResolvedValue('media://img_100.png');

      const wrapper = mount(CategoryDetail, {
        props: {
          mode: 'create',
          categories: categoriesMock,
          preselectedParentId: null,
        },
      });

      wrapper.vm.localCategory.name = 'Nouveautés';
      wrapper.vm.localCategory.parent_id = 1;
      wrapper.vm.localCategory.image_path = 'c:\\tmp\\someimage.png';

      await wrapper.vm.handleSave();

      expect(mockElectronAPI.saveImage).toHaveBeenCalledWith('c:\\tmp\\someimage.png');
      expect(mockElectronAPI.createCategory).toHaveBeenCalledWith({
        name: 'Nouveautés',
        parent_id: 1,
        image_path: 'media://img_100.png',
      });
      expect(wrapper.emitted('category-created')).toBeTruthy();
      expect(wrapper.emitted('category-created')[0][0]).toEqual({
        id: 100,
        name: 'Nouveautés',
        parent_id: 1,
        image_path: 'media://img_100.png',
      });
    });

    it('should emit category-updated on save in edit mode', async () => {
      mockElectronAPI.updateCategory.mockResolvedValue(true);

      const wrapper = mount(CategoryDetail, {
        props: {
          mode: 'edit',
          category: { id: 3, name: 'Sodas', parent_id: 2, image_path: 'media://img_sodas.png' },
          categories: categoriesMock,
        },
      });

      wrapper.vm.localCategory.name = 'Sodas Light';
      await wrapper.vm.handleSave();

      expect(mockElectronAPI.updateCategory).toHaveBeenCalledWith(3, {
        name: 'Sodas Light',
        parent_id: 2,
        image_path: 'media://img_sodas.png',
      });
      expect(wrapper.emitted('category-updated')).toBeTruthy();
      expect(wrapper.emitted('category-updated')[0][0]).toBe(3);
    });

    it('should prevent category from referencing itself as parent', async () => {
      const spyAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const wrapper = mount(CategoryDetail, {
        props: {
          mode: 'edit',
          category: { id: 3, name: 'Sodas', parent_id: 2, image_path: null },
          categories: categoriesMock,
        },
      });

      wrapper.vm.localCategory.parent_id = 3; // Self referencing
      await wrapper.vm.handleSave();

      expect(spyAlert).toHaveBeenCalledWith('Une catégorie ne peut pas être sa propre catégorie parente.');
      expect(mockElectronAPI.updateCategory).not.toHaveBeenCalled();
    });

    it('should call exit confirmation dialog with category parameter when discarding changes', async () => {
      mockElectronAPI.showExitConfirmationDialog.mockResolvedValue(0); // 0 = Abandonner

      const wrapper = mount(CategoryDetail, {
        props: {
          mode: 'edit',
          category: { id: 3, name: 'Sodas', parent_id: 2, image_path: null },
          categories: categoriesMock,
        },
      });

      const shouldDiscard = await wrapper.vm.confirmDiscardChanges();

      expect(mockElectronAPI.showExitConfirmationDialog).toHaveBeenCalledWith('category');
      expect(shouldDiscard).toBe(true);
    });

    it('should return false if user cancels the exit confirmation', async () => {
      mockElectronAPI.showExitConfirmationDialog.mockResolvedValue(1); // 1 = Rester

      const wrapper = mount(CategoryDetail, {
        props: {
          mode: 'edit',
          category: { id: 3, name: 'Sodas', parent_id: 2, image_path: null },
          categories: categoriesMock,
        },
      });

      const shouldDiscard = await wrapper.vm.confirmDiscardChanges();

      expect(mockElectronAPI.showExitConfirmationDialog).toHaveBeenCalledWith('category');
      expect(shouldDiscard).toBe(false);
    });

    it('should emit close on handleCancel in edit mode if changes are discarded', async () => {
      mockElectronAPI.showExitConfirmationDialog.mockResolvedValue(0); // 0 = Abandonner

      const wrapper = mount(CategoryDetail, {
        props: {
          mode: 'edit',
          category: { id: 3, name: 'Sodas', parent_id: 2, image_path: null },
          categories: categoriesMock,
        },
      });

      // Modify form so it's dirty
      wrapper.vm.localCategory.name = 'Dirty Soda';
      
      await wrapper.vm.handleCancel();

      expect(mockElectronAPI.showExitConfirmationDialog).toHaveBeenCalledWith('category');
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });
});
