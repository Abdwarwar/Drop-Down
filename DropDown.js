(function () {
  const prepared = document.createElement("template");
  prepared.innerHTML = `
    <style>
      #root { display: flex; flex-direction: column; width: 100%; height: 100%; padding: 10px; }
      .dimension-container { margin: 10px 0; }
      .dimension-label { font-weight: bold; margin-bottom: 5px; }
      select { width: 100%; padding: 5px; }
      button { margin-bottom: 10px; padding: 5px 10px; cursor: pointer; }
    </style>
    <div id="controls">
      <button id="addRowButton">Add New Row</button>
    </div>
    <div id="root"></div>
  `;

  class CustomDropdownWidget extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(prepared.content.cloneNode(true));
      this._root = this._shadowRoot.getElementById("root");
      this._selectedRows = new Set(); // Track selected rows
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
      if (dimensions.length === 0) {
        this._root.innerHTML = `<p>Please add Dimensions in the Builder Panel.</p>`;
        return;
      }

      console.log("Resolved Dimensions:", dimensions);

      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";

      dimensions.forEach((dim) => {
        const dimensionContainer = document.createElement("div");
        dimensionContainer.classList.add("dimension-container");

        const label = document.createElement("div");
        label.classList.add("dimension-label");
        label.textContent = dim.description || dim.id;
        dimensionContainer.appendChild(label);

        const dropdown = document.createElement("select");
        this.fetchDimensionMembers(dim.key, "id").then((members) => {
          members.forEach((member) => {
            const option = document.createElement("option");
            option.value = member.id;
            option.textContent = member.label;
            dropdown.appendChild(option);
          });
        });

        dropdown.addEventListener("change", (event) => {
          console.log(`Dimension '${dim.id}' selected as ID: ${event.target.value}`);
          dimensionContainer.setAttribute("data-dimension-value", event.target.value); // Store selected ID
        });

        dimensionContainer.appendChild(dropdown);
        container.appendChild(dimensionContainer);
      });

      this._root.innerHTML = "";
      this._root.appendChild(container);
    }

    async fetchDimensionMembers(dimensionId, returnType = "id") {
      if (!this._myDataSource || !this._myDataSource.data) {
        console.error("Data source not available or data is missing.");
        return [];
      }

      try {
        const membersSet = new Set();
        this._myDataSource.data.forEach((row) => {
          const value = row[dimensionId]?.[returnType] || null;
          if (value) {
            membersSet.add(value);
          }
        });

        const members = Array.from(membersSet).map((member) => ({
          id: member,
          label: member,
        }));

        console.log(`Fetched members for dimension '${dimensionId}' (${returnType}):`, members);
        return members;
      } catch (error) {
        console.error("Error fetching dimension members:", error);
        return [];
      }
    }

    async addEmptyRow() {
      const dimensions = this.getDimensions();
      const newRow = document.createElement("div");
      newRow.classList.add("dimension-container");

      dimensions.forEach((dim) => {
        const cell = document.createElement("div");
        cell.classList.add("dimension-container");

        const dropdown = document.createElement("select");

        const members = await this.fetchDimensionMembers(dim.key, "id");
        members.forEach((member) => {
          const option = document.createElement("option");
          option.value = member.id;
          option.textContent = member.label;
          dropdown.appendChild(option);
        });

        dropdown.addEventListener("change", (event) => {
          console.log(`New dimension '${dim.id}' selected as ID: ${event.target.value}`);
        });

        cell.appendChild(dropdown);
        newRow.appendChild(cell);
      });

      this._root.appendChild(newRow);
      console.log("New row added");
    }

    getDimensions() {
      try {
        if (!this._myDataSource || !this._myDataSource.metadata) {
          console.error("Data source or metadata is unavailable.");
          return [];
        }

        const dimensionKeys = this._myDataSource.metadata.feeds.dimensions.values;

        const dimensions = dimensionKeys.map((key) => {
          const dimension = this._myDataSource.metadata.dimensions[key];
          if (!dimension) {
            console.warn(`Dimension key '${key}' not found in metadata.`);
            return { id: key, description: "Undefined Dimension", key };
          }

          return {
            id: dimension.id || key,
            description: dimension.description || dimension.id || key,
            key,
          };
        });

        console.log("Resolved Dimensions:", dimensions);
        return dimensions;
      } catch (error) {
        console.error("Error in getDimensions:", error);
        return [];
      }
    }
  }

  customElements.define("custom-dropdown-widget", CustomDropdownWidget);
})();
