import { expect, test } from "../../../../../src/core/fixtures";
import { Production, ProductionResource } from "../../../../../test-data/types";
import { getIndexOfRecordInMap } from "../../../../../src/core/common-actions";
import { createNewProductionResource, getResourceTypeExcept } from "../../../../../test-data/data-creation-utils";


test.describe.serial("ProductionPlanning", { tag: ["@planningApp", "@sanity", "@workspace", "@resource"] }, () => {
   


    // @feature resource
    test("TC-1: Able to create a Resource for an existing production plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@resource"] },
        async ({ planningApp }) => {
         const requiredRecord = gridData[record];
            if (record > -1) {
                expect.soft(requiredRecord.get("Label"), "Expected Resource name is => " + productionResource.label).toEqual(productionResource.label);
                expect.soft(requiredRecord.get("Type"), "Expected Resource type is => " + productionResource.type).toEqual(productionResource.type);
                expect.soft(requiredRecord.get("Status"), "Expected Resource status is => " + productionResource.status).toEqual(productionResource.status);
                if (requiredRecord.get("Category") != "") {
                    expect.soft(requiredRecord.get("Category"), "Expected Resource category is => " + productionResource.category).toEqual(productionResource.category);
                }
                else {
                    expect.soft(requiredRecord.get("Role"), "Expected Resource role is => " + productionResource.role).toEqual(productionResource.role);
                }
            } else {
                expect.soft(1, "Resource creation Failed").toEqual(2);
            }
        })

    // @feature resource
    test("TC-2: Able to edit the recently added Production Resource.", { tag: ["@planningApp", "@sanity", "@workspace", "@resource"] },
        async ({ planningApp }) => {
               const requiredRecord = gridData[record];
            if (record > -1) {
                expect.soft(requiredRecord.get("Label"), "Expected Resource name is => " + editProductionResource.label).toEqual(editProductionResource.label);
                //expect.soft(requiredRecord.get("Type"), "Expected Resource type is => " + editProductionResource.type).toEqual(editProductionResource.type);
                expect.soft(requiredRecord.get("Status"), "Expected Resource status is => " + editProductionResource.status).toEqual(editProductionResource.status);
                if (requiredRecord.get("Category") != "") {
                    expect.soft(requiredRecord.get("Category"), "Expected Resource category is => " + editProductionResource.category).toEqual(editProductionResource.category);
                }
                else {
                    expect.soft(requiredRecord.get("Role"), "Expected Resource role is => " + editProductionResource.role).toEqual(editProductionResource.role);
                }
            } else {
                expect.soft(1, "Resource updation Failed").toEqual(2);
            }
        })
        // @feature resource
        test.skip("TC-3: Able to filter Resources using icons.", { tag: ["@planningApp", "@sanity", "@workspace", "@resource"] },
            async ({ planningApp }) => {
                await planningApp.navigation.navigateToWorkspace();
                  gridData.forEach(record => {
                    expect.soft(record.get("Type"), `Expected type for resource ${record.get("Name")}`).toEqual(productionResource.type);
                });
            })

    // @feature resource
    test("TC-4: Able to delete recently edited Production Resource", { tag: ["@planningApp", "@sanity", "@workspace", "@resource"] },
        async ({ planningApp }) => {
       
            if (record < 1) {
                expect(record, "Resource of a Production plan should be deleted").toBeLessThan(1);
            } else {
                expect.soft(1, "Resource deletion Failed").toEqual(2);
            }
        })

    // @feature resource
    test.skip("TC-5: Able to create a Resource using a template for an existing production plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@resource"] },
        async ({ planningApp }) => {
              const requiredRecord = gridData[record];
            if (record > -1) {
                expect.soft(requiredRecord.get("Name"), "Expected Resource name is => " + productionResource2.name).toEqual(productionResource2.name);
                expect.soft(requiredRecord.get("Type"), "Expected Resource type is => " + "Facility").toEqual("Facility");
                expect.soft(requiredRecord.get("Status"), "Expected Resource status is => " + "Open").toEqual("Open");
                // TODO - Add below post resolve https://showrunnr.atlassian.net/browse/SHOW-3822
                if (requiredRecord.get("Category") != "") {
                    expect.soft(requiredRecord.get("Category"), "Expected Resource category is => " + productionResource2.category).toEqual(productionResource2.category);
                }
                else {
                    expect.soft(requiredRecord.get("Role"), "Expected Resource role is => " + productionResource2.role).toEqual(productionResource2.role);
                }
                expect.soft(requiredRecord.get("Location"), "Expected Resource location is => " + "Pune Maharashtra, India").toEqual("Pune Maharashtra, India");
            } else {
                expect.soft(1, "Resource creation Failed").toEqual(2);
            }
        })
});