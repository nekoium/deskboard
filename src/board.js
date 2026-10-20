let isEditMode = false;
let images = [];
let selectedImage = null;
let isDragging = false;
let isResizing = false;
let isRotating = false;
let dragStartPos = { x: 0, y: 0 };
let dragStartImagePos = { x: 0, y: 0 };
let resizeStartSize = { width: 0, height: 0 };
let rotateStartAngle = 0;
let contextMenu = null;

const overlay = document.getElementById('overlay');
const board = document.getElementById('board');

// Initialize
async function init() {
  const data = await window.api.getBoardData();
  images = data.images || [];
  renderImages();

  // Listen for edit mode toggle
  window.api.onToggleEditMode((editMode) => {
    isEditMode = editMode;
    overlay.classList.toggle('edit-mode', editMode);
    
    if (!editMode) {
      deselectImage();
      hideContextMenu();
    }
    
    updateInteractivity();
  });

  // Listen for new images added from tray
  window.api.onImageAdded(async (imageData) => {
    const imagePath = await window.api.getImagePath(imageData.filename);
    
    const newImage = {
      id: imageData.id,
      filename: imageData.filename,
      x: window.innerWidth / 2 - 150,
      y: window.innerHeight / 2 - 150,
      width: 300,
      height: 300,
      rotation: 0,
    };
    
    images.push(newImage);
    renderImages();
    saveBoard();
  });

  // Save before quit
  window.api.onSaveBeforeQuit(() => {
    saveBoard();
  });

  // Handle drag and drop
  board.addEventListener('dragover', (e) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  board.addEventListener('drop', async (e) => {
    if (!isEditMode) return;
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    for (const file of files) {
      // Copy file to images directory
      const filename = await window.api.copyImageFile(file.path);
      
      const newImage = {
        id: Date.now() + Math.random(),
        filename: filename,
        x: e.clientX - 150,
        y: e.clientY - 150,
        width: 300,
        height: 300,
        rotation: 0,
      };
      
      images.push(newImage);
      renderImages();
      saveBoard();
      
      // Wait a bit between files to ensure unique IDs
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  });

  // Handle keyboard
  document.addEventListener('keydown', (e) => {
    if (!isEditMode) return;
    
    if (e.key === 'Delete' && selectedImage) {
      removeImage(selectedImage);
    } else if (e.key === 'Escape') {
      deselectImage();
      hideContextMenu();
    }
  });

  // Click on empty space to deselect
  board.addEventListener('mousedown', (e) => {
    if (!isEditMode) return;
    if (e.target === board) {
      deselectImage();
      hideContextMenu();
    }
  });

  // Hide context menu on any click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu')) {
      hideContextMenu();
    }
  });
}

function renderImages() {
  board.innerHTML = '';
  
  images.forEach(image => {
    const container = createImageElement(image);
    board.appendChild(container);
  });
}

async function createImageElement(image) {
  const container = document.createElement('div');
  container.className = 'image-container';
  container.dataset.id = image.id;
  container.style.left = `${image.x}px`;
  container.style.top = `${image.y}px`;
  container.style.width = `${image.width}px`;
  container.style.height = `${image.height}px`;
  container.style.transform = `rotate(${image.rotation}deg)`;

  const img = document.createElement('img');
  const imagePath = await window.api.getImagePath(image.filename);
  img.src = imagePath;
  container.appendChild(img);

  if (isEditMode) {
    // Resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle bottom-right';
    container.appendChild(resizeHandle);

    // Rotate handle
    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'rotate-handle';
    container.appendChild(rotateHandle);

    // Event listeners
    container.addEventListener('mousedown', (e) => handleImageMouseDown(e, image));
    resizeHandle.addEventListener('mousedown', (e) => handleResizeStart(e, image));
    rotateHandle.addEventListener('mousedown', (e) => handleRotateStart(e, image));
    container.addEventListener('contextmenu', (e) => handleContextMenu(e, image));
  }

  if (selectedImage && selectedImage.id === image.id) {
    container.classList.add('selected');
  }

  return container;
}

function handleImageMouseDown(e, image) {
  if (!isEditMode) return;
  if (e.target.classList.contains('resize-handle') || e.target.classList.contains('rotate-handle')) {
    return;
  }

  e.stopPropagation();
  selectImage(image);

  isDragging = true;
  dragStartPos = { x: e.clientX, y: e.clientY };
  dragStartImagePos = { x: image.x, y: image.y };

  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', handleDragEnd);
}

