(function () {
  const prepared = document.createElement("template");
  prepared.innerHTML = `
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

class DynamicDropdownWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.dimensions = [];  // Default empty dimensions array
    this.members = [];     // Default empty members array
  }

  connectedCallback() {
    // Retrieve the dimensions and members from attributes
    const dimensions = this.getAttribute('dimensions');
    const members = this.getAttribute('members');

    // Parse the attributes if they are available
    if (dimensions) this.dimensions = JSON.parse(dimensions);
    if (members) this.members = JSON.parse(members);

    // Call the render method to display the dropdowns
    this.render();
  }

  render() {
    // Clear previous content
    this.shadowRoot.innerHTML = '';

    // Create a container for the dropdowns
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = 'auto';

    // Dynamically create dropdowns based on the dimensions array
    this.dimensions.forEach((dimension, index) => {
      const select = document.createElement('select');
      select.setAttribute('data-dimension', dimension);  // Set dimension attribute

      // Dynamically populate the dropdown options based on the members
      const dimensionMembers = this.members[index] || [];
      dimensionMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member;
        option.textContent = member;
        select.appendChild(option);
      });

      // Event listener for when selection changes
      select.addEventListener('change', (e) => {
        this.dispatchEvent(new CustomEvent('onSelectionChange', { 
          detail: { dimension, selectedValue: e.target.value }
        }));
      });

      // Create a label for each dropdown
      const label = document.createElement('label');
      label.textContent = `Select ${dimension}:`;
      container.appendChild(label);
      container.appendChild(select);
      container.appendChild(document.createElement('br'));  // Add line break between dropdowns
    });

    // Append the container to the shadow DOM
    this.shadowRoot.appendChild(container);
  }
}

// Define the custom element with the name `com-sap-custom-dynamicdropdownwidget`
customElements.define('com-sap-custom-dynamicdropdownwidget', DynamicDropdownWidget);
})();
