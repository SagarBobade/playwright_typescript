import BasePage from "./BasePage";
import { Header } from "./components/Header";
import { Sidebar } from "./components/sidebar";


export class ProductsPage extends BasePage {
    
    header = new Header(this.page);
    sidebar = new Sidebar(this.page);


    async viewProduct(productName: string) {
        const btnViewProduct = this.page.locator(`//b[normalize-space()='${productName}']/ancestor::div[contains(@class,'card-body')]//button[normalize-space()='View']`);
        await btnViewProduct.waitFor({ state: 'visible' });
        await btnViewProduct.click();
        await this.waitForPageLoad();
    }

    async addProductToCart(productName: string) {
        const btnAddToCart = this.page.locator(`//b[normalize-space()='${productName}']/ancestor::div[contains(@class,'card-body')]//button[normalize-space()='Add To Cart']`);
        await btnAddToCart.waitFor({ state: 'visible' });
        await btnAddToCart.click();
        await this.waitForPageLoad();
    }

    // more methods can be added as - getProductDetails, getProductPrice

}