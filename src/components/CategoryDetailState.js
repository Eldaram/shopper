export class CategoryDetailState {
  constructor(vm) {
    this.vm = vm;
  }
  isCreateMode() {
    return false;
  }
  isEditMode() {
    return false;
  }
  isViewMode() {
    return false;
  }
  isEditable() {
    return false;
  }
  isImageClickable() {
    return false;
  }
  showDeleteImageButton() {
    return false;
  }
  getBadgeText() {
    return '';
  }
  getTitle() {
    return '';
  }

  handleEdit() {}
  handleCancel() {}
  handleSubmit() {}
}

export class EditState extends CategoryDetailState {
  isEditMode() {
    return true;
  }
  isEditable() {
    return true;
  }
  isImageClickable() {
    return true;
  }
  showDeleteImageButton() {
    return true;
  }
  getBadgeText() {
    return this.vm.$t('edit_mode');
  }
  getTitle() {
    return this.vm.$t('edit_category');
  }

  async handleCancel() {
    if (this.vm.isFormDirty()) {
      const proceed = await this.vm.confirmDiscardChanges();
      if (!proceed) return;
    }
    this.vm.initForm();
    this.vm.$emit('close');
  }

  async handleSubmit() {
    await this.vm.handleSave();
  }
}

export class CreateState extends CategoryDetailState {
  isCreateMode() {
    return true;
  }
  isEditable() {
    return true;
  }
  isImageClickable() {
    return true;
  }
  showDeleteImageButton() {
    return true;
  }
  getBadgeText() {
    return this.vm.$t('create_mode');
  }
  getTitle() {
    return this.vm.$t('create_category');
  }

  handleCancel() {
    this.vm.$emit('close');
  }

  async handleSubmit() {
    await this.vm.handleSave();
  }
}
