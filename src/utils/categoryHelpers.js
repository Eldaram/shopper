export function initForm(vm) {
  vm.imageLoadError = false;
  if (vm.currentStateName === 'create') {
    vm.localCategory = {
      name: '',
      parent_id: vm.preselectedParentId || null,
      image_path: null,
      image_preview: null,
    };
  } else if (vm.category) {
    vm.localCategory = {
      name: vm.category.name || '',
      parent_id: vm.category.parent_id || null,
      image_path: vm.category.image_path || null,
      image_preview: null,
    };
  }
}

export function getFormData(localCategory) {
  return {
    name: localCategory.name,
    parent_id: localCategory.parent_id,
    image_path: localCategory.image_path,
    image_preview: localCategory.image_preview,
  };
}

export function getInitialCategoryState(vm) {
  if (vm.currentStateName === 'create') {
    return {
      name: '',
      parent_id: vm.preselectedParentId || null,
      image_path: null,
    };
  } else if (vm.category) {
    return {
      name: vm.category.name || '',
      parent_id: vm.category.parent_id || null,
      image_path: vm.category.image_path || null,
    };
  }
  return {};
}

export function checkIfFormDirty(localCategory, initial) {
  return (
    (localCategory.name || '').trim() !== (initial.name || '').trim() ||
    localCategory.parent_id !== initial.parent_id ||
    localCategory.image_path !== initial.image_path
  );
}

export async function handleSave(vm) {
  if (!vm.localCategory.name?.trim()) {
    alert('Le nom de la catégorie est requis.');
    return;
  }

  // A category cannot be its own parent
  if (
    vm.currentStateName === 'edit' &&
    vm.category &&
    Number(vm.localCategory.parent_id) === Number(vm.category.id)
  ) {
    alert('Une catégorie ne peut pas être sa propre catégorie parente.');
    return;
  }

  try {
    let finalImagePath = null;
    if (vm.localCategory.image_path) {
      if (window.electronAPI && typeof window.electronAPI.saveImage === 'function') {
        if (
          vm.localCategory.image_path.startsWith('media://') ||
          vm.localCategory.image_path.startsWith('http://') ||
          vm.localCategory.image_path.startsWith('https://')
        ) {
          finalImagePath = vm.localCategory.image_path;
        } else if (vm.localCategory.image_path !== 'mock-path-for-testing') {
          finalImagePath = await window.electronAPI.saveImage(vm.localCategory.image_path);
        } else {
          finalImagePath = 'mock-image.png';
        }
      } else {
        finalImagePath = vm.localCategory.image_preview || 'mock-image.png';
      }
    }

    const categoryData = {
      name: vm.localCategory.name.trim(),
      parent_id: vm.localCategory.parent_id ? Number(vm.localCategory.parent_id) : null,
      image_path: finalImagePath,
    };

    if (vm.currentStateName === 'create') {
      let newId;
      if (window.electronAPI && typeof window.electronAPI.createCategory === 'function') {
        newId = await window.electronAPI.createCategory(categoryData);
      } else {
        newId = Date.now();
      }
      vm.$emit('category-created', { ...categoryData, id: newId });
    } else {
      if (window.electronAPI && typeof window.electronAPI.updateCategory === 'function') {
        await window.electronAPI.updateCategory(vm.category.id, categoryData);
      }
      vm.$emit('category-updated', vm.category.id);
      vm.transitionTo('view');
    }
  } catch (err) {
    console.error('Error saving category:', err);
    alert(`Erreur lors de l'enregistrement de la catégorie: ${err.message}`);
  }
}
