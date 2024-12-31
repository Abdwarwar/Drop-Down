(function () {
  const prepared = document.createElement("template");
  prepared.innerHTML = `
    <style>
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f4f4f4; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      tr.selected { background-color: #ffeb3b; }
      td.editable { background-color: #fff3e0; }
      button { margin-bottom: 10px; padding: 5px 10px; cursor: pointer; }
    </style>
    <div id="controls">
      <button id="addRowButton">Add New Row</button>
    </div>
    <div id="root" style="width: 100%; height: 100%; overflow: auto;"></div>
  `;

  class DynamicDropdownWidget extends HTMLElement {
     constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.widgetData = {}; // Store widget properties and data
  }

  connectedCallback() {
    this.render();
    this.addListeners();
  }

    set dimensions(value) {
    // This will update the dimensions array from the JSON
    this.widgetData.dimensions = value;
    this.render();
  }

    set members(value) {
    // This will update the members mapping from the JSON
    this.widgetData.members = value;
    this.render();
  }

    set myDataSource(dataBinding) {
      this._myDataSource = dataBinding;
      this.render();
    }

  render() {
    const { dimensions, members } = this.widgetData;
    const container = document.createElement('div');
    container.style.width = this.getAttribute('width') + 'px';
    container.style.height = this.getAttribute('height') + 'px';

    // Create dropdowns dynamically based on the dimensions
    dimensions.forEach((dimension, index) => {
      const select = document.createElement('select');
      const dimensionMembers = members[index] || [];

      dimensionMembers.forEach((member) => {
        const option = document.createElement('option');
        option.value = member;
        option.innerText = member;
        select.appendChild(option);
      });

      select.addEventListener('change', (event) => {
        this.dispatchEvent(new CustomEvent('onSelectionChange', { detail: event.target.value }));
      });

      const label = document.createElement('label');
      label.innerText = dimension;
      container.appendChild(label);
      container.appendChild(select);
    });

    this.shadowRoot.appendChild(container);
  }

    attachRowSelectionListeners() {
      const rows = this._root.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        row.addEventListener("click", (event) => {
          const rowIndex = event.currentTarget.getAttribute("data-row-index");
          if (this._selectedRows.has(rowIndex)) {
            this._selectedRows.delete(rowIndex);
            event.currentTarget.classList.remove("selected");
          } else {
            this._selectedRows.add(rowIndex);
            event.currentTarget.classList.add("selected");
          }
        });
      });
    }

    makeMeasureCellsEditable() {
      const rows = this._root.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td.editable");
        cells.forEach((cell) => {
          const measureId = cell.getAttribute("data-measure-id");
          cell.contentEditable = "false";
          cell.addEventListener("dblclick", () => {
            cell.contentEditable = "true";
            cell.focus();
          });

          cell.addEventListener("blur", (event) => {
            const newValue = parseFloat(cell.textContent.trim());
            cell.contentEditable = "false";
            if (!isNaN(newValue)) {
              const measureKey = this.getMeasures().find((measure) => measure.id === measureId)?.key;
              this._myDataSource.data[row.index][measureKey] = { raw: newValue };
            }
          });
        });
      });
    }

    async addEmptyRow() {
      const table = this._root.querySelector("table tbody");
      const dimensions = this.getDimensions();
      const measures = this.getMeasures();
      const newRowIndex = table.rows.length;

      const newRow = document.createElement("tr");
      newRow.setAttribute("data-row-index", newRowIndex);

      dimensions.forEach((dim) => {
        const cell = document.createElement("td");
        const dropdown = document.createElement("select");

        const members = await this.fetchDimensionMembers(dim.key);
        members.forEach((member) => {
          const option = document.createElement("option");
          option.value = member.id;
          option.textContent = member.label;
          dropdown.appendChild(option);
        });

        dropdown.addEventListener("change", (event) => {
          cell.setAttribute("data-dimension-value", event.target.value);
        });

        cell.appendChild(dropdown);
        newRow.appendChild(cell);
      });

      measures.forEach((measure) => {
        const cell = document.createElement("td");
        cell.classList.add("editable");
        cell.setAttribute("data-measure-id", measure.id);
        cell.contentEditable = "true";
        newRow.appendChild(cell);
      });

      newRow.addEventListener("click", () => {
        this._selectedRows.add(newRowIndex);
      });

      table.appendChild(newRow);
    }

    async fetchDimensionMembers(dimensionId) {
      if (!this._myDataSource) return [];

      const membersSet = new Set();
      this._myDataSource.data.forEach((row) => {
        const value = row[dimensionId]?.id || row[dimensionId]?.label;
        if (value) {
          membersSet.add(value);
        }
      });

      return Array.from(membersSet).map((member) => ({ id: member, label: member }));
    }

    getDimensions() {
      return this._myDataSource.metadata.feeds.dimensions.values.map((key) => {
        const dimension = this._myDataSource.metadata.dimensions[key];
        return { id: key, description: dimension.description || key };
      });
    }

    getMeasures() {
      return this._myDataSource.metadata.feeds.measures.values.map((key) => {
        const measure = this._myDataSource.metadata.mainStructureMembers[key];
        return { id: key, description: measure.description || key };
      });
    }
  }

  customElements.define("com-sap-custom-dynamicdropdownwidget", DynamicDropdownWidget);
})();
