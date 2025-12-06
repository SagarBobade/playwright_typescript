import BasePage from "../BasePage";


export class Sidebar extends BasePage {

    protected inputSearch = "(//input[@placeholder='search'])[2]";
    protected inputMinPrice = "//input[@placeholder='min']";
    protected inputMaxPrice = "//input[@placeholder='max']"

    //categories
    protected chckboxFashion = "//label[normalize-space()='fashion']/preceding-sibling::input[@type='checkbox']";
    protected chckboxElectronics = "//label[normalize-space()='electronics']/preceding-sibling::input[@type='checkbox']";
    protected chckboxHousehold = "//label[normalize-space()='household']/preceding-sibling::input[@type='checkbox']";
    
    //sub-categories
    protected chckboxTShirts = "//label[normalize-space()='t-shirts']/preceding-sibling::input[@type='checkbox']";
    protected chckboxShirts = "//label[normalize-space()='shirts']/preceding-sibling::input[@type='checkbox']";
    protected chckboxShoes = "//label[normalize-space()='shoes']/preceding-sibling::input[@type='checkbox']";
    protected chckboxMobiles = "//label[normalize-space()='mobiles']/preceding-sibling::input[@type='checkbox']";
    protected chckboxLaptops = "//label[normalize-space()='laptops']/preceding-sibling::input[@type='checkbox']";
    
    //search-for
    protected chckboxForMen = "//label[normalize-space()='men']/preceding-sibling::input[@type='checkbox']";
    protected chckboxForWomen = "//label[normalize-space()='women']/preceding-sibling::input[@type='checkbox']";


}