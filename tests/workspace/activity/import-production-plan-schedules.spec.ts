import { getIndexOfRecordInMap } from "../../../../../src/core/common-actions";
import { expect, test } from "../../../../../src/core/fixtures";
import { createCSVwithProductionScheduleList, createMultipleProductionScheduleList } from "../../../../../test-data/data-creation-utils";
import { Production, ProductionActivity, ProductionScheduleImportRecord } from "../../../../../test-data/types";

    

test.describe.serial("Import Schedules", { tag: ["@planningApp", "@sanity", "@workspace", "@plan",  "@activity"] }, () => {


    // @feature activity
    test("TC:1 - Should be able to import schedules in Workspace using a CSV file", { tag: ["@planningApp", "@sanity", "@workspace", "@plan",  "@activity"] }, 
        async ({ planningApp }) => {
       
        for (let j = 0; j < countOfSchedules; j++) {
            const activity: ProductionActivity = {
                name: productionScheduleList[j].name
            } as ProductionActivity;
            activities.push(activity);
            
            const record = await getIndexOfRecordInMap(productionScheduleList[j], gridData);
            const requiredRecord = gridData[record];
            
            if (record > -1) {
                expect.soft(requiredRecord.get("Name"), "Expected schedule name is => " + productionScheduleList[j].name).toEqual(productionScheduleList[j].name);
                expect.soft(requiredRecord.get("Type"), "Expected schedule type is => " + productionScheduleList[j].type).toEqual(productionScheduleList[j].type);
                // expect.soft(requiredRecord.get("Start Date"), "Expected schedule start date is => " + productionScheduleList[j].startDate).toEqual(productionScheduleList[j].startDate);
                // expect.soft(requiredRecord.get("End Date"), "Expected schedule end date is => " + productionScheduleList[j].endDate).toEqual(productionScheduleList[j].endDate);
                expect.soft(requiredRecord.get("Location").toLowerCase()).toContain(productionScheduleList[j].location.toLowerCase());
                expect.soft(requiredRecord.get("Owner"), "Expected schedule owner is => " + productionScheduleList[j].owner).toEqual(productionScheduleList[j].owner);
                expect.soft(requiredRecord.get("Status"), "Expected schedule status is => " + productionScheduleList[j].status).toEqual(productionScheduleList[j].status);
            } else {
                expect.soft(record, 'Schedule ' + productionScheduleList[j].name + ' not found in grid data').toBeGreaterThanOrEqual(0);
                }
            }
    });
});