export class BaseComponent extends HTMLElement {
    constructor() {
      super();
      this.onBuild();
      // The constructor is called when the element is created.
      // Do not access the DOM here.
    }
  
    connectedCallback(): void {
      // Call ngOnInit
      this.onInit();
  
      Promise.resolve().then(() => {
        this.onViewInit();
      });
    }
  
    /**
     * Invoked each time the custom element is disconnected from the document's DOM.
     */
    disconnectedCallback(): void {
      this.onDestroy();
    }
  
    protected onBuild(): void {
      // Default implementation (can be overridden)
    }
  
    protected onInit(): void {
      // Default implementation (can be overridden)
    }
  
    protected onViewInit(): void {
      // Default implementation (can be overridden)
    }
  
    protected onDestroy(): void {
      // Default implementation (can be overridden)
    }
  }