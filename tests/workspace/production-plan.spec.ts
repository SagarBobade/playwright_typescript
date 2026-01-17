import { expect, test } from "../../../../src/core/fixtures";
import { createProduction, getGenreExcept } from "../../../../test-data/data-creation-utils";
import { Contact, Production } from "../../../../test-data/types";


test.describe.serial("ProductionPlanning", { tag: ["@planningApp", "@sanity", "@workspace", "@plan"] }, () => {
  

    // @feature production-plan
    // @jira SHOP-2456
    // @description Dummy description for reference
    test("TC-1: Able to create a new Production Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@plan"] },
        async ({ planningApp }) => {
           await planningApp.productionPlanningListPage.searchEntityAsItIs(productionPlan.title);
            isProductionPlanPresent = await planningApp.productionPlanningListPage.isProductionPlanPresent(productionPlan.title);
            expect(isProductionPlanPresent, "Production plan should be created").toBeTruthy();
        });

    // @feature production-plan
    test("TC-2: Able to edit the newly created Production Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@plan"] },
        async ({ planningApp }) => {
             isProductionPlanPresent = await planningApp.productionPlanningListPage.isProductionPlanPresent(editProductionPlan.title);
            expect(isProductionPlanPresent, "Production plan should be edited").toBeTruthy();
        });

    // @feature production-plan
    test("TC-3: Able to filter plans using 'Project Status'.", { tag: ["@planningApp", "@sanity", "@workspace", "@plan"] },
        async ({ planningApp }) => {
           isProductionPlanPresent = await planningApp.productionPlanningListPage.isProductionPlanPresent(editProductionPlan.title);
            expect(isProductionPlanPresent, "Production plan should be edited").toBeTruthy();
        });

    // @feature production-plan
    test("TC-4: Able to delete recently edited Production Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@plan"] },
        async ({ planningApp }) => {
           isProductionPlanPresent = await planningApp.productionPlanningListPage.isProductionPlanPresent(editProductionPlan.title);
            expect(isProductionPlanPresent, "Production plan should be deleted").toBeFalsy();
        });
});