document.addEventListener('DOMContentLoaded', function() {
  const ordersList = document.getElementById('orders-list');
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('orders')) || [];
  } catch (e) {
    orders = [];
  }

  function getStatusClass(status) {
    if (status === 'pending') return 'order-status pending';
    if (status === 'ongoing') return 'order-status ongoing';
    if (status === 'complete' || status === 'completed') return 'order-status completed';
    return 'order-status';
  }

  function renderOrders() {
    ordersList.innerHTML = '';
    if (orders.length === 0) {
      ordersList.innerHTML = '<div style="color:#233754;font-size:1.2rem;">No orders found.</div>';
      return;
    }
    orders.forEach(order => {
      const card = document.createElement('div');
      card.className = 'order-card';
      card.innerHTML = `
        <div class="order-id">#${order.id || ''}</div>
        <div class="order-date">${order.date || ''}</div>
        <div class="${getStatusClass(order.status)}">${order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : ''}</div>
        <div class="order-name"><b>${order.name || ''}</b></div>
        <div class="order-type">${order.service || ''}</div>
        <div class="order-price">₱ ${order.amount || '0'}</div>
        <div class="order-card-bottom">
          <span>Paid: ₱ ${order.paid || '0'}</span><br/>
          <span>Balance: ₱ ${order.balance || '0'}</span>
        </div>
      `;
      ordersList.appendChild(card);
    });
  }

  renderOrders();
}); 