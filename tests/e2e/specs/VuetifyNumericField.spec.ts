describe("VuetifyNumericField", function() {
  it("should load page.", function() {
    cy.visit("/");
    cy.contains("Welcome to Test Page");
  });

  it("should format and divide percent value by 100", function() {
    cy.get("input#model-percent")
      .clear()
      .type("123");
    cy.get("div#model-data").should("have.text", "1.23");
    cy.get("input#model-percent2").should("have.value", "%123");
    cy.get("input#model-money").should("have.value", "₺1,23");
  });

  it("should format money value", function() {
    cy.get("input#model-money")
      .clear()
      .type("123");
    cy.get("div#model-data").should("have.text", "123");
    cy.get("input#model-percent").should("have.value", "%12.300");
    cy.get("input#model-percent2").should("have.value", "%12.300");
  });

  it("should format non v-model input", function() {
    cy.get("input#without-model")
      .clear()
      .type("123456")
      .blur();
    cy.get("input#without-model").should("have.value", "₺123.456");
  });
});
