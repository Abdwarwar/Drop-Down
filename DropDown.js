// SAC Custom Widget for Dynamic Dropdown Filters
(function() {
    const template = document.createElement('template');
    template.innerHTML = `
        <style>
            .dropdown-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .dropdown {
                padding: 5px;
                font-size: 14px;
            }
            button {
                margin-top: 10px;
                padding: 5px 10px;
                background-color: #0078d7;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            button:hover {
                background-color: #005a9e;
            }
        </style>
        <div class="dropdown-container">
            <button id="addDropdown">Add Dropdown</button>
        </div>
    `;

class CustomDropdownWidget extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._root = document.createElement("div");
    this._shadowRoot.appendChild(this._root);

    this._selectedRows = new Set(); // Track selected rows
    this._myDataSource = null; // Placeholder for data source
  }

  connectedCallback() {
    this.render();
  }

  set myDataSource(dataBinding) {
    this._myDataSource = dataBinding;
    this.render();
  }

  render() {
    if (!this._myDataSource || this._myDataSource.state !== "success") {
      this._root.innerHTML = "<p>Loading data...</p>";
      return;
    }

    const dimensions = this.getDimensions();

    if (dimensions.length === 0) {
      this._root.innerHTML = "<p>No dimensions available in data.</p>";
      return;
    }

    const table = document.createElement("table");
    const headerRow = document.createElement("tr");

    // Create a header for each dimension
    dimensions.forEach((dim) => {
      const th = document.createElement("th");
      th.textContent = dim.description || dim.id;
      headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    // Add rows with dropdowns for dimensions
    for (let rowIndex = 0; rowIndex < 5; rowIndex++) { // Example: 5 rows of dropdowns
      const row = document.createElement("tr");
      dimensions.forEach((dim) => {
        const cell = document.createElement("td");

        const dropdown = document.createElement("select");
        this.fetchDimensionMembers(dim.id).then((members) => {
          members.forEach((member) => {
            const option = document.createElement("option");
            option.value = member.id;
            option.textContent = member.label;
            dropdown.appendChild(option);
          });
        });

        cell.appendChild(dropdown);
        row.appendChild(cell);
      });

      table.appendChild(row);
    }

    this._root.innerHTML = "";
    this._root.appendChild(table);
  }

  async fetchDimensionMembers(dimensionId) {
    if (!this._myDataSource || !this._myDataSource.data) {
      console.error("Data source or data missing.");
      return [];
    }

    try {
      const membersSet = new Set();
      this._myDataSource.data.forEach((row) => {
        const value = row[dimensionId]?.id || null;
        if (value) {
          membersSet.add(value);
        }
      });

      return Array.from(membersSet).map((member) => ({
        id: member,
        label: member,
      }));
    } catch (error) {
      console.error("Error fetching dimension members:", error);
      return [];
    }
  }

  getDimensions() {
    if (!this._myDataSource || !this._myDataSource.metadata) {
      console.error("Data source metadata missing.");
      return [];
    }

    const dimensionKeys = this._myDataSource.metadata.feeds.dimensions.values;
    return dimensionKeys.map((key) => {
      const dimension = this._myDataSource.metadata.dimensions[key];
      return dimension ? {
        id: dimension.id || key,
        description: dimension.description || key,
      } : { id: key, description: key };
    });
  }
}


    customElements.define('dynamic-dropdown-widget', DynamicDropdownWidget);
})();
