import { reactive } from 'vue';

export const draftState = reactive({
  draftProduct: null,
});

export function saveDraft(productFormData) {
  draftState.draftProduct = productFormData;
}

export function clearDraft() {
  draftState.draftProduct = null;
}
