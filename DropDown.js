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

    class DynamicDropdownWidget extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            this.dropdownContainer = this.shadowRoot.querySelector('.dropdown-container');
            this.addButton = this.shadowRoot.querySelector('#addDropdown');
            this.addButton.addEventListener('click', () => this.addDropdown());

            this.dimensions = [];
        }

        // Add a new dropdown based on dimension members
        addDropdown() {
            const dropdown = document.createElement('select');
            dropdown.className = 'dropdown';

            if (this.dimensions.length > 0) {
                const dimension = this.dimensions.shift();
                this.populateDropdown(dropdown, dimension);
            } else {
                dropdown.innerHTML = '<option>No dimensions left</option>';
            }

            this.dropdownContainer.insertBefore(dropdown, this.addButton);
        }

        // Populate dropdown with dimension members
        populateDropdown(dropdown, dimension) {
            // Fetch members dynamically (replace with SAC model API logic)
            const members = dimension.members || []; // Ideally, replace with actual fetching logic
            if (members.length === 0) {
                dropdown.innerHTML = '<option>No members available</option>';
            } else {
                dropdown.innerHTML = members.map(member => `<option value="${member}">${member}</option>`).join('');
            }
        }

        // Set dimensions from SAC model
        setDimensions(dimensions) {
            this.dimensions = dimensions;
            // Optionally, call addDropdown() to automatically populate with initial dimension data
            this.addDropdown(); 
        }
    }

    customElements.define('dynamic-dropdown-widget', DynamicDropdownWidget);
})();
