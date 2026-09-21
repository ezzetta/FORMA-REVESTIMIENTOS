document.querySelectorAll('.js-add-product').forEach(button => {
  button.addEventListener('click', () => {
    const stored = JSON.parse(localStorage.getItem('forma-selection') || '[]');
    if (!stored.includes(button.dataset.id)) stored.push(button.dataset.id);
    localStorage.setItem('forma-selection', JSON.stringify(stored));
    const toast = document.createElement('div');
    toast.className = 'selection-toast';
    toast.textContent = `${button.dataset.name} se agregó a tu selección.`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  });
});
