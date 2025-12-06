import  BasePage from './../BasePage';

export class Header extends BasePage {
  
    protected websiteLogo = "(//p[normalize-space()='Automation Practice'])[1]";
    protected linkHome = "(//button[normalize-space()='HOME'])[1]";
    protected linkOrders = "(//button[@routerlink='/dashboard/myorders'])[1]";
    protected linkCart = "//button[@routerlink='/dashboard/cart']";
    protected linkSignOut = "(//button[normalize-space()='Sign Out'])[1]";

    async navigateToHome() {
        await this.click(this.linkHome);
    }

    async navigateToOrders() {
        await this.click(this.linkOrders);
    }

    async navigateToCart() {
        await this.click(this.linkCart);
    }

    async signOut() {
        await this.click(this.linkSignOut);
    }





}