document.addEventListener("DOMContentLoaded", () => {
  const formPopup = document.getElementById("formPopup");
  const addTourBtn = document.getElementById("addTourBtn");
  const closePopup = document.getElementById("closePopup");
  const cancelBtn = document.getElementById("cancelBtn");
  const tourForm = document.getElementById("tourForm");
  const tourTableBody = document.getElementById("tourTableBody");
  const tourIdInput = document.getElementById("tourId");
  const confirmationBox = document.getElementById("confirmationBox");
  const searchInput = document.getElementById("searchInput"); 
  const paginationDiv = document.getElementById("pagination");

  let editTourId = null;
  let confirmationMessage = "";
  let allTours = [];
  let currentPage = 1;
  const pageSize = 10;

  /** Utility: Format YYYY-MM-DD */
  function toDateLocalValue(value) {
    if (!value) return "";
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    return String(value).split("T")[0];
  }

  /** Utility: Capitalize Each Word */
  function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }

  /** Utility: Validate & Generate IDs */
  function isValidTourId(id) {
    return /^T\d{3,}$/.test(id);
  }
  function getNextTourId(lastId) {
    if (!lastId || !isValidTourId(lastId)) return "T001";
    const num = parseInt(lastId.substring(1), 10) + 1;
    return "T" + String(num).padStart(3, "0");
  }

  /** Open Add Form */
  addTourBtn.addEventListener("click", async () => {
    tourForm.reset();
    editTourId = null;
    document.getElementById("formTitle").innerText = "Add New Tour";

    const res = await fetch("/api/tours");
    const tours = await res.json();
    if (tours.length > 0) {
      const lastTour = tours
        .filter(t => isValidTourId(t.tour_id))
        .sort((a, b) => parseInt(b.tour_id.substring(1)) - parseInt(a.tour_id.substring(1)))[0];
      tourIdInput.value = getNextTourId(lastTour.tour_id);
    } else {
      tourIdInput.value = "T001";
    }

    formPopup.style.display = "flex";
  });

  function closeForm() {
    formPopup.style.display = "none";
  }
  closePopup.addEventListener("click", closeForm);
  cancelBtn.addEventListener("click", closeForm);

  function showConfirmation(message) {
    confirmationBox.innerText = message;
    confirmationBox.style.display = "block";
    setTimeout(() => {
      confirmationBox.style.display = "none";
    }, 3000);
  }

  async function loadTours() {
    const res = await fetch("/api/tours");
    allTours = await res.json();
    currentPage = 1;
    renderTable();
  }

  /** Render Table */
  function renderTable(filteredTours = null) {
    const tours = filteredTours || allTours;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageTours = tours.slice(startIndex, endIndex);

    tourTableBody.innerHTML = "";
    pageTours.forEach((t, index) => {
      const row = document.createElement("tr");

      // ✅ Zebra striping
      if (index % 2 === 0) {
        row.style.backgroundColor = "#f9f9f9";
      } else {
        row.style.backgroundColor = "#ffffff";
      }

      // ✅ Hover highlight
      row.addEventListener("mouseenter", () => row.style.backgroundColor = "#e6f7ff");
      row.addEventListener("mouseleave", () => {
        row.style.backgroundColor = index % 2 === 0 ? "#f9f9f9" : "#ffffff";
      });

      row.innerHTML = `
        <td style="text-align:left;">${t.tour_id}</td>
        <td style="text-align:left;">${capitalizeWords(t.name)}</td>
        <td style="text-align:left;">${capitalizeWords(t.destination)}</td>
        <td style="text-align:center;">${toDateLocalValue(t.start_date)}</td>
        <td style="text-align:center;">${toDateLocalValue(t.end_date)}</td>
        <td style="text-align:right;">${parseFloat(t.price).toFixed(2)}</td>
        <td style="text-align:left;">${capitalizeWords(t.tour_guide)}</td>
        <td class="actions" style="text-align:center;">
          <button onclick="editTour('${t.tour_id}')" title="Edit">🖉</button>
          <button onclick="deleteTour('${t.tour_id}')" title="Delete">🗑️</button>
        </td>
      `;
      tourTableBody.appendChild(row);
    });

    renderPagination(tours.length);
  }

  /** Modern Pagination */
  function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / pageSize);
    paginationDiv.innerHTML = "";

    if (totalPages <= 1) return;

    const createButton = (text, page, disabled = false, active = false) => {
      const btn = document.createElement("button");
      btn.innerText = text;
      btn.disabled = disabled;
      btn.style.margin = "2px";
      btn.style.padding = "4px 8px";
      btn.style.borderRadius = "4px";
      if (active) {
        btn.style.background = "#007bff";
        btn.style.color = "#fff";
      }
      btn.onclick = () => {
        currentPage = page;
        renderTable();
      };
      return btn;
    };

    paginationDiv.appendChild(createButton("« Prev", currentPage - 1, currentPage === 1));

    const range = 2;
    let start = Math.max(1, currentPage - range);
    let end = Math.min(totalPages, currentPage + range);

    if (start > 1) {
      paginationDiv.appendChild(createButton("1", 1, false, currentPage === 1));
      if (start > 2) paginationDiv.appendChild(document.createTextNode("..."));
    }

    for (let i = start; i <= end; i++) {
      paginationDiv.appendChild(createButton(i, i, false, i === currentPage));
    }

    if (end < totalPages) {
      if (end < totalPages - 1) paginationDiv.appendChild(document.createTextNode("..."));
      paginationDiv.appendChild(createButton(totalPages, totalPages, false, currentPage === totalPages));
    }

    paginationDiv.appendChild(createButton("Next »", currentPage + 1, currentPage === totalPages));
  }

  /** Search */
  searchInput.addEventListener("keyup", function () {
    const filter = this.value.toLowerCase();
    const filteredTours = allTours.filter(t =>
      Object.values(t).some(val => String(val).toLowerCase().includes(filter))
    );
    currentPage = 1;
    renderTable(filteredTours);
  });

  /** Submit Form */
  tourForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      tourId: tourIdInput.value.trim(),
      name: capitalizeWords(document.getElementById("name").value.trim()),
      destination: capitalizeWords(document.getElementById("destination").value.trim()),
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value,
      price: parseFloat(document.getElementById("price").value),
      tourGuide: capitalizeWords(document.getElementById("tourGuide").value.trim())
    };

    if (!isValidTourId(data.tourId)) {
      alert("❌ Invalid Tour ID. Please use the format T001, T002, etc.");
      return;
    }

    if (!editTourId) {
      const exists = allTours.some(t => t.tour_id === data.tourId);
      if (exists) {
        alert(`⚠️ The Tour ID "${data.tourId}" already exists. Please refresh and try again.`);
        return;
      }

      await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      confirmationMessage = "✅ Tour added successfully!";
    } else {
      await fetch(`/api/tours/${editTourId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      confirmationMessage = "✅ Tour updated successfully!";
    }

    closeForm();
    loadTours();
    showConfirmation(confirmationMessage);
  });

  /** Edit Tour */
  window.editTour = async (tourId) => {
    const tour = allTours.find(t => t.tour_id === tourId);
    if (tour) {
      document.getElementById("formTitle").innerText = "Edit Tour";
      tourIdInput.value = tour.tour_id;
      document.getElementById("name").value = capitalizeWords(tour.name);
      document.getElementById("destination").value = capitalizeWords(tour.destination);
      document.getElementById("startDate").value = toDateLocalValue(tour.start_date);
      document.getElementById("endDate").value = toDateLocalValue(tour.end_date);
      document.getElementById("price").value = parseFloat(tour.price).toFixed(2);
      document.getElementById("tourGuide").value = capitalizeWords(tour.tour_guide);
      editTourId = tourId;
      formPopup.style.display = "flex";
    }
  };

  /** Delete Tour */
  window.deleteTour = async (tourId) => {
    if (confirm("⚠️ Are you sure you want to delete this tour?")) {
      await fetch(`/api/tours/${tourId}`, { method: "DELETE" });
      alert("🗑️ Tour deleted successfully!");
      loadTours();
    }
  };

  loadTours();
});