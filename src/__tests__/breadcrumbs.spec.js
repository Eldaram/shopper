// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { mount, config } from '@vue/test-utils';
import Breadcrumbs from '../components/Breadcrumbs.vue';

config.global.mocks = config.global.mocks || {};
config.global.mocks.$t = (key) => {
  const translations = {
    all_catalogue: 'Tout le catalogue',
    create_category: 'Créer une catégorie',
  };
  return translations[key] || key;
};

describe('Breadcrumbs.vue Path Computation', () => {
  const categoriesMock = [
    { id: 1, name: 'Épicerie', parent_id: null },
    { id: 2, name: 'Boissons', parent_id: null },
    { id: 3, name: 'Sodas', parent_id: 2 },
    { id: 4, name: 'Colas', parent_id: 3 },
  ];

  it('should render only Root Home when selectedCategoryId is null and no edit focus', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        categories: categoriesMock,
        selectedCategoryId: null,
      },
    });

    const items = wrapper.vm.path;
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ name: 'Tout le catalogue', type: 'home' });
  });

  it('should compute the correct path for a deep category hierarchy in catalog view', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        categories: categoriesMock,
        selectedCategoryId: 4,
      },
    });

    const items = wrapper.vm.path;
    expect(items).toHaveLength(4);
    expect(items[0]).toEqual({ name: 'Tout le catalogue', type: 'home' });
    expect(items[1]).toEqual({ id: 2, name: 'Boissons', type: 'category' });
    expect(items[2]).toEqual({ id: 3, name: 'Sodas', type: 'category' });
    expect(items[3]).toEqual({ id: 4, name: 'Colas', type: 'category' });
  });

  it('should not duplicate category when focused category is active (editing the category)', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        categories: categoriesMock,
        selectedCategoryId: 3,
        focusedCategory: { id: 3, name: 'Sodas', parent_id: 2 },
      },
    });

    const items = wrapper.vm.path;
    // Expected: home > Boissons > Sodas
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ name: 'Tout le catalogue', type: 'home' });
    expect(items[1]).toEqual({ id: 2, name: 'Boissons', type: 'category' });
    expect(items[2]).toEqual({ name: 'Sodas', type: 'category-detail' });
  });

  it('should compute hierarchy based on focusedCategory parent even if selectedCategoryId is different', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        categories: categoriesMock,
        selectedCategoryId: 1, // User was in "Épicerie"
        focusedCategory: { id: 3, name: 'Sodas', parent_id: 2 }, // But editing Sodas (parent Boissons)
      },
    });

    const items = wrapper.vm.path;
    // Expected: home > Boissons > Sodas (from focusedCategory's parent hierarchy)
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ name: 'Tout le catalogue', type: 'home' });
    expect(items[1]).toEqual({ id: 2, name: 'Boissons', type: 'category' });
    expect(items[2]).toEqual({ name: 'Sodas', type: 'category-detail' });
  });

  it('should render parent path plus Create Category when creating a category', () => {
    const wrapper = mount(Breadcrumbs, {
      props: {
        categories: categoriesMock,
        selectedCategoryId: 3,
        isCreatingCategory: true,
      },
    });

    const items = wrapper.vm.path;
    // Expected: home > Boissons > Sodas > Créer une catégorie
    expect(items).toHaveLength(4);
    expect(items[0]).toEqual({ name: 'Tout le catalogue', type: 'home' });
    expect(items[1]).toEqual({ id: 2, name: 'Boissons', type: 'category' });
    expect(items[2]).toEqual({ id: 3, name: 'Sodas', type: 'category' });
    expect(items[3]).toEqual({ name: 'Créer une catégorie', type: 'category-detail' });
  });
});