function handleDrag(e) {
  if (!isDragging || !selectedImage) return;

  const dx = e.clientX - dragStartPos.x;
  const dy = e.clientY - dragStartPos.y;

  selectedImage.x = dragStartImagePos.x + dx;
  selectedImage.y = dragStartImagePos.y + dy;

  updateImageElement(selectedImage);
}

function handleDragEnd() {
  if (isDragging) {
    isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    saveBoard();
  }
}

function handleResizeStart(e, image) {
  e.stopPropagation();
  isResizing = true;
  selectedImage = image;
  dragStartPos = { x: e.clientX, y: e.clientY };
  resizeStartSize = { width: image.width, height: image.height };

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', handleResizeEnd);
}

function handleResize(e) {
  if (!isResizing || !selectedImage) return;

  const dx = e.clientX - dragStartPos.x;
  const dy = e.clientY - dragStartPos.y;

  // Maintain aspect ratio
  const delta = Math.max(dx, dy);
  selectedImage.width = Math.max(50, resizeStartSize.width + delta);
  selectedImage.height = Math.max(50, resizeStartSize.height + delta);

  updateImageElement(selectedImage);
}

function handleResizeEnd() {
  if (isResizing) {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
    saveBoard();
  }
}

function handleRotateStart(e, image) {
  e.stopPropagation();
  isRotating = true;
  selectedImage = image;
  
  const rect = e.target.closest('.image-container').getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  rotateStartAngle = angle - (image.rotation * Math.PI / 180);

  document.addEventListener('mousemove', handleRotate);
  document.addEventListener('mouseup', handleRotateEnd);
}

function handleRotate(e) {
  if (!isRotating || !selectedImage) return;

  const container = document.querySelector(`[data-id="${selectedImage.id}"]`);
  const rect = container.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  let rotation = (angle - rotateStartAngle) * 180 / Math.PI;
  
  // Snap to 0, 90, 180, 270
  const snapAngle = Math.round(rotation / 90) * 90;
  if (Math.abs(rotation - snapAngle) < 10) {
    rotation = snapAngle;
  }
  
  selectedImage.rotation = rotation % 360;
  updateImageElement(selectedImage);
}

function handleRotateEnd() {
  if (isRotating) {
    isRotating = false;
    document.removeEventListener('mousemove', handleRotate);
    document.removeEventListener('mouseup', handleRotateEnd);
    saveBoard();
  }
}

function handleContextMenu(e, image) {
  if (!isEditMode) return;
  e.preventDefault();
  selectImage(image);
  showContextMenu(e.clientX, e.clientY, image);
}

function showContextMenu(x, y, image) {
  hideContextMenu();

  contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu';
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;

  const items = [
    { label: 'Remove', action: () => removeImage(image) },
  ];

  items.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'context-menu-item';
    menuItem.textContent = item.label;
    menuItem.addEventListener('click', () => {
      item.action();
      hideContextMenu();
    });
    contextMenu.appendChild(menuItem);
  });

  document.body.appendChild(contextMenu);
}

function hideContextMenu() {
  if (contextMenu) {
    contextMenu.remove();
    contextMenu = null;
  }
}

function selectImage(image) {
  selectedImage = image;
  renderImages();
}

function deselectImage() {
  selectedImage = null;
  renderImages();
}

function updateImageElement(image) {
  const container = document.querySelector(`[data-id="${image.id}"]`);
  if (container) {
    container.style.left = `${image.x}px`;
    container.style.top = `${image.y}px`;
    container.style.width = `${image.width}px`;
    container.style.height = `${image.height}px`;
    container.style.transform = `rotate(${image.rotation}deg)`;
  }
}

async function removeImage(image) {
  images = images.filter(img => img.id !== image.id);
  await window.api.deleteImage(image.filename);
  selectedImage = null;
  renderImages();
  saveBoard();
}

function updateInteractivity() {
  const containers = document.querySelectorAll('.image-container');
  containers.forEach(container => {
    if (isEditMode) {
      container.style.pointerEvents = 'auto';
    } else {
      container.style.pointerEvents = 'none';
    }
  });
}

async function saveBoard() {
  await window.api.saveBoardData({ images });
}

// Start the app
init();
