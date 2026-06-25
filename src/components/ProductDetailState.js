export class ProductDetailState {
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

export class ViewState extends ProductDetailState {
  isViewMode() {
    return true;
  }
  getBadgeText() {
    return this.vm.$t('view_mode');
  }
  getTitle() {
    return this.vm.$t('product_details');
  }

  handleEdit() {
    this.vm.transitionTo('edit');
  }

  handleCancel() {
    this.vm.$emit('close');
  }
}

export class EditState extends ProductDetailState {
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
    return this.vm.$t('edit_product');
  }

  async handleCancel() {
    if (this.vm.isFormDirty()) {
      const proceed = await this.vm.confirmDiscardChanges();
      if (!proceed) return;
    }
    this.vm.initForm();
    this.vm.transitionTo('view');
  }

  async handleSubmit() {
    await this.vm.handleSave();
  }
}

export class CreateState extends ProductDetailState {
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
    return this.vm.$t('create_product');
  }

  async handleCancel() {
    if (this.vm.isFormDirty()) {
      const proceed = await this.vm.confirmDiscardChanges();
      if (!proceed) return;
    }
    this.vm.$emit('close');
  }

  async handleSubmit() {
    await this.vm.handleSave();
  }
}
