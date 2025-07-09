document.addEventListener('DOMContentLoaded', function() {

  const dashboardSection = document.getElementById('dashboard-section');
  const ordersSection = document.getElementById('orders-section');
  const customersSection = document.getElementById('customers-section');
  const suppliesSection = document.getElementById('supplies-section');
  const staffSection = document.getElementById('staff-section');
  const navDashboard = document.getElementById('nav-dashboard');
  const navOrders = document.getElementById('nav-orders');
  const navCustomers = document.getElementById('nav-customers');
  const navSupplies = document.getElementById('nav-supplies');
  const navStaff = document.getElementById('nav-staff');
  const sidebarBtns = document.querySelectorAll('.sidebar-btn');

  // Determine if user is admin
  let userEmail = localStorage.getItem('userEmail');
  const navAccounts = document.getElementById('nav-accounts');
  const navSales = document.getElementById('nav-sales');
  const accountsSection = document.getElementById('accounts-section');
  const salesSection = document.getElementById('sales-section');

  if (userEmail === 'admin@albaani') {
    if (navAccounts) navAccounts.style.display = '';
    if (navSales) navSales.style.display = '';
    // Change 'Staff' label to 'Admin' (text node only)
    if (navStaff) {
      // Find the text node after the sidebar-icon span
      const children = Array.from(navStaff.childNodes);
      for (let i = 0; i < children.length; i++) {
        if (children[i].nodeType === Node.TEXT_NODE && children[i].textContent.includes('Staff')) {
          children[i].textContent = children[i].textContent.replace('Staff', 'Admin');
        }
      }
    }
  }

  function showSection(section) {
    dashboardSection.style.display = section === 'dashboard' ? '' : 'none';
    ordersSection.style.display = section === 'orders' ? '' : 'none';
    customersSection.style.display = section === 'customers' ? '' : 'none';
    suppliesSection.style.display = section === 'supplies' ? '' : 'none';
    staffSection.style.display = section === 'staff' ? '' : 'none';
    if (accountsSection) accountsSection.style.display = section === 'accounts' ? '' : 'none';
    if (salesSection) salesSection.style.display = section === 'sales' ? '' : 'none';

    sidebarBtns.forEach(btn => btn.classList.remove('active'));
    if (section === 'dashboard') navDashboard.classList.add('active');
    if (section === 'orders') navOrders.classList.add('active');
    if (section === 'customers') navCustomers.classList.add('active');
    if (section === 'supplies') navSupplies.classList.add('active');
    if (section === 'staff') navStaff.classList.add('active');
    if (section === 'accounts' && navAccounts) navAccounts.classList.add('active');
    if (section === 'sales' && navSales) navSales.classList.add('active');
  }
  navDashboard.addEventListener('click', function(e) {
    e.preventDefault();
    showSection('dashboard');
    renderDashboardOrders();
  });
  navOrders.addEventListener('click', function(e) {
    e.preventDefault();
    showSection('orders');
    renderOrdersSection();
  });
  navCustomers.addEventListener('click', function(e) {
    e.preventDefault();
    showSection('customers');
    renderCustomersSection();
  });
  navSupplies.addEventListener('click', function(e) {
    e.preventDefault();
    showSection('supplies');
    renderSuppliesSection();
  });
  navStaff.addEventListener('click', function(e) {
    e.preventDefault();
    showSection('staff');
    renderStaffSection();
  });
  if (navAccounts) {
    navAccounts.addEventListener('click', function(e) {
      e.preventDefault();
      showSection('accounts');
    });
  }
  if (navSales) {
    navSales.addEventListener('click', function(e) {
      e.preventDefault();
      showSection('sales');
    });
  }
  
  showSection('dashboard');

  let dashboardOrders = [];
  let orderIdCounter = 1;
  let editingOrderIndex = null;
  const addOrderBtn = document.getElementById('addOrderBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const modal = document.querySelector('.modal');
  const modalForm = document.querySelector('.modal-form');
  const ordersRow = document.querySelector('.dashboard-orders-row');
  const balanceAmountElem = document.getElementById('balance-amount');
  const unpaidAmountElem = document.getElementById('unpaid-amount');
  const servicePrices = {
    'Regular Laundry': 60,
    'Wash and Fold': 65,
    'Dry Cleaning': 250,
    'Iron and Press': 70
  };
  const modalDeleteBtn = document.getElementById('modalDeleteBtn');

  const supplyConsumption = {
    'Regular Laundry': { detergent: 1, softener: 1, bleach: 1, fragrance: 1, stain_remover: 1, steam_water: 0, garment_bag: 0 },
    'Wash and Fold': { detergent: 1, softener: 1, bleach: 1, fragrance: 1, stain_remover: 1, steam_water: 0, garment_bag: 1 },
    'Dry Cleaning': { detergent: 0, softener: 0, bleach: 0, fragrance: 1, stain_remover: 1, steam_water: 0, garment_bag: 1 },
    'Iron and Press': { detergent: 0, softener: 0, bleach: 0, fragrance: 1, stain_remover: 0, steam_water: 1, garment_bag: 0 }
  };

  function recalculateTotals() {
    let totalAmount = 0;
    let totalUnpaid = 0;
    for (const order of dashboardOrders) {
      const amt = parseInt(order.amount, 10);
      const unp = parseInt(order.balance, 10);
      if (!isNaN(amt)) totalAmount += amt;
      if (!isNaN(unp)) totalUnpaid += unp;
    }
    if (balanceAmountElem) balanceAmountElem.textContent = `₱ ${totalAmount}`;
    if (unpaidAmountElem) unpaidAmountElem.textContent = `₱ ${totalUnpaid}`;
  }

  function updateAmountField() {
    const service = modalForm.querySelector('#service').value;
    const load = parseInt(modalForm.querySelector('#load').value, 10) || 0;
    const pricePerKilo = servicePrices[service] || 0;
    const amount = pricePerKilo * load;
    modalForm.querySelector('#amount').value = amount > 0 ? amount : '';
    updateBalanceField();
  }

  function updateBalanceField() {
    const amount = parseInt(modalForm.querySelector('#amount').value, 10) || 0;
    const paid = parseInt(modalForm.querySelector('#paid').value, 10) || 0;
    const balance = amount - paid;
    modalForm.querySelector('#balance').value = balance > 0 ? balance : 0;
  }

  function formatDate(inputDate) {
    if (!inputDate) return '';
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

  function createOrderCard(data, index, showDelete = false) {
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
        <div class="order-main-right order-card-bottom" style="display:flex;flex-direction:column;align-items:flex-end;gap:0;">
          <div class="order-paid">Paid: ₱ ${data.paid}</div>
          <div class="order-balance">Balance: ₱ ${data.balance}</div>
        </div>
      </div>
      <button class="order-update">Edit</button>
    `;
    newCard.dataset.index = index;
    newCard.querySelector('.order-update').addEventListener('click', function() {
      editingOrderIndex = index;
      modalOverlay.classList.remove('hidden');
      modal.querySelector('h2').textContent = 'Edit Customer';
      modalForm.querySelector('.modal-add').textContent = 'Update';
      const order = dashboardOrders[index];
      modalForm.querySelector('#name').value = order.name;
      modalForm.querySelector('#number').value = order.number || '';
      modalForm.querySelector('#status').value = order.statusValue;
      modalForm.querySelector('#service').value = order.service;
      modalForm.querySelector('#load').value = order.load;
      modalForm.querySelector('#amount').value = order.amount;
      modalForm.querySelector('#paid').value = order.paid;
      modalForm.querySelector('#balance').value = order.balance;
      modalForm.querySelector('#date').value = order.dateValue;
      setTimeout(updateAmountField, 0);
      if (modalDeleteBtn) modalDeleteBtn.style.display = '';
    });
    return newCard;
  }

  function updateStatusCounters() {
    let pending = 0, ongoing = 0, completed = 0;
    for (const order of dashboardOrders) {
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

  function renderDashboardOrders() {
    Array.from(ordersRow.children).forEach(child => {
      if (!child.classList.contains('add-order-card') && !child.classList.contains('view-all-orders')) child.remove();
    });
    const toShow = dashboardOrders.slice(0, 3);
    toShow.forEach((order, idx) => {
      const card = createOrderCard(order, idx, true);
      ordersRow.appendChild(card);
    });
    let viewAllBtn = document.querySelector('.view-all-orders');
    if (dashboardOrders.length > 3) {
      if (!viewAllBtn) {
        viewAllBtn = document.createElement('button');
        viewAllBtn.className = 'view-all-orders';
        viewAllBtn.textContent = 'View All';
        viewAllBtn.style.margin = '16px 0 0 12px';
        viewAllBtn.style.padding = '6px 18px';
        viewAllBtn.style.background = '#233754';
        viewAllBtn.style.color = '#fff';
        viewAllBtn.style.border = 'none';
        viewAllBtn.style.borderRadius = '8px';
        viewAllBtn.style.fontSize = '1rem';
        viewAllBtn.style.cursor = 'pointer';
        viewAllBtn.addEventListener('click', function() {
          showSection('orders');
          renderOrdersSection();
        });
        ordersRow.appendChild(viewAllBtn);
      }
    } else if (viewAllBtn) {
      viewAllBtn.remove();
    }
    recalculateTotals();
    updateStatusCounters();
  }


  addOrderBtn.addEventListener('click', function() {
    editingOrderIndex = null;
    modalOverlay.classList.remove('hidden');
    modal.querySelector('h2').textContent = 'New Customer';
    modalForm.querySelector('.modal-add').textContent = 'Add';
    modalForm.reset();
    setTimeout(updateAmountField, 0);
    if (modalDeleteBtn) modalDeleteBtn.style.display = 'none';
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
  modalForm.querySelector('#amount').addEventListener('input', updateBalanceField);
  modalForm.querySelector('#paid').addEventListener('input', updateBalanceField);
  modalForm.querySelector('#service').addEventListener('change', updateAmountField);
  modalForm.querySelector('#load').addEventListener('input', updateAmountField);

  if (modalForm) {
    modalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = modalForm.querySelector('#name').value;
      const number = modalForm.querySelector('#number').value;
      const statusValue = modalForm.querySelector('#status').value;
      const service = modalForm.querySelector('#service').value;
      const load = parseInt(modalForm.querySelector('#load').value, 10) || 0;
      const amount = modalForm.querySelector('#amount').value;
      const paid = modalForm.querySelector('#paid').value;
      const balance = modalForm.querySelector('#balance').value;
      const dateValue = modalForm.querySelector('#date').value;
      if (editingOrderIndex !== null) {
        dashboardOrders[editingOrderIndex] = { name, number, statusValue, service, load, amount, paid, balance, dateValue, orderId: dashboardOrders[editingOrderIndex].orderId };
        editingOrderIndex = null;
        renderDashboardOrders();
        modalForm.reset();
        modalOverlay.classList.add('hidden');
        return;
      }
      
      const consumption = supplyConsumption[service];
      let canDeduct = true;
     
      for (const key in consumption) {
        const required = consumption[key] * load;
        if (supplies[key] < required) {
          canDeduct = false;
          break;
        }
      }
      if (!canDeduct) {
        alert('Not enough supplies in stock for this order. Please check supply levels.');
        return;
      }
    
      for (const key in consumption) {
        supplies[key] -= consumption[key] * load;
      }
      renderSuppliesSection();
      renderDashboardSupplyList();
      
      const orderId = String(orderIdCounter).padStart(5, '0');
      dashboardOrders.push({ name, number, statusValue, service, load, amount, paid, balance, dateValue, orderId });
      orderIdCounter++;
      
      let customer = customers.find(c => c.name === name && c.number === number);
      if (customer) {
        customer.type = 'Returning';
      } else {
        customers.push({ name, number, type: 'New' });
      }
      renderDashboardOrders();
      renderCustomersSection();
      modalForm.reset();
      modalOverlay.classList.add('hidden');
    });
  }

  if (modalDeleteBtn) {
    modalDeleteBtn.addEventListener('click', function() {
      if (editingOrderIndex !== null) {
        dashboardOrders.splice(editingOrderIndex, 1);
        editingOrderIndex = null;
        modalOverlay.classList.add('hidden');
        renderDashboardOrders();
        renderOrdersSection();
      }
    });
  }

  
  function getStatusClass(status) {
    if (status === 'pending') return 'order-status pending';
    if (status === 'ongoing') return 'order-status ongoing';
    if (status === 'complete' || status === 'completed') return 'order-status completed';
    return 'order-status';
  }
  function renderOrdersSection() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';
    if (dashboardOrders.length === 0) {
      ordersList.innerHTML = '<div class="orders-empty-center">No orders found.</div>';
      return;
    }
    dashboardOrders.forEach((order, idx) => {
      const card = document.createElement('div');
      card.className = 'order-card';
      card.innerHTML = `
        <div class="order-status ${getStatusClass(order.statusValue)}">${order.statusValue ? order.statusValue.charAt(0).toUpperCase() + order.statusValue.slice(1) : ''}</div>
        <div class="order-id">#${order.orderId || ''}</div>
        <div class="order-date">${formatDate(order.dateValue) || ''}</div>
        <div class="order-main-row">
          <div class="order-main-left">
            <div class="order-name"><b>${order.name || ''}</b></div>
            <div class="order-type">${order.service || ''}</div>
            <div class="order-price">₱ ${order.amount || '0'}</div>
          </div>
          <div class="order-main-right order-card-bottom" style="display:flex;flex-direction:column;align-items:flex-end;gap:0;">
            <div class="order-paid">Paid: ₱ ${order.paid || '0'}</div>
            <div class="order-balance">Balance: ₱ ${order.balance || '0'}</div>
          </div>
        </div>
        <div style="text-align:center;margin-top:8px;">
          <button class="order-update" style="font-weight:bold;text-decoration:underline;background:none;border:none;color:#fff;cursor:pointer;">Edit</button>
        </div>
      `;
      card.querySelector('.order-update').addEventListener('click', function() {
        editingOrderIndex = idx;
        modalOverlay.classList.remove('hidden');
        modal.querySelector('h2').textContent = 'Edit Customer';
        modalForm.querySelector('.modal-add').textContent = 'Update';
        const orderObj = dashboardOrders[idx];
        modalForm.querySelector('#name').value = orderObj.name;
        modalForm.querySelector('#number').value = orderObj.number || '';
        modalForm.querySelector('#status').value = orderObj.statusValue;
        modalForm.querySelector('#service').value = orderObj.service;
        modalForm.querySelector('#load').value = orderObj.load;
        modalForm.querySelector('#amount').value = orderObj.amount;
        modalForm.querySelector('#paid').value = orderObj.paid;
        modalForm.querySelector('#balance').value = orderObj.balance;
        modalForm.querySelector('#date').value = orderObj.dateValue;
        setTimeout(updateAmountField, 0);
        if (modalDeleteBtn) modalDeleteBtn.style.display = '';
      });
      ordersList.appendChild(card);
    });
  }

  
  let customers = [];
  function renderCustomersSection() {
    const customersList = document.getElementById('customers-list');
    customersList.innerHTML = '';
    if (customers.length === 0) {
      customersList.innerHTML = '<div class="orders-empty-center">No customers found.</div>';
      return;
    }
    
    const table = document.createElement('table');
    table.className = 'customers-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Name</th>
        <th>Number</th>
        <th>Type</th>
      </tr>
    `;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    customers.forEach((customer) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${customer.name}</td>
        <td>${customer.number}</td>
        <td>${customer.type}</td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    customersList.appendChild(table);
  }

  const initialSupplies = {
    detergent: 15,
    softener: 15,
    bleach: 15,
    fragrance: 15,
    stain_remover: 15,
    steam_water: 15,
    garment_bag: 15
  };
  let supplies = { ...initialSupplies };

  const supplyLabels = {
    detergent: 'Detergent',
    softener: 'Softener',
    bleach: 'Bleach',
    fragrance: 'Fragrance',
    stain_remover: 'Stain Remover',
    steam_water: 'Steam Water',
    garment_bag: 'Garment Bag'
  };

  function getStockStatus(qty) {
    if (qty >= 6) return { text: 'In Stock', class: 'in-stock' };
    if (qty >= 1) return { text: 'Low Stock', class: 'low-stock' };
    return { text: 'No Stock', class: 'no-stock' };
  }

  function renderDashboardSupplyList() {
    const dashboardSupplyList = document.getElementById('dashboard-supply-list');
    if (!dashboardSupplyList) return;
    dashboardSupplyList.innerHTML = '';
    Object.keys(supplies).forEach(key => {
      const status = getStockStatus(supplies[key]);
      const row = document.createElement('div');
      row.className = 'supply-row';
      row.innerHTML = `
        ${supplyLabels[key]} <span class="supply-status ${status.class}">${status.text}</span>
      `;
      dashboardSupplyList.appendChild(row);
    });
    // Add event listener for Show All button to redirect to Supplies tab
    const showAllBtn = document.querySelector('.supply-card .supply-update');
    if (showAllBtn) {
      showAllBtn.onclick = function() {
        showSection('supplies');
        renderSuppliesSection();
      };
    }
  }

  function renderSuppliesSection() {
    const suppliesList = document.getElementById('supplies-list');
    suppliesList.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'supplies-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Supply</th>
        <th>Quantity</th>
        <th>Status</th>
        <th>Adjust</th>
      </tr>
    `;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    Object.keys(supplies).forEach(key => {
      const row = document.createElement('tr');
      const status = getStockStatus(supplies[key]);
      row.innerHTML = `
        <td>${supplyLabels[key]}</td>
        <td><span id="qty-${key}">${supplies[key]}</span></td>
        <td><span class="supply-status ${status.class}">${status.text}</span></td>
        <td>
          <button class="supply-minus" data-supply="${key}">-</button>
          <button class="supply-plus" data-supply="${key}">+</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    suppliesList.appendChild(table);
  
    suppliesList.querySelectorAll('.supply-plus').forEach(btn => {
      btn.addEventListener('click', function() {
        const key = btn.getAttribute('data-supply');
        supplies[key]++;
        renderSuppliesSection();
        renderDashboardSupplyList();
      });
    });
    suppliesList.querySelectorAll('.supply-minus').forEach(btn => {
      btn.addEventListener('click', function() {
        const key = btn.getAttribute('data-supply');
        if (supplies[key] > 0) supplies[key]--;
        renderSuppliesSection();
        renderDashboardSupplyList();
      });
    });
    renderDashboardSupplyList();
  }

  renderDashboardSupplyList();
  renderDashboardOrders();

  const staffList = document.getElementById('staff-list');
  const logoutBtn = document.getElementById('logoutBtn');
  let staffData = [''];

  function renderStaffSection() {
    staffList.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'supplies-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Staff Name</th>
      </tr>
    `;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" id="staffNameInput" value="${staffData[0] || ''}" placeholder="Enter staff name" style="width: 100%; box-sizing: border-box; background: #2d4663; color: #F5EFE7; border: none; border-radius: 8px; padding: 12px 18px; font-size: 1.08rem; font-family: 'Lexend Deca', Arial, sans-serif;" /></td>
    `;
    tbody.appendChild(row);
    table.appendChild(tbody);
    staffList.appendChild(table);
    // Update staffData[0] on input
    const staffNameInput = document.getElementById('staffNameInput');
    if (staffNameInput) {
      staffNameInput.oninput = function() {
        staffData[0] = staffNameInput.value;
      };
    }
  }

  if (logoutBtn) {
    logoutBtn.onclick = function() {
      window.location.href = 'login.html';
    };
  }
}); 