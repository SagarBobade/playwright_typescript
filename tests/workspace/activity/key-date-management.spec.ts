import { expect, test } from "../../../../../src/core/fixtures";
import { Production, ProductionActivity, ProductionResource } from "../../../../../test-data/types";
import { getIndexOfRecordInMap } from "../../../../../src/core/common-actions";
import { createNewActivity, createNewProductionResource } from "../../../../../test-data/data-creation-utils";


test.describe.serial("ProductionPlanning", { tag: ["@planningApp", "@sanity", "@workspace", "@activity"] }, () => {
   

    // @feature activity
    test("TC-1: Able to add a new activity from key date for the production plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@activity"] },
        async ({ planningApp }) => {
            
            const isVisible = await planningApp.productionPlanningHeader.isKeyDateVisibleOnProductionPlan(activity);

            expect.soft(isVisible, "Newly added Schedule/Activity added as a Key Date => " + activity.name).toBeTruthy();
        });

    // @feature activity
    test("TC-2: Able to verify that a newly added activity linked to a key date is displayed correctly in the activity list of the Production Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@activity"] },
        async ({ planningApp }) => {
           
            if (record > -1) {
                expect.soft(requiredRecord.get("Name"), "Expected Activtiy name is => " + activity.name).toEqual(activity.name);
                expect.soft(requiredRecord.get("Type"), "Expected Activtiy type is => " + activity.type).toEqual(activity.type);
                // if (requiredRecord.get("Start") && requiredRecord.get("End") != null) {
                //     expect.soft(requiredRecord.get("Start").trim(), "Expected Activtiy Start time is => " + "09:00 AM").toContain("09:00 AM");
                //     expect.soft(requiredRecord.get("End").trim(), "Expected Activtiy End time is => " + "0" + ((9 + activity.duration) % 12) + ":00 PM").toContain(((9 + activity.duration) % 12).toString());
                // }
            } else {
                expect.soft(1, "Production Activity display in list is Failed").toEqual(2);
            }
        });


        // @feature activity
        test("TC-3: Able to add an existing activity as a key date for the production plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@activity"] },
            async ({ planningApp }) => {
              
                const isVisible = await planningApp.productionPlanningHeader.isKeyDateVisibleOnProductionPlan(activity2);

                expect.soft(isVisible, "Newly added Schedule/Activity added as a Key Date => " + activity2.name).toBeTruthy();
        });

        // @feature activity
        test("TC-4: Able to remove a key date of the Production plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@activity"] },
            async ({ planningApp }) => {
               
                const isVisible = await planningApp.productionPlanningHeader.isKeyDateVisibleOnProductionPlan(activity2);

                expect.soft(isVisible, "Schedue is removed from Key Date => " + activity2.name).toBeFalsy();
        });

    // @feature activity
    test("TC-5: Able to see the removed key date in the schedule list screen.", { tag: ["@planningApp", "@sanity", "@workspace", "@regression", "@activity"] },
        async ({ planningApp }) => {
           
            if (record > -1) {
                expect.soft(requiredRecord.get("Name"), "Expected Activtiy name is => " + activity2.name).toEqual(activity2.name);
                expect.soft(requiredRecord.get("Type"), "Expected Activtiy type is => " + activity2.type).toEqual(activity2.type);
            } else {
                expect.soft(1, "Production Activity display in list is Failed").toEqual(2);
            }
        });

    
    });