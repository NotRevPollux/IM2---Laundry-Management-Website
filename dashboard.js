document.addEventListener('DOMContentLoaded', function() {
  const addOrderBtn = document.getElementById('addOrderBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const modal = document.querySelector('.modal');
  const modalForm = document.querySelector('.modal-form');
  const ordersRow = document.querySelector('.dashboard-orders-row');
  let orderIdCounter = 1;

  addOrderBtn.addEventListener('click', function() {
    modalOverlay.classList.remove('hidden');
  });

  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) {
      modalOverlay.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      modalOverlay.classList.add('hidden');
    }
  });

  Array.from(document.querySelectorAll('.order-update')).forEach(btn => {
    btn.textContent = 'Edit';
  });

  function formatDate(inputDate) {
    const date = new Date(inputDate);
    const options = { month: 'long', day: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  function getStatusClassAndText(statusValue) {
    if (statusValue === 'pending') return { class: 'pending', text: 'Pending' };
    if (statusValue === 'ongoing') return { class: 'ongoing', text: 'Ongoing' };
    if (statusValue === 'complete') return { class: 'completed', text: 'Complete' };
    return { class: 'pending', text: 'Pending' };
  }

  if (modalForm) {
    modalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = modalForm.querySelector('#name').value;
      const statusValue = modalForm.querySelector('#status').value;
      const service = modalForm.querySelector('#service').value;
      const load = modalForm.querySelector('#load').value;
      const amount = modalForm.querySelector('#amount').value;
      const balance = modalForm.querySelector('#balance').value;
      const dateValue = modalForm.querySelector('#date').value;
      const statusObj = getStatusClassAndText(statusValue);
      const newCard = document.createElement('div');
      newCard.className = 'order-card';
      newCard.innerHTML = `
        <div class="order-status ${statusObj.class}">${statusObj.text}</div>
        <div class="order-id">#${String(orderIdCounter).padStart(5, '0')}</div>
        <div class="order-date">${formatDate(dateValue)}</div>
        <div class="order-name">${name}</div>
        <div class="order-type">${service}</div>
        <div class="order-price">₱ ${amount}</div>
        <button class="order-update">Edit</button>
      `;
      ordersRow.appendChild(newCard);
      orderIdCounter++;
      modalForm.reset();
      modalOverlay.classList.add('hidden');
    });
  }
}); 