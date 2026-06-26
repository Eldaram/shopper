export async function selectImage() {
  if (window.electronAPI && typeof window.electronAPI.selectImage === 'function') {
    return await window.electronAPI.selectImage();
  } else {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          resolve({
            path: 'mock-path-for-testing',
            preview: URL.createObjectURL(file),
          });
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }
}

export function dropImage(file) {
  if (file && file.type.startsWith('image/')) {
    return {
      path: file.path || 'mock-path-for-testing',
      preview: URL.createObjectURL(file),
    };
  }
  return null;
}
