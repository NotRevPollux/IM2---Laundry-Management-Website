document.addEventListener('DOMContentLoaded', function() {
  const addOrderBtn = document.getElementById('addOrderBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const modal = document.querySelector('.modal');
  const modalForm = document.querySelector('.modal-form');
  const ordersRow = document.querySelector('.dashboard-orders-row');
  let orderIdCounter = 1;
  let currentBalance = 0;
  let currentUnpaid = 0;
  const balanceAmountElem = document.getElementById('balance-amount');
  const unpaidAmountElem = document.getElementById('unpaid-amount');
  if (balanceAmountElem) {
    balanceAmountElem.textContent = `₱ ${currentBalance}`;
  }
  if (unpaidAmountElem) {
    unpaidAmountElem.textContent = `₱ ${currentUnpaid}`;
  }

  let editingOrderCard = null;
  let ordersData = [];

  const servicePrices = {
    'Regular Laundry': 60,
    'Wash and Fold': 65,
    'Dry Cleaning': 250,
    'Iron and Press': 70
  };

  function recalculateTotals() {
    let totalAmount = 0;
    let totalUnpaid = 0;
    for (const order of ordersData) {
      const amt = parseInt(order.amount, 10);
      const unp = parseInt(order.balance, 10);
      if (!isNaN(amt)) totalAmount += amt;
      if (!isNaN(unp)) totalUnpaid += unp;
    }
    currentBalance = totalAmount;
    currentUnpaid = totalUnpaid;
    if (balanceAmountElem) balanceAmountElem.textContent = `₱ ${currentBalance}`;
    if (unpaidAmountElem) unpaidAmountElem.textContent = `₱ ${currentUnpaid}`;
  }

  function updateAmountField() {
    const service = modalForm.querySelector('#service').value;
    const load = parseInt(modalForm.querySelector('#load').value, 10) || 0;
    const pricePerKilo = servicePrices[service] || 0;
    const amount = pricePerKilo * load;
    modalForm.querySelector('#amount').value = amount > 0 ? amount : '';
    updateBalanceField();
  }

  addOrderBtn.addEventListener('click', function() {
    editingOrderCard = null;
    modalOverlay.classList.remove('hidden');
    modal.querySelector('h2').textContent = 'New Customer';
    modalForm.querySelector('.modal-add').textContent = 'Add';
    modalForm.reset();
    setTimeout(updateAmountField, 0);
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

  function updateBalanceField() {
    const amount = parseInt(modalForm.querySelector('#amount').value, 10) || 0;
    const paid = parseInt(modalForm.querySelector('#paid').value, 10) || 0;
    const balance = amount - paid;
    modalForm.querySelector('#balance').value = balance > 0 ? balance : 0;
  }
  modalForm.querySelector('#amount').addEventListener('input', updateBalanceField);
  modalForm.querySelector('#paid').addEventListener('input', updateBalanceField);
  modalForm.querySelector('#service').addEventListener('change', updateAmountField);
  modalForm.querySelector('#load').addEventListener('input', updateAmountField);

  function createOrderCard(data, index) {
    const statusObj = getStatusClassAndText(data.statusValue);
    const newCard = document.createElement('div');
    newCard.className = 'order-card';
    newCard.innerHTML = `
      <div class="order-status ${statusObj.class}">${statusObj.text}</div>
      <div class="order-id">#${data.orderId}</div>
      <div class="order-date">${formatDate(data.dateValue)}</div>
      <div class="order-main-row">
        <div class="order-main-left">
          <div class="order-name">${data.name}</div>
          <div class="order-type">${data.service}</div>
          <div class="order-price">₱ ${data.amount}</div>
        </div>
        <div class="order-main-right order-card-bottom">
          <div class="order-paid">Paid: ₱ ${data.paid}</div>
          <div class="order-balance">Balance: ₱ ${data.balance}</div>
        </div>
      </div>
      <button class="order-update">Edit</button>
    `;
    newCard.dataset.index = index;
    newCard.querySelector('.order-update').addEventListener('click', function() {
      editingOrderCard = newCard;
      modalOverlay.classList.remove('hidden');
      modal.querySelector('h2').textContent = 'Edit Customer';
      modalForm.querySelector('.modal-add').textContent = 'Update';
      const order = ordersData[index];
      modalForm.querySelector('#name').value = order.name;
      modalForm.querySelector('#status').value = order.statusValue;
      modalForm.querySelector('#service').value = order.service;
      modalForm.querySelector('#load').value = order.load;
      modalForm.querySelector('#amount').value = order.amount;
      modalForm.querySelector('#paid').value = order.paid;
      modalForm.querySelector('#balance').value = order.balance;
      modalForm.querySelector('#date').value = order.dateValue;
      setTimeout(updateAmountField, 0);
    });
    return newCard;
  }

  function updateStatusCounters() {
    let pending = 0, ongoing = 0, completed = 0;
    for (const order of ordersData) {
      if (order.statusValue === 'pending') pending++;
      else if (order.statusValue === 'ongoing') ongoing++;
      else if (order.statusValue === 'complete') completed++;
    }
    const statusCounts = document.querySelectorAll('.status-count');
    if (statusCounts.length >= 3) {
      statusCounts[0].textContent = pending;
      statusCounts[1].textContent = ongoing;
      statusCounts[2].textContent = completed;
    }
  }

  function renderOrders() {
    Array.from(ordersRow.children).forEach(child => {
      if (!child.classList.contains('add-order-card')) child.remove();
    });
    ordersData.forEach((order, idx) => {
      const card = createOrderCard(order, idx);
      ordersRow.appendChild(card);
    });
    recalculateTotals();
    updateStatusCounters();
  }

  if (modalForm) {
    modalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = modalForm.querySelector('#name').value;
      const statusValue = modalForm.querySelector('#status').value;
      const service = modalForm.querySelector('#service').value;
      const load = modalForm.querySelector('#load').value;
      const amount = modalForm.querySelector('#amount').value;
      const paid = modalForm.querySelector('#paid').value;
      const balance = modalForm.querySelector('#balance').value;
      const dateValue = modalForm.querySelector('#date').value;
      if (editingOrderCard) {
        const idx = parseInt(editingOrderCard.dataset.index, 10);
        ordersData[idx] = { name, statusValue, service, load, amount, paid, balance, dateValue, orderId: ordersData[idx].orderId };
        editingOrderCard = null;
        renderOrders();
        modalForm.reset();
        modalOverlay.classList.add('hidden');
        return;
      }
      const orderId = String(orderIdCounter).padStart(5, '0');
      ordersData.push({ name, statusValue, service, load, amount, paid, balance, dateValue, orderId });
      orderIdCounter++;
      renderOrders();
      modalForm.reset();
      modalOverlay.classList.add('hidden');
    });
  }


  const statusCounts = document.querySelectorAll('.status-count');
  statusCounts.forEach(el => el.textContent = '0');
}); 