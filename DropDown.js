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

  class CustomTableWidget extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(prepared.content.cloneNode(true));
      this._root = this._shadowRoot.getElementById("root");
      this._selectedRows = new Set();
      this._myDataSource = null;

      const addRowButton = this._shadowRoot.getElementById("addRowButton");
      addRowButton.addEventListener("click", () => this.addEmptyRow());
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
        this._root.innerHTML = `<p>Loading data...</p>`;
        return;
      }

      const dimensions = this.getDimensions();
      const measures = this.getMeasures();

      if (dimensions.length === 0 || measures.length === 0) {
        this._root.innerHTML = `<p>Please add Dimensions and Measures in the Builder Panel.</p>`;
        return;
      }

      const tableData = this._myDataSource.data.map((row, index) => ({
        index,
        ...dimensions.reduce((acc, dim) => {
          acc[dim.id] = row[dim.key]?.label || row[dim.key]?.id || "N/A";
          return acc;
        }, {}),
        ...measures.reduce((acc, measure) => {
          acc[measure.id] = row[measure.key]?.raw || row[measure.key]?.formatted || "N/A";
          return acc;
        }, {}),
      }));

      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";

      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr>
            ${dimensions.map((dim) => `<th>${dim.description || dim.id}</th>`).join("")}
            ${measures.map((measure) => `<th>${measure.description || measure.id}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${tableData
            .map(
              (row) =>
                `<tr data-row-index="${row.index}">
                  ${dimensions.map((dim) => `<td>${row[dim.id]}</td>`).join("")}
                  ${measures
                    .map(
                      (measure) =>
                        `<td class="editable" data-measure-id="${measure.id}">${row[measure.id]}</td>`
                    )
                    .join("")}
                </tr>`
            )
            .join("")}
        </tbody>
      `;
      container.appendChild(table);
      this._root.innerHTML = "";
      this._root.appendChild(container);

      this.attachRowSelectionListeners();
      this.makeMeasureCellsEditable();
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

  customElements.define("custom-table-widget", CustomTableWidget);
})();
