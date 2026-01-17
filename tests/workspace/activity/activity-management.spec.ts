import { expect, test } from "../../../../../src/core/fixtures";
import { Contact, Production, ProductionActivity, ProductionResource } from "../../../../../test-data/types";
import { getIndexOfRecordInMap } from "../../../../../src/core/common-actions";
import { createNewActivity, createNewProductionResource } from "../../../../../test-data/data-creation-utils";


test.describe.serial("ProductionPlanning", { tag: ["@planningApp", "@sanity", "@workspace", "@activity"] }, () => {
    let activity: ProductionActivity;
    let editActivity: ProductionActivity;
    let productionPlan: Production;
    let contact: Contact;
    let productionResource: ProductionResource;
    let editProductionResource: ProductionResource;

    test.beforeAll(async () => {
        productionResource = await createNewProductionResource();
        activity = await createNewActivity();
        activity.owner = "Aaliyah Ritchie";
        editProductionResource = await createNewProductionResource();
        editActivity = await createNewActivity();
        productionPlan = {} as Production;
        productionPlan.title = "AvengersSecretWars";
    });

    // @feature activity
    test("TC-1: Able to create a new Activity for the Production plan", { tag: ["@planningApp", "@sanity", "@workspace", "@activity"] },
        async ({ planningApp }) => {
          

            if (record > -1) {
                expect.soft(requiredRecord.get("Name"), "Expected Activity name is => " + activity.name).toEqual(activity.name);
                expect.soft(requiredRecord.get("Type"), "Expected Activity type is => " + activity.type).toEqual(activity.type);
                //expect.soft(requiredRecord.get("Owner"), "Expected Activity owner is => " + activity.owner).toEqual(activity.owner);
                expect.soft(requiredRecord.get("Status"), "Expected Activity status is => " + activity.trackStatus).toEqual(activity.trackStatus);
                expect.soft(requiredRecord.get("Category"), "Expected Activity category is => " + activity.category).toEqual(activity.category);
                expect.soft(requiredRecord.get("Summary"), "Expected Activity Summary is => " + activity.summary).toEqual(activity.summary);
                if (requiredRecord.get("Start") && requiredRecord.get("End") != null) {
                    expect.soft(requiredRecord.get("Start").trim(), "Expected Activity Start time is => " + "09:00 AM").toEqual("09:00 AM");
                    expect.soft(requiredRecord.get("End").trim(), "Expected Activity End time is => " + "12:00 AM").toEqual("12:00 AM");
                }

            } else {
                expect.soft(1, "Production Activity creation Failed").toEqual(2);
            }
        });

        // @feature activity
        test("TC-2: Able to edit the newly created Activity of the Production plan", { tag: ["@planningApp", "@sanity", "@workspace", "@activity"] },
        async ({ planningApp }) => {
            
            const gridData = await planningApp.productionResourceSchedule.getTableData();
            gridData.forEach(row => row?.delete(row.keys().next().value));
            const record = await getIndexOfRecordInMap(editActivity, gridData);
            const requiredRecord = gridData[record];

            if (record > -1) {
                expect.soft(requiredRecord.get("Name"), "Expected Activity name is => " + editActivity.name).toEqual(editActivity.name);
                expect.soft(requiredRecord.get("Type"), "Expected Activity type is => " + editActivity.type).toEqual(editActivity.type);
                //expect.soft(requiredRecord.get("Owner"), "Expected Activity owner is => " + editActivity.owner).toEqual(editActivity.owner);
                expect.soft(requiredRecord.get("Status"), "Expected Activity status is => " + editActivity.trackStatus).toEqual(editActivity.trackStatus);
                expect.soft(requiredRecord.get("Category"), "Expected Activity category is => " + editActivity.category).toEqual(editActivity.category);
                expect.soft(requiredRecord.get("Summary"), "Expected Activity Summary is => " + editActivity.summary).toEqual(editActivity.summary);
                if (requiredRecord.get("Start") && requiredRecord.get("End") != null) {
                    expect.soft(requiredRecord.get("Start").trim(), "Expected Activity Start time is => " + "09:00 AM").toEqual("09:00 AM"); // TODO : make this execution conditional
                    expect.soft(requiredRecord.get("End").trim(), "Expected Activity End time is => " + "12:00 AM").toEqual("12:00 AM");
                }
            } else {
                expect.soft(1, "Production Activity updation Failed").toEqual(2);
            }
        });

    // @feature activity
    test("TC-3: Able to delete newly created Activity of a Production plan", { tag: ["@planningApp", "@sanity", "@workspace", "@activity"] },
        async ({ planningApp }) => {
            
            const gridData = await planningApp.productionResourceSchedule.getTableData();
            gridData.forEach(row => row?.delete(row.keys().next().value));
            const record = await getIndexOfRecordInMap(editActivity, gridData);

            if (record < 1) {
                expect(record, "Activity of a Production plan should be deleted").toBeLessThan(1);
            } else {
                expect.soft(1, "Activity deletion Failed").toEqual(2);
            }
        });
    });