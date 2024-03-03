/*
 * Navigate to https://www.medicines.org.uk/emc/browse-companies
 * For each page of the company browser
 * Capture details about the first, the third and the last company on the page. The details must include the company name, the logo and all contact information.
 * Do not capture the information about the drugs related to that company
 * Store the logo as an image in a folder
 * Add the company details to an internal data structure. Include the filename of the image file
 * Output the internal data structure of the company details as a JSON or XML file.
 */

function clearCookies() {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  cy.clearAllCookies();
}
describe("Extract Data from Multiple Pages", () => {
  before(() => {
    clearCookies();
  });
  it("should extract data from multiple pages", () => {
    // Visit the main page containing the list of pages
    cy.visit("https://www.medicines.org.uk/emc/browse-companies");
    cy.url().should("eq", "https://www.medicines.org.uk/emc/browse-companies");
    let companyDetails = [];
    cy.get(".browse-menu a.emc-link").each(($link) => {
      clearCookies();
      cy.contains(".browse-menu a.emc-link", $link.text()).click();
      clearCookies();
      cy.url().should('include', '/emc/browse-companies'); // Asserting that the URL contains '/emc/browse-companies'
      // Find all anchor elements with the class 'emc-link' inside the 'browse-menu' container
      cy.get(".browse-results a.emc-link").as("companyLinks");
      const linksToExtract = [];
      cy.get("@companyLinks")
        .then(($elements) => {
          if ($elements.length > 2) {
            linksToExtract.push(cy.get("@companyLinks").eq(0));
            linksToExtract.push(cy.get("@companyLinks").eq(2));
            linksToExtract.push(cy.get("@companyLinks").last());
          } else if ($elements.length > 1) {
            linksToExtract.push(cy.get("@companyLinks").eq(0));
            linksToExtract.push(cy.get("@companyLinks").last());
          } else {
            linksToExtract.push(cy.get("@companyLinks").eq(0));
          }
        })
        .then(() => {
          linksToExtract.forEach((link, index) => {
            clearCookies();
            link.click();
            clearCookies();
            cy.get("h2").then(($h2) => {
              const companyName = $h2.text().trim();

              const singleDetails = {};
              cy.get(".company-contacts-item").each(($item) => {
                // put underscores instead of spaces in the item label
                const itemLabel = $item
                  .find("div")
                  .text()
                  .trim()
                  .replace(/\s/g, "_");
                // const itemLabel = $item.find('div').text().trim();
                // Check if a span element exists within the current item
                const $span = $item.find("span");
                let itemText = "";
                if ($span.length) {
                  itemText = $span.text().trim();
                } else {
                  // If span does not exist, fall back to finding text using 'a' selector
                  itemText = $item.find("a").text().trim();
                }
                singleDetails[itemLabel] = itemText;
              });
              let imageUrl;
              cy.get(".img-responsive").then(($image) => {
                imageUrl = $image.attr("src");
                cy.log(`Image URL: ${imageUrl}`);
                cy.request({ url: imageUrl, encoding: "binary" }).then(
                  (response) => {
                    // Write the logo's content to a file in a folder
                    const fname = `logo_${companyName}.png`;
                    cy.writeFile(
                      `cypress/fixtures/logos/${fname}`,
                      response.body,
                      "binary"
                    );
                    singleDetails[
                      "logopath"
                    ] = `cypress/fixtures/logos/${fname}`;
                  }
                );
              });
              // Push the details of the current company into the array
              cy.wrap(companyDetails).then((currentCompanyDetails) => {
                currentCompanyDetails.push({ companyName, ...singleDetails });
              });
              clearCookies();
              cy.go("back");
              clearCookies();

              if (index === linksToExtract.length - 1) {
                // If this is the last iteration, write the company details to a file
                cy.writeFile(`output.json`, { companyDetails }, "utf-8");
                clearCookies();
              }
            });
          });
        });
    });
  });
});
