sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Select",
    "sap/m/SelectListItem"
], function (Controller, Select, SelectListItem) {
    "use strict";

    return Controller.extend("com.sap.custom.dynamicdropdownwidget", {

        /**
         * This method is called to create the dropdowns dynamically based on the provided dimensions.
         * @param {Array} dimensions Array of dimension names to create dropdowns for
         */
        createDropdowns: function (dimensions) {
            var oContainer = this.getView().byId("dropdownContainer"); // The container for the dropdowns
            oContainer.destroyItems(); // Clear previous dropdowns

            // Loop through each dimension to create a dropdown
            dimensions.forEach(function (dimension) {
                var oDropdown = new Select({
                    width: "100%",
                    change: this._onDropdownChange.bind(this), // Event handler for changes
                    selectedKey: ""
                });

                // Get the model and fetch members for this dimension
                var oModel = this.getView().getModel(); // Retrieve the model
                if (oModel) {
                    // Assuming the members for each dimension are stored under "/<dimension>/members"
                    var aMembers = oModel.getProperty("/" + dimension + "/members");

                    // Add the members to the dropdown
                    if (aMembers && aMembers.length > 0) {
                        aMembers.forEach(function (member) {
                            oDropdown.addItem(new SelectListItem({
                                text: member.name,  // Display name of the member
                                key: member.key     // Unique key for the member
                            }));
                        });
                    }
                }

                // Add the dropdown to the container
                oContainer.addItem(oDropdown);
            }, this);
        },

        /**
         * Event handler for when a dropdown value is selected.
         * @param {sap.ui.base.Event} oEvent Event object for the change event
         */
        _onDropdownChange: function (oEvent) {
            var oSelect = oEvent.getSource();
            var selectedKey = oSelect.getSelectedKey();
            console.log("Selected Key: " + selectedKey);  // Log the selected value (you can handle this as needed)
        },

        /**
         * Public method to set the dimensions and trigger the creation of dropdowns.
         * @param {Array} dimensions Array of dimension names to create dropdowns for
         */
        setDimensions: function (dimensions) {
            if (Array.isArray(dimensions) && dimensions.length > 0) {
                this.createDropdowns(dimensions); // Call the method to create dropdowns dynamically
            }
        }
    });
});
