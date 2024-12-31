(function () {
  console.log('Widget initialized');
  
  const prepared = document.createElement("template");
  prepared.innerHTML = `
    <style>
      #root { 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        height: 100%; 
        width: 100%;
      }
    </style>
    <div id="root">Hello World</div>
  `;

  class CustomHelloWorldWidget extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(prepared.content.cloneNode(true));
      this._root = this._shadowRoot.getElementById("root");
    }

    connectedCallback() {
      console.log("Hello World Widget is connected.");
    }
  }

  try {
    customElements.define("custom-hello-world-widget", CustomHelloWorldWidget);
    console.log("Widget custom element defined successfully.");
  } catch (error) {
    console.error("Error defining the custom element:", error);
  }
})();
